import { Dimensions } from "react-native";

export const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");
export const BASE_W = 393;
export const scale = (size: number) => (SCREEN_W / BASE_W) * size;
export const vs = (size: number) => (SCREEN_H / 852) * size;
export const ms = (size: number, factor = 0.5) =>
  size + (scale(size) - size) * factor;
export const clamp = (val: number, min: number, max: number) =>
  Math.max(min, Math.min(max, val));
export const rfs = (size: number) => clamp(ms(size), size * 0.85, size * 1.3);
