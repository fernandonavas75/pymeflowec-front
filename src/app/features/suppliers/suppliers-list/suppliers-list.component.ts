import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged, finalize } from 'rxjs';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SuppliersService } from '../../../core/services/suppliers.service';
import { Supplier } from '../../../core/models/supplier.model';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { AuthService } from '../../../core/services/auth.service';

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
    MatPaginatorModule,
    MatTooltipModule,
    MatDialogModule,
  ],
  templateUrl: './suppliers-list.component.html',
})
export class SuppliersListComponent implements OnInit {
  private suppliersService = inject(SuppliersService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  authService = inject(AuthService);

  suppliers = signal<Supplier[]>([]);
  loading = signal(true);
  total = signal(0);
  page = signal(1);
  limit = signal(20);

  searchCtrl = new FormControl('');

  displayedColumns = ['name', 'ruc', 'email', 'phone', 'actions'];

  ngOnInit(): void {
    this.loadSuppliers();
    this.searchCtrl.valueChanges.pipe(debounceTime(400), distinctUntilChanged()).subscribe(() => {
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

    this.suppliersService.list(params).pipe(
      finalize(() => this.loading.set(false))
    ).subscribe({
      next: res => { this.suppliers.set(res.data ?? []); this.total.set(res.total ?? 0); },
      error: ()  => this.suppliers.set([]),
    });
  }

  onPageChange(event: PageEvent): void {
    this.page.set(event.pageIndex + 1);
    this.limit.set(event.pageSize);
    this.loadSuppliers();
  }

  canEdit(): boolean {
    return this.authService.isSystemUser() || this.authService.isStoreAdmin();
  }

  deleteSupplier(supplier: Supplier): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Eliminar proveedor',
        message: `¿Estás seguro de eliminar "${supplier.name}"?`,
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
          error: () => {},
        });
      }
    });
  }
}
