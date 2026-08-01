import GRoud404SVG from '../assets/GRoud404SVG.svg'
import { useEffect, useRef } from 'react';
import { useNavigate } from "react-router-dom";

const NotFound = () => {
    const navigator = useNavigate();
    const timer = useRef<NodeJS.Timeout | null>(null);
    useEffect(() => {
   
        return () => {
            if(timer.current)
            clearTimeout(timer.current);
        };
    }, []);

    const handleTargetHome = () => {
        navigator("/")
    }
    return (
        <div className="flex flex-col gap-2 items-center left-2/4 top-2/4 absolute justify-center w-screen h-screen opacity-0 notFound  transition-opacity duration-300" style={{
            transform:'translate(-50%, -50%)',
            fontFamily:"'DINCondensedBold', sans-serif"
        }}>
            <div className="relative w-full max-w-[600px] aspect-[4/3] ">
                <img 
                    src={GRoud404SVG} 
                    alt="404 illustration" 
                    className="w-full h-full object-contain"
                    onLoad={() => {
                        const target = document.querySelector('.notFound') as HTMLElement;
                        if(target){
                            target.style.opacity = '1';
                        }
                        timer.current = setTimeout(() => {
                            handleTargetHome();
                        }, 3000);
                    }}
                />
            </div>
            <p className='text-[56px] font-bold'>404</p>
            <p className='text-[14px]'>Automatically redirect to demo homepage after 3 secounds</p>
            <button 
                className='cursor-pointer pointer-events-auto mt-4 px-4 py-2 text-white border border-[#02160F] bg-[#02160F] hover:opacity-85 rounded'
                onClick={handleTargetHome}
            >
                Back to Demo Homepage
            </button>
        </div>
    );
};

export default NotFound;
