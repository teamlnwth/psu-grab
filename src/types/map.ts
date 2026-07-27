export interface LocationPoint {
  lat: number;
  lng: number;
  name: string;
  address?: string;
}

export interface RouteInfo {
  distanceKm: number;
  durationMinutes: number;
  estimatedPrice: number;
}

export interface PsuPresetLocation {
  id: string;
  name: string;
  category: 'faculty' | 'dorm' | 'landmark' | 'gate';
  lat: number;
  lng: number;
}

export const PSU_PRESET_LOCATIONS: PsuPresetLocation[] = [
  { id: 'eng', name: 'คณะวิศวกรรมศาสตร์ ม.อ.', category: 'faculty', lat: 7.0088, lng: 100.4984 },
  { id: 'sci', name: 'คณะวิทยาศาสตร์ ม.อ.', category: 'faculty', lat: 7.0076, lng: 100.4998 },
  { id: 'med', name: 'โรงพยาบาลสงขลานครินทร์ (รพ.ม.อ.)', category: 'faculty', lat: 7.0095, lng: 100.4950 },
  { id: 'lib', name: 'สำนักทรัพยากรเรียนรู้ (หอสมุดคุณหญิงหลง)', category: 'landmark', lat: 7.0068, lng: 100.4989 },
  { id: 'cc', name: 'ศูนย์คอมพิวเตอร์ ม.อ.', category: 'landmark', lat: 7.0080, lng: 100.4975 },
  { id: 'icc', name: 'ศูนย์ประชุมนานาชาติ ม.อ. (ICC)', category: 'landmark', lat: 7.0010, lng: 100.5050 },
  { id: 'dorm10', name: 'หอพักนักศึกษา หอ 10-11', category: 'dorm', lat: 7.0045, lng: 100.5012 },
  { id: 'gate108', name: 'ประตู 108 ม.อ.', category: 'gate', lat: 7.0032, lng: 100.4960 },
  { id: 'gate109', name: 'ประตู 109 ม.อ.', category: 'gate', lat: 7.0050, lng: 100.5045 },
];
