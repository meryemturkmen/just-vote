import { percent, type Question, displayTitle } from "@/lib/questions";

const INK = "#141414";
const BG = "#fbf7e8";
const PINK = "#ff3d9a";
const YELLOW = "#f5e93a";
const LIME = "#b6f23a";

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

  const [imgA, imgB] = await Promise.all([loadImage(q.option_a_url), loadImage(q.option_b_url)]);
  const pw = 440, ph = 600, py = 560;
  const slots = [
    { img: imgA, x: 70, rot: -0.04, label: "A" },
    { img: imgB, x: 570, rot: 0.04, label: "B" },
  ];
  for (const s of slots) {
    ctx.save();
    ctx.translate(s.x + pw / 2, py + ph / 2);
    ctx.rotate(s.rot);
    brutBox(ctx, -pw / 2, -ph / 2, pw, ph, "#fff", 32, 16);
    if (s.img) drawCover(ctx, s.img, -pw / 2 + 3, -ph / 2 + 3, pw - 6, ph - 6, 30);
    ctx.restore();
    sticker(ctx, s.label, s.x + 60, py + 40, s.label === "A" ? YELLOW : LIME, -0.1, 70);
  }
  sticker(ctx, "VS", W / 2, py + ph / 2, PINK, 0.08, 64);

  const [pa, pb] = percent(q.votesA, q.votesB);
  const bars = [
    { label: "A", pct: pa, color: YELLOW, y: 1300 },
    { label: "B", pct: pb, color: LIME, y: 1440 },
  ];
  for (const b of bars) {
    brutBox(ctx, 90, b.y, 900, 110, "#fff", 24, 10);
    ctx.save();
    roundRect(ctx, 93, b.y + 3, 894, 104, 22);
    ctx.clip();
    ctx.fillStyle = b.color;
    ctx.fillRect(93, b.y + 3, (894 * b.pct) / 100, 104);
    ctx.restore();
    ctx.fillStyle = INK;
    ctx.font = `800 56px "Bricolage Grotesque", sans-serif`;
    ctx.textAlign = "left";
    ctx.fillText(`Option ${b.label}`, 130, b.y + 75);
    ctx.textAlign = "right";
    ctx.fillText(`${b.pct}%`, 950, b.y + 75);
  }
  const total = q.votesA + q.votesB;
  ctx.textAlign = "center";
  ctx.font = `700 44px "DM Sans", sans-serif`;
  ctx.fillText(`${total} ${total === 1 ? "vote" : "votes"} so far · you decide 👇`, W / 2, 1650);
  sticker(ctx, "justvote • tap the link", W / 2, 1780, YELLOW, -0.03, 48);

  return new Promise((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error("Couldn't make the image"))), "image/png"));
}

/** Share the story image via the share sheet (Instagram/TikTok), falling back to a download. */
export async function shareStoryCard(q: Question) {
  const blob = await renderStoryCard(q);
  const file = new File([blob], "just-vote-story.png", { type: "image/png" });
  const url = `${window.location.origin}/q/${q.id}`;
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

/** Render a 1200x630 link-preview JPEG (both photos side by side + wordmark) from local photo blobs. */
export async function renderPreviewCard(a: Blob, b: Blob): Promise<Blob> {
  await document.fonts?.ready;
  const W = 1200, H = 630;
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = YELLOW;
  ctx.fillRect(0, 0, W, H);
  const ua = URL.createObjectURL(a), ub = URL.createObjectURL(b);
  const [imgA, imgB] = await Promise.all([loadImage(ua), loadImage(ub)]);
  URL.revokeObjectURL(ua); URL.revokeObjectURL(ub);
  const pw = 500, ph = 470, py = 40;
  const slots = [
    { img: imgA, x: 60, rot: -0.035, label: "A", fill: PINK },
    { img: imgB, x: 640, rot: 0.035, label: "B", fill: LIME },
  ];
  for (const s of slots) {
    ctx.save();
    ctx.translate(s.x + pw / 2, py + ph / 2);
    ctx.rotate(s.rot);
    brutBox(ctx, -pw / 2, -ph / 2, pw, ph, "#fff", 28, 12);
    if (s.img) drawCover(ctx, s.img, -pw / 2 + 3, -ph / 2 + 3, pw - 6, ph - 6, 26);
    ctx.restore();
    sticker(ctx, s.label, s.x + 50, py + 40, s.fill, -0.1, 56);
  }
  sticker(ctx, "VS", W / 2, py + ph / 2, PINK, 0.08, 56);
  sticker(ctx, "JUST", 520, 570, INK, -0.06, 52);
  sticker(ctx, "VOTE!", 690, 578, PINK, 0.05, 52);
  return new Promise((res, rej) => c.toBlob((bl) => (bl ? res(bl) : rej(new Error("preview failed"))), "image/jpeg", 0.85));
}
