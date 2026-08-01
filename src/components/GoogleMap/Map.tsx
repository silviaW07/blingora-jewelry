'use client';

import { Map as GoogleMap, MapCameraChangedEvent } from '@vis.gl/react-google-maps';
import { CSSProperties } from 'react';
export interface MapPosition {
  lat: number;
  lng: number;
}
export interface MapProps {
  /** 地图中心位置 */
  center?: MapPosition;
  /** 缩放级别 (1-20) */
  zoom?: number;
  /** 地图类型 */
  mapTypeId?: 'roadmap' | 'satellite' | 'hybrid' | 'terrain';
  /** 自定义样式 */
  style?: CSSProperties;
  /** 类名 */
  className?: string;
  /** 是否可拖拽 */
  draggable?: boolean;
  /** 是否显示缩放控件 */
  zoomControl?: boolean;
  /** 是否显示街景控件 */
  streetViewControl?: boolean;
  /** 是否显示地图类型控件 */
  mapTypeControl?: boolean;
  /** 是否显示全屏控件 */
  fullscreenControl?: boolean;
  /** 地图 ID（用于高级样式） */
  mapId?: string;
  /** 相机变化回调 */
  onCameraChanged?: (ev: MapCameraChangedEvent) => void;
  /** 子元素（Marker、Polygon 等） */
  children?: React.ReactNode;
}

/**
 * 基础谷歌地图组件
 */
export function Map({
  center = {
    lat: 39.9042,
    lng: 116.4074
  },
  // 默认北京
  zoom = 12,
  mapTypeId = 'roadmap',
  style,
  className,
  draggable = true,
  zoomControl = true,
  streetViewControl = false,
  mapTypeControl = false,
  fullscreenControl = false,
  mapId,
  onCameraChanged,
  children
}: MapProps) {
  const defaultStyle: CSSProperties = {
    width: '100%',
    height: '400px',
    ...style
  };
  return <div className={className} style={defaultStyle}>
      <GoogleMap center={center} zoom={zoom} mapTypeId={mapTypeId} gestureHandling={draggable ? 'greedy' : 'none'} disableDefaultUI={false} zoomControl={zoomControl} streetViewControl={streetViewControl} mapTypeControl={mapTypeControl} fullscreenControl={fullscreenControl} mapId={mapId} onCameraChanged={onCameraChanged}>
        {children}
      </GoogleMap>
    </div>;
}
