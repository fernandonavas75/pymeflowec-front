import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar } from '@angular/material/snack-bar';
import { forkJoin, of } from 'rxjs';
import { ProductsService } from '../../../core/services/products.service';
import { Product } from '../../../core/models/product.model';

@Component({
  selector: 'app-stock-adjust-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule,
    MatInputModule, MatSelectModule, MatButtonModule,
    MatIconModule, MatProgressSpinnerModule, MatDividerModule,
  ],
  template: `
    <h2 mat-dialog-title class="text-lg font-semibold">Gestionar stock</h2>
    <mat-dialog-content class="min-w-96">
      <p class="text-sm text-gray-500 mb-4 font-medium">{{ product.name }}</p>

      <!-- Resumen actual -->
      <div class="flex items-center gap-6 py-3 mb-5 bg-gray-50 rounded-lg px-4">
        <div class="text-center">
          <p class="text-xs text-gray-400 mb-1">Stock actual</p>
          <p class="text-2xl font-bold"
            [class.text-red-600]="product.stock <= product.min_stock"
            [class.text-gray-900]="product.stock > product.min_stock">
            {{ product.stock }}
          </p>
          <p class="text-xs text-gray-400">unidades</p>
        </div>
        <mat-icon class="text-gray-300">arrow_forward</mat-icon>
        <div class="text-center">
          <p class="text-xs text-gray-400 mb-1">Nuevo stock</p>
          <p class="text-2xl font-bold text-indigo-600">{{ newStock() }}</p>
          <p class="text-xs text-gray-400">unidades</p>
        </div>
        <div class="ml-auto text-center">
          <p class="text-xs text-gray-400 mb-1">Alerta activa en</p>
          <p class="text-xl font-bold text-amber-600">{{ form.get('min_stock')?.value ?? product.min_stock }}</p>
          <p class="text-xs text-gray-400">unidades</p>
        </div>
      </div>

      <form [formGroup]="form" class="flex flex-col gap-4">

        <!-- Sección: movimiento de stock -->
        <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Movimiento de stock</p>

        <mat-form-field appearance="outline">
          <mat-label>Tipo</mat-label>
          <mat-select formControlName="movement_type">
            <mat-option value="IN">Entrada &mdash; compra / recepcion</mat-option>
            <mat-option value="OUT">Salida &mdash; merma / perdida</mat-option>
            <mat-option value="ADJUSTMENT">Ajuste manual (establece valor exacto)</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>{{ form.get('movement_type')?.value === 'adjustment' ? 'Nuevo total de stock' : 'Cantidad' }}</mat-label>
          <input matInput type="number" step="0.001" min="0" formControlName="quantity">
          @if (form.get('quantity')?.touched && form.get('quantity')?.invalid) {
            <mat-error>Ingresa una cantidad valida (mayor a 0)</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Notas (opcional)</mat-label>
          <input matInput formControlName="notes" placeholder="Ej: Compra proveedor, conteo físico...">
        </mat-form-field>

        <mat-divider />

        <!-- Sección: alerta de reabastecimiento -->
        <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Alerta de reabastecimiento</p>
        <p class="text-xs text-gray-400 -mt-2">
          Se muestra una alerta en la lista cuando el stock llega a este nivel.
        </p>

        <mat-form-field appearance="outline">
          <mat-label>Stock minimo para alertar</mat-label>
          <mat-icon matPrefix>notifications_active</mat-icon>
          <input matInput type="number" step="0.001" min="0" formControlName="min_stock">
          <mat-hint>Actual: {{ product.min_stock }}</mat-hint>
          @if (form.get('min_stock')?.touched && form.get('min_stock')?.invalid) {
            <mat-error>Ingresa un valor valido (0 o mayor)</mat-error>
          }
        </mat-form-field>

      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-stroked-button mat-dialog-close>Cancelar</button>
      <button mat-flat-button color="primary" (click)="save()" [disabled]="form.invalid || saving">
        @if (saving) {
          <mat-spinner diameter="18" class="inline-block"></mat-spinner>
        } @else {
          Guardar
        }
      </button>
    </mat-dialog-actions>
  `,
})
export class StockAdjustDialogComponent {
  product: Product = inject(MAT_DIALOG_DATA);
  private ref = inject(MatDialogRef<StockAdjustDialogComponent>);
  private svc = inject(ProductsService);
  private snackBar = inject(MatSnackBar);
  private fb = inject(FormBuilder);

  saving = false;

  form = this.fb.group({
    movement_type: ['IN', Validators.required],
    quantity: [null as number | null, [Validators.required, Validators.min(1)]],
    notes: [''],
    min_stock: [this.product.min_stock, [Validators.required, Validators.min(0)]],
  });

  newStock(): number {
    const v = this.form.value;
    const qty = +(v.quantity ?? 0);
    if (v.movement_type === 'IN') return this.product.stock + qty;
    if (v.movement_type === 'OUT') return Math.max(0, this.product.stock - qty);
    if (v.movement_type === 'ADJUSTMENT') return qty;
    return this.product.stock;
  }

  save(): void {
    if (this.form.invalid) return;
    this.saving = true;
    const v = this.form.value;

    const stockCall$ = this.svc.adjustStock(this.product.id, {
      quantity: v.quantity!,
      movement_type: v.movement_type as 'IN' | 'OUT' | 'ADJUSTMENT',
      reference_type: 'MANUAL',
      notes: v.notes || undefined,
    });

    const minStockChanged = v.min_stock !== this.product.min_stock;
    const updateCall$ = minStockChanged
      ? this.svc.update(this.product.id, { min_stock: v.min_stock! })
      : of(null);

    forkJoin([stockCall$, updateCall$]).subscribe({
      next: () => {
        this.snackBar.open('Cambios guardados', 'OK', { duration: 3000 });
        this.ref.close(true);
      },
      error: (err) => {
        this.snackBar.open(err?.error?.message || 'Error al guardar', 'OK', { duration: 4000 });
        this.saving = false;
      },
    });
  }
}
