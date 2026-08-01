'use client';

import { useState } from 'react';
import { GoogleMapProvider, Map, Marker, InfoWindow, MapPosition } from './index';

/**
 * 谷歌地图使用示例
 */
export function GoogleMapExample() {
  const [selectedMarker, setSelectedMarker] = useState<number | null>(null);
  const [markerPosition, setMarkerPosition] = useState<MapPosition>({
    lat: 39.9042,
    lng: 116.4074
  });

  // 示例标记点
  const markers = [{
    id: 1,
    position: {
      lat: 39.9042,
      lng: 116.4074
    },
    title: '天安门',
    description: '中国北京市中心'
  }, {
    id: 2,
    position: {
      lat: 39.9163,
      lng: 116.3972
    },
    title: '故宫',
    description: '明清两代的皇宫'
  }, {
    id: 3,
    position: {
      lat: 39.8839,
      lng: 116.4033
    },
    title: '天坛',
    description: '明清帝王祭祀场所'
  }];
  return <div className="space-y-6">
      <h2 className="text-2xl font-bold">谷歌地图组件示例</h2>

      {/* 示例 1: 基础地图 */}
      <div className="space-y-2">
        <h3 className="text-xl font-semibold">1. 基础地图</h3>
        <GoogleMapProvider>
          <Map center={{
          lat: 39.9042,
          lng: 116.4074
        }} zoom={12} className="rounded-lg overflow-hidden border" style={{
          height: '400px'
        }} />
        </GoogleMapProvider>
      </div>

      {/* 示例 2: 带标记的地图 */}
      <div className="space-y-2">
        <h3 className="text-xl font-semibold">2. 带标记的地图</h3>
        <GoogleMapProvider>
          <Map center={{
          lat: 39.9042,
          lng: 116.4074
        }} zoom={13} className="rounded-lg overflow-hidden border" style={{
          height: '400px'
        }}>
            {markers.map((marker, index) => <Marker key={marker.id} position={marker.position} title={marker.title} onClick={() => setSelectedMarker(marker.id)} pinBackground="#EA4335" />)}

            {/* 信息窗口 */}
            {selectedMarker && <InfoWindow position={markers.find(m => m.id === selectedMarker)!.position} onClose={() => setSelectedMarker(null)}>
                <div className="min-w-[200px]">
                  <h4 className="font-semibold text-lg mb-1">
                    {markers.find(m => m.id === selectedMarker)!.title}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {markers.find(m => m.id === selectedMarker)!.description}
                  </p>
                </div>
              </InfoWindow>}
          </Map>
        </GoogleMapProvider>
      </div>

      {/* 示例 3: 可拖拽标记 */}
      <div className="space-y-2">
        <h3 className="text-xl font-semibold">3. 可拖拽标记</h3>
        <p className="text-sm text-gray-600">
          拖动标记到新位置，坐标会实时更新
        </p>
        <div className="mb-2 p-3 bg-gray-50 rounded border">
          <p className="text-sm">
            当前位置: {markerPosition.lat.toFixed(6)}, {markerPosition.lng.toFixed(6)}
          </p>
        </div>
        <GoogleMapProvider>
          <Map center={markerPosition} zoom={15} className="rounded-lg overflow-hidden border" style={{
          height: '400px'
        }}>
            <Marker position={markerPosition} title="拖动我" draggable onDragEnd={newPos => setMarkerPosition(newPos)} pinBackground="#34A853" />
          </Map>
        </GoogleMapProvider>
      </div>

      {/* 示例 4: 卫星地图 */}
      <div className="space-y-2">
        <h3 className="text-xl font-semibold">4. 卫星地图</h3>
        <GoogleMapProvider>
          <Map center={{
          lat: 39.9042,
          lng: 116.4074
        }} zoom={16} mapTypeId="satellite" className="rounded-lg overflow-hidden border" style={{
          height: '400px'
        }} mapTypeControl />
        </GoogleMapProvider>
      </div>
    </div>;
}
