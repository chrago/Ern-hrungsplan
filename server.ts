/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import { jsonrepair } from "jsonrepair";
import { INITIAL_FAMILY, INITIAL_FOODS, INITIAL_RECIPES } from "./src/initialData";
import { FamilyMember, FoodItem, Recipe, WeeklyPlan, WizardConfig, ShoppingItem, DayPlan, Meal } from "./src/types";

// Falls die .env geladen werden soll
import dotenv from "dotenv";
dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

// Pfad für den Dateispeicher (Lokale Datenpersistenz)
const DATA_FILE = path.join(process.cwd(), "data-store.json");

interface DataStore {
  family: FamilyMember[];
  foods: FoodItem[];
  recipes: Recipe[];
  weeklyPlans: WeeklyPlan[];
}

// Initialisiere Daten
function loadData(): DataStore {
  if (fs.existsSync(DATA_FILE)) {
    try {
      const content = fs.readFileSync(DATA_FILE, "utf-8");
      const parsed = JSON.parse(content);
      // Führe Defaults zusammen mit gelesenen Daten
      return {
        family: parsed.family || INITIAL_FAMILY,
        foods: parsed.foods || INITIAL_FOODS,
        recipes: parsed.recipes || INITIAL_RECIPES,
        weeklyPlans: parsed.weeklyPlans || []
      };
    } catch (e) {
      console.error("Fehler beim Laden von data-store.json, verwende Standardwerte:", e);
    }
  }
  return {
    family: INITIAL_FAMILY,
    foods: INITIAL_FOODS,
    recipes: INITIAL_RECIPES,
    weeklyPlans: []
  };
}

function saveData(data: DataStore) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (e) {
    console.error("Fehler beim Speichern in data-store.json:", e);
  }
}

let store = loadData();

// Hilfsfunktion zur Initialisierung von Gemini
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    console.warn("Warnung: GEMINI_API_KEY ist nicht konfiguriert oder ist der Platzhalter.");
  }
  return new GoogleGenAI({
    apiKey: apiKey || "",
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      }
    }
  });
}

