import { MedicationLike } from './MedicationLike.jsx';

export function Medications({ state, actions }) {
  return (
    <MedicationLike
      title="Farmaci"
      items={state.health.medications}
      add={actions.addMedication}
      source="farmaci inseriti e promemoria salute"
    />
  );
}
