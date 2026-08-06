export interface StationProperties {
  Id: string;
  Name: string;
  Country: string;
  ContinuousHeightsAvailable: boolean;
  Footnote: string;
}

export interface Station {
  id: string;
  name: string;
  country: string;
  longitude: number;
  latitude: number;
}

export interface StationFeatureCollection {
  type: "FeatureCollection";
  features: Array<{
    type: "Feature";
    geometry: { type: "Point"; coordinates: [number, number] };
    properties: StationProperties;
  }>;
}

export type TidalEventType = "HighWater" | "LowWater";

export interface TidalEvent {
  EventType: TidalEventType;
  DateTime: string;
  Height: number;
  IsApproximateTime: boolean;
  IsApproximateHeight: boolean;
  Filtered: boolean;
}
