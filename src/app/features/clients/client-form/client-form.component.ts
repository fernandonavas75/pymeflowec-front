import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AppIconComponent } from '../../../shared/components/app-icon/app-icon.component';
import { CustomersService } from '../../../core/services/customers.service';
import { CustomerType } from '../../../core/models/customer.model';

@Component({
  selector: 'app-client-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, AppIconComponent],
  templateUrl: './client-form.component.html',
})
export class ClientFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private customersService = inject(CustomersService);
  private snackBar = inject(MatSnackBar);

  loading    = signal(false);
  saving     = signal(false);
  customerId = signal<string | null>(null);

  form = this.fb.group({
    customer_type:   ['CEDULA' as CustomerType, Validators.required],
    document_number: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(13)]],
    full_name:       ['', [Validators.required, Validators.minLength(3)]],
    email:           ['', Validators.email],
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
        next: c => { this.form.patchValue(c); this.loading.set(false); },
        error: () => { this.loading.set(false); this.router.navigate(['/customers']); },
      });
    }
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);
    const v = this.form.value;
    const data = {
      customer_type:   v.customer_type as CustomerType,
      document_number: v.document_number!,
      full_name:       v.full_name!,
      email:   v.email   || undefined,
      phone:   v.phone   || undefined,
      address: v.address || undefined,
    };
    const obs = this.isEdit
      ? this.customersService.update(this.customerId()!, data)
      : this.customersService.create(data);
    obs.subscribe({
      next: () => {
        this.snackBar.open(this.isEdit ? 'Cliente actualizado' : 'Cliente creado', 'OK', { duration: 3000 });
        this.router.navigate(['/customers']);
      },
      error: (err) => {
        this.snackBar.open(err?.error?.message || 'Error al guardar', 'OK', { duration: 4000 });
        this.saving.set(false);
      },
    });
  }
}
