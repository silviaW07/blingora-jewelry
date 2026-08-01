'use client'
import { useRouter } from 'next/navigation'
import {  useRef } from 'react'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import GRoud404SVG from '@/assets/GRoud404SVG.svg'
export default function RootNotFound() {
  const router = useRouter()
  const timer = useRef<NodeJS.Timeout | null>(null)

  const handleTargetHome = () => {
    router.replace('/')
  }
 
  return (
    <div className='w-screen h-screen flex items-center justify-center relative bg-white'>
      <div
        className="flex flex-col gap-2 items-center left-2/4 top-2/4 justify-center w-screen h-screen  absolute rootNotFound transition-opacity duration-300 opacity-0"
        style={{ transform: 'translate(-50%, -50%)' }}
      >
        <div className="relative w-full max-w-[600px] h-[400px] md:h-[500px] lg:h-[600px]">
          <Image
            src={GRoud404SVG}
            alt="404 illustration"
            fill
            className="object-contain"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 600px"
            onLoad={() => {
              if(typeof window !== 'undefined') {
              const target = document.querySelector('.rootNotFound') as HTMLElement;
              if (target) {
                target.style.opacity = '1';
              }
              timer.current = setTimeout(() => {
                handleTargetHome();
                if (timer.current) {
                  clearTimeout(timer.current);
                }
              }, 5000);
              }
            }}
          />
        </div>
        <p className="text-[56px] font-bold">404</p>
        <p className="text-[14px]">The page you're looking for doesn't exist</p>
        <Button
          className="cursor-pointer pointer-events-auto mt-4 text-[#fff] !border-[#02160F] !bg-[#02160F] hover:!border-[#02160F] hover:!text-[#fff] focus:!outline-none focus:!border-[#02160F] hover:opacity-85"
          onClick={handleTargetHome}
        >
          Back to Homepage
        </Button>
      </div>
    </div>
  )
}
