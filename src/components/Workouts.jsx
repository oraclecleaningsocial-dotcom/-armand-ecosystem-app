import { useState } from 'react';
import { Card, SectionTitle } from './ui.jsx';

export function Workouts({ state, actions }) {
  const [w, setW] = useState({ name: '', date: state.currentDate, time: '18:00', duration: 45, muscleGroup: 'Generale' });
  return (
    <>
      <SectionTitle title="Allenamenti" subtitle="Programma, modifica esercizi, completa e calcola volume totale." />
      <Card>
        <h3>Nuovo allenamento</h3>
        <div className="formGrid">
          <input placeholder="Nome" value={w.name} onChange={e => setW({ ...w, name: e.target.value })} />
          <input type="date" value={w.date} onChange={e => setW({ ...w, date: e.target.value })} />
          <input type="time" value={w.time} onChange={e => setW({ ...w, time: e.target.value })} />
          <input type="number" value={w.duration} onChange={e => setW({ ...w, duration: e.target.value })} />
          <input value={w.muscleGroup} onChange={e => setW({ ...w, muscleGroup: e.target.value })} />
          <button
            onClick={() => {
              actions.addWorkout({ ...w, reminderEnabled: true });
              setW({ ...w, name: '' });
            }}
          >
            Aggiungi
          </button>
        </div>
      </Card>
      {state.workouts.map(workout => (
        <WorkoutCard key={workout.id} workout={workout} actions={actions} />
      ))}
    </>
  );
}

function WorkoutCard({ workout, actions }) {
  const [e, setE] = useState({ name: '', sets: 3, reps: 10, weight: 0, restSeconds: 60 });
  return (
    <Card>
      <h3>{workout.name}</h3>
      <p>{workout.date} {workout.time} · {workout.duration} min · {workout.muscleGroup} · Stato: {workout.status}</p>
      <small>Fonte input: lista allenamenti ed esercizi modificabili</small>
      {workout.exercises.map(ex => (
        <div className="item" key={ex.id}>
          <input type="checkbox" checked={ex.completed} onChange={() => actions.editExercise(workout.id, ex.id, { completed: !ex.completed })} />
          <div>
            <b>{ex.name}</b>
            <small>
              Serie <input type="number" value={ex.sets} onChange={ev => actions.editExercise(workout.id, ex.id, { sets: ev.target.value })} />
              {' '}Rip <input type="number" value={ex.reps} onChange={ev => actions.editExercise(workout.id, ex.id, { reps: ev.target.value })} />
              {' '}Peso <input type="number" value={ex.weight} onChange={ev => actions.editExercise(workout.id, ex.id, { weight: ev.target.value })} /> kg
            </small>
          </div>
        </div>
      ))}
      <div className="formGrid">
        <input placeholder="Esercizio" value={e.name} onChange={ev => setE({ ...e, name: ev.target.value })} />
        <input type="number" value={e.sets} onChange={ev => setE({ ...e, sets: ev.target.value })} />
        <input type="number" value={e.reps} onChange={ev => setE({ ...e, reps: ev.target.value })} />
        <input type="number" value={e.weight} onChange={ev => setE({ ...e, weight: ev.target.value })} />
        <button
          onClick={() => {
            actions.addExercise(workout.id, e);
            setE({ ...e, name: '' });
          }}
        >
          Aggiungi esercizio
        </button>
        <button onClick={() => actions.completeWorkout(workout.id)}>Completa allenamento</button>
      </div>
    </Card>
  );
}
