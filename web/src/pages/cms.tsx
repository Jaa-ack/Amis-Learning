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
    // 驗證必填欄位
    if (!lemma || !selectedDialect) {
      setMessage('❌ 請填寫單字和選擇語別');
      return;
    }

    // 驗證單字格式（不能只有空白）
    const trimmedLemma = lemma.trim();
    if (!trimmedLemma) {
      setMessage('❌ 單字不能為空白');
      return;
    }

    // 驗證單字長度
    if (trimmedLemma.length > 100) {
      setMessage('❌ 單字長度不能超過 100 個字元');
      return;
    }

    setLoading(true);
    try {
      await api.post('/cms/flashcards', {
        dialectId: selectedDialect,
        lemma: trimmedLemma,
        meaning: meaning.trim() || undefined,
        tags: tags ? tags.split(',').map((t) => t.trim()).filter(t => t) : [],
      });
      setMessage('✅ 單字新增成功！');
      setLemma('');
      setMeaning('');
      setTags('');
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || error.message;
      // 針對不同錯誤給予明確提示
      if (errorMsg.includes('Duplicate') || errorMsg.includes('duplicate') || error.response?.status === 409) {
        setMessage(`❌ 此單字「${trimmedLemma}」已存在於該語別中，請勿重複新增`);
      } else if (error.response?.status === 400) {
        setMessage(`❌ 輸入格式錯誤: ${errorMsg}`);
      } else if (error.response?.status === 500) {
        setMessage('❌ 伺服器錯誤，請稍後再試或聯繫管理員');
      } else {
        setMessage(`❌ 新增失敗: ${errorMsg}`);
      }
      console.error('CMS add card error:', error.response?.data);
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(''), 5000);
    }
  };

  const addSentence = async () => {
    // 驗證必填欄位
    if (!text || !sentenceDialect) {
      setMessage('❌ 請填寫例句和選擇語別');
      return;
    }

    // 驗證例句格式
    const trimmedText = text.trim();
    if (!trimmedText) {
      setMessage('❌ 例句不能為空白');
      return;
    }

    // 驗證例句長度
    if (trimmedText.length > 500) {
      setMessage('❌ 例句長度不能超過 500 個字元');
      return;
    }

    setLoading(true);
    try {
      await api.post('/cms/sentences', {
        dialectId: sentenceDialect,
        text: trimmedText,
        translation: translation.trim() || undefined,
      });
      setMessage('✅ 例句新增成功！');
      setText('');
      setTranslation('');
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || error.message;
      if (error.response?.status === 400) {
        setMessage(`❌ 輸入格式錯誤: ${errorMsg}`);
      } else if (error.response?.status === 500) {
        setMessage('❌ 伺服器錯誤，請稍後再試或聯繫管理員');
      } else {
        setMessage(`❌ 新增失敗: ${errorMsg}`);
      }
      console.error('CMS add sentence error:', error.response?.data);
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(''), 5000);
    }
  };

  return (
    <MobileLayout>
      <main className="px-3 py-3 sm:px-4 sm:py-4 space-y-4 pb-20">
        <header className="space-y-1">
          <p className="text-xs sm:text-sm text-text-muted">Amis Learning</p>
          <h1 className="text-lg sm:text-2xl font-bold text-text break-words">內容管理系統 (CMS)</h1>
        </header>

        {message && (
          <div
            className={`rounded-lg border px-4 py-3 text-xs sm:text-sm ${
              message.startsWith('✅')
                ? 'bg-green-50 border-green-200 text-green-800'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}
          >
            {message}
          </div>
        )}

        <section className="rounded-xl bg-surface shadow-surface p-3 sm:p-4 space-y-3 border border-gray-100">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-text">新增單字 (Flashcard)</h3>
              <p className="text-xs text-text-muted">填好阿美語、中文與標籤</p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs text-text-muted">語別</label>
              <select
                value={selectedDialect}
                onChange={(e) => setSelectedDialect(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs sm:text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/40"
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
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs sm:text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/40"
                autoComplete="off"
                spellCheck="false"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-text-muted">中文意思</label>
              <input
                value={meaning}
                onChange={(e) => setMeaning(e.target.value)}
                placeholder="例：說"
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs sm:text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-text-muted">標籤（逗號分隔）</label>
              <input
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="例：動詞,常用"
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs sm:text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={addCard}
              disabled={loading}
              className={`rounded-lg px-3 py-2 text-xs sm:text-sm font-semibold text-white transition active:animate-press ${
                loading ? 'bg-primary/60 cursor-not-allowed' : 'bg-primary hover:-translate-y-0.5'
              }`}
            >
              {loading ? '新增中...' : '新增單字'}
            </button>
          </div>
        </section>

        <section className="rounded-xl bg-surface shadow-surface p-3 sm:p-4 space-y-3 border border-gray-100">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-text">新增例句 (Sentence)</h3>
              <p className="text-xs text-text-muted">填寫阿美語例句與中文翻譯</p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs text-text-muted">語別</label>
              <select
                value={sentenceDialect}
                onChange={(e) => setSentenceDialect(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs sm:text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                {dialects.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-text-muted">例句 (阿美語)*</label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="例：Kako kiso?"
                rows={2}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs sm:text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/40"
                autoComplete="off"
                spellCheck="false"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-text-muted">中文翻譯</label>
              <input
                value={translation}
                onChange={(e) => setTranslation(e.target.value)}
                placeholder="例：你在說什麼？"
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs sm:text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={addSentence}
              disabled={loading}
              className={`rounded-lg px-3 py-2 text-xs sm:text-sm font-semibold text-white transition active:animate-press ${
                loading ? 'bg-secondary/60 cursor-not-allowed' : 'bg-secondary hover:-translate-y-0.5'
              }`}
            >
              {loading ? '新增中...' : '新增例句'}
            </button>
          </div>
        </section>

        {/* 使用說明 */}
        <section className="rounded-xl bg-blue-50 border border-blue-200 p-3 sm:p-4 space-y-2">
          <h3 className="text-xs sm:text-sm font-semibold text-blue-900">💡 使用說明</h3>
          <ul className="text-xs text-blue-800 space-y-1 list-disc list-inside break-words">
            <li><strong>單字長度限制：</strong>最多 100 個字元</li>
            <li><strong>例句長度限制：</strong>最多 500 個字元</li>
            <li><strong>重複檢查：</strong>系統會自動檢查同一語別中是否已存在相同單字</li>
            <li><strong>自動清理：</strong>輸入的前後空白會被自動移除</li>
            <li><strong>錯誤提示：</strong>新增失敗時會顯示具體原因，請依提示修正後重試</li>
          </ul>
        </section>
      </main>
    </MobileLayout>
  );
}
