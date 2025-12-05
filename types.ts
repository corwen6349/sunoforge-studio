
export interface LiveModifier {
  id: string;
  label: string;
  description: string;
  icon: string;
}

export interface TrackItem {
  position: number;
  title: string;
  style: string;
  duration?: string;
}

export interface SongGenerationResult {
  id?: string;
  createdAt?: number;
  type?: 'single' | 'album';
  title: string;
  albumTitle?: string;
  trackList?: TrackItem[];
  stylePrompt: string;
  lyrics: string;
  coverArtPrompt: string;
  explanation?: string;
  
  // Musical Composition Data
  musicalKey?: string;
  bpm?: string;
  chordProgression?: string[];
}

export interface GenerationState {
  isLoading: boolean;
  result: SongGenerationResult | null;
  error: string | null;
}

export interface UserInput {
  topic: string;
  selectedModifiers: string[];
}

export interface MusicStyle {
  id: string;
  label: string;
  value: string;
  icon?: string;
}

// AI Configuration Types
export type AIProvider = 'google' | 'deepseek';

export interface AIModel {
  id: string;
  name: string;
  provider: AIProvider;
}

// User Profile Types
export interface User {
  id: string;
  email: string;
  display_name?: string;
  avatar_url?: string;
  bio?: string;
}

export interface UserProfile extends User {
  created_at: string;
  updated_at?: string;
}

// User Statistics
export interface UserStats {
  totalGenerations: number;
  singleCount: number;
  albumCount: number;
  joinDate: number;
}
