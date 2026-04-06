export interface Category {
  id: number;
  organization_id: number;
  parent_id: number | null;
  parent?: { id: number; name: string } | null;
  name: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

export interface CreateCategoryDto {
  name: string;
  parent_id?: number | null;
  sort_order?: number;
  is_active?: boolean;
}

export interface UpdateCategoryDto extends Partial<CreateCategoryDto> {}
