// Ornaments (crisp SVG for UI) and characters (WebP sprites). Run: npm run art
import sharp from 'sharp'
import { C, TAU, circle, f, line, mullet, path, poly, save, svg } from './lib.mjs'

// ─── royal emblem: crowned shield, burgundy field, gold chevron, three mullets ─
function emblem() {
  const shield = 'M60,110 H340 V260 C340,370 262,430 200,458 C138,430 60,370 60,260Z'
  const crown =
    path('M110,96 L96,30 L150,62 L200,14 L250,62 L304,30 L290,96Z', C.gold, 4) +
    path('M104,84 H296 V108 H104Z', C.goldLight, 4) +
    [96, 200, 304].map((x, i) => circle(x, [30, 14, 30][i], 9, C.goldLight, 3)).join('') +
    [140, 200, 260].map((x) => circle(x, 96, 6, C.red, 2)).join('')
  const body =
    `<clipPath id="s"><path d="${shield}"/></clipPath>` +
    path(shield, C.burgundy, 0) +
    `<g clip-path="url(#s)">${path('M40,340 L200,200 L360,340 L360,282 L200,142 L40,282Z', C.gold, 3)}</g>` +
    path(mullet(126, 168, 26), C.goldLight, 3) +
    path(mullet(274, 168, 26), C.goldLight, 3) +
    path(mullet(200, 368, 30), C.goldLight, 3) +
    path(shield, 'none', 6) +
    line('M78,126 H322 V260 C322,358 252,412 200,438 C148,412 78,358 78,260Z', C.gold, 2.5) +
    crown
  return svg(400, 470, body)
}

// ─── divider: tapered rules + central fleuron ───────────────────────────────
function divider() {
  const wedge = (dir) => path(`M${400 + dir * 70},40 L${400 + dir * 380},40 L${400 + dir * 70},36Z M${400 + dir * 70},40 L${400 + dir * 380},40 L${400 + dir * 70},44Z`, C.brown, 0)
  const curl = (dir) =>
    line(`M${400 + dir * 18},40 C${400 + dir * 40},16 ${400 + dir * 66},18 ${400 + dir * 64},34 C${400 + dir * 62},46 ${400 + dir * 46},46 ${400 + dir * 46},36`, C.brown, 3)
  const body =
    wedge(-1) +
    wedge(1) +
    curl(-1) +
    curl(1) +
    path('M400,18 L416,40 L400,62 L384,40Z', C.gold, 2.5) +
    circle(400, 40, 4, C.burgundy, 0) +
    circle(400 - 84, 40, 4, C.gold, 1.5) +
    circle(400 + 84, 40, 4, C.gold, 1.5)
  return svg(800, 80, body)
}

// ─── border: seamless horizontal ivy-vine tile (repeat-x) ───────────────────
function border() {
  const w = 400
  const stem = `M0,40 C50,10 150,10 200,40 C250,70 350,70 400,40`
  const leaf = (x, y, rot, fill) =>
    `<g transform="translate(${x},${y}) rotate(${rot})">${path('M0,0 C-14,-8 -16,-26 -6,-30 C-2,-31 0,-27 0,-24 C0,-27 2,-31 6,-30 C16,-26 14,-8 0,0Z', fill, 2)}</g>`
  const body =
    line(stem, C.ink, 3) +
    leaf(100, 18, -20, C.gold) +
    leaf(300, 62, 160, C.gold) +
    leaf(50, 22, 40, C.green) +
    leaf(250, 58, 220, C.green) +
    leaf(150, 22, -40, C.red) +
    leaf(350, 58, 140, C.blue) +
    [200, 0, 400].map((x) => circle(x, 40, 5, C.gold, 1.5)).join('') +
    circle(100, 56, 3.5, C.burgundy, 0) +
    circle(300, 24, 3.5, C.burgundy, 0)
  return svg(w, 112, `<g transform="translate(0,16)">${body}</g>`)
}

// ─── frame: gilded picture frame, 9-slice friendly (border-image-slice: 64) ─
function frame() {
  const W = 600
  const H = 450
  const b = 56
  let pearls = ''
  for (let x = b + 24; x < W - b - 12; x += 22) pearls += circle(x, b / 2, 3.5, C.goldLight, 1) + circle(x, H - b / 2, 3.5, C.goldLight, 1)
  for (let y = b + 24; y < H - b - 12; y += 22) pearls += circle(b / 2, y, 3.5, C.goldLight, 1) + circle(W - b / 2, y, 3.5, C.goldLight, 1)
  const rosette = (cx, cy) => {
    let petals = ''
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * TAU + Math.PI / 4
      petals += circle(cx + Math.cos(a) * 11, cy + Math.sin(a) * 11, 10, C.red, 2)
    }
    return circle(cx, cy, 25, C.gold, 3) + petals + circle(cx, cy, 6, C.goldLight, 2)
  }
  const ring = `M0,0 H${W} V${H} H0Z M${b},${b} V${H - b} H${W - b} V${b}Z`
  const body =
    path(ring, C.gold, 0, 'fill-rule="evenodd"') +
    path(`M8,8 H${W - 8} V${H - 8} H8Z`, 'none', 0, `stroke="${C.goldLight}" stroke-width="5"`) +
    path(`M${b - 10},${b - 10} H${W - b + 10} V${H - b + 10} H${b - 10}Z`, 'none', 0, `stroke="${C.goldDark}" stroke-width="7"`) +
    pearls +
    [
      [b / 2, b / 2],
      [W - b / 2, b / 2],
      [b / 2, H - b / 2],
      [W - b / 2, H - b / 2],
    ]
      .map(([x, y]) => rosette(x, y))
      .join('') +
    path(`M1.5,1.5 H${W - 1.5} V${H - 1.5} H1.5Z`, 'none', 3) +
    path(`M${b},${b} H${W - b} V${H - b} H${b}Z`, 'none', 3)
  return svg(W, H, body)
}

