// Life RPG — behavior logger for Bangle.js 2 (Espruino)
// Phase 1: tap-only capture. The watch stays "dumb" — it records a key and a
// timestamp only. Category -> trait -> XP is resolved later from action_types
// in Supabase, so there is one source of truth.
//
// Log file: rpglog.jsonl  (one JSON object per line, append-only)
//   {"t":1699999999999,"k":"boundary"}
//
// Screens:
//   list    -> 5 category rows. Tap a row to open it.
//   detail  -> back arrow, category name, today's count, minus/plus.
//                plus  = log one {t,k}
//                minus = TRUE UNDO of the last entry for this category TODAY
//                        (removes the line from the file, not just the display)
//   summary -> physical BTN toggles a "today totals" screen from the list.
var storage = require("Storage");
var LOG = "rpglog.jsonl";
var W = g.getWidth(), H = g.getHeight();   // 176 x 176
var view = "list";                          // list | detail | summary
var current = -1;                           // index into CATS while in detail

// ---- placeholder vector icons ---------------------------------------------
// NOTE: these must be defined BEFORE the CATS array below. Espruino runs
// top-level code sequentially as it's sent to the device — it does not
// hoist function declarations the way a browser JS engine does. If CATS
// is built before these functions exist, you get
// "ReferenceError: iconBoundary is not defined", which aborts the CATS
// assignment entirely and cascades into "Can't read property 'length' of
// undefined" wherever CATS.length is used later (e.g. drawList/drawSummary).
function iconBoundary(cx, cy, s) {            // shield
  var h = s / 2;
  g.fillRect(cx - h * 0.6, cy - h, cx + h * 0.6, cy);
  g.fillPoly([cx - h * 0.6, cy, cx + h * 0.6, cy, cx, cy + h]);
}
function iconCuriosity(cx, cy, s) {           // magnifying glass
  var r = s * 0.32;
  g.drawCircle(cx - 2, cy - 2, r);
  g.drawLine(cx + r - 4, cy + r - 4, cx + s / 2 - 1, cy + s / 2 - 1);
}
function iconEnergy(cx, cy, s) {              // lightning bolt
  var h = s / 2;
  g.drawLine(cx + h * 0.3, cy - h, cx - h * 0.4, cy + 2);
  g.drawLine(cx - h * 0.4, cy + 2, cx + 2, cy + 2);
  g.drawLine(cx + 2, cy + 2, cx - h * 0.3, cy + h);
}
function iconCare(cx, cy, s) {                // heart
  var r = s * 0.22;
  g.fillCircle(cx - r, cy - r / 2, r);
  g.fillCircle(cx + r, cy - r / 2, r);
  g.fillPoly([cx - 2 * r - 2, cy - r / 3, cx + 2 * r + 2, cy - r / 3, cx, cy + s / 2]);
}
function iconAnchor(cx, cy, s) {              // anchor
  var h = s / 2;
  g.drawCircle(cx, cy - h + 3, 3);                                 // ring
  g.drawLine(cx, cy - h + 6, cx, cy + h);                          // shank
  g.drawLine(cx - h * 0.5, cy - h * 0.3, cx + h * 0.5, cy - h * 0.3); // crossbar
  g.drawLine(cx - h * 0.7, cy + h * 0.2, cx - h * 0.15, cy + h);   // left fluke
  g.drawLine(cx + h * 0.7, cy + h * 0.2, cx + h * 0.15, cy + h);   // right fluke
}
function drawBackArrow(cx, cy, s) {           // left chevron
  g.drawLine(cx + s / 2, cy - s / 2, cx - s / 2, cy);
  g.drawLine(cx - s / 2, cy, cx + s / 2, cy + s / 2);
  g.drawLine(cx - s / 2, cy, cx + s / 2, cy);
}

// ---- categories -------------------------------------------------------
// Colours are quantised to the Bangle.js 2 3-bit palette (8 colours).
// icon is a draw fn (cx, cy, size). Placeholder vector icons for now —
// swap for pixel-art bitmaps later via g.drawImage().
var CATS = [
  { key: "boundary",  label: "Boundary",  trait: "Assertive",  bg: "#f00", fg: "#fff", icon: iconBoundary  },
  { key: "curiosity", label: "Curiosity", trait: "Openness",   bg: "#0ff", fg: "#000", icon: iconCuriosity },
  { key: "energy",    label: "Energy",    trait: "Steadiness", bg: "#ff0", fg: "#000", icon: iconEnergy     },
  { key: "care",      label: "Care",      trait: "Warmth",     bg: "#f0f", fg: "#fff", icon: iconCare       },
  { key: "anchor",    label: "Anchor",    trait: "Regulation", bg: "#00f", fg: "#fff", icon: iconAnchor     }
];

// ---- data layer -------------------------------------------------------
function todayStart() {
  var d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}
