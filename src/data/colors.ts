export interface ColorOption {
  name: string;
  hex: string;
  category: 'Green' | 'Black & Dark' | 'Red & Plum' | 'Blue & Teal' | 'Gold & Neutral' | 'Pink & Pastel' | 'Brown & Earth';
}

export const FASHION_COLORS_50: ColorOption[] = [
  // Greens
  { name: 'Emerald Green',   hex: '#0B6623', category: 'Green' },
  { name: 'Olive Green',     hex: '#556B2F', category: 'Green' },
  { name: 'Sage Green',      hex: '#9DC183', category: 'Green' },
  { name: 'Teal Green',      hex: '#008080', category: 'Green' },
  { name: 'Forest Green',    hex: '#228B22', category: 'Green' },
  { name: 'Mint Green',      hex: '#98FF98', category: 'Green' },
  { name: 'Seafoam Green',   hex: '#9FE2BF', category: 'Green' },
  { name: 'Pistachio',       hex: '#93C572', category: 'Green' },
  { name: 'Lime Green',      hex: '#32CD32', category: 'Green' },
  { name: 'Hunter Green',    hex: '#355E3B', category: 'Green' },
  { name: 'Bottle Green',    hex: '#006A4E', category: 'Green' },
  { name: 'Fern Green',      hex: '#4F7942', category: 'Green' },
  { name: 'Jade Green',      hex: '#00A86B', category: 'Green' },
  { name: 'Moss Green',      hex: '#8A9A5B', category: 'Green' },
  { name: 'Avocado Green',   hex: '#568203', category: 'Green' },
  // Black & Darks
  { name: 'Midnight Black',  hex: '#111111', category: 'Black & Dark' },
  { name: 'Jet Black',       hex: '#000000', category: 'Black & Dark' },
  { name: 'Obsidian Black',  hex: '#0B0B0B', category: 'Black & Dark' },
  { name: 'Charcoal Grey',   hex: '#36454F', category: 'Black & Dark' },
  { name: 'Slate Grey',      hex: '#708090', category: 'Black & Dark' },
  { name: 'Dark Grey',       hex: '#444444', category: 'Black & Dark' },
  { name: 'Gunmetal',        hex: '#2C3539', category: 'Black & Dark' },
  { name: 'Midnight Navy',   hex: '#00052C', category: 'Black & Dark' },
  { name: 'Space Grey',      hex: '#717C7E', category: 'Black & Dark' },
  { name: 'Iron Grey',       hex: '#48494B', category: 'Black & Dark' },
  // Reds, Plums & Berries
  { name: 'Burgundy Velvet', hex: '#800020', category: 'Red & Plum' },
  { name: 'Royal Plum',      hex: '#4B0082', category: 'Red & Plum' },
  { name: 'Crimson Red',     hex: '#DC143C', category: 'Red & Plum' },
  { name: 'Wine Red',        hex: '#722F37', category: 'Red & Plum' },
  { name: 'Maroon',          hex: '#800000', category: 'Red & Plum' },
  { name: 'Mulberry',        hex: '#C54B8C', category: 'Red & Plum' },
  { name: 'Blush Red',       hex: '#DE5D83', category: 'Red & Plum' },
  { name: 'Aubergine',       hex: '#580F41', category: 'Red & Plum' },
  { name: 'Eggplant',        hex: '#614051', category: 'Red & Plum' },
  { name: 'Raspberry',       hex: '#872657', category: 'Red & Plum' },
  { name: 'Ruby Red',        hex: '#9B111E', category: 'Red & Plum' },
  { name: 'Scarlet',         hex: '#FF2400', category: 'Red & Plum' },
  { name: 'Cherry',          hex: '#DE3163', category: 'Red & Plum' },
  { name: 'Mahogany Red',    hex: '#C04000', category: 'Red & Plum' },
  { name: 'Oxblood',         hex: '#4A0000', category: 'Red & Plum' },
  // Blues & Teals
  { name: 'Deep Navy',       hex: '#000080', category: 'Blue & Teal' },
  { name: 'Dusty Blue',      hex: '#8A9EA7', category: 'Blue & Teal' },
  { name: 'Sapphire Blue',   hex: '#0F52BA', category: 'Blue & Teal' },
  { name: 'Periwinkle',      hex: '#CCCCFF', category: 'Blue & Teal' },
  { name: 'Denim Blue',      hex: '#1560BD', category: 'Blue & Teal' },
  { name: 'Royal Blue',      hex: '#4169E1', category: 'Blue & Teal' },
  { name: 'Cobalt Blue',     hex: '#0047AB', category: 'Blue & Teal' },
  { name: 'Teal',            hex: '#008080', category: 'Blue & Teal' },
  { name: 'Turquoise',       hex: '#40E0D0', category: 'Blue & Teal' },
  { name: 'Indigo',          hex: '#4B0082', category: 'Blue & Teal' },
  { name: 'Steel Blue',      hex: '#4682B4', category: 'Blue & Teal' },
  { name: 'Sky Blue',        hex: '#87CEEB', category: 'Blue & Teal' },
  { name: 'Powder Blue',     hex: '#B0E0E6', category: 'Blue & Teal' },
  { name: 'Baby Blue',       hex: '#89CFF0', category: 'Blue & Teal' },
  { name: 'Electric Blue',   hex: '#7DF9FF', category: 'Blue & Teal' },
  { name: 'Ocean Blue',      hex: '#4F42B5', category: 'Blue & Teal' },
  { name: 'Ice Blue',        hex: '#D6E7F5', category: 'Blue & Teal' },
  { name: 'Cerulean',        hex: '#2A52BE', category: 'Blue & Teal' },
  { name: 'Prussian Blue',   hex: '#003153', category: 'Blue & Teal' },
  // Golds, Silvers & Neutrals
  { name: 'Champagne Gold',  hex: '#F7E7CE', category: 'Gold & Neutral' },
  { name: 'Antique Gold',    hex: '#CFB53B', category: 'Gold & Neutral' },
  { name: 'Rose Gold',       hex: '#B76E79', category: 'Gold & Neutral' },
  { name: 'Pearl White',     hex: '#FDFBF7', category: 'Gold & Neutral' },
  { name: 'Ivory White',     hex: '#FFFFF0', category: 'Gold & Neutral' },
  { name: 'Silver Chrome',   hex: '#C0C0C0', category: 'Gold & Neutral' },
  { name: 'Bronze',          hex: '#CD7F32', category: 'Gold & Neutral' },
  { name: 'Saffron Gold',    hex: '#F4C430', category: 'Gold & Neutral' },
  { name: 'Pure White',      hex: '#FFFFFF', category: 'Gold & Neutral' },
  { name: 'Off White',       hex: '#FAF9F6', category: 'Gold & Neutral' },
  { name: 'Cream',           hex: '#FFFDD0', category: 'Gold & Neutral' },
  { name: 'Warm White',      hex: '#FDF5E6', category: 'Gold & Neutral' },
  { name: 'Platinum',        hex: '#E5E4E2', category: 'Gold & Neutral' },
  // Pinks & Pastels
  { name: 'Dusty Pink',      hex: '#DCAE96', category: 'Pink & Pastel' },
  { name: 'Soft Lavender',   hex: '#E6E6FA', category: 'Pink & Pastel' },
  { name: 'Peach Pink',      hex: '#FFE5B4', category: 'Pink & Pastel' },
  { name: 'Lilac',           hex: '#C8A2C8', category: 'Pink & Pastel' },
  { name: 'Mauve',           hex: '#E0B0FF', category: 'Pink & Pastel' },
  { name: 'Coral',           hex: '#FF7F50', category: 'Pink & Pastel' },
  { name: 'Rose Pink',       hex: '#FF007F', category: 'Pink & Pastel' },
  { name: 'Salmon',          hex: '#FA8072', category: 'Pink & Pastel' },
  { name: 'Hot Pink',        hex: '#FF69B4', category: 'Pink & Pastel' },
  { name: 'Baby Pink',       hex: '#FFC0CB', category: 'Pink & Pastel' },
  { name: 'Blush Pink',      hex: '#FFB6C1', category: 'Pink & Pastel' },
  { name: 'Orchid',          hex: '#DA70D6', category: 'Pink & Pastel' },
  { name: 'Fuchsia',         hex: '#FF00FF', category: 'Pink & Pastel' },
  { name: 'Magenta',         hex: '#CA1F7B', category: 'Pink & Pastel' },
  { name: 'Pastel Pink',     hex: '#FFD1DC', category: 'Pink & Pastel' },
  { name: 'Rose Quartz',     hex: '#F7CAC9', category: 'Pink & Pastel' },
  { name: 'Dusty Rose',      hex: '#C08081', category: 'Pink & Pastel' },
  { name: 'Flamingo Pink',   hex: '#FC8EAC', category: 'Pink & Pastel' },
  // Browns, Earth & Ochres
  { name: 'Oatmeal Beige',   hex: '#E6D7C3', category: 'Brown & Earth' },
  { name: 'Terracotta',      hex: '#E2725B', category: 'Brown & Earth' },
  { name: 'Mocha Brown',     hex: '#967969', category: 'Brown & Earth' },
  { name: 'Taupe',           hex: '#483C32', category: 'Brown & Earth' },
  { name: 'Rust',            hex: '#B7410E', category: 'Brown & Earth' },
  { name: 'Copper',          hex: '#B87333', category: 'Brown & Earth' },
  { name: 'Camel',           hex: '#C19A6B', category: 'Brown & Earth' },
  { name: 'Chocolate',       hex: '#7B3F00', category: 'Brown & Earth' },
  { name: 'Mustard Yellow',  hex: '#FFDB58', category: 'Brown & Earth' },
  { name: 'Ochre',           hex: '#CC7722', category: 'Brown & Earth' },
  { name: 'Cinnamon',        hex: '#D2691E', category: 'Brown & Earth' },
  { name: 'Sand',            hex: '#C2B280', category: 'Brown & Earth' },
  { name: 'Mahogany',        hex: '#C04000', category: 'Brown & Earth' },
  { name: 'Walnut Brown',    hex: '#5C3317', category: 'Brown & Earth' },
  { name: 'Chestnut',        hex: '#954535', category: 'Brown & Earth' },
  { name: 'Warm Tan',        hex: '#D2A679', category: 'Brown & Earth' },
  { name: 'Clay',            hex: '#B66A50', category: 'Brown & Earth' },
  { name: 'Wheat',           hex: '#F5DEB3', category: 'Brown & Earth' },
  { name: 'Khaki',           hex: '#C3B091', category: 'Brown & Earth' },
];

