'use client';

import { APIProvider } from '@vis.gl/react-google-maps';
import { ReactNode } from 'react';
interface GoogleMapProviderProps {
  children: ReactNode;
  apiKey?: string;
}

/**
 * 谷歌地图 Provider
 * 包裹需要使用地图的组件
 */
export function GoogleMapProvider({
  children,
  apiKey
}: GoogleMapProviderProps) {
  const key = apiKey || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
  if (!key) {
    console.warn('⚠️ Google Maps API Key 未配置');
    return <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-yellow-800">
          ⚠️ Google Maps API Key 未配置，请在 .env.local 中添加 NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
        </p>
      </div>;
  }
  return <APIProvider apiKey={key}>{children}</APIProvider>;
}
