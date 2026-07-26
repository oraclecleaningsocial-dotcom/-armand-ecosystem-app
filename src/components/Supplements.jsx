import { MedicationLike } from './MedicationLike.jsx';

export function Supplements({ state, actions }) {
  return (
    <MedicationLike
      title="Integratori"
      items={state.health.supplements}
      add={actions.addSupplement}
    />
  );
}
