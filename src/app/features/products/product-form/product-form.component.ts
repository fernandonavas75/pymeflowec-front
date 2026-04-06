import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ProductsService } from '../../../core/services/products.service';

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './product-form.component.html',
})
export class ProductFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private productsService = inject(ProductsService);
  private snackBar = inject(MatSnackBar);

  loading = signal(false);
  saving = signal(false);
  productId = signal<string | null>(null);

  form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    description: [''],
    category: [''],
    unit_price: [0, [Validators.required, Validators.min(0.01)]],
    stock: [0, [Validators.required, Validators.min(0)]],
  });

  get isEdit(): boolean {
    return !!this.productId();
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.productId.set(id);
      this.loading.set(true);
      this.productsService.getById(id).subscribe({
        next: product => {
          this.form.patchValue({
            name: product.name,
            description: product.description,
            category: product.category?.name ?? '',
            unit_price: product.unit_price,
            stock: product.stock,
          });
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
          this.router.navigate(['/products']);
        },
      });
    }
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    const data = this.form.value as { name: string; description?: string; category?: string; unit_price: number; stock: number };

    const obs = this.isEdit
      ? this.productsService.update(this.productId()!, data)
      : this.productsService.create(data);

    obs.subscribe({
      next: () => {
        this.snackBar.open(
          this.isEdit ? 'Producto actualizado' : 'Producto creado',
          'OK',
          { duration: 3000, panelClass: ['success-snackbar'] }
        );
        this.router.navigate(['/products']);
      },
      error: () => this.saving.set(false),
    });
  }
}
