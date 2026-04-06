import { apiClient } from '../services/apiClient';

export interface ActivityEvent {
  id: string;
  type: 'completed' | 'submitted' | 'posted' | 'review';
  username: string;
  avatar_url?: string | null;
  detail: string;
  timestamp: string;
}

export interface ActivityListResponse {
  items: ActivityEvent[];
  total: number;
}

export async function listActivity(): Promise<ActivityEvent[]> {
  try {
    const response = await apiClient<ActivityEvent[] | ActivityListResponse>('/api/activity');
    if (Array.isArray(response)) {
      return response;
    }
    return response.items;
  } catch {
    // Return empty array on error — ActivityFeed will fall back to mock data
    return [];
  }
}
