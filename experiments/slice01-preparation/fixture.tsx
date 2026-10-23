import { useState } from 'react';
import { createRoot } from 'react-dom/client';

type ComposerProps = { onAsk: (text: string) => void };
const Composer = ({ onAsk }: ComposerProps) => {
  const [draft, setDraft] = useState('');
  const [saved, setSaved] = useState(false);
  return <form onSubmit={event => { event.preventDefault();if (!draft.trim() || saved) return;onAsk(draft.trim());setSaved(true); }}>
    <p data-anchor>Selected source: head · docs/README.md · 5–13</p>
    <label htmlFor="question">Question</label>
    <textarea id="question" value={draft} onChange={event => setDraft(event.target.value)} disabled={saved} rows={3} />
    <button type="submit" disabled={!draft.trim() || saved}>Ask agent</button>
    <p role="status">{saved ? 'Saved · notification pending' : 'Select a source span, then ask a question.'}</p>
  </form>;
};
const Fixture = () => {
  const [generation, setGeneration] = useState(0);
  const [questions, setQuestions] = useState<string[]>([]);
  return <main><header><h1>Understand one change</h1><p>PR #14 · pinned documentation change · diagnostic UI</p></header>
    <section aria-label="Pinned source"><h2>Source context</h2><div className="sources"><article><h3>Before</h3><p className="change">Context · docs are authoritative</p><pre>Reconcile discrepancies at their source.</pre></article><article><h3>After</h3><p className="change">Added · durable knowledge and transient plans</p><pre>After every slice, reconcile learning and design
into durable product docs before accepting it.</pre></article></div></section>
    <section aria-label="Ask about this change"><h2>Ask about this change</h2><Composer key={generation} onAsk={text => setQuestions(previous => [...previous, text])} />
    <p>Recorded intents: <span data-count>{questions.length}</span></p><button onClick={() => setGeneration(value => value + 1)}>Remount diagnostic</button></section>
    <aside>This is a React control experiment. No CLI delivery or persisted product reply is represented by this screen.</aside>
  </main>;
};
const css = document.createElement('style');css.textContent = `
:root{font-family:Inter,system-ui,sans-serif;color:#202020;background:#f5f5f5;font-size:16px;line-height:1.5}*{box-sizing:border-box}body{margin:0}main{max-width:68rem;margin:auto;padding:1.5rem}header,section{margin-bottom:1.5rem}h1{font-size:1.5rem;margin:0}h2{font-size:1.125rem;margin:0 0 .5rem}h3{font-size:.875rem;margin:0 0 .5rem}p,label,button,textarea{font-size:.875rem;line-height:1.25rem}p{margin:.5rem 0;color:#505050}.sources{display:grid;grid-template-columns:1fr 1fr;gap:1rem}article{min-width:0;border-top:1px solid #c8c8c8;padding-top:.5rem}pre{font: .8125rem/1.25rem ui-monospace,monospace;white-space:pre-wrap;overflow-wrap:anywhere;margin:.5rem 0}.change{font-weight:600}label{display:block;margin-bottom:.25rem}textarea{display:block;width:100%;padding:.5rem;border:1px solid #888;border-radius:.25rem;background:white;color:inherit;font-family:inherit}button{margin-top:.5rem;min-height:2rem;padding:.3125rem .5rem;border:1px solid #666;border-radius:.25rem;background:#fff;color:inherit;cursor:pointer}button:disabled{color:#777;cursor:default}button:focus-visible,textarea:focus-visible{outline:2px solid #333;outline-offset:3px}aside{font-size:.8125rem;color:#666;border-top:1px solid #ccc;padding-top:1rem}@media(max-width:40rem){main{padding:1rem}.sources{grid-template-columns:1fr}button{min-height:2.75rem}textarea{font-size:1rem}}
`;document.head.append(css);
const element = document.getElementById('root');if (!element) throw new Error('Missing diagnostic root');
createRoot(element).render(<Fixture />);
