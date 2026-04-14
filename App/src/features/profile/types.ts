export interface Profile {
  id: number;
  email: string;
  full_name?: string | null;
  avatar_url?: string | null;
  created_at: string;
  spots_saved: number;
}
