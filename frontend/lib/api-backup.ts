// lib/api.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

interface LoginData {
  email: string;
  password: string;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
}

interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'user' | 'collector';
  status: 'active' | 'inactive' | 'pending';
}

interface AuthResponse {
  user: User;
  token: string;
  refreshToken?: string;
}

class ApiService {
  private async fetchApi<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${API_BASE_URL}/api/service`;
      
      // Parsear el body para extraer los datos
      const bodyData = JSON.parse(options.body as string || '{}');
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        credentials: 'include', // Para cookies de sesión
        body: JSON.stringify({
          service: endpoint,
          data: bodyData // Enviar los datos dentro de 'data'
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('API Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error de conexión con el servidor'
      };
    }
  }

  // Autenticación
  async login(credentials: LoginData): Promise<ApiResponse<AuthResponse>> {
    return this.fetchApi<AuthResponse>('auth.login', {
      body: JSON.stringify(credentials)
    });
  }

  async register(userData: RegisterData): Promise<ApiResponse<AuthResponse>> {
    return this.fetchApi<AuthResponse>('auth.register', {
      body: JSON.stringify(userData)
    });
  }

  async logout(): Promise<ApiResponse> {
    const token = localStorage.getItem('token');
    return this.fetchApi('auth.logout', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  }

  async me(): Promise<ApiResponse<User>> {
    const token = localStorage.getItem('token');
    return this.fetchApi<User>('auth.me', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  }

  // Gestión de tokens
  setToken(token: string) {
    localStorage.setItem('token', token);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  removeToken() {
    localStorage.removeItem('token');
  }

  // Verificar si el usuario está autenticado
  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  // ===============================
  // SERVICIOS DE PLANTAS
  // ===============================
  
  // Obtener todas las plantas con paginación y filtros
  async getPlants(params: {
    page?: number;
    limit?: number;
    search?: string;
    family?: string;
    department?: string;
    status?: string;
  } = {}): Promise<ApiResponse<{
    plants: any[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }>> {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        queryParams.append(key, value.toString());
      }
    });
    
    return this.fetchApi('plants.getAll', {
      body: JSON.stringify(params)
    });
  }

  // Obtener planta por ID
  async getPlantById(id: number): Promise<ApiResponse<any>> {
    return this.fetchApi('plants.getById', {
      body: JSON.stringify({ id })
    });
  }

  // Buscar plantas
  async searchPlants(query: string, filters: any = {}): Promise<ApiResponse<any>> {
    return this.fetchApi('plants.search', {
      body: JSON.stringify({ query, ...filters })
    });
  }

  // Obtener plantas destacadas
  async getFeaturedPlants(): Promise<ApiResponse<any[]>> {
    return this.fetchApi('plants.getFeatured');
  }

  // Obtener opciones de filtros
  async getFilterOptions(): Promise<ApiResponse<{
    families: Array<{ value: string; label: string; count: number }>;
    departments: Array<{ value: string; label: string; count: number }>;
    municipalities: Array<{ value: string; label: string; count: number }>;
  }>> {
    return this.fetchApi('plants.getFilterOptions');
  }

  // ===============================
  // SERVICIOS DE PLANTAS
  // ===============================
  
  // Obtener todas las plantas con paginación y filtros
  async getPlants(params: {
    page?: number;
    limit?: number;
    search?: string;
    family?: string;
    department?: string;
    municipality?: string;
    status?: string;
  } = {}): Promise<ApiResponse<{
    plants: any[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    }
  }>> {
    return this.fetchApi('plants.getAll', {
      body: JSON.stringify(params)
    });
  }

  // Obtener planta por ID
  async getPlantById(id: number): Promise<ApiResponse<any>> {
    return this.fetchApi('plants.getById', {
      body: JSON.stringify({ id })
    });
  }

  // Búsqueda avanzada de plantas
  async searchPlants(params: {
    query?: string;
    family?: string;
    genus?: string;
    species?: string;
    department?: string;
    municipality?: string;
    collector?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<{
    plants: any[];
    pagination: any;
  }>> {
    return this.fetchApi('plants.advancedSearch', {
      body: JSON.stringify(params)
    });
  }

  // Obtener plantas destacadas
  async getFeaturedPlants(limit: number = 6): Promise<ApiResponse<any[]>> {
    return this.fetchApi('plants.getFeatured', {
      body: JSON.stringify({ limit })
    });
  }

  // ===============================
  // SERVICIOS DE DASHBOARD (ADMIN)
  // ===============================
  
  // Obtener estadísticas generales
  async getDashboardStats(): Promise<ApiResponse<{
    totalPlants: number;
    totalFamilies: number;
    totalGenera: number;
    totalUsers: number;
    totalImages: number;
    totalViews: number;
  }>> {
    const token = this.getToken();
    return this.fetchApi('dashboard.getStats', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
  }

  // Obtener actividad reciente
  async getRecentActivity(limit: number = 10): Promise<ApiResponse<any[]>> {
    const token = this.getToken();
    return this.fetchApi('dashboard.getRecentActivity', {
      headers: { 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ limit })
    });
  }

  // Obtener estadísticas de visitantes
  async getVisitorStats(period: 'day' | 'week' | 'month' = 'week'): Promise<ApiResponse<{
    labels: string[];
    data: number[];
  }>> {
    const token = this.getToken();
    return this.fetchApi('dashboard.getVisitorStats', {
      headers: { 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ period })
    });
  }

  // ===============================
  // SERVICIOS DE FILTROS Y TAXONOMÍA
  // ===============================
  
  // Obtener opciones para filtros
  async getFilterOptions(): Promise<ApiResponse<{
    families: Array<{value: string, label: string}>;
    departments: Array<{value: string, label: string}>;
    municipalities: Array<{value: string, label: string}>;
    collectors: Array<{value: string, label: string}>;
  }>> {
    return this.fetchApi('filters.getOptions');
  }

  // Obtener familias
  async getFamilies(): Promise<ApiResponse<Array<{value: string, label: string}>>> {
    return this.fetchApi('taxonomy.getFamilies');
  }

  // Obtener géneros por familia
  async getGenera(family?: string): Promise<ApiResponse<Array<{value: string, label: string}>>> {
    return this.fetchApi('taxonomy.getGenera', {
      body: JSON.stringify({ family })
    });
  }

  // Obtener ubicaciones
  async getLocations(): Promise<ApiResponse<{
    departments: Array<{value: string, label: string}>;
    municipalities: Array<{value: string, label: string}>;
  }>> {
    return this.fetchApi('locations.getAll');
  }

  // ===============================
  // SERVICIOS DE CONFIGURACIONES
  // ===============================
  
  // Obtener configuraciones públicas
  async getPublicSettings(): Promise<ApiResponse<{
    siteName: string;
    siteDescription: string;
    institutionName: string;
    contactEmail: string;
    institutionAddress: string;
    institutionPhone: string;
    herbariumCode: string;
  }>> {
    return this.fetchApi('settings.getPublic');
  }

  // ===============================
  // SERVICIOS DE SUGERENCIAS
  // ===============================
  
  // Obtener todas las sugerencias
  async getSuggestions(params: {
    page?: number;
    limit?: number;
    status?: string;
    type?: string;
  } = {}): Promise<ApiResponse<{
    suggestions: any[];
    pagination: any;
  }>> {
    return this.fetchApi('suggestions.getAll', {
      body: JSON.stringify(params)
    });
  }

  // Crear nueva sugerencia
  async createSuggestion(data: {
    title: string;
    description: string;
    type: 'feature' | 'bug' | 'improvement' | 'data_correction' | 'new_plant';
    plantId?: number;
  }): Promise<ApiResponse<any>> {
    const token = this.getToken();
    return this.fetchApi('suggestions.create', {
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      body: JSON.stringify(data)
    });
  }

  // ===============================
  // SERVICIOS DE ESTADÍSTICAS PÚBLICAS
  // ===============================
  
  // Obtener estadísticas para la página principal
  async getPublicStats(): Promise<ApiResponse<{
    totalPlants: number;
    totalFamilies: number;
    totalGenera: number;
    featuredPlants: any[];
  }>> {
    return this.fetchApi('public.getStats');
  }

  // ===============================
  // SERVICIOS DE BÚSQUEDA
  // ===============================
  
  // Búsqueda simple
  async simpleSearch(query: string, page: number = 1, limit: number = 12): Promise<ApiResponse<{
    plants: any[];
    pagination: any;
  }>> {
    return this.fetchApi('plants.search', {
      body: JSON.stringify({ query, page, limit })
    });
  }

  // Autocompletado
  async getAutocomplete(query: string, type: 'all' | 'scientific' | 'common' | 'family' = 'all'): Promise<ApiResponse<Array<{
    id: number;
    value: string;
    type: string;
    label: string;
  }>>> {
    return this.fetchApi('autocomplete.search', {
      body: JSON.stringify({ query, type })
    });
  }
}

export const apiService = new ApiService();
export type { User, AuthResponse, ApiResponse, LoginData, RegisterData };
