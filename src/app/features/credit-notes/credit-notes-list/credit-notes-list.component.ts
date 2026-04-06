import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CreditNotesService } from '../../../core/services/credit-notes.service';
import { CreditNote } from '../../../core/models/credit-note.model';

@Component({
  selector: 'app-credit-notes-list',
  standalone: true,
  imports: [
    CommonModule, RouterLink, MatTableModule, MatButtonModule,
    MatIconModule, MatPaginatorModule, MatTooltipModule, MatProgressSpinnerModule,
  ],
  templateUrl: './credit-notes-list.component.html',
})
export class CreditNotesListComponent implements OnInit {
  private svc = inject(CreditNotesService);

  notes = signal<CreditNote[]>([]);
  loading = signal(true);
  total = signal(0);
  page = signal(1);
  limit = signal(10);
  displayedColumns = ['number', 'invoice', 'reason', 'total', 'status', 'date', 'actions'];

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.svc.list({ page: this.page(), limit: this.limit() }).subscribe({
      next: res => { this.notes.set(res.data); this.total.set(res.total); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  onPageChange(e: PageEvent): void { this.page.set(e.pageIndex + 1); this.limit.set(e.pageSize); this.load(); }

  statusClass(s: string): string {
    return s === 'applied' ? 'bg-green-50 text-green-700' : s === 'cancelled' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700';
  }

  statusLabel(s: string): string {
    return s === 'applied' ? 'Aplicada' : s === 'cancelled' ? 'Cancelada' : 'Pendiente';
  }
}
