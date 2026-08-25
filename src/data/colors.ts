export interface ColorOption {
  name: string;
  hex: string;
  category: 'Green' | 'Black & Dark' | 'Red & Plum' | 'Blue & Teal' | 'Gold & Neutral' | 'Pink & Pastel' | 'Brown & Earth';
}

export const FASHION_COLORS_50: ColorOption[] = [
  // Greens
  { name: 'Emerald Green', hex: '#0B6623', category: 'Green' },
  { name: 'Olive Green', hex: '#556B2F', category: 'Green' },
  { name: 'Sage Green', hex: '#9DC183', category: 'Green' },
  { name: 'Teal Green', hex: '#008080', category: 'Green' },
  { name: 'Forest Green', hex: '#228B22', category: 'Green' },
  { name: 'Mint Green', hex: '#98FF98', category: 'Green' },
  { name: 'Seafoam Green', hex: '#9FE2BF', category: 'Green' },
  { name: 'Pistachio', hex: '#93C572', category: 'Green' },

  // Black & Darks
  { name: 'Midnight Black', hex: '#111111', category: 'Black & Dark' },
  { name: 'Obsidian Black', hex: '#0B0B0B', category: 'Black & Dark' },
  { name: 'Charcoal Grey', hex: '#36454F', category: 'Black & Dark' },
  { name: 'Slate Grey', hex: '#708090', category: 'Black & Dark' },
  { name: 'Midnight Navy', hex: '#00052C', category: 'Black & Dark' },

  // Reds, Plums & Berries
  { name: 'Burgundy Velvet', hex: '#800020', category: 'Red & Plum' },
  { name: 'Royal Plum', hex: '#4B0082', category: 'Red & Plum' },
  { name: 'Crimson Red', hex: '#DC143C', category: 'Red & Plum' },
  { name: 'Wine Red', hex: '#722F37', category: 'Red & Plum' },
  { name: 'Maroon', hex: '#800000', category: 'Red & Plum' },
  { name: 'Mulberry', hex: '#C54B8C', category: 'Red & Plum' },
  { name: 'Blush Red', hex: '#DE5D83', category: 'Red & Plum' },

  // Blues & Teals
  { name: 'Deep Navy', hex: '#000080', category: 'Blue & Teal' },
  { name: 'Dusty Blue', hex: '#8A9EA7', category: 'Blue & Teal' },
  { name: 'Sapphire Blue', hex: '#0F52BA', category: 'Blue & Teal' },
  { name: 'Periwinkle', hex: '#CCCCFF', category: 'Blue & Teal' },
  { name: 'Denim Blue', hex: '#1560BD', category: 'Blue & Teal' },
  { name: 'Royal Blue', hex: '#4169E1', category: 'Blue & Teal' },

  // Golds, Silvers & Neutrals
  { name: 'Champagne Gold', hex: '#F7E7CE', category: 'Gold & Neutral' },
  { name: 'Antique Gold', hex: '#CFB53B', category: 'Gold & Neutral' },
  { name: 'Rose Gold', hex: '#B76E79', category: 'Gold & Neutral' },
  { name: 'Pearl White', hex: '#FDFBF7', category: 'Gold & Neutral' },
  { name: 'Ivory White', hex: '#FFFFF0', category: 'Gold & Neutral' },
  { name: 'Silver Chrome', hex: '#C0C0C0', category: 'Gold & Neutral' },
  { name: 'Bronze', hex: '#CD7F32', category: 'Gold & Neutral' },

  // Pinks & Pastels
  { name: 'Dusty Pink', hex: '#DCAE96', category: 'Pink & Pastel' },
  { name: 'Soft Lavender', hex: '#E6E6FA', category: 'Pink & Pastel' },
  { name: 'Peach Pink', hex: '#FFE5B4', category: 'Pink & Pastel' },
  { name: 'Lilac', hex: '#C8A2C8', category: 'Pink & Pastel' },
  { name: 'Mauve', hex: '#E0B0FF', category: 'Pink & Pastel' },
  { name: 'Coral', hex: '#FF7F50', category: 'Pink & Pastel' },

  // Browns, Earth & Ochres
  { name: 'Oatmeal Beige', hex: '#E6D7C3', category: 'Brown & Earth' },
  { name: 'Terracotta', hex: '#E2725B', category: 'Brown & Earth' },
  { name: 'Mocha Brown', hex: '#967969', category: 'Brown & Earth' },
  { name: 'Taupe', hex: '#483C32', category: 'Brown & Earth' },
  { name: 'Rust', hex: '#B7410E', category: 'Brown & Earth' },
  { name: 'Copper', hex: '#B87333', category: 'Brown & Earth' },
  { name: 'Camel', hex: '#C19A6B', category: 'Brown & Earth' },
  { name: 'Chocolate', hex: '#7B3F00', category: 'Brown & Earth' },
  { name: 'Mustard Yellow', hex: '#FFDB58', category: 'Brown & Earth' },
  { name: 'Ochre', hex: '#CC7722', category: 'Brown & Earth' },
  { name: 'Cinnamon', hex: '#D2691E', category: 'Brown & Earth' },
  { name: 'Sand', hex: '#C2B280', category: 'Brown & Earth' }
];

