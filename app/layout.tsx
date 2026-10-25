import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '@/components/Navbar';
import { ToastProvider } from '@/components/ui/Toast';

export const metadata: Metadata = {
  title: 'ReliefLink | Emergency Relief Request Handling & Delivery',
  description: 'Clean, coordinated emergency aid request dispatch, inventory allocation, and verified courier delivery.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full bg-slate-50">
      <body className="h-full flex flex-col font-sans antialiased text-slate-900 bg-slate-50">
        <ToastProvider>
          <Navbar />
          <main className="flex-1">
            {children}
          </main>
          <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
            <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-700">ReliefLink Network</span>
                <span>•</span>
                <span>Real-Time Disaster Relief Dispatch</span>
              </div>
              <div className="flex items-center gap-4 text-slate-500">
                <span>Priority Queuing</span>
                <span>•</span>
                <span>Driver Rotation</span>
                <span>•</span>
                <span>Stock Integrity</span>
              </div>
            </div>
          </footer>
        </ToastProvider>
      </body>
    </html>
  );
}
