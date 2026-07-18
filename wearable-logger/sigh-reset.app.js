// Life RPG — physiological sigh reset, for Bangle.js 2 (Espruino)
// Separate app from rpg-logger.app.js on purpose: no shared state, no risk
// of touching the logging code. Discrete redraws only (once per phase
// change, not animated) to keep this cheap on battery. Phase transitions
// are scheduled with setTimeout against wall-clock deadlines rather than
// polled with setInterval, so there's no drift over a 3-minute session.

var W = g.getWidth(), H = g.getHeight();   // 176 x 176
var CX = W / 2, CY = H / 2;

// { key, label, ms, scale, bg, buzz }
// buzz: length in ms of a haptic pulse at the START of this phase, or 0
// for none. Only the two physiologically meaningful transitions buzz —
// top of the first inhale, and the start of the exhale — not all six.
var PHASES = [
  { key: "in1",    label: "in",   ms: 3000, scale: 32, bg: "#0f6e56", buzz: 40  },
  { key: "hold1",  label: "hold", ms: 1000, scale: 32, bg: "#5dcaa5", buzz: 0   },
  { key: "in2",    label: "in",   ms: 500,  scale: 40, bg: "#0f6e56", buzz: 0   },
  { key: "hold2",  label: "hold", ms: 1000, scale: 40, bg: "#5dcaa5", buzz: 0   },
  { key: "exhale", label: "out",  ms: 5000, scale: 18, bg: "#185fa5", buzz: 120 },
  { key: "rest",   label: "rest", ms: 3000, scale: 18, bg: "#2c2c2a", buzz: 0   }
];

var SESSION_MS = 3 * 60 * 1000;
var BUFFER_MS = 3000;

var STATE_START = "start", STATE_BUFFER = "buffer", STATE_BREATHING = "breathing",
    STATE_PAUSED = "paused", STATE_DONE = "done";
var state = STATE_START;

var phaseIdx = 0;
var phaseTimer = null;
var phaseDeadline = 0;      // Date.now() timestamp when current phase ends
var phaseRemaining = 0;     // ms left in current phase, valid only while paused
var sessionStart = 0;
var pausedAt = 0;
var totalPausedMs = 0;

var prevLockTimeout;        // restore on exit

function sessionElapsed() {
  if (state === STATE_PAUSED) return pausedAt - sessionStart - totalPausedMs;
  return Date.now() - sessionStart - totalPausedMs;
}

// ---------- drawing (each called once per state/phase change, not looped) ----------

function drawStart() {
  g.reset().setColor(0.04, 0.1, 0.12).fillRect(0, 0, W, H);
  g.setColor("#6fa8b8").setFontAlign(0, 0).setFont("6x8", 1);
  g.drawString("physiological sigh", CX, CY - 44);
  g.setColor("#1d9e75").fillCircle(CX, CY, 34);
  g.setColor("#04342c").fillPoly([CX - 10, CY - 16, CX - 10, CY + 16, CX + 16, CY]);
}

function drawBuffer(secsLeft) {
  g.reset().setColor(0.04, 0.1, 0.12).fillRect(0, 0, W, H);
  g.setColor("#9fd8e8").setFontAlign(0, 0);
  g.setFont("6x8", 7).drawString("" + secsLeft, CX, CY - 10);
  g.setFont("6x8", 2).setColor("#6fa8b8").drawString("get ready", CX, CY + 42);
}

function drawPauseIcon(paused) {
  var x0 = W - 34, y0 = 8;
  g.setColor(0.1, 0.1, 0.1).fillCircle(x0 + 13, y0 + 13, 15);
  g.setColor("#9fd8e8");
  if (paused) {
    g.fillPoly([x0 + 8, y0 + 6, x0 + 8, y0 + 20, x0 + 20, y0 + 13]);
  } else {
    g.fillRect(x0 + 8, y0 + 6, x0 + 12, y0 + 20);
    g.fillRect(x0 + 16, y0 + 6, x0 + 20, y0 + 20);
  }
}

function drawBreath(paused) {
  var p = PHASES[phaseIdx];
  g.reset().setColor(p.bg).fillRect(0, 0, W, H);
  var textColor = (p.key === "hold1" || p.key === "hold2") ? "#04342c" : "#fff";

  g.setColor(textColor).setFontAlign(0, 0);
  g.setFont("6x8", 3).drawString(p.label, CX, CY - 14);

  var remain = Math.ceil((paused ? phaseRemaining : (phaseDeadline - Date.now())) / 1000);
  g.setFont("6x8", 2).drawString("" + Math.max(remain, 0) + "s", CX, CY + 28);

  g.setFontAlign(-1, -1).setFont("6x8", 2).setColor("#fff");
  g.drawString(fmtClock(SESSION_MS - sessionElapsed()), 8, 8);

  drawPauseIcon(paused);
}

