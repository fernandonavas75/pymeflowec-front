import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { CreditNotesService } from '../../../core/services/credit-notes.service';
import { CreditNote } from '../../../core/models/credit-note.model';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-credit-note-detail',
  standalone: true,
  imports: [
    CommonModule, RouterLink, MatButtonModule, MatIconModule,
    MatProgressSpinnerModule, MatTableModule, MatDialogModule,
  ],
  templateUrl: './credit-note-detail.component.html',
})
export class CreditNoteDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private svc = inject(CreditNotesService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  note = signal<CreditNote | null>(null);
  loading = signal(true);
  displayedColumns = ['product', 'quantity', 'unit_price', 'subtotal'];

  ngOnInit(): void {
    const id = +this.route.snapshot.paramMap.get('id')!;
    this.svc.getById(id).subscribe({
      next: n => { this.note.set(n); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  applyNote(): void {
    const n = this.note();
    if (!n) return;
    this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Aplicar nota de crédito', message: '¿Aplicar esta nota de crédito? El stock será repuesto.', confirmText: 'Aplicar' },
    }).afterClosed().subscribe(ok => {
      if (!ok) return;
      this.svc.updateStatus(n.id, 'applied').subscribe({
        next: updated => { this.note.set(updated); this.snackBar.open('Nota de crédito aplicada', 'OK', { duration: 3000 }); },
        error: (err) => this.snackBar.open(err?.error?.message || 'Error', 'OK', { duration: 4000 }),
      });
    });
  }

  cancelNote(): void {
    const n = this.note();
    if (!n) return;
    this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Cancelar nota de crédito', message: '¿Cancelar esta nota de crédito?', confirmText: 'Cancelar NC', danger: true },
    }).afterClosed().subscribe(ok => {
      if (!ok) return;
      this.svc.updateStatus(n.id, 'cancelled').subscribe({
        next: updated => { this.note.set(updated); this.snackBar.open('Nota de crédito cancelada', 'OK', { duration: 3000 }); },
        error: (err) => this.snackBar.open(err?.error?.message || 'Error', 'OK', { duration: 4000 }),
      });
    });
  }

  statusClass(s: string): string {
    return s === 'applied' ? 'bg-green-50 text-green-700' : s === 'cancelled' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700';
  }

  statusLabel(s: string): string {
    return s === 'applied' ? 'Aplicada' : s === 'cancelled' ? 'Cancelada' : 'Pendiente';
  }
}