// Helper: Auto-detect matching color from string or keyword
export function autoDetectColor(text: string): ColorOption {
  const clean = text.toLowerCase().trim();
  if (!clean) return FASHION_COLORS_50[0];

  // 1. Direct match
  const exact = FASHION_COLORS_50.find((c) => c.name.toLowerCase() === clean);
  if (exact) return exact;

  // 2. Partial word match
  const partial = FASHION_COLORS_50.find(
    (c) => clean.includes(c.name.toLowerCase()) || c.name.toLowerCase().includes(clean)
  );
  if (partial) return partial;

  // 3. Fallback color keywords
  if (clean.includes('black') || clean.includes('dark')) return FASHION_COLORS_50[8]; // Midnight Black
  if (clean.includes('gold') || clean.includes('yellow')) return FASHION_COLORS_50[26]; // Champagne Gold
  if (clean.includes('red') || clean.includes('burgundy')) return FASHION_COLORS_50[13]; // Burgundy
  if (clean.includes('blue') || clean.includes('navy')) return FASHION_COLORS_50[20]; // Deep Navy
  if (clean.includes('pink') || clean.includes('rose')) return FASHION_COLORS_50[33]; // Dusty Pink
  if (clean.includes('white') || clean.includes('pearl')) return FASHION_COLORS_50[29]; // Pearl White

  return FASHION_COLORS_50[0]; // Default Emerald Green
}

// Convert Hex (3 or 6 digit) to RGB object { r, g, b }
export function hexToRgb(hexInput: string): { r: number; g: number; b: number } | null {
  if (!hexInput) return null;
  let hex = hexInput.trim().replace(/^#/, '');
  
  if (hex.length === 3) {
    hex = hex.split('').map((char) => char + char).join('');
  }
  
  if (hex.length !== 6) return null;
  
  const num = parseInt(hex, 16);
  if (isNaN(num)) return null;
  
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255
  };
}

