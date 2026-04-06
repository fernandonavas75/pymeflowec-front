import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatInputModule } from '@angular/material/input';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CashRegistersService } from '../../../core/services/cash-registers.service';
import { CashRegister } from '../../../core/models/cash-register.model';

@Component({
  selector: 'app-cash-registers-list',
  standalone: true,
  imports: [
    CommonModule, RouterLink, ReactiveFormsModule, MatTableModule, MatButtonModule,
    MatIconModule, MatPaginatorModule, MatTooltipModule, MatProgressSpinnerModule,
    MatInputModule, MatDialogModule,
  ],
  templateUrl: './cash-registers-list.component.html',
})
export class CashRegistersListComponent implements OnInit {
  private svc = inject(CashRegistersService);
  private snackBar = inject(MatSnackBar);
  private fb = inject(FormBuilder);

  registers = signal<CashRegister[]>([]);
  loading = signal(true);
  total = signal(0);
  page = signal(1);
  limit = signal(10);
  opening = signal(false);
  showOpenForm = signal(false);
  displayedColumns = ['id', 'status', 'opening_amount', 'opened_at', 'closed_at', 'actions'];

  openForm = this.fb.group({
    opening_amount: [0, [Validators.required, Validators.min(0)]],
  });

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.svc.list({ page: this.page(), limit: this.limit() }).subscribe({
      next: res => { this.registers.set(res.data); this.total.set(res.total); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  onPageChange(e: PageEvent): void { this.page.set(e.pageIndex + 1); this.limit.set(e.pageSize); this.load(); }

  openRegister(): void {
    if (this.openForm.invalid) return;
    this.opening.set(true);
    this.svc.open({ opening_amount: this.openForm.value.opening_amount ?? 0 }).subscribe({
      next: () => {
        this.snackBar.open('Caja abierta', 'OK', { duration: 3000 });
        this.showOpenForm.set(false);
        this.openForm.reset({ opening_amount: 0 });
        this.load();
        this.opening.set(false);
      },
      error: (err) => { this.snackBar.open(err?.error?.message || 'Error', 'OK', { duration: 4000 }); this.opening.set(false); },
    });
  }
}
