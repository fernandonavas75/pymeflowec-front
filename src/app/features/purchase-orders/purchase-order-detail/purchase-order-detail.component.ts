import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormArray, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { PurchaseOrdersService } from '../../../core/services/purchase-orders.service';
import { PurchaseOrder } from '../../../core/models/purchase-order.model';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-purchase-order-detail',
  standalone: true,
  imports: [
    CommonModule, RouterLink, ReactiveFormsModule,
    MatButtonModule, MatIconModule, MatProgressSpinnerModule,
    MatTableModule, MatInputModule, MatDialogModule,
  ],
  templateUrl: './purchase-order-detail.component.html',
})
export class PurchaseOrderDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private svc = inject(PurchaseOrdersService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private fb = inject(FormBuilder);

  order = signal<PurchaseOrder | null>(null);
  loading = signal(true);
  receiving = signal(false);
  showReceiveForm = signal(false);
  displayedColumns = ['product', 'ordered', 'received', 'cost', 'subtotal'];

  receiveForm = this.fb.group({ items: this.fb.array([]) });
  get receiveItems(): FormArray { return this.receiveForm.get('items') as FormArray; }

  ngOnInit(): void {
    const id = +this.route.snapshot.paramMap.get('id')!;
    this.svc.getById(id).subscribe({
      next: o => { this.order.set(o); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  openReceiveForm(): void {
    const o = this.order();
    if (!o) return;
    while (this.receiveItems.length) this.receiveItems.removeAt(0);
    o.items.forEach(item => {
      const pending = item.quantity_ordered - item.quantity_received;
      this.receiveItems.push(this.fb.group({
        product_id: [item.product_id],
        product_name: [item.product?.name ?? `#${item.product_id}`],
        pending: [pending],
        quantity_received: [pending, [Validators.required, Validators.min(0), Validators.max(pending)]],
      }));
    });
    this.showReceiveForm.set(true);
  }

  submitReceive(): void {
    if (this.receiveForm.invalid) return;
    this.receiving.set(true);
    const dto = {
      items: (this.receiveForm.value.items as any[])
        .filter(i => i.quantity_received > 0)
        .map(i => ({ product_id: i.product_id, quantity_received: +i.quantity_received })),
    };
    if (dto.items.length === 0) { this.snackBar.open('Ingresa al menos una cantidad', 'OK', { duration: 3000 }); this.receiving.set(false); return; }
    this.svc.receive(this.order()!.id, dto).subscribe({
      next: updated => { this.order.set(updated); this.showReceiveForm.set(false); this.receiving.set(false); this.snackBar.open('Recepción registrada', 'OK', { duration: 3000 }); },
      error: (err) => { this.snackBar.open(err?.error?.message || 'Error', 'OK', { duration: 4000 }); this.receiving.set(false); },
    });
  }

  cancelOrder(): void {
    this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Cancelar orden', message: '¿Cancelar esta orden de compra?', confirmText: 'Cancelar orden', danger: true },
    }).afterClosed().subscribe(ok => {
      if (!ok) return;
      this.svc.updateStatus(this.order()!.id, 'cancelled').subscribe({
        next: updated => { this.order.set(updated); this.snackBar.open('Orden cancelada', 'OK', { duration: 3000 }); },
        error: (err) => this.snackBar.open(err?.error?.message || 'Error', 'OK', { duration: 4000 }),
      });
    });
  }

  statusClass(s: string): string {
    const map: Record<string, string> = { pending: 'bg-amber-50 text-amber-700', partial: 'bg-blue-50 text-blue-700', received: 'bg-green-50 text-green-700', cancelled: 'bg-red-50 text-red-700' };
    return map[s] ?? 'bg-gray-50 text-gray-600';
  }

  statusLabel(s: string): string {
    const map: Record<string, string> = { pending: 'Pendiente', partial: 'Parcial', received: 'Recibida', cancelled: 'Cancelada' };
    return map[s] ?? s;
  }
}
