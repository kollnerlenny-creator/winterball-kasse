import { InventoryItem } from "./types";

export const SAMPLE_PRODUCTS: Record<string, InventoryItem> = {
  "Glühwein": {
    hasVariants: true,
    assignedPos: 1, // Getränke
    priceS: 3.50,
    stockS: 80,
    costS: 1.20,
    priceL: 5.00,
    stockL: 60,
    costL: 1.80
  },
  "Kinderpunsch": {
    hasVariants: false,
    assignedPos: 1,
    price: 3.00,
    stock: 50,
    cost: 0.90
  },
  "Bier (0,33l)": {
    hasVariants: false,
    assignedPos: 1,
    price: 3.50,
    stock: 120,
    cost: 1.10
  },
  "Softdrink (Cola/Fanta)": {
    hasVariants: false,
    assignedPos: 1,
    price: 2.50,
    stock: 90,
    cost: 0.80
  },
  "Mineralwasser (0,5l)": {
    hasVariants: false,
    assignedPos: 1,
    price: 2.00,
    stock: 60,
    cost: 0.50
  },
  "Bratwurst im Brötchen": {
    hasVariants: false,
    assignedPos: 2, // Speisen
    price: 4.00,
    stock: 80,
    cost: 1.50
  },
  "Käsekrakauer": {
    hasVariants: false,
    assignedPos: 2,
    price: 4.50,
    stock: 50,
    cost: 1.70
  },
  "Portion Pommes": {
    hasVariants: false,
    assignedPos: 2,
    price: 3.50,
    stock: 100,
    cost: 0.80
  },
  "Warme Waffel": {
    hasVariants: false,
    assignedPos: 2,
    price: 2.50,
    stock: 45,
    cost: 0.60
  },
  "Laugenbrezel": {
    hasVariants: false,
    assignedPos: 2,
    price: 2.00,
    stock: 50,
    cost: 0.70
  }
};