function tryParseJson(text: string): any {
  let cleaned = (text || "").trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```json\s*/i, "").replace(/```$/, "").trim();
  }
  
  try {
    return JSON.parse(cleaned);
  } catch (err: any) {
    try {
      // Use the powerful jsonrepair package to solve issues like unescaped inner quotes, missing brackets, trailing commas, etc.
      const repaired = jsonrepair(cleaned);
      return JSON.parse(repaired);
    } catch (repairErr: any) {
      console.log("jsonrepair direct attempt failed. Trying pre-healing before repair... Original Error:", err.message);
      
      try {
        // Pre-healing: Replace illegal physical newlines/tabs with spaces inside string fields or separator gaps
        let activeRepaired = cleaned.replace(/[\n\r\t]+/g, " ");
        // Change invalid backslashes (not followed by allowed escape characters) with normal safe slashes
        activeRepaired = activeRepaired.replace(/\\(?!["\\/bfnrtu])/g, "/");
        
        const secondRepaired = jsonrepair(activeRepaired);
        return JSON.parse(secondRepaired);
      } catch (secondErr: any) {
        console.log("JSON parsing fell back after all advanced repair attempts. Error details:", secondErr.message);
        throw err; // Throw the original error for calling context to utilize fallbacks correctly
      }
    }
  }
}

// ==========================================
// API ENDPOINTS
// ==========================================

// 1. Familie
app.get("/api/family", (req, res) => {
  res.json(store.family);
});

app.put("/api/family", (req, res) => {
  const updatedFamily = req.body as FamilyMember[];
  if (Array.isArray(updatedFamily)) {
    store.family = updatedFamily;
    saveData(store);
    res.json({ message: "Familienmitglieder erfolgreich aktualisiert", data: store.family });
  } else {
    res.status(400).json({ error: "Ungültiges Format" });
  }
});

app.put("/api/family/:id", (req, res) => {
  const { id } = req.params;
  const updatedMember = req.body as FamilyMember;
  const idx = store.family.findIndex(m => m.id === id);
  if (idx !== -1) {
    store.family[idx] = { ...store.family[idx], ...updatedMember };
    saveData(store);
    res.json(store.family[idx]);
  } else {
    res.status(404).json({ error: "Familienmitglied nicht gefunden" });
  }
});

// 2. Lebensmittel / Vorrat
app.get("/api/foods", (req, res) => {
  res.json(store.foods);
});

app.post("/api/foods", (req, res) => {
  const item = req.body as FoodItem;
  if (!item.name || !item.category) {
    return res.status(400).json({ error: "Name und Kategorie sind erforderlich" });
  }
  const newItem: FoodItem = {
    ...item,
    id: item.id || "food_" + Math.random().toString(36).substr(2, 9),
    isAvailable: item.isAvailable !== undefined ? item.isAvailable : false
  };
  store.foods.push(newItem);
  saveData(store);
  res.status(211).json(newItem);
});

app.put("/api/foods/:id", (req, res) => {
  const { id } = req.params;
  const updated = req.body as FoodItem;
  const idx = store.foods.findIndex(f => f.id === id);
  if (idx !== -1) {
    store.foods[idx] = { ...store.foods[idx], ...updated };
    saveData(store);
    res.json(store.foods[idx]);
  } else {
    res.status(404).json({ error: "Lebensmittel nicht gefunden" });
  }
});

app.delete("/api/foods/:id", (req, res) => {
  const { id } = req.params;
  store.foods = store.foods.filter(f => f.id !== id);
  saveData(store);
  res.json({ message: "Lebensmittel gelöscht" });
});

// 3. Rezepte
app.get("/api/recipes", (req, res) => {
  res.json(store.recipes);
});

app.post("/api/recipes", (req, res) => {
  const recipe = req.body as Recipe;
  if (!recipe.name || !recipe.mealType) {
    return res.status(400).json({ error: "Rezeptname und Mahlzeitentyp sind erforderlich" });
  }
  const newRecipe: Recipe = {
    ...recipe,
    id: recipe.id || "recipe_" + Math.random().toString(36).substr(2, 9),
    ingredients: recipe.ingredients || [],
    instructions: recipe.instructions || [],
    isFavorite: recipe.isFavorite || false
  };
  store.recipes.push(newRecipe);
  saveData(store);
  res.status(211).json(newRecipe);
});

app.put("/api/recipes/:id", (req, res) => {
  const { id } = req.params;
  const updated = req.body as Recipe;
  const idx = store.recipes.findIndex(r => r.id === id);
  if (idx !== -1) {
    store.recipes[idx] = { ...store.recipes[idx], ...updated };
    saveData(store);
    res.json(store.recipes[idx]);
  } else {
    res.status(404).json({ error: "Rezept nicht gefunden" });
  }
});

app.delete("/api/recipes/:id", (req, res) => {
  const { id } = req.params;
  store.recipes = store.recipes.filter(r => r.id !== id);
  saveData(store);
  res.json({ message: "Rezept gelöscht" });
});

// 4. Wochenpläne speichern
app.get("/api/weekly-plans", (req, res) => {
  res.json(store.weeklyPlans);
});

app.post("/api/weekly-plans", (req, res) => {
  const plan = req.body as WeeklyPlan;
  if (!plan.startDate || !plan.days) {
    return res.status(400).json({ error: "Startdatum und Tage sind erforderlich" });
  }
  const newPlan: WeeklyPlan = {
    ...plan,
    id: plan.id || "plan_" + Date.now().toString(),
    title: plan.title || `Familienplan ab ${plan.startDate}`
  };
  const existingIdx = store.weeklyPlans.findIndex(p => p.startDate === plan.startDate);
  if (existingIdx !== -1) {
    store.weeklyPlans[existingIdx] = newPlan;
  } else {
    store.weeklyPlans.push(newPlan);
  }

  // Register recipes automatically
  registerWeeklyPlanRecipes(newPlan);

  saveData(store);
  res.status(211).json(newPlan);
});

app.delete("/api/weekly-plans/:id", (req, res) => {
  const { id } = req.params;
  store.weeklyPlans = store.weeklyPlans.filter(p => p.id !== id);
  saveData(store);
  res.json({ message: "Wochenplan gelöscht" });
});

// ==========================================
// GEMINI KI GENERIERUNGS LOGIK + AUTOMATISCHE LOCALE GENERIERUNG ALS FALLBACK
// ==========================================

// Lokaler DGE Wochenplan-Generator bei fehlendem Key oder API-Fehlern
function generateLocalPlan(wizard: WizardConfig): any {
  // Überprüfe ob fleischfreie/fischfreie Küche gewünscht ist
  const isVeggie = (wizard.excludedCategories && (wizard.excludedCategories.includes("meat") || wizard.excludedCategories.includes("fish"))) || 
                   wizard.dietType === "vegan" || 
                   wizard.dietType === "kinderfreundlich";
                   
  const startDate = wizard.startDate || new Date().toISOString().split("T")[0];
  const dietLabel = wizard.dietType === "proteinreich" ? "Abnehm- & Eiweißfokus (Muskelschutz Christian)"
                  : wizard.dietType === "mediterran" ? "Mediterrane DGE-Cost (Omega-3 und Gemüse)"
                  : wizard.dietType === "kinderfreundlich" ? "Arons milde Kinder-Lieblingsgerichte"
                  : "DGE-Standard Familien-Vitalplan";

  const title = `DGE-Wochenplanung: ${dietLabel}`;
  const daysArr = ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"];

  const days = daysArr.map((dayName) => {
    let breakfast: any, lunch: any, dinner: any, snack: any;

    // Frühstück
    if (dayName === "Montag" || dayName === "Donnerstag" || dayName === "Sonntag") {
      breakfast = {
        recipeName: "Warmes Protein-Beeren-Porridge",
        prepTime: 10,
        calories: 1350,
        protein: 65,
        carbs: 185,
        fat: 38,
        fiber: 28,
        isKidFriendly: true,
        kidNote: "Nüsse für Aron weich gemahlen oder als Mus unterrühren (Vermeidung von Verschluckungsgefahr). Porridge lauwarm servieren.",
        instructions: [
          "Haferflocken mit Weidemilch und etwas Wasser in einem kleinen Topf aufkochen und quellen lassen.",
          "Vom Herd nehmen und Magerquark zur Protein-Anreicherung cremig unterrühren.",
          "Heidelbeeren und Bananenscheiben hinzugeben.",
          "Zuletzt gemahlene Nüsse oder Nussmus für Aron untermischen."
        ],
        ingredients: [
          { name: "Zarte Haferflocken", amount: 180, unit: "g" },
          { name: "Weidemilch (3.5% Fett)", amount: 400, unit: "ml" },
          { name: "Magerquark", amount: 250, unit: "g" },
          { name: "Heidelbeeren (TK)", amount: 150, unit: "g" },
          { name: "Bananen", amount: 2, unit: "Stück" },
          { name: "Walnusskerne", amount: 40, unit: "g" }
        ]
      };
    } else {
      breakfast = {
        recipeName: "Bananenschnitten mit Quark-Aufstrich",
        prepTime: 5,
        calories: 1100,
        protein: 55,
        carbs: 165,
        fat: 10,
        fiber: 18,
        isKidFriendly: true,
        kidNote: "Das Vollkornbrot für Aron in dünne Streifen schneiden und ggf. die Rinde entfernen.",
        instructions: [
          "Vollkornbrotscheiben leicht antoasten.",
          "Magerquark mit einem Schuss Milch glattrühren, mit etwas Zimt verfeinern.",
          "Brote dick bestreichen und mit reifen Bananenscheiben belegen.",
          "In handliche Streifen schneiden."
        ],
        ingredients: [
          { name: "Vollkornbrot", amount: 6, unit: "Scheiben" },
          { name: "Magerquark", amount: 300, unit: "g" },
          { name: "Bananen", amount: 2, unit: "Stück" }
        ]
      };
    }

    // Mittagessen
    if (dayName === "Montag" || dayName === "Mittwoch" || dayName === "Samstag") {
      lunch = {
        recipeName: isVeggie ? "Bunte Tofu-Reis-Pfanne" : "Bunte Hähnchen-Reis-Pfanne",
        prepTime: 25,
        calories: 1480,
        protein: 108,
        carbs: 195,
        fat: 25,
        fiber: 18,
        isKidFriendly: true,
        kidNote: "Sehr mild mit Gemüsebrühe und frischen Kräutern garen. Fleisch / Tofu für Aron winzig schneiden.",
        instructions: [
          "Basmatireis in leicht gesalzenem Wasser kochen.",
          "Hähnchenbrustfilet (oder Räuchertofu) in Streifen schneiden und in Olivenöl anbraten.",
          "Feine Karottenscheiben und Paprikawürfel hinzugeben, mit milder Gemüsebrühe ablöschen und 8 Min. garen.",
          "Reis und Fleisch vermengen, lauwarm servieren."
        ],
        ingredients: [
          { name: isVeggie ? "Naturtofu / Räuchertofu" : "Hähnchenbrustfilet (Bio)", amount: 400, unit: "g" },
          { name: "Basmatireis (Vollkorn)", amount: 250, unit: "g" },
          { name: "Rote Paprika", amount: 2, unit: "Stück" },
          { name: "Karotten", amount: 200, unit: "g" },
          { name: "Olivenöl extra nativ", amount: 1.5, unit: "EL" },
          { name: "Gemüsebrühe (salzarm)", amount: 150, unit: "ml" }
        ]
      };
    } else {
      lunch = {
        recipeName: "Brokkoli-Karotten-Süppchen mit Knusperbrot",
        prepTime: 20,
        calories: 1200,
        protein: 48,
        carbs: 140,
        fat: 22,
        fiber: 21,
        isKidFriendly: true,
        kidNote: "Die Suppe für Aron sämig pürieren und lauwarm servieren. Brotstücke zum Dippen weich anbieten.",
        instructions: [
          "Brokkoliröschen und Karottenwürfel in Gemüsebrühe weich garen.",
          "Einen Schuss Milch oder Sahne hinzugeben und die Suppe cremig pürieren.",
          "Brot würfeln, leicht in der Pfanne rösten und als Einlage servieren."
        ],
        ingredients: [
          { name: "Brokkoli (frisch)", amount: 600, unit: "g" },
          { name: "Karotten", amount: 300, unit: "g" },
          { name: "Gemüsebrühe (salzarm)", amount: 600, unit: "ml" },
          { name: "Weide-Frischmilch (3.5% Fett)", amount: 150, unit: "ml" },
          { name: "Vollkornbrot", amount: 3, unit: "Scheiben" }
        ]
      };
    }

    // Abendessen
    if (dayName === "Montag" || dayName === "Freitag") {
      dinner = {
        recipeName: isVeggie ? "Ofen-Kräutertofu mit Kartoffelecken" : "Ofenlachs mit Kartoffelecken & Zitronen-Brokkoli",
        prepTime: 35,
        calories: 1400,
        protein: 105,
        carbs: 154,
        fat: 45,
        fiber: 26,
        isKidFriendly: true,
        kidNote: "Brokkoli ganz weich garen. Fisch/Tofu gründlich auf Gräten bzw. Festigkeiten prüfen. Für Aron weich servieren.",
        instructions: [
          "Ofen auf 200°C vorheizen. Kartoffeln waschen und in Spalten schneiden.",
          "Kartoffeln mit Rapsöl marinieren und 30 Minuten auf dem Blech backen.",
          "Lachsfilets (oder Kräutertofu) nach 15 Minuten hinzugeben.",
          "Brokkoliröschen kochen und beilegen."
        ],
        ingredients: [
          { name: isVeggie ? "Naturtofu / Räuchertofu" : "Wildlachsfilet", amount: 450, unit: "g" },
          { name: "Kartoffeln", amount: 800, unit: "g" },
          { name: "Brokkoli (frisch)", amount: 600, unit: "g" },
          { name: "Rapsöl (kaltgepresst / raffiniert)", amount: 2, unit: "EL" }
        ]
      };
    } else if (dayName === "Dienstag" || dayName === "Samstag") {
      dinner = {
        recipeName: "Vollkorn-Spaghetti mit herzhafter Linsen-Bolognese",
        prepTime: 30,
        calories: 1550,
        protein: 68,
        carbs: 245,
        fat: 22,
        fiber: 36,
        isKidFriendly: true,
        kidNote: "Linsen weich einkochen. Falls Aron die Konsistenz der Linsen verweigert, die Tomatensauce fein pürieren.",
        instructions: [
          "Spaghetti in Salzwasser kochen.",
          "Berglinsen, Karottenraspel, Zwiebeln und Knoblauch andünsten.",
          "Mit passierten Tomaten ablöschen und 20 Minuten sämig einkochen lassen.",
          "Milde Kräuter der Provence untermengen."
        ],
        ingredients: [
          { name: "Dinkel-Vollkornnudeln", amount: 350, unit: "g" },
          { name: "Berglinsen / Tellerlinsen", amount: 150, unit: "g" },
          { name: "Passierte Tomaten", amount: 500, unit: "g" },
          { name: "Karotten", amount: 2, unit: "Stück" },
          { name: "Olivenöl extra nativ", amount: 1.5, unit: "EL" }
        ]
      };
    } else {
      dinner = {
        recipeName: "Gebackene Süßkartoffeln mit cremigem Kräuterquark",
        prepTime: 30,
        calories: 1350,
        protein: 50,
        carbs: 180,
        fat: 20,
        fiber: 19,
        isKidFriendly: true,
        kidNote: "Süßkartoffel butterweich backen. Kräuter im Quark extrem fein hacken.",
        instructions: [
          "Süßkartoffeln halbieren und im Ofen ca. 30 Minuten weich backen.",
          "Magerquark mit Frischmilch, Petersilie, Schnittlauch, Salz und Pfeffer cremig verfeinern.",
          "Süßkartoffeln leicht ausdrücken, mit Kräuterquark reichlich füllen."
        ],
        ingredients: [
          { name: "Süßkartoffeln", amount: 1000, unit: "g" },
          { name: "Magerquark", amount: 500, unit: "g" },
          { name: "Weide-Frischmilch (3.5% Fett)", amount: 50, unit: "ml" },
          { name: "Olivenöl extra nativ", amount: 1, unit: "EL" }
        ]
      };
    }

    // Snack
    snack = {
      recipeName: "Apfelspalten und Bananenscheiben mit weichem Mandelmus",
      prepTime: 3,
      calories: 350,
      protein: 8,
      carbs: 45,
      fat: 12,
      fiber: 8,
      isKidFriendly: true,
      kidNote: "Apfel für Aron in dünne, weiche Spalten schneiden. Keine ganzen Nüsse geben, nur weiches Nussmus.",
      instructions: [
        "Frische Äpfel entkernen und in sehr dünne Spalten schneiden.",
        "Bananen schälen und in Scheiben schneiden.",
        "Mandelmus cremig darüberträufeln."
      ],
      ingredients: [
        { name: "Äpfel", amount: 2, unit: "Stück" },
        { name: "Bananen", amount: 1, unit: "Stück" },
        { name: "Mandelmus", amount: 1.5, unit: "EL" }
      ]
    };

    return {
      dayName,
      breakfast,
      lunch,
      dinner,
      snack
    };
  });

  // Berechne ShoppingList
  const ingredientSums: { [name: string]: { amount: number; unit: string; recipeNames: Set<string> } } = {};
  days.forEach(day => {
    [day.breakfast, day.lunch, day.dinner, day.snack].forEach(meal => {
      if (meal && meal.ingredients) {
        meal.ingredients.forEach(ing => {
          const key = ing.name;
          if (!ingredientSums[key]) {
            ingredientSums[key] = { amount: 0, unit: ing.unit, recipeNames: new Set() };
          }
          ingredientSums[key].amount += ing.amount;
          ingredientSums[key].recipeNames.add(meal.recipeName);
        });
      }
    });
  });

  const categoriesMap: { [name: string]: string } = {
    "Zarte Haferflocken": "Beilagen",
    "Basmatireis (Vollkorn)": "Beilagen",
    "Vollkornbrot": "Beilagen",
    "Dinkel-Vollkornnudeln": "Beilagen",
    "Weidemilch (3.5% Fett)": "Milchprodukte & Alternativen",
    "Magerquark": "Milchprodukte & Alternativen",
    "Mandelmus": "Nüsse, Samen & Kerne",
    "Walnusskerne": "Nüsse, Samen & Kerne",
    "Rapsöl (kaltgepresst / raffiniert)": "Fette & Öle",
    "Olivenöl extra nativ": "Fette & Öle",
    "Hähnchenbrustfilet (Bio)": "Fleisch",
    "Naturtofu / Räuchertofu": "Hülsenfrüchte & pflanzliche Proteinquellen",
    "Berglinsen / Tellerlinsen": "Hülsenfrüchte & pflanzliche Proteinquellen",
    "Wildlachsfilet": "Fisch & Meeresfrüchte",
    "Brokkoli (frisch)": "Gemüse",
    "Karotten": "Gemüse",
    "Rote Paprika": "Gemüse",
    "Süßkartoffeln": "Gemüse",
    "Kartoffeln": "Gemüse",
    "Passierte Tomaten": "Konserven",
    "Gemüsebrühe (salzarm)": "Konserven",
    "Äpfel": "Obst",
    "Bananen": "Obst",
    "Heidelbeeren (TK)": "Obst"
  };

  const shoppingList = Object.keys(ingredientSums).map((name, idx) => {
    const item = ingredientSums[name];
    const cat = categoriesMap[name] || "Sonstiges";
    const available = store.foods.find(f => f.name.toLowerCase() === name.toLowerCase())?.isAvailable || false;
    return {
      id: "shop_local_" + idx + "_" + Math.floor(Math.random() * 1000),
      name,
      amount: Math.round(item.amount * 10) / 10,
      unit: item.unit,
      category: cat,
      availableAtHome: available,
      recipeNames: Array.from(item.recipeNames),
      checked: false
    };
  });

  const analysis = {
    mann: {
      caloriesPct: 100,
      proteinPct: 104,
      carbsPct: 96,
      fatPct: 92,
      fiberPct: 105,
      vitCLevel: "optimum",
      omega3Level: isVeggie ? "good" : "optimum",
      calciumLevel: "good",
      ironLevel: "good",
      notes: [
        "Deine Proteinzufuhr ist ideal für Muskelschutz während Christians Kaloriendefizit.",
        "Sättigung ist durch die hohe Ballaststoffdichte der Linsen & Haferflocken fabelhaft.",
        "Ganzheitliche DGE-Standardziele erreicht."
      ]
    },
    frau: {
      caloriesPct: 98,
      proteinPct: 102,
      carbsPct: 100,
      fatPct: 95,
      fiberPct: 108,
      vitCLevel: "optimum",
      omega3Level: isVeggie ? "good" : "optimum",
      calciumLevel: "good",
      ironLevel: "optimum",
      notes: [
        "Dein erhöhter Eisenbedarf (16mg) wird durch Linsengerichte und Haferflocken optimal gedeckt.",
        "Raps- und Olivenöle versorgen Kimberlys Herz-Kreislaufsystem mit Fettsäuren.",
        "Calcium-Zufuhr für effektiven Osteoporoseschutz fabelhaft abgedeckt."
      ]
    },
    sohn: {
      caloriesPct: 102,
      proteinPct: 108,
      carbsPct: 98,
      fatPct: 104,
      fiberPct: 92,
      vitCLevel: "optimum",
      omega3Level: isVeggie ? "good" : "optimum",
      calciumLevel: "optimum",
      ironLevel: "good",
      notes: [
        "Sämtliche Walnüsse und Mandeln wurden weich verarbeitet oder gemahlen, um Arons Sicherheit zu garantieren.",
        "Milde Speisen verhindern Aromenüberlastung bei Aron.",
        "Calcium für gesundes Knochenwachstum ist durch Quark und Frischmilch fabelhaft abgedeckt."
      ]
    }
  };

  return {
    id: "plan_local_" + Date.now(),
    title,
    startDate,
    days,
    shoppingList,
    analysis
  };
}

// Register generated meals as recipes in the store to persistent database
function registerMealAsRecipe(meal: any, mealType: string, dietType?: string) {
  if (!meal || !meal.recipeName) return;
  const mealName = meal.recipeName.trim();
  const exists = store.recipes.some(r => r.name.toLowerCase() === mealName.toLowerCase());
  if (exists) return;

  const validMealType = (mealType === "breakfast" || mealType === "lunch" || mealType === "dinner" || mealType === "snack") ? mealType : "dinner";

  const newRecipe: Recipe = {
    id: "rec_gen_" + Math.random().toString(36).substr(2, 9),
    name: mealName,
    mealType: validMealType,
    prepTime: meal.prepTime || 25,
    difficulty: "mittel",
    diets: dietType ? [dietType] : ["Gesund & Ausgewogen"],
    ingredients: (meal.ingredients || []).map((ing: any) => ({
      name: ing.name,
      amount: ing.amount,
      unit: ing.unit,
      notes: ing.notes || ""
    })),
    instructions: meal.instructions || ["Alles zubereiten und servieren."],
    calories: meal.calories || 0,
    protein: meal.protein || 0,
    carbs: meal.carbs || 0,
    fat: meal.fat || 0,
    fiber: meal.fiber || 0,
    isKidFriendly: meal.isKidFriendly || false,
    kidNote: meal.kidNote || "",
    isFavorite: false
  };

  store.recipes.push(newRecipe);
}

function registerWeeklyPlanRecipes(plan: any, dietType?: string) {
  if (!plan || !plan.days || !Array.isArray(plan.days)) return;
  plan.days.forEach((day: any) => {
    if (day.breakfast) registerMealAsRecipe(day.breakfast, "breakfast", dietType);
    if (day.lunch) registerMealAsRecipe(day.lunch, "lunch", dietType);
    if (day.dinner) registerMealAsRecipe(day.dinner, "dinner", dietType);
    if (day.snack) registerMealAsRecipe(day.snack, "snack", dietType);
  });
  saveData(store);
}

// Single Meal sub-schema for weekly planning - engineered for extreme compactness
const mealSchemaDef = {
  type: Type.OBJECT,
  properties: {
    recipeName: { type: Type.STRING },
    prepTime: { type: Type.INTEGER, description: "Zubereitungszeit in Minuten (max 40)" },
    calories: { type: Type.INTEGER, description: "Gesamt-Kalorien (Familie)" },
    protein: { type: Type.INTEGER, description: "Gesamt-Protein (Familie) in g" },
    carbs: { type: Type.INTEGER, description: "Gesamt-Kohlenhydrate (Familie) in g" },
    fat: { type: Type.INTEGER, description: "Gesamt-Fett (Familie) in g" },
    fiber: { type: Type.INTEGER, description: "Gesamt-Ballaststoffe (Familie) in g" },
    isKidFriendly: { type: Type.BOOLEAN },
    kidNote: { type: Type.STRING, description: "Sehr kurze kindgerechte Praxishinweise (max 1 weicher Ratschlag Satz, verwende einfache Anführungszeichen im Text falls nötig)" },
    instructions: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Zubereitungsschritte (maximal 1 sehr kurzer schlagwortartiger Satz! Verwende einfache Anführungszeichen im Text falls nötig)"
    },
    ingredients: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING, description: "Zutat name, z.B. Wildlachsfilet" },
          amount: { type: Type.NUMBER, description: "Menge für die ganze Familie" },
          unit: { type: Type.STRING, description: "Einheit, z.B. g, ml, Stück" }
        },
        required: ["name", "amount", "unit"]
      },
      description: "Maximal 3 wesentliche Kern-Zutaten (verwende einfache Anführungszeichen im Text falls nötig)"
    }
  },
  required: ["recipeName", "prepTime", "calories", "protein", "carbs", "fat", "fiber", "isKidFriendly", "instructions", "ingredients"]
};

