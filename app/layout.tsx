import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Web Calendar - Quản lý đặt lịch',
  description: 'Ứng dụng quản lý đặt lịch và tạo hóa đơn',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}