import { Injectable, inject } from '@angular/core';
import { AuthService } from './auth.service';
import { Invoice } from '../models/invoice.model';

@Injectable({ providedIn: 'root' })
export class InvoicePdfService {
  private auth = inject(AuthService);

  async download(invoice: Invoice): Promise<void> {
    const [pdfMakeModule, vfsModule] = await Promise.all([
      import('pdfmake/build/pdfmake'),
      import('pdfmake/build/vfs_fonts'),
    ]);

    // pdfmake 0.3.x: el módulo CJS llega como .default en imports dinámicos
    const pdfMake = ((pdfMakeModule as any).default ?? pdfMakeModule) as any;
    const vfs     = ((vfsModule     as any).default ?? vfsModule)     as any;

    // En 0.3.x ya NO se usa pdfMake.vfs: se registra con addVirtualFileSystem()
    pdfMake.addVirtualFileSystem(vfs);

    const company = this.auth.currentUser()?.company;

    return new Promise((resolve, reject) => {
      try {
        pdfMake
          .createPdf(this.buildDoc(invoice, company))
          .download(`factura-${invoice.invoice_number}.pdf`, resolve);
      } catch (err) {
        reject(err);
      }
    });
  }

  private fmt(n: number | string): string {
    return `$${Number(n).toFixed(2)}`;
  }

