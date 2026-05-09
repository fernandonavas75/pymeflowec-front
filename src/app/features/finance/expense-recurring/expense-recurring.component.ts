import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormControl, Validators } from '@angular/forms';
import { startWith, finalize } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ExpenseRecurringService } from '../../../core/services/expense-recurring.service';
import { ExpenseCategoriesService } from '../../../core/services/expense-categories.service';
import {
  ExpenseRecurring,
  CreateExpenseRecurringDto,
} from '../../../core/models/expense-recurring.model';
import { ExpenseCategory } from '../../../core/models/expense-category.model';
import { VOUCHER_TYPE_LABELS, VOUCHER_TYPES } from '../../../core/models/expense.model';
import { PAYMENT_METHOD_LABELS } from '../../../core/models/invoice-payment.model';
import type { VoucherType } from '../../../core/models/expense.model';
import type { PaymentMethod } from '../../../core/models/invoice-payment.model';
import { AppIconComponent } from '../../../shared/components/app-icon/app-icon.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { AuthService } from '../../../core/services/auth.service';

const PAYMENT_METHODS: PaymentMethod[] = [
  'EFECTIVO', 'TRANSFERENCIA', 'TARJETA_DEBITO', 'TARJETA_CREDITO', 'CHEQUE', 'OTRO',
];

@Component({
  selector: 'app-expense-recurring',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AppIconComponent],
  templateUrl: './expense-recurring.component.html',
})
export class ExpenseRecurringComponent implements OnInit {
  private svc           = inject(ExpenseRecurringService);
  private categoriesSvc = inject(ExpenseCategoriesService);
  private dialog        = inject(MatDialog);
  private snackBar      = inject(MatSnackBar);
  private fb            = inject(FormBuilder);
  authService           = inject(AuthService);

  readonly VOUCHER_TYPE_LABELS  = VOUCHER_TYPE_LABELS;
  readonly VOUCHER_TYPES        = VOUCHER_TYPES;
  readonly PAYMENT_METHOD_LABELS = PAYMENT_METHOD_LABELS;
  readonly PAYMENT_METHODS      = PAYMENT_METHODS;
  readonly DAYS = Array.from({ length: 28 }, (_, i) => i + 1);

  private allItems = signal<ExpenseRecurring[]>([]);
  categories       = signal<ExpenseCategory[]>([]);
  loading          = signal(true);
  saving           = signal(false);

  modalOpen = signal(false);
  editing   = signal<ExpenseRecurring | null>(null);

  searchCtrl = new FormControl('');
  private searchQuery = toSignal(
    this.searchCtrl.valueChanges.pipe(startWith('')),
    { initialValue: '' },
  );

  form = this.fb.group({
    category_id:             [null as number | null, Validators.required],
    description:             ['', [Validators.required, Validators.minLength(2)]],
    amount:                  [null as number | null, [Validators.required, Validators.min(0.01)]],
    day_of_month:            [1, [Validators.required, Validators.min(1), Validators.max(28)]],
    supplier_name_free:      [''],
    voucher_type:            ['' as VoucherType | ''],
    default_payment_method:  ['' as PaymentMethod | ''],
    starts_at:               [''],
    ends_at:                 [''],
  });

  get isNew(): boolean { return !this.editing(); }

  totalCount = computed(() => this.allItems().length);

  filtered = computed(() => {
    const q = (this.searchQuery() ?? '').toLowerCase();
    if (!q) return this.allItems();
    return this.allItems().filter(r =>
      r.description.toLowerCase().includes(q) ||
      (r.category?.name ?? '').toLowerCase().includes(q) ||
      (r.supplier_name_free ?? '').toLowerCase().includes(q),
    );
  });

  ngOnInit(): void {
    this.load();
    this.loadCategories();
  }

  load(): void {
    this.loading.set(true);
    this.svc.list({ limit: 200 })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: res => this.allItems.set(res.data),
        error: ()  => this.allItems.set([]),
      });
  }

  loadCategories(): void {
    this.categoriesSvc.list({ limit: 500 }).subscribe({
      next: data => this.categories.set(data),
      error: ()   => this.categories.set([]),
    });
  }

  openNew(): void {
    this.editing.set(null);
    this.form.reset({
      category_id:            null,
      description:            '',
      amount:                 null,
      day_of_month:           1,
      supplier_name_free:     '',
      voucher_type:           '',
      default_payment_method: '',
      starts_at:              '',
      ends_at:                '',
    });
    this.modalOpen.set(true);
  }

  openEdit(r: ExpenseRecurring): void {
    this.editing.set(r);
    this.form.patchValue({
      category_id:            r.category_id,
      description:            r.description,
      amount:                 r.amount,
      day_of_month:           r.day_of_month,
      supplier_name_free:     r.supplier_name_free ?? '',
      voucher_type:           r.voucher_type ?? '',
      default_payment_method: r.default_payment_method ?? '',
      starts_at:              r.starts_at ? r.starts_at.slice(0, 10) : '',
      ends_at:                r.ends_at   ? r.ends_at.slice(0, 10)   : '',
    });
    this.modalOpen.set(true);
  }

  save(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);
    const v = this.form.value;

    const payload: CreateExpenseRecurringDto = {
      category_id:            v.category_id!,
      description:            v.description!,
      amount:                 v.amount!,
      day_of_month:           v.day_of_month!,
      supplier_name_free:     v.supplier_name_free || undefined,
      voucher_type:           (v.voucher_type as VoucherType) || undefined,
      default_payment_method: (v.default_payment_method as PaymentMethod) || undefined,
      starts_at:              v.starts_at || undefined,
      ends_at:                v.ends_at   || undefined,
    };

    const obs = this.isNew
      ? this.svc.create(payload)
      : this.svc.update(this.editing()!.id, payload);

    obs.subscribe({
      next: () => {
        this.snackBar.open(this.isNew ? 'Plantilla creada' : 'Plantilla actualizada', 'OK', { duration: 3000 });
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

  deleteItem(r: ExpenseRecurring): void {
    this.dialog.open(ConfirmDialogComponent, {
      data: {
        title:       'Eliminar plantilla',
        message:     `¿Eliminar "${r.description}"? Esta acción no se puede deshacer.`,
        confirmText: 'Eliminar',
        danger:      true,
      },
    }).afterClosed().subscribe(ok => {
      if (!ok) return;
      this.svc.remove(r.id).subscribe({
        next: () => {
          this.snackBar.open('Plantilla eliminada', 'OK', { duration: 3000 });
          this.modalOpen.set(false);
          this.load();
        },
        error: err => {
          this.snackBar.open(err?.error?.message || 'Error al eliminar', 'OK', { duration: 4000 });
        },
      });
    });
  }

  dayLabel(day: number): string {
    return `Día ${day} de cada mes`;
  }

  formatCurrency(v: number): string {
    return new Intl.NumberFormat('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);
  }

  formatDate(d: string): string {
    return new Date(d).toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' });
  }
}
