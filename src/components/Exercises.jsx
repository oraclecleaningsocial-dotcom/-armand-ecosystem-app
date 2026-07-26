import { Card, SectionTitle } from './ui.jsx';

export function Exercises({ state }) {
  return (
    <>
      <SectionTitle title="Esercizi" subtitle="Tutti gli esercizi sono modificabili dentro ogni allenamento." />
      {state.workouts.flatMap(w =>
        w.exercises.map(e => (
          <Card key={w.id + e.id}>
            <h3>{e.name}</h3>
            <p>{w.name}: {e.sets} serie · {e.reps} rip · {e.weight} kg · recupero {e.restSeconds}s</p>
          </Card>
        ))
      )}
    </>
  );
}