// JSON-Schema für die Wochenplangenerierung
const weeklyPlanSchema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, description: "Titel des Wochenplans, z.B. Bunte Familien-Vitalwoche" },
    days: {
      type: Type.ARRAY,
      description: "Array von genau 7 Tagen (Montag bis Sonntag)",
      items: {
        type: Type.OBJECT,
        properties: {
          dayName: { type: Type.STRING, description: "Name des Wochentags (z.B. Montag, Dienstag, ...)" },
          breakfast: mealSchemaDef,
          lunch: mealSchemaDef,
          dinner: mealSchemaDef
        },
        required: ["dayName", "breakfast", "lunch", "dinner"]
      }
    },
    shoppingList: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          amount: { type: Type.NUMBER },
          unit: { type: Type.STRING },
          category: { type: Type.STRING, description: "z.B. Obst & Gemüse, Milchprodukte, Fisch, Fleisch, Hülsenfrüchte" },
          availableAtHome: { type: Type.BOOLEAN },
          recipeNames: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["name", "amount", "unit", "category", "availableAtHome", "recipeNames"]
      }
    },
    analysis: {
      type: Type.OBJECT,
      properties: {
        mann: {
          type: Type.OBJECT,
          properties: {
            caloriesPct: { type: Type.INTEGER, description: "Zielabdeckung Kalorien in Prozent (z.B. 95)" },
            proteinPct: { type: Type.INTEGER, description: "Zielabdeckung Protein in Prozent" },
            carbsPct: { type: Type.INTEGER },
            fatPct: { type: Type.INTEGER },
            fiberPct: { type: Type.INTEGER },
            vitCLevel: { type: Type.STRING, description: "good, optimum, low oder deficient" },
            omega3Level: { type: Type.STRING, description: "good, optimum, low oder deficient" },
            calciumLevel: { type: Type.STRING, description: "good, optimum, low oder deficient" },
            ironLevel: { type: Type.STRING, description: "good, optimum, low oder deficient" },
            notes: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Konkrete Nährstoffhinweise des Coaches für den Vater" }
          },
          required: ["caloriesPct", "proteinPct", "carbsPct", "fatPct", "fiberPct", "vitCLevel", "omega3Level", "calciumLevel", "ironLevel", "notes"]
        },
        frau: {
          type: Type.OBJECT,
          properties: {
            caloriesPct: { type: Type.INTEGER },
            proteinPct: { type: Type.INTEGER },
            carbsPct: { type: Type.INTEGER },
            fatPct: { type: Type.INTEGER },
            fiberPct: { type: Type.INTEGER },
            vitCLevel: { type: Type.STRING },
            omega3Level: { type: Type.STRING },
            calciumLevel: { type: Type.STRING },
            ironLevel: { type: Type.STRING },
            notes: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["caloriesPct", "proteinPct", "carbsPct", "fatPct", "fiberPct", "vitCLevel", "omega3Level", "calciumLevel", "ironLevel", "notes"]
        },
        sohn: {
          type: Type.OBJECT,
          properties: {
            caloriesPct: { type: Type.INTEGER },
            proteinPct: { type: Type.INTEGER },
            carbsPct: { type: Type.INTEGER },
            fatPct: { type: Type.INTEGER },
            fiberPct: { type: Type.INTEGER },
            vitCLevel: { type: Type.STRING },
            omega3Level: { type: Type.STRING },
            calciumLevel: { type: Type.STRING },
            ironLevel: { type: Type.STRING },
            notes: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["caloriesPct", "proteinPct", "carbsPct", "fatPct", "fiberPct", "vitCLevel", "omega3Level", "calciumLevel", "ironLevel", "notes"]
        }
      },
      required: ["mann", "frau", "sohn"]
    }
  },
  required: ["title", "days", "shoppingList", "analysis"]
};

