import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormControl, Validators } from '@angular/forms';
import { startWith, finalize } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ExpenseCategoriesService } from '../../../core/services/expense-categories.service';
import {
  ExpenseCategory,
  CategoryType,
  CATEGORY_TYPE_LABELS,
  CATEGORY_TYPES,
} from '../../../core/models/expense-category.model';
import { AppIconComponent } from '../../../shared/components/app-icon/app-icon.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-expense-categories',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AppIconComponent],
  templateUrl: './expense-categories.component.html',
})
export class ExpenseCategoriesComponent implements OnInit {
  private svc      = inject(ExpenseCategoriesService);
  private dialog   = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private fb       = inject(FormBuilder);
  authService      = inject(AuthService);

  readonly CATEGORY_TYPE_LABELS = CATEGORY_TYPE_LABELS;
  readonly CATEGORY_TYPES       = CATEGORY_TYPES;

  private allCategories = signal<ExpenseCategory[]>([]);
  loading = signal(true);
  saving  = signal(false);

  tab = signal<'all' | 'active' | 'inactive'>('active');

  modalOpen = signal(false);
  editing   = signal<ExpenseCategory | null>(null);

  searchCtrl = new FormControl('');
  private searchQuery = toSignal(
    this.searchCtrl.valueChanges.pipe(startWith('')),
    { initialValue: '' },
  );

  form = this.fb.group({
    name:          ['', [Validators.required, Validators.minLength(2)]],
    category_type: ['' as CategoryType, Validators.required],
    description:   [''],
  });

  get isNew(): boolean { return !this.editing(); }

  totalCount    = computed(() => this.allCategories().length);
  activeCount   = computed(() => this.allCategories().filter(c => c.is_active).length);
  inactiveCount = computed(() => this.allCategories().filter(c => !c.is_active).length);

  filtered = computed(() => {
    let list = this.allCategories();
    if (this.tab() === 'active')   list = list.filter(c => c.is_active);
    if (this.tab() === 'inactive') list = list.filter(c => !c.is_active);
    const q = (this.searchQuery() ?? '').toLowerCase();
    if (q) list = list.filter(c =>
      c.name.toLowerCase().includes(q) ||
      CATEGORY_TYPE_LABELS[c.category_type].toLowerCase().includes(q) ||
      (c.description ?? '').toLowerCase().includes(q),
    );
    return list;
  });

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.svc.list({ limit: 500 })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: data => this.allCategories.set(data),
        error: ()   => this.allCategories.set([]),
      });
  }

  openNew(): void {
    this.editing.set(null);
    this.form.reset({ name: '', category_type: '' as CategoryType, description: '' });
    this.modalOpen.set(true);
  }

  openEdit(c: ExpenseCategory): void {
    this.editing.set(c);
    this.form.patchValue({
      name:          c.name,
      category_type: c.category_type,
      description:   c.description ?? '',
    });
    this.modalOpen.set(true);
  }

  save(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);
    const v = this.form.value;
    const payload = {
      name:          v.name!,
      category_type: v.category_type as CategoryType,
      description:   v.description || undefined,
    };
    const obs = this.isNew
      ? this.svc.create(payload)
      : this.svc.update(this.editing()!.id, payload);
    obs.subscribe({
      next: () => {
        this.snackBar.open(this.isNew ? 'Categoría creada' : 'Categoría actualizada', 'OK', { duration: 3000 });
        this.modalOpen.set(false);
        this.saving.set(false);
        this.load();
      },
      error: err => {
        this.snackBar.open(err?.error?.message || 'Error al guardar', 'OK', { duration: 4000 });
        this.saving.set(false);
      },
    });
  }

  toggleActive(c: ExpenseCategory): void {
    const next = !c.is_active;
    this.dialog.open(ConfirmDialogComponent, {
      data: {
        title:       `${next ? 'Activar' : 'Desactivar'} categoría`,
        message:     `¿${next ? 'Activar' : 'Desactivar'} "${c.name}"?`,
        confirmText: next ? 'Activar' : 'Desactivar',
        danger:      !next,
      },
    }).afterClosed().subscribe(ok => {
      if (!ok) return;
      this.svc.update(c.id, { is_active: next }).subscribe({
        next: () => {
          this.snackBar.open(`Categoría ${next ? 'activada' : 'desactivada'}`, 'OK', { duration: 3000 });
          this.load();
        },
        error: () => {},
      });
    });
  }

  deleteCategory(c: ExpenseCategory): void {
    this.dialog.open(ConfirmDialogComponent, {
      data: {
        title:       'Eliminar categoría',
        message:     `¿Eliminar "${c.name}"? Esta acción no se puede deshacer.`,
        confirmText: 'Eliminar',
        danger:      true,
      },
    }).afterClosed().subscribe(ok => {
      if (!ok) return;
      this.svc.remove(c.id).subscribe({
        next: () => {
          this.snackBar.open('Categoría eliminada', 'OK', { duration: 3000 });
          this.modalOpen.set(false);
          this.load();
        },
        error: err => {
          this.snackBar.open(err?.error?.message || 'Error al eliminar', 'OK', { duration: 4000 });
        },
      });
    });
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('es-EC', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }
}
