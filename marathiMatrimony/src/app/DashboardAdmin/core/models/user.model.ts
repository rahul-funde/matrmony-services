export interface User {
  id: string;
  fullName: string;
  gender: 'Male' | 'Female';
  mobile: string;
  plan: 'Welcome' | 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
  status: 'Active' | 'Inactive' | 'Expired';
  maritalStatus: string;
  startDate: string;
  endDate: string;
  createdAt: string;
}
