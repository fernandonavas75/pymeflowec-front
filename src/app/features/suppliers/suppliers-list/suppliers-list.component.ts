import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormControl, Validators } from '@angular/forms';
import { startWith, finalize } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SuppliersService } from '../../../core/services/suppliers.service';
import { ProductsService } from '../../../core/services/products.service';
import { Supplier } from '../../../core/models/supplier.model';
import { Product } from '../../../core/models/product.model';
import { AppIconComponent } from '../../../shared/components/app-icon/app-icon.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-suppliers-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AppIconComponent],
  templateUrl: './suppliers-list.component.html',
})
export class SuppliersListComponent implements OnInit {
  private suppliersService = inject(SuppliersService);
  private productsService  = inject(ProductsService);
  private dialog           = inject(MatDialog);
  private snackBar         = inject(MatSnackBar);
  private fb               = inject(FormBuilder);
  authService              = inject(AuthService);

  private allSuppliers = signal<Supplier[]>([]);
  private allProducts  = signal<Product[]>([]);
  loading   = signal(true);
  tab       = signal<'all' | 'ruc' | 'no_ruc'>('all');

  // drawer — productos del proveedor seleccionado
  drawerSupplier = signal<Supplier | null>(null);

  // modal — crear / editar proveedor
  modalOpen = signal(false);
  editing   = signal<Supplier | null>(null);
  saving    = signal(false);

  searchCtrl = new FormControl('');
  private searchQuery = toSignal(
    this.searchCtrl.valueChanges.pipe(startWith('')),
    { initialValue: '' }
  );

  form = this.fb.group({
    name:    ['', [Validators.required, Validators.minLength(2)]],
    ruc:     ['', [Validators.pattern(/^\d{13}$/)]],
    email:   ['', [Validators.email]],
    phone:   ['', [Validators.maxLength(15)]],
    address: [''],
  });

  get isNew(): boolean { return !this.editing(); }

  totalCount  = computed(() => this.allSuppliers().length);
  rucCount    = computed(() => this.allSuppliers().filter(s => !!s.ruc).length);
  noRucCount  = computed(() => this.allSuppliers().filter(s => !s.ruc).length);

  filteredSuppliers = computed(() => {
    let list = this.allSuppliers();
    const t = this.tab();
    if (t === 'ruc')    list = list.filter(s => !!s.ruc);
    if (t === 'no_ruc') list = list.filter(s => !s.ruc);
    const q = (this.searchQuery() ?? '').toLowerCase();
    if (q) list = list.filter(s =>
      s.name.toLowerCase().includes(q) ||
      (s.ruc ?? '').includes(q) ||
      (s.email ?? '').toLowerCase().includes(q) ||
      (s.phone ?? '').includes(q)
    );
    return list;
  });

  supplierProducts = computed(() => {
    const s = this.drawerSupplier();
    if (!s) return [];
    return this.allProducts().filter(p => p.supplier_id === s.id);
  });

  drawerLowCount = computed(() =>
    this.supplierProducts().filter(p => p.stock > 0 && p.stock < p.min_stock).length
  );
  drawerOutCount = computed(() =>
    this.supplierProducts().filter(p => p.stock <= 0).length
  );

  ngOnInit(): void {
    this.load();
    this.loadProducts();
  }

  load(): void {
    this.loading.set(true);
    this.suppliersService.list({ limit: 500 })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: res => this.allSuppliers.set(res.data ?? []),
        error: ()  => this.allSuppliers.set([]),
      });
  }

  loadProducts(): void {
    this.productsService.list({ limit: 1000 }).subscribe({
      next: res => this.allProducts.set(res.data ?? []),
      error: ()  => this.allProducts.set([]),
    });
  }

  canEdit(): boolean {
    return this.authService.isSystemUser() || this.authService.isStoreAdmin();
  }

  openDrawer(s: Supplier): void {
    this.drawerSupplier.set(s);
  }

  closeDrawer(): void {
    this.drawerSupplier.set(null);
  }

  openNew(): void {
    this.editing.set(null);
    this.form.reset({ name: '', ruc: '', email: '', phone: '', address: '' });
    this.modalOpen.set(true);
  }

  openEdit(s: Supplier): void {
    this.editing.set(s);
    this.form.patchValue({
      name:    s.name,
      ruc:     s.ruc     ?? '',
      email:   s.email   ?? '',
      phone:   s.phone   ?? '',
      address: s.address ?? '',
    });
    this.modalOpen.set(true);
  }

  saveSupplier(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);
    const v = this.form.value;
    const data = {
      name:    v.name!,
      ruc:     v.ruc     || undefined,
      email:   v.email   || undefined,
      phone:   v.phone   || undefined,
      address: v.address || undefined,
    };
    const obs = this.isNew
      ? this.suppliersService.create(data)
      : this.suppliersService.update(this.editing()!.id, data);
    obs.subscribe({
      next: () => {
        this.snackBar.open(this.isNew ? 'Proveedor creado' : 'Proveedor actualizado', 'OK', { duration: 3000 });
        this.modalOpen.set(false);
        this.saving.set(false);
        this.load();
      },
      error: (err) => {
        this.snackBar.open(err?.error?.message || 'Error al guardar', 'OK', { duration: 4000 });
        this.saving.set(false);
      },
    });
  }

  deleteSupplier(s: Supplier): void {
    this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Eliminar proveedor', message: `¿Eliminar a "${s.name}"?`, confirmText: 'Eliminar', danger: true },
    }).afterClosed().subscribe(ok => {
      if (!ok) return;
      this.suppliersService.remove(s.id).subscribe({
        next: () => {
          this.snackBar.open('Proveedor eliminado', 'OK', { duration: 3000 });
          this.modalOpen.set(false);
          this.closeDrawer();
          this.load();
        },
        error: () => {},
      });
    });
  }

  stockLabel(p: Product): 'ok' | 'low' | 'out' {
    if (p.stock <= 0)            return 'out';
    if (p.stock < p.min_stock)   return 'low';
    return 'ok';
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('es-EC', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }
}
