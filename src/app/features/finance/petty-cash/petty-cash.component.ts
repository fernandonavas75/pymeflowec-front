import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl, FormGroup, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { PettyCashService } from '../../../core/services/petty-cash.service';
import {
  PettyCash, PettyCashMovement,
  PettyCashMovementType, MOVEMENT_TYPE_LABELS,
} from '../../../core/models/petty-cash.model';
import { AppIconComponent } from '../../../shared/components/app-icon/app-icon.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-petty-cash',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AppIconComponent],
  templateUrl: './petty-cash.component.html',
})
export class PettyCashComponent implements OnInit {
  private svc      = inject(PettyCashService);
  private snackBar = inject(MatSnackBar);
  private dialog   = inject(MatDialog);
  authService      = inject(AuthService);

  readonly MOVEMENT_TYPE_LABELS = MOVEMENT_TYPE_LABELS;

  // Session state
  session         = signal<PettyCash | null>(null);
  sessionLoading  = signal(true);
  pastSessions    = signal<PettyCash[]>([]);
  historyLoading  = signal(false);
  showHistory     = signal(false);

  // Movements
  movements        = signal<PettyCashMovement[]>([]);
  movementsLoading = signal(false);
  movementsTotal   = signal(0);
  movementsPage    = signal(1);
  readonly PAGE_SIZE = 20;
  hasMore = computed(() => this.movements().length < this.movementsTotal());

  // Move form
  showMoveForm  = signal(false);
  moveFormLoading = signal(false);
  moveForm = new FormGroup({
    movement_type: new FormControl<PettyCashMovementType>('EXPENSE', Validators.required),
    amount:        new FormControl<number | null>(null, [Validators.required, Validators.min(0.01)]),
    description:   new FormControl('', Validators.required),
    voucher_number: new FormControl(''),
  });

  // Open session form
  showOpenForm  = signal(false);
  openFormLoading = signal(false);
  openForm = new FormGroup({
    opening_amount: new FormControl<number | null>(null, [Validators.required, Validators.min(0.01)]),
    name:           new FormControl('Caja Chica'),
    notes:          new FormControl(''),
  });

  // Close session form
  showCloseForm   = signal(false);
  closeFormLoading = signal(false);
  closeForm = new FormGroup({
    closing_amount_reported: new FormControl<number | null>(null),
    notes:                   new FormControl(''),
  });

  ngOnInit(): void {
    this.loadSession();
  }

  loadSession(): void {
    this.sessionLoading.set(true);
    this.svc.getOpen()
      .pipe(finalize(() => this.sessionLoading.set(false)))
      .subscribe({
        next: s => {
          this.session.set(s);
          if (s) this.loadMovements(true);
        },
        error: () => this.session.set(null),
      });
  }

  loadMovements(reset = false): void {
    const s = this.session();
    if (!s) return;
    if (reset) {
      this.movementsPage.set(1);
      this.movements.set([]);
    }
    this.movementsLoading.set(true);
    this.svc.listMovements(s.id, { page: this.movementsPage(), limit: this.PAGE_SIZE })
      .pipe(finalize(() => this.movementsLoading.set(false)))
      .subscribe({
        next: res => {
          this.movements.update(list => reset ? res.data : [...list, ...res.data]);
          this.movementsTotal.set(res.total);
        },
        error: () => {},
      });
  }

  loadMore(): void {
    this.movementsPage.update(p => p + 1);
    this.loadMovements(false);
  }

  openMoveForm(type: PettyCashMovementType = 'EXPENSE'): void {
    this.moveForm.reset({ movement_type: type, amount: null, description: '', voucher_number: '' });
    this.showMoveForm.set(true);
  }

  submitMovement(): void {
    if (this.moveForm.invalid) return;
    const s = this.session();
    if (!s) return;
    const val = this.moveForm.value;
    this.moveFormLoading.set(true);
    this.svc.addMovement(s.id, {
      movement_type:  val.movement_type!,
      amount:         val.amount!,
      description:    val.description!,
      voucher_number: val.voucher_number || undefined,
    }).pipe(finalize(() => this.moveFormLoading.set(false)))
      .subscribe({
        next: mov => {
          this.movements.update(list => [mov, ...list]);
          this.movementsTotal.update(t => t + 1);
          this.showMoveForm.set(false);
          this.snackBar.open('Movimiento registrado', 'OK', { duration: 3000 });
          // reload session to get updated balance
          this.svc.getOpen().subscribe({ next: s2 => this.session.set(s2) });
        },
        error: (err) => {
          const msg = err?.error?.message ?? 'Error al registrar el movimiento';
          this.snackBar.open(msg, 'Cerrar', { duration: 4000 });
        },
      });
  }

  submitOpen(): void {
    if (this.openForm.invalid) return;
    const val = this.openForm.value;
    this.openFormLoading.set(true);
    this.svc.open({
      opening_amount: val.opening_amount!,
      name:           val.name || 'Caja Chica',
      notes:          val.notes || undefined,
    }).pipe(finalize(() => this.openFormLoading.set(false)))
      .subscribe({
        next: s => {
          this.session.set(s);
          this.movements.set([]);
          this.movementsTotal.set(0);
          this.showOpenForm.set(false);
          this.snackBar.open('Caja chica abierta', 'OK', { duration: 3000 });
        },
        error: (err) => {
          const msg = err?.error?.message ?? 'Error al abrir la caja';
          this.snackBar.open(msg, 'Cerrar', { duration: 4000 });
        },
      });
  }

  submitClose(): void {
    const s = this.session();
    if (!s) return;
    this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Cerrar caja chica',
        message: `¿Cerrar la sesión "${s.name}"? No se podrán agregar más movimientos.`,
        confirmText: 'Cerrar caja',
        danger: false,
      },
    }).afterClosed().subscribe(ok => {
      if (!ok) return;
      const val = this.closeForm.value;
      this.closeFormLoading.set(true);
      this.svc.close(s.id, {
        closing_amount_reported: val.closing_amount_reported ?? undefined,
        notes: val.closing_amount_reported ? (val.notes || undefined) : undefined,
      }).pipe(finalize(() => this.closeFormLoading.set(false)))
        .subscribe({
          next: () => {
            this.session.set(null);
            this.movements.set([]);
            this.movementsTotal.set(0);
            this.showCloseForm.set(false);
            this.snackBar.open('Caja chica cerrada', 'OK', { duration: 3000 });
          },
          error: () => this.snackBar.open('Error al cerrar la caja', 'Cerrar', { duration: 4000 }),
        });
    });
  }

  loadHistory(): void {
    if (this.pastSessions().length > 0) {
      this.showHistory.update(v => !v);
      return;
    }
    this.historyLoading.set(true);
    this.showHistory.set(true);
    this.svc.list({ limit: 20 })
      .pipe(finalize(() => this.historyLoading.set(false)))
      .subscribe({
        next: res => this.pastSessions.set(res.data.filter(s => s.status === 'CLOSED')),
        error: () => {},
      });
  }

  balancePct(s: PettyCash): number {
    return Math.min(100, Math.round((s.current_balance / Math.max(s.opening_amount, 1)) * 100));
  }

  formatDT(date: string): string {
    const d = new Date(date);
    return d.toLocaleDateString('es-EC', { day: '2-digit', month: '2-digit', year: '2-digit' })
      + ' ' + d.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' });
  }
}