  private fmtDate(d: string): string {
    return new Date(d).toLocaleDateString('es-EC', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  }

  private buildDoc(invoice: Invoice, company: any): object {
    const companyName   = company?.name        ?? 'Mi Empresa';
    const businessName  = company?.business_name;
    const ruc           = company?.ruc;
    const companyEmail  = company?.email;

    const customerName  = invoice.customer?.full_name       ?? 'Consumidor Final';
    const docNumber     = invoice.customer?.document_number ?? '9999999999999';
    const docLabel      = invoice.customer?.customer_type === 'RUC' ? 'RUC' : 'CI';

    const DARK  = '#0f172a';
    const MUTED = '#64748b';
    const INDIGO = '#4f46e5';
    const RED   = '#dc2626';

    // ── Tabla de ítems ──────────────────────────────────────────
    const tableHeader = [
      { text: 'Cant.',       style: 'th', alignment: 'center' },
      { text: 'Descripción', style: 'th' },
      { text: 'P. Unit.',    style: 'th', alignment: 'right' },
      { text: 'IVA',         style: 'th', alignment: 'right' },
      { text: 'Total',       style: 'th', alignment: 'right' },
    ];

    const tableRows = (invoice.details ?? []).map(d => [
      { text: String(d.quantity),    alignment: 'center', style: 'td' },
      { text: d.product_name,        style: 'td' },
      { text: this.fmt(d.unit_price),alignment: 'right',  style: 'td' },
      {
        stack: [
          { text: this.fmt(d.tax_amount), alignment: 'right', style: 'td' },
          { text: `${d.tax_percentage}%`, alignment: 'right', fontSize: 7, color: MUTED },
        ],
      },
      { text: this.fmt(d.line_total), alignment: 'right', style: 'tdBold' },
    ]);

    // ── Totales ─────────────────────────────────────────────────
    const totalsBody = [
      [
        { text: 'Subtotal', color: MUTED, margin: [0, 3, 0, 3] },
        { text: this.fmt(invoice.subtotal), alignment: 'right', margin: [0, 3, 0, 3] },
      ],
      [
        { text: 'IVA', color: MUTED, margin: [0, 3, 0, 3] },
        { text: this.fmt(invoice.tax_amount), alignment: 'right', margin: [0, 3, 0, 3] },
      ],
      [
        { text: 'TOTAL', bold: true, fontSize: 12, margin: [0, 6, 0, 0] },
        {
          text: this.fmt(invoice.total),
          alignment: 'right',
          bold: true,
          fontSize: 12,
          color: INDIGO,
          margin: [0, 6, 0, 0],
        },
      ],
    ];

    // ── Cabecera del documento ───────────────────────────────────
    const companyStack: any[] = [
      { text: companyName, style: 'companyName' },
    ];
    if (businessName) companyStack.push({ text: businessName, style: 'detail' });
    if (ruc)          companyStack.push({ text: `RUC: ${ruc}`, style: 'detail' });
    if (companyEmail) companyStack.push({ text: companyEmail,  style: 'detail' });

    const invoiceStack: any[] = [
      { text: 'FACTURA', style: 'invoiceTitle' },
      { text: invoice.invoice_number, style: 'invoiceNumber' },
      { text: `Fecha: ${this.fmtDate(invoice.issue_date)}`, style: 'detail', margin: [0, 4, 0, 0] },
    ];
    if (invoice.status === 'CANCELLED') {
      invoiceStack.push({ text: '[ ANULADA ]', color: RED, bold: true, fontSize: 10, margin: [0, 4, 0, 0] });
    }

    return {
      pageSize: 'A4',
      pageMargins: [45, 45, 45, 45],

      content: [
        // ── Header ────────────────────────────────────────────
        {
          columns: [
            { stack: companyStack },
            { stack: invoiceStack, alignment: 'right' },
          ],
          margin: [0, 0, 0, 18],
        },

        // ── Línea divisora ────────────────────────────────────
        {
          canvas: [{
            type: 'line', x1: 0, y1: 0, x2: 505, y2: 0,
            lineWidth: 1.5, lineColor: INDIGO,
          }],
          margin: [0, 0, 0, 16],
        },

        // ── Cliente ───────────────────────────────────────────
        {
          columns: [
            {
              stack: [
                { text: 'FACTURAR A', style: 'sectionLabel' },
                { text: customerName, style: 'customerName' },
                { text: `${docLabel}: ${docNumber}`, style: 'detail', margin: [0, 2, 0, 0] },
              ],
            },
          ],
          margin: [0, 0, 0, 20],
        },

        // ── Tabla de ítems ────────────────────────────────────
        {
          table: {
            headerRows: 1,
            widths: [35, '*', 65, 65, 60],
            body: [tableHeader, ...tableRows],
          },
          layout: {
            hLineWidth: (i: number, node: any) =>
              i === 0 || i === 1 || i === node.table.body.length ? 1 : 0.4,
            vLineWidth: () => 0,
            hLineColor: (i: number) => i === 1 ? INDIGO : '#e2e8f0',
            fillColor: (i: number) => i === 0 ? DARK : (i % 2 === 0 ? '#f8fafc' : null),
          },
          margin: [0, 0, 0, 20],
        },

        // ── Totales ───────────────────────────────────────────
        {
          columns: [
            { text: '', width: '*' },
            {
              width: 200,
              table: {
                widths: ['*', 'auto'],
                body: totalsBody,
              },
              layout: {
                hLineWidth: (i: number, node: any) =>
                  i === node.table.body.length - 1 ? 1 : 0,
                vLineWidth: () => 0,
                hLineColor: () => '#e2e8f0',
              },
            },
          ],
        },

        // ── Pie de página ─────────────────────────────────────
        {
          text: `Generado el ${this.fmtDate(new Date().toISOString())} · PymeFlowEC`,
          style: 'footer',
          margin: [0, 32, 0, 0],
        },
      ],

      styles: {
        companyName:   { fontSize: 15, bold: true, color: DARK },
        invoiceTitle:  { fontSize: 20, bold: true, color: INDIGO },
        invoiceNumber: { fontSize: 10, bold: true, color: DARK, margin: [0, 2, 0, 0] },
        sectionLabel:  { fontSize: 7.5, bold: true, color: MUTED, characterSpacing: 0.8 },
        customerName:  { fontSize: 12, bold: true, color: DARK, margin: [0, 4, 0, 0] },
        detail:        { fontSize: 8.5, color: MUTED },
        th: {
          fontSize: 8.5, bold: true, color: '#f8fafc',
          margin: [4, 5, 4, 5],
        },
        td:     { fontSize: 9,   color: DARK,   margin: [4, 4, 4, 4] },
        tdBold: { fontSize: 9,   bold: true, color: DARK, margin: [4, 4, 4, 4] },
        footer: { fontSize: 7.5, color: '#94a3b8', alignment: 'center' },
      },

      defaultStyle: {
        font: 'Roboto',
        fontSize: 9,
        color: DARK,
      },
    };
  }
}
