import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { AdminUserDataService } from '../../services/admin-user-data.service';
import { RouterModule } from '@angular/router';
import { MaterialModule } from '../../material.module';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatSidenav } from '@angular/material/sidenav';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmationDialogComponent } from '../confirmation-dialog/confirmation-dialog.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RightSidenavComponent } from '../right-sidenav/right-sidenav.component';
import { Router } from '@angular/router';
import { RowStatusClassPipe } from '../../pipes/row-status-class.pipe'
import { UpdatePasswordDialogComponent } from '../update-password-dialog/update-password-dialog.component';
import { MatDialogModule } from '@angular/material/dialog';
import { ViewChildren, QueryList } from '@angular/core';
import { MatTabChangeEvent } from '@angular/material/tabs';


@Component({
  selector: 'app-main-content',
  standalone: true,
  imports: [
    RouterModule,
    MaterialModule,
    CommonModule,
    FormsModule,
    RightSidenavComponent,
    RowStatusClassPipe,
    MatDialogModule
  ],
  templateUrl: './main-content.component.html',
  styleUrls: ['./main-content.component.css']
})
export class MainContentComponent implements OnInit, AfterViewInit {

  topInfo: any = {};

  // ORIGINAL TABLE
  dataSource = new MatTableDataSource<any>([]);

  // NEW TAB TABLES
  activeUsers = new MatTableDataSource<any>([]);
  warningUsers = new MatTableDataSource<any>([]);
  expiredUsers = new MatTableDataSource<any>([]);

  displayedColumns: string[] = [
    'userId','FullName','email','mobilenumber','plan',
    'status','maritalStatus', 'plan_start_date', 'plan_end_date','createdAt','actions'
  ];

  expandedElement: any | null = null;


// @ViewChild('paginatorAll') paginatorAll!: MatPaginator;
// @ViewChild('paginatorWarning') paginatorWarning!: MatPaginator;
// @ViewChild('paginatorExpired') paginatorExpired!: MatPaginator;
@ViewChildren(MatPaginator) paginators!: QueryList<MatPaginator>;

  // @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild('sidenav') sidenav!: MatSidenav;
  @ViewChild(RightSidenavComponent) rightSidenav!: RightSidenavComponent;

  openSidenav = false;
  selectedUser: any = null;

  filterText: string = '';
  selectedPlan: string = '';
  fromDate: Date | null = null;
  toDate: Date | null = null;
  planFilter: string = '';
  statusFilter: string = '';
  genderFilter: string = '';

  rawData: any[] = [];

  plans: any[] = [];
  previousPlan: string | null = null;

  constructor(
    public dialog: MatDialog,
    private dataService: AdminUserDataService,
    private snackBar: MatSnackBar,
    private router: Router
  ) {}

  ngOnInit(): void {

    const today = new Date();
    this.toDate = today;
    this.fromDate = new Date();
    this.fromDate.setFullYear(today.getFullYear() - 1);

    this.loadTopInfo();

    this.dataService.getPlans().subscribe((data) => {

      this.plans = data.map((p: any) => ({
        value: p.name.toLowerCase(),
        label: p.name,
        duration: p.duration,
        id: p.id,
        status: p.planstatus
      }));

      sessionStorage.setItem('plans', JSON.stringify(this.plans));

    });

  }


// Helper function to assign paginator to the right table
private assignPaginator(tabIndex: number) {
  const paginators = this.paginators.toArray();

  if (!paginators.length) return;

  switch (tabIndex) {
    case 0:
      this.dataSource.paginator = paginators[0];
      break;
    case 1:
      this.warningUsers.paginator = paginators[1];
      break;
    case 2:
      this.expiredUsers.paginator = paginators[2];
      break;
  }
}

  ngAfterViewInit() {

    this.loadUserData();

  // Delay to ensure all paginators are rendered
    setTimeout(() => {
      this.assignPaginator(0);
    });
  }

// Called on tab change
onTabChange(event: MatTabChangeEvent) {
  this.assignPaginator(event.index);
}

  loadTopInfo() {
    this.dataService.getStatsData().subscribe({
      next: (data) => this.topInfo = data,
      error: (err) => console.error(err)
    });
  }

  // MAIN USER LOAD FUNCTION
  loadUserData() {

    this.dataService.getData().subscribe({

      next: (data: any) => {

        this.rawData = data.rows || data;

        const today = new Date();
        today.setHours(0,0,0,0);

        const active: any[] = [];
        const warning: any[] = [];
        const expired: any[] = [];

        this.rawData.forEach(user => {

          if (!user.end_date) {
            active.push(user);
            return;
          }

          const expiry = new Date(user.end_date);
          expiry.setHours(0,0,0,0);

          const diffInDays =
            (expiry.getTime() - today.getTime()) /
            (1000 * 60 * 60 * 24);

          if (diffInDays < 0) {

            expired.push(user);

          } else if (diffInDays <= 5) {

            warning.push(user);

          } else {

            active.push(user);

          }

        });

        this.activeUsers.data = active;
        this.warningUsers.data = warning;
        this.expiredUsers.data = expired;

        this.dataSource.data = this.rawData;

      },

      error: (err) => console.error(err)

    });

  }

  toggleRow(element: any): void {
    this.expandedElement = this.expandedElement === element ? null : element;
  }

  editRow(row: any) {
    this.router.navigate(['/admin-edit-user', row.userId]);
  }

