import { useState } from 'react';
import { api } from '@/lib/api';

export default function CMS() {
  const [lemma, setLemma] = useState('');
  const [meaning, setMeaning] = useState('');
  const [text, setText] = useState('');
  const [translation, setTranslation] = useState('');
  const dialectId = 'demo-dialect';

  const addCard = async () => {
    await api.post('/cms/flashcards', { dialectId, lemma, meaning });
    setLemma(''); setMeaning('');
  };
  const addSentence = async () => {
    await api.post('/cms/sentences', { dialectId, text, translation });
    setText(''); setTranslation('');
  };

  return (
    <main style={{ padding: 16 }}>
      <h2>CMS</h2>
      <section>
        <h3>Add Flashcard</h3>
        <input value={lemma} onChange={e => setLemma(e.target.value)} placeholder="lemma" />
        <input value={meaning} onChange={e => setMeaning(e.target.value)} placeholder="meaning" />
        <button onClick={addCard}>Add</button>
      </section>
      <section>
        <h3>Add Sentence</h3>
        <textarea value={text} onChange={e => setText(e.target.value)} placeholder="sentence text" />
        <input value={translation} onChange={e => setTranslation(e.target.value)} placeholder="translation" />
        <button onClick={addSentence}>Add</button>
      </section>
    </main>
  );
}
