import { Component, input, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './stat-card.component.html',
  styleUrls: ['./stat-card.component.scss'],
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
      indigo: { bg: 'border-indigo-500', text: 'text-indigo-500 dark:text-indigo-400', iconBg: 'bg-indigo-50 dark:bg-indigo-900/30' },
      green:  { bg: 'border-emerald-500', text: 'text-emerald-600 dark:text-emerald-400', iconBg: 'bg-emerald-50 dark:bg-emerald-900/30' },
      yellow: { bg: 'border-amber-500',   text: 'text-amber-600 dark:text-amber-400',   iconBg: 'bg-amber-50 dark:bg-amber-900/30' },
      blue:   { bg: 'border-blue-500',    text: 'text-blue-600 dark:text-blue-400',    iconBg: 'bg-blue-50 dark:bg-blue-900/30' },
      red:    { bg: 'border-red-500',     text: 'text-red-600 dark:text-red-400',     iconBg: 'bg-red-50 dark:bg-red-900/30' },
      purple: { bg: 'border-purple-500',  text: 'text-purple-600 dark:text-purple-400',  iconBg: 'bg-purple-50 dark:bg-purple-900/30' },
    };
    return colorMap[this.color()] || colorMap['indigo'];
  }
}