// Extended Reference List for Accurate Hex Color Naming (~300 extra entries)
const EXTENDED_COLOR_DICTIONARY: { name: string; hex: string; category: ColorOption['category'] }[] = [
  // Whites & Near-Whites
  { name: 'Pure White',        hex: '#FFFFFF', category: 'Gold & Neutral' },
  { name: 'Snow White',        hex: '#FFFAFA', category: 'Gold & Neutral' },
  { name: 'Ghost White',       hex: '#F8F8FF', category: 'Gold & Neutral' },
  { name: 'Seashell White',    hex: '#FFF5EE', category: 'Gold & Neutral' },
  { name: 'Floral White',      hex: '#FFFAF0', category: 'Gold & Neutral' },
  { name: 'Linen White',       hex: '#FAF0E6', category: 'Gold & Neutral' },
  { name: 'Old Lace',          hex: '#FDF5E6', category: 'Gold & Neutral' },
  { name: 'Ivory',             hex: '#FFFFF0', category: 'Gold & Neutral' },
  { name: 'Cream',             hex: '#FFFDD0', category: 'Gold & Neutral' },
  { name: 'Off White',         hex: '#FAF9F6', category: 'Gold & Neutral' },
  { name: 'Pearl',             hex: '#F0EAD6', category: 'Gold & Neutral' },
  { name: 'Antique White',     hex: '#FAEBD7', category: 'Gold & Neutral' },
  { name: 'Alabaster',         hex: '#F2F0EB', category: 'Gold & Neutral' },
  { name: 'Eggshell',          hex: '#F0EAD6', category: 'Gold & Neutral' },
  { name: 'Vanilla',           hex: '#F3E5AB', category: 'Gold & Neutral' },
  { name: 'Cornsilk',          hex: '#FFF8DC', category: 'Gold & Neutral' },
  { name: 'Bisque',            hex: '#FFE4C4', category: 'Gold & Neutral' },
  { name: 'Moccasin',          hex: '#FFE4B5', category: 'Gold & Neutral' },
  { name: 'Papaya Whip',       hex: '#FFEFD5', category: 'Gold & Neutral' },
  { name: 'Blanched Almond',   hex: '#FFEBCD', category: 'Gold & Neutral' },
  // Greys
  { name: 'Platinum Grey',     hex: '#E5E4E2', category: 'Gold & Neutral' },
  { name: 'Silver',            hex: '#C0C0C0', category: 'Gold & Neutral' },
  { name: 'Light Grey',        hex: '#D3D3D3', category: 'Black & Dark' },
  { name: 'Gainsboro',         hex: '#DCDCDC', category: 'Black & Dark' },
  { name: 'Ash Grey',          hex: '#B2BEB5', category: 'Black & Dark' },
  { name: 'Misty Grey',        hex: '#C9C0BB', category: 'Black & Dark' },
  { name: 'Cool Grey',         hex: '#9090C0', category: 'Black & Dark' },
  { name: 'Stone Grey',        hex: '#928E85', category: 'Black & Dark' },
  { name: 'Pebble Grey',       hex: '#878681', category: 'Black & Dark' },
  { name: 'Medium Grey',       hex: '#808080', category: 'Black & Dark' },
  { name: 'Dim Grey',          hex: '#696969', category: 'Black & Dark' },
  { name: 'Storm Grey',        hex: '#616D7E', category: 'Black & Dark' },
  { name: 'Dark Slate Grey',   hex: '#2F4F4F', category: 'Black & Dark' },
  { name: 'Dark Grey',         hex: '#444444', category: 'Black & Dark' },
  { name: 'Gunmetal',          hex: '#2C3539', category: 'Black & Dark' },
  { name: 'Iron',              hex: '#48494B', category: 'Black & Dark' },
  { name: 'Jet',               hex: '#343434', category: 'Black & Dark' },
  { name: 'Onyx',              hex: '#353839', category: 'Black & Dark' },
  { name: 'Ebony',             hex: '#555D50', category: 'Black & Dark' },
  { name: 'Jet Black',         hex: '#000000', category: 'Black & Dark' },
  { name: 'Midnight Black',    hex: '#111111', category: 'Black & Dark' },
  { name: 'Obsidian',          hex: '#0B0B0B', category: 'Black & Dark' },
  { name: 'Midnight Navy',     hex: '#00052C', category: 'Black & Dark' },
  { name: 'Dark Charcoal',     hex: '#333333', category: 'Black & Dark' },
  // Reds
  { name: 'Pure Red',          hex: '#FF0000', category: 'Red & Plum' },
  { name: 'Scarlet',           hex: '#FF2400', category: 'Red & Plum' },
  { name: 'Crimson',           hex: '#DC143C', category: 'Red & Plum' },
  { name: 'Fire Red',          hex: '#CE2029', category: 'Red & Plum' },
  { name: 'Tomato Red',        hex: '#FF6347', category: 'Red & Plum' },
  { name: 'Indian Red',        hex: '#CD5C5C', category: 'Red & Plum' },
  { name: 'Light Coral',       hex: '#F08080', category: 'Red & Plum' },
  { name: 'Ruby',              hex: '#9B111E', category: 'Red & Plum' },
  { name: 'Cardinal Red',      hex: '#C41E3A', category: 'Red & Plum' },
  { name: 'Vermilion',         hex: '#E34234', category: 'Red & Plum' },
  { name: 'Imperial Red',      hex: '#ED2939', category: 'Red & Plum' },
  { name: 'Alizarin',          hex: '#E32636', category: 'Red & Plum' },
  { name: 'Lava Red',          hex: '#CF1020', category: 'Red & Plum' },
  { name: 'Venetian Red',      hex: '#C80815', category: 'Red & Plum' },
  { name: 'Chili Red',         hex: '#C21807', category: 'Red & Plum' },
  { name: 'Brick Red',         hex: '#CB4154', category: 'Red & Plum' },
  // Maroons / Burgundies
  { name: 'Maroon',            hex: '#800000', category: 'Red & Plum' },
  { name: 'Dark Red',          hex: '#8B0000', category: 'Red & Plum' },
  { name: 'Burgundy',          hex: '#800020', category: 'Red & Plum' },
  { name: 'Deep Burgundy',     hex: '#6D0F1B', category: 'Red & Plum' },
  { name: 'Wine',              hex: '#722F37', category: 'Red & Plum' },
  { name: 'Claret',            hex: '#7F1734', category: 'Red & Plum' },
  { name: 'Oxblood',           hex: '#4A0000', category: 'Red & Plum' },
  { name: 'Royal Crimson',     hex: '#9B050B', category: 'Red & Plum' },
  // Plums / Purples
  { name: 'Purple',            hex: '#800080', category: 'Red & Plum' },
  { name: 'Dark Purple',       hex: '#301934', category: 'Red & Plum' },
  { name: 'Deep Purple',       hex: '#673AB7', category: 'Red & Plum' },
  { name: 'Violet',            hex: '#8A2BE2', category: 'Red & Plum' },
  { name: 'Blue Violet',       hex: '#7B68EE', category: 'Red & Plum' },
  { name: 'Amethyst',          hex: '#9966CC', category: 'Red & Plum' },
  { name: 'Royal Purple',      hex: '#7851A9', category: 'Red & Plum' },
  { name: 'Grape',             hex: '#6F2DA8', category: 'Red & Plum' },
  { name: 'Indigo Purple',     hex: '#4B0082', category: 'Red & Plum' },
  { name: 'Wisteria',          hex: '#C9A0DC', category: 'Red & Plum' },
  { name: 'Heather',           hex: '#B69BC0', category: 'Red & Plum' },
  { name: 'Plum',              hex: '#DDA0DD', category: 'Red & Plum' },
  { name: 'Thistle',           hex: '#D8BFD8', category: 'Red & Plum' },
  { name: 'Mulberry',          hex: '#C54B8C', category: 'Red & Plum' },
  { name: 'Raspberry',         hex: '#872657', category: 'Red & Plum' },
  { name: 'Orchid Pink',       hex: '#DA70D6', category: 'Red & Plum' },
  // Pinks
  { name: 'Hot Pink',          hex: '#FF69B4', category: 'Pink & Pastel' },
  { name: 'Fuchsia',           hex: '#FF00FF', category: 'Pink & Pastel' },
  { name: 'Magenta',           hex: '#CA1F7B', category: 'Pink & Pastel' },
  { name: 'Deep Pink',         hex: '#FF1493', category: 'Pink & Pastel' },
  { name: 'Neon Pink',         hex: '#FF6EC7', category: 'Pink & Pastel' },
  { name: 'Shocking Pink',     hex: '#FC0FC0', category: 'Pink & Pastel' },
  { name: 'Barbie Pink',       hex: '#E75480', category: 'Pink & Pastel' },
  { name: 'Ultra Pink',        hex: '#FF6FFF', category: 'Pink & Pastel' },
  { name: 'Rose Pink',         hex: '#FF007F', category: 'Pink & Pastel' },
  { name: 'Cherry Blossom',    hex: '#FFB7C5', category: 'Pink & Pastel' },
  { name: 'Flamingo',          hex: '#FC8EAC', category: 'Pink & Pastel' },
  { name: 'Carnation Pink',    hex: '#FFA6C9', category: 'Pink & Pastel' },
  { name: 'Baby Pink',         hex: '#FFC0CB', category: 'Pink & Pastel' },
  { name: 'Blush Pink',        hex: '#FFB6C1', category: 'Pink & Pastel' },
  { name: 'Petal Pink',        hex: '#FFD1DC', category: 'Pink & Pastel' },
  { name: 'Rose Quartz',       hex: '#F7CAC9', category: 'Pink & Pastel' },
  { name: 'Dusty Rose',        hex: '#C08081', category: 'Pink & Pastel' },
  { name: 'Blush',             hex: '#DCAE96', category: 'Pink & Pastel' },
  { name: 'Mauve Pink',        hex: '#E0B0FF', category: 'Pink & Pastel' },
  { name: 'Bubblegum Pink',    hex: '#FE6CA0', category: 'Pink & Pastel' },
  { name: 'Watermelon Pink',   hex: '#FC6C85', category: 'Pink & Pastel' },
  // Peaches & Corals
  { name: 'Peach',             hex: '#FFCBA4', category: 'Pink & Pastel' },
  { name: 'Light Peach',       hex: '#FFDAB9', category: 'Pink & Pastel' },
  { name: 'Coral',             hex: '#FF7F50', category: 'Pink & Pastel' },
  { name: 'Salmon Pink',       hex: '#FF9999', category: 'Pink & Pastel' },
  { name: 'Apricot',           hex: '#FBCEB1', category: 'Pink & Pastel' },
  { name: 'Melon',             hex: '#FEBAAD', category: 'Pink & Pastel' },
  { name: 'Light Salmon',      hex: '#FFA07A', category: 'Pink & Pastel' },
  // Lavenders
  { name: 'Lavender',          hex: '#E6E6FA', category: 'Pink & Pastel' },
  { name: 'Light Lavender',    hex: '#F0E6FF', category: 'Pink & Pastel' },
  { name: 'Soft Lavender',     hex: '#D8B4FE', category: 'Pink & Pastel' },
  { name: 'Lilac',             hex: '#C8A2C8', category: 'Pink & Pastel' },
  { name: 'Periwinkle Blue',   hex: '#CCCCFF', category: 'Pink & Pastel' },
  { name: 'Lavender Blush',    hex: '#FFF0F5', category: 'Pink & Pastel' },
  { name: 'Thistle Purple',    hex: '#D8BFD8', category: 'Pink & Pastel' },
  // Blues
  { name: 'Pure Blue',         hex: '#0000FF', category: 'Blue & Teal' },
  { name: 'Navy Blue',         hex: '#000080', category: 'Blue & Teal' },
  { name: 'Dark Navy',         hex: '#001133', category: 'Blue & Teal' },
  { name: 'Midnight Blue',     hex: '#191970', category: 'Blue & Teal' },
  { name: 'Royal Blue',        hex: '#4169E1', category: 'Blue & Teal' },
  { name: 'Cobalt Blue',       hex: '#0047AB', category: 'Blue & Teal' },
  { name: 'Sapphire',          hex: '#0F52BA', category: 'Blue & Teal' },
  { name: 'Denim Blue',        hex: '#1560BD', category: 'Blue & Teal' },
  { name: 'Indigo Blue',       hex: '#4B0082', category: 'Blue & Teal' },
  { name: 'Steel Blue',        hex: '#4682B4', category: 'Blue & Teal' },
  { name: 'Cornflower Blue',   hex: '#6495ED', category: 'Blue & Teal' },
  { name: 'Dodger Blue',       hex: '#1E90FF', category: 'Blue & Teal' },
  { name: 'Deep Sky Blue',     hex: '#00BFFF', category: 'Blue & Teal' },
  { name: 'Sky Blue',          hex: '#87CEEB', category: 'Blue & Teal' },
  { name: 'Light Sky Blue',    hex: '#87CEFA', category: 'Blue & Teal' },
  { name: 'Baby Blue',         hex: '#89CFF0', category: 'Blue & Teal' },
  { name: 'Powder Blue',       hex: '#B0E0E6', category: 'Blue & Teal' },
  { name: 'Columbia Blue',     hex: '#C4D8E2', category: 'Blue & Teal' },
  { name: 'Slate Blue',        hex: '#6A5ACD', category: 'Blue & Teal' },
  { name: 'Alice Blue',        hex: '#F0F8FF', category: 'Blue & Teal' },
  { name: 'Azure Blue',        hex: '#F0FFFF', category: 'Blue & Teal' },
  { name: 'Cadet Blue',        hex: '#5F9EA0', category: 'Blue & Teal' },
  { name: 'Cerulean',          hex: '#2A52BE', category: 'Blue & Teal' },
  { name: 'French Blue',       hex: '#0072BB', category: 'Blue & Teal' },
  { name: 'Han Blue',          hex: '#446CCF', category: 'Blue & Teal' },
  { name: 'Prussian Blue',     hex: '#003153', category: 'Blue & Teal' },
  { name: 'Klein Blue',        hex: '#002FA7', category: 'Blue & Teal' },
  { name: 'Carolina Blue',     hex: '#56A0D3', category: 'Blue & Teal' },
  { name: 'Dusty Blue',        hex: '#8A9EA7', category: 'Blue & Teal' },
  { name: 'Periwinkle',        hex: '#CCCCFF', category: 'Blue & Teal' },
  // Teals & Cyans
  { name: 'Teal',              hex: '#008080', category: 'Blue & Teal' },
  { name: 'Dark Teal',         hex: '#004C4C', category: 'Blue & Teal' },
  { name: 'Light Teal',        hex: '#66CCCC', category: 'Blue & Teal' },
  { name: 'Turquoise',         hex: '#40E0D0', category: 'Blue & Teal' },
  { name: 'Medium Turquoise',  hex: '#48D1CC', category: 'Blue & Teal' },
  { name: 'Dark Turquoise',    hex: '#00CED1', category: 'Blue & Teal' },
  { name: 'Aqua',              hex: '#00FFFF', category: 'Blue & Teal' },
  { name: 'Cyan',              hex: '#00FFFF', category: 'Blue & Teal' },
  { name: 'Aquamarine',        hex: '#7FFFD4', category: 'Blue & Teal' },
  { name: 'Seafoam',           hex: '#93E9BE', category: 'Blue & Teal' },
  { name: 'Electric Cyan',     hex: '#7DF9FF', category: 'Blue & Teal' },
  { name: 'Robin Egg Blue',    hex: '#00CCCC', category: 'Blue & Teal' },
  // Greens
  { name: 'Pure Green',        hex: '#008000', category: 'Green' },
  { name: 'Dark Green',        hex: '#006400', category: 'Green' },
  { name: 'Hunter Green',      hex: '#355E3B', category: 'Green' },
  { name: 'Forest Green',      hex: '#228B22', category: 'Green' },
  { name: 'Bottle Green',      hex: '#006A4E', category: 'Green' },
  { name: 'Emerald Green',     hex: '#0B6623', category: 'Green' },
  { name: 'Jade Green',        hex: '#00A86B', category: 'Green' },
  { name: 'Fern Green',        hex: '#4F7942', category: 'Green' },
  { name: 'Moss Green',        hex: '#8A9A5B', category: 'Green' },
  { name: 'Olive Green',       hex: '#808000', category: 'Green' },
  { name: 'Army Green',        hex: '#4B5320', category: 'Green' },
  { name: 'Camouflage Green',  hex: '#78866B', category: 'Green' },
  { name: 'Medium Green',      hex: '#3CB371', category: 'Green' },
  { name: 'Sea Green',         hex: '#2E8B57', category: 'Green' },
  { name: 'Mint Green',        hex: '#98FF98', category: 'Green' },
  { name: 'Sage Green',        hex: '#9DC183', category: 'Green' },
  { name: 'Tea Green',         hex: '#D0F0C0', category: 'Green' },
  { name: 'Pastel Green',      hex: '#77DD77', category: 'Green' },
  { name: 'Light Green',       hex: '#90EE90', category: 'Green' },
  { name: 'Seafoam Green',     hex: '#9FE2BF', category: 'Green' },
  { name: 'Pistachio Green',   hex: '#93C572', category: 'Green' },
  { name: 'Avocado Green',     hex: '#568203', category: 'Green' },
  { name: 'Lime Green',        hex: '#32CD32', category: 'Green' },
  { name: 'Yellow Green',      hex: '#9ACD32', category: 'Green' },
  { name: 'Chartreuse',        hex: '#7FFF00', category: 'Green' },
  { name: 'Lawn Green',        hex: '#7CFC00', category: 'Green' },
  { name: 'Spring Green',      hex: '#00FF7F', category: 'Green' },
  { name: 'Neon Green',        hex: '#39FF14', category: 'Green' },
  { name: 'Pear Green',        hex: '#D1E231', category: 'Green' },
  { name: 'Honeydew',          hex: '#F0FFF0', category: 'Green' },
  { name: 'Teal Green',        hex: '#006666', category: 'Green' },
  { name: 'Viridian',          hex: '#40826D', category: 'Green' },
  { name: 'Malachite',         hex: '#0BDA51', category: 'Green' },
  // Yellows
  { name: 'Bright Yellow',     hex: '#FFFF00', category: 'Gold & Neutral' },
  { name: 'Lemon Yellow',      hex: '#FFF44F', category: 'Gold & Neutral' },
  { name: 'Canary Yellow',     hex: '#FFEF00', category: 'Gold & Neutral' },
  { name: 'Mustard Yellow',    hex: '#FFDB58', category: 'Gold & Neutral' },
  { name: 'Golden Yellow',     hex: '#FFC200', category: 'Gold & Neutral' },
  { name: 'Amber Yellow',      hex: '#FFBF00', category: 'Gold & Neutral' },
  { name: 'Saffron Yellow',    hex: '#F4C430', category: 'Gold & Neutral' },
  { name: 'Sunflower Yellow',  hex: '#FFD700', category: 'Gold & Neutral' },
  { name: 'Maize Yellow',      hex: '#FBEC5D', category: 'Gold & Neutral' },
  { name: 'Butter Yellow',     hex: '#FFFACD', category: 'Gold & Neutral' },
  { name: 'Cream Yellow',      hex: '#FFFDD0', category: 'Gold & Neutral' },
  { name: 'Khaki Yellow',      hex: '#F0E68C', category: 'Gold & Neutral' },
  { name: 'Pale Yellow',       hex: '#FFFFE0', category: 'Gold & Neutral' },
  { name: 'Light Yellow',      hex: '#FFFF99', category: 'Gold & Neutral' },
  { name: 'Straw Yellow',      hex: '#E4D96F', category: 'Gold & Neutral' },
  // Golds & Bronzes
  { name: 'Gold',              hex: '#FFD700', category: 'Gold & Neutral' },
  { name: 'Old Gold',          hex: '#CFB53B', category: 'Gold & Neutral' },
  { name: 'Antique Gold',      hex: '#B8860B', category: 'Gold & Neutral' },
  { name: 'Champagne Gold',    hex: '#F7E7CE', category: 'Gold & Neutral' },
  { name: 'Metallic Gold',     hex: '#D4AF37', category: 'Gold & Neutral' },
  { name: 'Vegas Gold',        hex: '#C5B358', category: 'Gold & Neutral' },
  { name: 'Bronze',            hex: '#CD7F32', category: 'Gold & Neutral' },
  { name: 'Dark Bronze',       hex: '#804A00', category: 'Gold & Neutral' },
  { name: 'Copper Gold',       hex: '#B87333', category: 'Gold & Neutral' },
  { name: 'Rose Gold',         hex: '#B76E79', category: 'Gold & Neutral' },
  { name: 'Pale Gold',         hex: '#EEC900', category: 'Gold & Neutral' },
  // Oranges
  { name: 'Pure Orange',       hex: '#FFA500', category: 'Brown & Earth' },
  { name: 'Dark Orange',       hex: '#FF8C00', category: 'Brown & Earth' },
  { name: 'Deep Orange',       hex: '#FF6600', category: 'Brown & Earth' },
  { name: 'Burnt Orange',      hex: '#CC5500', category: 'Brown & Earth' },
  { name: 'Tangerine',         hex: '#F28500', category: 'Brown & Earth' },
  { name: 'Pumpkin Orange',    hex: '#FF7518', category: 'Brown & Earth' },
  { name: 'Mango Orange',      hex: '#FF9000', category: 'Brown & Earth' },
  { name: 'Persimmon',         hex: '#EC5800', category: 'Brown & Earth' },
  { name: 'Clementine',        hex: '#E96A09', category: 'Brown & Earth' },
  { name: 'Tiger Orange',      hex: '#FD6A02', category: 'Brown & Earth' },
  // Browns & Earth
  { name: 'Brown',             hex: '#A52A2A', category: 'Brown & Earth' },
  { name: 'Walnut Brown',      hex: '#5C3317', category: 'Brown & Earth' },
  { name: 'Chocolate Brown',   hex: '#7B3F00', category: 'Brown & Earth' },
  { name: 'Chestnut',          hex: '#954535', category: 'Brown & Earth' },
  { name: 'Sienna',            hex: '#A0522D', category: 'Brown & Earth' },
  { name: 'Saddle Brown',      hex: '#8B4513', category: 'Brown & Earth' },
  { name: 'Peru',              hex: '#CD853F', category: 'Brown & Earth' },
  { name: 'Sandy Brown',       hex: '#F4A460', category: 'Brown & Earth' },
  { name: 'Dark Sienna',       hex: '#882D17', category: 'Brown & Earth' },
  { name: 'Burnt Sienna',      hex: '#E97451', category: 'Brown & Earth' },
  { name: 'Cinnamon',          hex: '#D2691E', category: 'Brown & Earth' },
  { name: 'Rust',              hex: '#B7410E', category: 'Brown & Earth' },
  { name: 'Dark Rust',         hex: '#993300', category: 'Brown & Earth' },
  { name: 'Mahogany',          hex: '#C04000', category: 'Brown & Earth' },
  { name: 'Terracotta',        hex: '#E2725B', category: 'Brown & Earth' },
  { name: 'Brick',             hex: '#CB4154', category: 'Brown & Earth' },
  { name: 'Clay',              hex: '#B66A50', category: 'Brown & Earth' },
  { name: 'Mocha',             hex: '#967969', category: 'Brown & Earth' },
  { name: 'Coffee Brown',      hex: '#6F4E37', category: 'Brown & Earth' },
  { name: 'Espresso',          hex: '#5A3825', category: 'Brown & Earth' },
  { name: 'Dark Mocha',        hex: '#4A3728', category: 'Brown & Earth' },
  { name: 'Umber',             hex: '#635147', category: 'Brown & Earth' },
  { name: 'Dark Umber',        hex: '#402518', category: 'Brown & Earth' },
  { name: 'Taupe',             hex: '#483C32', category: 'Brown & Earth' },
  { name: 'Dark Taupe',        hex: '#4B3832', category: 'Brown & Earth' },
  { name: 'Rosy Brown',        hex: '#BC8F8F', category: 'Brown & Earth' },
  { name: 'Warm Tan',          hex: '#D2A679', category: 'Brown & Earth' },
  { name: 'Caramel',           hex: '#C68642', category: 'Brown & Earth' },
  { name: 'Camel',             hex: '#C19A6B', category: 'Brown & Earth' },
  { name: 'Tan',               hex: '#D2B48C', category: 'Brown & Earth' },
  { name: 'Sand',              hex: '#C2B280', category: 'Brown & Earth' },
  { name: 'Desert Sand',       hex: '#EDC9AF', category: 'Brown & Earth' },
  { name: 'Wheat',             hex: '#F5DEB3', category: 'Brown & Earth' },
  { name: 'Khaki',             hex: '#C3B091', category: 'Brown & Earth' },
  { name: 'Dark Khaki',        hex: '#BDB76B', category: 'Brown & Earth' },
  { name: 'Oatmeal',           hex: '#E6D7C3', category: 'Brown & Earth' },
  { name: 'Beige',             hex: '#F5F5DC', category: 'Brown & Earth' },
  { name: 'Almond',            hex: '#EFDECD', category: 'Brown & Earth' },
  { name: 'Ecru',              hex: '#C2B280', category: 'Brown & Earth' },
  { name: 'Ochre',             hex: '#CC7722', category: 'Brown & Earth' },
  { name: 'Dark Ochre',        hex: '#A67C00', category: 'Brown & Earth' },
  { name: 'Mustard',           hex: '#FFDB58', category: 'Brown & Earth' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Auto-detect the closest named color from a text/keyword string. */
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

  // 3. Keyword fallbacks
  if (clean.includes('black') || clean.includes('dark')) return FASHION_COLORS_50.find(c => c.name === 'Midnight Black')!;
  if (clean.includes('gold') || clean.includes('yellow'))  return FASHION_COLORS_50.find(c => c.name === 'Champagne Gold')!;
  if (clean.includes('red')  || clean.includes('burgundy')) return FASHION_COLORS_50.find(c => c.name === 'Crimson Red')!;
  if (clean.includes('blue') || clean.includes('navy'))    return FASHION_COLORS_50.find(c => c.name === 'Deep Navy')!;
  if (clean.includes('pink') || clean.includes('rose'))    return FASHION_COLORS_50.find(c => c.name === 'Dusty Pink')!;
  if (clean.includes('white') || clean.includes('pearl'))  return FASHION_COLORS_50.find(c => c.name === 'Pearl White')!;
  if (clean.includes('green'))                             return FASHION_COLORS_50.find(c => c.name === 'Emerald Green')!;
  if (clean.includes('brown') || clean.includes('earth'))  return FASHION_COLORS_50.find(c => c.name === 'Mocha Brown')!;
  if (clean.includes('teal')  || clean.includes('cyan'))   return FASHION_COLORS_50.find(c => c.name === 'Teal Green')!;
  if (clean.includes('grey') || clean.includes('gray'))    return FASHION_COLORS_50.find(c => c.name === 'Charcoal Grey')!;

  return FASHION_COLORS_50[0];
}

/** Convert a 3-digit or 6-digit hex string to an RGB object. */
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

/**
 * Map any hex color to its closest human-readable name.
 * Uses perceptual-weighted Euclidean distance across 400+ colors.
 * Weights: R=0.30, G=0.59, B=0.11 (matches human eye sensitivity).
 */
export function getColorNameFromHex(hexInput: string): { name: string; hex: string; category: string } {
  if (!hexInput) {
    return { name: 'Pure White', hex: '#FFFFFF', category: 'Gold & Neutral' };
  }

  let formattedHex = hexInput.trim().toUpperCase();
  if (!formattedHex.startsWith('#')) {
    formattedHex = `#${formattedHex}`;
  }

  // Handle 3-digit hex (#FFF → #FFFFFF)
  if (formattedHex.length === 4) {
    formattedHex = `#${formattedHex[1]}${formattedHex[1]}${formattedHex[2]}${formattedHex[2]}${formattedHex[3]}${formattedHex[3]}`;
  }

  const targetRgb = hexToRgb(formattedHex);
  if (!targetRgb) {
    return { name: 'Custom Shade', hex: formattedHex, category: 'Gold & Neutral' };
  }

  // Combine ALL palettes for maximum coverage
  const allPalette = [...FASHION_COLORS_50, ...EXTENDED_COLOR_DICTIONARY];

  let closestColor = allPalette[0];
  let minDistance = Infinity;

  for (const item of allPalette) {
    const itemRgb = hexToRgb(item.hex);
    if (!itemRgb) continue;

    // Perceptual-weighted distance (human eye is more sensitive to green)
    const dr = targetRgb.r - itemRgb.r;
    const dg = targetRgb.g - itemRgb.g;
    const db = targetRgb.b - itemRgb.b;
    const distance = Math.sqrt(0.3 * dr * dr + 0.59 * dg * dg + 0.11 * db * db);

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
