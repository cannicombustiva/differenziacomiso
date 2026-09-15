import type { Metadata, Viewport } from 'next';
import '@differenzia/ui/tokens.css';
import I18nProvider from '@differenzia/core/i18n-provider';
import { ToastProvider } from '@differenzia/ui/toast';
import ServiceWorkerRegistrar from '@differenzia/ui/service-worker-registrar';
import AdminShell from '@/components/AdminShell/AdminShell';
import itMessages from '@/i18n/it.json';
import enMessages from '@/i18n/en.json';

export const metadata: Metadata = {
  title: 'DifferenziaComiso · Admin',
  // The Admin panel moved off the Citizen domain so it is not discoverable
  // (ADR 0005); keep search engines from undoing that.
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#1B3A1E',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <head>
        <link rel="icon" href="/icons/icon.svg" type="image/svg+xml" />
      </head>
      <body>
        <I18nProvider messages={{ it: itMessages, en: enMessages }}>
          <ToastProvider>
            <AdminShell>{children}</AdminShell>
            <ServiceWorkerRegistrar />
          </ToastProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
