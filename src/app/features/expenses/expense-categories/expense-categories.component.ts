import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ExpensesService } from '../../../core/services/expenses.service';
import { ExpenseCategory } from '../../../core/models/expense.model';

@Component({
  selector: 'app-expense-categories',
  standalone: true,
  imports: [
    CommonModule, RouterLink, ReactiveFormsModule,
    MatInputModule, MatButtonModule, MatIconModule,
    MatTableModule, MatProgressSpinnerModule,
  ],
  templateUrl: './expense-categories.component.html',
})
export class ExpenseCategoriesComponent implements OnInit {
  private svc = inject(ExpensesService);
  private snackBar = inject(MatSnackBar);
  private fb = inject(FormBuilder);

  categories = signal<ExpenseCategory[]>([]);
  loading = signal(true);
  saving = signal(false);
  displayedColumns = ['name', 'description'];

  form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    description: [''],
  });

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.svc.listCategories().subscribe({ next: cats => { this.categories.set(cats); this.loading.set(false); }, error: () => this.loading.set(false) });
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);
    this.svc.createCategory({ name: this.form.value.name!, description: this.form.value.description || undefined }).subscribe({
      next: () => { this.snackBar.open('Categoría creada', 'OK', { duration: 3000 }); this.form.reset(); this.load(); this.saving.set(false); },
      error: () => this.saving.set(false),
    });
  }
}
