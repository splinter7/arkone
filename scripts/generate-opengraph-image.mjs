import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";

const NAVY = "#0F172A";
const ACCENT = "#2563EB";

const STARS = [
  [80, 60], [220, 120], [360, 45], [520, 180], [680, 90], [840, 140],
  [980, 70], [1100, 200], [150, 280], [400, 320], [620, 250], [900, 340],
  [1050, 420], [200, 480], [550, 520], [750, 460], [1000, 540], [120, 560],
  [450, 80], [800, 380], [300, 400], [950, 260], [60, 380], [720, 580],
];

const starMarkup = STARS.map(([cx, cy], index) => {
  const radius = index % 3 === 0 ? 1.5 : 1;
  const opacity = 0.2 + (index % 4) * 0.1;
  return `<circle cx="${cx}" cy="${cy}" r="${radius}" fill="#94a3b8" opacity="${opacity}" />`;
}).join("");

const svg = `
<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <rect width="1200" height="630" fill="#fafafa" />
  <ellipse cx="600" cy="250" rx="420" ry="180" fill="rgba(99,102,241,0.08)" />
  ${starMarkup}
  <rect x="458" y="232" width="56" height="56" rx="8" fill="${NAVY}" />
  <text x="486" y="272" text-anchor="middle" fill="#ffffff" font-family="system-ui, sans-serif" font-size="30" font-weight="700">A</text>
  <text x="534" y="272" font-family="system-ui, sans-serif" font-size="52" font-weight="600">
    <tspan fill="${NAVY}">Ark</tspan><tspan fill="${ACCENT}">One</tspan>
  </text>
  <text x="600" y="360" text-anchor="middle" fill="#737373" font-family="system-ui, sans-serif" font-size="28">
    Upload and retrieve media on IPFS via Pinata
  </text>
</svg>
`;

const outputPath = join(process.cwd(), "app", "opengraph-image.png");

await sharp(Buffer.from(svg)).png().toFile(outputPath);
console.log(`Wrote ${outputPath}`);
