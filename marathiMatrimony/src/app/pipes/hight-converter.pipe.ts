import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'hightConverter'
})
export class HightConverterPipe implements PipeTransform {

  transform(value: unknown, ...args: unknown[]): unknown {
    return null;
  }

}
