export type TemplateItem = { name: string; category?: string; quantity?: number };
export type TemplateDef = { key: string; name: string; items: TemplateItem[] };

export const PACKING_CATEGORIES = [
  'Clothing',
  'Toiletries',
  'Electronics',
  'Accessories',
  'Food',
  'Documents',
  'Gear',
  'Baby',
  'Medicine',
  'Other',
];

export const PRESET_TEMPLATES: TemplateDef[] = [
  {
    key: 'beach_basic',
    name: 'Beach Weekend',
    items: [
      { name: 'Swimsuit', category: 'Clothing', quantity: 1 },
      { name: 'Towel', category: 'Clothing', quantity: 1 },
      { name: 'Sunscreen', category: 'Toiletries', quantity: 1 },
      { name: 'Sunglasses', category: 'Accessories', quantity: 1 },
      { name: 'Flip-flops', category: 'Clothing', quantity: 1 },
      { name: 'Hat', category: 'Accessories', quantity: 1 },
      { name: 'Water bottle', category: 'Food', quantity: 1 },
    ],
  },

  {
    key: 'city_break',
    name: 'City Break',
    items: [
      { name: 'Comfortable shoes', category: 'Clothing', quantity: 1 },
      { name: 'Jacket', category: 'Clothing', quantity: 1 },
      { name: 'Phone charger', category: 'Electronics', quantity: 1 },
      { name: 'Power bank', category: 'Electronics', quantity: 1 },
      { name: 'Toothbrush', category: 'Toiletries', quantity: 1 },
      { name: 'Passport/ID', category: 'Documents', quantity: 1 },
    ],
  },

  {
    key: 'hiking_day',
    name: 'Hiking Day Trip',
    items: [
      { name: 'Hiking boots', category: 'Clothing', quantity: 1 },
      { name: 'Rain jacket', category: 'Clothing', quantity: 1 },
      { name: 'Backpack', category: 'Gear', quantity: 1 },
      { name: 'Snacks', category: 'Food', quantity: 2 },
      { name: 'Water bottle', category: 'Food', quantity: 2 },
      { name: 'First aid kit', category: 'Gear', quantity: 1 },
      { name: 'Map/Offline maps', category: 'Electronics', quantity: 1 },
    ],
  },

  // Additional useful presets
  {
    key: 'camping_basic',
    name: 'Camping Trip',
    items: [
      { name: 'Tent', category: 'Gear', quantity: 1 },
      { name: 'Sleeping bag', category: 'Gear', quantity: 1 },
      { name: 'Flashlight', category: 'Electronics', quantity: 1 },
      { name: 'Camping stove', category: 'Gear', quantity: 1 },
      { name: 'Warm layers', category: 'Clothing', quantity: 2 },
      { name: 'First aid kit', category: 'Gear', quantity: 1 },
    ],
  },
  {
    key: 'road_trip',
    name: 'Road Trip Essentials',
    items: [
      { name: 'Road map / GPS', category: 'Electronics', quantity: 1 },
      { name: 'Snacks', category: 'Food', quantity: 4 },
      { name: 'Hand sanitizer', category: 'Toiletries', quantity: 1 },
      { name: 'Phone charger (car)', category: 'Electronics', quantity: 1 },
      { name: 'Jumper cables', category: 'Gear', quantity: 1 },
    ],
  },
  {
    key: 'winter_break',
    name: 'Winter Holiday',
    items: [
      { name: 'Winter coat', category: 'Clothing', quantity: 1 },
      { name: 'Gloves', category: 'Clothing', quantity: 1 },
      { name: 'Thermal layers', category: 'Clothing', quantity: 2 },
      { name: 'Warm hat', category: 'Clothing', quantity: 1 },
      { name: 'Moisturizer', category: 'Toiletries', quantity: 1 },
    ],
  },
  {
    key: 'baby_travel',
    name: 'Travel with Baby',
    items: [
      { name: 'Diapers', category: 'Baby', quantity: 10 },
      { name: 'Baby wipes', category: 'Baby', quantity: 2 },
      { name: 'Formula / food', category: 'Food', quantity: 3 },
      { name: 'Changing mat', category: 'Baby', quantity: 1 },
      { name: 'Extra clothes', category: 'Clothing', quantity: 3 },
    ],
  },
];

export const EXTRA_TEMPLATES: TemplateDef[] = [
  {
    key: 'business_short',
    name: 'Business Short Trip',
    items: [
      { name: 'Suit', category: 'Clothing', quantity: 1 },
      { name: 'Laptop & charger', category: 'Electronics', quantity: 1 },
      { name: 'Notebook & pen', category: 'Other', quantity: 1 },
      { name: 'Business cards', category: 'Other', quantity: 1 },
    ],
  },
  {
    key: 'festival',
    name: 'Festival / Concert',
    items: [
      { name: 'Earplugs', category: 'Accessories', quantity: 1 },
      { name: 'Portable charger', category: 'Electronics', quantity: 1 },
      { name: 'Light rain jacket', category: 'Clothing', quantity: 1 },
      { name: 'Cash & ID', category: 'Documents', quantity: 1 },
    ],
  },
];

export default {
  PACKING_CATEGORIES,
  PRESET_TEMPLATES,
  EXTRA_TEMPLATES,
};

