import { LatLng } from '../types';

export interface GlobalStoreType {
  shops: Record<string, any>;
  products: Record<string, any>;
  cartCount: number;
  userLocation: LatLng | null;
}
export const GlobalStore: GlobalStoreType = { shops: {}, products: {}, cartCount: 0, userLocation: null };
