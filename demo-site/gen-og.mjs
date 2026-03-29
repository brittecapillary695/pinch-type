import { createCanvas, registerFont } from 'canvas';
import { writeFileSync } from 'fs';

const W = 1200, H = 630;
const canvas = createCanvas(W, H);
const ctx = canvas.getContext('2d');

// White background
ctx.fillStyle = '#ffffff';
ctx.fillRect(0, 0, W, H);

// Subtle scattered text at various sizes to hint at the zoom effect
ctx.fillStyle = '#f0f0f0';
const hints = [
  { text: 'Aa', size: 120, x: 80, y: 160 },
  { text: 'Aa', size: 40, x: 950, y: 120 },
  { text: 'Aa', size: 70, x: 180, y: 520 },
  { text: 'Aa', size: 30, x: 1020, y: 500 },
  { text: 'Aa', size: 90, x: 900, y: 400 },
  { text: 'Aa', size: 24, x: 350, y: 130 },
];
for (const h of hints) {
  ctx.font = `${h.size}px "Georgia", serif`;
  ctx.fillText(h.text, h.x, h.y);
}

// Main title
ctx.fillStyle = '#000000';
ctx.textAlign = 'center';
ctx.textBaseline = 'middle';

// "pinch-" in regular, "type" in italic
const titleY = H * 0.42;
const titleSize = 96;
ctx.font = `${titleSize}px "Georgia", serif`;
const part1 = 'pinch-';
const part1W = ctx.measureText(part1).width;
ctx.font = `italic ${titleSize}px "Georgia", serif`;
const part2 = 'type';
const part2W = ctx.measureText(part2).width;
const totalW = part1W + part2W;
const startX = (W - totalW) / 2;

ctx.font = `${titleSize}px "Georgia", serif`;
ctx.textAlign = 'left';
ctx.fillText(part1, startX, titleY);
ctx.font = `italic ${titleSize}px "Georgia", serif`;
ctx.fillText(part2, startX + part1W, titleY);

// Subtitle
ctx.font = '24px "Georgia", serif';
ctx.textAlign = 'center';
ctx.fillStyle = '#666666';
ctx.fillText('Pinch to zoom text, not the page.', W / 2, titleY + 70);

// Thin line accent
ctx.strokeStyle = '#dddddd';
ctx.lineWidth = 1;
ctx.beginPath();
ctx.moveTo(W/2 - 60, titleY + 110);
ctx.lineTo(W/2 + 60, titleY + 110);
ctx.stroke();

writeFileSync('og.png', canvas.toBuffer('image/png'));
console.log('Generated og.png');