// ─── characters ─────────────────────────────────────────────────────────────
const SPRITE_SCALE = 1.5
const black = '#221d1b'
const sheen = '#4b4f5e'

function raven() {
  const backWing = path('M330,170 C350,110 380,60 430,24 L420,58 L452,50 L428,80 L462,82 L420,106 L446,118 L404,128 L418,150 L380,158Z', '#171312', 3)
  const tail = path('M140,180 L40,150 L58,176 L30,190 L62,200 L44,224 L150,214Z', black, 3)
  const body = path('M130,200 C170,160 260,150 340,158 C400,162 440,150 462,140 C470,180 440,210 400,218 C320,236 220,236 130,214Z', black, 3)
  const head = circle(470, 150, 36, black, 3)
  const beak = path('M494,134 C530,138 560,150 584,164 C556,168 526,170 496,170Z', '#3d3a3a', 3) + line('M498,158 L572,162', sheen, 2)
  const eye = circle(474, 140, 7, C.cream, 1.5) + circle(476, 140, 3.5, '#120f0e', 0)
  const frontWing = path('M300,172 C270,120 220,70 166,30 L190,62 L146,56 L184,84 L136,86 L182,108 L138,120 L192,132 L160,152 L214,156 L204,178Z', black, 3)
  const feathers = line('M290,160 C260,120 230,90 190,62 M276,166 C246,136 220,112 184,84 M262,170 C236,148 214,130 182,108', sheen, 2.5)
  const legs = line('M300,226 L318,252 L332,250 M318,252 L322,266', '#3d3a3a', 4)
  return svg(600, 290, backWing + tail + legs + body + frontWing + feathers + head + beak + eye, { scale: SPRITE_SCALE })
}

function knight() {
  const mail = '#8b8f94'
  const steel = '#a6aaae'
  const shield = 'M60,370 H220 V450 C220,520 176,556 140,574 C104,556 60,520 60,450Z'
  const body = [
    // legs + sabatons
    path('M192,590 H236 V830 H192Z M264,590 H308 V830 H264Z', mail, 4),
    line('M196,620 H232 M196,660 H232 M196,700 H232 M196,740 H232 M196,780 H232 M268,620 H304 M268,660 H304 M268,700 H304 M268,740 H304 M268,780 H304', '#6f7378', 2),
    path('M180,826 C180,808 240,808 244,830 L244,846 H176Z M256,830 C260,808 320,808 320,826 L324,846 H256Z', steel, 4),
    // sword arm (behind surcoat edge), sword point-down
    path('M326,312 C352,330 364,380 366,430 L340,434 C338,392 330,356 314,336Z', mail, 4),
    path('M360,452 H372 V770 L366,800 L360,770Z', '#d6d9dc', 3),
    path('M326,440 H406 V454 H326Z', C.gold, 3),
    path('M358,400 H374 V442 H358Z', C.brown, 3),
    circle(366, 394, 10, C.gold, 3),
    circle(352, 436, 16, mail, 3),
    // surcoat
    path('M176,296 H324 L356,604 H144Z', C.burgundy, 4),
    `<clipPath id="sc"><path d="M176,296 H324 L356,604 H144Z"/></clipPath><g clip-path="url(#sc)">${path('M120,520 L250,400 L380,520 L380,480 L250,360 L120,480Z', C.gold, 3)}</g>`,
    path('M164,454 H336 V474 H164Z', C.brown, 3),
    path('M238,450 H262 V478 H238Z', C.gold, 2.5),
    // shoulders / neck mail
    path('M176,296 C190,270 310,270 324,296 C300,312 200,312 176,296Z', mail, 4),
    // great helm
    path('M202,286 V196 C202,160 298,160 298,196 V286Z', steel, 4),
    path('M206,222 H294 V234 H206Z', '#1e1a18', 0),
    path('M244,182 H256 V286 H244Z', C.gold, 2.5),
    line('M226,252 h0 M226,264 h0 M274,252 h0 M274,264 h0', '#1e1a18', 6),
    path('M250,166 C230,120 270,100 300,120 C280,122 266,136 262,166Z', C.red, 3),
    // shield arm + heater shield with the emblem charge
    path('M176,312 C150,330 140,370 138,410 L164,412 C166,380 172,354 186,336Z', mail, 4),
    path(shield, C.burgundy, 5),
    `<clipPath id="sh"><path d="${shield}"/></clipPath><g clip-path="url(#sh)">${path('M50,500 L140,420 L230,500 L230,468 L140,388 L50,468Z', C.gold, 2.5)}</g>`,
    path(mullet(104, 400, 13), C.goldLight, 2),
    path(mullet(176, 400, 13), C.goldLight, 2),
    path(mullet(140, 520, 15), C.goldLight, 2),
    path(shield, 'none', 5),
  ].join('')
  return svg(460, 860, body, { scale: SPRITE_SCALE })
}