  deleteRow(row: any) {

    const confirmed = confirm('Are you sure you want to delete this user?');
    if (!confirmed) return;

    const selectedPlan = this.plans?.find(p => p.value === row.plan);
    const planId = selectedPlan?.id ?? null;

    this.dataService.DeleteUser(row.doc_id, planId).subscribe({

      next: () => {

        this.loadUserData();
        this.snackBar.open('User Deleted!', 'Close', { duration: 3000 });

      },

      error: () => {

        this.snackBar.open('Error deleting user!', 'Close', { duration: 3000 });

      }

    });

  }

  updateUserProfile(row:any) {
    this.router.navigate(['/user-profile-update', row.id]);
  }

  refreshTable() {
    this.loadUserData();
  }

  exportTable() {

    const csvData =
      this.dataSource.filteredData
      .map(row => Object.values(row).join(','))
      .join('\n');

    const blob = new Blob([csvData], { type: 'text/csv' });

    const link = document.createElement('a');

    link.href = URL.createObjectURL(blob);
    link.download = 'user_data.csv';

    link.click();

  }

  openSlideInPanel(row: any): void {
    this.selectedUser = row;
    this.sidenav.open();
  }

  closeSlideInPanel(): void {
    this.sidenav.close();
  }

  async onPlanChange(element: any) {

    const previousPlan = localStorage.getItem('previousPlan') || '';

    const confirmed = await this.openConfirmationDialog();

    if (confirmed) {

      const selectedPlan = this.plans.find(p => p.value === element.plan);

      this.updatePlan(
        element,
        selectedPlan.duration,
        selectedPlan.id,
        previousPlan
      );

    }

  }

  async onStatusChange(element:any){

    const confirmed = await this.openConfirmationDialog();

    if (confirmed) {
      this.updateStatus(element);
    }

  }

  openConfirmationDialog(): Promise<boolean> {

    const dialogRef = this.dialog.open(ConfirmationDialogComponent);

    return dialogRef.afterClosed().toPromise();

  }

  updatePlan(element: any, duration: string, planId: string, prePlanId: string) {

    this.dataService.updateUserPlan(
      element.plan,
      element.doc_id,
      duration,
      planId,
      prePlanId
    ).subscribe({

      next: () => {

        this.loadUserData();
        this.snackBar.open('Plan updated!', 'Close', { duration: 3000 });

      },

      error: () => {

        this.snackBar.open('Error updating plan.', 'Close', { duration: 3000 });

      }

    });

  }

  updateStatus(element: any) {

    this.dataService.updateUserStatus(
      element.status,
      element.doc_id
    ).subscribe({

      next: () => {

        this.loadUserData();
        this.snackBar.open('Status updated!', 'Close', { duration: 3000 });

      },

      error: () => {

        this.snackBar.open('Error updating status.', 'Close', { duration: 3000 });

      }

    });

  }

  statusOptions = [

    { value: 'awaiting_verification', label: 'Awaiting Verification' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'Purge', label: 'Purge' },
    { value: 'deleted', label: 'Deleted' }

  ];

  isOptionDisabled(option: string, currentStatus: string): boolean {

    if (currentStatus !== 'awaiting_verification') {
      return option === 'awaiting_verification';
    }

    return false;

  }

  storePreviousPlan(element: any) {

    const previousPlan = this.plans.find(p => p.value === element.plan);

    if(previousPlan){
      localStorage.setItem('previousPlan', previousPlan.id);
    }

  }

  openUpdatePasswordDialog(row: any) {

    this.dialog.open(UpdatePasswordDialogComponent, {
      width: '400px',
      disableClose: true,
      data: row
    });

  }


applyFilterText() {
  const filterValue = this.filterText?.trim().toLowerCase();

  this.dataSource.filter = filterValue;

  if (this.dataSource.paginator) {
    this.dataSource.paginator.firstPage();
  }
}

filterTable() {

  let filteredData = this.rawData;

  if (this.planFilter) {
    filteredData = filteredData.filter(
      (user: any) => user.plan === this.planFilter
    );
  }

  if (this.genderFilter) {
    filteredData = filteredData.filter(
      (user: any) => user.personalDetails?.gender === this.genderFilter
    );
  }

  if (this.statusFilter) {
    filteredData = filteredData.filter(
      (user: any) => user.status === this.statusFilter
    );
  }

  if (this.fromDate) {
    filteredData = filteredData.filter(
      (user: any) => new Date(user.createdAt) >= new Date(this.fromDate!)
    );
  }

  if (this.toDate) {
    filteredData = filteredData.filter(
      (user: any) => new Date(user.createdAt) <= new Date(this.toDate!)
    );
  }

  this.dataSource.data = filteredData;

  const today = new Date();
  today.setHours(0,0,0,0);

  const active:any[]=[];
  const warning:any[]=[];
  const expired:any[]=[];

  filteredData.forEach(user=>{

    if(!user.end_date){
      active.push(user);
      return;
    }

    const expiry=new Date(user.end_date);
    expiry.setHours(0,0,0,0);

    const diffDays=(expiry.getTime()-today.getTime())/(1000*60*60*24);

    if(diffDays<0){
      expired.push(user);
    }
    else if(diffDays<=5){
      warning.push(user);
    }
    else{
      active.push(user);
    }

  });

  this.activeUsers.data = active;
  this.warningUsers.data = warning;
  this.expiredUsers.data = expired;
}

onFromDateChange() {
  this.filterTable();
}
isExpansionDetailRow = (index: number, row: any) => row.hasOwnProperty('detailRow');

saveChanges(row: any) {

  console.log('Saving row:', row);

  this.snackBar.open(
    'Changes saved successfully!',
    'Close',
    { duration: 3000 }
  );

}


}
