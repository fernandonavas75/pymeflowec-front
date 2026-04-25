import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AppIconComponent } from '../../../shared/components/app-icon/app-icon.component';
import { forkJoin, of } from 'rxjs';
import { ProductsService } from '../../../core/services/products.service';
import { Product } from '../../../core/models/product.model';

@Component({
  selector: 'app-stock-adjust-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AppIconComponent],
  styles: [`:host { display: flex; flex-direction: column; overflow: hidden; }`],
  template: `
    <!-- Header -->
    <div class="ds-modal-head">
      <div>
        <div class="t">Gestionar stock</div>
        <div class="d">{{ product.name }}</div>
      </div>
      <button class="topbar-btn" (click)="ref.close()">
        <app-icon name="x" [size]="16" class="icon" />
      </button>
    </div>

    <!-- Body -->
    <div class="ds-modal-body" style="overflow-y:auto">

      <!-- Stock summary -->
      <div style="display:flex;align-items:center;gap:12px;background:var(--surface-2);border-radius:var(--radius-sm-ds);padding:14px 16px;margin-bottom:20px">
        <div style="text-align:center;flex:1">
          <div style="font-size:11px;color:var(--text-subtle);margin-bottom:4px">Stock actual</div>
          <div style="font-size:26px;font-weight:700;font-family:var(--font-display);letter-spacing:-0.02em"
               [style.color]="product.stock <= product.min_stock ? 'var(--danger)' : 'var(--text-ds)'">
            {{ product.stock }}
          </div>
          <div style="font-size:11px;color:var(--text-subtle)">unidades</div>
        </div>
        <app-icon name="chevron_right" [size]="18" style="color:var(--text-subtle)" />
        <div style="text-align:center;flex:1">
          <div style="font-size:11px;color:var(--text-subtle);margin-bottom:4px">Nuevo stock</div>
          <div style="font-size:26px;font-weight:700;font-family:var(--font-display);letter-spacing:-0.02em;color:var(--accent)">
            {{ newStock() }}
          </div>
          <div style="font-size:11px;color:var(--text-subtle)">unidades</div>
        </div>
        <div style="text-align:center;flex:1;margin-left:auto">
          <div style="font-size:11px;color:var(--text-subtle);margin-bottom:4px">Alerta en</div>
          <div style="font-size:22px;font-weight:700;font-family:var(--font-display);color:var(--warn)">
            {{ form.get('min_stock')?.value ?? product.min_stock }}
          </div>
          <div style="font-size:11px;color:var(--text-subtle)">unidades</div>
        </div>
      </div>

      <form [formGroup]="form">

        <p style="font-size:10.5px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:var(--text-subtle);margin-bottom:12px">
          Movimiento de stock
        </p>

        <div class="field">
          <label class="field-label">Tipo <span class="req">*</span></label>
          <select class="field-select" formControlName="movement_type">
            <option value="IN">Entrada — compra / recepción</option>
            <option value="OUT">Salida — merma / pérdida</option>
            <option value="ADJUSTMENT">Ajuste manual (valor exacto)</option>
          </select>
        </div>

        <div class="field">
          <label class="field-label">
            {{ form.get('movement_type')?.value === 'ADJUSTMENT' ? 'Nuevo total de stock' : 'Cantidad' }}
            <span class="req">*</span>
          </label>
          <input class="field-input" type="number" step="0.001" min="0" formControlName="quantity"
                 placeholder="0">
          @if (form.get('quantity')?.touched && form.get('quantity')?.invalid) {
            <span class="field-hint" style="color:var(--danger)">Ingresa una cantidad válida (mayor a 0)</span>
          }
        </div>

        <div class="field">
          <label class="field-label">Notas (opcional)</label>
          <input class="field-input" formControlName="notes" placeholder="Ej: Compra proveedor, conteo físico…">
        </div>

        <hr style="border:none;border-top:1px solid var(--border-ds);margin:16px 0 18px">

        <p style="font-size:10.5px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:var(--text-subtle);margin-bottom:4px">
          Alerta de reabastecimiento
        </p>
        <p style="font-size:12px;color:var(--text-subtle);margin-bottom:12px">
          Se muestra una alerta cuando el stock llegue a este nivel.
        </p>

        <div class="field">
          <label class="field-label">Stock mínimo para alertar</label>
          <input class="field-input" type="number" step="0.001" min="0" formControlName="min_stock">
          <span class="field-hint">Actual: {{ product.min_stock }}</span>
          @if (form.get('min_stock')?.touched && form.get('min_stock')?.invalid) {
            <span class="field-hint" style="color:var(--danger)">Ingresa un valor válido (0 o mayor)</span>
          }
        </div>

      </form>
    </div>

    <!-- Footer -->
    <div class="ds-modal-foot">
      <button class="btn ghost" (click)="ref.close()">Cancelar</button>
      <button class="btn primary" (click)="save()" [disabled]="form.invalid || saving">
        @if (saving) { <span class="btn-spinner"></span> }
        @else { <app-icon name="check" [size]="14" class="icon" /> }
        Guardar
      </button>
    </div>
  `,
})
export class StockAdjustDialogComponent {
  product: Product = inject(MAT_DIALOG_DATA);
  ref = inject(MatDialogRef<StockAdjustDialogComponent>);
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
