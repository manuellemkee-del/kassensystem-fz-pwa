
import { Product } from './types';

export const INITIAL_PRODUCTS: Product[] = [
  // Flammkuchen (Standard Selection)
  { id: 's1', name: 'Elsässer', price: 10.00, category: 'Flammkuchen', color: '#fecaca' },
  { id: 's2', name: 'Griechisch', price: 10.00, category: 'Flammkuchen', color: '#e5e7eb' },
  { id: 's3', name: 'Lachs', price: 11.00, category: 'Flammkuchen', color: '#fef3c7' },
  { id: 's4', name: 'Vegan', price: 12.00, category: 'Flammkuchen', color: '#d1fae5' },
  { id: 's5', name: 'Süß', price: 10.00, category: 'Flammkuchen', color: '#fce7f3' },
];

export const CATEGORIES = ['Alle', 'Flammkuchen', 'Getränke', 'Eis'] as const;

export const CATEGORY_COLORS = {
  'Flammkuchen': 'bg-amber-100',
  'Getränke': 'bg-blue-100',
  'Eis': 'bg-pink-100',
  'Alle': 'bg-gray-100'
};
