import { Card, SectionTitle } from './ui.jsx';

export function SettingsPage({ state, actions }) {
  return (
    <>
      <SectionTitle title="Impostazioni" subtitle="Gestione locale, privacy, Apple Health e reset dati." />
      <Card>
        <h3>Privacy</h3>
        <p>I dati sono salvati nel browser tramite localStorage. Apple Health richiede consenso esplicito e qui è predisposto in mock.</p>
      </Card>
      <Card>
        <h3>Apple Health</h3>
        <p>Stato: {state.appleHealth.connected ? 'collegato' : 'non collegato'}</p>
        <button onClick={state.appleHealth.connected ? actions.disconnectHealth : actions.connectHealth}>
          {state.appleHealth.connected ? 'Scollega' : 'Collega mock'}
        </button>
      </Card>
      <Card>
        <h3>Reset</h3>
        <button className="danger" onClick={actions.reset}>Cancella dati locali e riparti</button>
      </Card>
    </>
  );
}
