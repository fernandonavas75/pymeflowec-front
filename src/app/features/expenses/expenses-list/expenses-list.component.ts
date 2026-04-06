import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ExpensesService } from '../../../core/services/expenses.service';
import { Expense } from '../../../core/models/expense.model';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-expenses-list',
  standalone: true,
  imports: [
    CommonModule, RouterLink, ReactiveFormsModule,
    MatTableModule, MatButtonModule, MatIconModule,
    MatPaginatorModule, MatInputModule, MatSelectModule,
    MatTooltipModule, MatDialogModule,
  ],
  templateUrl: './expenses-list.component.html',
})
export class ExpensesListComponent implements OnInit {
  private svc = inject(ExpensesService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  expenses = signal<Expense[]>([]);
  loading = signal(true);
  total = signal(0);
  page = signal(1);
  limit = signal(10);
  searchCtrl = new FormControl('');
  displayedColumns = ['date', 'category', 'description', 'method', 'amount', 'status', 'actions'];

  ngOnInit(): void {
    this.load();
    this.searchCtrl.valueChanges.pipe(debounceTime(400), distinctUntilChanged()).subscribe(() => { this.page.set(1); this.load(); });
  }

  load(): void {
    this.loading.set(true);
    this.svc.list({ page: this.page(), limit: this.limit() }).subscribe({
      next: res => { this.expenses.set(res.data); this.total.set(res.total); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  onPageChange(e: PageEvent): void { this.page.set(e.pageIndex + 1); this.limit.set(e.pageSize); this.load(); }

  cancel(exp: Expense): void {
    this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Cancelar gasto', message: '¿Cancelar este gasto? No se puede deshacer.', confirmText: 'Cancelar gasto', danger: true },
    }).afterClosed().subscribe(ok => {
      if (!ok) return;
      this.svc.cancel(exp.id).subscribe({ next: () => { this.snackBar.open('Gasto cancelado', 'OK', { duration: 3000 }); this.load(); } });
    });
  }

  methodLabel(m: string | null | undefined): string {
    const map: Record<string, string> = { cash: 'Efectivo', transfer: 'Transferencia', card: 'Tarjeta', other: 'Otro' };
    return m ? (map[m] ?? m) : '—';
  }
}
