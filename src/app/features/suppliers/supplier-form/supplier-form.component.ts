import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SuppliersService } from '../../../core/services/suppliers.service';

@Component({
  selector: 'app-supplier-form',
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
  templateUrl: './supplier-form.component.html',
})
export class SupplierFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private suppliersService = inject(SuppliersService);
  private snackBar = inject(MatSnackBar);

  loading = signal(false);
  saving = signal(false);
  supplierId = signal<string | null>(null);

  form = this.fb.group({
    name:    ['', [Validators.required, Validators.minLength(2)]],
    ruc:     ['', [Validators.pattern(/^\d{13}$/)]],
    email:   ['', [Validators.email]],
    phone:   ['', [Validators.minLength(7), Validators.maxLength(15)]],
    address: [''],
  });

  get isEdit(): boolean { return !!this.supplierId(); }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.supplierId.set(id);
      this.loading.set(true);
      this.suppliersService.getById(id).subscribe({
        next: supplier => {
          this.form.patchValue(supplier);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
          this.router.navigate(['/suppliers']);
        },
      });
    }
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);
    const v = this.form.value;
    const data = {
      name:    v.name!,
      ruc:     v.ruc || undefined,
      email:   v.email || undefined,
      phone:   v.phone || undefined,
      address: v.address || undefined,
    };

    const obs = this.isEdit
      ? this.suppliersService.update(this.supplierId()!, data)
      : this.suppliersService.create(data);

    obs.subscribe({
      next: () => {
        this.snackBar.open(
          this.isEdit ? 'Proveedor actualizado' : 'Proveedor creado',
          'OK',
          { duration: 3000, panelClass: ['success-snackbar'] }
        );
        this.router.navigate(['/suppliers']);
      },
      error: () => this.saving.set(false),
    });
  }
}
