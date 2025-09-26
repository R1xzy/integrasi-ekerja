import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Ulasan | eKerja',
  description: 'Kelola ulasan dan review layanan',
};

export default function ReviewsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}