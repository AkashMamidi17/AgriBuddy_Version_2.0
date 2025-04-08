import { apiRequest } from './queryClient';

const API_BASE_URL = 'http://localhost:5000/api';

export const auth = {
  login: (data: { username: string; password: string }) =>
    apiRequest(`${API_BASE_URL}/login`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  register: (data: { username: string; password: string; name: string; userType: string; location: string }) =>
    apiRequest(`${API_BASE_URL}/register`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  logout: () =>
    apiRequest(`${API_BASE_URL}/logout`, {
      method: 'POST',
    }),
};

export const products = {
  getAll: () => apiRequest(`${API_BASE_URL}/products`),
  getById: (id: string) => apiRequest(`${API_BASE_URL}/products/${id}`),
  create: (data: any) =>
    apiRequest(`${API_BASE_URL}/products`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    apiRequest(`${API_BASE_URL}/products/${id}`, {
      method: 'DELETE',
    }),
  placeBid: (id: string, amount: number) =>
    apiRequest(`${API_BASE_URL}/products/${id}/bid`, {
      method: 'POST',
      body: JSON.stringify({ amount }),
    }),
};

export const posts = {
  getAll: () => apiRequest(`${API_BASE_URL}/posts`),
  getById: (id: string) => apiRequest(`${API_BASE_URL}/posts/${id}`),
  create: (data: any) =>
    apiRequest(`${API_BASE_URL}/posts`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    apiRequest(`${API_BASE_URL}/posts/${id}`, {
      method: 'DELETE',
    }),
}; 