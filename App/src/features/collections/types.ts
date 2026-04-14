export interface Collection {
  id: number;
  user_id: number;
  name: string;
  created_at?: string;
}

export interface SavedPlace {
  id: number;
  collection_id: number;
  name: string;
  category?: string | null;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  provider_place_id?: string | null;
  image_url?: string | null;
  rating?: number | null;
  notes?: string | null;
  created_at?: string;
}
