export interface BrowserLocation {
  longitude: number;
  latitude: number;
  accuracy?: number;
  source: 'browser';
  coordinateSystem: 'gcj02';
}

interface RawPosition {
  coords: {
    longitude: number;
    latitude: number;
    accuracy: number;
  };
}

const PI = Math.PI;
const AXIS = 6378245.0;
const OFFSET = 0.00669342162296594323;

function outOfChina(longitude: number, latitude: number) {
  return (
    longitude < 72.004 ||
    longitude > 137.8347 ||
    latitude < 0.8293 ||
    latitude > 55.8271
  );
}

function transformLatitude(x: number, y: number) {
  let value = -100 + 2 * x + 3 * y + 0.2 * y * y + 0.1 * x * y + 0.2 * Math.sqrt(Math.abs(x));
  value += (20 * Math.sin(6 * x * PI) + 20 * Math.sin(2 * x * PI)) * 2 / 3;
  value += (20 * Math.sin(y * PI) + 40 * Math.sin((y / 3) * PI)) * 2 / 3;
  value += (160 * Math.sin((y / 12) * PI) + 320 * Math.sin((y * PI) / 30)) * 2 / 3;
  return value;
}

function transformLongitude(x: number, y: number) {
  let value = 300 + x + 2 * y + 0.1 * x * x + 0.1 * x * y + 0.1 * Math.sqrt(Math.abs(x));
  value += (20 * Math.sin(6 * x * PI) + 20 * Math.sin(2 * x * PI)) * 2 / 3;
  value += (20 * Math.sin(x * PI) + 40 * Math.sin((x / 3) * PI)) * 2 / 3;
  value += (150 * Math.sin((x / 12) * PI) + 300 * Math.sin((x / 30) * PI)) * 2 / 3;
  return value;
}

function toGcj02(longitude: number, latitude: number) {
  if (outOfChina(longitude, latitude)) return { longitude, latitude };

  const deltaLatitude = transformLatitude(longitude - 105, latitude - 35);
  const deltaLongitude = transformLongitude(longitude - 105, latitude - 35);
  const radLatitude = (latitude / 180) * PI;
  const magic = 1 - OFFSET * Math.sin(radLatitude) ** 2;
  const sqrtMagic = Math.sqrt(magic);
  return {
    longitude: longitude + (deltaLongitude * 180) / ((AXIS / sqrtMagic) * Math.cos(radLatitude) * PI),
    latitude: latitude + (deltaLatitude * 180) / (((AXIS * (1 - OFFSET)) / magic ** 1.5) * PI),
  };
}

function errorMessage(error: GeolocationPositionError) {
  if (error.code === error.PERMISSION_DENIED) return '浏览器拒绝了定位权限';
  if (error.code === error.POSITION_UNAVAILABLE) return '暂时无法获取当前位置';
  if (error.code === error.TIMEOUT) return '获取当前位置超时';
  return '定位失败，请稍后重试';
}

export function requestBrowserLocation(): Promise<BrowserLocation> {
  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    return Promise.reject(new Error('当前浏览器不支持定位'));
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position: GeolocationPosition) => {
        const raw = position as unknown as RawPosition;
        const converted = toGcj02(raw.coords.longitude, raw.coords.latitude);
        resolve({
          longitude: Number(converted.longitude.toFixed(6)),
          latitude: Number(converted.latitude.toFixed(6)),
          accuracy: Number(raw.coords.accuracy.toFixed(1)),
          source: 'browser',
          coordinateSystem: 'gcj02',
        });
      },
      (error) => reject(new Error(errorMessage(error))),
      {
        enableHighAccuracy: true,
        timeout: 12_000,
        maximumAge: 60_000,
      },
    );
  });
}
