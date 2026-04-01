import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SuppliersService } from '../../../core/services/suppliers.service';
import { Supplier } from '../../../core/models/supplier.model';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-suppliers-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatPaginatorModule,
    MatTooltipModule,
    MatDialogModule,
    StatusBadgeComponent,
  ],
  templateUrl: './suppliers-list.component.html',
})
export class SuppliersListComponent implements OnInit {
  private suppliersService = inject(SuppliersService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  suppliers = signal<Supplier[]>([]);
  loading = signal(true);
  total = signal(0);
  page = signal(1);
  limit = signal(20);

  searchCtrl = new FormControl('');
  statusCtrl = new FormControl('');

  displayedColumns = ['business_name', 'contact_name', 'email', 'phone', 'status', 'actions'];

  ngOnInit(): void {
    this.loadSuppliers();
    this.searchCtrl.valueChanges.pipe(debounceTime(400), distinctUntilChanged()).subscribe(() => {
      this.page.set(1);
      this.loadSuppliers();
    });
    this.statusCtrl.valueChanges.subscribe(() => {
      this.page.set(1);
      this.loadSuppliers();
    });
  }

  loadSuppliers(): void {
    this.loading.set(true);
    const params: Record<string, string | number | boolean | undefined> = {
      page: this.page(),
      limit: this.limit(),
    };
    if (this.searchCtrl.value) params['search'] = this.searchCtrl.value;
    if (this.statusCtrl.value) params['status'] = this.statusCtrl.value;

    this.suppliersService.list(params).subscribe({
      next: res => {
        this.suppliers.set(res.data);
        this.total.set(res.total);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onPageChange(event: PageEvent): void {
    this.page.set(event.pageIndex + 1);
    this.limit.set(event.pageSize);
    this.loadSuppliers();
  }

  toggleStatus(supplier: Supplier): void {
    const action = supplier.status === 'active'
      ? this.suppliersService.deactivate(supplier.id)
      : this.suppliersService.activate(supplier.id);

    action.subscribe({
      next: () => {
        this.snackBar.open(
          supplier.status === 'active' ? 'Proveedor desactivado' : 'Proveedor activado',
          'OK',
          { duration: 3000, panelClass: ['success-snackbar'] }
        );
        this.loadSuppliers();
      },
    });
  }

  deleteSupplier(supplier: Supplier): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Eliminar proveedor',
        message: `¿Estás seguro de eliminar "${supplier.business_name}"?`,
        confirmText: 'Eliminar',
        danger: true,
      },
    });

    ref.afterClosed().subscribe(result => {
      if (result) {
        this.suppliersService.remove(supplier.id).subscribe({
          next: () => {
            this.snackBar.open('Proveedor eliminado', 'OK', { duration: 3000, panelClass: ['success-snackbar'] });
            this.loadSuppliers();
          },
        });
      }
    });
  }
}
