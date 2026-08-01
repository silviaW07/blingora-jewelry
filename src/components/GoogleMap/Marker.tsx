'use client';

import { AdvancedMarker, Pin } from '@vis.gl/react-google-maps';
import { MapPosition } from './Map';
export interface MarkerProps {
  /** 标记位置 */
  position: MapPosition;
  /** 标题 */
  title?: string;
  /** 点击回调 */
  onClick?: () => void;
  /** 自定义图标颜色 */
  pinColor?: string;
  /** 自定义图标背景色 */
  pinBackground?: string;
  /** 自定义图标边框色 */
  pinBorderColor?: string;
  /** 图标缩放比例 */
  pinScale?: number;
  /** 是否可拖拽 */
  draggable?: boolean;
  /** 拖拽结束回调 */
  onDragEnd?: (position: MapPosition) => void;
  /** 自定义内容 */
  children?: React.ReactNode;
}

/**
 * 地图标记组件
 */
export function Marker({
  position,
  title,
  onClick,
  pinColor,
  pinBackground,
  pinBorderColor,
  pinScale,
  draggable = false,
  onDragEnd,
  children
}: MarkerProps) {
  const handleDragEnd = (event: any) => {
    if (onDragEnd && event.latLng) {
      onDragEnd({
        lat: event.latLng.lat(),
        lng: event.latLng.lng()
      });
    }
  };
  return <AdvancedMarker position={position} title={title} onClick={onClick} draggable={draggable} onDragEnd={handleDragEnd}>
      {children || <Pin background={pinBackground} borderColor={pinBorderColor} glyphColor={pinColor} scale={pinScale} />}
    </AdvancedMarker>;
}
