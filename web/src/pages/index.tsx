'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

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
        const dialectList = res.data.dialects || [];
        setDialects(dialectList);
        // 從 localStorage 恢復選擇，或使用第一個
        const saved = localStorage.getItem('selectedDialectId');
        if (saved && dialectList.find((d: Dialect) => d.id === saved)) {
          setSelectedDialectId(saved);
        } else if (dialectList.length > 0) {
          setSelectedDialectId(dialectList[0].id);
        }
      } catch (error) {
        console.error('Failed to load dialects:', error);
      }
    };
    loadDialects();
  }, []);

  const handleDialectChange = (dialectId: string) => {
    setSelectedDialectId(dialectId);
    localStorage.setItem('selectedDialectId', dialectId);
  };

  return (
    <main style={{ padding: 16 }}>
      <h1>Amis Learning</h1>
      
      {/* 語系選擇區 */}
      <section style={{ marginBottom: 24, padding: 12, backgroundColor: '#f5f5f5', borderRadius: 8 }}>
        <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>
          選擇語別 (Select Dialect):
        </label>
        <select
          value={selectedDialectId}
          onChange={(e) => handleDialectChange(e.target.value)}
          style={{
            padding: 8,
            fontSize: 16,
            borderRadius: 4,
            border: '1px solid #ccc',
            width: '100%',
            maxWidth: 300,
          }}
        >
          <option value="">-- 請選擇語別 --</option>
          {dialects.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
        {selectedDialectId && (
          <p style={{ marginTop: 8, color: '#666' }}>
            已選擇: <strong>{dialects.find((d) => d.id === selectedDialectId)?.name}</strong>
          </p>
        )}
      </section>

      {/* 導航區 */}
      <nav style={{ display: 'grid', gap: 12 }}>
        <Link href="/study">Study</Link>
        <Link href="/test">Test</Link>
        <Link href="/dictionary">Dictionary</Link>
        <Link href="/cms">CMS</Link>
        <Link href="/dashboard">Dashboard</Link>
      </nav>
    </main>
  );
}
