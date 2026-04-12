export interface TaxRate {
  id: number;
  company_id: number;
  tax_name: string;
  percentage: number;
  is_active: boolean;
  valid_from: string;
  valid_to?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateTaxRateDto {
  tax_name: string;
  percentage: number;
  is_active?: boolean;
  valid_from?: string;
  valid_to?: string;
}

export interface UpdateTaxRateDto extends Partial<CreateTaxRateDto> {}
