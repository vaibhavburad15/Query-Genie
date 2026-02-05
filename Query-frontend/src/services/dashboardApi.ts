// ===============================================
// FRONTEND: Dashboard API Service
// ===============================================
// Create this file: src/services/dashboardApi.ts

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
  id?: number; // Database ID
  dashboard_id: string; // Unique ID
  user_id?: number;
  name: string;
  description?: string;
  charts: ChartData[];
  created_at?: string;
  updated_at?: string;
  // Legacy fields for compatibility
  id_legacy?: string;
  createdAt?: string;
  updatedAt?: string;
}

const API_BASE_URL = 'localhost:8000/api/custom-dashboards';

// ✅ GET: Fetch all dashboards for a user
export const fetchDashboards = async (userId: number): Promise<Dashboard[]> => {
  try {
    console.log(`📥 Fetching dashboards for user ${userId}`);
    const response = await fetch(`${API_BASE_URL}/${userId}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`✅ Fetched ${data.length} dashboards from database`);
    
    // Convert database format to frontend format
    return data.map((dashboard: any) => ({
      id: dashboard.id,
      dashboard_id: dashboard.dashboard_id,
      user_id: dashboard.user_id,
      name: dashboard.name,
      description: dashboard.description,
      charts: dashboard.charts,
      created_at: dashboard.created_at,
      updated_at: dashboard.updated_at,
      // Legacy compatibility
      id_legacy: dashboard.dashboard_id,
      createdAt: dashboard.created_at,
      updatedAt: dashboard.updated_at,
    }));
  } catch (error) {
    console.error('❌ Error fetching dashboards:', error);
    throw error;
  }
};

// ✅ POST: Create a new dashboard
export const createDashboard = async (
  userId: number,
  dashboard: Omit<Dashboard, 'id' | 'user_id' | 'created_at' | 'updated_at'>
): Promise<Dashboard> => {
  try {
    console.log(`📤 Creating dashboard: ${dashboard.name}`);
    const response = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId,
        dashboard_id: dashboard.dashboard_id,
        name: dashboard.name,
        description: dashboard.description || '',
        charts: dashboard.charts,
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }
    
    const data = await response.json();
    console.log('✅ Dashboard created in database:', data);
    
    return {
      id: data.id,
      dashboard_id: data.dashboard_id,
      user_id: data.user_id,
      name: data.name,
      description: data.description,
      charts: data.charts,
      created_at: data.created_at,
      updated_at: data.updated_at,
      id_legacy: data.dashboard_id,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  } catch (error) {
    console.error('❌ Error creating dashboard:', error);
    throw error;
  }
};

// ✅ PUT: Update an existing dashboard
export const updateDashboard = async (
  userId: number,
  dashboardId: string,
  updates: Partial<Dashboard>
): Promise<Dashboard> => {
  try {
    console.log(`📤 Updating dashboard: ${dashboardId}`);
    const response = await fetch(`${API_BASE_URL}/${dashboardId}?user_id=${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: updates.name,
        description: updates.description,
        charts: updates.charts,
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }
    
    const data = await response.json();
    console.log('✅ Dashboard updated in database');
    
    return {
      id: data.id,
      dashboard_id: data.dashboard_id,
      user_id: data.user_id,
      name: data.name,
      description: data.description,
      charts: data.charts,
      created_at: data.created_at,
      updated_at: data.updated_at,
      id_legacy: data.dashboard_id,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  } catch (error) {
    console.error('❌ Error updating dashboard:', error);
    throw error;
  }
};

// ✅ DELETE: Delete a dashboard
export const deleteDashboard = async (
  userId: number,
  dashboardId: string
): Promise<void> => {
  try {
    console.log(`🗑️ Deleting dashboard: ${dashboardId}`);
    const response = await fetch(`${API_BASE_URL}/${dashboardId}?user_id=${userId}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }
    
    console.log('✅ Dashboard deleted from database');
  } catch (error) {
    console.error('❌ Error deleting dashboard:', error);
    throw error;
  }
};

// ✅ MIGRATE: Migrate localStorage data to database
export const migrateFromLocalStorage = async (
  userId: number,
  dashboards: Dashboard[]
): Promise<{ success: boolean; message: string }> => {
  try {
    console.log(`🔄 Migrating ${dashboards.length} dashboards to database`);
    const response = await fetch(`${API_BASE_URL}/migrate-from-localstorage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId,
        dashboards_data: dashboards.map(d => ({
          id: d.dashboard_id || d.id_legacy,
          name: d.name,
          description: d.description,
          charts: d.charts,
          createdAt: d.created_at || d.createdAt,
          updatedAt: d.updated_at || d.updatedAt,
        })),
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Migration failed: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('✅ Migration complete:', data);
    return data;
  } catch (error) {
    console.error('❌ Error migrating dashboards:', error);
    throw error;
  }
};

// ✅ Helper: Check if API is available
export const checkApiHealth = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/1`);
    return response.ok || response.status === 404; // 404 is okay (no dashboards)
  } catch (error) {
    console.warn('⚠️ Dashboard API not available, using localStorage fallback');
    return false;
  }
};