import { getHealthSummaryFromAppleHealth } from '../store/index.js';
import { Card, SectionTitle } from './ui.jsx';

export function Fitness({ state, actions }) {
  const h = getHealthSummaryFromAppleHealth();
  return (
    <>
      <SectionTitle title="Fitness" subtitle="Progressi, volume e predisposizione Apple Health." />
      <div className="grid3">
        <Card>
          <h3>Allenamenti</h3>
          <h2>{state.fitnessSummary?.completedWorkouts}/{state.fitnessSummary?.totalWorkouts}</h2>
          <small>Fonte input: allenamenti completati</small>
        </Card>
        <Card>
          <h3>Volume totale</h3>
          <h2>{state.fitnessSummary?.totalVolume} kg</h2>
          <small>Fonte input: serie × ripetizioni × peso</small>
        </Card>
        <Card>
          <h3>Apple Health</h3>
          <h2>{state.appleHealth.connected ? 'Collegato' : 'Non collegato'}</h2>
          <button onClick={state.appleHealth.connected ? actions.disconnectHealth : actions.connectHealth}>
            {state.appleHealth.connected ? 'Scollega' : 'Collega mock'}
          </button>
        </Card>
      </div>
      <Card>
        <h3>Dati Health predisposti</h3>
        <p>Passi: {h.stepsToday}, calorie attive: {h.activeCalories}, cuore medio: {h.heartRateAverage || 'n/d'}</p>
        <small>Fonte input: HealthKit / Apple Health con consenso utente. In web è mock; in React Native collegare react-native-health o HealthKit.</small>
      </Card>
    </>
  );
}
