import { Client } from './client.model';
import { Product } from './product.model';
import { User } from './user.model';

export type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';

export interface OrderDetail {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  product?: Product;
}

export interface Order {
  id: string;
  organization_id: string;
  client_id: string;
  user_id: string;
  order_date: string;
  status: OrderStatus;
  subtotal: number;
  tax: number;
  total: number;
  created_at: string;
  client?: Client;
  user?: User;
  details?: OrderDetail[];
}

export interface CreateOrderDto {
  client_id: string;
  details: {
    product_id: string;
    quantity: number;
    unit_price: number;
  }[];
}
