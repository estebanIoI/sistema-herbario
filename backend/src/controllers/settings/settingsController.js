// src/controllers/settings/settingsController.js
const db = require('../../config/database');
const logger = require('../../utils/logger');
const getPublic = require('./getPublic');

// ── Migración automática: garantiza que todas las settings de página existen ────
// ON DUPLICATE KEY UPDATE solo toca category/type/is_public — preserva el value
const PAGINA_SETTINGS = [
  // Banner
  { key_name: 'banner_enabled',        value: 'false',                                      type: 'boolean', description: 'Mostrar banner en la página de inicio' },
  { key_name: 'banner_text',           value: '',                                           type: 'string',  description: 'Texto del banner' },
  { key_name: 'banner_type',           value: 'info',                                       type: 'string',  description: 'Tipo: info | success | warning | error' },
  { key_name: 'banner_link',           value: '',                                           type: 'string',  description: 'URL enlazada del banner (opcional)' },
  // Hero
  { key_name: 'hero_title',            value: 'Bienvenido a nuestro Herbario Digital',     type: 'string',  description: 'Título principal del hero' },
  { key_name: 'hero_subtitle',         value: 'Descubre la diversidad botánica de nuestra región.', type: 'string', description: 'Subtítulo del hero' },
  { key_name: 'hero_cta1_text',        value: 'Explorar plantas',                           type: 'string',  description: 'Texto del botón principal del hero' },
  { key_name: 'hero_cta1_url',         value: '/plantas',                                   type: 'string',  description: 'URL del botón principal del hero' },
  { key_name: 'hero_cta2_text',        value: 'Conoce más',                                type: 'string',  description: 'Texto del botón secundario del hero' },
  { key_name: 'hero_cta2_url',         value: '/acerca',                                   type: 'string',  description: 'URL del botón secundario del hero' },
  { key_name: 'hero_bg_image',         value: '',                                           type: 'string',  description: 'URL de imagen de fondo del hero (legacy)' },
  // Hero 1 — Carrusel de imágenes
  { key_name: 'hero_slide1_image',   value: '',   type: 'string',  description: 'Imagen slide 1 del carrusel hero' },
  { key_name: 'hero_slide1_url',     value: '',   type: 'string',  description: 'URL de redirección al hacer clic en slide 1' },
  { key_name: 'hero_slide2_image',   value: '',   type: 'string',  description: 'Imagen slide 2 del carrusel hero' },
  { key_name: 'hero_slide2_url',     value: '',   type: 'string',  description: 'URL de redirección al hacer clic en slide 2' },
  { key_name: 'hero_slide3_image',   value: '',   type: 'string',  description: 'Imagen slide 3 del carrusel hero' },
  { key_name: 'hero_slide3_url',     value: '',   type: 'string',  description: 'URL de redirección al hacer clic en slide 3' },
  { key_name: 'hero_slide_interval', value: '5',    type: 'number',  description: 'Intervalo del carrusel hero 1 en segundos (mínimo 2)' },
  { key_name: 'hero_stats_enabled', value: 'true', type: 'boolean', description: 'Mostrar contadores de Plantas, Familias y Géneros en el hero' },
  { key_name: 'hero_image_fit',     value: 'cover', type: 'string', description: 'Presentación de imagen hero: cover (expandida) o contain (enmarcada)' },
  // Hero 2 — Publicaciones y Servicios
  { key_name: 'hero2_enabled',       value: 'true',                  type: 'boolean', description: 'Mostrar sección Publicaciones y Servicios' },
  { key_name: 'hero2_title',         value: 'Publicaciones y Servicios', type: 'string', description: 'Título de la sección hero 2' },
  { key_name: 'hero2_subtitle',      value: '',                      type: 'string',  description: 'Subtítulo de la sección hero 2' },
  { key_name: 'hero2_interval',      value: '4',                     type: 'number',  description: 'Intervalo del carrusel hero 2 en segundos' },
  { key_name: 'hero2_item1_badge',   value: '',   type: 'string',  description: 'Etiqueta/badge del ítem 1 (ej: Publicación, Servicio)' },
  { key_name: 'hero2_item1_title',   value: '',   type: 'string',  description: 'Título del ítem 1' },
  { key_name: 'hero2_item1_desc',    value: '',   type: 'string',  description: 'Descripción del ítem 1' },
  { key_name: 'hero2_item1_image',   value: '',   type: 'string',  description: 'Imagen del ítem 1' },
  { key_name: 'hero2_item1_url',     value: '',   type: 'string',  description: 'URL del ítem 1' },
  { key_name: 'hero2_item2_badge',   value: '',   type: 'string',  description: 'Etiqueta/badge del ítem 2' },
  { key_name: 'hero2_item2_title',   value: '',   type: 'string',  description: 'Título del ítem 2' },
  { key_name: 'hero2_item2_desc',    value: '',   type: 'string',  description: 'Descripción del ítem 2' },
  { key_name: 'hero2_item2_image',   value: '',   type: 'string',  description: 'Imagen del ítem 2' },
  { key_name: 'hero2_item2_url',     value: '',   type: 'string',  description: 'URL del ítem 2' },
  { key_name: 'hero2_item3_badge',   value: '',   type: 'string',  description: 'Etiqueta/badge del ítem 3' },
  { key_name: 'hero2_item3_title',   value: '',   type: 'string',  description: 'Título del ítem 3' },
  { key_name: 'hero2_item3_desc',    value: '',   type: 'string',  description: 'Descripción del ítem 3' },
  { key_name: 'hero2_item3_image',   value: '',   type: 'string',  description: 'Imagen del ítem 3' },
  { key_name: 'hero2_item3_url',     value: '',   type: 'string',  description: 'URL del ítem 3' },
  { key_name: 'hero2_item4_badge',   value: '',   type: 'string',  description: 'Etiqueta/badge del ítem 4' },
  { key_name: 'hero2_item4_title',   value: '',   type: 'string',  description: 'Título del ítem 4' },
  { key_name: 'hero2_item4_desc',    value: '',   type: 'string',  description: 'Descripción del ítem 4' },
  { key_name: 'hero2_item4_image',   value: '',   type: 'string',  description: 'Imagen del ítem 4' },
  { key_name: 'hero2_item4_url',     value: '',   type: 'string',  description: 'URL del ítem 4' },
  // Características
  { key_name: 'features_enabled',      value: 'true',                                      type: 'boolean', description: 'Mostrar sección de características' },
  { key_name: 'features_title',        value: 'Características de nuestro herbario',       type: 'string',  description: 'Título de la sección de características' },
  { key_name: 'features_subtitle',     value: '',                                           type: 'string',  description: 'Subtítulo de la sección de características' },
  { key_name: 'feature1_icon',         value: 'Leaf',                                      type: 'string',  description: 'Icono de la característica 1' },
  { key_name: 'feature1_title',        value: 'Catálogo Extenso',                         type: 'string',  description: 'Título de la característica 1' },
  { key_name: 'feature1_description',  value: '',                                           type: 'string',  description: 'Descripción de la característica 1' },
  { key_name: 'feature2_icon',         value: 'Search',                                    type: 'string',  description: 'Icono de la característica 2' },
  { key_name: 'feature2_title',        value: 'Búsqueda Avanzada',                        type: 'string',  description: 'Título de la característica 2' },
  { key_name: 'feature2_description',  value: '',                                           type: 'string',  description: 'Descripción de la característica 2' },
  { key_name: 'feature3_icon',         value: 'Database',                                  type: 'string',  description: 'Icono de la característica 3' },
  { key_name: 'feature3_title',        value: 'Información Detallada',                    type: 'string',  description: 'Título de la característica 3' },
  { key_name: 'feature3_description',  value: '',                                           type: 'string',  description: 'Descripción de la característica 3' },
  { key_name: 'feature1_url',          value: '/plantas',                                  type: 'string',  description: 'URL de redirección de la tarjeta 1 de características' },
  { key_name: 'feature2_url',          value: '/plantas',                                  type: 'string',  description: 'URL de redirección de la tarjeta 2 de características' },
  { key_name: 'feature3_url',          value: '/plantas',                                  type: 'string',  description: 'URL de redirección de la tarjeta 3 de características' },
  // Características — imagen de fondo
  { key_name: 'features_bg_image',       value: '',                  type: 'string',  description: 'URL de imagen de fondo de la sección de características' },
  // Plantas Destacadas
  { key_name: 'featured_enabled',       value: 'true',              type: 'boolean', description: 'Mostrar sección de plantas destacadas' },
  { key_name: 'featured_section_title', value: 'Plantas destacadas', type: 'string',  description: 'Título de la sección de plantas destacadas' },
  { key_name: 'featured_plants_count',  value: '6',                 type: 'number',  description: 'Número de plantas destacadas en la página principal' },
  // ── Acerca de — Encabezado
  { key_name: 'about_title',            value: 'Herbario HEAA',                type: 'string', description: 'Título principal de la página Acerca de' },
  { key_name: 'about_subtitle',         value: 'Instituto Tecnológico del Putumayo (ITP) - Mocoa', type: 'string', description: 'Subtítulo de la página Acerca de' },
  // ── Acerca de — Historia
  { key_name: 'about_history_image',    value: '',                             type: 'string', description: 'URL imagen sección Historia (Acerca de)' },
  { key_name: 'about_history_title',    value: 'Nuestra Historia',             type: 'string', description: 'Título sección Historia' },
  { key_name: 'about_history_p1',       value: 'El Herbario HEAA del Instituto Tecnológico del Putumayo fue fundado en 2005 con el objetivo de documentar, preservar y estudiar la rica diversidad florística de la región amazónica colombiana, con especial énfasis en el departamento del Putumayo.', type: 'string', description: 'Párrafo 1 de Historia' },
  { key_name: 'about_history_p2',       value: 'Nombrado en honor al botánico Hernando Ernesto Arias Arias, pionero en el estudio de la flora putumayense, nuestro herbario alberga una colección creciente de especímenes que representan la biodiversidad única de esta región biogeográfica.', type: 'string', description: 'Párrafo 2 de Historia' },
  { key_name: 'about_history_p3',       value: 'A lo largo de los años, el Herbario HEAA se ha consolidado como un centro de referencia para la investigación botánica en el sur de Colombia, contribuyendo significativamente al conocimiento científico y a la conservación de los ecosistemas amazónicos.', type: 'string', description: 'Párrafo 3 de Historia' },
  // ── Acerca de — Misión y Visión
  { key_name: 'about_mission_text',     value: 'Documentar, preservar y estudiar la diversidad florística del Putumayo y la región amazónica colombiana, contribuyendo al conocimiento científico, la educación ambiental y la conservación de los ecosistemas a través de la investigación botánica, la formación académica y la divulgación del patrimonio natural.', type: 'string', description: 'Texto de la Misión' },
  { key_name: 'about_vision_text',      value: 'Para 2030, el Herbario HEAA será reconocido como un centro de referencia nacional en la investigación botánica amazónica, con una colección representativa de la flora regional, infraestructura moderna, personal altamente calificado y una red de colaboración científica consolidada, contribuyendo activamente a la conservación de la biodiversidad y al desarrollo sostenible del territorio.', type: 'string', description: 'Texto de la Visión' },
  // ── Acerca de — Estadísticas
  { key_name: 'about_stats_title',      value: 'Nuestra Colección',            type: 'string', description: 'Título sección Estadísticas (Acerca de)' },
  { key_name: 'about_stat1_value',      value: '5.200+',                       type: 'string', description: 'Valor estadística 1' },
  { key_name: 'about_stat1_label',      value: 'Especímenes catalogados',      type: 'string', description: 'Etiqueta estadística 1' },
  { key_name: 'about_stat2_value',      value: '120+',                         type: 'string', description: 'Valor estadística 2' },
  { key_name: 'about_stat2_label',      value: 'Familias botánicas',           type: 'string', description: 'Etiqueta estadística 2' },
  { key_name: 'about_stat3_value',      value: '850+',                         type: 'string', description: 'Valor estadística 3' },
  { key_name: 'about_stat3_label',      value: 'Géneros representados',        type: 'string', description: 'Etiqueta estadística 3' },
  { key_name: 'about_stat4_value',      value: '1.800+',                       type: 'string', description: 'Valor estadística 4' },
  { key_name: 'about_stat4_label',      value: 'Especies documentadas',        type: 'string', description: 'Etiqueta estadística 4' },
  // ── Acerca de — Tab Colecciones
  { key_name: 'about_col1_title',       value: 'Colección General',            type: 'string', description: 'Título colección 1' },
  { key_name: 'about_col1_text',        value: 'Nuestra colección principal contiene especímenes representativos de la flora del Putumayo y la Amazonía colombiana, organizados según el sistema de clasificación APG IV. Incluye ejemplares de bosques de niebla, bosques andino-amazónicos y ecosistemas de piedemonte.', type: 'string', description: 'Texto colección 1' },
  { key_name: 'about_col2_title',       value: 'Colección Etnobotánica',       type: 'string', description: 'Título colección 2' },
  { key_name: 'about_col2_text',        value: 'Documentamos plantas de importancia cultural para las comunidades indígenas y campesinas de la región, incluyendo especies medicinales, alimenticias, artesanales y de uso ritual, junto con información sobre sus usos tradicionales y conocimientos asociados.', type: 'string', description: 'Texto colección 2' },
  { key_name: 'about_col3_title',       value: 'Colección de Plantas Endémicas', type: 'string', description: 'Título colección 3' },
  { key_name: 'about_col3_text',        value: 'Sección especializada en la preservación y estudio de especies endémicas del Putumayo y zonas adyacentes, muchas de ellas en categorías de amenaza según la UICN, contribuyendo a su conservación y conocimiento.', type: 'string', description: 'Texto colección 3' },
  { key_name: 'about_col4_title',       value: 'Carpoteca y Xiloteca',         type: 'string', description: 'Título colección 4' },
  { key_name: 'about_col4_text',        value: 'Colecciones complementarias de frutos, semillas y muestras de madera que apoyan la investigación botánica, forestal y ecológica, facilitando la identificación y caracterización de especies leñosas de la región.', type: 'string', description: 'Texto colección 4' },
  // ── Acerca de — Tab Investigación
  { key_name: 'about_res1_title',       value: 'Taxonomía y Sistemática',      type: 'string', description: 'Título línea de investigación 1' },
  { key_name: 'about_res1_text',        value: 'Estudios sobre la clasificación, identificación y relaciones evolutivas de las plantas amazónicas, con énfasis en familias de alta diversidad en la región como Rubiaceae, Melastomataceae y Araceae.', type: 'string', description: 'Texto línea de investigación 1' },
  { key_name: 'about_res2_title',       value: 'Etnobotánica y Conocimiento Tradicional', type: 'string', description: 'Título línea de investigación 2' },
  { key_name: 'about_res2_text',        value: 'Investigación sobre los usos, manejos y significados culturales de las plantas para las comunidades indígenas y campesinas del Putumayo, documentando saberes ancestrales y prácticas sostenibles.', type: 'string', description: 'Texto línea de investigación 2' },
  { key_name: 'about_res3_title',       value: 'Ecología y Conservación',      type: 'string', description: 'Título línea de investigación 3' },
  { key_name: 'about_res3_text',        value: 'Estudios sobre la estructura, composición y dinámica de los ecosistemas forestales del piedemonte amazónico, evaluando impactos del cambio climático y actividades humanas en la biodiversidad vegetal.', type: 'string', description: 'Texto línea de investigación 3' },
  { key_name: 'about_res4_title',       value: 'Botánica Económica',           type: 'string', description: 'Título línea de investigación 4' },
  { key_name: 'about_res4_text',        value: 'Investigación sobre especies vegetales con potencial económico para el desarrollo sostenible de la región, incluyendo plantas medicinales, frutales nativos, ornamentales y especies con aplicaciones industriales.', type: 'string', description: 'Texto línea de investigación 4' },
  // ── Acerca de — Equipo (3 miembros)
  { key_name: 'about_member1_image',    value: '',                             type: 'string', description: 'URL foto miembro 1' },
  { key_name: 'about_member1_name',     value: 'Dr. Andrés Orejuela',          type: 'string', description: 'Nombre miembro 1' },
  { key_name: 'about_member1_role',     value: 'Director del Herbario',        type: 'string', description: 'Cargo miembro 1' },
  { key_name: 'about_member1_bio',      value: 'Doctor en Botánica con especialización en taxonomía de plantas neotropicales. Coordina las actividades científicas y administrativas del herbario.', type: 'string', description: 'Bio miembro 1' },
  { key_name: 'about_member2_image',    value: '',                             type: 'string', description: 'URL foto miembro 2' },
  { key_name: 'about_member2_name',     value: 'Dra. Guerly León',             type: 'string', description: 'Nombre miembro 2' },
  { key_name: 'about_member2_role',     value: 'Curadora Principal',           type: 'string', description: 'Cargo miembro 2' },
  { key_name: 'about_member2_bio',      value: 'Especialista en conservación de colecciones biológicas. Responsable del mantenimiento, organización y preservación de los especímenes.', type: 'string', description: 'Bio miembro 2' },
  { key_name: 'about_member3_image',    value: '',                             type: 'string', description: 'URL foto miembro 3' },
  { key_name: 'about_member3_name',     value: 'MSc. Carlos Gómez',           type: 'string', description: 'Nombre miembro 3' },
  { key_name: 'about_member3_role',     value: 'Investigador Asociado',        type: 'string', description: 'Cargo miembro 3' },
  { key_name: 'about_member3_bio',      value: 'Etnobotánico especializado en conocimientos tradicionales de comunidades indígenas del Putumayo. Lidera proyectos de investigación participativa.', type: 'string', description: 'Bio miembro 3' },
  // ── Acerca de — Ubicación
  { key_name: 'about_location_title',    value: 'Visítanos',                   type: 'string', description: 'Título sección Ubicación (Acerca de)' },
  { key_name: 'about_location_address',  value: 'Instituto Tecnológico del Putumayo\nSede Mocoa - Barrio Luis Carlos Galán\nMocoa, Putumayo, Colombia', type: 'string', description: 'Dirección física (Acerca de)' },
  { key_name: 'about_location_schedule', value: 'El Herbario HEAA está abierto para visitas académicas y de investigación de lunes a viernes, de 8:00 am a 12:00 m y de 2:00 pm a 6:00 pm. Para grupos grandes o visitas especializadas, recomendamos agendar con anticipación.', type: 'string', description: 'Horario de atención (Acerca de)' },
  { key_name: 'about_location_image',    value: '',                            type: 'string', description: 'URL imagen/mapa sección Ubicación (Acerca de)' },
  // ── Acerca de — Colaboraciones (4 instituciones)
  { key_name: 'about_partners_title',   value: 'Colaboraciones y Alianzas',    type: 'string', description: 'Título sección Colaboraciones (Acerca de)' },
  { key_name: 'about_partner1_name',    value: 'Institución 1',                type: 'string', description: 'Nombre institución colaboradora 1' },
  { key_name: 'about_partner1_image',   value: '',                             type: 'string', description: 'URL logo institución colaboradora 1' },
  { key_name: 'about_partner1_url',     value: '',                             type: 'string', description: 'URL enlace institución colaboradora 1' },
  { key_name: 'about_partner2_name',    value: 'Institución 2',                type: 'string', description: 'Nombre institución colaboradora 2' },
  { key_name: 'about_partner2_image',   value: '',                             type: 'string', description: 'URL logo institución colaboradora 2' },
  { key_name: 'about_partner2_url',     value: '',                             type: 'string', description: 'URL enlace institución colaboradora 2' },
  { key_name: 'about_partner3_name',    value: 'Institución 3',                type: 'string', description: 'Nombre institución colaboradora 3' },
  { key_name: 'about_partner3_image',   value: '',                             type: 'string', description: 'URL logo institución colaboradora 3' },
  { key_name: 'about_partner3_url',     value: '',                             type: 'string', description: 'URL enlace institución colaboradora 3' },
  { key_name: 'about_partner4_name',    value: 'Institución 4',                type: 'string', description: 'Nombre institución colaboradora 4' },
  { key_name: 'about_partner4_image',   value: '',                             type: 'string', description: 'URL logo institución colaboradora 4' },
  { key_name: 'about_partner4_url',     value: '',                             type: 'string', description: 'URL enlace institución colaboradora 4' },
  // ── Acerca de — CTA final
  { key_name: 'about_cta_title',        value: 'Contribuye a nuestra colección', type: 'string', description: 'Título del CTA (Acerca de)' },
  { key_name: 'about_cta_text',         value: 'Si eres investigador, estudiante o entusiasta de la botánica, puedes contribuir a nuestro herbario con especímenes, fotografías o información sobre la flora del Putumayo y la Amazonía colombiana.', type: 'string', description: 'Texto del CTA (Acerca de)' },
  { key_name: 'about_cta_button_text',  value: 'Conoce cómo colaborar',        type: 'string', description: 'Texto botón CTA (Acerca de)' },
  { key_name: 'about_cta_button_url',   value: '/contacto',                    type: 'string', description: 'URL botón CTA (Acerca de)' },
  // Login
  { key_name: 'login_bg_image',       value: 'https://www.floresyplantas.net/wp-content/uploads/psychotria-elata-1.jpg', type: 'string', description: 'URL de imagen de fondo del panel izquierdo de la página de login' },
  { key_name: 'login_bg_attribution', value: 'IERNA SINCHI',       type: 'string',  description: 'Atribución de la imagen de fondo del login' },
  { key_name: 'login_tagline',        value: 'Descubre la flora de la Amazonia', type: 'string', description: 'Tagline que aparece en el panel izquierdo del login' },
  // Logo
  { key_name: 'logo_text',              value: 'Herbario Digital',  type: 'string',  description: 'Nombre o texto del logo del sitio' },
  { key_name: 'logo_image_url',         value: '',                  type: 'string',  description: 'URL de imagen de logo (opcional, vacío usa icono)' },
  // Footer — texto general
  { key_name: 'footer_description',     value: 'Explorando y preservando la diversidad botánica para las generaciones futuras.', type: 'string', description: 'Descripción breve en el footer' },
  { key_name: 'footer_copyright',       value: 'Herbario Digital. Todos los derechos reservados.', type: 'string', description: 'Texto de copyright del footer' },
  // Footer — columna 1
  { key_name: 'footer_col1_title',      value: 'Explorar',               type: 'string', description: 'Título de la columna 1 del footer' },
  { key_name: 'footer_col1_link1_text', value: 'Catálogo de Plantas',    type: 'string', description: 'Texto enlace 1, columna 1 del footer' },
  { key_name: 'footer_col1_link1_url',  value: '/plantas',               type: 'string', description: 'URL enlace 1, columna 1 del footer' },
  { key_name: 'footer_col1_link2_text', value: 'Familias Botánicas',     type: 'string', description: 'Texto enlace 2, columna 1 del footer' },
  { key_name: 'footer_col1_link2_url',  value: '/familias',              type: 'string', description: 'URL enlace 2, columna 1 del footer' },
  { key_name: 'footer_col1_link3_text', value: 'Hábitats',               type: 'string', description: 'Texto enlace 3, columna 1 del footer' },
  { key_name: 'footer_col1_link3_url',  value: '/habitats',              type: 'string', description: 'URL enlace 3, columna 1 del footer' },
  // Footer — columna 2
  { key_name: 'footer_col2_title',      value: 'Recursos',               type: 'string', description: 'Título de la columna 2 del footer' },
  { key_name: 'footer_col2_link1_text', value: 'Guías de Identificación', type: 'string', description: 'Texto enlace 1, columna 2 del footer' },
  { key_name: 'footer_col2_link1_url',  value: '/guias',                 type: 'string', description: 'URL enlace 1, columna 2 del footer' },
  { key_name: 'footer_col2_link2_text', value: 'Publicaciones',          type: 'string', description: 'Texto enlace 2, columna 2 del footer' },
  { key_name: 'footer_col2_link2_url',  value: '/publicaciones',         type: 'string', description: 'URL enlace 2, columna 2 del footer' },
  { key_name: 'footer_col2_link3_text', value: 'Glosario Botánico',      type: 'string', description: 'Texto enlace 3, columna 2 del footer' },
  { key_name: 'footer_col2_link3_url',  value: '/glosario',              type: 'string', description: 'URL enlace 3, columna 2 del footer' },
  // Footer — columna 3
  { key_name: 'footer_col3_title',      value: 'Contacto',               type: 'string', description: 'Título de la columna 3 del footer' },
  { key_name: 'footer_col3_link1_text', value: 'Formulario de Contacto', type: 'string', description: 'Texto enlace 1, columna 3 del footer' },
  { key_name: 'footer_col3_link1_url',  value: '/contacto',              type: 'string', description: 'URL enlace 1, columna 3 del footer' },
  { key_name: 'footer_col3_link2_text', value: 'info@herbariodigital.com', type: 'string', description: 'Texto enlace 2, columna 3 del footer' },
  { key_name: 'footer_col3_link2_url',  value: '',                       type: 'string', description: 'URL enlace 2, columna 3 del footer (vacío = texto plano)' },
  { key_name: 'footer_col3_link3_text', value: '+123 456 7890',          type: 'string', description: 'Texto enlace 3, columna 3 del footer' },
  { key_name: 'footer_col3_link3_url',  value: '',                       type: 'string', description: 'URL enlace 3, columna 3 del footer (vacío = texto plano)' },
];

