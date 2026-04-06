import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { PaymentsService } from '../../../core/services/payments.service';
import { InvoicesService } from '../../../core/services/invoices.service';
import { Invoice } from '../../../core/models/invoice.model';

@Component({
  selector: 'app-payment-create',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterLink,
    MatInputModule, MatSelectModule, MatButtonModule,
    MatIconModule, MatProgressSpinnerModule,
    MatDatepickerModule, MatNativeDateModule,
  ],
  templateUrl: './payment-create.component.html',
})
export class PaymentCreateComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private svc = inject(PaymentsService);
  private invoicesSvc = inject(InvoicesService);
  private snackBar = inject(MatSnackBar);

  saving = signal(false);
  invoices = signal<Invoice[]>([]);

  form = this.fb.group({
    invoice_id: [null as number | null, Validators.required],
    payment_method: ['cash', Validators.required],
    amount: [null as number | null, [Validators.required, Validators.min(0.01)]],
    payment_date: [new Date()],
    reference_number: [''],
    notes: [''],
  });

  ngOnInit(): void {
    this.invoicesSvc.list({ limit: 100, status: 'pending' }).subscribe(res => this.invoices.set(res.data));
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);
    const v = this.form.value;
    const dto = {
      invoice_id: v.invoice_id!,
      payment_method: v.payment_method as any,
      amount: v.amount!,
      payment_date: v.payment_date ? (v.payment_date as Date).toISOString().split('T')[0] : undefined,
      reference_number: v.reference_number || undefined,
      notes: v.notes || undefined,
    };
    this.svc.create(dto).subscribe({
      next: () => {
        this.snackBar.open('Pago registrado', 'OK', { duration: 3000 });
        this.router.navigate(['/payments']);
      },
      error: () => this.saving.set(false),
    });
  }
}
