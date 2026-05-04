import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ExpenseBudgetsService } from '../../../core/services/expense-budgets.service';
import { ExpenseCategoriesService } from '../../../core/services/expense-categories.service';
import {
  ExpenseBudget,
  BudgetPeriodType,
  CreateExpenseBudgetDto,
  BUDGET_PERIOD_TYPE_LABELS,
  MONTHS,
} from '../../../core/models/expense-budget.model';
import { ExpenseCategory, CATEGORY_TYPE_LABELS } from '../../../core/models/expense-category.model';
import { AppIconComponent } from '../../../shared/components/app-icon/app-icon.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-expense-budgets',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AppIconComponent],
  templateUrl: './expense-budgets.component.html',
})
export class ExpenseBudgetsComponent implements OnInit {
  private svc          = inject(ExpenseBudgetsService);
  private categoriesSvc = inject(ExpenseCategoriesService);
  private dialog       = inject(MatDialog);
  private snackBar     = inject(MatSnackBar);
  private fb           = inject(FormBuilder);

  readonly BUDGET_PERIOD_TYPE_LABELS = BUDGET_PERIOD_TYPE_LABELS;
  readonly CATEGORY_TYPE_LABELS      = CATEGORY_TYPE_LABELS;
  readonly MONTHS                    = MONTHS;

  private allBudgets = signal<ExpenseBudget[]>([]);
  categories         = signal<ExpenseCategory[]>([]);
  loading            = signal(true);
  saving             = signal(false);

  year       = signal(new Date().getFullYear());
  periodTab  = signal<'all' | BudgetPeriodType>('all');
  catFilter  = signal<number | ''>('');

  modalOpen = signal(false);
  editing   = signal<ExpenseBudget | null>(null);

  form = this.fb.group({
    category_id:     [null as number | null, Validators.required],
    period_type:     ['MONTHLY' as BudgetPeriodType, Validators.required],
    period_year:     [new Date().getFullYear(), [Validators.required, Validators.min(2020), Validators.max(2099)]],
    period_month:    [null as number | null],
    budgeted_amount: [null as number | null, [Validators.required, Validators.min(0.01)]],
    notes:           [''],
  });

  get isNew(): boolean { return !this.editing(); }
  get isMonthly(): boolean { return this.form.get('period_type')?.value === 'MONTHLY'; }

  monthlyCount = computed(() => this.allBudgets().filter(b => b.period_type === 'MONTHLY').length);
  annualCount  = computed(() => this.allBudgets().filter(b => b.period_type === 'ANNUAL').length);
  totalCount   = computed(() => this.allBudgets().length);

  totalBudgeted = computed(() =>
    this.filtered().reduce((sum, b) => sum + b.budgeted_amount, 0)
  );

  filtered = computed(() => {
    let list = this.allBudgets();
    const tab = this.periodTab();
    if (tab !== 'all') list = list.filter(b => b.period_type === tab);
    const cat = this.catFilter();
    if (cat) list = list.filter(b => b.category_id === Number(cat));
    return list;
  });

  ngOnInit(): void {
    this.load();
    this.loadCategories();
  }

