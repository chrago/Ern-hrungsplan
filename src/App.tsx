/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  Heart,
  Info,
  Sparkles,
  ShoppingCart,
  Home,
  Calendar,
  Flame,
  User,
  CheckCircle2,
  AlertTriangle,
  Search,
  Coffee,
  Utensils,
  ChefHat,
  Settings,
  ArrowRight,
  ArrowLeft,
  Check,
  CheckSquare,
  Square,
  RotateCcw,
  HelpCircle,
  Send,
  Droplet,
  Filter,
  Activity,
  Apple,
  Fish,
  ChevronRight,
  RefreshCw,
  Clock,
  ThumbsUp,
  X
} from "lucide-react";
import { FamilyMember, FoodItem, Recipe, WeeklyPlan, WizardConfig, ShoppingItem, DayPlan, Meal, FamilyRole } from "./types";

export default function App() {
  // Navigation & Tabs
  const [activeTab, setActiveTab] = useState<"dashboard" | "planner" | "recipes" | "foods" | "shopping" | "family" | "coach">("dashboard");
  const [activeRole, setActiveRole] = useState<FamilyRole>("mann");

  // State Management
  const [family, setFamily] = useState<FamilyMember[]>([]);
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [weeklyPlans, setWeeklyPlans] = useState<WeeklyPlan[]>([]);
  const [activePlan, setActivePlan] = useState<WeeklyPlan | null>(null);

  // Filters & Search
  const [searchRecipe, setSearchRecipe] = useState("");
  const [filterRecipeDiet, setFilterRecipeDiet] = useState("all");
  const [searchFood, setSearchFood] = useState("");
  const [filterFoodCategory, setFilterFoodCategory] = useState("all");

  // Selection & Details Modals
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [isRecipeModalOpen, setIsRecipeModalOpen] = useState(false);
  const [isNewRecipeModalOpen, setIsNewRecipeModalOpen] = useState(false);
  const [isFoodModalOpen, setIsFoodModalOpen] = useState(false);
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);

  // Wizard Flow State
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [wizardConfig, setWizardConfig] = useState<WizardConfig>({
    startDate: new Date().toISOString().split("T")[0],
    mealTypes: ["breakfast", "lunch", "dinner"],
    familyIds: ["mann", "frau", "sohn"],
    dietType: "gesund",
    stockSource: "all",
    excludedCategories: [],
    maxPrepTime: 30,
    budgetLevel: "mittel",
    prepFreq: "mixed"
  });

  // AI Generation Progress
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationLogs, setGenerationLogs] = useState<string[]>([]);
  const [generationProgress, setGenerationProgress] = useState(0);

  // AI Coach Chat
  const [chatMessages, setChatMessages] = useState<Array<{ sender: "user" | "coach"; text: string; action?: string }>>([
    {
      sender: "coach",
      text: "Hallo! Ich bin dein DGE-Ernährungsvermittler. Du kannst mich alles zur optimalen Nährstoffversorgung deiner Familie fragen, z.B. wie wir Kimberlys hohen Eisenbedarf (16mg) decken, oder mich direkt anweisen, das heutige Abendessen auf ein vegetarisches Gericht anzupassen."
    }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isCoachTyping, setIsCoachTyping] = useState(false);

  // Forms
  const [newRecipe, setNewRecipe] = useState<Partial<Recipe>>({
    name: "",
    mealType: "dinner",
    prepTime: 25,
    difficulty: "mittel",
    diets: ["Gesund"],
    ingredients: [],
    instructions: [""],
    calories: 1200,
    protein: 80,
    carbs: 120,
    fat: 40,
    fiber: 20,
    isKidFriendly: true,
    kidNote: "",
  });

  const [newFood, setNewFood] = useState<Partial<FoodItem>>({
    name: "",
    category: "Gemüse",
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    fiber: 0,
    isAvailable: false,
    stockAmount: ""
  });

  const [expandedDay, setExpandedDay] = useState<string>("Montag");

  // Load Data on Mount
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const familyRes = await fetch("/api/family");
      const familyData = await familyRes.json();
      setFamily(familyData);

      const foodsRes = await fetch("/api/foods");
      const foodsData = await foodsRes.json();
      setFoods(foodsData);

      const recipesRes = await fetch("/api/recipes");
      const recipesData = await recipesRes.json();
      setRecipes(recipesData);

      const plansRes = await fetch("/api/weekly-plans");
      const plansData = await plansRes.json();
      setWeeklyPlans(plansData);
      if (plansData.length > 0) {
        setActivePlan(plansData[plansData.length - 1]);
      } else {
        // Erzeuge Standardplan aus initialen Rezepten als Fallback, falls noch kein KI-Plan existiert
        generateFallbackPlan(recipesData);
      }
    } catch (e) {
      console.error("Fehler beim Abrufen der Backendschnittstellen:", e);
    }
  };

  const generateFallbackPlan = (availableRecipes: Recipe[]) => {
    if (availableRecipes.length === 0) return;
    const daysArr = ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"];
    
    // Einfaches Matching
    const breakfast = availableRecipes.find(r => r.mealType === "breakfast") || availableRecipes[1];
    const lunch = availableRecipes.find(r => r.mealType === "lunch") || availableRecipes[2];
    const dinner = availableRecipes.find(r => r.mealType === "dinner") || availableRecipes[0];
    const snack = availableRecipes.find(r => r.mealType === "snack");

    const days: DayPlan[] = daysArr.map(dName => ({
      dayName: dName,
      breakfast: breakfast ? {
        recipeId: breakfast.id,
        recipeName: breakfast.name,
        prepTime: breakfast.prepTime,
        calories: breakfast.calories,
        protein: breakfast.protein,
        carbs: breakfast.carbs,
        fat: breakfast.fat,
        fiber: breakfast.fiber,
        isKidFriendly: breakfast.isKidFriendly,
        isGekocht: false
      } : undefined,
      lunch: lunch ? {
        recipeId: lunch.id,
        recipeName: lunch.name,
        prepTime: lunch.prepTime,
        calories: lunch.calories,
        protein: lunch.protein,
        carbs: lunch.carbs,
        fat: lunch.fat,
        fiber: lunch.fiber,
        isKidFriendly: lunch.isKidFriendly,
        isGekocht: false
      } : undefined,
      dinner: dinner ? {
        recipeId: dinner.id,
        recipeName: dinner.name,
        prepTime: dinner.prepTime,
        calories: dinner.calories,
        protein: dinner.protein,
        carbs: dinner.carbs,
        fat: dinner.fat,
        fiber: dinner.fiber,
        isKidFriendly: dinner.isKidFriendly,
        isGekocht: false
      } : undefined,
    }));

    // Baue temporäre Einkaufsliste
    const list: ShoppingItem[] = [
      { id: "shop_1", name: "Zarte Haferflocken", amount: 1000, unit: "g", category: "Beilagen", checked: false, availableAtHome: true, recipeNames: ["Protein-Beeren-Porridge"] },
      { id: "shop_2", name: "Wildlachsfilet", amount: 450, unit: "g", category: "Fisch & Meeresfrüchte", checked: false, availableAtHome: false, recipeNames: ["Ofenlachs mit Kartoffelecken"] },
      { id: "shop_3", name: "Brokkoli", amount: 1, unit: "Stück", category: "Obst & Gemüse", checked: false, availableAtHome: true, recipeNames: ["Ofenlachs mit Kartoffelecken"] },
      { id: "shop_4", name: "Bio-Eier", amount: 10, unit: "Stück", category: "Eier", checked: false, availableAtHome: true, recipeNames: ["Eierspeisen"] },
      { id: "shop_5", name: "Magerquark", amount: 1000, unit: "g", category: "Milchprodukte & Alternativen", checked: false, availableAtHome: true, recipeNames: ["Bananenschnitten", "Porridge"] }
    ];

    const fallback: WeeklyPlan = {
      id: "fallback_plan",
      title: "Standard-Familienplan (Schnittstelle bereit)",
      startDate: new Date().toISOString().split("T")[0],
      days,
      shoppingList: list,
      analysis: {
        mann: {
          caloriesPct: 92,
          proteinPct: 98,
          carbsPct: 85,
          fatPct: 77,
          fiberPct: 102,
          vitCLevel: "optimum",
          omega3Level: "good",
          calciumLevel: "good",
          ironLevel: "good",
          notes: ["Dein Kalorienziel ist optimal für die Gewichtsreduktion eingestellt.", "Viel Brokkoli deckt deinen Vitamin C Bedarf fabelhaft."]
        },
        frau: {
          caloriesPct: 100,
          proteinPct: 102,
          carbsPct: 95,
          fatPct: 90,
          fiberPct: 93,
          vitCLevel: "optimum",
          omega3Level: "good",
          calciumLevel: "good",
          ironLevel: "low",
          notes: ["Deine Proteinzufuhr ist hervorragend.", "Kimberlys Eisenbedarf ist heute knapp gedeckt. Baue Linsen oder Kürbiskerne ein."]
        },
        sohn: {
          caloriesPct: 104,
          proteinPct: 110,
          carbsPct: 101,
          fatPct: 95,
          fiberPct: 85,
          vitCLevel: "good",
          omega3Level: "good",
          calciumLevel: "good",
          ironLevel: "good",
          notes: ["Ernährung ist optimal kindgerecht.", "Achte darauf, die Nüsse im Brei für Aron (4 J.) fein gemahlen unterzurühren."]
        }
      }
    };
    setActivePlan(fallback);
  };

  // Helper values for active user targets
  const currentMember = family.find(m => m.role === activeRole) || family[0];

  // Calculated macros sum for active role today (based on Day 1: Montag of activePlan)
  const getTodayMacrosForActiveRole = () => {
    if (!activePlan || !activePlan.days[0]) return { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };
    // Let's assume day index 0 (Montag)
    const day = activePlan.days[0];
    const meals = [day.breakfast, day.lunch, day.dinner, day.snack].filter(Boolean) as Meal[];
    
    // Christian gets 1.2x portion of standard meal, Kimberly gets 1.0x, Aron gets 0.6x portion
    let factor = 1.0;
    if (activeRole === "mann") factor = 1.2;
    if (activeRole === "sohn") factor = 0.6;

    // The recipes in DB represent total family portion. Wait, the API generated calories/macros is for the ENTIRE family.
    // Let's calculate total family factor = 1.2 + 1.0 + 0.6 = 2.8.
    // So one person's share = (totalValue / 2.8) * factor
    const familyTotalFactor = 2.8;

    let totalCals = 0;
    let totalProt = 0;
    let totalCarbs = 0;
    let totalFat = 0;
    let totalFiber = 0;

    meals.forEach(m => {
      totalCals += (m.calories / familyTotalFactor) * factor;
      totalProt += (m.protein / familyTotalFactor) * factor;
      totalCarbs += (m.carbs / familyTotalFactor) * factor;
      totalFat += (m.fat / familyTotalFactor) * factor;
      totalFiber += (m.fiber / familyTotalFactor) * factor;
    });

    return {
      calories: Math.round(totalCals),
      protein: Math.round(totalProt),
      carbs: Math.round(totalCarbs),
      fat: Math.round(totalFat),
      fiber: Math.round(totalFiber)
    };
  };

  const todayMacros = getTodayMacrosForActiveRole();

  // Handle toggle food availability
  const toggleFoodAvailability = async (id: string, currentStatus: boolean) => {
    try {
      const target = foods.find(f => f.id === id);
      if (!target) return;
      const updated = { ...target, isAvailable: !currentStatus };
      
      const res = await fetch(`/api/foods/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated)
      });
      if (res.ok) {
        setFoods(foods.map(f => f.id === id ? updated : f));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Safe toggles for shopping item
  const toggleShoppingCheck = (id: string) => {
    if (!activePlan) return;
    const updatedList = activePlan.shoppingList.map(item => {
      if (item.id === id) {
        return { ...item, checked: !item.checked };
      }
      return item;
    });
    const updatedPlan = { ...activePlan, shoppingList: updatedList };
    setActivePlan(updatedPlan);

    // Save back to backend
    fetch("/api/weekly-plans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedPlan)
    });
  };

  // Launch KI Planner Wizard
  const handleStartWizard = () => {
    setIsWizardOpen(true);
    setWizardStep(1);
    setGenerationLogs([]);
    setGenerationProgress(0);
  };

  const triggerKIGeneration = async () => {
    setIsGenerating(true);
    setGenerationProgress(10);
    setGenerationLogs(["Starte Nährstoffziel-Analyse für Christian (110kg), Kimberly (55kg) und Aron (4 J.)..."]);
    
    // Simulate steps in logs for transparency & premium look
    const timer1 = setTimeout(() => {
      setGenerationProgress(35);
      setGenerationLogs(prev => [
        ...prev,
        "Abgleich mit Vorratsliste (Prüfe vorhandene Kartoffeln, Lachs und Magerquark)...",
        "Wiederverwendung von Rezeptfavoriten aktiviert..."
      ]);
    }, 1200);

    const timer2 = setTimeout(() => {
      setGenerationProgress(65);
      setGenerationLogs(prev => [
        ...prev,
        "Generiere familiengerechte Mahlzeiten-Matrix für 7 Tage...",
        "Ermittle optimale DGE-Proteinmengen & Kimberlys Eisen-Vorkommen...",
        "Füge spezielle Koch- und Verzehrhinweise für Kleinkind Aron hinzu..."
      ]);
    }, 2800);

    const timer3 = setTimeout(() => {
      setGenerationProgress(85);
      setGenerationLogs(prev => [
        ...prev,
        "Berechne summierte Einkaufsliste nach Abteilungen sortiert...",
        "Werstelle wöchentliches Nährstoffprofil-Diagramm..."
      ]);
    }, 4500);

    try {
      const res = await fetch("/api/generate-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(wizardConfig)
      });
      const data = await res.json();
      
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);

      if (data.error) {
        setGenerationLogs(prev => [...prev, `Fehler: ${data.error}`]);
        setIsGenerating(false);
      } else {
        setGenerationProgress(100);
        setGenerationLogs(prev => [...prev, "Wochenplan erfolgreich im DGE-Standard generiert!"]);
        
        // Save the plan
        await fetch("/api/weekly-plans", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data)
        });

        // Refresh data
        fetchData();

        setTimeout(() => {
          setIsWizardOpen(false);
          setIsGenerating(false);
          setActiveTab("planner");
        }, 1000);
      }
    } catch (err: any) {
      console.error(err);
      setIsGenerating(false);
      setGenerationLogs(prev => [...prev, `Kritischer Verbindungsfehler: ${err.message}`]);
    }
  };

  // AI Coach Chat logic
  const handleSendCoachMessage = async () => {
    if (!chatInput.trim()) return;
    const userText = chatInput;
    setChatMessages(prev => [...prev, { sender: "user", text: userText }]);
    setChatInput("");
    setIsCoachTyping(true);

    try {
      // Use improve-plan to ask questions or tweak activePlan
      const res = await fetch("/api/improve-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: activePlan,
          request: userText
        })
      });
      const data = await res.json();
      
      setIsCoachTyping(false);
      if (data.error) {
        setChatMessages(prev => [...prev, {
          sender: "coach",
          text: "Tut mir leid, ich konnte das anhand der DGE-Vorgaben nicht direkt anwenden. Bitte formuliere deine Nährstoff-Frage genauer oder korrigiere meinen Auftrag!"
        }]);
      } else {
        // Updated active week plan with response!
        setActivePlan(data);
        setChatMessages(prev => [...prev, {
          sender: "coach",
          text: `Erledigt! Ich habe den aktuellen Wochenplan bezüglich deines Wunsches angepasst. Schau in die Wochenübersicht oder die aktualisierte Einkaufsliste, um die Änderungen zu sehen.`,
          action: "Öffne Wochenplan"
        }]);
      }
    } catch (e) {
      setIsCoachTyping(false);
      setChatMessages(prev => [...prev, {
        sender: "coach",
        text: "Kompilierungsfehler bei der KI. Bitte stelle sicher, dass eine aktive Internetverbindung und der GEMINI_API_KEY vorhanden sind."
      }]);
    }
  };

  // Add customized food manually
  const handleAddFood = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/foods", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newFood)
      });
      if (res.ok) {
        const data = await res.json();
        setFoods([...foods, data]);
        setIsFoodModalOpen(false);
        setNewFood({
          name: "",
          category: "Gemüse",
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
          fiber: 0,
          isAvailable: false,
          stockAmount: ""
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Add customized recipe manually
  const handleAddRecipe = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/recipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newRecipe)
      });
      if (res.ok) {
        const data = await res.json();
        setRecipes([...recipes, data]);
        setIsNewRecipeModalOpen(false);
        setNewRecipe({
          name: "",
          mealType: "dinner",
          prepTime: 25,
          difficulty: "mittel",
          diets: ["Gesund"],
          ingredients: [],
          instructions: [""],
          calories: 1200,
          protein: 80,
          carbs: 120,
          fat: 40,
          fiber: 20,
          isKidFriendly: true,
          kidNote: ""
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Scale recipe ingredients based on role for Detail Modal
  const getScaledIngredients = (recipe: Recipe, role: FamilyRole) => {
    let multiplier = 1.0;
    if (role === "mann") multiplier = 1.2;
    if (role === "sohn") multiplier = 0.6;
    
    // A standard recipe total serves the whole family (Christian + Kimberly + Aron = 2.8 portions total)
    // We want to show individual portion sizes. Person portion = (Total family serving / 2.8) * multiplier
    return recipe.ingredients.map(ing => {
      const scaledAmount = Math.round((ing.amount / 2.8) * multiplier * 10) / 10;
      return {
        ...ing,
        scaledAmount
      };
    });
  };

  // Filters for recipe
  const filteredRecipes = recipes.filter(r => {
    const matchesSearch = r.name.toLowerCase().includes(searchRecipe.toLowerCase());
    const matchesDiet = filterRecipeDiet === "all" || r.diets.some(d => d.toLowerCase().includes(filterRecipeDiet.toLowerCase())) || (filterRecipeDiet === "kid" && r.isKidFriendly);
    return matchesSearch && matchesDiet;
  });

  // Filters for Foods
  const filteredFoods = foods.filter(f => {
    const matchesSearch = f.name.toLowerCase().includes(searchFood.toLowerCase());
    const matchesCat = filterFoodCategory === "all" || f.category === filterFoodCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="w-full max-w-[420px] h-screen sm:h-[840px] bg-slate-50 text-slate-900 font-sans flex flex-col overflow-hidden shadow-2xl relative mx-auto my-0 sm:my-3 rounded-none sm:rounded-[36px] border-0 sm:border-[10px] sm:border-slate-800">
      
      {/* ----------------- MOBILE SMARTPHONE TOP STATUS BAR ----------------- */}
      <div className="bg-white px-5 pt-2 pb-1.5 flex justify-between items-center text-[10.5px] font-bold text-slate-600 shrink-0 select-none border-b border-slate-100/60">
        <span className="font-sans font-extrabold text-slate-800">09:41</span>
        <div className="flex items-center gap-1.5">
          {/* Signal bars icon */}
          <div className="flex gap-[1.5px] items-end h-[8px]">
            <div className="w-[2px] h-[3px] bg-slate-500 rounded-[0.5px]"></div>
            <div className="w-[2px] h-[5px] bg-slate-500 rounded-[0.5px]"></div>
            <div className="w-[2px] h-[7px] bg-slate-500 rounded-[0.5px]"></div>
            <div className="w-[2px] h-[9px] bg-slate-500 rounded-[0.5px]"></div>
          </div>
          <div className="flex flex-col items-center justify-center shrink-0">
            <span className="text-[10px] font-extrabold">LTE</span>
          </div>
          {/* Simulated micro Battery */}
          <div className="w-5 h-[10.5px] border border-slate-400 rounded-[3px] p-[1.2px] flex items-center">
            <div className="bg-slate-700 h-full w-[85%] rounded-[1px]"></div>
          </div>
        </div>
      </div>

      {/* ----------------- UPPER HEADER ----------------- */}
      <header className="bg-white border-b border-slate-200/60 px-4 py-2 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-md shadow-indigo-100">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h1 className="text-xs font-black tracking-tight text-slate-800 flex items-center gap-1">
              NutriFamily
            </h1>
            <p className="text-[8px] text-slate-400 font-bold">DGE-Standard • 3 Pers.</p>
          </div>
        </div>

        <button
          onClick={handleStartWizard}
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black px-2.5 py-1.5 rounded-lg flex items-center gap-1 shadow-md shadow-indigo-100 cursor-pointer transition-all shrink-0"
        >
          <Sparkles className="w-2.5 h-2.5 text-indigo-200" />
          KI-Planer
        </button>
      </header>

      {/* ----------------- SWIPEABLE FAMILY ROLE SELECTOR ----------------- */}
      <div className="bg-white border-b border-slate-200 px-3 py-1.5 flex gap-1.5 shrink-0 overflow-x-auto scrollbar-none items-center justify-center">
        <button
          onClick={() => setActiveRole("mann")}
          className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-all shrink-0 ${
            activeRole === "mann"
              ? "bg-indigo-600 text-white shadow-sm"
              : "bg-slate-100 text-slate-500 hover:text-slate-800"
          }`}
        >
          Christian (110kg)
        </button>
        <button
          onClick={() => setActiveRole("frau")}
          className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-all shrink-0 ${
            activeRole === "frau"
              ? "bg-indigo-600 text-white shadow-sm"
              : "bg-slate-100 text-slate-500 hover:text-slate-800"
          }`}
        >
          Kimberly (55kg)
        </button>
        <button
          onClick={() => setActiveRole("sohn")}
          className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-all shrink-0 ${
            activeRole === "sohn"
              ? "bg-indigo-600 text-white shadow-sm"
              : "bg-slate-100 text-slate-500 hover:text-slate-800"
          }`}
        >
          Aron (18kg)
        </button>
      </div>

      {/* ----------------- MAIN VIEWPORT ----------------- */}
      <main className="flex-1 overflow-hidden p-4 relative flex flex-col">
        
        {/* ========================================================================= */}
        {/* VIEW 1: DASHBOARD (ÜBERSICHT) */}
        {/* ========================================================================= */}
        {activeTab === "dashboard" && (
          <div className="flex-1 flex flex-col gap-5 overflow-y-auto scrollbar-none pb-4">
            
            {/* LEFT COLUMN: Current Target Progress & Macro gauges */}
            <div className="flex flex-col gap-4 shrink-0">
              {/* Daily Energy Gauge for Active Role */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 block">
                  Energie & Hydrierung ({currentMember?.name})
                </h2>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-baseline mb-1">
                      <span className="text-2xl font-black text-slate-800 tracking-tight">
                        {todayMacros.calories}
                      </span>
                      <span className="text-xs font-semibold text-slate-500">
                        / {currentMember?.nutrientGoals.calories} kcal
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                      <div
                        className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.min((todayMacros.calories / currentMember?.nutrientGoals.calories) * 100, 110)}%` }}
                      ></div>
                    </div>
                    <p className="text-[9px] text-slate-400 mt-1 italic">
                      Ziel: {currentMember?.goal === "abnehmen" ? "Gesunde Gewichtsreduktion" : "Nährstoffdeckung"}
                    </p>
                  </div>

                  <div>
                    <div className="flex justify-between items-baseline mb-1">
                      <span className="text-xl font-bold text-slate-800">1,5 Liter</span>
                      <span className="text-xs font-medium text-slate-500">Trinkwasser-Schnitt</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-blue-400 h-full w-[75%] rounded-full"></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Macros Panel */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex-1">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 block">
                  Makronährstoffe heute ({currentMember?.name})
                </h2>
                <div className="space-y-4">
                  
                  {/* Protein */}
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-extrabold text-xs shrink-0">
                      PRO
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between text-xs mb-0.5 font-bold text-slate-700">
                        <span>Eiweiß</span>
                        <span>{todayMacros.protein}g / {currentMember?.nutrientGoals.protein}g</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full">
                        <div
                          className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${Math.min((todayMacros.protein / currentMember?.nutrientGoals.protein) * 100, 110)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  {/* Fat */}
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-extrabold text-xs shrink-0">
                      FAT
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between text-xs mb-0.5 font-bold text-slate-700">
                        <span>Fett (max 10% ges.)</span>
                        <span>{todayMacros.fat}g / {currentMember?.nutrientGoals.fat}g</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full">
                        <div
                          className="bg-amber-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${Math.min((todayMacros.fat / currentMember?.nutrientGoals.fat) * 100, 110)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  {/* Carbs */}
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-extrabold text-xs shrink-0">
                      CHO
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between text-xs mb-0.5 font-bold text-slate-700">
                        <span>Kohlenhydrate</span>
                        <span>{todayMacros.carbs}g / {currentMember?.nutrientGoals.carbs}g</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full">
                        <div
                          className="bg-indigo-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${Math.min((todayMacros.carbs / currentMember?.nutrientGoals.carbs) * 100, 110)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-500 uppercase tracking-tight">Ballaststoffe</span>
                    <span className="font-extrabold text-slate-800">{todayMacros.fiber}g / {currentMember?.nutrientGoals.fiber}g</span>
                  </div>
                </div>
              </div>
            </div>

            {/* MID COLUMN: Today's structured meal schedule */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col shrink-0 overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-indigo-600" />
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    Speiseplan Heute (Montag)
                  </h2>
                </div>
                <span className="text-[10px] bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full">
                  AKTIVE PLANUNG
                </span>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {activePlan ? (
                  activePlan.days.slice(0, 1).map((day) => (
                    <div key={day.dayName} className="space-y-3">
                      {/* Breakfast */}
                      {day.breakfast && (
                        <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg flex items-start gap-3">
                          <Coffee className="w-4 h-4 text-amber-500 mt-1 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <span className="text-[9px] uppercase font-bold tracking-wider text-amber-600 block">Frühstück</span>
                            <span className="text-xs font-bold text-slate-800 truncate block">{day.breakfast.recipeName}</span>
                            <span className="text-[9px] text-slate-400 block">{day.breakfast.prepTime} Min. • {day.breakfast.calories} kcal (Familie)</span>
                          </div>
                        </div>
                      )}

                      {/* Lunch */}
                      {day.lunch && (
                        <div className="p-3 bg-indigo-50/40 border border-indigo-100/50 rounded-lg flex items-start gap-3">
                          <Utensils className="w-4 h-4 text-indigo-600 mt-1 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <span className="text-[9px] uppercase font-bold tracking-wider text-indigo-600 block">Mittagessen</span>
                            <span className="text-xs font-bold text-slate-800 truncate block">{day.lunch.recipeName}</span>
                            <span className="text-[9px] text-slate-400 block">{day.lunch.prepTime} Min. • {day.lunch.calories} kcal</span>
                          </div>
                        </div>
                      )}

                      {/* Dinner */}
                      {day.dinner && (
                        <div className="p-3 bg-emerald-50/30 border border-emerald-100/50 rounded-lg flex items-start gap-3">
                          <ChefHat className="w-4 h-4 text-emerald-600 mt-1 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <span className="text-[9px] uppercase font-bold tracking-wider text-emerald-600 block">Abendessen</span>
                            <span className="text-xs font-bold text-slate-800 truncate block">{day.dinner.recipeName}</span>
                            <span className="text-[9px] text-slate-400 block">{day.dinner.prepTime} Min. • {day.dinner.calories} kcal</span>
                            {day.dinner.isKidFriendly && (
                              <span className="inline-block mt-1 text-[9px] text-emerald-700 bg-emerald-100/70 py-0.2 px-1.5 rounded font-medium">Kinderfreundlich</span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-xs text-slate-400">
                    Noch kein Wochenplan erstellt. Starte den KI-Planer!
                  </div>
                )}
              </div>

              {/* Botton Tips Panel */}
              <div className="p-4 bg-indigo-50 border-t border-indigo-100 shrink-0">
                <p className="text-[9.5px] text-indigo-700 leading-relaxed">
                  <span className="font-extrabold uppercase mr-1">Coaching-Tipp:</span>
                  Unterstütze Christians Fettabbau durch erhöhten Rohkostanteil zu Mittag und lade den Tagesbedarf mit zinkhaltigem Kürbiskern-Topping auf.
                </p>
              </div>
            </div>

            {/* RIGHT COLUMN: Weekly Targets Baukasten & Critical Alerts */}
            <div className="flex flex-col gap-4 shrink-0">
              {/* Shopping Targets */}
              <div className="bg-slate-800 text-slate-100 rounded-xl p-5 shadow-lg shrink-0">
                <h2 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-4 block">
                  Saisonale Wochenmengen
                </h2>
                <ul className="space-y-3">
                  <li className="flex justify-between items-center text-xs border-b border-slate-700 pb-2">
                    <span className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-emerald-400 rounded-full"></div> Gemüse & Salate
                    </span>
                    <span className="font-mono font-bold">~ 2,5 - 3,5 kg</span>
                  </li>
                  <li className="flex justify-between items-center text-xs border-b border-slate-700 pb-2">
                    <span className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-emerald-400 rounded-full"></div> Obst (Beeren, Äpfel)
                    </span>
                    <span className="font-mono font-bold">~ 1,5 - 2,0 kg</span>
                  </li>
                  <li className="flex justify-between items-center text-xs border-b border-slate-700 pb-2">
                    <span className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-amber-400 rounded-full"></div> Hülsenfrüchte (Linsen)
                    </span>
                    <span className="font-mono font-bold">~ 700 g gekocht</span>
                  </li>
                  <li className="flex justify-between items-center text-xs border-b border-slate-700 pb-2">
                    <span className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-400 rounded-full"></div> Kaltwasserfisch
                    </span>
                    <span className="font-mono font-bold">~ 240 g Dauer</span>
                  </li>
                </ul>
                <div className="mt-3 grid grid-cols-2 gap-2 text-[9px] text-slate-300">
                  <div className="bg-slate-700/60 p-2 rounded border border-slate-700">Mandelschaum für Aron</div>
                  <div className="bg-slate-700/60 p-2 rounded border border-slate-700">Rapsöl & Omega-3 ALA</div>
                </div>
              </div>

              {/* Critical Alerts */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                <h2 className="text-xs font-bold uppercase tracking-wider text-rose-500 mb-3 flex items-center gap-1.5 shrink-0">
                  <AlertTriangle className="h-4 w-4" />
                  Kritische Nährstoffe
                </h2>
                <div className="space-y-2">
                  <div className="p-2 bg-rose-50 border-l-2 border-rose-400 rounded-r">
                    <span className="block text-[10px] font-bold text-rose-800">Vitamin D (20 µg)</span>
                    <p className="text-[9px] text-rose-700">Schwer über Nahrung zu decken. Regelmäßige, sichere Sonnenexposition oder Blutwert-Checks nötig.</p>
                  </div>
                  <div className="p-2 bg-slate-50 border-l-2 border-slate-400 rounded-r">
                    <span className="block text-[10px] font-bold text-slate-800">Jod & Jodsalz</span>
                    <p className="text-[9px] text-slate-600">Deutschland hat karge Böden. Verwendet konsequent jodiertes Speisesalz im Familienhaushalt.</p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 2: WEEKLY PLANNER MATRIX */}
        {/* ========================================================================= */}
        {activeTab === "planner" && (
          <div className="flex-1 flex flex-col gap-4 overflow-hidden">
            <div className="flex justify-between items-center shrink-0">
              <div>
                <h2 className="text-base font-extrabold text-slate-800">
                  {activePlan ? activePlan.title : "Dein Ernährungsplan"}
                </h2>
                <p className="text-[11px] text-slate-400">7-Tage-Übersicht für die ganze Familie (skalierte Portionen)</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleStartWizard}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3.5 py-1.5 rounded flex items-center gap-1 cursor-pointer transition-all shrink-0"
                >
                  <Sparkles className="w-3 h-3" />
                  KI-Wizard öffnen
                </button>
              </div>
            </div>

            {/* Matrix Board Mobile Accordion */}
            <div className="flex-1 bg-slate-50/50 flex flex-col min-h-0">
              <div className="flex-1 overflow-y-auto space-y-2.5 pb-4">
                {activePlan ? (
                  activePlan.days.map((day) => {
                    const totalCals = Math.round(
                      (day.breakfast?.calories || 0) +
                      (day.lunch?.calories || 0) +
                      (day.dinner?.calories || 0)
                    );
                    const isOpen = expandedDay === day.dayName;
                    return (
                      <div key={day.dayName} className="bg-white rounded-xl border border-slate-200/85 overflow-hidden transition-all shadow-xs">
                        {/* Day Header Trigger */}
                        <button
                          onClick={() => setExpandedDay(isOpen ? "" : day.dayName)}
                          className="w-full px-4 py-3 flex justify-between items-center bg-slate-50/50 hover:bg-slate-100/50 transition-colors cursor-pointer text-left"
                        >
                          <div>
                            <span className="font-extrabold text-xs text-slate-800 uppercase tracking-wide block">{day.dayName}</span>
                            <span className="text-[9.5px] text-slate-400 font-medium">Bedarf Familie: <b className="text-slate-600 font-mono">{totalCals} kcal</b></span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-indigo-600 font-bold uppercase">{isOpen ? "Schließen" : "Speisen anzeigen"}</span>
                            <ChevronRight className={`w-4 h-4 text-indigo-500 transition-transform duration-300 ${isOpen ? "rotate-90" : ""}`} />
                          </div>
                        </button>

                        {/* Collapsible Food Details */}
                        {isOpen && (
                          <div className="p-3.5 space-y-3.5 border-t border-slate-100 bg-white">
                            
                            {/* Frühstück */}
                            <div className="flex items-start gap-3">
                              <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                                FR
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-baseline">
                                  <span className="text-[9px] uppercase tracking-wider font-extrabold text-amber-600">Frühstück</span>
                                  {day.breakfast && <span className="font-mono text-[9px] text-slate-400">{day.breakfast.calories} kcal</span>}
                                </div>
                                {day.breakfast ? (
                                  <div>
                                    <span
                                      onClick={() => {
                                        const r = recipes.find(rec => rec.name === day.breakfast?.recipeName);
                                        if (r) { setSelectedRecipe(r); setIsRecipeModalOpen(true); }
                                      }}
                                      className="text-xs font-bold text-slate-800 block cursor-pointer hover:text-indigo-600 hover:underline leading-tight mt-0.5"
                                    >
                                      {day.breakfast.recipeName}
                                    </span>
                                    <span className="text-[9.5px] text-slate-400 block mt-0.5">⏱︎ Zubereitungzeit: {day.breakfast.prepTime} Min.</span>
                                  </div>
                                ) : (
                                  <span className="text-[10.5px] text-slate-300 italic">Keine Mahlzeit eingeplant</span>
                                )}
                              </div>
                            </div>

                            {/* Mittagessen */}
                            <div className="flex items-start gap-3">
                              <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                                ME
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-baseline">
                                  <span className="text-[9px] uppercase tracking-wider font-extrabold text-indigo-600">Mitagessen</span>
                                  {day.lunch && <span className="font-mono text-[9px] text-slate-400">{day.lunch.calories} kcal</span>}
                                </div>
                                {day.lunch ? (
                                  <div>
                                    <span
                                      onClick={() => {
                                        const r = recipes.find(rec => rec.name === day.lunch?.recipeName);
                                        if (r) { setSelectedRecipe(r); setIsRecipeModalOpen(true); }
                                      }}
                                      className="text-xs font-bold text-slate-800 block cursor-pointer hover:text-indigo-600 hover:underline leading-tight mt-0.5"
                                    >
                                      {day.lunch.recipeName}
                                    </span>
                                    <span className="text-[9.5px] text-slate-400 block mt-0.5">⏱︎ Zubereitungzeit: {day.lunch.prepTime} Min.</span>
                                  </div>
                                ) : (
                                  <span className="text-[10.5px] text-slate-300 italic">Keine Mahlzeit eingeplant</span>
                                )}
                              </div>
                            </div>

                            {/* Abendessen */}
                            <div className="flex items-start gap-3">
                              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                                AE
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-baseline">
                                  <span className="text-[9px] uppercase tracking-wider font-extrabold text-emerald-600">Abendessen</span>
                                  {day.dinner && <span className="font-mono text-[9px] text-slate-400">{day.dinner.calories} kcal</span>}
                                </div>
                                {day.dinner ? (
                                  <div>
                                    <span
                                      onClick={() => {
                                        const r = recipes.find(rec => rec.name === day.dinner?.recipeName);
                                        if (r) { setSelectedRecipe(r); setIsRecipeModalOpen(true); }
                                      }}
                                      className="text-xs font-bold text-slate-800 block cursor-pointer hover:text-indigo-600 hover:underline leading-tight mt-0.5"
                                    >
                                      {day.dinner.recipeName}
                                    </span>
                                    <span className="text-[9.5px] text-slate-400 block mt-0.5">⏱︎ Zubereitungzeit: {day.dinner.prepTime} Min.</span>
                                  </div>
                                ) : (
                                  <span className="text-[10.5px] text-slate-300 italic">Keine Mahlzeit eingeplant</span>
                                )}
                              </div>
                            </div>

                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-12 px-6 bg-white rounded-xl border border-slate-200">
                    <p className="text-xs text-slate-400 mb-3">Noch kein Wochenplan generiert. Drücke oben auf "KI-Planer"!</p>
                  </div>
                )}
              </div>

              {/* DGE Traffic light indicators for active planner week */}
              {activePlan && activePlan.analysis && (
                <div className="border-t border-slate-200/80 bg-white p-3.5 shrink-0 space-y-2.5">
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[9.5px] text-slate-400 font-extrabold uppercase tracking-wide">
                      Wochenerfüllung & Status:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
                        Christian Kalorien: {activePlan.analysis.mann?.caloriesPct}%
                      </span>
                      <span className="text-[9px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full">
                        Kimberly Eisen: optimal
                      </span>
                      <span className="text-[9px] font-bold text-amber-700 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full">
                        Aron Omega-3: optimum
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveTab("coach")}
                    className="w-full text-center py-1.5 text-[10px] text-indigo-700 bg-indigo-50 hover:bg-indigo-100 font-bold rounded-lg flex items-center justify-center gap-1 cursor-pointer transition-colors"
                  >
                    Analyse verfeinern <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 3: RECIPES BOOKLET */}
        {/* ========================================================================= */}
        {activeTab === "recipes" && (
          <div className="flex-1 flex flex-col gap-4 overflow-hidden">
            <div className="flex justify-between items-center shrink-0">
              <div>
                <h2 className="text-base font-extrabold text-slate-800">Rezeptbuch</h2>
                <p className="text-[11px] text-slate-400">Rezepte im Detail, automatische Portionsanpassung beim Kochen</p>
              </div>

              <button
                onClick={() => setIsNewRecipeModalOpen(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3 py-1.5 rounded flex items-center gap-1 cursor-pointer transition-all"
              >
                <Plus className="w-3.5 h-3.5" /> Rezept hinzufügen
              </button>
            </div>

            {/* Filter controls */}
            <div className="bg-white p-3 rounded-xl border border-slate-200 flex gap-2.5 shrink-0">
              <div className="flex-1 relative">
                <Search className="absolute left-2.5 top-2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Rezept suchen... (z.B. Lachs)"
                  value={searchRecipe}
                  onChange={(e) => setSearchRecipe(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="flex items-center gap-1.5 min-w-[110px] max-w-[130px]">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={filterRecipeDiet}
                  onChange={(e) => setFilterRecipeDiet(e.target.value)}
                  className="w-full py-1.5 px-1 text-xs bg-slate-50 border border-slate-200 rounded focus:outline-none focus:border-indigo-500"
                >
                  <option value="all">Alle</option>
                  <option value="gesund">Gesund</option>
                  <option value="proteinreich">Prot.</option>
                  <option value="vegetarisch">Veg.</option>
                  <option value="kid">Kids</option>
                </select>
              </div>
            </div>

            {/* Grid display */}
            <div className="flex-1 overflow-y-auto pr-1">
              <div className="grid grid-cols-1 gap-3 pb-4">
                {filteredRecipes.map((recipe) => (
                  <div
                    key={recipe.id}
                    className="bg-white border border-slate-200 hover:border-indigo-300 rounded-xl p-4 shadow-sm hover:shadow transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex justify-between items-start gap-2 mb-2">
                        <span className="text-xs font-bold text-slate-800 hover:text-indigo-600 cursor-pointer block"
                              onClick={() => { setSelectedRecipe(recipe); setIsRecipeModalOpen(true); }}>
                          {recipe.name}
                        </span>
                        <span className={`text-[9.5px] font-bold px-2 py-0.5 rounded shrink-0 ${
                          recipe.difficulty === "einfach" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                        }`}>
                          {recipe.difficulty}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-1 mb-3">
                        {recipe.diets.map((diet, i) => (
                          <span key={i} className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-medium">
                            {diet}
                          </span>
                        ))}
                      </div>

                      <p className="text-[11px] text-slate-500 line-clamp-2 italic mb-3">
                        Hauptzutaten: {recipe.ingredients.map(i => i.name).join(", ")}
                      </p>
                    </div>

                    <div className="border-t border-slate-100 pt-3 flex justify-between items-center text-[10px] text-slate-400">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-slate-400" /> {recipe.prepTime} Min.</span>
                      <span className="text-slate-700 font-bold">{recipe.calories} kcal (Familie)</span>
                      
                      <button
                        onClick={() => { setSelectedRecipe(recipe); setIsRecipeModalOpen(true); }}
                        className="text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-0.5 cursor-pointer"
                      >
                        Ansehen &rarr;
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 4: VORRATSDATENBANK */}
        {/* ========================================================================= */}
        {activeTab === "foods" && (
          <div className="flex-1 flex flex-col gap-4 overflow-hidden">
            <div className="flex justify-between items-center shrink-0">
              <div>
                <h2 className="text-base font-extrabold text-slate-800">Vorratsdatenbank & Nährwerte</h2>
                <p className="text-[11px] text-slate-400">Markiere, was im Haushalt da ist. Der KI-planer wird diese Zutaten bevorzugen</p>
              </div>

              <button
                onClick={() => setIsFoodModalOpen(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3 py-1.5 rounded flex items-center gap-1 cursor-pointer transition-all"
              >
                <Plus className="w-3.5 h-3.5" /> Lebensmittel hinzufügen
              </button>
            </div>

            {/* Filter controls */}
            <div className="bg-white p-3 rounded-xl border border-slate-200 flex gap-2.5 shrink-0">
              <div className="flex-1 relative">
                <Search className="absolute left-2.5 top-2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Lebensmittel suchen..."
                  value={searchFood}
                  onChange={(e) => setSearchFood(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="flex items-center gap-1.5 min-w-[110px] max-w-[130px]">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={filterFoodCategory}
                  onChange={(e) => setFilterFoodCategory(e.target.value)}
                  className="w-full py-1.5 px-1 text-xs bg-slate-50 border border-slate-200 rounded focus:outline-none focus:border-indigo-500"
                >
                  <option value="all">Alle</option>
                  <option value="Beilagen">Beilagen</option>
                  <option value="Gemüse">Gemüse</option>
                  <option value="Obst">Obst</option>
                  <option value="Fleisch">Fleisch</option>
                  <option value="Fisch & Meeresfrüchte">Fisch</option>
                  <option value="Milchprodukte & Alternativen">Milchalt.</option>
                  <option value="Hülsenfrüchte & pflanzliche Proteinquellen">Hülsen.</option>
                </select>
              </div>
            </div>

            {/* Foods mobile list view */}
            <div className="flex-1 bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col min-h-0">
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {filteredFoods.length > 0 ? (
                  filteredFoods.map((food) => (
                    <div key={food.id} className="p-3 bg-slate-50/50 border border-slate-100 rounded-lg flex items-center justify-between gap-3 shadow-xs">
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-bold text-slate-800 truncate block">{food.name}</span>
                        <div className="flex items-center gap-2 mt-0.5 text-[9.5px] text-slate-400 font-medium">
                          <span>{food.category}</span>
                          <span>•</span>
                          <span className="font-mono text-slate-600">{food.calories} kcal/100g</span>
                        </div>
                        <span className="text-[9.5px] text-slate-400 font-bold block mt-0.5">Menge: <b className="text-slate-600 font-mono font-medium">{food.stockAmount || "0g"}</b></span>
                      </div>
                      
                      <div className="flex items-center gap-2.5 shrink-0">
                        <button
                          onClick={() => toggleFoodAvailability(food.id, food.isAvailable)}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-extrabold border transition-all cursor-pointer ${
                            food.isAvailable
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                              : "bg-white text-slate-400 border-slate-200 hover:bg-slate-50"
                          }`}
                        >
                          {food.isAvailable ? "✓ Da" : "○ Leer"}
                        </button>
                        
                        <button
                          onClick={async () => {
                            try {
                              const res = await fetch(`/api/foods/${food.id}`, { method: "DELETE" });
                              if (res.ok) setFoods(foods.filter(f => f.id !== food.id));
                            } catch (err) { console.error(err); }
                          }}
                          className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-xs text-slate-400">
                    Keine passenden Lebensmittel gefunden.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 5: SHOPPING LIST */}
        {/* ========================================================================= */}
        {activeTab === "shopping" && (
          <div className="flex-1 flex flex-col gap-4 overflow-hidden">
            <div className="flex justify-between items-center shrink-0">
              <div>
                <h2 className="text-base font-extrabold text-slate-800">Wöchentliche Einkaufsliste</h2>
                <p className="text-[11px] text-slate-400">Automatisch generierte Frischemengen aus der Wochenplanung</p>
              </div>

              {activePlan && (
                <span className="text-[10px] text-slate-400 font-medium">
                  {activePlan.shoppingList.filter(s => s.checked).length} von {activePlan.shoppingList.length} Artikel abgehakt
                </span>
              )}
            </div>

            {/* Shopping check matrix display */}
            <div className="flex-1 bg-white rounded-xl border border-slate-200 flex flex-col min-h-0">
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {activePlan && activePlan.shoppingList.length > 0 ? (
                  // Group items by category
                  ["Obst & Gemüse", "Fleisch", "Fisch & Meeresfrüchte", "Milchprodukte & Alternativen", "Beilagen", "Nüsse, Samen & Kerne", "Hülsenfrüchte & pflanzliche Proteinquellen", "Sonstiges"].map((cat) => {
                    const group = activePlan.shoppingList.filter(s => s.category === cat || (cat === "Sonstiges" && !["Obst & Gemüse", "Fleisch", "Fisch & Meeresfrüchte", "Milchprodukte & Alternativen", "Beilagen", "Nüsse, Samen & Kerne", "Hülsenfrüchte & pflanzliche Proteinquellen"].includes(s.category)));
                    if (group.length === 0) return null;

                    return (
                      <div key={cat} className="space-y-2">
                        <span className="font-extrabold text-[10px] uppercase text-indigo-600 tracking-wider block border-b border-indigo-50 pb-1">
                          {cat}
                        </span>
                        <div className="grid grid-cols-1 gap-2">
                          {group.map((item) => (
                            <div
                              key={item.id}
                              onClick={() => toggleShoppingCheck(item.id)}
                              className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-all ${
                                item.checked
                                  ? "bg-slate-50 border-slate-100 text-slate-400 line-through"
                                  : "bg-white border-slate-200 hover:border-indigo-200"
                              }`}
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                {item.checked ? (
                                  <CheckSquare className="w-4 h-4 text-emerald-500 shrink-0" />
                                ) : (
                                  <Square className="w-4 h-4 text-slate-400 shrink-0" />
                                )}
                                <div className="min-w-0">
                                  <span className="text-xs font-semibold block truncate">{item.name}</span>
                                  <span className="text-[9px] text-slate-400 block truncate">Benötigt für: {item.recipeNames.join(", ")}</span>
                                </div>
                              </div>
                              
                              <div className="text-right shrink-0">
                                <span className="text-xs font-mono font-bold text-slate-700">{item.amount} {item.unit}</span>
                                {item.availableAtHome && (
                                  <span className="block text-[8px] text-emerald-600 bg-emerald-50 py-0.2 px-1 rounded font-bold mt-0.5">Vorrat Vorhanden</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-20 text-slate-450 italic text-xs">
                    Noch keine Einkaufsliste generiert. Erstelle zuerst einen Wochenplan.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 6: FAMILY PROFILES & GOALS */}
        {/* ========================================================================= */}
        {activeTab === "family" && (
          <div className="flex-1 flex flex-col gap-4 overflow-hidden">
            <h2 className="text-base font-extrabold text-slate-800 shrink-0">Familiendaten & Zielvorgaben</h2>
            
            <div className="flex-1 grid grid-cols-1 gap-4 overflow-y-auto pb-4">
              {family.map((member) => (
                <div key={member.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm">
                        {member.name[0]}
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-800 block">{member.name}</span>
                        <span className="text-[9px] text-slate-400 block uppercase font-mono">{member.role}</span>
                      </div>
                    </div>

                    <div className="space-y-2 text-xs border-t border-slate-100 pt-3">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Alter:</span>
                        <span className="font-bold text-slate-800">{member.age} Jahre</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Gewicht:</span>
                        <span className="font-bold text-slate-800">{member.weight} kg</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Ziel:</span>
                        <span className="font-bold text-slate-800 capitalize">{member.goal === "abnehmen" ? "Milde Gewichtsreduktion" : member.goal === "halten" ? "Halten & Vitalität" : "Gesundes Wachstum"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Regelmäßiger Sport:</span>
                        <span className="font-bold text-slate-800 capitalize">{member.activityLevel}</span>
                      </div>
                    </div>

                    {/* Preferences & Allergens */}
                    <div className="mt-4 pt-3 border-t border-slate-100">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Lieblinge / Meidet</span>
                      <div className="flex flex-wrap gap-1">
                        {member.preferences.map((p, i) => (
                          <span key={i} className="text-[9px] bg-indigo-50 text-indigo-700 font-semibold px-2 py-0.5 rounded-full">
                            {p}
                          </span>
                        ))}
                        {member.dislikes.map((d, i) => (
                          <span key={i} className="text-[9px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                            kein {d}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 border-t border-slate-100 pt-3 flex gap-2">
                    <button
                      onClick={() => {
                        // Demo-edit / inform coach
                        setActiveRole(member.role);
                        setActiveTab("coach");
                        setChatInput(`Passe die Zielwerte für ${member.name} an.`);
                      }}
                      className="w-full text-center py-1 bg-slate-50 hover:bg-indigo-50 text-indigo-600 border border-slate-200 hover:border-indigo-100 text-[10px] font-bold rounded cursor-pointer transition-all"
                    >
                      Ziele anpassen
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 7: AI COACH CHAT */}
        {/* ========================================================================= */}
        {activeTab === "coach" && (
          <div className="flex-1 flex flex-col gap-4 overflow-hidden">
            <div className="shrink-0">
              <h2 className="text-base font-extrabold text-slate-800">DGE-Ernährungsberater</h2>
              <p className="text-[10.5px] text-slate-400">Passe Pläne flexibel per Chat an</p>
            </div>

            {/* Chat Board */}
            <div className="flex-1 bg-white border border-slate-200 rounded-xl flex flex-col overflow-hidden min-h-0">
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {chatMessages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[80%] rounded-xl px-4 py-3 text-xs leading-relaxed ${
                      msg.sender === "user"
                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-100 rounded-tr-none"
                        : "bg-slate-100 text-slate-800 rounded-tl-none border border-slate-200"
                    }`}>
                      <p>{msg.text}</p>
                      {msg.action && (
                        <button
                          onClick={() => setActiveTab("planner")}
                          className="mt-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold py-1 px-3.5 rounded text-[10px] block shadow transition-all cursor-pointer"
                        >
                          {msg.action}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {isCoachTyping && (
                  <div className="flex justify-start">
                    <div className="bg-slate-100 border border-slate-200 text-slate-500 rounded-xl px-4 py-2.5 text-xs flex items-center gap-1.5">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Coach berechnet DGE-Anforderungen...
                    </div>
                  </div>
                )}
              </div>

              {/* Chat Input */}
              <div className="p-3 bg-slate-50 border-t border-slate-200 flex gap-2 shrink-0">
                <input
                  type="text"
                  placeholder="Frag den Coach: z.B. Ersetze das Dienstag-Abendessen mit einem schnellen Pasta Gerich..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendCoachMessage()}
                  className="flex-1 px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                />
                <button
                  onClick={handleSendCoachMessage}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2 rounded-lg flex items-center gap-1 cursor-pointer shadow transition-all"
                >
                  <Send className="w-3 h-3 text-indigo-200" />
                  Senden
                </button>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* ----------------- FIXED MOBILE BOTTOM NAVIGATION BAR ----------------- */}
      <nav className="bg-white border-t border-slate-200/80 px-2 py-1.5 flex justify-around items-center shrink-0 z-10 shadow-[0_-2px_10px_rgba(0,0,0,0.02)]">
        <button
          onClick={() => setActiveTab("dashboard")}
          className={`flex-1 py-1 flex flex-col items-center justify-center transition-all cursor-pointer ${
            activeTab === "dashboard" ? "text-indigo-600 font-extrabold" : "text-slate-400 hover:text-slate-600"
          }`}
        >
          <Home className="w-4 h-4 mb-0.5" />
          <span className="text-[8px]">Home</span>
        </button>
        <button
          onClick={() => setActiveTab("planner")}
          className={`flex-1 py-1 flex flex-col items-center justify-center transition-all cursor-pointer ${
            activeTab === "planner" ? "text-indigo-600 font-extrabold" : "text-slate-400 hover:text-slate-600"
          }`}
        >
          <Calendar className="w-4 h-4 mb-0.5" />
          <span className="text-[8px]">Planer</span>
        </button>
        <button
          onClick={() => setActiveTab("recipes")}
          className={`flex-1 py-1 flex flex-col items-center justify-center transition-all cursor-pointer ${
            activeTab === "recipes" ? "text-indigo-600 font-extrabold" : "text-slate-400 hover:text-slate-600"
          }`}
        >
          <ChefHat className="w-4 h-4 mb-0.5" />
          <span className="text-[8px]">Rezepte</span>
        </button>
        <button
          onClick={() => setActiveTab("foods")}
          className={`flex-1 py-1 flex flex-col items-center justify-center transition-all cursor-pointer ${
            activeTab === "foods" ? "text-indigo-600 font-extrabold" : "text-slate-400 hover:text-slate-600"
          }`}
        >
          <Apple className="w-4 h-4 mb-0.5" />
          <span className="text-[8px]">Vorrat</span>
        </button>
        <button
          onClick={() => setActiveTab("shopping")}
          className={`flex-1 py-1 flex flex-col items-center justify-center transition-all cursor-pointer relative ${
            activeTab === "shopping" ? "text-indigo-600 font-extrabold" : "text-slate-400 hover:text-slate-600"
          }`}
        >
          <ShoppingCart className="w-4 h-4 mb-0.5" />
          <span className="text-[8px]">Einkäufe</span>
          {activePlan && activePlan.shoppingList.filter(s => !s.checked).length > 0 && (
            <span className="absolute top-0.5 right-3 bg-rose-500 text-white rounded-full text-[8px] font-extrabold w-3.5 h-3.5 flex items-center justify-center scale-90 border border-white">
              {activePlan.shoppingList.filter(s => !s.checked).length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("coach")}
          className={`flex-1 py-1 flex flex-col items-center justify-center transition-all cursor-pointer ${
            activeTab === "coach" ? "text-indigo-600 font-extrabold" : "text-slate-400 hover:text-slate-600"
          }`}
        >
          <Sparkles className="w-4 h-4 mb-0.5 text-indigo-500" />
          <span className="text-[8px] text-indigo-500">Coach</span>
        </button>
      </nav>

      {/* ========================================================================= */}
      {/* MODAL WINDOW 1: KI GENERAL PLAN WIZARD */}
      {/* ========================================================================= */}
      {isWizardOpen && (
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-6">
          <div className="bg-white w-[92%] sm:w-[500px] max-h-[600px] rounded-xl shadow-2xl flex flex-col border border-slate-200 overflow-hidden relative">
            
            {/* Header */}
            <div className="px-5 py-3.5 bg-slate-50 border-b border-indigo-50 flex justify-between items-center">
              <span className="text-xs font-black uppercase text-indigo-600 tracking-wider flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> KI-Wochenplan Wizard
              </span>
              <button
                onClick={() => !isGenerating && setIsWizardOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {isGenerating ? (
              /* Loading screen during active model calculations */
              <div className="flex-1 p-6 flex flex-col justify-center items-center text-center bg-slate-50/50">
                <RefreshCw className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
                <h3 className="text-sm font-bold text-slate-800">NutriFamily KI rechnet...</h3>
                <p className="text-[11px] text-slate-400 max-w-[320px] mt-1 mb-6">Wir entwerfen die optimalen DGE-Grammportionen basierend auf verfügbarem Vorrat für Mann, Frau und Kind.</p>
                
                {/* Visual progression bar */}
                <div className="w-full max-w-[355px] bg-slate-200 h-2 rounded-full overflow-hidden mb-4">
                  <div className="bg-indigo-600 h-full transition-all duration-300" style={{ width: `${generationProgress}%` }}></div>
                </div>

                {/* Simulated AI Logs */}
                <div className="w-full max-w-[400px] bg-slate-900 text-emerald-400 p-4 rounded-lg font-mono text-[9.5px] leading-relaxed text-left h-[180px] overflow-y-auto border border-slate-800">
                  {generationLogs.map((log, idx) => (
                    <div key={idx} className="pb-1">
                      <span className="text-slate-500 mr-2">&gt;</span>{log}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* Form screens step-wise */
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  
                  {/* STEP 1: Confirms family roles */}
                  {wizardStep === 1 && (
                    <div className="space-y-3">
                      <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider">Auswahl der Haushaltsmitglieder</h3>
                      <p className="text-[11px] text-slate-400">Bestätige, für wen geplant wird. Die DGE-Nährstoffgrenzwerte werden individuell kalkuliert.</p>
                      
                      <div className="space-y-2">
                        <div className="p-3 border border-indigo-100 bg-indigo-50/30 rounded-lg flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 bg-indigo-600 rounded-full text-white text-[10px] flex items-center justify-center font-bold">C</span>
                            <span className="text-xs font-bold text-slate-800">Christian (Vater, 35j, 110kg) — Gewichtsreduktion</span>
                          </div>
                          <span className="text-[10px] text-slate-400 uppercase font-mono tracking-tight font-bold">1.2x Portion</span>
                        </div>
                        <div className="p-3 border border-indigo-100 bg-indigo-50/30 rounded-lg flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 bg-indigo-600 rounded-full text-white text-[10px] flex items-center justify-center font-bold">K</span>
                            <span className="text-xs font-bold text-slate-800">Kimberly (Mutter, 33j, 55kg) — Gesundheit</span>
                          </div>
                          <span className="text-[10px] text-slate-400 uppercase font-mono tracking-tight font-bold">1.0x Portion</span>
                        </div>
                        <div className="p-3 border border-indigo-100 bg-indigo-50/30 rounded-lg flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 bg-indigo-600 rounded-full text-white text-[10px] flex items-center justify-center font-bold">A</span>
                            <span className="text-xs font-bold text-slate-800">Aron (Kind, 4j, 18kg) — Portion kindgerecht</span>
                          </div>
                          <span className="text-[10px] text-slate-400 uppercase font-mono tracking-tight font-bold">0.6x Portion</span>
                        </div>
                      </div>

                      <div className="pt-2">
                        <label className="text-[11px] font-bold text-slate-500 block mb-1">Startdatum der Woche</label>
                        <input
                          type="date"
                          value={wizardConfig.startDate}
                          onChange={(e) => setWizardConfig({ ...wizardConfig, startDate: e.target.value })}
                          className="w-full border border-slate-200 px-3 py-2 rounded text-xs focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>
                  )}

                  {/* STEP 2: Choose Diet Type */}
                  {wizardStep === 2 && (
                    <div className="space-y-3">
                      <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider">Ernährungsrichtung & Fokus</h3>
                      <p className="text-[11px] text-slate-400">Welcher Ernährungsstil soll für die gesamte Woche im Vordergrund stehen?</p>
                      
                      <div className="grid grid-cols-2 gap-3 pt-1">
                        {[
                          { key: "gesund", title: "Gesund & DGE-Balanced", desc: "Verteilung nach DGE-Richtwerten für Energie & Ballaststoffe." },
                          { key: "proteinreich", title: "Abnehm- & Eiweißfokus", desc: "Erhöhtes Protein zur Muskeldeckung für den Vater (110kg)." },
                          { key: "mediterran", title: "Mediterrane Kost", desc: "Fettfisch (Omega-3), Olivenöl, Knoblauch und viel Gemüse." },
                          { key: "kinderfreundlich", title: "Maximal Kinderfreundlich", desc: "Milde Speisen, weiche, kindergerechte Gemüsesorten für Aron." }
                        ].map((item) => (
                          <div
                            key={item.key}
                            onClick={() => setWizardConfig({ ...wizardConfig, dietType: item.key })}
                            className={`p-3 border rounded-lg cursor-pointer transition-all flex flex-col justify-between text-left ${
                              wizardConfig.dietType === item.key
                                ? "bg-indigo-50 border-indigo-600 text-indigo-900 shadow-sm"
                                : "bg-white border-slate-200 hover:border-slate-300"
                            }`}
                          >
                            <span className="text-xs font-bold block mb-1">{item.title}</span>
                            <span className="text-[9.5px] text-slate-400 uppercase block-line leading-normal">{item.desc}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* STEP 3: Stock/Pantry preferences */}
                  {wizardStep === 3 && (
                    <div className="space-y-3">
                      <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider">Lager- & Vorratsbeachtung</h3>
                      <p className="text-[11px] text-slate-400">Wie soll die KI mit deinen im Haushalt vorhandenen Lebensmitteln umgehen?</p>
                      
                      <div className="space-y-2">
                        {[
                          { key: "all", title: "Unbeschränkt planen", desc: "KI generiert Rezepte frei. Zutaten werden frisch eingekauft." },
                          { key: "stock_only", title: "Resteküche bevorzugen", desc: "Nutzt prioritär Dinge, die aktuell zu Hause sind (z.B. Kartoffeln, Quark)." },
                          { key: "stock_and_shopping", title: "Hybride Planung", desc: "Präferiert den Vorrat, ergänzt ihn intelligent im Supermarkt." }
                        ].map((mode) => (
                          <div
                            key={mode.key}
                            onClick={() => setWizardConfig({ ...wizardConfig, stockSource: mode.key })}
                            className={`p-3 border rounded-lg cursor-pointer transition-all flex justify-between items-center ${
                              wizardConfig.stockSource === mode.key
                                ? "bg-indigo-50 border-indigo-600 text-indigo-900"
                                : "bg-white border-slate-200 hover:border-slate-300"
                            }`}
                          >
                            <div>
                              <span className="text-xs font-bold block">{mode.title}</span>
                              <span className="text-[10px] text-slate-400">{mode.desc}</span>
                            </div>
                            <CheckCircle2 className={`w-4 h-4 shrink-0 ${wizardConfig.stockSource === mode.key ? "text-indigo-600" : "text-slate-300"}`} />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* STEP 4: Preferences & Allergens exclusions */}
                  {wizardStep === 4 && (
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <span className="text-xs font-black uppercase text-slate-400 tracking-wider block">Nutzungs-Ausschlüsse (Meiden)</span>
                        <p className="text-[11px] text-slate-400">Verhindert die automatische Verwendung kritischer Güter im Wochenmenü.</p>
                      </div>

                      <div className="flex flex-wrap gap-2 pt-1">
                        {[
                          { key: "meat", label: "Vegetarisch (kein Fleisch)" },
                          { key: "fish", label: "Vegan (kein Fisch/Ei/Milch)" },
                          { key: "nuts", label: "Nussfreie Zone" },
                          { key: "gluten", label: "Glutenfreier Fokus" },
                          { key: "mushrooms", label: "Keine Pilze (Christian meidet Pilze)" }
                        ].map((pref) => {
                          const isExcluded = wizardConfig.excludedCategories.includes(pref.key);
                          return (
                            <button
                              key={pref.key}
                              type="button"
                              onClick={() => {
                                const exists = wizardConfig.excludedCategories.includes(pref.key);
                                const updated = exists
                                  ? wizardConfig.excludedCategories.filter(x => x !== pref.key)
                                  : [...wizardConfig.excludedCategories, pref.key];
                                setWizardConfig({ ...wizardConfig, excludedCategories: updated });
                              }}
                              className={`px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer transition-all ${
                                isExcluded
                                  ? "bg-rose-50 border-rose-400 text-rose-700"
                                  : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                              }`}
                            >
                              {isExcluded ? "Meiden: " : "Ja: "} {pref.label}
                            </button>
                          );
                        })}
                      </div>

                      <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-lg text-[9.5px] text-indigo-700 leading-relaxed">
                        <span className="font-extrabold block mb-0.5">Aron-Sicherheitshinweis für Kleinkinder:</span>
                        Nüsse werden im generierten Plan automatisch nur gemahlen oder als weiches Nussmus für Aron markiert, um Atemwegsaspirationen auszuschließen.
                      </div>
                    </div>
                  )}

                  {/* STEP 5: Max Prep Time & Meal Prep */}
                  {wizardStep === 5 && (
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider">Alltagstauglichkeit & Vorbereitung</h3>
                        <p className="text-[11px] text-slate-400">Passe das Menü an deinen täglichen Zeitbedarf an.</p>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <label className="text-[11px] font-bold text-slate-500 block mb-1">Maximal Kochzeit pro Gericht</label>
                          <select
                            value={wizardConfig.maxPrepTime}
                            onChange={(e) => setWizardConfig({ ...wizardConfig, maxPrepTime: parseInt(e.target.value) })}
                            className="w-full border border-slate-200 p-2 rounded text-xs focus:ring-1 focus:ring-indigo-600 focus:outline-none focus:border-indigo-600"
                          >
                            <option value={15}>Schnellküche (Max. 15 Minuten)</option>
                            <option value={30}>Normaler Alltag (Max. 30 Minuten)</option>
                            <option value={45}>Feierabend-Koch (Max. 45 Minuten)</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-[11px] font-bold text-slate-500 block mb-1">Einkaufbudget</label>
                          <div className="grid grid-cols-3 gap-2">
                            {["günstig", "mittel", "premium"].map((budget) => (
                              <button
                                key={budget}
                                type="button"
                                onClick={() => setWizardConfig({ ...wizardConfig, budgetLevel: budget as any })}
                                className={`py-2 rounded text-xs font-bold border transition-all capitalize cursor-pointer ${
                                  wizardConfig.budgetLevel === budget
                                    ? "bg-indigo-600 text-white border-indigo-600"
                                    : "bg-white border-slate-200 text-slate-600"
                                }`}
                              >
                                {budget}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* STEP 6: Summary prior to generation */}
                  {wizardStep === 6 && (
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider">Planungs-Zusammenfassung</h3>
                        <p className="text-[11px] text-slate-400 font-medium">Bist du bereit zur Berechnung deines DGE-Ernährungsplans?</p>
                      </div>

                      <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 text-xs text-slate-700 leading-relaxed grid grid-cols-2 gap-3 font-semibold uppercase-headers">
                        <div>
                          <span className="text-[9px] text-slate-400 uppercase tracking-widest block font-bold">Wochenrichtung</span>
                          <span className="text-xs text-slate-800 capitalize font-extrabold">{wizardConfig.dietType}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-400 uppercase tracking-widest block font-bold">Kochzeit limit</span>
                          <span className="text-xs text-slate-800 font-extrabold">{wizardConfig.maxPrepTime} Minuten</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-400 uppercase tracking-widest block font-bold">Budgetklasse</span>
                          <span className="text-xs text-slate-800 capitalize font-extrabold">{wizardConfig.budgetLevel}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-400 uppercase tracking-widest block font-bold">Vorratsschutz</span>
                          <span className="text-xs text-slate-800 capitalize font-extrabold">{wizardConfig.stockSource === "all" ? "Keiner" : "Aktiv"}</span>
                        </div>
                      </div>

                      <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-lg text-[9.5px] text-emerald-800 leading-relaxed">
                        <span className="font-extrabold block mb-0.5">DGE-Vorschau:</span>
                        Wir decken automatisch alle wesentlichen Vitamine (E, C, B-Vitamine, Folat) sowie Mineralstoffe (Jod, Calcium, Magnesium, Zink) bestmöglich ab.
                      </div>
                    </div>
                  )}

                </div>

                {/* Footer Actions */}
                <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-between items-center shrink-0">
                  {wizardStep > 1 ? (
                    <button
                      onClick={() => setWizardStep(prev => prev - 1)}
                      className="text-slate-600 hover:text-slate-900 text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" /> Zurück
                    </button>
                  ) : <div />}

                  {wizardStep < 6 ? (
                    <button
                      onClick={() => setWizardStep(prev => prev + 1)}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-1 cursor-pointer transition-all"
                    >
                      Weiter <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <button
                      onClick={triggerKIGeneration}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4.5 py-2 rounded-lg flex items-center gap-1.5 cursor-pointer shadow transition-all"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-emerald-200" />
                      Ernährungsplan generieren
                    </button>
                  )}
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL WINDOW 2: RECIPE DETAILS scaled dynamically */}
      {/* ========================================================================= */}
      {isRecipeModalOpen && selectedRecipe && (
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-6">
          <div className="bg-white w-[92%] sm:w-[500px] max-h-[580px] rounded-xl shadow-2xl flex flex-col border border-slate-200 overflow-hidden">
            
            {/* Header */}
            <div className="px-5 py-3.5 bg-slate-50 border-b border-indigo-50 flex justify-between items-center shrink-0">
              <span className="text-xs font-bold uppercase text-indigo-600 tracking-wider">
                Rezept-Schnittstelle
              </span>
              <button onClick={() => setIsRecipeModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable details */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <div>
                <h3 className="text-base font-black text-slate-800 leading-tight">{selectedRecipe.name}</h3>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {selectedRecipe.diets.map((diet, i) => (
                    <span key={i} className="text-[9px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-bold uppercase">{diet}</span>
                  ))}
                  <span className="text-[9px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-bold uppercase">Kochzeit: {selectedRecipe.prepTime} Min</span>
                </div>
              </div>

              {/* Dynamic Scaling Portions based on selected switcher role */}
              <div className="p-3.5 bg-indigo-50/50 rounded-lg border border-indigo-100/50">
                <span className="text-[10px] uppercase font-bold text-indigo-800 tracking-wider block mb-1">
                  Portion für: {currentMember?.name}
                </span>
                <p className="text-[10.5px] text-slate-500 mb-2 leading-relaxed">
                  Die Zutatenmengen wurden automatisch für diese Person herunterskaliert (DGE-skaliert).
                </p>

                <ul className="space-y-1">
                  {getScaledIngredients(selectedRecipe, activeRole).map((ing, i) => (
                    <li key={i} className="text-xs text-slate-700 flex justify-between font-semibold">
                      <span>• {ing.name} {ing.notes ? `(${ing.notes})` : ""}</span>
                      <span className="font-mono text-indigo-600">{ing.scaledAmount} {ing.unit}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Step wise instruction */}
              <div className="space-y-2">
                <span className="text-[10.5px] uppercase font-bold text-slate-400 block tracking-widest">Kochanweisungen</span>
                <ol className="list-decimal pl-5 space-y-1.5 text-xs text-slate-600 leading-normal">
                  {selectedRecipe.instructions.map((step, idx) => (
                    <li key={idx}>{step}</li>
                  ))}
                </ol>
              </div>

              {/* Kid Note if relevant */}
              {selectedRecipe.isKidFriendly && selectedRecipe.kidNote && (
                <div className="p-3 bg-amber-50 border-l-2 border-amber-400 rounded-r text-[9.5px] text-amber-800">
                  <span className="font-bold uppercase block mb-0.5">Sicherheit für Aron (4 J.):</span>
                  {selectedRecipe.kidNote}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex justify-between shrink-0">
              <span className="text-xs font-mono font-bold text-slate-700 pt-1">
                Familiengesamtbedarf: {selectedRecipe.calories} kcal
              </span>
              <button
                onClick={() => setIsRecipeModalOpen(false)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-1.5 rounded cursor-pointer transition-all"
              >
                Schließen
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL WINDOW 3: ADD NEW FOOD */}
      {/* ========================================================================= */}
      {isFoodModalOpen && (
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-6">
          <div className="bg-white w-[92%] sm:w-[420px] rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
            
            <form onSubmit={handleAddFood}>
              <div className="px-5 py-3.5 bg-slate-50 border-b border-indigo-50 flex justify-between items-center">
                <span className="text-xs font-bold uppercase text-indigo-600">Lebensmittel hinzufügen</span>
                <button type="button" onClick={() => setIsFoodModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 space-y-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-500 block mb-0.5">Lebensmittel-Name</label>
                  <input
                    type="text"
                    required
                    value={newFood.name}
                    onChange={(e) => setNewFood({ ...newFood, name: e.target.value })}
                    className="w-full border border-slate-200 px-3 py-1.5 rounded text-xs focus:ring-1 focus:ring-indigo-600 focus:outline-none"
                    placeholder="z.B. Paprika Gelb"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-500 block mb-0.5">Hauptkategorie</label>
                  <select
                    value={newFood.category}
                    onChange={(e) => setNewFood({ ...newFood, category: e.target.value })}
                    className="w-full border border-slate-200 p-1.5 rounded text-xs focus:ring-1 focus:ring-indigo-600"
                  >
                    <option value="Beilagen">Beilagen</option>
                    <option value="Gemüse">Gemüse</option>
                    <option value="Obst">Obst</option>
                    <option value="Fleisch">Fleisch</option>
                    <option value="Fisch & Meeresfrüchte">Fisch & Meeresfrüchte</option>
                    <option value="Milchprodukte & Alternativen">Milchprodukte & Alternativen</option>
                    <option value="Hülsenfrüchte & pflanzliche Proteinquellen">Hülsenfrüchte</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 block mb-0.5">Kalorien / 100g (kcal)</label>
                    <input
                      type="number"
                      value={newFood.calories}
                      onChange={(e) => setNewFood({ ...newFood, calories: parseInt(e.target.value) || 0 })}
                      className="w-full border border-slate-200 px-3 py-1 text-xs focus:ring-1 focus:ring-indigo-600"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 block mb-0.5">Restbestand (z.B. 500g)</label>
                    <input
                      type="text"
                      value={newFood.stockAmount}
                      onChange={(e) => setNewFood({ ...newFood, stockAmount: e.target.value })}
                      className="w-full border border-slate-200 px-3 py-1 text-xs"
                      placeholder="500g"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="isAvailableCheck"
                    checked={newFood.isAvailable}
                    onChange={(e) => setNewFood({ ...newFood, isAvailable: e.target.checked })}
                  />
                  <label htmlFor="isAvailableCheck" className="text-xs text-slate-600 font-semibold cursor-pointer">
                    Aktuell im Haushalt vorhanden
                  </label>
                </div>
              </div>

              <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex justify-end gap-2 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setIsFoodModalOpen(false)}
                  className="px-3.5 py-1.5 text-slate-600 hover:text-slate-900 border border-slate-200 rounded"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                >
                  Speichern
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL WINDOW 4: ADD NEW RECIPE */}
      {/* ========================================================================= */}
      {isNewRecipeModalOpen && (
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-6">
          <div className="bg-white w-[92%] sm:w-[500px] max-h-[580px] rounded-xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
            
            <form onSubmit={handleAddRecipe} className="flex flex-col h-full overflow-hidden">
              <div className="px-5 py-3.5 bg-slate-50 border-b border-indigo-50 flex justify-between items-center shrink-0">
                <span className="text-xs font-bold uppercase text-indigo-600">Eigenes Rezept hinzufügen</span>
                <button type="button" onClick={() => setIsNewRecipeModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-500 block mb-0.5">Rezept-Name</label>
                  <input
                    type="text"
                    required
                    value={newRecipe.name}
                    onChange={(e) => setNewRecipe({ ...newRecipe, name: e.target.value })}
                    className="w-full border border-slate-200 px-3 py-1.5 rounded text-xs focus:ring-1 focus:ring-indigo-600 focus:outline-none"
                    placeholder="z.B. Spinatlasagne mit Tofu"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 block mb-0.5">Mahlzeitentyp</label>
                    <select
                      value={newRecipe.mealType}
                      onChange={(e) => setNewRecipe({ ...newRecipe, mealType: e.target.value as any })}
                      className="w-full border border-slate-200 p-1.5 rounded text-xs focus:ring-1 focus:ring-indigo-600"
                    >
                      <option value="breakfast">Frühstück</option>
                      <option value="lunch">Mittagessen</option>
                      <option value="dinner">Abendessen</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 block mb-0.5">Zubereitungszeit (Min)</label>
                    <input
                      type="number"
                      value={newRecipe.prepTime}
                      onChange={(e) => setNewRecipe({ ...newRecipe, prepTime: parseInt(e.target.value) || 20 })}
                      className="w-full border border-slate-200 px-3 py-1 text-xs focus:ring-1 focus:ring-indigo-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-1">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Kalorien (grob)</label>
                    <input
                      type="number"
                      value={newRecipe.calories}
                      onChange={(e) => setNewRecipe({ ...newRecipe, calories: parseInt(e.target.value) || 0 })}
                      className="w-full border border-slate-200 px-2 py-0.5 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Protein (g)</label>
                    <input
                      type="number"
                      value={newRecipe.protein}
                      onChange={(e) => setNewRecipe({ ...newRecipe, protein: parseInt(e.target.value) || 0 })}
                      className="w-full border border-slate-200 px-2 py-0.5 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Zubereitungs-Schritte</label>
                    <input
                      type="text"
                      className="w-full border border-slate-200 px-2 py-0.5 text-xs"
                      placeholder="Schritte mit Komma trennen"
                      value={(newRecipe.instructions || []).join(", ")}
                      onChange={(e) => setNewRecipe({ ...newRecipe, instructions: e.target.value.split(",") })}
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <label className="text-[11px] font-bold text-slate-500 block mb-0.5">Kindgerechter Hinweis (Aron)</label>
                  <input
                    type="text"
                    value={newRecipe.kidNote}
                    onChange={(e) => setNewRecipe({ ...newRecipe, kidNote: e.target.value })}
                    className="w-full border border-slate-200 px-3 py-1 w-full text-xs"
                    placeholder="z.B. Für Aron die Sauce fein pürieren, mild salzen"
                  />
                </div>
              </div>

              <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex justify-end gap-2 text-xs font-bold shrink-0">
                <button
                  type="button"
                  onClick={() => setIsNewRecipeModalOpen(false)}
                  className="px-3.5 py-1.5 text-slate-600 hover:text-slate-900 border border-slate-200 rounded"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                >
                  Erstellen
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
