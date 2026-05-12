export type InvoiceTemplate = 'classic' | 'modern' | 'minimal';

export const INVOICE_TEMPLATES: { id: InvoiceTemplate; label: string; description: string }[] = [
  { id: 'classic',  label: 'Clásico',      description: 'Encabezado oscuro, acento de color' },
  { id: 'modern',   label: 'Moderno',       description: 'Barra de color, diseño limpio' },
  { id: 'minimal',  label: 'Minimalista',   description: 'Solo texto, sin colores de fondo' },
];

export interface InvoiceSettings {
  display_name?:  string;
  template_id:    InvoiceTemplate;
  accent_color?:  string;
  footer_text?:   string;
  establishment?: string;
  emission_point?: string;
}

export interface UpdateInvoiceSettingsDto {
  display_name?:  string;
  template_id?:   InvoiceTemplate;
  accent_color?:  string;
  footer_text?:   string;
  establishment?: string;
  emission_point?: string;
}

export const DEFAULT_INVOICE_SETTINGS: InvoiceSettings = {
  template_id:    'classic',
  accent_color:   '#4f46e5',
  establishment:  '001',
  emission_point: '001',
};