(async () => {
  try {
    for (const s of PAGINA_SETTINGS) {
      await db.query(
        `INSERT INTO settings (key_name, value, type, category, description, is_public)
         VALUES (?, ?, ?, 'pagina', ?, 1)
         ON DUPLICATE KEY UPDATE
           category  = 'pagina',
           type      = VALUES(type),
           is_public = 1`,
        [s.key_name, s.value, s.type, s.description]
      );
    }
    logger.info(`✅ Settings cargadas (${PAGINA_SETTINGS.length})`);
  } catch (err) {
    logger.warn('No se pudieron migrar settings de página:', err.message);
  }
})();

// ── Migración: garantiza que el usuario admin existe con la contraseña correcta ─
// Hash bcrypt rounds=12 de "admin123"
const ADMIN_PASSWORD_HASH = '$2a$12$l27ohWqCHsNVxyOzHsuhhuH3RYamJqMSIse5uvbdai7w5P2qlEgga';

(async () => {
  try {
    await db.query(
      `INSERT INTO users (name, email, password, role, status, email_verified)
       VALUES ('Administrador HEAA', 'admin@heaa.edu.co', ?, 'admin', 'active', TRUE)
       ON DUPLICATE KEY UPDATE
         password       = VALUES(password),
         role           = 'admin',
         status         = 'active',
         email_verified = TRUE`,
      [ADMIN_PASSWORD_HASH]
    );
    logger.info('✅ Usuario admin verificado');
  } catch (err) {
    logger.warn('No se pudo verificar el usuario admin:', err.message);
  }
})();

