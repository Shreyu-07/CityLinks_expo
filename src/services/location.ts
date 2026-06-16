import * as Location from "expo-location";

export const requestLocationPermission = async (): Promise<boolean> => {
  const { status } = await Location.requestForegroundPermissionsAsync();
  return status === "granted";
};

export const getCurrentLocation = async () => {
  const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
  const { latitude, longitude } = pos.coords;
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
      { headers: { "User-Agent": "CityLinksApp/1.0" } },
    );
    const data = await res.json();
    const cityName = data?.address?.city || data?.address?.town || data?.address?.village || "";
    return { latitude, longitude, cityName };
  } catch {
    return { latitude, longitude, cityName: "" };
  }
};
