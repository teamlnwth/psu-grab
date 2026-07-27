'use client';

import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { LocationPoint } from '@/types/map';

interface LeafletMapInnerProps {
  pickup: LocationPoint | null;
  destination: LocationPoint | null;
  userGps: LocationPoint | null;
  selectionMode: 'pickup' | 'destination';
  onSelectLocation: (mode: 'pickup' | 'destination', point: LocationPoint) => void;
  center?: [number, number];
  zoom?: number;
}

// Custom Leaflet Icons using SVG divIcons
const createCustomIcon = (type: 'pickup' | 'destination' | 'user') => {
  let bgColor = '#00B14F'; // Green for pickup
  let label = 'จุดรับ';
  let iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>`;

  if (type === 'destination') {
    bgColor = '#EF4444'; // Red for destination
    label = 'จุดส่ง';
    iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>`;
  } else if (type === 'user') {
    bgColor = '#2563EB'; // Blue pulse for user GPS
    label = 'คุณอยู่ที่นี่';
    iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a10 10 0 0 0-10 10"/><circle cx="12" cy="12" r="3" fill="white"/></svg>`;
  }

  const html = `
    <div style="position: relative; display: flex; flex-direction: column; align-items: center;">
      <div style="
        background-color: ${bgColor};
        width: 38px;
        height: 38px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        border: 3px solid white;
        ${type === 'user' ? 'animation: pulse 2s infinite;' : ''}
      ">
        ${iconSvg}
      </div>
      <div style="
        background-color: #0f172a;
        color: white;
        font-size: 11px;
        font-weight: 700;
        padding: 2px 8px;
        border-radius: 12px;
        margin-top: 4px;
        white-space: nowrap;
        box-shadow: 0 2px 6px rgba(0,0,0,0.2);
        border: 1px solid rgba(255,255,255,0.2);
      ">
        ${label}
      </div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-leaflet-marker',
    iconSize: [40, 60],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40],
  });
};

// Component to adjust bounds dynamically
function MapAutoBounds({ pickup, destination, userGps }: { pickup: LocationPoint | null; destination: LocationPoint | null; userGps: LocationPoint | null }) {
  const map = useMap();

  useEffect(() => {
    const points: [number, number][] = [];
    if (pickup) points.push([pickup.lat, pickup.lng]);
    if (destination) points.push([destination.lat, destination.lng]);

    if (points.length === 2) {
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 17 });
    } else if (points.length === 1) {
      map.flyTo(points[0], 16, { animate: true, duration: 1 });
    } else if (userGps) {
      map.flyTo([userGps.lat, userGps.lng], 16, { animate: true });
    }
  }, [pickup, destination, userGps, map]);

  return null;
}

// Component to handle map clicks for pinning locations
function MapClickHandler({ selectionMode, onSelectLocation }: { selectionMode: 'pickup' | 'destination'; onSelectLocation: (mode: 'pickup' | 'destination', point: LocationPoint) => void }) {
  useMapEvents({
    click: (e) => {
      const lat = parseFloat(e.latlng.lat.toFixed(5));
      const lng = parseFloat(e.latlng.lng.toFixed(5));
      const point: LocationPoint = {
        lat,
        lng,
        name: `ตำแหน่งที่ปักหมุด (${lat}, ${lng})`,
      };
      onSelectLocation(selectionMode, point);
    },
  });
  return null;
}

export default function LeafletMapInner({
  pickup,
  destination,
  userGps,
  selectionMode,
  onSelectLocation,
  center = [7.0075, 100.4980], // Default PSU Hatyai Campus center
  zoom = 15,
}: LeafletMapInnerProps) {
  const pickupIcon = createCustomIcon('pickup');
  const destinationIcon = createCustomIcon('destination');
  const userIcon = createCustomIcon('user');

  const routePolyline: [number, number][] =
    pickup && destination ? [
      [pickup.lat, pickup.lng],
      [destination.lat, destination.lng],
    ] : [];

  return (
    <div className="w-full h-full relative rounded-3xl overflow-hidden border border-slate-200 shadow-md">
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={true}
        style={{ width: '100%', height: '100%', minHeight: '380px', zIndex: 1 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* User GPS Location Marker */}
        {userGps && (
          <Marker position={[userGps.lat, userGps.lng]} icon={userIcon}>
            <Popup>
              <div className="font-semibold text-slate-800 text-xs">
                📍 ตำแหน่งปัจจุบันของคุณ (GPS)
              </div>
            </Popup>
          </Marker>
        )}

        {/* Pickup Marker */}
        {pickup && (
          <Marker position={[pickup.lat, pickup.lng]} icon={pickupIcon}>
            <Popup>
              <div className="font-semibold text-emerald-700 text-xs">
                🟢 จุดรับ: {pickup.name}
              </div>
            </Popup>
          </Marker>
        )}

        {/* Destination Marker */}
        {destination && (
          <Marker position={[destination.lat, destination.lng]} icon={destinationIcon}>
            <Popup>
              <div className="font-semibold text-red-600 text-xs">
                🔴 จุดส่ง: {destination.name}
              </div>
            </Popup>
          </Marker>
        )}

        {/* Route Line between Pickup and Destination */}
        {routePolyline.length === 2 && (
          <Polyline
            positions={routePolyline}
            pathOptions={{ color: '#00B14F', weight: 5, opacity: 0.8, dashArray: '8, 8' }}
          />
        )}

        <MapAutoBounds pickup={pickup} destination={destination} userGps={userGps} />
        <MapClickHandler selectionMode={selectionMode} onSelectLocation={onSelectLocation} />
      </MapContainer>
    </div>
  );
}