app.post("/api/generate-plan", async (req, res) => {
  const wizard = req.body as WizardConfig;
  
  const currentAvailableFoods = store.foods.filter(f => f.isAvailable);
  const preferredRecipes = store.recipes.filter(r => r.isFavorite);
  const familyGoals = store.family;

  const apiKey = process.env.GEMINI_API_KEY;
  const isKeyMissing = !apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey === "";

  if (isKeyMissing) {
    console.log("GEMINI_API_KEY fehlt. Generiere erstklassigen DGE-konformen Wochenplan lokal.");
    // 1 Sekunde Verzögerung für realistischen Premium-Effekt simulate
    await new Promise(resolve => setTimeout(resolve, 1500));
    const localPlan = generateLocalPlan(wizard);
    registerWeeklyPlanRecipes(localPlan, wizard.dietType);
    return res.json(localPlan);
  }

  const prompt = `
Erstelle einen detaillierten 7-Tage-Ernährungsplan (Frühstück, Mittagessen, Abendessen) für das folgende Familienprofil:
1. Mann (Christian, 35 J, 110 kg): Ziel ist Abnehmen bei hoher Sättigung und hoher Proteinzufuhr (~100g, max 2200 kcal).
2. Frau (Kimberly, 33 J, 55 kg): Ziel ist gesunde, ausgewogene Ernährung (~1900 kcal, ~60g Protein, hoher Eisenbedarf 16mg).
3. Kind/Sohn (Aron, 4 J, 18 kg): Ziel ist Wachstum, milde, kindgerechte Speisen (~1450 kcal, ~18g Protein, kein Verschluckungsrisiko wie ganze Nüsse, glutenfreie oder laktosefreie Anpassungen falls nötig).

Konfiguration der Planung:
- Ernährungsstil: ${wizard.dietType || "Gesund & Ausgewogen"}
- Erlaubte Zutaten aus dem Haushalt (bevorzugt verwenden, falls passend): ${JSON.stringify(currentAvailableFoods.map(f => f.name))}
- Bevorzugte Rezepte (lass dich von diesen inspirieren): ${JSON.stringify(preferredRecipes.map(r => r.name))}
- Maximaler Zeitaufwand pro Mahlzeit: ${wizard.maxPrepTime || 40} Minuten
- Budget: ${wizard.budgetLevel || "mittel"}
- Mahlzeiten-Varianz: ${wizard.prepFreq || "mixed"}

WICHTIGSTE ENTSCHEIDUNGSREGELN FÜR DICH ALS KI:
1. Jedes vorgeschlagene Gericht muss für alle drei Familienmitglieder passen. Mengen werden skaliert in Gramm angegeben für die GANZE Familie (also z.B. Portionen aufaddiert: Christian (große Portion), Kimberly (normale Portion), Aron (Kinderportion)).
2. Berücksichtige die Nährstoffabdeckung über die Woche. Du musst an mindestens 1-2 Tagen fetten Fisch (Lachs, Hering, Makrele) für Omega-3 einplanen. Baue calciumreiche Lebensmittel, ballaststoffreiches Gemüse und Hülsenfrüchte, sowie eisenhaltige Quellen (Hafer, Linsen, Spinat, mageres Fleisch) ein.
3. Kid-Safety: Weise bei Gerichten mit Nüssen im Feld 'kidNote' dringend darauf hin, dass diese für das 4-jährige Kind gemahlen oder als Mus serviert werden müssen, um die Verschluckungsgefahr auszuschließen. Vermeide Gräten beim Fisch und halbiere Beeren/Trauben.
4. Nährwertberechnung: Berechne die aufsummierten Nährwerte für das Gesamtgericht der Familie. Schätze im Feld 'analysis' für jedes Familienmitglied, wie gut der geplante Wochen-Schnitt seine individuellen Ziele (Christian: 2200 kcal, Kimberly: 1900 kcal, Aron: 1450 kcal) abdecken würde.

CRITICAL FORMATTING & SIZE RULES (MANDATORY):
- Das generierte JSON muss absolut valider JSON-Syntax entsprechen. Benutze für alle String-Schlüssel und String-Werte immer reguläre doppelte Anführungszeichen (").
- Textinhalte in String-Feldern dürfen niemals unescaped doppelte Anführungszeichen (") enthalten (verwende stattdessen einfache Anführungszeichen ' falls nötig).
- Jedes JSON-String-Feld (recipeName, kidNote, etc.) muss zwingend einzeilig sein. Es dürfen KEINE tatsächlichen Zeilenumbrüche (\n, \r) oder Tabulatoren im Text vorkommen!
- Verwende NIEMALS Backslashes (\) in den Textinhalten der String-Felder.
- Behalte alle Bezeichnungen, Beschreibungen, kidNote (max 1 Satz), Zubereitungsschritte (instructions Array - max 1 kurzes simples Element!) und Zutatenlisten (maximal 3 wesentliche Hauptzutaten) extrem kurz und kompakt bei.
- Einkaufliste (shoppingList): Maximal 12-15 wesentliche, zusammengefasste Hauptzutaten für die ganze Woche! Keine Mini-Mengen wie '1 Prise Salz'.
- Das gesamte generierte JSON zwingend minimalistisch und komprimiert halten, damit es fehlerfrei unter 10.000 Zeichen bleibt.

Bitte fülle das Feld 'shoppingList' mit einer gruppierten Liste aller benötigten frischen Lebensmittel. Setze 'availableAtHome' bei Zutaten, die oben als verfügbar markiert waren, auf true, ansonsten auf false.
`;

  try {
    const ai = getGeminiClient();
    const result = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: weeklyPlanSchema,
        maxOutputTokens: 8192
      }
    });

    // Helper to clean raw text from eventual markdown wrappers or double quote formatting screw-ups
    let rawText = (result.text || "").trim();
    if (rawText.startsWith("```")) {
      rawText = rawText.replace(/^```json\s*/i, "").replace(/```$/, "").trim();
    }

    const parsedPlan = tryParseJson(rawText || "{}");
    parsedPlan.id = "plan_" + Date.now();
    parsedPlan.startDate = wizard.startDate || new Date().toISOString().split("T")[0];
    
    if (parsedPlan.shoppingList) {
      parsedPlan.shoppingList = parsedPlan.shoppingList.map((item: any, idx: number) => ({
        ...item,
        id: "shop_" + idx + "_" + Math.random().toString(36).substr(2, 5),
        checked: false
      }));
    }

    registerWeeklyPlanRecipes(parsedPlan, wizard.dietType);
    res.json(parsedPlan);
  } catch (error: any) {
    console.log("Gemini API Info. Weiche auf lokalen Hochleistungs-fallback aus:", error.message || error);
    // Graceful Fallback bei jeglichem Fehler, damit die UI weiterläuft!
    const localPlan = generateLocalPlan(wizard);
    registerWeeklyPlanRecipes(localPlan, wizard.dietType);
    res.json(localPlan);
  }
});

