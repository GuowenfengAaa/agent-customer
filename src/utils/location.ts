const LUOYANG_BOUNDS = {
  minLatitude: 33.55,
  maxLatitude: 35.1,
  minLongitude: 110.55,
  maxLongitude: 113.05,
};

export const resolveCurrentCity = (
  latitude: number,
  longitude: number
): string => {
  const isInLuoyang =
    latitude >= LUOYANG_BOUNDS.minLatitude &&
    latitude <= LUOYANG_BOUNDS.maxLatitude &&
    longitude >= LUOYANG_BOUNDS.minLongitude &&
    longitude <= LUOYANG_BOUNDS.maxLongitude;

  return isInLuoyang ? "洛阳" : "当前位置";
};
