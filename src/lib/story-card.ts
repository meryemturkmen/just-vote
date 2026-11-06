import { type Question, displayTitle } from "@/lib/questions";

const INK = "#141414";
const BG = "#fbf7e8";
const PINK = "#ff3d9a";
const YELLOW = "#f5e93a";
const LIME = "#b6f23a";
const FILLS: Record<string, string> = { a: YELLOW, b: LIME, c: PINK, d: "#fff" };

function loadImage(src: string) {
  return new Promise<HTMLImageElement | null>((resolve) => {
    if (!src) return resolve(null);
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

function brutBox(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, fill: string, r = 28, off = 14) {
  ctx.fillStyle = INK;
  roundRect(ctx, x + off, y + off, w, h, r);
  ctx.fill();
  ctx.fillStyle = fill;
  roundRect(ctx, x, y, w, h, r);
  ctx.fill();
  ctx.lineWidth = 6;
  ctx.strokeStyle = INK;
  ctx.stroke();
}

function drawCover(ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, w: number, h: number, r: number) {
  const s = Math.max(w / img.width, h / img.height);
  const iw = img.width * s, ih = img.height * s;
  ctx.save();
  roundRect(ctx, x, y, w, h, r);
  ctx.clip();
  ctx.drawImage(img, x + (w - iw) / 2, y + (h - ih) / 2, iw, ih);
  ctx.restore();
}

function sticker(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, fill: string, rot: number, size = 64) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.font = `800 ${size}px "Bricolage Grotesque", sans-serif`;
  const w = ctx.measureText(text).width + size * 0.6;
  const h = size * 1.35;
  brutBox(ctx, -w / 2, -h / 2, w, h, fill, 16, 8);
  ctx.fillStyle = fill === INK ? BG : INK;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, 0, 4);
  ctx.restore();
}

function wrap(ctx: CanvasRenderingContext2D, text: string, maxW: number) {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const t = line ? `${line} ${w}` : w;
    if (ctx.measureText(t).width > maxW && line) { lines.push(line); line = w; } else line = t;
  }
  if (line) lines.push(line);
  return lines.slice(0, 3);
}

/** Render a 1080x1920 story image with both photos, result bars and the wordmark. */
export async function renderStoryCard(q: Question): Promise<Blob> {
  await document.fonts?.ready;
  const W = 1080, H = 1920;
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, W, H);

  // dotted pattern
  ctx.fillStyle = "#e9e2c4";
  for (let y = 20; y < H; y += 48) for (let x = 20; x < W; x += 48) { ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fill(); }

  sticker(ctx, "JUST", 380, 150, INK, -0.06, 84);
  sticker(ctx, "VOTE!", 650, 165, PINK, 0.05, 84);

  ctx.fillStyle = INK;
  ctx.font = `800 76px "Bricolage Grotesque", sans-serif`;
  ctx.textAlign = "center";
  wrap(ctx, displayTitle(q), 900).forEach((l, i) => ctx.fillText(l, W / 2, 330 + i * 86));

  const photoOpts = q.kind === "buyskip" ? q.options.slice(0, 1) : q.options;
  const imgs = await Promise.all(photoOpts.map((o) => loadImage(o.url)));
  const n = imgs.length;
  // photo area: y 520..1240
  const area = { x: 70, y: 520, w: 940, h: 700 };
  const cols = n === 1 ? 1 : 2;
  const rows = n > 2 ? 2 : 1;
  const gap = 40;
  const cw = n === 1 ? 560 : (area.w - gap) / cols;
  const ch = (area.h - gap * (rows - 1)) / rows;
  imgs.forEach((img, i) => {
    const r = Math.floor(i / cols), col = i % cols;
    const wide = n === 3 && i === 2;
    const w = wide ? area.w : cw;
    const x = n === 1 ? (W - cw) / 2 : wide ? area.x : area.x + col * (cw + gap);
    const y = area.y + r * (ch + gap);
    const rot = (i % 2 ? 1 : -1) * 0.035;
    ctx.save();
    ctx.translate(x + w / 2, y + ch / 2);
    ctx.rotate(rot);
    brutBox(ctx, -w / 2, -ch / 2, w, ch, "#fff", 32, 14);
    if (img) drawCover(ctx, img, -w / 2 + 3, -ch / 2 + 3, w - 6, ch - 6, 30);
    ctx.restore();
    if (q.kind !== "buyskip") sticker(ctx, photoOpts[i]?.label ?? "", x + 56, y + 40, FILLS[photoOpts[i]?.key ?? "a"] ?? YELLOW, -0.1, 60);
  });
  if (n === 2) sticker(ctx, "VS", W / 2, area.y + area.h / 2, PINK, 0.08, 64);
  if (q.kind === "buyskip") sticker(ctx, "BUY OR SKIP?", W / 2, area.y + area.h - 10, PINK, -0.05, 60);

  const barsTop = 1280;
  const nb = q.options.length;
  const bh = nb > 2 ? 78 : 110;
  const step = nb > 2 ? 96 : 140;
  const font = nb > 2 ? 44 : 56;
  q.options.forEach((o, i) => {
    const y = barsTop + i * step;
    brutBox(ctx, 90, y, 900, bh, "#fff", 22, 8);
    ctx.save();
    roundRect(ctx, 93, y + 3, 894, bh - 6, 20);
    ctx.clip();
    ctx.fillStyle = q.kind === "buyskip" ? (o.key === "a" ? LIME : PINK) : FILLS[o.key] === "#fff" ? "#d9d2b4" : (FILLS[o.key] ?? YELLOW);
    ctx.fillRect(93, y + 3, (894 * o.pct) / 100, bh - 6);
    ctx.restore();
    ctx.fillStyle = INK;
    ctx.font = `800 ${font}px "Bricolage Grotesque", sans-serif`;
    ctx.textAlign = "left";
    ctx.fillText(q.kind === "buyskip" ? o.label : `Option ${o.label}`, 130, y + bh / 2 + font * 0.35);
    ctx.textAlign = "right";
    ctx.fillText(`${o.pct}%`, 950, y + bh / 2 + font * 0.35);
  });
  const total = q.options.reduce((s, o) => s + o.votes, 0);
  ctx.textAlign = "center";
  ctx.font = `700 44px "DM Sans", sans-serif`;
  ctx.fillText(`${total} ${total === 1 ? "vote" : "votes"} so far · you decide 👇`, W / 2, 1690);
  sticker(ctx, "justvote • tap the link", W / 2, 1800, YELLOW, -0.03, 48);

  return new Promise((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error("Couldn't make the image"))), "image/png"));
}

