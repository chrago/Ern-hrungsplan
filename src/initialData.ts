/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { FamilyMember, FoodItem, Recipe } from "./types";

export const INITIAL_FAMILY: FamilyMember[] = [
  {
    id: "mann",
    name: "Christian (Vater)",
    role: "mann",
    age: 35,
    weight: 110,
    goal: "abnehmen",
    activityLevel: "niedrig",
    allergies: [],
    preferences: ["proteinreich", "deftig", "kartoffeln", "fleisch"],
    dislikes: ["pilze", "sehr scharf"],
    nutrientGoals: {
      calories: 2200, // Defizit zum Abnehmen bei 110 kg
      protein: 100,  // erhöhtes Protein für Sättigung & Muskelschutz
      fat: 70,
      carbs: 260,
      fiber: 35,
      water: 1.5,
      vitA: 850,
      vitB12: 4.0,
      vitC: 110,
      vitD: 20,
      calcium: 1000,
      magnesium: 350,
      iron: 11,
      zinc: 14,
      iodine: 150,
      omega3: 250
    }
  },
  {
    id: "frau",
    name: "Kimberly (Mutter)",
    role: "frau",
    age: 33,
    weight: 55,
    goal: "gesund",
    activityLevel: "normal",
    allergies: [],
    preferences: ["gemüse", "leicht", "fisch", "vollkorn"],
    dislikes: ["innereien"],
    nutrientGoals: {
      calories: 1900,
      protein: 60,
      fat: 60,
      carbs: 240,
      fiber: 30,
      water: 1.5,
      vitA: 700,
      vitB12: 4.0,
      vitC: 95,
      vitD: 20,
      calcium: 1000,
      magnesium: 300,
      iron: 16, // erhöhter Bedarf für Frauen im gebärfähigen Alter
      zinc: 8,
      iodine: 150,
      omega3: 250
    }
  },
  {
    id: "sohn",
    name: "Aron (Sohn)",
    role: "sohn",
    age: 4,
    weight: 18,
    goal: "halten", // gesundes Wachstum
    activityLevel: "sportlich", // Kinder bewegen sich viel
    allergies: [],
    preferences: ["nudeln", "kartoffelpüree", "beeren", "fischstäbchen", "mild"],
    dislikes: ["scharf", "ganze nüsse", "bitter"],
    nutrientGoals: {
      calories: 1450,
      protein: 18,
      fat: 50,
      carbs: 180,
      fiber: 20,
      water: 1.0,
      vitA: 350,
      vitB12: 2.0,
      vitC: 30,
      vitD: 20,
      calcium: 750,
      magnesium: 190,
      iron: 7,
      zinc: 4,
      iodine: 90,
      omega3: 150
    }
  }
];

