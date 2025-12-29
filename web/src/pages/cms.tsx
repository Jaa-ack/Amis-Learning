import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

interface Dialect {
  id: string;
  code: string;
  name: string;
}

export default function CMS() {
  const [dialects, setDialects] = useState<Dialect[]>([]);
  
  // Flashcard 表單
  const [selectedDialect, setSelectedDialect] = useState('');
  const [lemma, setLemma] = useState('');
  const [meaning, setMeaning] = useState('');
  const [tags, setTags] = useState('');

  // Sentence 表單
  const [sentenceDialect, setSentenceDialect] = useState('');
  const [text, setText] = useState('');
  const [translation, setTranslation] = useState('');

  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadDialects();
  }, []);

  const loadDialects = async () => {
    try {
      const res = await api.get('/dashboard/dialects');
      const dialectData = res.data.dialects || [];
      setDialects(dialectData);
      // 使用已選擇的語系，或第一個語系
      const saved = localStorage.getItem('selectedDialectId');
      const toUse = saved && dialectData.find((d: Dialect) => d.id === saved) ? saved : (dialectData.length > 0 ? dialectData[0].id : '');
      setSelectedDialect(toUse);
      setSentenceDialect(toUse);
    } catch (error) {
      console.error('Failed to load dialects:', error);
    }
  };

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
        meaning,
        tags: tags ? tags.split(',').map(t => t.trim()) : [],
      });
      setMessage('✅ 單字新增成功！');
      setLemma('');
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
      });
      setMessage('✅ 例句新增成功！');
      setText('');
      setTranslation('');
    } catch (error: any) {
      setMessage(`❌ 新增失敗: ${error.response?.data?.error || error.message}`);
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(''), 3000);
    }
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
            placeholder="例：動詞,常用"
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