// Convierte snake_case a camelCase
const toCamel = (s) => s.replace(/_([a-z])/g, (_, c) => c.toUpperCase());

// Castea el valor según el tipo declarado en BD
const castValue = (value, type) => {
  if (value === null || value === undefined) return value;
  switch (type) {
    case 'boolean': return value === 'true' || value === true;
    case 'number':  return Number(value);
    case 'json':    try { return JSON.parse(value); } catch { return value; }
    default:        return String(value);
  }
};

// ── Servicios ──────────────────────────────────────────────────────────────────

// settings.getAll → todas las settings (admin)
const getAll = async (data, user) => {
  if (!user || user.role !== 'admin') throw new Error('Permisos insuficientes');
  const [rows] = await db.query(
    'SELECT id, key_name, value, type, category, description, is_public FROM settings ORDER BY category, key_name'
  );
  return rows;
};

// settings.get → una setting por key
const get = async (data, user) => {
  const { key } = data || {};
  if (!key) throw new Error('Clave requerida');
  const [rows] = await db.query('SELECT * FROM settings WHERE key_name = ?', [key]);
  if (rows.length === 0) throw new Error(`Configuración "${key}" no encontrada`);
  return rows[0];
};

// settings.update → actualizar una setting (admin)
const update = async (data, user) => {
  if (!user || user.role !== 'admin') throw new Error('Permisos insuficientes');
  const { key, value } = data || {};
  if (!key || value === undefined) throw new Error('Clave y valor son requeridos');

  const [result] = await db.query(
    'UPDATE settings SET value = ?, updated_at = NOW() WHERE key_name = ?',
    [String(value), key]
  );
  if (result.affectedRows === 0) throw new Error(`Configuración "${key}" no encontrada`);

  logger.info(`Setting actualizado: ${key} = ${value} por ${user.email}`);
  return { key, value };
};

