
export const CROPS = [
  'Wheat', 'Rice', 'Maize', 'Cotton', 'Sugarcane', 'Soybean', 'Tomato', 'Potato'
];

export const SEASONS = [
  'Kharif (Monsoon)', 'Rabi (Winter)', 'Zaid (Summer)'
];

export const IRRIGATION_METHODS = [
  'Drip Irrigation', 'Sprinkler Irrigation', 'Surface/Flood Irrigation', 'Furrow Irrigation'
];

export const CROP_WATER_NEEDS: Record<string, number> = {
  'Wheat': 450, // mm per season
  'Rice': 1200,
  'Maize': 500,
  'Cotton': 700,
  'Sugarcane': 1500,
  'Soybean': 450,
  'Tomato': 400,
  'Potato': 500,
};