export const INITIAL_FOODS: FoodItem[] = [
  // Beilagen
  {
    id: "kartoffeln",
    name: "Kartoffeln",
    category: "Beilagen",
    calories: 77, protein: 2.0, carbs: 17.0, fat: 0.1, fiber: 2.1,
    potassium: 410, vitC: 17, calcium: 6, iron: 0.8,
    isAvailable: true, stockAmount: "2.5 kg"
  },
  {
    id: "suesskartoffeln",
    name: "Süßkartoffeln",
    category: "Beilagen",
    calories: 86, protein: 1.6, carbs: 20.0, fat: 0.1, fiber: 3.0,
    vitA: 14187, vitC: 2.4, potassium: 337,
    isAvailable: true, stockAmount: "1.0 kg"
  },
  {
    id: "basmatireis",
    name: "Basmatireis (Vollkorn)",
    category: "Beilagen",
    calories: 350, protein: 7.5, carbs: 75.0, fat: 2.5, fiber: 3.5,
    magnesium: 110, zinc: 1.5,
    isAvailable: true, stockAmount: "1.5 kg"
  },
  {
    id: "dinkelvollkornnudeln",
    name: "Dinkel-Vollkornnudeln",
    category: "Beilagen",
    calories: 345, protein: 14.5, carbs: 65.0, fat: 2.0, fiber: 8.0,
    magnesium: 130, iron: 4.2,
    isAvailable: false
  },
  {
    id: "haferflocken",
    name: "Zarte Haferflocken",
    category: "Beilagen",
    calories: 372, protein: 13.5, carbs: 58.7, fat: 7.0, fiber: 10.0,
    magnesium: 130, iron: 4.5, zinc: 3.2, vitB1: 0.6,
    isAvailable: true, stockAmount: "1.0 kg"
  },
  {
    id: "vollkornbrot",
    name: "Vollkornbrot (Sauerteig)",
    category: "Beilagen",
    calories: 220, protein: 7.0, carbs: 41.0, fat: 1.2, fiber: 7.5,
    magnesium: 60, zinc: 1.8,
    isAvailable: true, stockAmount: "500g"
  },

  // Gemüse
  {
    id: "brokkoli",
    name: "Brokkoli (frisch)",
    category: "Gemüse",
    calories: 34, protein: 2.8, carbs: 3.0, fat: 0.4, fiber: 3.0,
    vitC: 95, vitK: 101, folate: 63, calcium: 47, magnesium: 21,
    isAvailable: true, stockAmount: "500g"
  },
  {
    id: "spinat",
    name: "Babyspinat",
    category: "Gemüse",
    calories: 23, protein: 2.9, carbs: 0.6, fat: 0.4, fiber: 2.2,
    vitA: 780, vitC: 28, vitK: 483, folate: 194, iron: 2.7, calcium: 99,
    isAvailable: false
  },
  {
    id: "rote_paprika",
    name: "Rote Paprika",
    category: "Gemüse",
    calories: 31, protein: 1.0, carbs: 6.0, fat: 0.3, fiber: 1.8,
    vitC: 120, vitA: 150, potassium: 211,
    isAvailable: true, stockAmount: "3 Stück"
  },
  {
    id: "karotten",
    name: "Karotten",
    category: "Gemüse",
    calories: 39, protein: 0.8, carbs: 4.8, fat: 0.2, fiber: 3.1,
    vitA: 1654, potassium: 290, calcium: 30,
    isAvailable: true, stockAmount: "1.0 kg"
  },
  {
    id: "knoblauch",
    name: "Knoblauch",
    category: "Gemüse",
    calories: 149, protein: 6.4, carbs: 28.4, fat: 0.5, fiber: 2.1,
    isAvailable: true, stockAmount: "2 Knollen"
  },

  // Obst
  {
    id: "apfel",
    name: "Äpfel",
    category: "Obst",
    calories: 52, protein: 0.3, carbs: 11.4, fat: 0.2, fiber: 2.4,
    vitC: 12, potassium: 120,
    isAvailable: true, stockAmount: "1.2 kg"
  },
  {
    id: "banane",
    name: "Bananen",
    category: "Obst",
    calories: 89, protein: 1.1, carbs: 20.3, fat: 0.3, fiber: 2.0,
    potassium: 358, vitB6: 0.4, magnesium: 27,
    isAvailable: true, stockAmount: "5 Stück"
  },
  {
    id: "heidelbeeren",
    name: "Heidelbeeren (TK)",
    category: "Obst",
    calories: 42, protein: 0.6, carbs: 8.5, fat: 0.6, fiber: 2.5,
    vitC: 15,
    isAvailable: false, stockAmount: "0g"
  },

  // Fleisch
  {
    id: "haehnchenbrust",
    name: "Hähnchenbrustfilet (Bio)",
    category: "Fleisch",
    calories: 110, protein: 23.0, carbs: 0.0, fat: 1.5, fiber: 0.0,
    zinc: 1.0, iron: 0.7, vitB6: 0.5,
    isAvailable: false
  },
  {
    id: "rinderhack",
    name: "Rinderhackfleisch (Bio, mager)",
    category: "Fleisch",
    calories: 220, protein: 20.0, carbs: 0.0, fat: 15.0, fiber: 0.0,
    iron: 2.5, zinc: 4.5, vitB12: 2.1,
    isAvailable: false
  },

  // Fisch
  {
    id: "lachsfilet",
    name: "Wildlachsfilet",
    category: "Fisch & Meeresfrüchte",
    calories: 180, protein: 20.0, carbs: 0.0, fat: 10.0, fiber: 0.0,
    omega3: 1500, vitD: 16, iodine: 40, selenium: 30, B12: 3.5,
    isAvailable: true, stockAmount: "300g"
  },

  // Eier
  {
    id: "ei",
    name: "Hühnereier (Größe M)",
    category: "Eier",
    calories: 155, protein: 13.0, carbs: 1.1, fat: 11.0, fiber: 0.0,
    vitD: 2.9, vitB12: 1.8, selenium: 31,
    isAvailable: true, stockAmount: "10 Stück"
  },

  // Milchprodukte & pflanzliche Alternativen
  {
    id: "magerquark",
    name: "Magerquark",
    category: "Milchprodukte & Alternativen",
    calories: 68, protein: 12.0, carbs: 4.0, fat: 0.2, fiber: 0.0,
    calcium: 120, vitB2: 0.3,
    isAvailable: true, stockAmount: "1.0 kg"
  },
  {
    id: "frischmilch",
    name: "Weide-Frischmilch (3.5% Fett)",
    category: "Milchprodukte & Alternativen",
    calories: 64, protein: 3.3, carbs: 4.8, fat: 3.5, fiber: 0.0,
    calcium: 120, iodine: 10, vitB12: 0.4,
    isAvailable: true, stockAmount: "2 Liter"
  },
  {
    id: "naturjoghurt",
    name: "Naturjoghurt (1.5% Fett)",
    category: "Milchprodukte & Alternativen",
    calories: 50, protein: 3.8, carbs: 5.2, fat: 1.5, fiber: 0.0,
    calcium: 130, B2: 0.2,
    isAvailable: true, stockAmount: "500g"
  },
  {
    id: "gouda",
    name: "Gouda jung (Scheiben)",
    category: "Milchprodukte & Alternativen",
    calories: 350, protein: 23.0, carbs: 0.0, fat: 28.0, fiber: 0.0,
    calcium: 800, zinc: 3.8,
    isAvailable: true, stockAmount: "200g"
  },

  // Hülsenfrüchte
  {
    id: "tellerlinsen",
    name: "Berglinsen / Tellerlinsen",
    category: "Hülsenfrüchte & pflanzliche Proteinquellen",
    calories: 320, protein: 24.0, carbs: 48.0, fat: 1.5, fiber: 14.0,
    iron: 7.0, zinc: 3.1, magnesium: 120, folate: 200,
    isAvailable: true, stockAmount: "500g"
  },
  {
    id: "kichererbsen_dose",
    name: "Kichererbsen (Dose)",
    category: "Hülsenfrüchte & pflanzliche Proteinquellen",
    calories: 120, protein: 7.0, carbs: 18.0, fat: 2.0, fiber: 5.5,
    potassium: 180, iron: 1.5,
    isAvailable: false
  },

  // Nüsse & Samen
  {
    id: "walnusserne",
    name: "Walnusskerne",
    category: "Nüsse, Samen & Kerne",
    calories: 654, protein: 15.0, carbs: 13.7, fat: 65.2, fiber: 6.7,
    omega3: 9000, vitE: 6.0, magnesium: 150,
    isAvailable: true, stockAmount: "200g"
  },
  {
    id: "leinsamen",
    name: "Leinsamen (geschrotet)",
    category: "Nüsse, Samen & Kerne",
    calories: 534, protein: 18.3, carbs: 1.5, fat: 42.2, fiber: 27.3,
    omega3: 22800, calcium: 255, magnesium: 390,
    isAvailable: false
  },

  // Öle & Fette
  {
    id: "rapsoel",
    name: "Rapsöl (kaltgepresst / raffiniert)",
    category: "Fette & Öle",
    calories: 884, protein: 0.0, carbs: 0.0, fat: 100.0, fiber: 0.0,
    omega3: 9000, vitE: 30.0,
    isAvailable: true, stockAmount: "500 ml"
  },
  {
    id: "olivenoel",
    name: "Olivenöl extra nativ",
    category: "Fette & Öle",
    calories: 884, protein: 0.0, carbs: 0.0, fat: 100.0, fiber: 0.0,
    vitE: 14.0,
    isAvailable: true, stockAmount: "750 ml"
  }
];

