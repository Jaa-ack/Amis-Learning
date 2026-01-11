import type { AppProps } from 'next/app';
import Head from 'next/head';
import { useEffect } from 'react';
import './globals.css';

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    // 全域鍵盤快捷鍵處理
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // 按 Alt + ' 輸入 '
      if (e.altKey && e.key === "'") {
        e.preventDefault();
        const target = document.activeElement as HTMLInputElement | HTMLTextAreaElement;
        if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
          const start = target.selectionStart || 0;
          const end = target.selectionEnd || 0;
          const newValue = target.value.substring(0, start) + "'" + target.value.substring(end);
          target.value = newValue;
          target.selectionStart = target.selectionEnd = start + 1;
          // 觸發 onChange 事件
          target.dispatchEvent(new Event('input', { bubbles: true }));
        }
      }
      // 按 Alt + 6 輸入 ^
      if (e.altKey && e.key === '6') {
        e.preventDefault();
        const target = document.activeElement as HTMLInputElement | HTMLTextAreaElement;
        if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
          const start = target.selectionStart || 0;
          const end = target.selectionEnd || 0;
          const newValue = target.value.substring(0, start) + '^' + target.value.substring(end);
          target.value = newValue;
          target.selectionStart = target.selectionEnd = start + 1;
          // 觸發 onChange 事件
          target.dispatchEvent(new Event('input', { bubbles: true }));
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, []);

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="application-name" content="Amis Learning" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Amis Learning" />
        <meta name="description" content="學習阿美語的最佳工具" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#ffffff" />
        
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
      </Head>
      <Component {...pageProps} />
    </>
  );
}
