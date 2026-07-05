export type PlanStatus = 'Active' | 'Inactive';
export type ContactLimitType = 'TOTAL' | 'WEEKLY' | 'MONTHLY' | 'UNLIMITED';

export interface ContactPolicy {
  type: ContactLimitType;
  totalLimit?: number | null;
  weeklyLimit?: number | null;
  monthlyLimit?: number | null;
  dailyLimit?: number | null;
  carryForward?: boolean;
}

export interface MembershipPlan {
  id?: string;

  /** BASIC INFO */
  name: string;
  title: string;
  duration: number;
  price: number;
  priority: number;
  users: number;
  planstatus: PlanStatus;

  /** CONTACT POLICY */
  contactPolicy: ContactPolicy;

  /** FEATURES */
  features: string[];

  /** META */
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
}
