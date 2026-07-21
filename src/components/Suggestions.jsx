import { Card, SectionTitle } from './ui.jsx';

export function Suggestions({ state }) {
  return (
    <>
      <SectionTitle title="Suggerimenti intelligenti" subtitle="Analisi automatica di pasti, spesa, finanza, allenamenti, salute e meteo." />
      {state.suggestions.map((s, i) => (
        <Card key={i}>
          <h3>{s.action}</h3>
          <p>{s.message}</p>
          <small>Fonte input: Intelligence layer dell’ecosistema</small>
        </Card>
      ))}
    </>
  );
}
