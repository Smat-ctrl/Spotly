export interface Place {
  title: string;
  location: string;
  category: string;
  rating: number;
  imageUrl?: string;
  description?: string;
  providerPlaceId?: string;
  latitude?: number;
  longitude?: number;
  savedPlaceId?: number;
}
