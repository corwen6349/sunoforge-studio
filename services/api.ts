import { SongGenerationResult, UserProfile, UserStats, User } from '../types';

const API_BASE_URL = 'https://corwen6349.dpdns.org'; // Update this with your deployed Worker URL in production

export const isApiConfigured = () => {
  return true;
};

// --- Auth ---

export const signUp = async (email: string, password: string, displayName?: string): Promise<User> => {
  const response = await fetch(`${API_BASE_URL}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, displayName }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to sign up');
  }

  const user = await response.json();
  localStorage.setItem('user', JSON.stringify(user));
  return user;
};

export const signIn = async (email: string, password: string): Promise<User> => {
  const response = await fetch(`${API_BASE_URL}/api/auth/signin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to sign in');
  }

  const user = await response.json();
  localStorage.setItem('user', JSON.stringify(user));
  return user;
};

export const signOut = async () => {
  // Client-side only for now
  localStorage.removeItem('user');
};

export const getCurrentUser = async (): Promise<User | null> => {
  const userStr = localStorage.getItem('user');
  if (userStr) {
    try {
      return JSON.parse(userStr);
    } catch (e) {
      console.error('Failed to parse user from local storage', e);
      return null;
    }
  }
  return null; 
};

// --- Profile ---

export const getUserProfile = async (userId: string): Promise<UserProfile> => {
  const response = await fetch(`${API_BASE_URL}/api/user/${userId}`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch profile');
  }

  return response.json();
};

export const updateUserProfile = async (userId: string, updates: any): Promise<UserProfile> => {
  const response = await fetch(`${API_BASE_URL}/api/user/${userId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    throw new Error('Failed to update profile');
  }

  // Return updated profile (fetch again or construct)
  return getUserProfile(userId);
};

export const getUserStats = async (userId: string): Promise<UserStats> => {
  const profile = await getUserProfile(userId);
  return (profile as any).stats || { totalGenerations: 0 };
};

// --- History ---

export const saveGenerationToCloud = async (userId: string, generation: SongGenerationResult) => {
  const response = await fetch(`${API_BASE_URL}/api/history`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, data: generation }),
  });

  if (!response.ok) {
    throw new Error('Failed to save generation');
  }
};

export const getCloudHistory = async (userId: string): Promise<SongGenerationResult[]> => {
  const response = await fetch(`${API_BASE_URL}/api/history/${userId}`);
  
  if (!response.ok) {
    return [];
  }

  return response.json();
};

export const deleteGeneration = async (generationId: string, userId: string) => {
  const response = await fetch(`${API_BASE_URL}/api/history/${generationId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error('Failed to delete generation');
  }
};