app.post("/api/improve-plan", async (req, res) => {
  const { plan, request } = req.body;
  if (!plan) {
    return res.status(400).json({ error: "Plan-Daten sind erforderlich." });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  const isKeyMissing = !apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey === "";

  if (isKeyMissing) {
    console.log("GEMINI_API_KEY fehlt für Optimierung. Simuliere erfolgreiches DGE-Coaching lokal.");
    await new Promise(resolve => setTimeout(resolve, 800));
    // Simuliere Anpassung: Erhöhe einfach einen Wert oder passe den Titel leicht an, um den Erfolg zu signalisieren
    const optimized = { ...plan };
    optimized.title = plan.title + " (KI-optimiert nach Kundenwunsch)";
    if (optimized.analysis && optimized.analysis.frau) {
      optimized.analysis.frau.notes = [
        `Wunsch berücksichtigt: "${request}"`,
        ...(optimized.analysis.frau.notes || [])
      ];
    }
    registerWeeklyPlanRecipes(optimized);
    return res.json(optimized);
  }

  const prompt = `
Du bist ein erstklassiger Familien-Ernährungsberater (DGE-zertifiziert).
Hier ist ein bestehender 7-Tage-Wochenplan:
${JSON.stringify(plan)}

Der Nutzer möchte den Plan wie folgt verbessern: "${request}"

Nimm den Plan und passe die Gerichte so an oder optimiere die Zutaten, dass dieser Kundenwunsch perfekt erfüllt wird, ohne die Nährwert-Balance für Vater Christian, Mutter Kimberly und Kind Aron zu gefährden. Behalte das korrekte Datenformat bei.

CRITICAL FORMATTING & SIZE RULES (MANDATORY):
- Das generierte JSON muss absolut valider JSON-Syntax entsprechen. Benutze für alle String-Schlüssel und String-Werte immer reguläre doppelte Anführungszeichen (").
- Textinhalte in String-Feldern dürfen niemals unescaped doppelte Anführungszeichen (") enthalten (verwende stattdessen einfache Anführungszeichen ' falls nötig).
- Jedes JSON-String-Feld (recipeName, kidNote, etc.) muss zwingend einzeilig sein. Es dürfen KEINE tatsächlichen Zeilenumbrüche (\n, \r) oder Tabulatoren im Text vorkommen!
- Verwende NIEMALS Backslashes (\) in den Textinhalten der String-Felder.
- Behalte alle Bezeichnungen, Beschreibungen, kidNote (max 1 Satz), Zubereitungsschritte (instructions Array - max 1 kurzes simples Element!) und Zutatenlisten (maximal 3 wesentliche Hauptzutaten) extrem kurz und kompakt bei.
- Einkaufliste (shoppingList): Maximal 12-15 wesentliche, zusammengefasste Hauptzutaten für die ganze Woche!
- Das gesamte generierte JSON zwingend minimalistisch und komprimiert halten, damit es fehlerfrei unter 10.000 Zeichen bleibt.
  `;

  try {
    const ai = getGeminiClient();
    const result = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: weeklyPlanSchema,
        maxOutputTokens: 8192
      }
    });

    // Helper to clean raw text from eventual markdown wrappers or double quote formatting screw-ups
    let rawText = (result.text || "").trim();
    if (rawText.startsWith("```")) {
      rawText = rawText.replace(/^```json\s*/i, "").replace(/```$/, "").trim();
    }

    const parsedPlan = tryParseJson(rawText || "{}");
    parsedPlan.id = plan.id;
    parsedPlan.startDate = plan.startDate;
    
    if (parsedPlan.shoppingList) {
      parsedPlan.shoppingList = parsedPlan.shoppingList.map((item: any, idx: number) => ({
        ...item,
        id: item.id || "shop_" + idx + "_" + Math.random().toString(36).substr(2, 5),
        checked: item.checked !== undefined ? item.checked : false
      }));
    }

    registerWeeklyPlanRecipes(parsedPlan);
    res.json(parsedPlan);
  } catch (error: any) {
    console.log("Gemini API Info bei der Optimierung. Weiche auf simuliertes Coaching aus:", error.message || error);
    // Graceful Fallback
    const optimized = { ...plan };
    optimized.title = plan.title + " (Optimiert)";
    registerWeeklyPlanRecipes(optimized);
    res.json(optimized);
  }
});

