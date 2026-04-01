import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { OrdersService } from '../../../core/services/orders.service';
import { InvoicesService } from '../../../core/services/invoices.service';
import { Order } from '../../../core/models/order.model';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-order-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    StatusBadgeComponent,
  ],
  templateUrl: './order-detail.component.html',
})
export class OrderDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private ordersService = inject(OrdersService);
  private invoicesService = inject(InvoicesService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  order = signal<Order | null>(null);
  loading = signal(true);
  actionLoading = signal(false);

  readonly statusSteps = [
    { key: 'pending', label: 'Pendiente', icon: 'hourglass_empty' },
    { key: 'confirmed', label: 'Confirmado', icon: 'check_circle_outline' },
    { key: 'shipped', label: 'Enviado', icon: 'local_shipping' },
    { key: 'delivered', label: 'Entregado', icon: 'done_all' },
  ];

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.ordersService.getById(id).subscribe({
      next: order => {
        this.order.set(order);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.router.navigate(['/orders']);
      },
    });
  }

  getStepIndex(status: string): number {
    return this.statusSteps.findIndex(s => s.key === status);
  }

  confirm(): void {
    this.performAction('confirm', 'Confirmar pedido', '¿Confirmar este pedido?', 'Confirmar');
  }

  ship(): void {
    this.performAction('ship', 'Enviar pedido', '¿Marcar este pedido como enviado?', 'Enviar');
  }

  deliver(): void {
    this.performAction('deliver', 'Entregar pedido', '¿Marcar este pedido como entregado?', 'Entregar');
  }

  cancel(): void {
    this.performAction('cancel', 'Cancelar pedido', '¿Estás seguro de cancelar este pedido?', 'Cancelar', true);
  }

  private performAction(action: string, title: string, message: string, confirmText: string, danger = false): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: { title, message, confirmText, danger },
    });

    ref.afterClosed().subscribe(result => {
      if (!result) return;
      const orderId = this.order()!.id;
      this.actionLoading.set(true);

      const obs$ = action === 'confirm' ? this.ordersService.confirm(orderId)
        : action === 'ship' ? this.ordersService.ship(orderId)
        : action === 'deliver' ? this.ordersService.deliver(orderId)
        : this.ordersService.cancel(orderId);

      obs$.subscribe({
        next: updated => {
          this.order.set(updated);
          this.actionLoading.set(false);
          this.snackBar.open('Estado actualizado', 'OK', { duration: 3000, panelClass: ['success-snackbar'] });
        },
        error: () => this.actionLoading.set(false),
      });
    });
  }

  generateInvoice(): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Generar factura',
        message: '¿Generar factura para este pedido entregado?',
        confirmText: 'Generar',
      },
    });

    ref.afterClosed().subscribe(result => {
      if (!result) return;
      this.actionLoading.set(true);
      this.invoicesService.createFromOrder(this.order()!.id).subscribe({
        next: invoice => {
          this.actionLoading.set(false);
          this.snackBar.open('Factura generada', 'OK', { duration: 3000, panelClass: ['success-snackbar'] });
          this.router.navigate(['/invoices', invoice.id]);
        },
        error: () => this.actionLoading.set(false),
      });
    });
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('es-EC', { day: '2-digit', month: 'long', year: 'numeric' });
  }
}
