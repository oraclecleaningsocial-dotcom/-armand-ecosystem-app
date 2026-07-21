import { Timer } from 'lucide-react';
import { Card, SectionTitle } from './ui.jsx';

const MEAL_LABELS = { breakfast: 'Colazione', lunch: 'Pranzo', dinner: 'Cena', snack: 'Snack' };

export function Meals({ state, actions }) {
  return (
    <>
      <SectionTitle title="Pasti di oggi" subtitle="Ricette, ingredienti, preparazione e lista spesa collegata." />
      <div className="grid2">
        {Object.entries(MEAL_LABELS).map(([k, label]) => {
          const meal = state.dailyMeals[k];
          const recipe = state.recipes.find(r => r.id === meal?.recipeId);
          return (
            <Card key={k}>
              <h3>{label}</h3>
              <select value={meal?.recipeId || ''} onChange={e => actions.assignRecipe(k, e.target.value)}>
                <option value="">Scegli ricetta</option>
                {state.recipes.map(r => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
              {recipe ? (
                <>
                  <h2>{recipe.name}</h2>
                  <p><Timer size={15} /> {recipe.prepTime} minuti</p>
                  <small>Fonte input: Ricette assegnate al piano alimentare giornaliero</small>
                  <ul>
                    {recipe.ingredients.map(i => (
                      <li key={i.name}>{i.quantity} {i.unit} {i.name}</li>
                    ))}
                  </ul>
                  <p>{recipe.steps?.slice(0, 2).join(' → ')}</p>
                </>
              ) : (
                <p>Nessuna ricetta assegnata.</p>
              )}
            </Card>
          );
        })}
      </div>
    </>
  );
}
