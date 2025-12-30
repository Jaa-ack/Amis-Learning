import Link from 'next/link';
import { useRouter } from 'next/router';
import { BookOpen, PenTool, Search, LayoutDashboard, FileEdit } from 'lucide-react';
import React from 'react';

type TabItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
};

export default function MobileLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = router.pathname;

  const tabs: TabItem[] = [
    { href: '/study', label: '學習', icon: <BookOpen size={20} /> },
    { href: '/test', label: '測驗', icon: <PenTool size={20} /> },
    { href: '/dictionary', label: '字典', icon: <Search size={20} /> },
    { href: '/cms', label: 'CMS', icon: <FileEdit size={20} /> },
    { href: '/dashboard', label: '儀表板', icon: <LayoutDashboard size={20} /> },
  ];

  return (
    <div className="min-h-screen bg-background text-text">
      <div className="pb-20">{children}</div>
      <nav className="fixed bottom-0 left-0 right-0 bg-surface shadow-surface border-t border-gray-200">
        <div className="grid grid-cols-5">
          {tabs.map((t) => {
            const active = pathname === t.href;
            return (
              <Link key={t.href} href={t.href} className="flex flex-col items-center justify-center py-2">
                <div className={active ? 'text-primary' : 'text-text-muted'}>
                  {t.icon}
                </div>
                <div className={`text-xs ${active ? 'text-primary' : 'text-text-muted'}`}>{t.label}</div>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
