import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TaxRatesService } from '../../../core/services/tax-rates.service';

@Component({
  selector: 'app-tax-rate-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <a routerLink="/tax-rates" mat-icon-button>
          <mat-icon>arrow_back</mat-icon>
        </a>
        <div>
          <h1 class="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {{ isEdit ? 'Editar tasa' : 'Nueva tasa de impuesto' }}
          </h1>
        </div>
      </div>

      @if (loading()) {
        <div class="flex justify-center py-20">
          <mat-spinner diameter="48"></mat-spinner>
        </div>
      } @else {
        <div class="form-card">
          <form [formGroup]="form" (ngSubmit)="onSubmit()">
            <div class="form-grid">
              <mat-form-field appearance="outline" class="col-span-2">
                <mat-label>Nombre *</mat-label>
                <input matInput formControlName="tax_name" placeholder="Ej: IVA">
                @if (form.get('tax_name')?.touched && form.get('tax_name')?.invalid) {
                  <mat-error>Este campo es requerido</mat-error>
                }
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Porcentaje (%) *</mat-label>
                <input matInput type="number" formControlName="percentage" placeholder="15">
                @if (form.get('percentage')?.touched && form.get('percentage')?.invalid) {
                  <mat-error>Ingresa un porcentaje válido (0-100)</mat-error>
                }
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Vigente desde</mat-label>
                <input matInput type="date" formControlName="valid_from">
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Vigente hasta (opcional)</mat-label>
                <input matInput type="date" formControlName="valid_to">
              </mat-form-field>
            </div>

            <div class="mt-4">
              <mat-checkbox formControlName="is_active">Tasa activa</mat-checkbox>
            </div>

            <div class="form-actions mt-6">
              <a routerLink="/tax-rates" mat-stroked-button>Cancelar</a>
              <button mat-flat-button color="primary" type="submit" [disabled]="saving()">
                @if (saving()) {
                  <mat-spinner diameter="20" class="inline-block"></mat-spinner>
                } @else {
                  {{ isEdit ? 'Guardar cambios' : 'Crear tasa' }}
                }
              </button>
            </div>
          </form>
        </div>
      }
    </div>
  `,
})
export class TaxRateFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private taxRatesService = inject(TaxRatesService);
  private snackBar = inject(MatSnackBar);

  loading = signal(false);
  saving = signal(false);
  taxRateId = signal<string | null>(null);

  form = this.fb.group({
    tax_name:   ['', [Validators.required]],
    percentage: [0, [Validators.required, Validators.min(0), Validators.max(100)]],
    is_active:  [true],
    valid_from: [new Date().toISOString().split('T')[0]],
    valid_to:   [''],
  });

  get isEdit(): boolean { return !!this.taxRateId(); }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.taxRateId.set(id);
      this.loading.set(true);
      this.taxRatesService.getById(id).subscribe({
        next: t => {
          this.form.patchValue(t);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
          this.router.navigate(['/tax-rates']);
        },
      });
    }
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);

    const raw = this.form.value;
    const data = {
      tax_name:   raw.tax_name!,
      percentage: raw.percentage!,
      is_active:  raw.is_active ?? true,
      valid_from: raw.valid_from || undefined,
      valid_to:   raw.valid_to || undefined,
    };

    const obs = this.isEdit
      ? this.taxRatesService.update(this.taxRateId()!, data)
      : this.taxRatesService.create(data);

    obs.subscribe({
      next: () => {
        this.snackBar.open(this.isEdit ? 'Tasa actualizada' : 'Tasa creada', 'OK', { duration: 3000 });
        this.router.navigate(['/tax-rates']);
      },
      error: () => this.saving.set(false),
    });
  }
}
