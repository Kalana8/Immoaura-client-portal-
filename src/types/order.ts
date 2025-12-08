export interface VideoConfig {
  package: "Starter" | "Standard" | "Premium";
  propertyType: string;
  squareMeters: number;
  rooms: number;
  address: string;
  accessNotes: string;
  voiceOver: boolean;
  voiceOverLanguage?: "NL" | "FR" | "DE" | "EN";
  twilight: boolean;
  extraSocialCut: boolean;
  rush24h: boolean;
  logoFiles?: File[];
  musicFiles?: File[];
}

export interface Plan2DConfig {
  levels: number;
  squareMetersPerLevel: number;
  outputs: string[];
  editableDWG: boolean;
  rush24h: boolean;
  uploadFiles?: File[];
}

export interface Plan3DConfig {
  levels: number;
  quality: "Basic" | "Enhanced" | "Photoreal";
  views: string[];
  styleMood: string;
  twilight: boolean;
  flyThrough: boolean;
  uploadFiles?: File[];
}

export interface OrderData {
  services: string[];
  videoConfig: VideoConfig | null;
  plan2dConfig: Plan2DConfig | null;
  plan3dConfig: Plan3DConfig | null;
  agendaSlot: string | null;
  contact_number?: string;
}

export interface PriceBreakdown {
  services: {
    [key: string]: number;
  };
  addons: {
    [key: string]: number;
  };
  subtotal: number;
  vat: number;
  total: number;
}
