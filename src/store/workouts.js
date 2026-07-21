import { appState, createId } from './state.js';
import { syncEcosystem } from './dashboard.js';
import { scheduleReminder } from './notifications.js';

export function addWorkout(workout) {
  if (!workout.name) return { success: false, errors: ['Inserisci nome allenamento'] };
  const w = {
    id: createId('workout'),
    name: workout.name,
    date: workout.date || appState.currentDate,
    time: workout.time || '',
    duration: Number(workout.duration || 0),
    muscleGroup: workout.muscleGroup || 'Generale',
    exercises: workout.exercises || [],
    notes: workout.notes || '',
    status: workout.status || 'programmato'
  };
  appState.workouts.push(w);
  if (workout.reminderEnabled && w.date && w.time) {
    scheduleReminder('workout', w.id, 'Allenamento', `${appState.user.name}, oggi hai ${w.name} alle ${w.time}`, w.date, w.time, 'Fitness');
  }
  syncEcosystem('WORKOUT_ADDED', w);
  return { success: true, workout: w };
}

export function editWorkout(workoutId, updatedData) {
  const w = appState.workouts.find(x => x.id === workoutId);
  if (!w) return { success: false };
  Object.assign(w, updatedData);
  syncEcosystem('WORKOUT_UPDATED', {});
  return { success: true, workout: w };
}

export function deleteWorkout(workoutId) {
  appState.workouts = appState.workouts.filter(w => w.id !== workoutId);
  syncEcosystem('WORKOUT_DELETED', {});
  return { success: true };
}

export function addExerciseToWorkout(workoutId, exercise) {
  const w = appState.workouts.find(x => x.id === workoutId);
  if (!w || !exercise.name) return { success: false };
  const e = {
    id: createId('exercise'),
    name: exercise.name,
    sets: Number(exercise.sets || 0),
    reps: Number(exercise.reps || 0),
    weight: Number(exercise.weight || 0),
    restSeconds: Number(exercise.restSeconds || 0),
    notes: exercise.notes || '',
    completed: false
  };
  w.exercises.push(e);
  syncEcosystem('EXERCISE_ADDED', {});
  return { success: true, exercise: e };
}

export function editExercise(workoutId, exerciseId, updatedData) {
  const e = appState.workouts.find(w => w.id === workoutId)?.exercises.find(x => x.id === exerciseId);
  if (!e) return { success: false };
  Object.assign(e, updatedData);
  ['sets', 'reps', 'weight', 'restSeconds'].forEach(k => {
    if (e[k] !== undefined) e[k] = Number(e[k]);
  });
  syncEcosystem('EXERCISE_UPDATED', {});
  return { success: true, exercise: e };
}

export function deleteExercise(workoutId, exerciseId) {
  const w = appState.workouts.find(x => x.id === workoutId);
  if (!w) return { success: false };
  w.exercises = w.exercises.filter(e => e.id !== exerciseId);
  syncEcosystem('EXERCISE_DELETED', {});
  return { success: true };
}

export function completeWorkout(workoutId) {
  const w = appState.workouts.find(x => x.id === workoutId);
  if (!w) return { success: false };
  w.status = 'completato';
  syncEcosystem('WORKOUT_COMPLETED', {});
  return { success: true };
}

export function duplicateWorkout(workoutId, newDate) {
  const w = appState.workouts.find(x => x.id === workoutId);
  if (!w) return { success: false };
  const d = structuredClone(w);
  d.id = createId('workout');
  d.date = newDate || appState.currentDate;
  d.status = 'programmato';
  d.exercises = d.exercises.map(e => ({ ...e, id: createId('exercise'), completed: false }));
  appState.workouts.push(d);
  syncEcosystem('WORKOUT_DUPLICATED', {});
  return { success: true, workout: d };
}

export function calculateFitnessProgress() {
  const completed = appState.workouts.filter(w => w.status === 'completato');
  const totalVolume = completed.reduce((s, w) => s + w.exercises.reduce((x, e) => x + Number(e.sets || 0) * Number(e.reps || 0) * Number(e.weight || 0), 0), 0);
  appState.fitnessSummary = { totalWorkouts: appState.workouts.length, completedWorkouts: completed.length, totalVolume };
  return appState.fitnessSummary;
}
