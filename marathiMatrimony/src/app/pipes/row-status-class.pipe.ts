import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'rowStatusClass',
  standalone: true
})
export class RowStatusClassPipe implements PipeTransform {
  transform(endDate: string): string {

    if (!endDate) return '';

    const today = new Date();
    const expiry = new Date(endDate);

    // remove time
    today.setHours(0,0,0,0);
    expiry.setHours(0,0,0,0);

    const diffInDays =
      (expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);

    if (diffInDays < 0) return 'expired-row';
    if (diffInDays <= 5) return 'warning-row';

    return 'active-row';
  }
}
