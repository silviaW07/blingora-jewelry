'use client'

interface RootLayoutProps {
  children: React.ReactNode
}
export default function FrontendLayout({ children }: RootLayoutProps) {
  return (
    <div>
      {children}
    </div>
  )
}
