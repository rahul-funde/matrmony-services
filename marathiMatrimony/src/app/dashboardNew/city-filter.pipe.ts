import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'cityFilter' })
export class CityFilterPipe implements PipeTransform {
  transform(list: any[], city: string): any[] {
    if (!city) return list;
    return list.filter(item => item.city.toLowerCase().includes(city.toLowerCase()));
  }
}
