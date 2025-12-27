
export enum JobStatus {
  PENDING_UPLOAD = 'PENDING_UPLOAD',
  PENDING_PAYMENT = 'PENDING_PAYMENT',
  IN_QUEUE = 'IN_QUEUE',
  PRINTING = 'PRINTING',
  READY = 'READY',
  COLLECTED = 'COLLECTED'
}

export interface UserProfile {
  name: string;
  contact: string;
  photoUrl?: string;
}

export interface PricingConfig {
  bw_ss: number;
  bw_ds: number;
  color_ss: number;
  color_ds: number;
}

export interface Shop {
  id: string;
  name: string;
  location: string;
  printerCount: number;
  ppm: number;
  pricing: PricingConfig;
  isPaused: boolean;
  isConfigured: boolean;
  latitude?: number;
  longitude?: number;
  mapsUrl?: string;
}

export interface PrintJob {
  id: string;
  fileName: string;
  pageCount: number;
  isColor: boolean;
  isDoubleSided: boolean;
  status: JobStatus;
  timestamp: number;
  expectedTimeMinutes: number;
  cost: number;
  shopId: string;
}

export enum UserRole {
  STUDENT = 'STUDENT',
  OWNER = 'OWNER'
}
