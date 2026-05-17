import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'kz',
  standalone: true,
})
export class KzPipe implements PipeTransform {
  transform(value: number | null | undefined): string {
    const amount = Number(value ?? 0);
    return `${new Intl.NumberFormat('pt-AO', { maximumFractionDigits: 0 }).format(amount)} Kz`;
  }
}
