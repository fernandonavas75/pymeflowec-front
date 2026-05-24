export interface ProductCategory {
  id: number;
  company_id: number;
  parent_id?: number | null;
  name: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
  parent?: { id: number; name: string } | null;
  children?: ProductCategory[];
}

export interface CreateProductCategoryDto {
  name: string;
  parent_id?: number | null;
  sort_order?: number;
}

export interface UpdateProductCategoryDto {
  name?: string;
  parent_id?: number | null;
  sort_order?: number;
  is_active?: boolean;
}
