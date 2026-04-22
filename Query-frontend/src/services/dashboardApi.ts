// src/services/dashboardApi.ts
import { apiFetch } from '@/services/apiClient';

export interface ChartConfig {
  xKey?: string;
  yKey?: string;
  dataKey?: string;
  nameKey?: string;
  colors?: string[];
}

export interface ChartData {
  id: string;
  title: string;
  type: 'line' | 'bar' | 'pie' | 'area' | 'scatter';
  size?: 'small' | 'medium' | 'large' | 'full';
  data: any[];
  config: ChartConfig;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Dashboard {
  id?: number;
  dashboard_id: string;
  user_id?: number;
  name: string;
  description?: string;
  charts: ChartData[];
  created_at?: string;
  updated_at?: string;
  // Legacy compatibility fields
  id_legacy?: string;
  createdAt?: string;
  updatedAt?: string;
}

const BASE_PATH = '/api/custom-dashboards';

function toDashboard(raw: any): Dashboard {
  return {
    id: raw.id,
    dashboard_id: raw.dashboard_id,
    user_id: raw.user_id,
    name: raw.name,
    description: raw.description,
    charts: raw.charts,
    created_at: raw.created_at,
    updated_at: raw.updated_at,
    id_legacy: raw.dashboard_id,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  };
}

export const fetchDashboards = async (userId: number): Promise<Dashboard[]> => {
  const res = await apiFetch(`${BASE_PATH}/${userId}`);
  if (!res.ok) throw new Error(`HTTP error ${res.status}`);
  const data = await res.json();
  return data.map(toDashboard);
};

export const createDashboard = async (
  userId: number,
  dashboard: Omit<Dashboard, 'id' | 'user_id' | 'created_at' | 'updated_at'>
): Promise<Dashboard> => {
  const res = await apiFetch(BASE_PATH, {
    method: 'POST',
    body: JSON.stringify({
      user_id: userId,
      dashboard_id: dashboard.dashboard_id,
      name: dashboard.name,
      description: dashboard.description || '',
      charts: dashboard.charts,
    }),
  });
  if (!res.ok) throw new Error(`HTTP error ${res.status}: ${await res.text()}`);
  return toDashboard(await res.json());
};

export const updateDashboard = async (
  userId: number,
  dashboardId: string,
  updates: Partial<Dashboard>
): Promise<Dashboard> => {
  const res = await apiFetch(`${BASE_PATH}/${dashboardId}?user_id=${userId}`, {
    method: 'PUT',
    body: JSON.stringify({
      name: updates.name,
      description: updates.description,
      charts: updates.charts,
    }),
  });
  if (!res.ok) throw new Error(`HTTP error ${res.status}: ${await res.text()}`);
  return toDashboard(await res.json());
};

export const deleteDashboard = async (userId: number, dashboardId: string): Promise<void> => {
  const res = await apiFetch(`${BASE_PATH}/${dashboardId}?user_id=${userId}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`HTTP error ${res.status}: ${await res.text()}`);
};

export const migrateFromLocalStorage = async (
  userId: number,
  dashboards: Dashboard[]
): Promise<{ success: boolean; message: string }> => {
  const res = await apiFetch(`${BASE_PATH}/migrate-from-localstorage`, {
    method: 'POST',
    body: JSON.stringify({
      user_id: userId,
      dashboards_data: dashboards.map((d) => ({
        id: d.dashboard_id || d.id_legacy,
        name: d.name,
        description: d.description,
        charts: d.charts,
        createdAt: d.created_at || d.createdAt,
        updatedAt: d.updated_at || d.updatedAt,
      })),
    }),
  });
  if (!res.ok) throw new Error(`Migration failed: ${res.status}`);
  return res.json();
};

export const checkApiHealth = async (): Promise<boolean> => {
  try {
    const res = await apiFetch(`${BASE_PATH}/1`);
    return res.ok || res.status === 404;
  } catch {
    return false;
  }
};