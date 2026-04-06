import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { PaymentsService } from '../../../core/services/payments.service';
import { Payment } from '../../../core/models/payment.model';

const METHOD_LABELS: Record<string, string> = {
  cash: 'Efectivo', transfer: 'Transferencia', card: 'Tarjeta', credit: 'Crédito', other: 'Otro',
};

@Component({
  selector: 'app-payments-list',
  standalone: true,
  imports: [
    CommonModule, RouterLink, ReactiveFormsModule,
    MatTableModule, MatButtonModule, MatIconModule,
    MatPaginatorModule, MatInputModule, MatTooltipModule,
  ],
  templateUrl: './payments-list.component.html',
})
export class PaymentsListComponent implements OnInit {
  private svc = inject(PaymentsService);

  payments = signal<Payment[]>([]);
  loading = signal(true);
  total = signal(0);
  page = signal(1);
  limit = signal(10);
  searchCtrl = new FormControl('');
  displayedColumns = ['date', 'invoice', 'method', 'amount', 'reference'];
  methodLabel = (m: string) => METHOD_LABELS[m] ?? m;

  ngOnInit(): void {
    this.load();
    this.searchCtrl.valueChanges.pipe(debounceTime(400), distinctUntilChanged()).subscribe(() => { this.page.set(1); this.load(); });
  }

  load(): void {
    this.loading.set(true);
    const params: Record<string, string | number | boolean | undefined> = { page: this.page(), limit: this.limit() };
    if (this.searchCtrl.value) params['search'] = this.searchCtrl.value;
    this.svc.list(params).subscribe({
      next: res => { this.payments.set(res.data); this.total.set(res.total); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  onPageChange(e: PageEvent): void { this.page.set(e.pageIndex + 1); this.limit.set(e.pageSize); this.load(); }
}
