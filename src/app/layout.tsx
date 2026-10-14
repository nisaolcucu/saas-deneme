import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'blogüret | Çok Şirketli İçerik Otomasyonu Platformu',
  description: 'Şirketlerin marka profillerine, anahtar kelimelerine ve kaynaklarına göre yapay zeka destekli blog üreten çok kiracılı SaaS platformu.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr" className="h-full">
      <body className="min-h-full flex flex-col bg-[#F8FAFC] text-slate-900 antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
