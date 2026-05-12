import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { InvoiceSettingsService } from '../../../core/services/invoice-settings.service';
import { InvoicePdfService } from '../../../core/services/invoice-pdf.service';
import { AuthService } from '../../../core/services/auth.service';
import {
  InvoiceSettings,
  InvoiceTemplate,
  INVOICE_TEMPLATES,
  DEFAULT_INVOICE_SETTINGS,
} from '../../../core/models/invoice-settings.model';
import { AppIconComponent } from '../../../shared/components/app-icon/app-icon.component';

@Component({
  selector: 'app-invoice-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AppIconComponent],
  templateUrl: './invoice-settings.component.html',
  styleUrls: ['./invoice-settings.component.scss'],
})
export class InvoiceSettingsComponent implements OnInit {
  private svc     = inject(InvoiceSettingsService);
  private fb      = inject(FormBuilder);
  private snack   = inject(MatSnackBar);
  private auth    = inject(AuthService);
  private pdfSvc  = inject(InvoicePdfService);

  readonly templates = INVOICE_TEMPLATES;

  loading  = signal(false);
  saving   = signal(false);

  form = this.fb.group({
    display_name:  [''],
    template_id:   ['classic' as InvoiceTemplate, Validators.required],
    accent_color:  ['#4f46e5'],
    footer_text:   [''],
    establishment:  ['001', [Validators.required, Validators.pattern(/^\d{1,3}$/)]],
    emission_point: ['001', [Validators.required, Validators.pattern(/^\d{1,3}$/)]],
  });

  ngOnInit(): void {
    this.loading.set(true);
    this.svc.get().subscribe({
      next: (s) => {
        const merged: InvoiceSettings = { ...DEFAULT_INVOICE_SETTINGS, ...s };
        this.form.patchValue({
          display_name:  merged.display_name  ?? '',
          template_id:   merged.template_id,
          accent_color:  merged.accent_color  ?? '#4f46e5',
          footer_text:   merged.footer_text   ?? '',
          establishment:  merged.establishment  ?? '001',
          emission_point: merged.emission_point ?? '001',
        });
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.snack.open('No se pudo cargar la configuración.', 'Cerrar', { duration: 3000 });
      },
    });
  }

  selectTemplate(id: InvoiceTemplate): void {
    this.form.patchValue({ template_id: id });
  }

  save(): void {
    if (this.form.invalid || this.saving()) return;
    this.saving.set(true);

    const raw = this.form.value;
    const pad3 = (v: string | null | undefined) => String(parseInt(v ?? '1', 10)).padStart(3, '0');
    this.svc.update({
      display_name:  raw.display_name?.trim() || undefined,
      template_id:   raw.template_id as InvoiceTemplate,
      accent_color:  raw.accent_color || undefined,
      footer_text:   raw.footer_text?.trim() || undefined,
      establishment:  pad3(raw.establishment),
      emission_point: pad3(raw.emission_point),
    }).subscribe({
      next: (updated) => {
        this.saving.set(false);
        this.pdfSvc.updateSettings(updated);
        this.snack.open('Configuración guardada.', '', { duration: 2500 });
      },
      error: () => {
        this.saving.set(false);
        this.snack.open('Error al guardar.', 'Cerrar', { duration: 3000 });
      },
    });
  }

  get companyName(): string {
    return this.auth.currentUser()?.company?.name ?? 'Mi Empresa';
  }

  get previewName(): string {
    const custom = this.form.value.display_name?.trim();
    return custom || this.companyName;
  }

  get previewColor(): string {
    return this.form.value.accent_color || '#4f46e5';
  }

  get previewTemplate(): InvoiceTemplate {
    return (this.form.value.template_id as InvoiceTemplate) ?? 'classic';
  }

  get previewFooter(): string {
    return this.form.value.footer_text?.trim() || 'Gracias por su preferencia';
  }

  get previewInvoiceNumber(): string {
    const pad3 = (v: string | null | undefined) =>
      String(parseInt(v ?? '1', 10) || 1).padStart(3, '0');
    const est = pad3(this.form.value.establishment);
    const ep  = pad3(this.form.value.emission_point);
    return `${est}-${ep}-000000001`;
  }
}
