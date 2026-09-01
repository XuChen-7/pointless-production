import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '请勿停止生产｜第零号无用产品制造机',
  description: '操作一台没有用途的机器，制造没有用途的东西。',
  openGraph: {
    title: '请勿停止生产',
    description: '本设备没有用途。请保持运行。',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: '请勿停止生产',
    description: '本设备没有用途。请保持运行。',
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-CN"><body>{children}</body></html>;
}
