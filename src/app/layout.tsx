import type { Metadata, Viewport } from 'next';
import '@/styles/globals.css';
import Navbar from '@/components/Navbar/Navbar';
import I18nProvider from '@/components/I18nProvider';
import ThemeProvider from '@/components/ThemeProvider';
import { ToastProvider } from '@/components/ui/Toast/Toast';
import ServiceWorkerRegistrar from '@/components/ServiceWorkerRegistrar';

export const metadata: Metadata = {
  title: 'DifferenziaComiso',
  description: 'Raccolta differenziata porta a porta per il Comune di Comiso',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'DifferenziaComiso',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#2E7D32',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="it">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192x192.svg" />
        <link rel="icon" href="/icons/icon.svg" type="image/svg+xml" />
        {/* Prevent flash of wrong theme: read localStorage before React hydrates */}
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var t=localStorage.getItem('theme');if(t==='dark'||t==='light')document.documentElement.setAttribute('data-theme',t);}catch(e){}})();` }} />
      </head>
      <body>
        <ThemeProvider>
        <I18nProvider>
          <ToastProvider>
            <div className="appShell">
              <main className="pageContent">
                {children}
              </main>
              <Navbar />
            </div>
            <ServiceWorkerRegistrar />
          </ToastProvider>
        </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
