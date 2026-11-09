export interface StoreProduct {
  id: string;
  title: string;
  description?: string | null;
  price: string | number;
  stockQuantity: number;
  sku: string;
  images: string[];
  ratingAverage: string | number;
  isFeatured: boolean;
  category?: { id: string; name: string; slug: string } | null;
}

export interface ProductListResponse {
  items: StoreProduct[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface ProductQuery {
  q?: string;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  isFeatured?: boolean;
  sort?: "newest" | "price" | "rating" | "title";
  direction?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}
