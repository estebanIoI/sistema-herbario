// lib/api.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  code?: string;
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
  role: 'admin' | 'investigador' | 'collector' | 'user';
  status: 'active' | 'inactive' | 'pending';
}

interface AuthResponse {
  user: User;
  token: string;
  refreshToken?: string;
}

export interface TaxonNode {
  name: string;
  type: 'kingdom' | 'phylum' | 'class' | 'order' | 'family' | 'genus' | 'species';
  plantCount: number;
  children?: TaxonNode[];
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
      
      // Extraer token: primero del header explícito, luego del storage
      let token: string | null = null;
      if (options.headers && 'Authorization' in options.headers) {
        const authHeader = options.headers['Authorization'] as string;
        token = authHeader.replace('Bearer ', '');
      }
      if (!token) {
        token = this.getToken();
      }
      
      const requestBody: any = {
        service: endpoint,
        data: bodyData
      };
      
      // Agregar token al body si existe
      if (token) {
        requestBody.token = token;
      }
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Para cookies de sesión
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!response.ok) {
        // Devolver el error del servidor con el mensaje descriptivo
        return {
          success: false,
          error: data.error || `HTTP error! status: ${response.status}`,
          code: data.code
        };
      }

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
    try {
      const token = this.getToken();
      if (!token) {
        console.error("Error en me(): Token no disponible");
        return {
          success: false,
          error: "No autorizado - Token no disponible"
        };
      }
      
      console.log("Verificando sesión con token:", token.substring(0, 10) + "...");
      
      return this.fetchApi<User>('auth.me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
    } catch (error) {
      console.error("Error en me():", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Error desconocido al verificar sesión"
      };
    }
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
    municipality?: string;
    status?: string;
    catalog_number?: string;
    record_number?: string;
    collector?: string;
    habitat?: string;
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

  // ── Publicaciones ────────────────────────────────────────────────────────────

  async getPosts(params: { category?: string; page?: number; limit?: number; search?: string; status?: string } = {}): Promise<ApiResponse<{ posts: any[]; total: number; page: number; limit: number }>> {
    return this.fetchApi('posts.getAll', { body: JSON.stringify(params) });
  }

  async getPostById(id: number): Promise<ApiResponse<any>> {
    return this.fetchApi('posts.getById', { body: JSON.stringify({ id }) });
  }

  async createPost(data: { title: string; content?: string; excerpt?: string; image_url?: string; category?: string; tags?: string; status?: string }): Promise<ApiResponse<any>> {
    return this.fetchApi('posts.create', {
      body: JSON.stringify(data),
      headers: { Authorization: `Bearer ${this.getToken()}` }
    });
  }

  async updatePost(id: number, data: Partial<{ title: string; content: string; excerpt: string; image_url: string; category: string; tags: string; status: string }>): Promise<ApiResponse<any>> {
    return this.fetchApi('posts.update', {
      body: JSON.stringify({ id, ...data }),
      headers: { Authorization: `Bearer ${this.getToken()}` }
    });
  }

  async deletePost(id: number): Promise<ApiResponse<any>> {
    return this.fetchApi('posts.delete', {
      body: JSON.stringify({ id }),
      headers: { Authorization: `Bearer ${this.getToken()}` }
    });
  }

  // Obtener plantas para el mapa (con coordenadas y metadatos enriquecidos)
  async getPlantsForMap(params: {
    search?: string;
    family?: string;
    department?: string;
    municipality?: string;
    limit?: number;
  } = {}): Promise<ApiResponse<{
    plants: Array<{
      id: number;
      scientific_name: string;
      vernacular_name?: string;
      family: string;
      decimal_latitude: number;
      decimal_longitude: number;
      department?: string;
      municipality?: string;
      recorded_by?: string;
      event_date?: string;
      catalog_number?: string;
      altitude?: number | null;
      habit?: string;
      image?: string;
      status?: string;
      genus?: string;
      collector_number?: string;
      author?: string;
      conservation_status?: string;
      has_uses?: number;
    }>;
    total: number;
    hasMore: boolean;
  }>> {
    return this.fetchApi('plants.getForMap', {
      body: JSON.stringify({ limit: 2000, ...params })
    });
  }

  // Obtener planta por ID
  // Cache de respuestas para evitar duplicar solicitudes idénticas
  private plantCache: Record<number, {data: ApiResponse<any>, timestamp: number}> = {}
  
  async getPlantById(id: number): Promise<ApiResponse<any>> {
    // Verificar si tenemos una respuesta en caché reciente (menos de 30 segundos)
    const now = Date.now();
    const cachedResponse = this.plantCache[id];
    if (cachedResponse && now - cachedResponse.timestamp < 30000) {
      return cachedResponse.data;
    }
    
    // Si no hay caché o está obsoleta, hacer la solicitud
    const response = await this.fetchApi('plants.getById', {
      body: JSON.stringify({ id })
    });
    
    // Guardar en caché
    this.plantCache[id] = {
      data: response,
      timestamp: now
    };
    
    return response;
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
    return this.fetchApi('public.getFeaturedPlants', {
      body: JSON.stringify({ limit })
    });
  }

  // ===============================
  // SERVICIOS DE ADMINISTRACIÓN DE PLANTAS
  // ===============================
  
  // Crear nueva planta (admin)
  async createPlant(plantData: any): Promise<ApiResponse<any>> {
    const token = this.getToken();

    if (plantData.localImages && plantData.localImages.length > 0) {
      const processedImages: Array<{id?: number; url: string; thumbnailUrl?: string; filename: string; originalName: string}> = [];

      for (const imageData of plantData.localImages) {
        if (imageData.id) {
          processedImages.push({
            id: imageData.id,
            url: imageData.url,
            thumbnailUrl: imageData.thumbnailUrl,
            filename: imageData.filename || imageData.originalName,
            originalName: imageData.originalName
          });
        } else if (imageData.file) {
          try {
            const uploadResponse = await this.uploadImage(imageData.file, { entityType: 'plant', isTemporary: true });
            if (uploadResponse.success && uploadResponse.data) {
              processedImages.push({
                id: uploadResponse.data.id,
                url: uploadResponse.data.url,
                thumbnailUrl: uploadResponse.data.thumbnailUrl,
                filename: uploadResponse.data.filename,
                originalName: uploadResponse.data.originalName
              });
            } else {
              console.warn('Error uploading image during plant creation:', uploadResponse.error);
            }
          } catch (error) {
            console.warn('Error uploading image during plant creation:', error);
          }
        }
      }

      const allImages = [...(plantData.existingImages || []), ...processedImages];
      plantData = {
        ...plantData,
        imageIds: allImages.map(img => img.id).filter(Boolean),
        imageUrls: allImages.map(img => img.url).filter(Boolean),
        images: allImages
      };
      delete plantData.localImages;
      delete plantData.existingImages;
    }

    return this.fetchApi('plants.create', {
      headers: { 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(plantData)
    });
  }

  // Actualizar planta (admin)
  async updatePlant(id: number, plantData: any): Promise<ApiResponse<any>> {
    const token = this.getToken();

    if (plantData.localImages && plantData.localImages.length > 0) {
      const processedImages: Array<{id?: number; url: string; thumbnailUrl?: string; filename: string; originalName: string}> = [];

      for (const imageData of plantData.localImages) {
        if (imageData.id) {
          processedImages.push({
            id: imageData.id,
            url: imageData.url,
            thumbnailUrl: imageData.thumbnailUrl,
            filename: imageData.filename || imageData.originalName,
            originalName: imageData.originalName
          });
        } else if (imageData.file) {
          try {
            const uploadResponse = await this.uploadImage(imageData.file, { entityType: 'plant', isTemporary: true });
            if (uploadResponse.success && uploadResponse.data) {
              processedImages.push({
                id: uploadResponse.data.id,
                url: uploadResponse.data.url,
                thumbnailUrl: uploadResponse.data.thumbnailUrl,
                filename: uploadResponse.data.filename,
                originalName: uploadResponse.data.originalName
              });
            } else {
              console.warn('Error uploading image during plant update:', uploadResponse.error);
            }
          } catch (error) {
            console.warn('Error uploading image during plant update:', error);
          }
        }
      }

      const allImages = [...(plantData.existingImages || []), ...processedImages];
      plantData = {
        ...plantData,
        imageIds: allImages.map(img => img.id).filter(Boolean),
        imageUrls: allImages.map(img => img.url).filter(Boolean),
        images: allImages
      };
      delete plantData.localImages;
      delete plantData.existingImages;
    }

    return this.fetchApi('plants.update', {
      headers: { 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ id, ...plantData })
    });
  }

  // Archivar planta (soft delete, admin) — conserva el registro con motivo
  async deletePlant(id: number, reason?: string): Promise<ApiResponse<any>> {
    const token = this.getToken();
    return this.fetchApi('plants.delete', {
      headers: { 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ id, reason: reason || null })
    });
  }

  // Restaurar planta archivada (admin)
  async restorePlant(id: number): Promise<ApiResponse<any>> {
    const token = this.getToken();
    return this.fetchApi('plants.restore', {
      headers: { 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ id })
    });
  }

  // Purgar registros soft-deleted heredados (limpieza de datos legacy)
  async purgeDeletedPlants(): Promise<ApiResponse<{ purged: number; message: string }>> {
    const token = this.getToken();
    return this.fetchApi('plants.purgeDeleted', {
      headers: { 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({})
    });
  }

  // Importar plantas desde Excel (batch create, admin)
  async importPlants(plants: any[]): Promise<ApiResponse<{ imported: number; errors: any[] }>> {
    const token = this.getToken();
    return this.fetchApi('plants.import', {
      headers: { 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ plants })
    });
  }

  // Actualizar estado de múltiples plantas (bulk publish/draft/delete)
  async bulkUpdatePlants(ids: number[], status: string): Promise<ApiResponse<{ updated: number }>> {
    const token = this.getToken();
    return this.fetchApi('plants.bulkDelete', {
      headers: { 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ ids, action: status === 'deleted' ? 'delete' : 'updateStatus', status })
    });
  }

  // ===============================
  // SERVICIOS DE DASHBOARD (ADMIN)
  // ===============================
  
  // Obtener estadísticas generales del dashboard admin
  async getDashboardStats(): Promise<ApiResponse<{
    overview: {
      totalPlants: number;
      totalUsers: number;
      plantsThisMonth: number;
      usersThisMonth: number;
    };
    distributions: {
      topFamilies: Array<{ family: string; count: number }>;
      topDepartments: Array<{ department: string; count: number }>;
      topCollectors: Array<{ collector: string; count: number }>;
    };
    trends: {
      yearlyStats: Array<{ year: number; count: number }>;
      monthlyStats: Array<{ year: number; month: number; month_name: string; count: number }>;
    };
    recentActivity: Array<{ id: number; scientific_name: string; family: string; created_at: string; created_by_name: string }>;
  }>> {
    const token = this.getToken();
    return this.fetchApi('dashboard.getStats', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
  }

  // Obtener plantas más vistas
  async getMostViewedPlants(limit: number = 5): Promise<ApiResponse<Array<{
    id: number;
    scientific_name: string;
    views: number;
  }>>> {
    return this.fetchApi('plants.getMostViewed', {
      body: JSON.stringify({ limit })
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
  async getVisitorStats(period: '24h' | '7d' | '30d' | '90d' = '30d'): Promise<ApiResponse<{
    chartData: Array<{ name: string; users: number; visits: number }>;
    period: string;
    totalVisits: number;
    totalUsers: number;
  }>> {
    const token = this.getToken();
    return this.fetchApi('dashboard.getVisitorsChart', {
      headers: { 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ period })
    });
  }

  // ===============================
  // SERVICIOS DE FILTROS Y TAXONOMÍA
  // ===============================
  
  // Obtener opciones para filtros
  async getFilterOptions(): Promise<ApiResponse<{
    families:      Array<{value: string, label: string}>;
    genera:        Array<{value: string, label: string}>;
    departments:   Array<{value: string, label: string}>;
    municipalities:Array<{value: string, label: string}>;
    collectors:    Array<{value: string, label: string}>;
  }>> {
    return this.fetchApi('filters.getFilterOptions');
  }

  // Exportar especímenes filtrados como CSV
  async exportPlants(filters?: {
    search?: string; family?: string; genus?: string; species?: string;
    department?: string; municipality?: string; collector?: string;
    vernacular_name?: string; catalog_number?: string; record_number?: string;
    habitat?: string;
  }): Promise<ApiResponse<{ csv: string; filename: string; count: number; format: string }>> {
    return this.fetchApi('plants.export', { body: JSON.stringify(filters ?? {}) });
  }

  // Exportación Darwin Core compatible con GBIF (DwC-A / CSV-DwC / Excel)
  // Devuelve el archivo en base64 para descargar en el cliente.
  async exportDwc(
    format: 'dwca' | 'dwc-csv' | 'excel',
    filters?: Record<string, string | undefined>
  ): Promise<ApiResponse<{ base64: string; filename: string; mimeType: string; count: number; format: string }>> {
    return this.fetchApi('plants.exportDwc', {
      body: JSON.stringify({ ...(filters ?? {}), format })
    });
  }

  // ===============================
  // USUARIOS (gestión admin)
  // ===============================
  async getUsers(params?: {
    page?: number; limit?: number; search?: string;
    role?: string; status?: string; sortBy?: string; sortDir?: string;
  }): Promise<ApiResponse<any>> {
    return this.fetchApi('users.getAll', { body: JSON.stringify(params ?? {}) });
  }

  async createUser(data: {
    name: string; email: string; password: string;
    role?: string; phone?: string;
  }): Promise<ApiResponse<any>> {
    return this.fetchApi('users.create', { body: JSON.stringify(data) });
  }

  async updateUser(data: {
    id: number; name?: string; email?: string; role?: string;
    status?: string; phone?: string; password?: string;
  }): Promise<ApiResponse<any>> {
    return this.fetchApi('users.update', { body: JSON.stringify(data) });
  }

  async toggleUserStatus(id: number): Promise<ApiResponse<any>> {
    return this.fetchApi('users.toggleStatus', { body: JSON.stringify({ id }) });
  }

  async deleteUser(id: number): Promise<ApiResponse<any>> {
    return this.fetchApi('users.delete', { body: JSON.stringify({ id }) });
  }

  // Buscador de colectores (usuarios BD + recorded_by existentes)
  async getCollectors(q: string): Promise<ApiResponse<{ collectors: string[] }>> {
    return this.fetchApi('plants.getCollectors', { body: JSON.stringify({ q }) });
  }

  // Colecciones distintas registradas en la BD
  async getCollections(q?: string): Promise<ApiResponse<{ collections: { code: string; id: string }[] }>> {
    return this.fetchApi('plants.getCollections', { body: JSON.stringify({ q }) });
  }

  // Generar backup SQL completo de la BD
  async generateBackup(tables?: string[]): Promise<ApiResponse<{ sql: string; filename: string; sizeKb: number; tables: number }>> {
    return this.fetchApi('backup.generate', { body: JSON.stringify({ tables }) });
  }

  // Obtener familias
  async getFamilies(): Promise<ApiResponse<{
    families: Array<{
      name: string;
      speciesCount: number;
      generaCount: number;
      genera: string[];
      recentSpecimen: any;
    }>;
    total: number;
  }>> {
    return this.fetchApi('taxonomy.getFamilies');
  }

  // Jerarquía taxonómica completa (reino → especie)
  async getTaxonomyHierarchy(): Promise<ApiResponse<{
    levels: string[]
    totalTaxa: number
    tree: TaxonNode[]
  }>> {
    return this.fetchApi('taxonomy.getHierarchy');
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
  // GBIF (proxy a través del backend)
  // ===============================

  // ===============================
  // GEO (países, estados, ciudades)
  // ===============================

  async geoGetCountries(): Promise<ApiResponse<{ countries: string[] }>> {
    return this.fetchApi('geo.getCountries')
  }

  async geoGetStates(country: string): Promise<ApiResponse<{ states: string[] }>> {
    return this.fetchApi('geo.getStates', { body: JSON.stringify({ country }) })
  }

  async geoGetCities(country: string, state: string): Promise<ApiResponse<{ cities: string[] }>> {
    return this.fetchApi('geo.getCities', { body: JSON.stringify({ country, state }) })
  }

  async gbifSuggest(q: string, limit = 8): Promise<ApiResponse<{
    suggestions: Array<{
      key: number
      canonicalName: string
      scientificName: string
      rank: string
      family: string
      genus: string
      status: string
    }>
  }>> {
    return this.fetchApi('gbif.suggest', { body: JSON.stringify({ q, limit }) })
  }

  async gbifMatch(name: string): Promise<ApiResponse<{
    found: boolean
    matchType: string
    confidence?: number
    usageKey?: number
    scientificName?: string
    scientificNameAuthorship?: string
    specificEpithet?: string
    taxonRank?: string
    kingdom?: string
    phylum?: string
    class?: string
    orderName?: string
    family?: string
    genus?: string
  }>> {
    return this.fetchApi('gbif.match', { body: JSON.stringify({ name }) })
  }

  // ===============================
  // SERVICIOS DE CONFIGURACIONES
  // ===============================
  
  // Obtener configuraciones públicas (usadas en la homepage)
  async getPublicSettings(): Promise<ApiResponse<Record<string, any>>> {
    return this.fetchApi('settings.getPublic');
  }

  // Obtener todas las configuraciones (admin)
  async getAllSettings(): Promise<ApiResponse<Array<{
    id: number; key_name: string; value: string; type: string; category: string; description: string; is_public: boolean;
  }>>> {
    const token = this.getToken();
    return this.fetchApi('settings.getAll', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
  }

  // Actualizar una configuración (admin)
  async updateSetting(key: string, value: string | boolean | number): Promise<ApiResponse<{ key: string; value: string }>> {
    const token = this.getToken();
    return this.fetchApi('settings.update', {
      headers: { 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ key, value: String(value) })
    });
  }

  // Actualizar múltiples configuraciones de golpe (admin)
  async updateSettings(settings: Array<{ key: string; value: string | boolean | number }>): Promise<ApiResponse<{ updated: number }>> {
    const token = this.getToken();
    return this.fetchApi('settings.updateMultiple', {
      headers: { 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ settings: settings.map(s => ({ key: s.key, value: String(s.value) })) })
    });
  }

  // Probar conexión con Cloudinary usando las credenciales guardadas en BD (admin)
  async testCloudinaryConnection(): Promise<ApiResponse<{ configured: boolean; cloudName?: string; message: string }>> {
    const token = this.getToken();
    return this.fetchApi('settings.testCloudinary', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
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
    try {
      const token = this.getToken();
      if (!token) {
        console.error("Error de autenticación: Token no disponible");
        return {
          success: false,
          error: "No autorizado - Se requiere iniciar sesión para acceder a las sugerencias"
        };
      }
      
      console.log("Llamando a getSuggestions con token:", token.substring(0, 10) + "...");
      
      return this.fetchApi('suggestions.getAll', {
        headers: { 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(params)
      });
    } catch (error) {
      console.error("Error en getSuggestions:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Error desconocido al obtener sugerencias"
      };
    }
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

  // Actualizar el estado de una sugerencia
  async updateSuggestionStatus(id: number, status: string, notes?: string): Promise<ApiResponse<any>> {
    const token = this.getToken();
    if (!token) {
      return { success: false, error: 'No autorizado' };
    }
    
    console.log(`Actualizando sugerencia ${id} a estado ${status}`);
    
    return this.fetchApi('suggestions.updateStatus', {
      headers: { 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ id, status, notes })
    });
  }
  
  // Aprobar una sugerencia
  async approveSuggestion(id: number, notes?: string): Promise<ApiResponse<any>> {
    const token = this.getToken();
    if (!token) {
      return { success: false, error: 'No autorizado' };
    }
    
    console.log(`Aprobando sugerencia ${id}`);
    
    return this.fetchApi('suggestions.approve', {
      headers: { 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ id, notes })
    });
  }
  
  // Rechazar una sugerencia
  async rejectSuggestion(id: number, notes?: string): Promise<ApiResponse<any>> {
    const token = this.getToken();
    if (!token) {
      return { success: false, error: 'No autorizado' };
    }
    
    console.log(`Rechazando sugerencia ${id}`);
    
    return this.fetchApi('suggestions.reject', {
      headers: { 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ id, notes })
    });
  }
  
  // Contar sugerencias no leídas
  async countUnreadSuggestions(): Promise<ApiResponse<{ count: number }>> {
    const token = this.getToken();
    if (!token) {
      console.warn("No hay token disponible para contar sugerencias no leídas");
      return { success: false, error: 'No autorizado' };
    }
    
    return this.fetchApi('suggestions.countUnread', {
      headers: { 'Authorization': `Bearer ${token}` }
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
    totalSpecies: number;
    featuredPlants?: any[];
  }>> {
    return this.fetchApi('public.getStats');
  }

  // ===============================
  // CHATBOT (asistente virtual público)
  // ===============================
  async chatbotSend(
    messages: { role: 'user' | 'assistant'; content: string }[]
  ): Promise<ApiResponse<{ reply: string; provider: string }>> {
    return this.fetchApi('chatbot.send', {
      body: JSON.stringify({ messages }),
    });
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

  // ===============================
  // SERVICIOS DE UPLOADS
  // ===============================
  
  // Subir imagen individual
  async uploadImage(file: File, options?: {
    entityType?: string;
    entityId?: number;
    isTemporary?: boolean;
  }): Promise<ApiResponse<{
    id: number;
    filename: string;
    originalName: string;
    url: string;
    thumbnailUrl: string;
    size: number;
    mimeType: string;
    hash: string;
  }>> {
    try {
      const formData = new FormData();
      formData.append('image', file);
      
      if (options?.entityType) formData.append('entity_type', options.entityType);
      if (options?.entityId) formData.append('entity_id', options.entityId.toString());
      if (options?.isTemporary !== undefined) formData.append('is_temporary', options.isTemporary.toString());

      const headers: HeadersInit = {};
      const token = this.getToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Determinar el endpoint basado en el tipo de entidad
      let endpoint = `${API_BASE_URL}/api/uploads/single`;
      if (options?.entityType === 'plant') {
        endpoint = `${API_BASE_URL}/api/plantas/upload`;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: formData
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Endpoint no encontrado');
        }
        if (response.status === 401) {
          throw new Error('No autorizado');
        }
        throw new Error(`Error HTTP: ${response.status}`);
      }

      return await response.json();
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Error al subir imagen',
        message: error.message || 'Error al subir imagen'
      };
    }
  }

  // Subir múltiples imágenes
  async uploadMultipleImages(files: File[], options?: {
    entityType?: string;
    entityId?: number;
    isTemporary?: boolean;
  }): Promise<ApiResponse<Array<{
    id: number;
    filename: string;
    originalName: string;
    url: string;
    thumbnailUrl: string;
    size: number;
    mimeType: string;
    hash: string;
  }>>> {
    const formData = new FormData();
    
    files.forEach(file => {
      formData.append('images', file);
    });
    
    if (options?.entityType) formData.append('entity_type', options.entityType);
    if (options?.entityId) formData.append('entity_id', options.entityId.toString());
    if (options?.isTemporary !== undefined) formData.append('is_temporary', options.isTemporary.toString());

    const response = await fetch(`${API_BASE_URL}/api/uploads/multiple`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.getToken()}`,
      },
      body: formData
    });

    return response.json();
  }

  // ===============================
  // SERVICIOS DE PQRSDF
  // ===============================

  async createPqrsdf(data: {
    tipo: string;
    anonimo?: boolean;
    nombre?: string;
    tipo_identificacion?: string;
    numero_documento?: string;
    direccion_correspondencia?: string;
    medio_respuesta?: string;
    telefono?: string;
    pais?: string;
    departamento?: string;
    ciudad?: string;
    email?: string;
    fax?: string;
    mensaje: string;
    autoriza: boolean;
  }): Promise<ApiResponse<{ radicado: string; tipo: string; fechaRadicacion: string; tiempoRespuesta: string; message: string }>> {
    return this.fetchApi('pqrsdf.create', {
      body: JSON.stringify(data)
    });
  }

  async getPqrsdf(params: { tipo?: string; status?: string; page?: number; limit?: number } = {}): Promise<ApiResponse<{
    pqrsdf: any[];
    total: number;
    page: number;
    pages: number;
  }>> {
    const token = this.getToken();
    return this.fetchApi('pqrsdf.getAll', {
      body: JSON.stringify(params),
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  async updatePqrsdfStatus(id: number, status: 'pendiente' | 'en_revision' | 'respondido'): Promise<ApiResponse<any>> {
    const token = this.getToken();
    return this.fetchApi('pqrsdf.updateStatus', {
      body: JSON.stringify({ id, status }),
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  async getPqrsdfById(id: number): Promise<ApiResponse<{ pqrsdf: any; history: any[] }>> {
    const token = this.getToken();
    return this.fetchApi('pqrsdf.getById', {
      body: JSON.stringify({ id }),
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  async respondToPqrsdf(id: number, respuesta: string): Promise<ApiResponse<any>> {
    const token = this.getToken();
    return this.fetchApi('pqrsdf.respond', {
      body: JSON.stringify({ id, respuesta }),
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  async respondToSuggestion(id: number, admin_response: string): Promise<ApiResponse<any>> {
    const token = this.getToken();
    return this.fetchApi('suggestions.respond', {
      body: JSON.stringify({ id, admin_response }),
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  // Eliminar imagen
  async deleteImage(imageId: number): Promise<ApiResponse> {
    return this.fetchApi('uploads.deleteImage', {
      body: JSON.stringify({ imageId })
    });
  }
}

export const apiService = new ApiService();
export type { User, AuthResponse, ApiResponse, LoginData, RegisterData };
export default ApiService;