// settings.updateMultiple → batch update de settings (admin)
const updateMultiple = async (data, user) => {
  if (!user || user.role !== 'admin') throw new Error('Permisos insuficientes');
  const { settings } = data || {};
  if (!Array.isArray(settings) || settings.length === 0) throw new Error('Lista de configuraciones requerida');

  let updated = 0;
  for (const { key, value } of settings) {
    if (!key || value === undefined) continue;
    // UPSERT: crea la fila si no existe, de lo contrario solo actualiza el valor
    await db.query(
      `INSERT INTO settings (key_name, value, type, category, description, is_public)
       VALUES (?, ?, 'string', 'general', ?, 0)
       ON DUPLICATE KEY UPDATE value = VALUES(value), updated_at = NOW()`,
      [key, String(value), `Configuración: ${key}`]
    );
    updated++;
  }

  logger.info(`${updated} settings actualizados por ${user.email}`);
  return { updated };
};

// settings.reset → restaurar defaults de una categoría (admin)
const reset = async (data, user) => {
  if (!user || user.role !== 'admin') throw new Error('Permisos insuficientes');
  logger.info(`Reset de settings solicitado por ${user.email}`);
  return { message: 'Funcionalidad de reset disponible próximamente' };
};

// settings.backup → exportar como JSON (admin)
const backup = async (data, user) => {
  if (!user || user.role !== 'admin') throw new Error('Permisos insuficientes');
  const [rows] = await db.query('SELECT key_name, value, type, category FROM settings ORDER BY category, key_name');
  return { exportedAt: new Date().toISOString(), settings: rows };
};

