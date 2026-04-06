import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CategoriesService } from '../../../core/services/categories.service';
import { Category } from '../../../core/models/category.model';

@Component({
  selector: 'app-category-form',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterLink,
    MatInputModule, MatSelectModule, MatCheckboxModule,
    MatButtonModule, MatIconModule, MatProgressSpinnerModule,
  ],
  templateUrl: './category-form.component.html',
})
export class CategoryFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private svc = inject(CategoriesService);
  private snackBar = inject(MatSnackBar);

  loading = signal(false);
  saving = signal(false);
  catId = signal<number | null>(null);
  categories = signal<Category[]>([]);

  form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    parent_id: [null as number | null],
    sort_order: [0],
    is_active: [true],
  });

  get isEdit(): boolean { return !!this.catId(); }

  ngOnInit(): void {
    this.svc.list({ limit: 100 }).subscribe(res => this.categories.set(res.data));
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.catId.set(+id);
      this.loading.set(true);
      this.svc.getById(+id).subscribe({
        next: cat => {
          this.form.patchValue({ name: cat.name, parent_id: cat.parent_id, sort_order: cat.sort_order, is_active: cat.is_active });
          this.loading.set(false);
        },
        error: () => { this.loading.set(false); this.router.navigate(['/categories']); },
      });
    }
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);
    const val = this.form.value;
    const dto = { name: val.name!, parent_id: val.parent_id ?? null, sort_order: val.sort_order ?? 0, is_active: val.is_active ?? true };
    const obs = this.isEdit ? this.svc.update(this.catId()!, dto) : this.svc.create(dto);
    obs.subscribe({
      next: () => {
        this.snackBar.open(this.isEdit ? 'Categoría actualizada' : 'Categoría creada', 'OK', { duration: 3000 });
        this.router.navigate(['/categories']);
      },
      error: () => this.saving.set(false),
    });
  }
}
