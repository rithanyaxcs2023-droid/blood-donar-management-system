
export enum BloodType {
  A_POSITIVE = 'A+',
  A_NEGATIVE = 'A-',
  B_POSITIVE = 'B+',
  B_NEGATIVE = 'B-',
  AB_POSITIVE = 'AB+',
  AB_NEGATIVE = 'AB-',
  O_POSITIVE = 'O+',
  O_NEGATIVE = 'O-'
}

export interface Donor {
  id: string;
  name: string;
  bloodType: BloodType;
  lastDonationDate: string;
  contact: string;
  location: string;
  isAvailable: boolean;
  lastNotified?: string | null;
}

export interface Emergency {
  id: string;
  bloodType: BloodType;
  hospital: string;
  unitsNeeded: number;
  urgency: 'high' | 'critical';
  createdAt: string;
}

export interface InventoryItem {
  type: BloodType;
  units: number;
  status: 'critical' | 'stable' | 'excess';
}

export type ViewState = 'dashboard' | 'donors' | 'inventory' | 'assistant' | 'editor';
