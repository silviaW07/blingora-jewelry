'use client';

import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import GRoud404SVG from '@/assets/GRoud404SVG.svg';

export default function Error({
  error,
  reset
}: {
  error: Error & {
    digest?: string;
  };
  reset: () => void;
}) {
  const router = useRouter();

  const handleTargetHome = () => {
    router.replace('/');
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#f5f5f5',
      height: '100vh',
      width: '100vw'
    }}>
      <div className="flex flex-col gap-2 items-center justify-center">
        <div className="relative w-full max-w-[600px] aspect-[4/3]">
          <Image 
            src={GRoud404SVG} 
            alt="Error illustration" 
            fill 
            className="object-contain" 
            sizes="(max-width: 768px) 100vw, 600px"
          />
        </div>
        <p className="text-[56px] font-bold">Oops!</p>
        <p className="text-[14px] text-gray-600">Something went wrong</p>
        <div className="flex gap-4 mt-8">
          <Button
            className="w-[140px] !text-[#fff] !bg-[#ff4e4f] hover:opacity-85"
            onClick={() => reset()}
          >
            Try Again
          </Button>
          <Button
            className="w-[140px] !text-[#fff] !bg-[#02160F] hover:opacity-85"
            onClick={handleTargetHome}
          >
            Back Home
          </Button>
        </div>
      </div>
    </div>
  );
}
