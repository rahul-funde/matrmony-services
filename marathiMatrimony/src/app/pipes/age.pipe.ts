import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'age'
})
export class AgePipe implements PipeTransform {

  transform(value: string | Date): number {
    if(!value) return 0

    const today = new Date();
    const dob = new Date(value);
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    const dayDiff = today.getDay() - today.getDay();

    if(monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)){
      age--;
    }
    return age;

  }

}
