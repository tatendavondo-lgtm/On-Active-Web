export interface Customer {
  id: string;
  full_name: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
  source: 'pos' | 'web' | 'both';
}
