import { Component, input, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './stat-card.component.html',
})
export class StatCardComponent implements OnInit {
  title = input<string>('');
  value = input<number | string>(0);
  subtitle = input<string>('');
  icon = input<string>('analytics');
  color = input<string>('indigo');
  trend = input<'up' | 'down' | 'neutral'>('neutral');
  trendValue = input<string>('');

  displayValue = signal<string>('0');

  ngOnInit(): void {
    const val = this.value();
    if (typeof val === 'number') {
      this.animateCounter(val);
    } else {
      this.displayValue.set(val);
    }
  }

  private animateCounter(target: number): void {
    const duration = 800;
    const steps = 30;
    const stepTime = duration / steps;
    let current = 0;
    const increment = target / steps;

    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        current = target;
        clearInterval(timer);
      }
      this.displayValue.set(this.formatValue(Math.floor(current)));
    }, stepTime);
  }

  private formatValue(val: number): string {
    const orig = this.value();
    if (typeof orig === 'string' && orig.startsWith('$')) {
      return '$' + val.toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    return val.toLocaleString();
  }

  get colorClasses(): { bg: string; text: string; iconBg: string } {
    const colorMap: Record<string, { bg: string; text: string; iconBg: string }> = {
      indigo: { bg: 'border-indigo-500', text: 'text-indigo-600', iconBg: 'bg-indigo-50' },
      green: { bg: 'border-green-500', text: 'text-green-600', iconBg: 'bg-green-50' },
      yellow: { bg: 'border-yellow-500', text: 'text-yellow-600', iconBg: 'bg-yellow-50' },
      blue: { bg: 'border-blue-500', text: 'text-blue-600', iconBg: 'bg-blue-50' },
      red: { bg: 'border-red-500', text: 'text-red-600', iconBg: 'bg-red-50' },
      purple: { bg: 'border-purple-500', text: 'text-purple-600', iconBg: 'bg-purple-50' },
    };
    return colorMap[this.color()] || colorMap['indigo'];
  }
}