/** Share the story image via the share sheet (Instagram/TikTok), falling back to a download. */
export async function shareStoryCard(q: Question) {
  const blob = await renderStoryCard(q);
  const file = new File([blob], "just-vote-story.png", { type: "image/png" });
  const url = `${window.location.origin}/q/${q.id}?s=1`;
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: "Just Vote", text: `Help me pick 👉 ${url}` });
      return "shared";
    } catch (e) {
      if ((e as Error).name === "AbortError") return "cancelled";
    }
  }
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "just-vote-story.png";
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  return "downloaded";
}

/** Render a 1200x630 link-preview JPEG (all photos side by side + wordmark) from local photo blobs. */
export async function renderPreviewCard(blobs: Blob[]): Promise<Blob> {
  await document.fonts?.ready;
  const W = 1200, H = 630;
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = YELLOW;
  ctx.fillRect(0, 0, W, H);
  const urls = blobs.map((b) => URL.createObjectURL(b));
  const imgs = await Promise.all(urls.map(loadImage));
  urls.forEach((u) => URL.revokeObjectURL(u));
  const n = imgs.length;
  const gap = 30, top = 40, ph = 470;
  const pw = n === 1 ? 520 : (W - 120 - gap * (n - 1)) / n;
  const startX = n === 1 ? (W - pw) / 2 : 60;
  const fills = [PINK, LIME, "#fff", PINK];
  imgs.forEach((img, i) => {
    const x = startX + i * (pw + gap);
    ctx.save();
    ctx.translate(x + pw / 2, top + ph / 2);
    ctx.rotate((i % 2 ? 1 : -1) * 0.035);
    brutBox(ctx, -pw / 2, -ph / 2, pw, ph, "#fff", 28, 12);
    if (img) drawCover(ctx, img, -pw / 2 + 3, -ph / 2 + 3, pw - 6, ph - 6, 26);
    ctx.restore();
    if (n > 1) sticker(ctx, "ABCD"[i] ?? "", x + 46, top + 40, fills[i] ?? PINK, -0.1, n > 2 ? 46 : 56);
  });
  if (n === 2) sticker(ctx, "VS", W / 2, top + ph / 2, PINK, 0.08, 56);
  if (n === 1) sticker(ctx, "BUY OR SKIP?", W / 2, top + ph - 20, PINK, -0.05, 48);
  sticker(ctx, "JUST", 520, 570, INK, -0.06, 52);
  sticker(ctx, "VOTE!", 690, 578, PINK, 0.05, 52);
  return new Promise((res, rej) => c.toBlob((bl) => (bl ? res(bl) : rej(new Error("preview failed"))), "image/jpeg", 0.85));
}
