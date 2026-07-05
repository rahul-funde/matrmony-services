import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'ageCal'
})
export class AgeCalPipe implements PipeTransform {

  transform(value: string | Date): number {
    if (!value) return 0;
  
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "long",
      day: "numeric"
    };    
    const dobFormatted = new Intl.DateTimeFormat('mr-IN',options).format(new Date(value));
    console.log(`Date of Birth (Marathi) = ${dobFormatted}`);
    
    const today = new Date();
    const dob = new Date(value);
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    const dayDiff = today.getDate() - dob.getDate();
  
    if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
      age--;
    }
  
    console.log(`Age = ${age}`);
    return age;
  }

  // transform(value: string | Date): number {
  //   if(!value) return 0

  //   console.log("Value  = " + value);

  //   const today = new Date();
  //   const dob = new Date(value);
  //   let age = today.getFullYear() - dob.getFullYear();
  //   const monthDiff = today.getMonth() - dob.getMonth();
  //   const dayDiff = today.getDay() - today.getDay();

  
  //   if(monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)){
  //     age--;
  //   }
  //   console.log('Age = ' + age);
  //   return age;
  // }
}
