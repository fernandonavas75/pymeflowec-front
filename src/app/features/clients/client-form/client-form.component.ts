import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CustomersService } from '../../../core/services/customers.service';
import { CustomerType } from '../../../core/models/customer.model';

@Component({
  selector: 'app-client-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './client-form.component.html',
})
export class ClientFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private customersService = inject(CustomersService);
  private snackBar = inject(MatSnackBar);

  loading = signal(false);
  saving = signal(false);
  customerId = signal<string | null>(null);

  customerTypes: { value: CustomerType; label: string }[] = [
    { value: 'CEDULA', label: 'Cédula' },
    { value: 'RUC', label: 'RUC' },
    { value: 'FINAL_CONSUMER', label: 'Consumidor Final' },
  ];

  form = this.fb.group({
    customer_type:   ['CEDULA' as CustomerType, Validators.required],
    document_number: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(13)]],
    full_name:       ['', [Validators.required, Validators.minLength(3)]],
    email:           ['', [Validators.email]],
    phone:           ['', [Validators.minLength(10), Validators.maxLength(10)]],
    address:         [''],
  });

  get isEdit(): boolean { return !!this.customerId(); }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.customerId.set(id);
      this.loading.set(true);
      this.customersService.getById(id).subscribe({
        next: c => {
          this.form.patchValue(c);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
          this.router.navigate(['/customers']);
        },
      });
    }
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);

    const raw = this.form.value;
    const data = {
      customer_type:   raw.customer_type as CustomerType,
      document_number: raw.document_number!,
      full_name:       raw.full_name!,
      email:           raw.email || undefined,
      phone:           raw.phone || undefined,
      address:         raw.address || undefined,
    };

    const obs = this.isEdit
      ? this.customersService.update(this.customerId()!, data)
      : this.customersService.create(data);

    obs.subscribe({
      next: () => {
        this.snackBar.open(
          this.isEdit ? 'Cliente actualizado' : 'Cliente creado',
          'OK',
          { duration: 3000, panelClass: ['success-snackbar'] }
        );
        this.router.navigate(['/customers']);
      },
      error: () => this.saving.set(false),
    });
  }
}
