import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Authentication - DAOsail',
  description: 'Sign in or create an account to access DAOsail',
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {children}
    </div>
  );
}