export const INITIAL_RECIPES: Recipe[] = [
  {
    id: "lachs_kartoffeln_brokkoli",
    name: "Ofenlachs mit Kartoffelecken & Zitronen-Brokkoli",
    mealType: "dinner",
    prepTime: 35,
    difficulty: "einfach",
    diets: ["Gesund", "Omega-3-Booster", "Kinderfreundlich", "High-Protein"],
    ingredients: [
      { foodItemId: "lachsfilet", name: "Wildlachsfilet", amount: 450, unit: "g", notes: "grätenfrei" },
      { foodItemId: "kartoffeln", name: "Kartoffeln", amount: 800, unit: "g", notes: "in Spalten geschnitten" },
      { foodItemId: "brokkoli", name: "Brokkoli", amount: 600, unit: "g", notes: "in Röschen" },
      { foodItemId: "rapsoel", name: "Rapsöl", amount: 2, unit: "EL" },
      { name: "Zitrone (Saft)", amount: 1, unit: "Stück" },
      { name: "Gewürze (Kräuter, Jodsalz, Paprika)", amount: 1, unit: "Prise" }
    ],
    instructions: [
      "Den Backofen auf 200°C Ober-/Unterhitze vorheizen.",
      "Kartoffeln waschen und in Spalten schneiden. Mit 1 EL Rapsöl, Paprikapulver und Jodsalz marinieren und für ca. 30 Min. auf einem Backblech rösten.",
      "Nach 15 Min. die Lachsfilets daneben legen. Lachs leicht salzen und mit etwas Zitronensaft beträufeln.",
      "Währendessen den Brokkoli in Röschen schneiden, in Wasser oder Dampfeinsatz dämpfen, bis er bissfest ist. Mit der verbliebenen Rapsöl-Menge beträufeln.",
      "Alles appetitlich anrichten. Für das Kind die Kartoffeln und den Brokkoli ggf. mundgerecht schneiden."
    ],
    calories: 1400, // für die ganze Familie zusammengerechnet
    protein: 105,
    carbs: 154,
    fat: 45,
    fiber: 26,
    highlights: ["Reich an wertvollen marinen Omega-3-Fettsäuren (EPA/DHA)", "Hervorragende Vitamin C + Vitamin K Quelle durch Brokkoli", "Sehr proteinreich"],
    isKidFriendly: true,
    kidNote: "Milde Würzung verwenden. Brokkoli weich garen und Fisch vor Verzehr auf Gräten prüfen.",
    isFavorite: true,
    rating: 5
  },
  {
    id: "beeren_porridge",
    name: "Warmes Protein-Beeren-Porridge",
    mealType: "breakfast",
    prepTime: 10,
    difficulty: "einfach",
    diets: ["Gesund", "Vegetarisch", "Ballaststoffreich", "Schnell & einfach"],
    ingredients: [
      { foodItemId: "haferflocken", name: "Zarte Haferflocken", amount: 180, unit: "g" },
      { foodItemId: "frischmilch", name: "Weidemilch", amount: 400, unit: "ml" },
      { name: "Wasser", amount: 200, unit: "ml" },
      { foodItemId: "magerquark", name: "Magerquark", amount: 250, unit: "g", notes: "untergerührt am Ende" },
      { foodItemId: "heidelbeeren", name: "TK-Heidelbeeren", amount: 150, unit: "g" },
      { foodItemId: "banane", name: "Bananen", amount: 2, unit: "Stück", notes: "in Scheiben" },
      { foodItemId: "walnusserne", name: "Walnusskerne", amount: 40, unit: "g", notes: "gehackt / gemahlen für das Kind" }
    ],
    instructions: [
      "Haferflocken mit Milch und Wasser in einem Topf aufkochen, dann bei niedriger Hitze 5 Min. quellen lassen.",
      "Topf vom Herd nehmen, den Magerquark einrühren, um den Brei cremig und eiweißreich zu machen.",
      "Die tiefgekühlten Heidelbeeren hineingeben, sodass sie im warmen Brei auftauen.",
      "Das Porridge in Schalen füllen, mit Bananenscheiben belegen und gehackten Walnüssen bestreuen.",
      "Für das Kind: Die Walnüsse sehr fein mahlen oder als Nussmus unterrühren (Ausschluss der Verschluckungsgefahr!)"
    ],
    calories: 1350,
    protein: 65,
    carbs: 185,
    fat: 38,
    fiber: 28,
    highlights: ["Hohe Ballaststoffdichte", "Gute Gehirn-Fette dank Walnuss (B-Vitamine & Magnesium)", "Guter Calciumlieferant"],
    isKidFriendly: true,
    kidNote: "Ausnahmslos gemahlene Nüsse/Nussmus verwenden statt ganzer Stücke. Brei lauwarm servieren.",
    isFavorite: true,
    rating: 4.8
  },
  {
    id: "haehnchen_gemuesepfanne",
    name: "Bunte Hähnchen-Reis-Pfanne",
    mealType: "lunch",
    prepTime: 25,
    difficulty: "einfach",
    diets: ["Gesund", "High-Protein", "Kinderfreundlich"],
    ingredients: [
      { foodItemId: "basmatireis", name: "Basmatireis (Vollkorn)", amount: 250, unit: "g" },
      { foodItemId: "haehnchenbrust", name: "Hähnchenbrustfilet", amount: 400, unit: "g", notes: "in feinen Streifen" },
      { foodItemId: "rote_paprika", name: "Rote Paprika", amount: 2, unit: "Stück", notes: "in mundgerechten Würfeln" },
      { foodItemId: "karotten", name: "Karotten", amount: 200, unit: "g", notes: "in dünnen Scheiben" },
      { foodItemId: "olivenoel", name: "Olivenöl extra nativ", amount: 1.5, unit: "EL" },
      { name: "Gemüsebrühe (salzarm)", amount: 150, unit: "ml" },
      { name: "Kräuter der Provence", amount: 1, unit: "Zweig" }
    ],
    instructions: [
      "Den Basmatireis nach Packungsanleitung in leicht gesalzenem Wasser kochen.",
      "Hähnchenbrust in mundgerechte Stücke schneiden. In einer Pfanne mit 1 EL Olivenöl scharf anbraten, dann herausnehmen.",
      "Das restliche Olivenöl in die Pfanne geben, Paprika- und Karottenscheiben anbraten. Mit Gemüsebrühe ablöschen.",
      "Deckel schließen und das Gemüse für ca. 6-8 Min. dünsten, bis die Karotten weich genug für das Kind sind.",
      "Hähnchen und gekochten Reis unterrühren, kurz erwärmen und mit milden Gewürzen wie Paprika edelsüß, Kräutern und einer Prise Salz abschmecken.",
      "Anrichten. Für das Kind das Fleisch besonders klein schneiden."
    ],
    calories: 1480,
    protein: 108,
    carbs: 195,
    fat: 25,
    fiber: 18,
    highlights: ["Sättigendes Protein", "Extrem hoher Vitamin-C-Gehalt durch gelbe/rote Paprika", "Beta-Carotin-Reich"],
    isKidFriendly: true,
    kidNote: "Milde Gemüsebrühe verwenden, nicht zu stark salzen. Fleischstücke sehr klein schneiden.",
    isFavorite: false
  },
  {
    id: "linsen_bolognese",
    name: "Vollkorn-Spaghetti mit herzhafter Linsen-Bolognese",
    mealType: "dinner",
    prepTime: 30,
    difficulty: "einfach",
    diets: ["Gesund", "Vegetarisch", "Vegan", "Ballaststoffreich", "Budgetfreundlich"],
    ingredients: [
      { name: "Vollkorn-Spaghetti", amount: 350, unit: "g" },
      { foodItemId: "tellerlinsen", name: "Berglinsen/Tellerlinsen", amount: 150, unit: "g", notes: "oder rote Linsen" },
      { name: "Passierte Tomaten", amount: 500, unit: "g" },
      { foodItemId: "karotten", name: "Karotten", amount: 2, unit: "Stück", notes: "fein geraspelt/gewürfelt" },
      { name: "Zwiebel & Knoblauch", amount: 1, unit: "Stück", notes: "feingehackt" },
      { foodItemId: "olivenoel", name: "Olivenöl", amount: 1.5, unit: "EL" },
      { name: "Oregano, Basilikum, Jodsalz", amount: 1, unit: "Prise" }
    ],
    instructions: [
      "Die Spaghetti in kochendem Salzwasser al dente garen.",
      "Linsen waschen. Zwiebeln und Knoblauch fein hacken. Karotten sehr feingliedrig raspeln.",
      "In einem tiefen Topf das Olivenöl erhitzen. Zwiebeln, Knoblauch und Karottenraspel darin andünsten. Die Linsen dazugeben und kurz mit anrösten.",
      "Mit ca. 150ml Wasser und den passierten Tomaten auffüllen. Mit Kräutern würzen. Deckel auflegen und ca. 20-25 Min. leicht köcheln lassen, bis die Linsen schön weich sind.",
      "Die Bolognese eventuell fein pürieren, falls das Kind die Linsenstruktur nicht mag (erhöht die Akzeptanz!). Mit Spaghetti vermengen und servieren."
    ],
    calories: 1550,
    protein: 68,
    carbs: 245,
    fat: 22,
    fiber: 36,
    highlights: ["Eisen- und Zink-Booster über Linsen", "Extrem ballaststoffreich", "100% pflanzlich"],
    isKidFriendly: true,
    kidNote: "Falls die weichen Linsenschalen abgelehnt werden, die Sauce einfach cremig pürieren.",
    isFavorite: true,
    rating: 4.5
  },
  {
    id: "bananen_schnitten",
    name: "Frühstücks-Bananenschnitten mit Quark",
    mealType: "breakfast",
    prepTime: 5,
    difficulty: "einfach",
    diets: ["Gesund", "Vegetarisch", "Schnell & einfach"],
    ingredients: [
      { foodItemId: "vollkornbrot", name: "Vollkornbrot", amount: 6, unit: "Scheiben" },
      { foodItemId: "magerquark", name: "Magerquark", amount: 300, unit: "g", notes: "verfeinert mit etwas Milch glattrühren" },
      { foodItemId: "banane", name: "Bananen", amount: 2, unit: "Stück", notes: "in dünnen Scheiben" },
      { name: "Zimt (optional)", amount: 1, unit: "Messerspitze" }
    ],
    instructions: [
      "Das Vollkornbrot nach Wunsch toasten.",
      "Den Magerquark mit einem Schuss Milch cremig rühren, mit Zimt verfeinern.",
      "Die Brote mit dem Quark bestreichen und mit den dünnen Bananenscheiben belegen.",
      "In handliche Streifen schneiden ('Schnitten'), perfekt für Kinderhände!"
    ],
    calories: 1100,
    protein: 55,
    carbs: 165,
    fat: 10,
    fiber: 18,
    highlights: ["Schneller Energie-Kick", "Zuckerfrei gesüßt durch reife Bananen", "Gutes Protein"],
    isKidFriendly: true,
    kidNote: "Rinde bei Bedarf abschneiden. Tolles Fingerfood für den Vierjährigen.",
    isFavorite: false
  }
];
