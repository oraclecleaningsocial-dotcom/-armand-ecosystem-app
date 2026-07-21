import { appState, createId } from './state.js';
import { syncEcosystem } from './dashboard.js';

export function validateRecipe(recipe) {
  const errors = [];
  if (!recipe.name) errors.push('Inserisci il nome della ricetta');
  if (!recipe.ingredients?.length) errors.push('Aggiungi almeno un ingrediente');
  recipe.ingredients?.forEach(i => {
    if (!i.name) errors.push('Un ingrediente non ha il nome');
    if (!i.quantity || i.quantity <= 0) errors.push('Quantità non valida per ' + (i.name || 'ingrediente'));
    if (!i.unit) errors.push('Manca unità per ' + (i.name || 'ingrediente'));
  });
  return errors;
}

export function addRecipe(recipe) {
  const errors = validateRecipe(recipe);
  if (errors.length) return { success: false, errors };
  const newRecipe = {
    id: createId('recipe'),
    name: recipe.name,
    mealType: recipe.mealType || 'altro',
    prepTime: Number(recipe.prepTime || 0),
    ingredients: recipe.ingredients || [],
    steps: recipe.steps || []
  };
  appState.recipes.push(newRecipe);
  syncEcosystem('RECIPE_ADDED', newRecipe);
  return { success: true, recipe: newRecipe };
}

export function editRecipe(recipeId, updatedData) {
  const r = appState.recipes.find(x => x.id === recipeId);
  if (!r) return { success: false, errors: ['Ricetta non trovata'] };
  const next = { ...r, ...updatedData };
  const errors = validateRecipe(next);
  if (errors.length) return { success: false, errors };
  Object.assign(r, next);
  syncEcosystem('RECIPE_UPDATED', { recipeId });
  return { success: true, recipe: r };
}

export function deleteRecipe(recipeId) {
  const idx = appState.recipes.findIndex(r => r.id === recipeId);
  if (idx < 0) return { success: false, errors: ['Ricetta non trovata'] };
  appState.recipes.splice(idx, 1);
  ['breakfast', 'lunch', 'dinner', 'snack'].forEach(k => {
    if (appState.dailyMeals[k]?.recipeId === recipeId) appState.dailyMeals[k] = null;
  });
  appState.shoppingList = appState.shoppingList.filter(i => !i.recipeIds?.includes(recipeId));
  syncEcosystem('RECIPE_DELETED', { recipeId });
  return { success: true };
}

export function assignRecipeToMeal(mealType, recipeId) {
  const recipe = appState.recipes.find(r => r.id === recipeId);
  if (!recipe) return { success: false, errors: ['Ricetta non trovata'] };
  const map = {
    colazione: 'breakfast', pranzo: 'lunch', cena: 'dinner', snack: 'snack',
    breakfast: 'breakfast', lunch: 'lunch', dinner: 'dinner'
  };
  const key = map[mealType];
  if (!key) return { success: false, errors: ['Tipo pasto non valido'] };
  appState.dailyMeals[key] = { name: recipe.name, recipeId: recipe.id };
  syncEcosystem('RECIPE_ASSIGNED_TO_MEAL', { mealType, recipeId });
  return { success: true };
}
