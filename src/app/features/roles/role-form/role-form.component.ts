import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RolesService } from '../../../core/services/roles.service';
import { Permission } from '../../../core/models/role.model';

interface PermissionGroup {
  module: string;
  permissions: Permission[];
}

@Component({
  selector: 'app-role-form',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterLink,
    MatInputModule, MatButtonModule, MatIconModule,
    MatProgressSpinnerModule, MatCheckboxModule,
  ],
  templateUrl: './role-form.component.html',
})
export class RoleFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private svc = inject(RolesService);
  private snackBar = inject(MatSnackBar);

  loading = signal(false);
  saving = signal(false);
  roleId = signal<number | null>(null);
  allPermissions = signal<Permission[]>([]);
  selectedPermissionIds = signal<Set<number>>(new Set());

  form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    description: [''],
  });

  permissionGroups = computed<PermissionGroup[]>(() => {
    const groups = new Map<string, Permission[]>();
    for (const p of this.allPermissions()) {
      if (!groups.has(p.module)) groups.set(p.module, []);
      groups.get(p.module)!.push(p);
    }
    return Array.from(groups.entries()).map(([module, permissions]) => ({ module, permissions }));
  });

  get isEdit(): boolean { return !!this.roleId(); }

  ngOnInit(): void {
    this.svc.listPermissions().subscribe(perms => this.allPermissions.set(perms));

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.roleId.set(+id);
      this.loading.set(true);
      this.svc.getById(+id).subscribe({
        next: role => {
          this.form.patchValue({ name: role.name, description: role.description ?? '' });
          const ids = new Set((role.permissions ?? []).map(p => p.id));
          this.selectedPermissionIds.set(ids);
          this.loading.set(false);
        },
        error: () => { this.loading.set(false); this.router.navigate(['/roles']); },
      });
    }
  }

  togglePermission(id: number): void {
    const current = new Set(this.selectedPermissionIds());
    if (current.has(id)) {
      current.delete(id);
    } else {
      current.add(id);
    }
    this.selectedPermissionIds.set(current);
  }

  isChecked(id: number): boolean {
    return this.selectedPermissionIds().has(id);
  }

  toggleAll(group: PermissionGroup): void {
    const ids = group.permissions.map(p => p.id);
    const allChecked = ids.every(id => this.selectedPermissionIds().has(id));
    const current = new Set(this.selectedPermissionIds());
    if (allChecked) {
      ids.forEach(id => current.delete(id));
    } else {
      ids.forEach(id => current.add(id));
    }
    this.selectedPermissionIds.set(current);
  }

  isGroupAllChecked(group: PermissionGroup): boolean {
    return group.permissions.every(p => this.selectedPermissionIds().has(p.id));
  }

  isGroupIndeterminate(group: PermissionGroup): boolean {
    const checked = group.permissions.filter(p => this.selectedPermissionIds().has(p.id)).length;
    return checked > 0 && checked < group.permissions.length;
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);
    const { name, description } = this.form.value;
    const dto = {
      name: name!,
      description: description || undefined,
      permission_ids: Array.from(this.selectedPermissionIds()),
    };
    const obs = this.isEdit
      ? this.svc.update(this.roleId()!, dto)
      : this.svc.create(dto);
    obs.subscribe({
      next: () => {
        this.snackBar.open(this.isEdit ? 'Rol actualizado' : 'Rol creado', 'OK', { duration: 3000 });
        this.router.navigate(['/roles']);
      },
      error: () => this.saving.set(false),
    });
  }
}