// settings.restore → importar desde JSON (admin)
const restore = async (data, user) => {
  if (!user || user.role !== 'admin') throw new Error('Permisos insuficientes');
  const { settings } = data || {};
  if (!Array.isArray(settings)) throw new Error('Datos de configuración inválidos');

  let updated = 0;
  for (const { key_name, value } of settings) {
    const [r] = await db.query(
      'UPDATE settings SET value = ?, updated_at = NOW() WHERE key_name = ?',
      [String(value), key_name]
    );
    if (r.affectedRows > 0) updated++;
  }
  return { restored: updated };
};

// settings.getSystemInfo → info pública del sistema (no requiere admin)
const getSystemInfo = async (data, user) => {
  const [rows] = await db.query(
    'SELECT key_name, value, type FROM settings WHERE is_public = 1'
  );
  const result = {};
  for (const row of rows) {
    result[toCamel(row.key_name)] = castValue(row.value, row.type);
  }
  return result;
};

// settings.getPublic → settings públicas (incluye secciones de la página)
const getPublicHandler = async (data, user) => {
  return getPublic(data, user);
};

// settings.testCloudinary → probar conexión con las credenciales guardadas en BD
const testCloudinary = async (data, user) => {
  if (!user || user.role !== 'admin') throw new Error('Permisos insuficientes');

  const [rows] = await db.query(
    "SELECT key_name, value FROM settings WHERE category = 'cloudinary'"
  );
  const creds = {};
  for (const r of rows) creds[r.key_name] = r.value;

  const cloudName = creds.cloudinary_cloud_name || process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey    = creds.cloudinary_api_key    || process.env.CLOUDINARY_API_KEY;
  const apiSecret = creds.cloudinary_api_secret || process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    return { configured: false, message: 'Credenciales incompletas. Complete todos los campos.' };
  }

  const { cloudinary: cld } = require('../../config/cloudinary');
  cld.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret, secure: true });

  try {
    await cld.api.ping();
    logger.info(`Test Cloudinary exitoso para cloud: ${cloudName} por ${user.email}`);
    return { configured: true, cloudName, message: 'Conexión exitosa con Cloudinary.' };
  } catch (err) {
    logger.warn(`Test Cloudinary fallido: ${err.message}`);
    return { configured: false, cloudName, message: err.message || 'No se pudo conectar a Cloudinary.' };
  }
};

module.exports = {
  getAll,
  get,
  update,
  updateMultiple,
  reset,
  backup,
  restore,
  getSystemInfo,
  getPublic: getPublicHandler,
  testCloudinary
};
