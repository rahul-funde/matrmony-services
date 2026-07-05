import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  selector: 'app-users-table',
  imports: [CommonModule],
  templateUrl: './users-table.component.html',
  styleUrls: ['./users-table.component.css']
})
export class UsersTableComponent {

  users = [
    {
      id: 'G0018-0226',
      name: 'Bhagyashree Yadav',
      gender: 'Female',
      plan: 'Welcome',
      status: 'Active'
    },
    {
      id: 'G0001-0146',
      name: 'Sushil Joshi',
      gender: 'Male',
      plan: 'Bronze',
      status: 'Inactive'
    }
  ];
}
