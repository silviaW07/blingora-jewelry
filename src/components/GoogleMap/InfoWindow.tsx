'use client';

import { InfoWindow as GoogleInfoWindow } from '@vis.gl/react-google-maps';
import { MapPosition } from './Map';
export interface InfoWindowProps {
  /** 信息窗口位置 */
  position: MapPosition;
  /** 关闭回调 */
  onClose?: () => void;
  /** 内容 */
  children: React.ReactNode;
  /** 最大宽度 */
  maxWidth?: number;
  /** 像素偏移 */
  pixelOffset?: [number, number];
  /** 是否禁用自动平移 */
  disableAutoPan?: boolean;
}

/**
 * 地图信息窗口组件
 */
export function InfoWindow({
  position,
  onClose,
  children,
  maxWidth,
  pixelOffset,
  disableAutoPan = false
}: InfoWindowProps) {
  return <GoogleInfoWindow position={position} onClose={onClose} maxWidth={maxWidth} pixelOffset={pixelOffset} disableAutoPan={disableAutoPan}>
      <div className="p-2">{children}</div>
    </GoogleInfoWindow>;
}
