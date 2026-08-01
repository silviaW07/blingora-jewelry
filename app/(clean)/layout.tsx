'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import "./theme-layout.css"
import "./theme-style.css"

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter()

  return (
    <>
      <button
        onClick={() => router.back()}
        className="fixed top-4 left-4 z-[9999] p-2 rounded-full bg-white/60 backdrop-blur-sm shadow-sm hover:bg-white/80 transition-all"
      >
        <ArrowLeft className="w-6 h-6 text-gray-800 drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)]" />
      </button>
      <main className="min-h-[calc(100vh-4rem)]">
        {children}
      </main>
    </>
  );
}

