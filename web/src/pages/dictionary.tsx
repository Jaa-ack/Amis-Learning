import { useState } from 'react';
import { api } from '@/lib/api';

export default function Dictionary() {
  const [q, setQ] = useState('');
  const [items, setItems] = useState<any[]>([]);
  const search = async () => {
    const res = await api.get('/dictionary/search', { params: { q } });
    setItems(res.data.items);
  };
  return (
    <main style={{ padding: 16 }}>
      <h2>Dictionary</h2>
      <input value={q} onChange={e => setQ(e.target.value)} placeholder="search" style={{ fontSize: 20, padding: 10, width: '100%' }} />
      <button onClick={search} style={{ padding: 12, marginTop: 12 }}>Search</button>
      <ul>
        {items.map((it: any) => <li key={it.id}>{it.lemma} — {it.meaning}</li>)}
      </ul>
    </main>
  );
}
