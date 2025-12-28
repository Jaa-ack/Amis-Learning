import { useState } from 'react';

export function Card({ front, back, onFlip }: { front: React.ReactNode; back: React.ReactNode; onFlip?: () => void }) {
  const [flipped, setFlipped] = useState(false);
  return (
    <div style={{
      height: 240,
      borderRadius: 16,
      background: '#fff',
      boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 28, userSelect: 'none'
    }} onClick={() => { setFlipped(!flipped); onFlip?.(); }}>
      {flipped ? back : front}
    </div>
  );
}
