/* ============================= */
/*        ENUM-LIKE TYPES        */
/* ============================= */

export type InterestStatus =
  | 'pending'
  | 'accepted'
  | 'rejected'
  | 'cancelled';

export type InterestDirection =
  | 'sent'
  | 'received';

/* ============================= */
/*        SUB MODELS             */
/* ============================= */

export interface ProfilePicture {
  filename: string;
  isProfile?: boolean;
  uploadedAt?: string;
  originalUrl?: string;      // full-size URL
  thumbUrl?: string;         // thumbnail URL
}

export interface StatusHistory {
  status: InterestStatus;
  timestamp: string;
  updatedBy?: string; // optional (future admin tracking)
  updatedAt?: string;
  newStatus?: string;   // optional
}

/* ============================= */
/*        MAIN INTEREST MODEL    */
/* ============================= */

export interface Interest {
  interestId: string;

  fromUserId: string;
  otherUserId: string;

  direction: InterestDirection;

  status: InterestStatus;
  statusHistory: StatusHistory[];

  createdAt: string;
  updatedAt: string;

  /* Profile Details (for UI rendering) */
  firstName: string;
  lastName: string;
  age: number;
  height: string;
  religion: string;
  caste: string;
  city: string;
  highestQualification: string;
  occupation: string;

  profilePicture: ProfilePicture[];
  initiatedBy: string;
   // 🔥 NEW FIELDS (VERY IMPORTANT)
  isSender?: boolean;
  isReceiver?: boolean;
  acceptanceType?: 'acceptedByMe' | 'acceptedByThem' | null;
}

/* ============================= */
/*        API RESPONSE           */
/* ============================= */

export interface InterestResponse {
  success: boolean;
  total: number;

  sent: Interest[];
  received: Interest[];
  accepted: Interest[];
  rejected: Interest[];
  cancelled: Interest[];   // added for full lifecycle
}
