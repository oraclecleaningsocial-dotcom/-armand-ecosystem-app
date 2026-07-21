import { Card, SectionTitle } from './ui.jsx';

export function Health({ state }) {
  return (
    <>
      <SectionTitle title="Salute" subtitle="Pressione, temperatura, farmaci, integratori e storico." />
      <div className="grid2">
        <Card>
          <h3>Ultima pressione</h3>
          <h2>{state.healthSummary?.lastPressure ? `${state.healthSummary.lastPressure.systolic}/${state.healthSummary.lastPressure.diastolic}` : 'Nessuna'}</h2>
          <small>Fonte input: misurazioni pressione manuali</small>
        </Card>
        <Card>
          <h3>Ultima temperatura</h3>
          <h2>{state.healthSummary?.lastTemperature ? state.healthSummary.lastTemperature.value + '°C' : 'Nessuna'}</h2>
          <small>Fonte input: misurazioni temperatura manuali</small>
        </Card>
        <Card>
          <h3>Farmaci</h3>
          <h2>{state.health.medications.length}</h2>
          <small>Fonte input: farmaci inseriti</small>
        </Card>
        <Card>
          <h3>Integratori</h3>
          <h2>{state.health.supplements.length}</h2>
          <small>Fonte input: integratori inseriti</small>
        </Card>
      </div>
    </>
  );
}