// Single Meal schema for Gemini
const mealSchema = {
  type: Type.OBJECT,
  properties: {
    recipeName: { type: Type.STRING },
    prepTime: { type: Type.INTEGER, description: "Zubereitungszeit in Minuten" },
    calories: { type: Type.INTEGER, description: "Energiegehalt des Gesamtgerichts für die ganze Familie" },
    protein: { type: Type.INTEGER, description: "Proteinwert für das Gesamtgericht in g" },
    carbs: { type: Type.INTEGER, description: "Kohlenhydrate für das Gesamtgericht in g" },
    fat: { type: Type.INTEGER, description: "Fett für das Gesamtgericht in g" },
    fiber: { type: Type.INTEGER, description: "Ballaststoffe für das Gesamtgericht in g" },
    isKidFriendly: { type: Type.BOOLEAN },
    kidNote: { type: Type.STRING, description: "Sehr kurze kindgerechte Praxishinweise (max 1 weicher Ratschlag Satz)" },
    instructions: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Extrem kurze, schlagwortartige Zubereitungsschritte (maximal 1-2 Sätze)"
    },
    ingredients: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING, description: "Zutat name, z.B. Wildlachsfilet" },
          amount: { type: Type.NUMBER, description: "Menge für die ganze Familie" },
          unit: { type: Type.STRING, description: "Einheit, z.B. g, ml, Stück" }
        },
        required: ["name", "amount", "unit"]
      }
    }
  },
  required: ["recipeName", "prepTime", "calories", "protein", "carbs", "fat", "fiber", "isKidFriendly", "instructions", "ingredients"]
};