function scribe() {
  const habit = '#6b4a32'
  const habitShade = '#563a27'
  const skin = '#e3c39d'
  const body = [
    // stool
    path('M150,560 H330 V586 H150Z', C.brown, 4),
    path('M166,586 H184 V740 H166Z M296,586 H314 V740 H296Z', C.brown, 4),
    // robe (seated, hunched toward the desk)
    path('M176,742 C188,640 192,560 206,470 C214,400 236,340 280,318 C320,300 362,312 380,346 L404,512 C446,556 456,690 440,742Z', habit, 4),
    line('M250,380 C246,470 252,600 246,736 M330,520 C350,600 360,680 360,738', habitShade, 4),
    // lectern + open book + candle + inkpot
    path('M548,744 H640 V760 H548Z', C.brown, 4),
    path('M586,460 H604 V744 H586Z', C.brown, 4),
    path('M452,470 L668,404 L676,428 L460,494Z', '#7a5636', 4),
    path('M478,462 L562,436 L572,446 L568,452 L486,476Z', '#f2ecdc', 3),
    path('M562,436 L648,410 L654,418 L572,446Z', '#f2ecdc', 3),
    line('M492,466 L556,446 M494,472 L560,452 M576,438 L640,418 M580,444 L644,424', '#7a5636', 1.5),
    line('M492,466 l12,-4', C.red, 3) + line('M576,438 l12,-4', '#3d5a8a', 3),
    path('M636,378 H654 V412 H636Z', C.cream, 3),
    path('M645,378 C632,362 642,346 645,336 C650,348 660,362 645,378Z', C.gold, 2.5),
    path('M432,452 H456 V474 H432Z', '#2f2219', 3),
    // writing arm + hand + quill
    path('M330,356 C380,370 440,410 500,446 L488,470 C430,446 372,424 320,404Z', habit, 4),
    circle(502, 456, 15, skin, 3),
    path('M498,452 L560,330 C578,340 572,380 512,454Z', '#f4efe1', 3),
    line('M506,446 L556,344', '#b9ad8f', 1.5),
    // hood on shoulders + tonsured head in profile
    path('M262,330 C276,300 350,296 372,330 C350,352 286,354 262,330Z', habitShade, 4),
    path('M296,284 C296,230 340,214 372,226 C394,236 404,262 400,284 L412,296 L400,300 C398,318 382,330 360,330 C326,330 296,314 296,284Z', skin, 4),
    path('M298,270 C300,236 330,216 362,222 C342,228 326,240 318,262 C312,276 304,280 298,270Z', '#5a3e2b', 3),
    circle(378, 262, 3.5, '#2f2219', 0),
    line('M386,306 C380,310 372,310 366,306', '#8a5a40', 2.5),
  ].join('')
  return svg(720, 780, body, { scale: SPRITE_SCALE })
}

await save('ornaments/royal-emblems/emblem.svg', emblem())
await save('ornaments/dividers/divider.svg', divider())
await save('ornaments/borders/vine.svg', border())
await save('ornaments/frames/gilded-frame.svg', frame())
const sprites = [
  await save('characters/raven/raven.webp', raven()),
  await save('characters/knight/knight.webp', knight()),
  await save('characters/scribe/scribe.webp', scribe()),
]

// Contact sheet of every sprite on parchment for eyeballing.
const preview = process.argv[2]
if (preview) {
  const items = [
    ...sprites,
    ...['royal-emblems/emblem.svg', 'dividers/divider.svg', 'borders/vine.svg', 'frames/gilded-frame.svg'].map((p) => `src/assets/medieval/ornaments/${p}`),
  ]
  const tiles = await Promise.all(items.map((p) => sharp(p).resize({ width: 380, height: 380, fit: 'inside' }).toBuffer()))
  await sharp({ create: { width: 1600, height: 820, channels: 4, background: '#efe3c8' } })
    .composite(tiles.map((input, i) => ({ input, left: 10 + (i % 4) * 400, top: 10 + Math.floor(i / 4) * 410 })))
    .png()
    .toFile(preview)
  console.log('preview →', preview)
}
