import { mkdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import sharp from "sharp";

const root = resolve(new URL("..", import.meta.url).pathname);
const outDir = join(root, "base-submission");

const W = 1284;
const H = 2778;

function esc(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function textLines(text, maxChars) {
  const words = text.split(" ");
  const lines = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > maxChars && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function imageTag({ x, y, width, height, seed = 1 }) {
  const colors = [
    ["#f97316", "#fde68a", "#0052ff"],
    ["#059669", "#bbf7d0", "#111827"],
    ["#db2777", "#fbcfe8", "#4338ca"],
  ][seed % 3];

  return `
    <defs>
      <clipPath id="faceClip${seed}"><rect x="${x}" y="${y}" width="${width}" height="${height}" rx="34"/></clipPath>
      <linearGradient id="photoBg${seed}" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${colors[0]}"/>
        <stop offset="58%" stop-color="${colors[1]}"/>
        <stop offset="100%" stop-color="${colors[2]}"/>
      </linearGradient>
    </defs>
    <g clip-path="url(#faceClip${seed})">
      <rect x="${x}" y="${y}" width="${width}" height="${height}" fill="url(#photoBg${seed})"/>
      <circle cx="${x + width * 0.5}" cy="${y + height * 0.33}" r="${width * 0.15}" fill="#fff7ed"/>
      <path d="M ${x + width * 0.29} ${y + height * 0.73} C ${x + width * 0.34} ${y + height * 0.52}, ${x + width * 0.66} ${y + height * 0.52}, ${x + width * 0.71} ${y + height * 0.73} Z" fill="#fff7ed"/>
      <circle cx="${x + width * 0.44}" cy="${y + height * 0.32}" r="9" fill="#171717"/>
      <circle cx="${x + width * 0.56}" cy="${y + height * 0.32}" r="9" fill="#171717"/>
      <path d="M ${x + width * 0.45} ${y + height * 0.42} Q ${x + width * 0.5} ${y + height * 0.46} ${x + width * 0.57} ${y + height * 0.42}" fill="none" stroke="#171717" stroke-width="8" stroke-linecap="round"/>
      <circle cx="${x + width * 0.18}" cy="${y + height * 0.17}" r="${width * 0.11}" fill="#ffffff" opacity=".32"/>
      <path d="M ${x - 40} ${y + height * 0.92} C ${x + width * 0.22} ${y + height * 0.77}, ${x + width * 0.72} ${y + height * 1.06}, ${x + width + 50} ${y + height * 0.82} L ${x + width + 50} ${y + height + 40} L ${x - 40} ${y + height + 40} Z" fill="#0052ff" opacity=".68"/>
    </g>
    <rect x="${x}" y="${y}" width="${width}" height="${height}" rx="34" fill="none" stroke="#171717" stroke-width="8"/>
  `;
}

function passportCard({ x, y, width, scale = 1, title = "Avery Base", role = "CREATOR", accent = "#0052ff", seed = 1 }) {
  const height = width * 1.28;
  return `
    <g transform="translate(${x} ${y}) scale(${scale})">
      <rect x="0" y="0" width="${width}" height="${height}" fill="#fffaf1" stroke="#171717" stroke-width="8"/>
      <rect x="0" y="0" width="${width}" height="112" fill="${accent}"/>
      <text x="44" y="74" font-family="Arial, sans-serif" font-size="38" font-weight="900" fill="#fff">BASE PHOTO PASSPORT</text>
      ${imageTag({ x: 48, y: 164, width: width - 96, height: height * 0.52, seed })}
      <rect x="48" y="${height * 0.61}" width="${width - 96}" height="90" fill="#fff" opacity=".9"/>
      <text x="78" y="${height * 0.675}" font-family="Arial, sans-serif" font-size="48" font-weight="900" fill="#171717">${esc(title)}</text>
      <text x="48" y="${height * 0.785}" font-family="Arial, sans-serif" font-size="42" font-weight="900" fill="#171717">${esc(role)}</text>
      <text x="48" y="${height * 0.84}" font-family="Arial, sans-serif" font-size="28" font-weight="700" fill="${accent}">Minted my identity on Base</text>
      <rect x="${width - 192}" y="${height * 0.745}" width="144" height="144" fill="${accent}"/>
      <text x="${width - 171}" y="${height * 0.825}" font-family="Arial, sans-serif" font-size="44" font-weight="900" fill="#fff">BASE</text>
      <text x="48" y="${height - 52}" font-family="Arial, sans-serif" font-size="26" font-weight="700" fill="#171717">IPFS + ERC-721</text>
      <text x="${width - 220}" y="${height - 52}" font-family="Arial, sans-serif" font-size="26" font-weight="700" fill="#171717">2026-05-11</text>
    </g>
  `;
}

function phoneFrame(content, opts = {}) {
  const bg = opts.bg ?? "#f7f4ec";
  return `
  <svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${W}" height="${H}" fill="${bg}"/>
    <path d="M0 0H1284V2778H0Z" fill="url(#grid)" opacity=".72"/>
    <defs>
      <pattern id="grid" width="78" height="78" patternUnits="userSpaceOnUse">
        <path d="M78 0H0V78" fill="none" stroke="#171717" stroke-width="2" opacity=".08"/>
      </pattern>
    </defs>
    ${content}
  </svg>`;
}

function header(title, subtitle) {
  const lines = textLines(subtitle, 28);
  return `
    <g>
      <rect x="48" y="58" width="394" height="54" fill="#fff" stroke="#171717" stroke-width="5"/>
      <text x="82" y="96" font-family="Arial, sans-serif" font-size="27" font-weight="900" fill="#171717">BASE PHOTO PASSPORT</text>
      <text x="48" y="220" font-family="Arial, sans-serif" font-size="91" font-weight="900" fill="#171717">${esc(title)}</text>
      ${lines.map((line, i) => `<text x="52" y="${302 + i * 49}" font-family="Arial, sans-serif" font-size="38" font-weight="700" fill="#4b5563">${esc(line)}</text>`).join("")}
    </g>
  `;
}

function button(x, y, width, label, fill = "#0052ff", fg = "#fff") {
  return `<rect x="${x}" y="${y}" width="${width}" height="94" fill="${fill}" stroke="#171717" stroke-width="6"/>
  <text x="${x + width / 2}" y="${y + 60}" text-anchor="middle" font-family="Arial, sans-serif" font-size="31" font-weight="900" fill="${fg}">${esc(label)}</text>`;
}

function screenshot1() {
  const content = `
    ${header("Photo to NFT", "Upload your own picture, style the passport, then mint it on Base.")}
    <rect x="48" y="500" width="1188" height="464" fill="#fff" stroke="#171717" stroke-width="7"/>
    <path d="M642 598v155M565 675h154" stroke="#171717" stroke-width="18" stroke-linecap="round"/>
    <text x="642" y="828" text-anchor="middle" font-family="Arial, sans-serif" font-size="54" font-weight="900" fill="#171717">Upload your photo</text>
    <text x="642" y="889" text-anchor="middle" font-family="Arial, sans-serif" font-size="30" font-weight="700" fill="#6b7280">JPG, PNG, or WebP under 8 MB</text>
    <rect x="48" y="1024" width="552" height="170" fill="#fff" stroke="#171717" stroke-width="6"/>
    <text x="88" y="1085" font-family="Arial, sans-serif" font-size="30" font-weight="900" fill="#171717">Display name</text>
    <text x="88" y="1148" font-family="Arial, sans-serif" font-size="40" font-weight="900" fill="#0052ff">Base Native</text>
    <rect x="636" y="1024" width="600" height="170" fill="#fff" stroke="#171717" stroke-width="6"/>
    <text x="676" y="1085" font-family="Arial, sans-serif" font-size="30" font-weight="900" fill="#171717">Identity</text>
    <text x="676" y="1148" font-family="Arial, sans-serif" font-size="40" font-weight="900" fill="#d84315">Creator</text>
    ${passportCard({ x: 92, y: 1280, width: 1100, title: "Base Native", role: "ADD PHOTO", accent: "#0052ff", seed: 0 })}
    ${button(48, 2526, 568, "Upload IPFS", "#fff", "#171717")}
    ${button(668, 2526, 568, "Mint NFT")}
  `;
  return phoneFrame(content);
}

function screenshot2() {
  const content = `
    ${header("Style your passport", "Choose a role and frame. The NFT image updates instantly before IPFS upload.")}
    <rect x="48" y="480" width="1188" height="260" fill="#171717" stroke="#171717" stroke-width="7"/>
    <text x="94" y="565" font-family="Arial, sans-serif" font-size="38" font-weight="900" fill="#fff">Creator selected</text>
    <text x="94" y="631" font-family="Arial, sans-serif" font-size="32" font-weight="700" fill="#d1d5db">Gallery frame · Personal photo loaded</text>
    <circle cx="1080" cy="610" r="76" fill="#d84315"/>
    <path d="M1040 612l28 28 56-72" fill="none" stroke="#fff" stroke-width="15" stroke-linecap="round" stroke-linejoin="round"/>
    ${passportCard({ x: 112, y: 825, width: 1060, title: "Avery Base", role: "CREATOR", accent: "#d84315", seed: 1 })}
    <rect x="48" y="2308" width="274" height="114" fill="#171717" stroke="#171717" stroke-width="6"/>
    <text x="185" y="2378" text-anchor="middle" font-family="Arial, sans-serif" font-size="31" font-weight="900" fill="#fff">Creator</text>
    <rect x="350" y="2308" width="274" height="114" fill="#fffaf1" stroke="#171717" stroke-width="6"/>
    <text x="487" y="2378" text-anchor="middle" font-family="Arial, sans-serif" font-size="31" font-weight="900" fill="#171717">Builder</text>
    <rect x="652" y="2308" width="274" height="114" fill="#fffaf1" stroke="#171717" stroke-width="6"/>
    <text x="789" y="2378" text-anchor="middle" font-family="Arial, sans-serif" font-size="31" font-weight="900" fill="#171717">Collector</text>
    <rect x="954" y="2308" width="282" height="114" fill="#fffaf1" stroke="#171717" stroke-width="6"/>
    <text x="1095" y="2378" text-anchor="middle" font-family="Arial, sans-serif" font-size="31" font-weight="900" fill="#171717">Supporter</text>
    ${button(48, 2526, 1188, "Upload image and metadata to IPFS", "#0052ff", "#fff")}
  `;
  return phoneFrame(content, { bg: "#fff8f0" });
}

function screenshot3() {
  const content = `
    ${header("Mint ready", "Metadata is pinned to IPFS. Connect Base Account and mint the ERC-721 passport.")}
    <rect x="48" y="488" width="1188" height="360" fill="#ecfdf5" stroke="#171717" stroke-width="7"/>
    <text x="98" y="585" font-family="Arial, sans-serif" font-size="43" font-weight="900" fill="#052e24">IPFS metadata ready</text>
    <text x="98" y="655" font-family="Arial, sans-serif" font-size="31" font-weight="700" fill="#047857">image: ipfs://bafy...photo</text>
    <text x="98" y="716" font-family="Arial, sans-serif" font-size="31" font-weight="700" fill="#047857">token: ipfs://bafy...metadata</text>
    <rect x="904" y="574" width="228" height="116" fill="#047857"/>
    <text x="1018" y="647" text-anchor="middle" font-family="Arial, sans-serif" font-size="35" font-weight="900" fill="#fff">READY</text>
    ${passportCard({ x: 132, y: 960, width: 1020, title: "Avery Base", role: "BUILDER", accent: "#047857", seed: 2 })}
    <rect x="48" y="2250" width="1188" height="174" fill="#171717" stroke="#171717" stroke-width="7"/>
    <text x="96" y="2320" font-family="Arial, sans-serif" font-size="30" font-weight="900" fill="#9ff6cf">Mint status</text>
    <text x="96" y="2385" font-family="Arial, sans-serif" font-size="34" font-weight="800" fill="#fff">Transaction attribution uses Builder Code.</text>
    ${button(48, 2526, 1188, "Mint NFT on Base", "#0052ff", "#fff")}
  `;
  return phoneFrame(content, { bg: "#ecfdf5" });
}

function iconSvg() {
  return `
  <svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
    <rect width="1024" height="1024" fill="#f7f4ec"/>
    <rect x="128" y="94" width="768" height="836" fill="#fff" stroke="#171717" stroke-width="28"/>
    <rect x="128" y="94" width="768" height="150" fill="#0052ff"/>
    <text x="512" y="192" text-anchor="middle" font-family="Arial, sans-serif" font-size="72" font-weight="900" fill="#fff">BASE</text>
    ${imageTag({ x: 218, y: 314, width: 588, height: 410, seed: 2 })}
    <rect x="218" y="762" width="360" height="54" fill="#171717"/>
    <rect x="218" y="842" width="226" height="34" fill="#0052ff"/>
    <rect x="642" y="762" width="164" height="164" fill="#0052ff"/>
    <text x="724" y="860" text-anchor="middle" font-family="Arial, sans-serif" font-size="54" font-weight="900" fill="#fff">NFT</text>
  </svg>`;
}

function thumbnailSvg() {
  return `
  <svg width="1910" height="1000" viewBox="0 0 1910 1000" xmlns="http://www.w3.org/2000/svg">
    <rect width="1910" height="1000" fill="#f7f4ec"/>
    <path d="M0 0H1910V1000H0Z" fill="url(#grid)" opacity=".8"/>
    <defs>
      <pattern id="grid" width="72" height="72" patternUnits="userSpaceOnUse">
        <path d="M72 0H0V72" fill="none" stroke="#171717" stroke-width="2" opacity=".08"/>
      </pattern>
    </defs>
    <text x="96" y="220" font-family="Arial, sans-serif" font-size="120" font-weight="900" fill="#171717">Base Photo Passport</text>
    <text x="102" y="320" font-family="Arial, sans-serif" font-size="50" font-weight="800" fill="#4b5563">Turn your photo into an IPFS-backed NFT on Base.</text>
    ${button(102, 422, 470, "Upload")}
    ${button(622, 422, 470, "Mint NFT", "#171717", "#fff")}
    ${passportCard({ x: 1220, y: 96, width: 590, title: "Avery Base", role: "CREATOR", accent: "#d84315", seed: 1 })}
  </svg>`;
}

async function writePng(name, svg, width = W, height = H) {
  const file = join(outDir, name);
  await sharp(Buffer.from(svg)).resize(width, height).png({ quality: 92, compressionLevel: 9 }).toFile(file);
  return file;
}

async function writeJpg(name, svg, width, height) {
  const file = join(outDir, name);
  await sharp(Buffer.from(svg)).resize(width, height).jpeg({ quality: 86, mozjpeg: true }).toFile(file);
  return file;
}

await mkdir(outDir, { recursive: true });

const files = [
  await writeJpg("app-icon.jpg", iconSvg(), 1024, 1024),
  await writeJpg("app-thumbnail.jpg", thumbnailSvg(), 1910, 1000),
  await writePng("screenshot-1.png", screenshot1()),
  await writePng("screenshot-2.png", screenshot2()),
  await writePng("screenshot-3.png", screenshot3()),
];

await writeFile(
  join(outDir, "asset-manifest.json"),
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      files: files.map((file) => file.replace(`${root}/`, "")),
      screenshotSize: "1284x2778",
      thumbnailAspectRatio: "1.91:1",
    },
    null,
    2,
  ),
);

console.log(files.join("\n"));
