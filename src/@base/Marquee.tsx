'use client';
import React, { useRef, useEffect } from 'react';

interface MarqueeProps {
  children: React.ReactNode;
  speed?: number; // 滚动速度，单位为秒，默认 10s
  direction?: 'left' | 'right';
  className?: string;
  play?: boolean;
  pauseOnHover?: boolean;
  autoFill?: boolean;
}

const Marquee: React.FC<MarqueeProps> = ({
  children,
  speed = 10,
  direction = 'left',
  className = '',
  play = true,
  pauseOnHover = false,
  autoFill = false,
}) => {
  const marqueeRef = useRef<HTMLDivElement>(null);

  return (
    <div className={`overflow-hidden ${className}`}>
      <div
        ref={marqueeRef}
        className="flex flex-row flex-nowrap"
        style={{
          animation: `${direction === 'left' ? 'scrollLeft' : 'scrollRight'} ${speed}s linear infinite`,
          animationPlayState: play ? 'running' : 'paused',
        }}
      >
        <div className="flex-shrink-0 flex">{children}</div>
        <div className="flex-shrink-0 flex">{children}</div>
      </div>

    </div>
  );
};
export default Marquee