function drawDone() {
  g.reset().setColor(0.04, 0.1, 0.12).fillRect(0, 0, W, H);
  g.setColor("#5dcaa5").setFontAlign(0, 0);
  g.setFont("6x8", 3).drawString("done", CX, CY - 6);
  g.setFont("6x8", 1).setColor("#6fa8b8").drawString("tap to reset", CX, CY + 30);
}

function fmtClock(ms) {
  var s = Math.max(0, Math.ceil(ms / 1000));
  var m = Math.floor(s / 60);
  s = s % 60;
  return m + ":" + (s < 10 ? "0" : "") + s;
}

// ---------- phase / session control ----------

function armPhase(ms) {
  phaseDeadline = Date.now() + ms;
  phaseTimer = setTimeout(onPhaseEnd, ms);
}

function startBreathing() {
  state = STATE_BREATHING;
  sessionStart = Date.now();
  totalPausedMs = 0;
  phaseIdx = 0;
  runPhase();
}

var secTimer = null;
function startSecTicker() {
  clearInterval(secTimer);
  secTimer = setInterval(function () { drawBreath(false); }, 1000);
}
function stopSecTicker() {
  clearInterval(secTimer);
  secTimer = null;
}

function runPhase() {
  var p = PHASES[phaseIdx];
  phaseDeadline = Date.now() + p.ms;
  if (p.buzz) Bangle.buzz(p.buzz);
  drawBreath(false);
  startSecTicker();
  phaseTimer = setTimeout(onPhaseEnd, p.ms);
}

function onPhaseEnd() {
  var justFinished = PHASES[phaseIdx];
  var elapsed = sessionElapsed();

  // Only "exhale" and "rest" are checked as session-end points, and we
  // always let exhale finish even if the buffer runs out mid-hold — the
  // exhale is the physiologically meaningful part of the cycle.
  if (elapsed >= SESSION_MS && justFinished.key === "exhale") {
    finishSession();
    return;
  }
  phaseIdx = (phaseIdx + 1) % PHASES.length;
  runPhase();
}

function finishSession() {
  state = STATE_DONE;
  stopSecTicker();
  Bangle.buzz(60);
  setTimeout(function () { Bangle.buzz(60); }, 150);
  drawDone();
  restoreLock();
}

function togglePause() {
  if (state === STATE_BREATHING) {
    state = STATE_PAUSED;
    pausedAt = Date.now();
    phaseRemaining = phaseDeadline - pausedAt;
    clearTimeout(phaseTimer);
    stopSecTicker();
    drawBreath(true);
  } else if (state === STATE_PAUSED) {
    totalPausedMs += Date.now() - pausedAt;
    state = STATE_BREATHING;
    armPhase(phaseRemaining);
    startSecTicker();
    drawBreath(false);
  }
}

function resetToStart() {
  clearTimeout(phaseTimer);
  stopSecTicker();
  state = STATE_START;
  restoreLock();
  drawStart();
}

function lockScreenOn() {
  prevLockTimeout = Bangle.getOptions ? Bangle.getOptions().lockTimeout : undefined;
  Bangle.setOptions({ lockTimeout: 0 });
  Bangle.setLCDPower(1);
}

function restoreLock() {
  if (prevLockTimeout !== undefined) Bangle.setOptions({ lockTimeout: prevLockTimeout });
}

// ---------- input ----------
// Physical button (BTN) is intentionally ignored during breathing/paused
// so an accidental press can't kick you out mid-session. It only resets
// from the start or done screens, same convention as rpg-logger.app.js.

Bangle.on("touch", function (_, xy) {
  if (!xy) return;
  if (state === STATE_START) {
    lockScreenOn();
    state = STATE_BUFFER;
    var secs = Math.ceil(BUFFER_MS / 1000);
    drawBuffer(secs);
    var bufTimer = setInterval(function () {
      secs--;
      if (secs <= 0) {
        clearInterval(bufTimer);
        startBreathing();
      } else {
        drawBuffer(secs);
      }
    }, 1000);
    return;
  }
  if (state === STATE_DONE) { resetToStart(); return; }
  if (state === STATE_BREATHING || state === STATE_PAUSED) {
    // pause hit-zone: top-right corner circle
    if (xy.x > W - 48 && xy.y < 48) togglePause();
  }
});

setWatch(function () {
  if (state === STATE_START || state === STATE_DONE) resetToStart();
}, BTN, { edge: "rising", debounce: 50, repeat: true });

drawStart();
