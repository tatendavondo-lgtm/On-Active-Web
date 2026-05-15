export interface ProductVariant {
  id: string;
  name: string;
  sku: string;
  price: number;
  stock: number;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  sku: string;
  image_url: string;
  variants: ProductVariant[];
  updated_at: string;
}
