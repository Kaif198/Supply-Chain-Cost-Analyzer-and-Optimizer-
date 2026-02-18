export interface Coordinates {
  latitude: number;
  longitude: number;
  elevation?: number;
}

export interface DistanceResult {
  distance: number;
  isAlpine: boolean;
}

export interface BearingResult {
  bearing: number;
  direction: string;
}
