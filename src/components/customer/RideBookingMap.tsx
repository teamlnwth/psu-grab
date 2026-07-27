'use client';

import React, { useState, useEffect } from 'react';
import CampusMap from '@/components/map/CampusMap';
import { LocationPoint, PSU_PRESET_LOCATIONS, RouteInfo } from '@/types/map';
import { MapPin, Navigation, Bike, Car, Zap, CheckCircle2, Search, ArrowRightLeft } from 'lucide-react';

interface RideBookingMapProps {
  onConfirmRide?: (rideData: {
    pickup: LocationPoint;
    destination: LocationPoint;
    vehicleType: 'motorbike' | 'car' | 'scooter';
    route: RouteInfo;
  }) => void;
}

// Calculate Haversine distance in kilometers between two lat/lng points
function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return parseFloat(d.toFixed(2));
}

export default function RideBookingMap({ onConfirmRide }: RideBookingMapProps) {
  const [pickup, setPickup] = useState<LocationPoint | null>(null);
  const [destination, setDestination] = useState<LocationPoint | null>(null);
  const [userGps, setUserGps] = useState<LocationPoint | null>(null);
  const [selectionMode, setSelectionMode] = useState<'pickup' | 'destination'>('pickup');
  const [vehicleType, setVehicleType] = useState<'motorbike' | 'car' | 'scooter'>('motorbike');
  const [isLocatingGps, setIsLocatingGps] = useState<boolean>(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [isConfirmed, setIsConfirmed] = useState<boolean>(false);

  // Set default pickup to Faculty of Engineering PSU on load
  useEffect(() => {
    const defaultPoint: LocationPoint = {
      lat: PSU_PRESET_LOCATIONS[0].lat,
      lng: PSU_PRESET_LOCATIONS[0].lng,
      name: PSU_PRESET_LOCATIONS[0].name,
    };
    setPickup(defaultPoint);
  }, []);

  // Calculate route distance and estimated price whenever pickup, destination, or vehicle changes
  useEffect(() => {
    if (pickup && destination) {
      const distKm = calculateDistanceKm(pickup.lat, pickup.lng, destination.lat, destination.lng);
      // Average speeds: motorbike 25km/h, car 20km/h, scooter 15km/h in campus
      const speedKmH = vehicleType === 'motorbike' ? 25 : vehicleType === 'car' ? 20 : 15;
      const durationMin = Math.max(2, Math.round((distKm / speedKmH) * 60));

      // Base fare + km rate
      let baseFare = 20;
      let perKm = 5;
      if (vehicleType === 'car') {
        baseFare = 35;
        perKm = 10;
      } else if (vehicleType === 'scooter') {
        baseFare = 15;
        perKm = 4;
      }

      const estPrice = Math.round(baseFare + distKm * perKm);

      setRouteInfo({
        distanceKm: distKm,
        durationMinutes: durationMin,
        estimatedPrice: estPrice,
      });
    } else {
      setRouteInfo(null);
    }
  }, [pickup, destination, vehicleType]);

  // Request browser GPS position
  const handleGetGpsLocation = () => {
    setIsLocatingGps(true);
    setGpsError(null);

    if (!navigator.geolocation) {
      setGpsError('เบราว์เซอร์ของคุณไม่รองรับการดึงพิกัด GPS');
      setIsLocatingGps(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const gpsPoint: LocationPoint = {
          lat: parseFloat(pos.coords.latitude.toFixed(5)),
          lng: parseFloat(pos.coords.longitude.toFixed(5)),
          name: 'ตำแหน่งปัจจุบันของคุณ (GPS)',
        };
        setUserGps(gpsPoint);
        // Automatically assign to whichever mode is active
        if (selectionMode === 'pickup' || !pickup) {
          setPickup(gpsPoint);
        } else {
          setDestination(gpsPoint);
        }
        setIsLocatingGps(false);
      },
      (err) => {
        console.warn('GPS location error:', err);
        setGpsError('ไม่สามารถดึงตำแหน่ง GPS ได้ โปรดอนุญาตสิทธิ์เข้าถึงตำแหน่ง');
        setIsLocatingGps(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSelectLocationPoint = (mode: 'pickup' | 'destination', point: LocationPoint) => {
    if (mode === 'pickup') {
      setPickup(point);
      // Auto-switch to destination mode if not selected yet
      if (!destination) {
        setSelectionMode('destination');
      }
    } else {
      setDestination(point);
    }
  };

  const handlePresetClick = (preset: typeof PSU_PRESET_LOCATIONS[0]) => {
    const point: LocationPoint = {
      lat: preset.lat,
      lng: preset.lng,
      name: preset.name,
    };
    handleSelectLocationPoint(selectionMode, point);
  };

  const handleSwapLocations = () => {
    const temp = pickup;
    setPickup(destination);
    setDestination(temp);
  };

  const handleConfirmRide = () => {
    if (!pickup || !destination || !routeInfo) return;
    setIsConfirmed(true);
    if (onConfirmRide) {
      onConfirmRide({
        pickup,
        destination,
        vehicleType,
        route: routeInfo,
      });
    }
  };

  return (
    <div className="w-full bg-white rounded-3xl p-5 md:p-8 shadow-xl border border-slate-100 space-y-6">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-5">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
            📍 PSU-Grab Route Navigator
          </span>
          <h2 className="text-2xl font-black text-slate-900 mt-1">เรียกรถเดินทางภายใน ม.อ.</h2>
          <p className="text-xs text-slate-500 font-medium">
            คลิกบนแผนที่หรือเลือกสถานที่สำคัญเพื่อปักหมุดจุดรับ-จุดส่ง
          </p>
        </div>

        {/* GPS Current Location Button */}
        <button
          onClick={handleGetGpsLocation}
          disabled={isLocatingGps}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-extrabold rounded-xl border border-blue-200 transition active:scale-95 disabled:opacity-50"
        >
          <Navigation className={`w-4 h-4 ${isLocatingGps ? 'animate-spin' : ''}`} />
          {isLocatingGps ? 'กำลังค้นหา GPS...' : '🎯 ตำแหน่งปัจจุบัน (GPS)'}
        </button>
      </div>

      {gpsError && (
        <div className="p-3.5 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-xl font-medium">
          ⚠️ {gpsError}
        </div>
      )}

      {/* Main Grid: Control Panel (Left) & Map (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Pickup / Destination Selectors */}
        <div className="lg:col-span-5 space-y-5">
          {/* Pickup & Destination Status Card */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3">
            {/* Mode Switcher */}
            <div className="flex bg-slate-200/70 p-1 rounded-xl text-xs font-extrabold text-slate-600">
              <button
                onClick={() => setSelectionMode('pickup')}
                className={`flex-1 py-2 rounded-lg transition ${
                  selectionMode === 'pickup' ? 'bg-emerald-600 text-white shadow-sm' : 'hover:bg-slate-300/50'
                }`}
              >
                🟢 เลือกจุดรับ
              </button>
              <button
                onClick={() => setSelectionMode('destination')}
                className={`flex-1 py-2 rounded-lg transition ${
                  selectionMode === 'destination' ? 'bg-red-500 text-white shadow-sm' : 'hover:bg-slate-300/50'
                }`}
              >
                🔴 เลือกจุดส่ง
              </button>
            </div>

            {/* Pickup Item */}
            <div
              onClick={() => setSelectionMode('pickup')}
              className={`p-3 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                selectionMode === 'pickup'
                  ? 'bg-emerald-50/70 border-emerald-400 ring-2 ring-emerald-400/20'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-bold shadow-sm">
                  🟢
                </div>
                <div>
                  <div className="text-[11px] font-bold text-slate-400">จุดรับ (Pickup)</div>
                  <div className="text-xs font-extrabold text-slate-800 line-clamp-1">
                    {pickup ? pickup.name : 'กรุณาคลิกเลือกจุดรับบนแผนที่...'}
                  </div>
                </div>
              </div>
              <span className="text-[11px] font-bold text-emerald-600">แก้ไข</span>
            </div>

            {/* Swap Button */}
            <div className="flex justify-center -my-2">
              <button
                onClick={handleSwapLocations}
                title="สลับจุดรับ-จุดส่ง"
                className="w-8 h-8 rounded-full bg-white border border-slate-300 shadow-md hover:bg-slate-100 flex items-center justify-center text-slate-600 transition active:rotate-180 duration-300"
              >
                <ArrowRightLeft className="w-3.5 h-3.5 rotate-90" />
              </button>
            </div>

            {/* Destination Item */}
            <div
              onClick={() => setSelectionMode('destination')}
              className={`p-3 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                selectionMode === 'destination'
                  ? 'bg-red-50/70 border-red-400 ring-2 ring-red-400/20'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center text-xs font-bold shadow-sm">
                  🔴
                </div>
                <div>
                  <div className="text-[11px] font-bold text-slate-400">จุดส่ง (Destination)</div>
                  <div className="text-xs font-extrabold text-slate-800 line-clamp-1">
                    {destination ? destination.name : 'กรุณาคลิกเลือกจุดส่งบนแผนที่...'}
                  </div>
                </div>
              </div>
              <span className="text-[11px] font-bold text-red-600">แก้ไข</span>
            </div>
          </div>

          {/* Quick PSU Presets */}
          <div className="space-y-2">
            <label className="text-xs font-extrabold text-slate-700 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-600" />
              จุดยอดนิยมใน ม.อ. หาดใหญ่ (คลิกเพื่อเลือก{selectionMode === 'pickup' ? 'จุดรับ' : 'จุดส่ง'}):
            </label>
            <div className="grid grid-cols-2 gap-2 max-h-44 overflow-y-auto pr-1">
              {PSU_PRESET_LOCATIONS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => handlePresetClick(preset)}
                  className="p-2.5 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 border border-slate-200 rounded-xl text-left transition flex items-center gap-2 group text-xs font-bold text-slate-700"
                >
                  <span className="text-sm">📍</span>
                  <span className="truncate group-hover:text-emerald-700">{preset.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Vehicle Type Selector */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <label className="text-xs font-extrabold text-slate-700">เลือกประเภทยานพาหนะ:</label>
            <div className="grid grid-cols-3 gap-2.5">
              <button
                onClick={() => setVehicleType('motorbike')}
                className={`p-3 rounded-2xl border flex flex-col items-center gap-1 transition ${
                  vehicleType === 'motorbike'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-500/20 font-black'
                    : 'bg-white border-slate-200 text-slate-600 font-bold hover:bg-slate-50'
                }`}
              >
                <span className="text-xl">🛵</span>
                <span className="text-xs">มอเตอร์ไซค์</span>
                <span className="text-[10px] opacity-75">เร็วสุด</span>
              </button>

              <button
                onClick={() => setVehicleType('car')}
                className={`p-3 rounded-2xl border flex flex-col items-center gap-1 transition ${
                  vehicleType === 'car'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-500/20 font-black'
                    : 'bg-white border-slate-200 text-slate-600 font-bold hover:bg-slate-50'
                }`}
              >
                <span className="text-xl">🚗</span>
                <span className="text-xs">รถยนต์</span>
                <span className="text-[10px] opacity-75">สบาย</span>
              </button>

              <button
                onClick={() => setVehicleType('scooter')}
                className={`p-3 rounded-2xl border flex flex-col items-center gap-1 transition ${
                  vehicleType === 'scooter'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-500/20 font-black'
                    : 'bg-white border-slate-200 text-slate-600 font-bold hover:bg-slate-50'
                }`}
              >
                <span className="text-xl">🛴</span>
                <span className="text-xs">สกู๊ตเตอร์</span>
                <span className="text-[10px] opacity-75">ประหยัด</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Map & Route Fare Summary */}
        <div className="lg:col-span-7 space-y-4">
          <div className="h-[420px] relative">
            <CampusMap
              pickup={pickup}
              destination={destination}
              userGps={userGps}
              selectionMode={selectionMode}
              onSelectLocation={handleSelectLocationPoint}
            />

            {/* Floating Selection Mode Indicator on Map */}
            <div className="absolute top-4 left-4 z-[400] bg-white/90 backdrop-blur-md px-3.5 py-2 rounded-2xl shadow-lg border border-slate-200 text-xs font-bold text-slate-800 flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${selectionMode === 'pickup' ? 'bg-emerald-500 animate-ping' : 'bg-red-500 animate-ping'}`}></span>
              กำลังเลือก: <span className={selectionMode === 'pickup' ? 'text-emerald-700 font-black' : 'text-red-600 font-black'}>
                {selectionMode === 'pickup' ? '🟢 จุดรับ (Pickup)' : '🔴 จุดส่ง (Destination)'}
              </span>
            </div>
          </div>

          {/* Route Summary & Fare Card */}
          {routeInfo ? (
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-5 rounded-3xl shadow-xl space-y-4 animate-fade-in">
              <div className="flex justify-between items-center border-b border-slate-700/80 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-500/20 border border-emerald-400/30 text-emerald-400 rounded-2xl flex items-center justify-center text-xl">
                    ⚡
                  </div>
                  <div>
                    <div className="text-[11px] font-bold text-slate-400">คำนวณเส้นทาง PSU-Grab</div>
                    <div className="text-sm font-extrabold text-emerald-400">
                      ระยะทาง ~{routeInfo.distanceKm} กม. ({routeInfo.durationMinutes} นาที)
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-[11px] font-bold text-slate-400">ประมาณการค่าโดยสาร</div>
                  <div className="text-2xl font-black text-yellow-400">
                    ฿{routeInfo.estimatedPrice}
                  </div>
                </div>
              </div>

              {isConfirmed ? (
                <div className="p-3.5 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl flex items-center gap-3 text-emerald-300 text-xs font-bold animate-pop-in">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                  <span>ยืนยันการเรียกรถสำเร็จ! กำลังค้นหาไรเดอร์ ม.อ. ในพื้นที่...</span>
                </div>
              ) : (
                <button
                  onClick={handleConfirmRide}
                  className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-2xl text-center shadow-lg transition active:scale-98 flex items-center justify-center gap-2 text-sm"
                >
                  <span>เรียกรถเลย (฿{routeInfo.estimatedPrice})</span>
                  <span>→</span>
                </button>
              )}
            </div>
          ) : (
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center text-slate-400 text-xs font-bold">
              💡 กรุณาคลิกเลือกจุดรับ และจุดส่ง บนแผนที่เพื่อคำนวณเส้นทางและค่าโดยสาร
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