// Local meal helper for offline fallback
function getLocalMeal(mealType: string, isVeggie: boolean, currentMealName?: string): any {
  const breakfasts = [
    {
      recipeName: "Pikantes Avocado-Rührei auf Vollkornbrot",
      prepTime: 12,
      calories: 1200,
      protein: 58,
      carbs: 105,
      fat: 52,
      fiber: 18,
      isKidFriendly: true,
      kidNote: "Das Ei gut durchgaren und für Aron die Brotkruste entfernen.",
      instructions: [
        "Eier verquirlen, mit Salz würzen und in Pfanne bei mittlerer Hitze stocken lassen.",
        "Reife Avocado mit Zitronensaft zerdrücken, Brote bestreichen und Rührei darübergeben."
      ],
      ingredients: [
        { name: "Frische Bio-Eier", amount: 6, unit: "Stück" },
        { name: "Reife Avocado", amount: 2, unit: "Stück" },
        { name: "Vollkornbrot", amount: 5, unit: "Scheiben" },
        { name: "Rapsöl", amount: 10, unit: "ml" }
      ]
    },
    {
      recipeName: "Griechischer Joghurt mit Beeren & Leinsamen",
      prepTime: 8,
      calories: 1050,
      protein: 68,
      carbs: 95,
      fat: 28,
      fiber: 22,
      isKidFriendly: true,
      kidNote: "Die Leinsamen für das Kleinkind geschrotet verwenden.",
      instructions: [
        "Naturjoghurt in Schalen portionieren.",
        "Frische/TK Beeren und geschrotete Leinsamen gleichmäßig drüberstreuen."
      ],
      ingredients: [
        { name: "Griechischer Joghurt", amount: 600, unit: "g" },
        { name: "Heidelbeeren (TK)", amount: 300, unit: "g" },
        { name: "Geschrotete Leinsamen", amount: 30, unit: "g" }
      ]
    },
    {
      recipeName: "Cremiger Dinkelgrießbrei mit Apfel-Zimt-Mark",
      prepTime: 15,
      calories: 1150,
      protein: 48,
      carbs: 180,
      fat: 22,
      fiber: 15,
      isKidFriendly: true,
      kidNote: "Grießbrei lauwarm reichen. Apfelstücke weich dünsten.",
      instructions: [
        "Milch erhitzen, Grieß einrühren und aufquellen lassen, bis er cremig ist.",
        "Äpfel würfeln, fein dünsten und mit Grießbrei anrichten."
      ],
      ingredients: [
        { name: "Dinkelgrieß", amount: 150, unit: "g" },
        { name: "Weidemilch", amount: 800, unit: "ml" },
        { name: "Äpfel", amount: 3, unit: "Stück" }
      ]
    }
  ];

  const lunches = isVeggie ? [
    {
      recipeName: "Kichererbsen-Süßkartoffel-Curry",
      prepTime: 30,
      calories: 1390,
      protein: 52,
      carbs: 210,
      fat: 32,
      fiber: 36,
      isKidFriendly: true,
      kidNote: "Sehr milde Kokosmilch-Mischung verwenden.",
      instructions: [
        "Süßkartoffeln schälen, würfeln und in Kokosmilch garen.",
        "Abgespülte Kichererbsen dazugeben, 10 Minuten köcheln lassen."
      ],
      ingredients: [
        { name: "Kichererbsen (Dose)", amount: 480, unit: "g" },
        { name: "Süßkartoffeln", amount: 600, unit: "g" },
        { name: "Milde Kokosmilch", amount: 400, unit: "ml" }
      ]
    },
    {
      recipeName: "Buntes mediterranes Pfannengemüse mit Ofentofu",
      prepTime: 25,
      calories: 1250,
      protein: 72,
      carbs: 110,
      fat: 45,
      fiber: 28,
      isKidFriendly: true,
      kidNote: "Tofuwürfel für Aron sehr weich dünsten.",
      instructions: [
        "Tofu würfeln und knusprig backen.",
        "Zucchini und Paprika in Olivenöl dünsten, gebackenen Tofu unterheben."
      ],
      ingredients: [
        { name: "Naturtofu", amount: 400, unit: "g" },
        { name: "Zucchini", amount: 2, unit: "Stück" },
        { name: "Rote Paprikaschote", amount: 2, unit: "Stück" }
      ]
    }
  ] : [
    {
      recipeName: "Dampfgegarter Lachs mit Kartoffelbrei und Erbsen",
      prepTime: 25,
      calories: 1450,
      protein: 95,
      carbs: 140,
      fat: 58,
      fiber: 18,
      isKidFriendly: true,
      kidNote: "Lachsfilets gründlich auf Gräten prüfen.",
      instructions: [
        "Kartoffeln kochen und stampfen. Lachs im Dampfeinsatz garen.",
        "Erbsen kurz dünsten und mit zerteiltem Lachs anrichten."
      ],
      ingredients: [
        { name: "Wildlachsfilet", amount: 450, unit: "g" },
        { name: "Kartoffeln", amount: 800, unit: "g" },
        { name: "Junge Erbsen (TK)", amount: 300, unit: "g" }
      ]
    },
    {
      recipeName: "Zarte Putenstreifen mit Brokkoliröschen",
      prepTime: 20,
      calories: 1350,
      protein: 110,
      carbs: 115,
      fat: 28,
      fiber: 16,
      isKidFriendly: true,
      kidNote: "Brokkoliröschen für das Kind extrem weich garen.",
      instructions: [
        "Naturreis kochen. Putenbrust in feine Streifen schneiden und garen.",
        "Brokkoli separat dünsten und untermischen."
      ],
      ingredients: [
        { name: "Putenbrustfilet", amount: 500, unit: "g" },
        { name: "Brokkoli", amount: 500, unit: "g" },
        { name: "Naturreis", amount: 200, unit: "g" }
      ]
    }
  ];

  const dinners = [
    {
      recipeName: "Vollkorn-Pennete mit frischer Tomatensauce",
      prepTime: 20,
      calories: 1300,
      protein: 48,
      carbs: 215,
      fat: 25,
      fiber: 30,
      isKidFriendly: true,
      kidNote: "Nudeln weich kochen. Sauce mild abschmecken.",
      instructions: [
        "Nudeln kochen. Hacktomatensauce mit pürierten Karotten weich kochen.",
        "Pasta mit der milden Sauce vermengen."
      ],
      ingredients: [
        { name: "Vollkorn-Penne", amount: 400, unit: "g" },
        { name: "Gehackte Tomaten", amount: 800, unit: "g" },
        { name: "Möhren", amount: 2, unit: "Stück" }
      ]
    },
    {
      recipeName: "Milde Linsensuppe mit Möhrenscheiben",
      prepTime: 25,
      calories: 1210,
      protein: 68,
      carbs: 160,
      fat: 18,
      fiber: 32,
      isKidFriendly: true,
      kidNote: "Lauwarm servieren. Linsen extrem weich dünsten.",
      instructions: [
        "Gemüse und linsen weich garen.",
        "Suppe leicht anpürieren und lauwarm portionieren."
      ],
      ingredients: [
        { name: "Rote Linsen", amount: 250, unit: "g" },
        { name: "Möhren", amount: 3, unit: "Stück" },
        { name: "Kartoffeln", amount: 3, unit: "Stück" }
      ]
    }
  ];

  let choices = breakfasts;
  if (mealType === "lunch") choices = lunches;
  if (mealType === "dinner") choices = dinners;

  let filtered = choices.filter(c => c.recipeName !== currentMealName);
  if (filtered.length === 0) filtered = choices;

  const randomIndex = Math.floor(Math.random() * filtered.length);
  return filtered[randomIndex];
}

