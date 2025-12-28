import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

interface Dialect {
  id: string;
  code: string;
  name: string;
}

interface Flashcard {
  id: string;
  lemma: string;
  meaning: string | null;
  dialectId: string | null;
}

export default function CMS() {
  const [dialects, setDialects] = useState<Dialect[]>([]);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  
  // Flashcard 表單
  const [selectedDialect, setSelectedDialect] = useState('');
  const [lemma, setLemma] = useState('');
  const [phonetic, setPhonetic] = useState('');
  const [meaning, setMeaning] = useState('');
  const [tags, setTags] = useState('');

  // Sentence 表單
  const [sentenceDialect, setSentenceDialect] = useState('');
  const [text, setText] = useState('');
  const [translation, setTranslation] = useState('');
  const [linkedWords, setLinkedWords] = useState<string[]>([]);

  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadDialects();
  }, []);

  const loadDialects = async () => {
    try {
      const res = await api.get('/dashboard/dialects', { params: { userId: 'demo-user' } });
      const dialectData = res.data.data || [];
      setDialects(dialectData);
      if (dialectData.length > 0) {
        setSelectedDialect(dialectData[0].id);
        setSentenceDialect(dialectData[0].id);
      }
    } catch (error) {
      console.error('Failed to load dialects:', error);
    }
  };

  const loadFlashcards = async (dialectId: string) => {
    try {
      const res = await api.get('/dictionary/all', { params: { dialectId } });
      setFlashcards(res.data.items || []);
    } catch (error) {
      console.error('Failed to load flashcards:', error);
    }
  };

  useEffect(() => {
    if (sentenceDialect) {
      loadFlashcards(sentenceDialect);
    }
  }, [sentenceDialect]);

  const addCard = async () => {
    if (!lemma || !selectedDialect) {
      setMessage('❌ 請填寫單字和選擇語別');
      return;
    }

    setLoading(true);
    try {
      await api.post('/cms/flashcards', {
        dialectId: selectedDialect,
        lemma,
        phonetic: phonetic || undefined,
        meaning,
        tags: tags ? tags.split(',').map(t => t.trim()) : [],
      });
      setMessage('✅ 單字新增成功！');
      setLemma('');
      setPhonetic('');
      setMeaning('');
      setTags('');
    } catch (error: any) {
      setMessage(`❌ 新增失敗: ${error.response?.data?.error || error.message}`);
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const addSentence = async () => {
    if (!text || !sentenceDialect) {
      setMessage('❌ 請填寫例句和選擇語別');
      return;
    }

    setLoading(true);
    try {
      await api.post('/cms/sentences', {
        dialectId: sentenceDialect,
        text,
        translation: translation || undefined,
        linkedWordIds: linkedWords,
      });
      setMessage('✅ 例句新增成功！');
      setText('');
      setTranslation('');
      setLinkedWords([]);
    } catch (error: any) {
      setMessage(`❌ 新增失敗: ${error.response?.data?.error || error.message}`);
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const toggleLinkedWord = (wordId: string) => {
    setLinkedWords(prev =>
      prev.includes(wordId)
        ? prev.filter(id => id !== wordId)
        : [...prev, wordId]
    );
  };

  return (
    <main style={{ padding: 16, maxWidth: 1000, margin: '0 auto' }}>
      <h2>內容管理系統 (CMS)</h2>

      {message && (
        <div
          style={{
            padding: 12,
            marginBottom: 16,
            borderRadius: 4,
            backgroundColor: message.startsWith('✅') ? '#d4edda' : '#f8d7da',
            color: message.startsWith('✅') ? '#155724' : '#721c24',
            border: `1px solid ${message.startsWith('✅') ? '#c3e6cb' : '#f5c6cb'}`,
          }}
        >
          {message}
        </div>
      )}

      {/* 新增單字 */}
      <section style={{ marginBottom: 32, padding: 16, border: '1px solid #ddd', borderRadius: 4 }}>
        <h3>新增單字 (Flashcard)</h3>

        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>語別：</label>
          <select
            value={selectedDialect}
            onChange={e => setSelectedDialect(e.target.value)}
            style={{ width: '100%', padding: 8, fontSize: 14, borderRadius: 4, border: '1px solid #ccc' }}
          >
            {dialects.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>單字 (阿美語)：*</label>
          <input
            value={lemma}
            onChange={e => setLemma(e.target.value)}
            placeholder="例：kako"
            style={{ width: '100%', padding: 8, fontSize: 14, borderRadius: 4, border: '1px solid #ccc' }}
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>發音：</label>
          <input
            value={phonetic}
            onChange={e => setPhonetic(e.target.value)}
            placeholder="例：ka-ko"
            style={{ width: '100%', padding: 8, fontSize: 14, borderRadius: 4, border: '1px solid #ccc' }}
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>中文意思：</label>
          <input
            value={meaning}
            onChange={e => setMeaning(e.target.value)}
            placeholder="例：說"
            style={{ width: '100%', padding: 8, fontSize: 14, borderRadius: 4, border: '1px solid #ccc' }}
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>標籤（逗號分隔）：</label>
          <input
            value={tags}
            onChange={e => setTags(e.target.value)}
            placeholder="例：動詞, 常用"
            style={{ width: '100%', padding: 8, fontSize: 14, borderRadius: 4, border: '1px solid #ccc' }}
          />
        </div>

        <button
          onClick={addCard}
          disabled={loading}
          style={{
            padding: '10px 20px',
            fontSize: 16,
            backgroundColor: loading ? '#ccc' : '#1976d2',
            color: 'white',
            border: 'none',
            borderRadius: 4,
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? '新增中...' : '新增單字'}
        </button>
      </section>

      {/* 新增例句 */}
      <section style={{ marginBottom: 32, padding: 16, border: '1px solid #ddd', borderRadius: 4 }}>
        <h3>新增例句 (Sentence)</h3>

        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>語別：</label>
          <select
            value={sentenceDialect}
            onChange={e => setSentenceDialect(e.target.value)}
            style={{ width: '100%', padding: 8, fontSize: 14, borderRadius: 4, border: '1px solid #ccc' }}
          >
            {dialects.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>例句 (阿美語)：*</label>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="例：Kako kiso?"
            rows={3}
            style={{ width: '100%', padding: 8, fontSize: 14, borderRadius: 4, border: '1px solid #ccc' }}
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>中文翻譯：</label>
          <input
            value={translation}
            onChange={e => setTranslation(e.target.value)}
            placeholder="例：你在說什麼？"
            style={{ width: '100%', padding: 8, fontSize: 14, borderRadius: 4, border: '1px solid #ccc' }}
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>
            連結的單字（選擇此例句包含的單字）：
          </label>
          <div style={{ maxHeight: 200, overflowY: 'auto', border: '1px solid #ccc', borderRadius: 4, padding: 8 }}>
            {flashcards.length === 0 ? (
              <div style={{ color: '#666', textAlign: 'center', padding: 8 }}>此語別沒有單字</div>
            ) : (
              flashcards.map(card => (
                <label
                  key={card.id}
                  style={{
                    display: 'block',
                    padding: '4px 0',
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={linkedWords.includes(card.id)}
                    onChange={() => toggleLinkedWord(card.id)}
                    style={{ marginRight: 8 }}
                  />
                  {card.lemma} — {card.meaning || '（無意思）'}
                </label>
              ))
            )}
          </div>
          <div style={{ marginTop: 4, fontSize: 12, color: '#666' }}>
            已選擇 {linkedWords.length} 個單字
          </div>
        </div>

        <button
          onClick={addSentence}
          disabled={loading}
          style={{
            padding: '10px 20px',
            fontSize: 16,
            backgroundColor: loading ? '#ccc' : '#1976d2',
            color: 'white',
            border: 'none',
            borderRadius: 4,
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? '新增中...' : '新增例句'}
        </button>
      </section>
    </main>
  );
}
