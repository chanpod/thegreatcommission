export interface Guardian {
  id: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email?: string;
  photoUrl?: string;
}

export interface Child {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  notes?: string;
  allergies?: string;
  specialNeeds?: string;
  photoUrl?: string;
}

export interface FamilyData {
  verified?: boolean;
  guardians: Guardian[];
  children: Child[];
  name?: string;
}

export interface Room {
  id: string;
  name: string;
  minAgeMonths: number;
  maxAgeMonths: number;
  capacity: number;
  currentCount?: number;
}

export interface CheckInSteps {
  PHONE: number;
  VERIFY: number;
  UPDATE_USER_INFO: number;
  SELECT_CHILD: number;
  CONFIRM: number;
}

export type CheckInStep = 
  | "phone" 
  | "verify" 
  | "update-user-info" 
  | "select-child" 
  | "confirmed"
  | "edit-family"; 