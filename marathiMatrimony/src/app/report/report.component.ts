import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';

import { ReportService } from '../services/report.service';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

@Component({
  selector: 'app-report',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    HttpClientModule,

    /* Angular Material */
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatButtonModule
  ],
  templateUrl: './report.component.html',
  styleUrls: ['./report.component.css']
})
export class ReportComponent implements OnInit {

  /* ================= FILTERS ================= */

  fromDate = '';
  toDate = '';
  groupBy: 'day' | 'week' | 'month' | 'plan' | 'paymentMode' = 'day';

  /* ================= STATE ================= */
  loading = false;
  error = '';
  summaryData: any = {};

  /* ================= TABLE 1 ================= */
  revenueColumns: string[] = [
    'plan',
    'payment',
    'transactions',
    'revenue'
  ];

  revenueDataSource = new MatTableDataSource<any>([]);

  /* ================= TABLE 2 ================= */
  periodDataSource = new MatTableDataSource<any>([]);

  /** 🔴 IMPORTANT FIX: dynamic column IDs */
  get periodColumns(): string[] {
    return [this.groupBy, 'revenue', 'transactions'];
  }

  /* ================= PAGINATION & SORT ================= */
  @ViewChild(MatPaginator) revenuePaginator!: MatPaginator;
  @ViewChild(MatSort) revenueSort!: MatSort;

  /* ================= TOTALS ================= */
  totalRevenueAmount = 0;
  totalRevenueTransactions = 0;

  totalPeriodRevenue = 0;
  totalPeriodTransactions = 0;

  constructor(private reportService: ReportService) {}

  /* ================= INIT ================= */
  ngOnInit(): void {
    const today = new Date();
    const lastWeek = new Date(today);
    lastWeek.setDate(today.getDate() - 7);

const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

const yyyy = firstDayOfMonth.getFullYear();
const mm = String(firstDayOfMonth.getMonth() + 1).padStart(2, '0'); // Month is 0-based
const dd = String(firstDayOfMonth.getDate()).padStart(2, '0');

this.fromDate = `${yyyy}-${mm}-${dd}`; // "2026-01-01"

    // this.fromDate = lastWeek.toISOString().split('T')[0];
    this.toDate = today.toISOString().split('T')[0];

    this.loadAllReports();
  }

  /* ================= LOAD DATA ================= */
  loadAllReports(): void {
    if (!this.fromDate || !this.toDate) return;

    this.loading = true;
    this.error = '';

    /* ---------- Revenue by Plan & Payment ---------- */
    this.reportService.getRevenue(this.fromDate, this.toDate).subscribe({
      next: (res) => {
        this.revenueDataSource.data = res.data || [];
        this.calculateRevenueTotals();
      },
      error: () => this.error = 'Failed to load revenue data'
    });

    /* ---------- Summary ---------- */
    this.reportService.getRevenueSummary(this.fromDate, this.toDate).subscribe({
      next: (res) => this.summaryData = res.data || {},
      error: () => this.error = 'Failed to load summary'
    });

    /* ---------- Revenue by Period ---------- */
    this.reportService.getRevenueByPeriod(
      this.fromDate,
      this.toDate,
      this.groupBy
    ).subscribe({
      next: (res) => {
        this.periodDataSource.data = res.data || [];
        this.calculatePeriodTotals();
      },
      error: () => this.error = 'Failed to load period data',
      complete: () => {
        this.loading = false;

        /* Attach paginator & sort AFTER render */
        setTimeout(() => {
          this.revenueDataSource.paginator = this.revenuePaginator;
          this.revenueDataSource.sort = this.revenueSort;
        });
      }
    });
  }

  /* ================= EVENTS ================= */
  onGroupByChange(group: any): void {
    this.groupBy = group;
    this.loadAllReports();
  }

  onDateChange(): void {
    this.loadAllReports();
  }

  /* ================= TOTAL CALCULATIONS ================= */
  private calculateRevenueTotals(): void {
    const data = this.revenueDataSource.data;

    this.totalRevenueAmount = data.reduce(
      (sum, r) => sum + (Number(r.revenue) || 0),
      0
    );

    this.totalRevenueTransactions = data.reduce(
      (sum, r) => sum + (Number(r.transactions) || 0),
      0
    );
  }

  private calculatePeriodTotals(): void {
    const data = this.periodDataSource.data;

    this.totalPeriodRevenue = data.reduce(
      (sum, r) => sum + (Number(r.revenue) || 0),
      0
    );

    this.totalPeriodTransactions = data.reduce(
      (sum, r) => sum + (Number(r.transactions) || 0),
      0
    );
  }

