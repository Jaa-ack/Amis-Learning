import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Card } from '@/components/Card';
import { BottomSheet } from '@/components/BottomSheet';

export default function Study() {
  const [items, setItems] = useState<any[]>([]);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    // demo userId
    api.get('/cards/next', { params: { userId: 'demo-user', limit: 10 } }).then(res => setItems(res.data.items));
  }, []);

  const item = items[current];

  const rate = async (score: number) => {
    if (!item) return;
    await api.post('/reviews', { userId: 'demo-user', flashcardId: item.id, mode: 'CHOICE', score });
    setCurrent(c => Math.min(c + 1, items.length - 1));
  };

  return (
    <main style={{ padding: 16 }}>
      <h2>Study</h2>
      {item && (
        <Card front={item.lemma} back={<>
          <div>{item.meaning}</div>
          <div style={{ fontSize: 16, opacity: 0.7 }}>{item.phonetic}</div>
        </>} />
      )}
      <BottomSheet>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
          {[1,2,3,4].map(s => (
            <button key={s} onClick={() => rate(s)} style={{ padding: 16, fontSize: 18, borderRadius: 12 }}>{s}</button>
          ))}
        </div>
      </BottomSheet>
    </main>
  );
}
