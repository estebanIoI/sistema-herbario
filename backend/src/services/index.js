// src/services/index.js
const authController = require('../controllers/auth/authController');
const plantsController = require('../controllers/plants/plantsController');
const usersController = require('../controllers/users/usersController');
const dashboardController = require('../controllers/dashboard/dashboardController');
const taxonomyController = require('../controllers/plants/taxonomyController');
const locationsController = require('../controllers/plants/locationsController');
const uploadsController = require('../controllers/uploads/uploadsController');
const suggestionsController = require('../controllers/suggestions/suggestionsController');
const settingsController = require('../controllers/settings/settingsController');
const pqrsdfController   = require('../controllers/pqrsdf/pqrsdfController');

// Controladores específicos para servicios (sin req/res)
const getAllPlants = require('../controllers/plants/getAll');
const getPlantById = require('../controllers/plants/getById');
const getForMap = require('../controllers/plants/getForMap');
const getFamilies = require('../controllers/taxonomy/getFamilies');
const getDashboardStats = require('../controllers/dashboard/getStats');

/**
 * Registro de servicios del Herbario Digital HEAA
 * Este archivo mapea todos los servicios disponibles a través del API Gateway
 * Patrón: service.method -> controller.method
 */
const services = {
  // ===============================
  // SERVICIOS DE AUTENTICACIÓN
  // ===============================
  'auth.login': authController.login,
  'auth.register': authController.register,
  'auth.logout': authController.logout,
  'auth.refresh': authController.refreshToken,
  'auth.me': authController.me,
  'auth.changePassword': authController.changePassword,
  'auth.forgotPassword': authController.forgotPassword,
  'auth.resetPassword': authController.resetPassword,
  'auth.verifyEmail': authController.verifyEmail,

  // ===============================
  // SERVICIOS DE PLANTAS
  // ===============================
  // CRUD básico de plantas
  'plants.getAll': getAllPlants,
  'plants.getById': getPlantById,
  'plants.getForMap': getForMap,
  'plants.create': plantsController.create,
  'plants.update': plantsController.update,
  'plants.delete': plantsController.delete,
  'plants.bulkDelete': plantsController.bulkDelete,
  
  // Búsqueda y filtrado avanzado
  'plants.search': plantsController.search,
  'plants.advancedSearch': plantsController.advancedSearch,
  'plants.searchByFamily': plantsController.searchByFamily,
  'plants.searchByGenus': plantsController.searchByGenus,
  'plants.searchByLocation': plantsController.searchByLocation,
  'plants.searchByCollector': plantsController.searchByCollector,
  
  // Gestión de imágenes de plantas
  'plants.uploadImage': plantsController.uploadImage,
  'plants.deleteImage': plantsController.deleteImage,
  'plants.getImages': plantsController.getImages,
  'plants.setMainImage': plantsController.setMainImage,
  
  // Exportación e importación
  'plants.export': plantsController.exportData,
  'plants.import': plantsController.importData,
  'plants.getExportFormats': plantsController.getExportFormats,
  
  // Estadísticas de plantas
  'plants.getStats': plantsController.getStats,
  'plants.getByStatus': plantsController.getByStatus,
  'plants.getRecent': plantsController.getRecent,
  'plants.getMostViewed': plantsController.getMostViewed,

  // ===============================
  // SERVICIOS DE TAXONOMÍA
  // ===============================
  'taxonomy.getFamilies': getFamilies,
  'taxonomy.getGenera': taxonomyController.getGenera,
  'taxonomy.getSpecies': taxonomyController.getSpecies,
  'taxonomy.getGeneraByFamily': taxonomyController.getGeneraByFamily,
  'taxonomy.getSpeciesByGenus': taxonomyController.getSpeciesByGenus,
  'taxonomy.createFamily': taxonomyController.createFamily,
  'taxonomy.createGenus': taxonomyController.createGenus,
  'taxonomy.updateTaxonomy': taxonomyController.updateTaxonomy,
  'taxonomy.deleteTaxonomy': taxonomyController.deleteTaxonomy,
  'taxonomy.validateTaxonomy': taxonomyController.validateTaxonomy,
  'taxonomy.getTaxonomyTree': taxonomyController.getTaxonomyTree,

  // ===============================
  // SERVICIOS DE UBICACIONES
  // ===============================
  'locations.getDepartments': locationsController.getDepartments,
  'locations.getMunicipalities': locationsController.getMunicipalities,
  'locations.getMunicipalitiesByDepartment': locationsController.getMunicipalitiesByDepartment,
  'locations.getCollectionSites': locationsController.getCollectionSites,
  'locations.createLocation': locationsController.createLocation,
  'locations.updateLocation': locationsController.updateLocation,
  'locations.deleteLocation': locationsController.deleteLocation,
  'locations.getLocationStats': locationsController.getLocationStats,

  // ===============================
  // SERVICIOS DE USUARIOS
  // ===============================
  'users.getAll': usersController.getAll,
  'users.getById': usersController.getById,
  'users.create': usersController.create,
  'users.update': usersController.update,
  'users.delete': usersController.delete,
  'users.updateProfile': usersController.updateProfile,
  'users.changeRole': usersController.changeRole,
  'users.getProfile': usersController.getProfile,
  'users.uploadAvatar': usersController.uploadAvatar,
  'users.getActivity': usersController.getActivity,
  'users.getStats': usersController.getStats,
  'users.deactivate': usersController.deactivate,
  'users.activate': usersController.activate,

  // ===============================
  // SERVICIOS DE DASHBOARD
  // ===============================
  'dashboard.getStats': getDashboardStats,
  'dashboard.getVisitorsChart': dashboardController.getVisitorsChart,
  'dashboard.getPlantsByFamily': dashboardController.getPlantsByFamily,
  'dashboard.getPlantsByLocation': dashboardController.getPlantsByLocation,
  'dashboard.getRecentActivity': dashboardController.getRecentActivity,
  'dashboard.getTopCollectors': dashboardController.getTopCollectors,
  'dashboard.getMonthlyStats': dashboardController.getMonthlyStats,
  'dashboard.getSystemHealth': dashboardController.getSystemHealth,
  'dashboard.getStorageInfo': dashboardController.getStorageInfo,

  // ===============================
  // SERVICIOS DE SUGERENCIAS
  // ===============================
  'suggestions.getAll': suggestionsController.getAll,
  'suggestions.getById': suggestionsController.getById,
  'suggestions.create': suggestionsController.create,
  'suggestions.update': suggestionsController.update,
  'suggestions.delete': suggestionsController.delete,
  'suggestions.approve': suggestionsController.approve,
  'suggestions.reject': suggestionsController.reject,
  'suggestions.getByStatus': suggestionsController.getByStatus,
  'suggestions.getByUser': suggestionsController.getByUser,
  'suggestions.addComment': suggestionsController.addComment,
  'suggestions.getComments': suggestionsController.getComments,
  'suggestions.countUnread': suggestionsController.countUnread,
  // Alias para compatibilidad con el frontend
  'suggestions.updateStatus': suggestionsController.update,

  // ===============================
  // SERVICIOS DE UPLOADS
  // ===============================
  'uploads.uploadFile': uploadsController.uploadFile,
  'uploads.uploadMultiple': uploadsController.uploadMultiple,
  'uploads.deleteFile': uploadsController.deleteFile,
  'uploads.getFile': uploadsController.getFile,
  'uploads.getFileInfo': uploadsController.getFileInfo,
  'uploads.validateFile': uploadsController.validateFile,
  'uploads.resizeImage': uploadsController.resizeImage,
  'uploads.getStorageStats': uploadsController.getStorageStats,

  // ===============================
  // SERVICIOS DE CONFIGURACIÓN
  // ===============================
  'settings.getAll': settingsController.getAll,
  'settings.get': settingsController.get,
  'settings.update': settingsController.update,
  'settings.updateMultiple': settingsController.updateMultiple,
  'settings.reset': settingsController.reset,
  'settings.backup': settingsController.backup,
  'settings.restore': settingsController.restore,
  'settings.getSystemInfo': settingsController.getSystemInfo,
  'settings.testCloudinary': settingsController.testCloudinary,

  // ===============================
  // SERVICIOS DE SUGERENCIAS
  // ===============================
  'suggestions.create': suggestionsController.create,
  'suggestions.getAll': suggestionsController.getAll,

  // ===============================
  // SERVICIOS ESPECIALES PARA EL FRONTEND
  // ===============================
  // Para página principal
  'public.getFeaturedPlants': plantsController.getFeaturedPlantsData,
  'public.getRandomPlants': plantsController.getFeaturedPlantsData,
  'public.getStats': dashboardController.getPublicStatsData,
  'public.getSystemInfo': dashboardController.getPublicStatsData,
  
  // Configuraciones públicas
  'settings.getPublic': settingsController.getPublic,
  
  // Plantas destacadas (alias para compatibilidad)
  'plants.getFeatured': plantsController.getFeaturedPlants,
  
  // Para filtros avanzados
  'filters.getFilterOptions': plantsController.getFilterOptions,
  'filters.getFieldValues': plantsController.getFieldValues,
  
  // Para autocompletado
  'autocomplete.families': taxonomyController.autocompleteFamilies,
  'autocomplete.genera': taxonomyController.autocompleteGenera,
  'autocomplete.species': taxonomyController.autocompleteSpecies,
  'autocomplete.collectors': usersController.autocompleteCollectors,
  'autocomplete.locations': locationsController.autocompleteLocations,

  // ===============================
  // SERVICIOS PQRSDF
  // ===============================
  'pqrsdf.create': pqrsdfController.create,   // público — no requiere auth
  'pqrsdf.getAll': pqrsdfController.getAll,   // admin

  // ===============================
  // SERVICIOS DE VALIDACIÓN
  // ===============================
  'validation.checkDuplicates': plantsController.checkDuplicates,
  'validation.validatePlantData': plantsController.validatePlantData,
  'validation.validateTaxonomy': taxonomyController.validateTaxonomy,
  'validation.validateLocation': locationsController.validateLocation,
};

/**
 * Obtener lista de todos los servicios disponibles
 */
const getAvailableServices = () => {
  return Object.keys(services).sort();
};

/**
 * Verificar si un servicio existe
 */
const serviceExists = (serviceName) => {
  return services.hasOwnProperty(serviceName);
};

/**
 * Obtener servicios por categoría
 */
const getServicesByCategory = () => {
  const categories = {};
  
  Object.keys(services).forEach(serviceName => {
    const category = serviceName.split('.')[0];
    if (!categories[category]) {
      categories[category] = [];
    }
    categories[category].push(serviceName);
  });
  
  return categories;
};

module.exports = {
  services,
  getAvailableServices,
  serviceExists,
  getServicesByCategory
};
