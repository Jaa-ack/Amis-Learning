import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import MobileLayout from '@/components/MobileLayout';

interface Dialect {
  id: string;
  code: string;
  name: string;
}

export default function CMS() {
  const [dialects, setDialects] = useState<Dialect[]>([]);

  const [selectedDialect, setSelectedDialect] = useState('');
  const [lemma, setLemma] = useState('');
  const [meaning, setMeaning] = useState('');
  const [tags, setTags] = useState('');

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
      const dialectData: Dialect[] = (res.data.data || []).map((d: any) => ({
        id: d.dialect_id ?? d.id,
        code: d.code ?? '',
        name: d.name,
      }));
      setDialects(dialectData);
      const saved = localStorage.getItem('selectedDialectId');
      const toUse = saved && dialectData.find((d: Dialect) => d.id === saved) ? saved : dialectData[0]?.id || '';
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
        tags: tags ? tags.split(',').map((t) => t.trim()) : [],
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
    <MobileLayout>
      <main className="px-4 py-4 space-y-4">
        <header className="space-y-1">
          <p className="text-sm text-text-muted">Amis Learning</p>
          <h1 className="text-2xl font-bold text-text">內容管理系統 (CMS)</h1>
        </header>

        {message && (
          <div
            className={`rounded-lg border px-4 py-3 text-sm ${
              message.startsWith('✅')
                ? 'bg-green-50 border-green-200 text-green-800'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}
          >
            {message}
          </div>
        )}

        <section className="rounded-xl bg-surface shadow-surface p-4 space-y-3 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-text">新增單字 (Flashcard)</h3>
              <p className="text-xs text-text-muted">填好阿美語、中文與標籤</p>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs text-text-muted">語別</label>
              <select
                value={selectedDialect}
                onChange={(e) => setSelectedDialect(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                {dialects.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-text-muted">單字 (阿美語)*</label>
              <input
                value={lemma}
                onChange={(e) => setLemma(e.target.value)}
                placeholder="例：kako"
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-text-muted">中文意思</label>
              <input
                value={meaning}
                onChange={(e) => setMeaning(e.target.value)}
                placeholder="例：說"
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-text-muted">標籤（逗號分隔）</label>
              <input
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="例：動詞,常用"
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={addCard}
              disabled={loading}
              className={`rounded-lg px-4 py-2 text-sm font-semibold text-white transition active:animate-press ${
                loading ? 'bg-primary/60 cursor-not-allowed' : 'bg-primary hover:-translate-y-0.5'
              }`}
            >
              {loading ? '新增中...' : '新增單字'}
            </button>
          </div>
        </section>

        <section className="rounded-xl bg-surface shadow-surface p-4 space-y-3 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-text">新增例句 (Sentence)</h3>
              <p className="text-xs text-text-muted">填寫阿美語例句與中文翻譯</p>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs text-text-muted">語別</label>
              <select
                value={sentenceDialect}
                onChange={(e) => setSentenceDialect(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                {dialects.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1 md:col-span-1">
              <label className="text-xs text-text-muted">例句 (阿美語)*</label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="例：Kako kiso?"
                rows={3}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            <div className="space-y-1 md:col-span-1">
              <label className="text-xs text-text-muted">中文翻譯</label>
              <input
                value={translation}
                onChange={(e) => setTranslation(e.target.value)}
                placeholder="例：你在說什麼？"
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={addSentence}
              disabled={loading}
              className={`rounded-lg px-4 py-2 text-sm font-semibold text-white transition active:animate-press ${
                loading ? 'bg-secondary/60 cursor-not-allowed' : 'bg-secondary hover:-translate-y-0.5'
              }`}
            >
              {loading ? '新增中...' : '新增例句'}
            </button>
          </div>
        </section>
      </main>
    </MobileLayout>
  );
}
