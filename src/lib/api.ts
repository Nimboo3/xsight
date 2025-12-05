const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

interface FetchOptions extends RequestInit {
  shop?: string;
}

export async function fetchApi<T>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const { shop, ...fetchOptions } = options;

  const headers = new Headers(fetchOptions.headers);
  headers.set('Content-Type', 'application/json');
  
  if (shop) {
    headers.set('X-Shopify-Shop', shop);
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...fetchOptions,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || 'API request failed');
  }

  return response.json();
}

// Helper to get shop from URL params
export function getShopFromUrl(): string | null {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  return params.get('shop');
}
