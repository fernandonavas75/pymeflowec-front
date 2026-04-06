import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { CashRegistersService } from '../../../core/services/cash-registers.service';
import { CashRegister } from '../../../core/models/cash-register.model';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-cash-register-detail',
  standalone: true,
  imports: [
    CommonModule, RouterLink, ReactiveFormsModule,
    MatButtonModule, MatIconModule, MatProgressSpinnerModule,
    MatTableModule, MatInputModule, MatSelectModule, MatDialogModule,
  ],
  templateUrl: './cash-register-detail.component.html',
})
export class CashRegisterDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private svc = inject(CashRegistersService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private fb = inject(FormBuilder);

  register = signal<CashRegister | null>(null);
  loading = signal(true);
  saving = signal(false);
  showCloseForm = signal(false);
  showMovementForm = signal(false);
  movCols = ['date', 'type', 'amount', 'description'];

  closeForm = this.fb.group({
    actual_amount: [null as number | null, [Validators.required, Validators.min(0)]],
    notes: [''],
  });

  movementForm = this.fb.group({
    movement_type: ['deposit', Validators.required],
    amount: [null as number | null, [Validators.required, Validators.min(0.01)]],
    description: [''],
  });

  ngOnInit(): void {
    const id = +this.route.snapshot.paramMap.get('id')!;
    this.svc.getById(id).subscribe({
      next: r => { this.register.set(r); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  closeRegister(): void {
    if (this.closeForm.invalid) return;
    this.saving.set(true);
    const v = this.closeForm.value;
    this.svc.close(this.register()!.id, { actual_amount: v.actual_amount!, notes: v.notes || undefined }).subscribe({
      next: updated => { this.register.set(updated); this.showCloseForm.set(false); this.saving.set(false); this.snackBar.open('Caja cerrada', 'OK', { duration: 3000 }); },
      error: (err) => { this.snackBar.open(err?.error?.message || 'Error', 'OK', { duration: 4000 }); this.saving.set(false); },
    });
  }

  addMovement(): void {
    if (this.movementForm.invalid) return;
    this.saving.set(true);
    const v = this.movementForm.value;
    this.svc.addMovement(this.register()!.id, { movement_type: v.movement_type as any, amount: v.amount!, description: v.description || undefined }).subscribe({
      next: updated => { this.register.set(updated); this.showMovementForm.set(false); this.movementForm.reset({ movement_type: 'deposit' }); this.saving.set(false); this.snackBar.open('Movimiento registrado', 'OK', { duration: 3000 }); },
      error: (err) => { this.snackBar.open(err?.error?.message || 'Error', 'OK', { duration: 4000 }); this.saving.set(false); },
    });
  }

  movTypeLabel(t: string): string {
    const m: Record<string, string> = { sale: 'Venta', withdrawal: 'Retiro', deposit: 'Depósito', refund: 'Reembolso', opening: 'Apertura', closing: 'Cierre' };
    return m[t] ?? t;
  }
}
