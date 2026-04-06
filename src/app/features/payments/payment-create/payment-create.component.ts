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
import { CashRegistersService } from '../../../core/services/cash-registers.service';
import { Invoice } from '../../../core/models/invoice.model';
import { CashRegister } from '../../../core/models/cash-register.model';

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
  private cashRegistersSvc = inject(CashRegistersService);
  private snackBar = inject(MatSnackBar);

  saving = signal(false);
  invoices = signal<Invoice[]>([]);
  openRegisters = signal<CashRegister[]>([]);

  form = this.fb.group({
    invoice_id: [null as string | null, Validators.required],
    payment_method: ['cash', Validators.required],
    amount: [null as number | null, [Validators.required, Validators.min(0.01)]],
    payment_date: [new Date()],
    cash_register_id: [null as number | null],
    reference_number: [''],
    notes: [''],
  });

  get isCash(): boolean {
    return this.form.get('payment_method')?.value === 'cash';
  }

  ngOnInit(): void {
    this.invoicesSvc.list({ limit: 100 }).subscribe(res =>
      this.invoices.set(res.data.filter(inv => inv.status !== 'cancelled' && inv.payment_status !== 'paid'))
    );
    this.cashRegistersSvc.list({ status: 'open', limit: 50 }).subscribe(res =>
      this.openRegisters.set(res.data)
    );

    this.form.get('payment_method')!.valueChanges.subscribe(method => {
      const ctrl = this.form.get('cash_register_id')!;
      if (method === 'cash') {
        ctrl.setValidators(Validators.required);
      } else {
        ctrl.clearValidators();
        ctrl.setValue(null);
      }
      ctrl.updateValueAndValidity();
    });
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);
    const v = this.form.value;
    const dto = {
      invoice_id: +v.invoice_id!,
      payment_method: v.payment_method as any,
      amount: v.amount!,
      payment_date: v.payment_date ? (v.payment_date as Date).toISOString().split('T')[0] : undefined,
      cash_register_id: v.cash_register_id ?? undefined,
      reference_number: v.reference_number || undefined,
      notes: v.notes || undefined,
    };
    this.svc.create(dto).subscribe({
      next: () => {
        this.snackBar.open('Pago registrado', 'OK', { duration: 3000 });
        this.router.navigate(['/payments']);
      },
      error: (err) => {
        const msg = err?.error?.message || 'Error al registrar el pago';
        this.snackBar.open(msg, 'OK', { duration: 5000 });
        this.saving.set(false);
      },
    });
  }
}
