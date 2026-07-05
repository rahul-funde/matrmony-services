import { Injectable } from '@angular/core';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  getUsers(): User[] {
    return [
      {
        id: 'G0018-0226',
        fullName: 'Bhagyashree Yadav',
        gender: 'Female',
        mobile: '7928295567',
        plan: 'Welcome',
        status: 'Active',
        maritalStatus: 'Unmarried',
        startDate: '02 Feb 2026',
        endDate: '04 Mar 2026',
        createdAt: '02 Feb 2025'
      },
      {
        id: 'G0001-0146',
        fullName: 'Sushil Joshi',
        gender: 'Male',
        mobile: '7828295567',
        plan: 'Bronze',
        status: 'Inactive',
        maritalStatus: 'Unmarried',
        startDate: '15 Mar 2026',
        endDate: '01 May 2026',
        createdAt: '01 Jan 2025'
      },
      {
        id: 'G0002-0076',
        fullName: 'Amii Sharma',
        gender: 'Male',
        mobile: '6982895567',
        plan: 'Gold',
        status: 'Expired',
        maritalStatus: 'Divorced',
        startDate: '22 Jan 2026',
        endDate: '21 Apr 2026',
        createdAt: '03 Jan 2025'
      }
    ];
  }
}
