import { Playfair_Display, Manrope } from 'next/font/google';
import './globals.css';

const display = Playfair_Display({ subsets: ['latin', 'cyrillic'], weight: ['500','600','700'], variable: '--font-playfair' });
const sans    = Manrope({ subsets: ['latin', 'cyrillic'], weight: ['400','500','600','700'], variable: '--font-manrope' });

export const metadata = {
  title: 'Reelsboard — кабинет блогера',
  description: 'Аналитика Instagram Reels для команды',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ru" className={`${display.variable} ${sans.variable}`}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}