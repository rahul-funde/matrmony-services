// src/app/models/social-media-profile.model.ts

export type MaritalStatus =
  | 'Unmarried boy'
  | 'Unmarried girl'
  | 'Divorced man'
  | 'Divorced woman'
  | 'Widow';

export interface Profile {
  profileId: string;
  name: string;
  age?: number;
  caste?: string;
  gender: 'Male' | 'Female';
  maritalStatus: MaritalStatus;
  occupationType?: string;
  selected?: boolean;       // for selection in UI
  customMessage?: string;   // optional custom message
}

export interface WhatsAppGroup {
  id: string;
  name: string;
  description: string;
   link: string; // ✅ Add this

}
