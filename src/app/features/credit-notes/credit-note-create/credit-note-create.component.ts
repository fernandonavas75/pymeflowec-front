import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormArray, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CreditNotesService } from '../../../core/services/credit-notes.service';
import { InvoicesService } from '../../../core/services/invoices.service';
import { Invoice, InvoiceDetail } from '../../../core/models/invoice.model';

@Component({
  selector: 'app-credit-note-create',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterLink,
    MatInputModule, MatSelectModule, MatButtonModule,
    MatIconModule, MatProgressSpinnerModule,
  ],
  templateUrl: './credit-note-create.component.html',
})
export class CreditNoteCreateComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private svc = inject(CreditNotesService);
  private invoicesSvc = inject(InvoicesService);
  private snackBar = inject(MatSnackBar);

  saving = signal(false);
  invoices = signal<Invoice[]>([]);
  selectedInvoice = signal<Invoice | null>(null);

  form = this.fb.group({
    invoice_id: [null as string | null, Validators.required],
    reason: ['', [Validators.required, Validators.minLength(5)]],
    items: this.fb.array([]),
  });

  get itemsArray(): FormArray { return this.form.get('items') as FormArray; }

  ngOnInit(): void {
    this.invoicesSvc.list({ limit: 100 }).subscribe(res =>
      this.invoices.set(res.data.filter(inv => inv.status !== 'cancelled'))
    );
    this.form.get('invoice_id')!.valueChanges.subscribe(id => {
      if (!id) { this.selectedInvoice.set(null); this.clearItems(); return; }
      const inv = this.invoices().find(i => i.id === id) ?? null;
      this.selectedInvoice.set(inv);
      this.clearItems();
      if (inv?.details) this.loadItemsFromInvoice(inv.details);
      else {
        this.invoicesSvc.getById(id).subscribe(full => {
          this.selectedInvoice.set(full);
          this.clearItems();
          if (full.details) this.loadItemsFromInvoice(full.details);
        });
      }
    });
  }

  private clearItems(): void {
    while (this.itemsArray.length) this.itemsArray.removeAt(0);
  }

  private loadItemsFromInvoice(details: InvoiceDetail[]): void {
    details.forEach(d => {
      this.itemsArray.push(this.fb.group({
        product_id: [+d.product_id, Validators.required],
        product_name: [d.product?.name ?? `Producto #${d.product_id}`],
        max_quantity: [d.quantity],
        quantity: [d.quantity, [Validators.required, Validators.min(0.001), Validators.max(d.quantity)]],
        unit_price: [d.unit_price],
      }));
    });
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);
    const v = this.form.value;
    const dto = {
      invoice_id: +v.invoice_id!,
      reason: v.reason!,
      items: (v.items as any[]).map(i => ({
        product_id: i.product_id,
        quantity: +i.quantity,
        unit_price: +i.unit_price,
      })),
    };
    this.svc.create(dto).subscribe({
      next: (cn) => {
        this.snackBar.open('Nota de crédito creada', 'OK', { duration: 3000 });
        this.router.navigate(['/credit-notes', cn.id]);
      },
      error: (err) => {
        this.snackBar.open(err?.error?.message || 'Error al crear la nota de crédito', 'OK', { duration: 5000 });
        this.saving.set(false);
      },
    });
  }
}
