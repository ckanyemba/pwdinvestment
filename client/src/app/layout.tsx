import type { Metadata } from 'next';
import { Montserrat, Open_Sans } from 'next/font/google';
import './globals.css';

const montserrat = Montserrat({ variable: '--font-montserrat', subsets: ['latin'], weight: ['500', '600', '700'] });
const openSans = Open_Sans({ variable: '--font-open-sans', subsets: ['latin'] });

const SITE_URL = (process.env.SITE_URL || 'https://pmdinvestment.co.za').replace(/\/$/, '');

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: 'Pmd Investment Academy | Financial Markets Education', template: '%s | Pmd Investment Academy' },
  description:
    'Proudly black-owned financial markets and conferencing training institute in Johannesburg. Learn to trade Forex, shares, commodities and cryptocurrencies.',
  openGraph: { type: 'website', siteName: 'Pmd Investment Academy', locale: 'en_ZA', images: ['/logo.png'] },
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en-ZA" className={`${montserrat.variable} ${openSans.variable} h-full`}>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
