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
        pending: 'bg-yellow-100 text-yellow-800',
        confirmed: 'bg-blue-100 text-blue-800',
        shipped: 'bg-indigo-100 text-indigo-800',
        delivered: 'bg-green-100 text-green-800',
        cancelled: 'bg-red-100 text-red-800',
      };
      return map[s] || 'bg-gray-100 text-gray-800';
    }

    if (t === 'invoice') {
      const map: Record<string, string> = {
        issued: 'bg-blue-100 text-blue-800',
        paid: 'bg-green-100 text-green-800',
        overdue: 'bg-red-100 text-red-800',
        cancelled: 'bg-gray-100 text-gray-800',
      };
      return map[s] || 'bg-gray-100 text-gray-800';
    }

    // user, product, supplier
    const map: Record<string, string> = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-700',
    };
    return map[s] || 'bg-gray-100 text-gray-800';
  });

  badgeLabel = computed(() => {
    const labels: Record<string, string> = {
      pending: 'Pendiente',
      confirmed: 'Confirmado',
      shipped: 'Enviado',
      delivered: 'Entregado',
      cancelled: 'Cancelado',
      issued: 'Emitida',
      paid: 'Pagada',
      overdue: 'Vencida',
      active: 'Activo',
      inactive: 'Inactivo',
    };
    return labels[this.status()] || this.status();
  });
}