function readEntries() {
  var arr = [];
  var f = storage.open(LOG, "r");
  var line = f.readLine();
  while (line !== undefined) {
    line = line.trim();
    if (line.length) { try { arr.push(JSON.parse(line)); } catch (e) {} }
    line = f.readLine();
  }
  return arr;
}
function countToday(key) {
  var t0 = todayStart();
  return readEntries().filter(function (e) { return e.k === key && e.t >= t0; }).length;
}
function logKey(key) {
  var f = storage.open(LOG, "a");
  f.write(JSON.stringify({ t: Date.now(), k: key }) + "\n");
}
// True undo: drop the most recent entry for this key logged today, then
// rewrite the file. Never touches earlier days.
function undoLast(key) {
  var t0 = todayStart();
  var entries = readEntries();
  var idx = -1;
  for (var i = entries.length - 1; i >= 0; i--) {
    if (entries[i].k === key && entries[i].t >= t0) { idx = i; break; }
  }
  if (idx === -1) return false;
  entries.splice(idx, 1);
  storage.open(LOG, "r").erase();
  var f = storage.open(LOG, "w");
  entries.forEach(function (e) { f.write(JSON.stringify(e) + "\n"); });
  return true;
}

// ---- screens ------------------------------------------------------------
function drawList() {
  view = "list";
  var rowH = H / CATS.length;
  g.clear();
  CATS.forEach(function (c, i) {
    var y = i * rowH;
    g.setColor(c.bg).fillRect(0, y, W - 1, y + rowH - 1);
    g.setColor(c.fg);
    c.icon(20, y + rowH / 2, rowH - 12);
    g.setColor(c.fg).setFontAlign(-1, 0).setFont("6x8", 2);
    g.drawString(c.label, 44, y + rowH / 2);
  });
}
function drawDetail(i) {
  view = "detail";
  current = i;
  var c = CATS[i];
  g.clear();
  // top band + back arrow + name
  g.setColor(c.bg).fillRect(0, 0, W - 1, 40);
  g.setColor(c.fg);
  drawBackArrow(20, 20, 14);
  g.setColor(c.fg).setFontAlign(0, 0).setFont("6x8", 2);
  g.drawString(c.label, W / 2 + 12, 20);
  // today's count
  var n = countToday(c.key);
  g.setColor("#fff").setFontAlign(0, 0).setFont("6x8", 4);
  g.drawString("" + n, W / 2, 92);
  g.setFont("6x8", 1).drawString("today", W / 2, 120);
  // minus (left) / plus (right)
  g.setColor(c.bg).fillCircle(30, 92, 24);
  g.setColor(c.fg).setFont("6x8", 3).drawString("-", 30, 90);
  g.setColor(c.bg).fillCircle(146, 92, 24);
  g.setColor(c.fg).setFont("6x8", 3).drawString("+", 146, 90);
}
function drawSummary() {
  view = "summary";
  var t0 = todayStart();
  var entries = readEntries();
  g.clear();
  g.setColor("#fff").setFontAlign(0, 0).setFont("6x8", 2).drawString("TODAY", W / 2, 16);
  var rowH = (H - 30) / CATS.length;
  CATS.forEach(function (c, i) {
    var n = entries.filter(function (e) { return e.k === c.key && e.t >= t0; }).length;
    var y = 30 + i * rowH + rowH / 2;
    g.setColor(c.bg).fillCircle(20, y, 8);
    g.setColor("#fff").setFontAlign(-1, 0).setFont("6x8", 2).drawString(c.label, 38, y);
    g.setFontAlign(1, 0).drawString("" + n, W - 10, y);
  });
}

// ---- input ----------------------------------------------------------------
function dist(ax, ay, bx, by) { var dx = ax - bx, dy = ay - by; return Math.sqrt(dx * dx + dy * dy); }
Bangle.on("touch", function (_, xy) {
  if (!xy) return;
  if (view === "summary") { drawList(); return; }
  if (view === "list") {
    var rowH = H / CATS.length;
    var i = Math.floor(xy.y / rowH);
    if (i >= 0 && i < CATS.length) drawDetail(i);
    return;
  }
  // detail
  var c = CATS[current];
  if (xy.y < 40 && xy.x < 50) { drawList(); return; }              // back arrow
  if (dist(xy.x, xy.y, 30, 92) <= 30) {                            // minus
    if (undoLast(c.key)) Bangle.buzz(40);
    drawDetail(current);
    return;
  }
  if (dist(xy.x, xy.y, 146, 92) <= 30) {                           // plus
    logKey(c.key);
    Bangle.buzz(60);
    drawDetail(current);
    return;
  }
});
// Physical button: from list -> today totals; from detail/summary -> back to list.
setWatch(function () {
  if (view === "list") drawSummary(); else drawList();
}, BTN, { edge: "rising", debounce: 50, repeat: true });

drawList();
