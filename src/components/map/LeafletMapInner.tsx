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

import { PSU_PRESET_LOCATIONS } from '@/types/map';

// Helper to find closest PSU preset landmark
function findNearestPsuPreset(lat: number, lng: number): string | null {
  let closestName: string | null = null;
  let minDistance = 0.35; // within ~350 meters

  for (const preset of PSU_PRESET_LOCATIONS) {
    const dLat = preset.lat - lat;
    const dLng = preset.lng - lng;
    const dist = Math.sqrt(dLat * dLat + dLng * dLng) * 111; // approx distance in km
    if (dist < minDistance) {
      minDistance = dist;
      closestName = dist < 0.08 ? preset.name : `บริเวณ ${preset.name}`;
    }
  }

  return closestName;
}

// Reverse Geocode using Nominatim API with fallback to PSU preset or clear address name
async function getReverseGeocodedName(lat: number, lng: number): Promise<string> {
  const psuPresetName = findNearestPsuPreset(lat, lng);

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=th`,
      { headers: { 'Accept-Language': 'th' } }
    );
    if (res.ok) {
      const data = await res.json();
      if (data && data.display_name) {
        const parts = data.display_name.split(',').map((s: string) => s.trim());
        const friendlyName = parts
          .slice(0, 3)
          .filter((p: string) => !p.includes('90110') && !p.includes('ประเทศไทย'))
          .join(', ');
        if (friendlyName) {
          return psuPresetName ? `${psuPresetName} (${friendlyName})` : friendlyName;
        }
      }
    }
  } catch (err) {
    console.warn('Reverse geocode error:', err);
  }

  return psuPresetName || `จุดปักหมุด (${lat}, ${lng})`;
}

// Component to handle map clicks & scroll panning for pinning locations
function MapClickHandler({
  selectionMode,
  onSelectLocation,
}: {
  selectionMode: 'pickup' | 'destination';
  onSelectLocation: (mode: 'pickup' | 'destination', point: LocationPoint) => void;
}) {
  const map = useMap();

  useMapEvents({
    click: (e) => {
      const lat = parseFloat(e.latlng.lat.toFixed(5));
      const lng = parseFloat(e.latlng.lng.toFixed(5));
      // Pan map so clicked location moves right to the center of the screen
      map.panTo([lat, lng], { animate: true, duration: 0.5 });
    },
    moveend: async () => {
      const center = map.getCenter();
      const lat = parseFloat(center.lat.toFixed(5));
      const lng = parseFloat(center.lng.toFixed(5));

      // Immediate response with nearest landmark or coordinates
      const initialName = findNearestPsuPreset(lat, lng) || `จุดกลางจอ (${lat}, ${lng})`;
      onSelectLocation(selectionMode, { lat, lng, name: initialName });

      // Async update with reverse geocoded real Thai address
      const detailedName = await getReverseGeocodedName(lat, lng);
      onSelectLocation(selectionMode, { lat, lng, name: detailedName });
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
      {/* Fixed Center Screen Pin (Grab/Uber style location picker) */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[calc(100%-6px)] z-[500] pointer-events-none flex flex-col items-center">
        <div className={`px-2.5 py-1 rounded-full text-[10.5px] font-black text-white shadow-xl mb-1 flex items-center gap-1 border border-white/20 backdrop-blur-md transition-colors ${
          selectionMode === 'pickup' ? 'bg-emerald-600' : 'bg-red-600'
        }`}>
          <span>{selectionMode === 'pickup' ? '🟢 เลื่อนแผนที่เพื่อปรับจุดรับ' : '🔴 เลื่อนแผนที่เพื่อปรับจุดส่ง'}</span>
        </div>
        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white shadow-2xl border-2 border-white transition-colors ${
          selectionMode === 'pickup' ? 'bg-emerald-500 ring-4 ring-emerald-500/20' : 'bg-red-500 ring-4 ring-red-500/20'
        }`}>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3"/>
            <path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>
          </svg>
        </div>
        <div className="w-2.5 h-1 bg-black/40 rounded-full blur-[1px] mt-0.5"></div>
      </div>

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
