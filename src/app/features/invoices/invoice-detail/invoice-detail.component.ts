import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { InvoicesService } from '../../../core/services/invoices.service';
import { Invoice } from '../../../core/models/invoice.model';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-invoice-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    StatusBadgeComponent,
  ],
  templateUrl: './invoice-detail.component.html',
})
export class InvoiceDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private invoicesService = inject(InvoicesService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  invoice = signal<Invoice | null>(null);
  loading = signal(true);
  actionLoading = signal(false);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.invoicesService.getById(id).subscribe({
      next: inv => {
        this.invoice.set(inv);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.router.navigate(['/invoices']);
      },
    });
  }

  cancelInvoice(): void {
    this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Cancelar factura',
        message: '¿Estás seguro de cancelar esta factura? Esta acción no se puede deshacer.',
        confirmText: 'Cancelar factura',
        danger: true,
      },
    }).afterClosed().subscribe(ok => {
      if (!ok) return;
      this.actionLoading.set(true);
      this.invoicesService.cancel(this.invoice()!.id).subscribe({
        next: inv => {
          this.invoice.set(inv);
          this.actionLoading.set(false);
          this.snackBar.open('Factura cancelada', 'OK', { duration: 3000 });
        },
        error: () => this.actionLoading.set(false),
      });
    });
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('es-EC', { day: '2-digit', month: 'long', year: 'numeric' });
  }
}