 /* ================= EXPORT ================= */
exportToExcel(): void {
  console.log('Export to Excel clicked');

  // ===== Helper: auto-width columns =====
  const autoWidth = (data: any[]) => {
    const colWidths: { wch: number }[] = [];
    if (!data || data.length === 0) return [];
    const keys = Object.keys(data[0]);
    keys.forEach((key) => {
      const maxLength = Math.max(
        key.length,
        ...data.map(d => String(d[key] || '').length)
      );
      colWidths.push({ wch: maxLength + 2 });
    });
    return colWidths;
  };

  // ===== 1️⃣ Revenue by Plan & Payment Mode =====
  const revenueData = this.revenueDataSource?.data || [];

  const revenueSheetData = revenueData.map((r: any) => ({
    Plan: r.planName,
    'Payment Mode': r.paymentCategory,
    Transactions: r.transactions,
    Revenue: r.revenue
  }));

  // Blank row before totals
  revenueSheetData.push({
    Plan: '',
    'Payment Mode': '',
    Transactions: '',
    Revenue: ''
  });

  // Totals row
  revenueSheetData.push({
    Plan: 'Total',
    'Payment Mode': '',
    Transactions: this.totalRevenueTransactions || 0,
    Revenue: this.totalRevenueAmount || 0
  });

  const worksheet1: XLSX.WorkSheet = XLSX.utils.json_to_sheet(revenueSheetData);

  // Bold headers
  const headerRange1 = XLSX.utils.decode_range(worksheet1['!ref']!);
  for (let C = headerRange1.s.c; C <= headerRange1.e.c; ++C) {
    const cell_address = XLSX.utils.encode_cell({ c: C, r: 0 });
    if (worksheet1[cell_address]) worksheet1[cell_address].s = { font: { bold: true } };
  }

  worksheet1['!cols'] = autoWidth(revenueSheetData);

  // ===== 2️⃣ Revenue by dynamic groupBy =====
  const periodData = this.periodDataSource?.data || [];

  const periodSheetData = periodData.map((r: any) => {
    let firstColumn: string;

    switch (this.groupBy) {
      case 'day':
        firstColumn = new Date(r[this.groupBy]).toLocaleDateString('en-CA');
        break;
      case 'week':
        const start = new Date(r.periodStart).toLocaleDateString('en-CA');
        const end = new Date(r.periodEnd).toLocaleDateString('en-CA');
        firstColumn = `${start} → ${end}`;
        break;
      case 'month':
        firstColumn = new Date(r.monthStart).toLocaleDateString('en-CA', { month: 'short', year: 'numeric' });
        break;
      default:
        firstColumn = r[this.groupBy];
        break;
    }

    return {
      [this.groupBy === 'day' ? 'Date' : this.groupBy.charAt(0).toUpperCase() + this.groupBy.slice(1)]: firstColumn,
      Transactions: r.transactions,
      Revenue: r.revenue
    };
  });

  // Blank row before totals
  periodSheetData.push({
    [this.groupBy === 'day' ? 'Date' : this.groupBy.charAt(0).toUpperCase() + this.groupBy.slice(1)]: '',
    Transactions: '',
    Revenue: ''
  });

  // Totals row
  periodSheetData.push({
    [this.groupBy === 'day' ? 'Date' : this.groupBy.charAt(0).toUpperCase() + this.groupBy.slice(1)]: 'Total',
    Transactions: this.totalPeriodTransactions || 0,
    Revenue: this.totalPeriodRevenue || 0
  });

  const worksheet2: XLSX.WorkSheet = XLSX.utils.json_to_sheet(periodSheetData);

  // Bold headers
  const headerRange2 = XLSX.utils.decode_range(worksheet2['!ref']!);
  for (let C = headerRange2.s.c; C <= headerRange2.e.c; ++C) {
    const cell_address = XLSX.utils.encode_cell({ c: C, r: 0 });
    if (worksheet2[cell_address]) worksheet2[cell_address].s = { font: { bold: true } };
  }

  worksheet2['!cols'] = autoWidth(periodSheetData);

  // ===== 3️⃣ Create workbook =====
  const workbook: XLSX.WorkBook = {
    Sheets: {
      'Revenue by Plan': worksheet1,
      [`Revenue by ${this.groupBy.charAt(0).toUpperCase() + this.groupBy.slice(1)}`]: worksheet2
    },
    SheetNames: ['Revenue by Plan', `Revenue by ${this.groupBy.charAt(0).toUpperCase() + this.groupBy.slice(1)}`]
  };

  // ===== 4️⃣ Export =====
  const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array', cellStyles: true });
  const blob: Blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
  saveAs(blob, 'FinancialReports.xlsx');

  console.log('Export completed successfully!');
}
}
