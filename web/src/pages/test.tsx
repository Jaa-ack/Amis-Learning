import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export default function Test() {
  const [items, setItems] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    api.get('/cards/next', { params: { userId: 'demo-user', limit: 10 } }).then(res => setItems(res.data.items));
  }, []);

  const item = items[current];
  const submitSpell = async () => {
    if (!item) return;
    const similarity = similarityPercent(input, item.lemma);
    const score = similarity >= 100 ? 4 : similarity >= 85 ? 3 : similarity >= 70 ? 2 : 1;
    await api.post('/reviews', { userId: 'demo-user', flashcardId: item.id, mode: 'SPELL', score, similarity });
    setInput('');
    setCurrent(c => Math.min(c + 1, items.length - 1));
  };

  return (
    <main style={{ padding: 16 }}>
      <h2>Spell Test</h2>
      {item && <div style={{ fontSize: 28, marginBottom: 12 }}>{item.meaning}</div>}
      <input value={input} onChange={e => setInput(e.target.value)} placeholder="type spelling" style={{ fontSize: 24, padding: 12, width: '100%' }} />
      <button onClick={submitSpell} style={{ padding: 12, marginTop: 12 }}>Submit</button>
    </main>
  );
}

function similarityPercent(a: string, b: string) {
  const na = normalize(a);
  const nb = normalize(b);
  if (!na || !nb) return 0;
  const maxLen = Math.max(na.length, nb.length);
  let same = 0;
  for (let i = 0; i < Math.min(na.length, nb.length); i++) {
    if (na[i] === nb[i]) same++;
  }
  return Math.round((same / maxLen) * 100);
}
function normalize(s: string) {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}
