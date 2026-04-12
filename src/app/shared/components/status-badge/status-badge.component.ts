import { Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

type BadgeType = 'order' | 'invoice' | 'user' | 'product' | 'supplier';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './status-badge.component.html',
})
export class StatusBadgeComponent {
  status = input<string>('');
  type = input<BadgeType>('order');

  badgeClasses = computed(() => {
    const s = this.status();
    const t = this.type();

    if (t === 'order') {
      const map: Record<string, string> = {
        pending:   'bg-amber-100   text-amber-800   dark:bg-amber-900/30   dark:text-amber-300',
        confirmed: 'bg-blue-100    text-blue-800    dark:bg-blue-900/30    dark:text-blue-300',
        shipped:   'bg-indigo-100  text-indigo-800  dark:bg-indigo-900/30  dark:text-indigo-300',
        delivered: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
        cancelled: 'bg-red-100     text-red-800     dark:bg-red-900/30     dark:text-red-300',
      };
      return map[s] || 'bg-slate-100 text-slate-700 dark:bg-slate-700/40 dark:text-slate-300';
    }

    if (t === 'invoice') {
      const map: Record<string, string> = {
        pending:   'bg-blue-100    text-blue-800    dark:bg-blue-900/30    dark:text-blue-300',
        paid:      'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
        overdue:   'bg-red-100     text-red-800     dark:bg-red-900/30     dark:text-red-300',
        cancelled: 'bg-slate-100   text-slate-700   dark:bg-slate-700/40   dark:text-slate-300',
      };
      return map[s] || 'bg-slate-100 text-slate-700 dark:bg-slate-700/40 dark:text-slate-300';
    }

    // user, product, supplier
    const map: Record<string, string> = {
      active:   'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
      inactive: 'bg-slate-100   text-slate-700   dark:bg-slate-700/40   dark:text-slate-300',
    };
    return map[s] || 'bg-slate-100 text-slate-700 dark:bg-slate-700/40 dark:text-slate-300';
  });

  badgeLabel = computed(() => {
    const labels: Record<string, string> = {
      pending: 'Pendiente',
      confirmed: 'Confirmado',
      shipped: 'Enviado',
      delivered: 'Entregado',
      cancelled: 'Cancelado',
      paid: 'Pagada',
      overdue: 'Vencida',
      active: 'Activo',
      inactive: 'Inactivo',
    };
    return labels[this.status()] || this.status();
  });
}
