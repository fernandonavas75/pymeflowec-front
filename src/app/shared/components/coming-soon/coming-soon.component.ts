import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-coming-soon',
  standalone: true,
  template: `
    <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:60vh;gap:16px;color:#6b7280;">
      <span style="font-size:3rem;">🚧</span>
      <h2 style="margin:0;font-size:1.5rem;font-weight:600;color:#374151;">{{ title }}</h2>
      <p style="margin:0;">Este módulo está en desarrollo.</p>
    </div>
  `,
})
export class ComingSoonComponent {
  private route = inject(ActivatedRoute);
  title = (this.route.snapshot.data['title'] as string) ?? 'Módulo en desarrollo';
}