// Extended Reference List for Accurate Hex Color Naming
const EXTENDED_COLOR_DICTIONARY: { name: string; hex: string; category: ColorOption['category'] }[] = [
  { name: 'Pure White', hex: '#FFFFFF', category: 'Gold & Neutral' },
  { name: 'Off White', hex: '#FAF9F6', category: 'Gold & Neutral' },
  { name: 'Cream / Ivory', hex: '#FFFDD0', category: 'Gold & Neutral' },
  { name: 'Jet Black', hex: '#000000', category: 'Black & Dark' },
  { name: 'Pure Red', hex: '#FF0000', category: 'Red & Plum' },
  { name: 'Royal Crimson', hex: '#9B050B', category: 'Red & Plum' },
  { name: 'Maroon', hex: '#800000', category: 'Red & Plum' },
  { name: 'Burgundy', hex: '#800020', category: 'Red & Plum' },
  { name: 'Deep Navy', hex: '#000080', category: 'Blue & Teal' },
  { name: 'Royal Blue', hex: '#0000FF', category: 'Blue & Teal' },
  { name: 'Sky Blue', hex: '#87CEEB', category: 'Blue & Teal' },
  { name: 'Cyan / Aqua', hex: '#00FFFF', category: 'Blue & Teal' },
  { name: 'Emerald Green', hex: '#008000', category: 'Green' },
  { name: 'Lime Green', hex: '#00FF00', category: 'Green' },
  { name: 'Olive Green', hex: '#808000', category: 'Green' },
  { name: 'Sage Green', hex: '#9DC183', category: 'Green' },
  { name: 'Teal', hex: '#008080', category: 'Blue & Teal' },
  { name: 'Bright Yellow', hex: '#FFFF00', category: 'Gold & Neutral' },
  { name: 'Mustard Gold', hex: '#FFDB58', category: 'Gold & Neutral' },
  { name: 'Champagne Gold', hex: '#F7E7CE', category: 'Gold & Neutral' },
  { name: 'Orange / Coral', hex: '#FFA500', category: 'Pink & Pastel' },
  { name: 'Peach / Salmon', hex: '#FFDAB9', category: 'Pink & Pastel' },
  { name: 'Hot Pink', hex: '#FF69B4', category: 'Pink & Pastel' },
  { name: 'Baby Pink', hex: '#FFC0CB', category: 'Pink & Pastel' },
  { name: 'Dusty Rose', hex: '#DCAE96', category: 'Pink & Pastel' },
  { name: 'Soft Lavender', hex: '#E6E6FA', category: 'Pink & Pastel' },
  { name: 'Deep Purple', hex: '#800080', category: 'Red & Plum' },
  { name: 'Plum / Violet', hex: '#8A2BE2', category: 'Red & Plum' },
  { name: 'Beige / Sand', hex: '#F5F5DC', category: 'Brown & Earth' },
  { name: 'Taupe / Tan', hex: '#D2B48C', category: 'Brown & Earth' },
  { name: 'Mocha Brown', hex: '#4A3728', category: 'Brown & Earth' },
  { name: 'Charcoal Grey', hex: '#36454F', category: 'Black & Dark' },
  { name: 'Silver Grey', hex: '#C0C0C0', category: 'Gold & Neutral' }
];

// Helper: Determine human-readable color name from any Hex string (e.g. #fff -> White, #000 -> Black)
export function getColorNameFromHex(hexInput: string): { name: string; hex: string; category: string } {
  if (!hexInput) {
    return { name: 'Pure White', hex: '#FFFFFF', category: 'Gold & Neutral' };
  }

  let formattedHex = hexInput.trim().toUpperCase();
  if (!formattedHex.startsWith('#')) {
    formattedHex = `#${formattedHex}`;
  }

  // Handle 3-digit hex (#FFF -> #FFFFFF)
  if (formattedHex.length === 4) {
    formattedHex = `#${formattedHex[1]}${formattedHex[1]}${formattedHex[2]}${formattedHex[2]}${formattedHex[3]}${formattedHex[3]}`;
  }

  const targetRgb = hexToRgb(formattedHex);
  if (!targetRgb) {
    return { name: 'Custom Shade', hex: formattedHex, category: 'Gold & Neutral' };
  }

  // Combine fashion 50 + extended dictionary for matching
  const allPalette = [...FASHION_COLORS_50, ...EXTENDED_COLOR_DICTIONARY];
  
  let closestColor = allPalette[0];
  let minDistance = Infinity;

  for (const item of allPalette) {
    const itemRgb = hexToRgb(item.hex);
    if (!itemRgb) continue;

    // Euclidean distance in RGB color space
    const distance = Math.sqrt(
      Math.pow(targetRgb.r - itemRgb.r, 2) +
      Math.pow(targetRgb.g - itemRgb.g, 2) +
      Math.pow(targetRgb.b - itemRgb.b, 2)
    );

    if (distance === 0) {
      return { name: item.name, hex: formattedHex, category: item.category };
    }

    if (distance < minDistance) {
      minDistance = distance;
      closestColor = item;
    }
  }

  return {
    name: closestColor.name,
    hex: formattedHex,
    category: closestColor.category
  };
}