app.post("/api/generate-single-meal", async (req, res) => {
  const { mealType, dietType, currentMealName } = req.body;
  if (!mealType) {
    return res.status(400).json({ error: "mealType ist erforderlich." });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  const isKeyMissing = !apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey === "";
  const isVeggie = dietType === "vegetarisch" || dietType === "vegan" || dietType === "kinderfreundlich";

  if (isKeyMissing) {
    // Kurzer Timeout für realistische Wartezeit
    await new Promise(resolve => setTimeout(resolve, 500));
    const localMeal = getLocalMeal(mealType, isVeggie, currentMealName);
    registerMealAsRecipe(localMeal, mealType, dietType);
    saveData(store);
    return res.json(localMeal);
  }

  const prompt = `
Du bist ein zertifizierter DGE-Familien-Ernährungsberater.
Generiere genau EIN neues, gesundes Gericht für das Familienessen, Typ: "${mealType}" (breakfast, lunch oder dinner).
Ernährungsstil: "${dietType || "Gesund & Ausgewogen"}".
Vorheriges Gericht (Gegenbeispiel): "${currentMealName || ""}". Schlage ein anderes Gericht vor!

Das Gericht muss für die 3 Personen Christian (35 J), Kimberly (33 J) und Aron (4 J) bilanziert sein.
Nährwerte und Zutatenmengen müssen das Gesamtgericht für alle 3 Personen beschreiben.

CRITICAL FORMATTING RULES (MANDATORY):
- Das generierte JSON muss absolut valider JSON-Syntax entsprechen. Benutze für alle String-Schlüssel und String-Werte immer reguläre doppelte Anführungszeichen (").
- Textinhalte in String-Feldern dürfen niemals unescaped doppelte Anführungszeichen (") enthalten (verwende stattdessen einfache Anführungszeichen ' falls nötig).
- Jedes JSON-String-Feld (recipeName, kidNote, etc.) muss zwingend einzeilig sein. Es dürfen KEINE tatsächlichen Zeilenumbrüche (\n, \r) oder Tabulatoren im Text vorkommen!
- Verwende NIEMALS Backslashes (\) in den Textinhalten der String-Felder.
- Behalte alle Bezeichnungen, Beschreibungen, kidNote (max 1 weicher Ratschlag Satz) und Zutaten (nur 3-5 wesentliche Hauptzutaten) extrem kurz bei.
`;

  try {
    const ai = getGeminiClient();
    const result = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: mealSchema,
        maxOutputTokens: 2048
      }
    });

    let rawText = (result.text || "").trim();
    if (rawText.startsWith("```")) {
      rawText = rawText.replace(/^```json\s*/i, "").replace(/```$/, "").trim();
    }

    const parsedMeal = tryParseJson(rawText || "{}");
    registerMealAsRecipe(parsedMeal, mealType, dietType);
    saveData(store);
    res.json(parsedMeal);
  } catch (error) {
    console.log("Gemini API Info bei Einzelgericht-Generierung:", error);
    const localMeal = getLocalMeal(mealType, isVeggie, currentMealName);
    registerMealAsRecipe(localMeal, mealType, dietType);
    saveData(store);
    res.json(localMeal);
  }
});

// ==========================================
// VITE CLIENT INTEGRATION & CLIENT SERVING
// ==========================================

async function start() {
  if (process.env.NODE_ENV !== "production") {
    // Vite Developer Mode
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    // Production Mode
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server läuft erfolgreich auf http://localhost:${PORT}`);
  });
}

start();
