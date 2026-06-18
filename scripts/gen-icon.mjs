import sharp from "sharp";

const SIZE = 1024;
const PAD = 170; // zona segura (maskable)
const inner = SIZE - PAD * 2;

// 1. Redimensiona o logo (PNG) preservando proporção e transparência
const resized = await sharp("public/logo.png")
  .resize({ width: inner, height: inner, fit: "inside" })
  .ensureAlpha()
  .png()
  .toBuffer();

const { width, height } = await sharp(resized).metadata();

// 2. Extrai o canal alfa como PNG cinza
const alpha = await sharp(resized)
  .extractChannel("alpha")
  .toColourspace("b-w")
  .png()
  .toBuffer();

// 3. Cria uma silhueta BRANCA com a transparência do logo
const whiteLogo = await sharp({
  create: { width, height, channels: 3, background: "#ffffff" },
})
  .joinChannel(alpha)
  .png()
  .toBuffer();

// 4. Fundo escuro com leve gradiente
const bgSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}">
  <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#1e293b"/>
    <stop offset="1" stop-color="#0f172a"/>
  </linearGradient></defs>
  <rect width="${SIZE}" height="${SIZE}" fill="url(#g)"/>
</svg>`;
const bg = await sharp(Buffer.from(bgSvg)).png().toBuffer();

// 5. Compõe o logo branco centralizado e grava
await sharp(bg)
  .composite([{ input: whiteLogo, gravity: "center" }])
  .png()
  .toFile("public/icon.png");

const meta = await sharp("public/icon.png").metadata();
console.log(`icon.png gerado: ${meta.width}x${meta.height}`);
