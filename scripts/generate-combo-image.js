import sharp from "sharp";

const CANVAS_WIDTH = 1024;
const CANVAS_HEIGHT = 448;
const PRODUCT_SIZE = 280;

const products = [
  {
    name: "Corona Coronita 6un",
    url: "https://cdn.shopify.com/s/files/1/0800/7050/8802/files/91064246b383f2d443f79f23bf15ce02.webp?v=1769488518",
  },
  {
    name: "Isca de File Mignon a Parmegiana",
    url: "https://cdn.shopify.com/s/files/1/0813/9089/5346/files/16.png?v=1771228451",
  },
  {
    name: "Guarana Antarctica Zero 350ml",
    url: "https://cdn.shopify.com/s/files/1/0794/8750/0511/files/00008865_0da83f51-0f96-4247-9cac-1963bc60dd1c.webp?v=1769744652",
  },
];

async function fetchImage(url) {
  const res = await fetch(url);
  const buffer = Buffer.from(await res.arrayBuffer());
  return sharp(buffer)
    .resize(PRODUCT_SIZE, PRODUCT_SIZE, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
}

// Create "+" sign SVG
function createPlusSvg() {
  return Buffer.from(`
    <svg width="40" height="40" xmlns="http://www.w3.org/2000/svg">
      <rect x="16" y="4" width="8" height="32" rx="4" fill="white"/>
      <rect x="4" y="16" width="32" height="8" rx="4" fill="white"/>
    </svg>
  `);
}

// Create text SVG for combo title and price
function createTextOverlay() {
  return Buffer.from(`
    <svg width="${CANVAS_WIDTH}" height="${CANVAS_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#1a1a2e"/>
          <stop offset="100%" stop-color="#16213e"/>
        </linearGradient>
      </defs>
      <rect width="${CANVAS_WIDTH}" height="${CANVAS_HEIGHT}" fill="url(#bg)"/>
      
      <!-- Title -->
      <text x="512" y="52" text-anchor="middle" font-family="Arial, sans-serif" font-weight="900" font-size="36" fill="white" font-style="italic">
        COMBO ESPECIAL
      </text>
      
      <!-- Underline -->
      <rect x="380" y="62" width="264" height="3" rx="2" fill="#e53e3e"/>
      
      <!-- Price badge -->
      <rect x="760" y="340" width="220" height="80" rx="16" fill="#e53e3e"/>
      <text x="870" y="372" text-anchor="middle" font-family="Arial, sans-serif" font-weight="700" font-size="16" fill="white" opacity="0.9">
        POR APENAS
      </text>
      <text x="870" y="404" text-anchor="middle" font-family="Arial, sans-serif" font-weight="900" font-size="32" fill="white">
        R$ 103,77
      </text>
      
      <!-- Product names at bottom -->
      <text x="512" y="432" text-anchor="middle" font-family="Arial, sans-serif" font-weight="600" font-size="14" fill="white" opacity="0.7">
        Coronita 6un  +  Isca de Mignon Parmegiana  +  Guarana Zero
      </text>
    </svg>
  `);
}

async function generateCombo() {
  console.log("Downloading product images...");
  const images = await Promise.all(products.map((p) => fetchImage(p.url)));
  console.log("All images downloaded. Compositing...");

  const plusSign = createPlusSvg();

  // Positions: 3 products + 2 plus signs, centered
  const totalWidth = PRODUCT_SIZE * 3 + 40 * 2 + 20 * 2; // products + plus + gaps
  const startX = Math.floor((CANVAS_WIDTH - totalWidth) / 2);
  const productY = Math.floor((CANVAS_HEIGHT - PRODUCT_SIZE) / 2) + 15;

  const composites = [
    // Product 1
    { input: images[0], left: startX, top: productY },
    // Plus 1
    { input: plusSign, left: startX + PRODUCT_SIZE + 20, top: Math.floor(CANVAS_HEIGHT / 2) - 5 },
    // Product 2
    { input: images[1], left: startX + PRODUCT_SIZE + 40 + 20, top: productY },
    // Plus 2
    { input: plusSign, left: startX + PRODUCT_SIZE * 2 + 40 + 40, top: Math.floor(CANVAS_HEIGHT / 2) - 5 },
    // Product 3
    { input: images[2], left: startX + PRODUCT_SIZE * 2 + 80 + 40, top: productY },
  ];

  const background = await sharp(createTextOverlay()).png().toBuffer();

  await sharp(background)
    .composite(composites)
    .png()
    .toFile("public/combos/combo-coronita-mignon-guarana.png");

  console.log("Combo image saved to public/combos/combo-coronita-mignon-guarana.png");
}

generateCombo().catch(console.error);
