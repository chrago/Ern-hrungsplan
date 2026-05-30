/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface NutrientGoals {
  calories: number; // kcal
  protein: number;  // g
  fat: number;      // g
  carbs: number;    // g
  fiber: number;    // g
  water: number;    // L
  // Wichtige Vitamine & Mineralien
  vitA?: number;    // µg
  vitB12?: number;  // µg
  vitC?: number;    // mg
  vitD?: number;    // µg
  calcium?: number; // mg
  magnesium?: number;// mg
  iron?: number;    // mg
  zinc?: number;    // mg
  iodine?: number;  // µg
  omega3?: number;  // mg (EPA/DHA)
}

export type FamilyRole = 'mann' | 'frau' | 'sohn';

export type FamilyGoal = 'abnehmen' | 'halten' | 'aufbau' | 'gesund' | 'kindgerecht';

export type ActivityLevel = 'niedrig' | 'normal' | 'sportlich';

export interface FamilyMember {
  id: string;
  name: string;
  role: FamilyRole;
  age: number;
  weight: number;
  goal: FamilyGoal;
  activityLevel: ActivityLevel;
  allergies: string[];
  preferences: string[];
  dislikes: string[];
  nutrientGoals: NutrientGoals;
}

export interface FoodItem {
  id: string;
  name: string;
  category: string;
  calories: number; // pro 100g
  protein: number;  // pro 100g
  carbs: number;    // pro 100g
  fat: number;      // pro 100g
  fiber: number;    // pro 100g
  // Wichtige Vitamine/Mineralien (pro 100g)
  vitA?: number;    // µg
  vitB12?: number;  // µg
  vitC?: number;    // mg
  vitD?: number;    // µg
  calcium?: number; // mg
  magnesium?: number;// mg
  iron?: number;    // mg
  zinc?: number;    // mg
  iodine?: number;  // µg
  omega3?: number;  // mg (EPA/DHA)
  potassium?: number;
  vitK?: number;
  folate?: number;
  vitE?: number;
  vitB1?: number;
  vitB2?: number;
  vitB6?: number;
  B2?: number;
  B12?: number;
  selenium?: number;
  // Status im Haushalt
  isAvailable: boolean;
  stockAmount?: string; // z.B. "500g", "3 Stück"
  expiryDate?: string;  // Format YYYY-MM-DD
  tags?: string[];
}

export interface RecipeIngredient {
  foodItemId?: string;
  name: string;
  amount: number; // Für die ganze Familie, skaliert
  unit: string;   // "g", "ml", "Stück", "EL", "TL"
  notes?: string; // z.B. "gemahlen", "in Streifen"
}

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface Recipe {
  id: string;
  name: string;
  mealType: MealType;
  prepTime: number; // in Minuten
  difficulty: 'einfach' | 'mittel' | 'aufwendig';
  diets: string[]; // z.B. "Vegan", "High-Protein", "Kinderfreundlich"
  ingredients: RecipeIngredient[];
  instructions: string[];
  // Nährwerte für das Gesamtgericht (ganze Familie)
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  // Spezielle Nährstoff-Highlights
  highlights?: string[];
  isKidFriendly: boolean;
  kidNote?: string;
  isFavorite: boolean;
  rating?: number; // 1-5
}

export interface Meal {
  recipeId: string;
  recipeName: string;
  prepTime: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  isKidFriendly: boolean;
  isGekocht: boolean;
}

export interface DayPlan {
  dayName: string; // "Montag", "Dienstag", ...
  breakfast?: Meal;
  lunch?: Meal;
  dinner?: Meal;
  snack?: Meal;
  isCompleted?: boolean;
}

export interface ShoppingItem {
  id: string;
  name: string;
  amount: number;
  unit: string;
  category: string;
  checked: boolean;
  availableAtHome: boolean;
  recipeNames: string[]; // Welche Rezepte benötigen dies
}

export interface WeeklyPlan {
  id: string;
  title: string;
  startDate: string; // YYYY-MM-DD
  days: DayPlan[];
  shoppingList: ShoppingItem[];
  // Wochenanalyse aggregiert vs. Ziele der Familie
  analysis: {
    [role in FamilyRole]?: {
      caloriesPct: number;
      proteinPct: number;
      carbsPct: number;
      fatPct: number;
      fiberPct: number;
      vitCLevel: 'optimum' | 'low' | 'deficient' | 'good';
      omega3Level: 'optimum' | 'low' | 'deficient' | 'good';
      calciumLevel: 'optimum' | 'low' | 'deficient' | 'good';
      ironLevel: 'optimum' | 'low' | 'deficient' | 'good';
      notes: string[];
    }
  };
}

export interface WizardConfig {
  startDate: string;
  mealTypes: MealType[];
  familyIds: string[];
  dietType: string; // "gesund" | "proteinreich" | "kinderfreundlich" | "mediterran" | etc.
  stockSource: 'all' | 'stock_only' | 'stock_and_shopping';
  excludedCategories: string[];
  maxPrepTime: number; // z.B. 30 Minuten
  budgetLevel: 'günstig' | 'mittel' | 'premium';
  prepFreq: 'fresh' | 'meal_prep' | 'mixed';
}
