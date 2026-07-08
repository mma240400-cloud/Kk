/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface FamilyMember {
  id: string;
  name: string;
  relation: string;
  age: number;
  nrc?: string;
  photo?: string; // base64 or placeholder URL
}

export interface Guest {
  id: string;
  name: string;
  photo?: string; // base64 or placeholder URL
  dob: string;
  age: number;
  nrc: string;
  parents: string;
  ethnicityReligion: string;
  origin: string;
  reason: string;
  stayFrom: string;
  stayTo: string;
  isCurrent: boolean; // ဒီမှာနေတာလားမနေဘူးလား (Currently staying or departed)
  familyMembers: FamilyMember[];
  phone?: string;
  remarks?: string;
  createdAt: string;
}

export type FilterStatus = 'all' | 'current' | 'departed';
export type SortOption = 'newest' | 'oldest' | 'nameAsc' | 'nameDesc' | 'stayDate';

export interface ScanHistoryItem {
  id: string;
  timestamp: string;
  rawData: string;
  parsedGuestsCount: number;
  namesSummary: string;
}

