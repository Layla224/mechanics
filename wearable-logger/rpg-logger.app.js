// Life RPG — behavior logger for Bangle.js 2 (Espruino)
// Phase 1: tap-only capture. The watch stays "dumb" — it records a key and a
// timestamp only. Category, trait, and XP are resolved later from action_types
// in Supabase, so there is one source of truth.
//
// Log file: rpglog.jsonl  (one JSON object per line, append-only)
//   {"t":1699999999999,"k":"boundary"}

var storage = require("Storage");
var LOG = "rpglog.jsonl";

// One tile per trait/category pair, matching the schema model.
// Colours are quantised to the Bangle.js 2 3-bit palette (8 colours).
var TILES = [
  { key: "boundary",  cat: "Boundary",  trait: "Assertive",  fg: "#fff", bg: "#c00" },
  { key: "curiosity", cat: "Curiosity", trait: "Openness",   fg: "#000", bg: "#0cc" },
  { key: "energy",    cat: "Energy",    trait: "Steadiness", fg: "#000", bg: "#fc0" },
  { key: "care",      cat: "Care",      trait: "Warmth",     fg: "#fff", bg: "#c0c" }
];

var W = g.getWidth(), H = g.getHeight();   // 176 x 176
var HW = W / 2, HH = H / 2;
var session = 0;                            // taps logged since app start
var mode = "grid";                          // grid | flash | stats

function tileRect(i) {
  return { x: (i % 2) * HW, y: ((i / 2) | 0) * HH, w: HW, h: HH };
}

function drawGrid() {
  mode = "grid";
  g.reset().setColor(0, 0, 0).fillRect(0, 0, W, H);
  TILES.forEach(function (t, i) {
    var r = tileRect(i), pad = 3;
    g.setColor(t.bg).fillRect(r.x + pad, r.y + pad, r.x + r.w - pad, r.y + r.h - pad);
    g.setColor(t.fg).setFontAlign(0, 0);
    g.setFont("6x8", 2).drawString(t.cat, r.x + r.w / 2, r.y + r.h / 2 - 10);
    g.setFont("6x8", 1).drawString(t.trait, r.x + r.w / 2, r.y + r.h / 2 + 12);
  });
}

function logKey(key) {
  var f = storage.open(LOG, "a");
  f.write(JSON.stringify({ t: Date.now(), k: key }) + "\n");
  session++;
  Bangle.buzz(80);
  flash(key);
}

function flash(key) {
  mode = "flash";
  var t = TILES.filter(function (x) { return x.key == key; })[0];
  g.reset().setColor(t.bg).fillRect(0, 0, W, H);
  g.setColor(t.fg).setFontAlign(0, 0);
  g.setFont("6x8", 2).drawString("LOGGED", W / 2, H / 2 - 24);
  g.setFont("6x8", 2).drawString(t.cat, W / 2, H / 2);
  g.setFont("6x8", 1).drawString("session: " + session, W / 2, H / 2 + 28);
  setTimeout(drawGrid, 650);
}

function showStats() {
  mode = "stats";
  var count = 0;
  var f = storage.open(LOG, "r");
  var line = f.readLine();
  while (line !== undefined) { count++; line = f.readLine(); }
  g.reset().setColor(0, 0, 0).fillRect(0, 0, W, H);
  g.setColor("#fff").setFontAlign(0, 0);
  g.setFont("6x8", 2).drawString("TOTAL LOGGED", W / 2, H / 2 - 24);
  g.setFont("6x8", 3).drawString("" + count, W / 2, H / 2 + 6);
  g.setFont("6x8", 1).drawString("tap to go back", W / 2, H - 16);
}

Bangle.on("touch", function (_, xy) {
  if (mode === "flash") return;               // ignore taps mid-confirmation
  if (mode === "stats") { drawGrid(); return; }
  if (!xy) return;
  var col = xy.x < HW ? 0 : 1;
  var row = xy.y < HH ? 0 : 1;
  var i = row * 2 + col;
  if (i >= 0 && i < TILES.length) logKey(TILES[i].key);
});

// Physical button: toggle the running-total screen.
setWatch(function () {
  if (mode === "stats") drawGrid(); else showStats();
}, BTN, { edge: "rising", debounce: 50, repeat: true });

drawGrid();
