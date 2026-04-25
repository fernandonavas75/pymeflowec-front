import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly KEY = 'pf_theme';

  isDark = signal(false);

  constructor() {
    const stored = localStorage.getItem(this.KEY);
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    this.isDark.set(stored ? stored === 'dark' : prefersDark);
    this.apply();
  }

  toggle(): void {
    this.isDark.update(v => !v);
    this.apply();
  }

  private apply(): void {
    const theme = this.isDark() ? 'dark' : 'light';
    document.documentElement.classList.toggle('dark', this.isDark());
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(this.KEY, theme);
  }
}
