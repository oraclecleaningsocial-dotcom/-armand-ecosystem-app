import { appState, createId, createShoppingKey } from './state.js';
import { syncEcosystem } from './dashboard.js';
import { ensureCurrentFinanceMonth } from './finance.js';

export function generateShoppingListFromDailyMeals() {
  const recipeIds = ['breakfast', 'lunch', 'dinner', 'snack']
    .map(k => appState.dailyMeals[k]?.recipeId)
    .filter(Boolean);
  const manual = appState.shoppingList.filter(i => i.source === 'Inserimento manuale');
  const preserved = {};
  appState.shoppingList
    .filter(i => i.source !== 'Inserimento manuale')
    .forEach(i => {
      preserved[createShoppingKey(i.name, i.unit, i.category)] = {
        purchased: i.purchased, estimatedPrice: i.estimatedPrice, realPrice: i.realPrice
      };
    });
  const map = {};
  recipeIds.forEach(id => {
    const recipe = appState.recipes.find(r => r.id === id);
    if (!recipe) return;
    recipe.ingredients.forEach(ing => {
      const category = ing.category || 'Altro';
      const unit = ing.unit || '';
      const key = createShoppingKey(ing.name, unit, category);
      if (!map[key]) {
        const p = preserved[key] || {};
        map[key] = {
          id: createId('item'),
          name: ing.name,
          quantity: Number(ing.quantity || 0),
          unit,
          category,
          purchased: p.purchased || false,
          source: recipe.name,
          sources: [recipe.name],
          recipeId: recipe.id,
          recipeIds: [recipe.id],
          estimatedPrice: p.estimatedPrice ?? ing.estimatedPrice ?? null,
          realPrice: p.realPrice ?? null
        };
      } else {
        map[key].quantity += Number(ing.quantity || 0);
        if (!map[key].sources.includes(recipe.name)) map[key].sources.push(recipe.name);
        if (!map[key].recipeIds.includes(recipe.id)) map[key].recipeIds.push(recipe.id);
        map[key].source = map[key].sources.join(', ');
      }
    });
  });
  appState.shoppingList = [...manual, ...Object.values(map)];
  recalculateShoppingTotals();
  return appState.shoppingList;
}

export function addManualShoppingItem(name, quantity, unit = '', category = 'Altro', estimatedPrice = null) {
  if (!name || !quantity) return { success: false, errors: ['Inserisci nome prodotto e quantità'] };
  const ex = appState.shoppingList.find(i =>
    i.name.toLowerCase() === name.toLowerCase() && i.source === 'Inserimento manuale' && i.unit === unit && i.category === category
  );
  if (ex) {
    ex.quantity += Number(quantity);
  } else {
    appState.shoppingList.push({
      id: createId('item'),
      name,
      quantity: Number(quantity),
      unit,
      category,
      purchased: false,
      source: 'Inserimento manuale',
      sources: ['Inserimento manuale'],
      recipeId: null,
      recipeIds: [],
      estimatedPrice: estimatedPrice === '' ? null : Number(estimatedPrice ?? 0),
      realPrice: null
    });
  }
  syncEcosystem('SHOPPING_ITEM_ADDED', {});
  return { success: true };
}

export function deleteShoppingItem(itemId) {
  appState.shoppingList = appState.shoppingList.filter(i => i.id !== itemId);
  syncEcosystem('SHOPPING_ITEM_DELETED', { itemId });
  return { success: true };
}

export function togglePurchasedItem(itemId) {
  const i = appState.shoppingList.find(x => x.id === itemId);
  if (!i) return { success: false, errors: ['Prodotto non trovato'] };
  i.purchased = !i.purchased;
  syncEcosystem('SHOPPING_ITEM_PURCHASED', { itemId });
  return { success: true };
}

export function updateShoppingItemQuantity(itemId, newQuantity, newUnit) {
  const i = appState.shoppingList.find(x => x.id === itemId);
  if (!i) return { success: false, errors: ['Prodotto non trovato'] };
  i.quantity = Number(newQuantity);
  if (newUnit !== undefined) i.unit = newUnit;
  syncEcosystem('SHOPPING_ITEM_UPDATED', {});
  return { success: true };
}

export function updateEstimatedPrice(itemId, estimatedPrice) {
  const i = appState.shoppingList.find(x => x.id === itemId);
  if (!i) return { success: false, errors: ['Prodotto non trovato'] };
  i.estimatedPrice = Number(estimatedPrice || 0);
  syncEcosystem('ESTIMATED_PRICE_ADDED', {});
  return { success: true };
}

export function updateRealPrice(itemId, realPrice) {
  const i = appState.shoppingList.find(x => x.id === itemId);
  if (!i) return { success: false, errors: ['Prodotto non trovato'] };
  i.realPrice = Number(realPrice || 0);
  syncEcosystem('REAL_PRICE_ADDED', {});
  return { success: true };
}

export function mergeDuplicateShoppingItems() {
  const map = {};
  appState.shoppingList.forEach(item => {
    const key = createShoppingKey(item.name, item.unit, item.category);
    if (!map[key]) {
      map[key] = { ...item, sources: item.sources || [item.source], recipeIds: item.recipeIds || (item.recipeId ? [item.recipeId] : []) };
    } else {
      map[key].quantity += Number(item.quantity || 0);
      map[key].purchased = map[key].purchased && item.purchased;
      map[key].estimatedPrice = map[key].estimatedPrice ?? item.estimatedPrice;
      map[key].realPrice = map[key].realPrice ?? item.realPrice;
      [...(item.sources || [item.source])].forEach(s => s && !map[key].sources.includes(s) && map[key].sources.push(s));
      [...(item.recipeIds || [])].forEach(r => r && !map[key].recipeIds.includes(r) && map[key].recipeIds.push(r));
      map[key].source = map[key].sources.join(', ');
    }
  });
  appState.shoppingList = Object.values(map);
  syncEcosystem('SHOPPING_ITEMS_MERGED', {});
  return { success: true };
}

export function recalculateShoppingTotals() {
  const totalItems = appState.shoppingList.length;
  const purchasedItems = appState.shoppingList.filter(i => i.purchased).length;
  const notPurchasedItems = appState.shoppingList.filter(i => !i.purchased).length;
  const estimatedTotal = appState.shoppingList.reduce((s, i) => s + Number(i.estimatedPrice || 0), 0);
  const realTotal = appState.shoppingList.reduce((s, i) => s + (i.purchased ? Number(i.realPrice || 0) : 0), 0);
  appState.shoppingSummary = { totalItems, purchasedItems, notPurchasedItems, estimatedTotal, realTotal, difference: realTotal - estimatedTotal };
  return appState.shoppingSummary;
}

export function updateFoodExpenseFromShopping() {
  const m = ensureCurrentFinanceMonth();
  const total = appState.shoppingList.reduce((s, i) => s + (i.purchased ? Number(i.realPrice || 0) : 0), 0);
  const e = m.expenses.find(x => x.name === 'Spesa alimentare da lista');
  if (e) {
    e.amount = total;
  } else if (total > 0) {
    m.expenses.push({ id: createId('expense'), name: 'Spesa alimentare da lista', amount: total, category: 'Spesa alimentare', type: 'variable', date: appState.currentDate, automatic: true });
  }
}