  load(): void {
    this.loading.set(true);
    this.svc.list({ year: this.year(), limit: 200 })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: res => this.allBudgets.set(res.data),
        error: ()  => this.allBudgets.set([]),
      });
  }

  loadCategories(): void {
    this.categoriesSvc.list({ limit: 500 }).subscribe({
      next: data => this.categories.set(data),
      error: ()   => this.categories.set([]),
    });
  }

  changeYear(delta: number): void {
    this.year.update(y => y + delta);
    this.load();
  }

  openNew(): void {
    this.editing.set(null);
    this.form.reset({
      category_id:     null,
      period_type:     'MONTHLY',
      period_year:     this.year(),
      period_month:    null,
      budgeted_amount: null,
      notes:           '',
    });
    this.updateMonthValidator('MONTHLY');
    this.modalOpen.set(true);
  }

  openEdit(b: ExpenseBudget): void {
    this.editing.set(b);
    this.form.patchValue({
      category_id:     b.category_id,
      period_type:     b.period_type,
      period_year:     b.period_year,
      period_month:    b.period_month ?? null,
      budgeted_amount: b.budgeted_amount,
      notes:           b.notes ?? '',
    });
    this.updateMonthValidator(b.period_type);
    // Lock category/period fields when editing (backend only allows amount+notes update)
    this.form.get('category_id')?.disable();
    this.form.get('period_type')?.disable();
    this.form.get('period_year')?.disable();
    this.form.get('period_month')?.disable();
    this.modalOpen.set(true);
  }

  onPeriodTypeChange(type: BudgetPeriodType): void {
    this.form.get('period_type')?.setValue(type);
    this.updateMonthValidator(type);
  }

  private updateMonthValidator(type: BudgetPeriodType): void {
    const ctrl = this.form.get('period_month')!;
    if (type === 'MONTHLY') {
      ctrl.setValidators([Validators.required, Validators.min(1), Validators.max(12)]);
    } else {
      ctrl.clearValidators();
      ctrl.setValue(null);
    }
    ctrl.updateValueAndValidity();
  }

  save(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);
    const v = this.form.getRawValue();

    if (this.isNew) {
      const data: CreateExpenseBudgetDto = {
        category_id:     v.category_id!,
        period_type:     v.period_type as BudgetPeriodType,
        period_year:     v.period_year!,
        period_month:    v.period_type === 'MONTHLY' ? v.period_month! : undefined,
        budgeted_amount: v.budgeted_amount!,
        notes:           v.notes || undefined,
      };
      this.svc.create(data).subscribe({
        next: () => {
          this.snackBar.open('Presupuesto creado', 'OK', { duration: 3000 });
          this.afterSave();
        },
        error: err => {
          this.snackBar.open(err?.error?.message || 'Error al guardar', 'OK', { duration: 4000 });
          this.saving.set(false);
        },
      });
    } else {
      this.svc.update(this.editing()!.id, {
        budgeted_amount: v.budgeted_amount!,
        notes:           v.notes || undefined,
      }).subscribe({
        next: () => {
          this.snackBar.open('Presupuesto actualizado', 'OK', { duration: 3000 });
          this.afterSave();
        },
        error: err => {
          this.snackBar.open(err?.error?.message || 'Error al guardar', 'OK', { duration: 4000 });
          this.saving.set(false);
        },
      });
    }
  }

  private afterSave(): void {
    this.saving.set(false);
    this.modalOpen.set(false);
    this.form.get('category_id')?.enable();
    this.form.get('period_type')?.enable();
    this.form.get('period_year')?.enable();
    this.form.get('period_month')?.enable();
    this.load();
  }

  deleteBudget(b: ExpenseBudget): void {
    this.dialog.open(ConfirmDialogComponent, {
      data: {
        title:       'Eliminar presupuesto',
        message:     `¿Eliminar el presupuesto de "${b.category?.name ?? 'esta categoría'}"? Esta acción no se puede deshacer.`,
        confirmText: 'Eliminar',
        danger:      true,
      },
    }).afterClosed().subscribe(ok => {
      if (!ok) return;
      this.svc.remove(b.id).subscribe({
        next: () => {
          this.snackBar.open('Presupuesto eliminado', 'OK', { duration: 3000 });
          this.modalOpen.set(false);
          this.load();
        },
        error: err => {
          this.snackBar.open(err?.error?.message || 'Error al eliminar', 'OK', { duration: 4000 });
        },
      });
    });
  }

  closeModal(): void {
    this.form.get('category_id')?.enable();
    this.form.get('period_type')?.enable();
    this.form.get('period_year')?.enable();
    this.form.get('period_month')?.enable();
    this.modalOpen.set(false);
  }

  periodLabel(b: ExpenseBudget): string {
    if (b.period_type === 'ANNUAL') return String(b.period_year);
    const month = MONTHS.find(m => m.value === b.period_month);
    return month ? `${month.label} ${b.period_year}` : String(b.period_year);
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
  }
}
