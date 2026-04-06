import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ExpensesService } from '../../../core/services/expenses.service';
import { SuppliersService } from '../../../core/services/suppliers.service';
import { ExpenseCategory } from '../../../core/models/expense.model';
import { Supplier } from '../../../core/models/supplier.model';

@Component({
  selector: 'app-expense-create',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterLink,
    MatInputModule, MatSelectModule, MatCheckboxModule,
    MatButtonModule, MatIconModule, MatProgressSpinnerModule,
    MatDatepickerModule, MatNativeDateModule,
  ],
  templateUrl: './expense-create.component.html',
})
export class ExpenseCreateComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private svc = inject(ExpensesService);
  private suppliersSvc = inject(SuppliersService);
  private snackBar = inject(MatSnackBar);

  saving = signal(false);
  categories = signal<ExpenseCategory[]>([]);
  suppliers = signal<Supplier[]>([]);

  form = this.fb.group({
    category_id: [null as number | null, Validators.required],
    amount: [null as number | null, [Validators.required, Validators.min(0.01)]],
    payment_method: ['cash'],
    expense_date: [new Date()],
    supplier_id: [null as number | null],
    reference_number: [''],
    description: [''],
    is_recurring: [false],
    recurrence_day: [null as number | null],
  });

  ngOnInit(): void {
    this.svc.listCategories().subscribe(cats => this.categories.set(cats));
    this.suppliersSvc.list({ limit: 100 }).subscribe(res => this.suppliers.set(res.data));
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);
    const v = this.form.value;
    const dto = {
      category_id: v.category_id!,
      amount: v.amount!,
      payment_method: v.payment_method as any,
      expense_date: v.expense_date ? (v.expense_date as Date).toISOString().split('T')[0] : undefined,
      supplier_id: v.supplier_id ?? undefined,
      reference_number: v.reference_number || undefined,
      description: v.description || undefined,
      is_recurring: v.is_recurring ?? false,
      recurrence_day: v.is_recurring && v.recurrence_day ? v.recurrence_day : undefined,
    };
    this.svc.create(dto).subscribe({
      next: () => { this.snackBar.open('Gasto registrado', 'OK', { duration: 3000 }); this.router.navigate(['/expenses']); },
      error: () => this.saving.set(false),
    });
  }
}
