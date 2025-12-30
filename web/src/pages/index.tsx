'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import MobileLayout from '@/components/MobileLayout';

interface Dialect {
  id: string;
  code: string;
  name: string;
}

export default function Home() {
  const [dialects, setDialects] = useState<Dialect[]>([]);
  const [selectedDialectId, setSelectedDialectId] = useState<string>('');

  useEffect(() => {
    const loadDialects = async () => {
      try {
        const res = await api.get('/dashboard/dialects');
        console.log('[Home] API response:', res.data);
        const rawData = res.data.data || res.data.dialects || [];
        const dialectList: Dialect[] = rawData.map((d: any) => ({
          id: d.dialect_id || d.id,
          code: d.code || '',
          name: d.name,
        }));
        console.log('[Home] Parsed dialects:', dialectList);
        setDialects(dialectList);
        const saved = localStorage.getItem('selectedDialectId');
        if (saved && dialectList.find((d: Dialect) => d.id === saved)) {
          setSelectedDialectId(saved);
        } else if (dialectList.length > 0) {
          setSelectedDialectId(dialectList[0].id);
        }
      } catch (error: any) {
        console.error('Failed to load dialects:', error);
        console.error('Error details:', error.response?.data);
      }
    };
    loadDialects();
  }, []);

  const handleDialectChange = (dialectId: string) => {
    setSelectedDialectId(dialectId);
    localStorage.setItem('selectedDialectId', dialectId);
  };

  return (
    <MobileLayout>
      <main className="px-4 py-5 space-y-5">
        <header className="space-y-1">
          <p className="text-sm text-text-muted">Amis Learning</p>
          <h1 className="text-2xl font-bold text-text">選擇你的語別，開始學習</h1>
        </header>

        <section className="rounded-xl bg-surface shadow-surface p-4 space-y-3">
          <div className="text-sm font-semibold text-text">選擇語別</div>
          <select
            value={selectedDialectId}
            onChange={(e) => handleDialectChange(e.target.value)}
            className="w-full max-w-md rounded-lg border border-gray-200 bg-white px-3 py-2 text-base text-text focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            <option value="">-- 請選擇語別 --</option>
            {dialects.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
          {selectedDialectId && (
            <div className="text-sm text-text-muted">
              已選擇：
              <span className="font-semibold text-text">
                {dialects.find((d) => d.id === selectedDialectId)?.name}
              </span>
            </div>
          )}
        </section>

        <section className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {[
            { href: '/study', label: '學習模式' },
            { href: '/test', label: '測驗模式' },
            { href: '/dictionary', label: '字典管理' },
            { href: '/cms', label: '內容新增' },
            { href: '/dashboard', label: '學習儀表板' },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg bg-surface shadow-surface px-3 py-4 text-center text-sm font-semibold text-text hover:-translate-y-0.5 hover:shadow-lg transition"
            >
              {item.label}
            </Link>
          ))}
        </section>
      </main>
    </MobileLayout>
  );
}
