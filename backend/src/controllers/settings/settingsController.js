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
  { key_name: 'about_subtitle',         value: 'Institución Universitaria del Putumayo (Uniputumayo) - Mocoa', type: 'string', description: 'Subtítulo de la página Acerca de' },
  { key_name: 'about_header_logo',      value: '/images/logo-uniputumayo.png', type: 'string', description: 'URL del logo del encabezado (Acerca de)' },
  // ── Acerca de — Historia
  { key_name: 'about_history_image',    value: '',                             type: 'string', description: 'URL imagen sección Historia (Acerca de)' },
  { key_name: 'about_history_title',    value: 'Nuestra Historia',             type: 'string', description: 'Título sección Historia' },
  { key_name: 'about_history_p1',       value: 'El Herbario HEAA de la Institución Universitaria del Putumayo (Uniputumayo) fue fundado en 2005 con el objetivo de documentar, preservar y estudiar la rica diversidad florística de la región amazónica colombiana, con especial énfasis en el departamento del Putumayo.', type: 'string', description: 'Párrafo 1 de Historia' },
  { key_name: 'about_history_p2',       value: 'Nombrado en honor al botánico Hernando Ernesto Arias Arias, pionero en el estudio de la flora putumayense, nuestro herbario alberga una colección creciente de especímenes que representan la biodiversidad única de esta región biogeográfica.', type: 'string', description: 'Párrafo 2 de Historia' },
  { key_name: 'about_history_p3',       value: 'A lo largo de los años, el Herbario HEAA se ha consolidado como un centro de referencia para la investigación botánica en el sur de Colombia, contribuyendo significativamente al conocimiento científico y a la conservación de los ecosistemas amazónicos.', type: 'string', description: 'Párrafo 3 de Historia' },
  // ── Acerca de — Misión y Visión
  { key_name: 'about_mission_text',     value: 'Documentar, preservar y estudiar la diversidad florística del Putumayo y la región amazónica colombiana, contribuyendo al conocimiento científico, la educación ambiental y la conservación de los ecosistemas a través de la investigación botánica, la formación académica y la divulgación del patrimonio natural.', type: 'string', description: 'Texto de la Misión' },
  { key_name: 'about_vision_text',      value: 'Para 2030, el Herbario HEAA será reconocido como un centro de referencia nacional en la investigación botánica amazónica, con una colección representativa de la flora regional, infraestructura moderna, personal altamente calificado y una red de colaboración científica consolidada, contribuyendo activamente a la conservación de la biodiversidad y al desarrollo sostenible del territorio.', type: 'string', description: 'Texto de la Visión' },
  { key_name: 'about_mission_title',    value: 'Misión',                       type: 'string', description: 'Título de la tarjeta Misión' },
  { key_name: 'about_vision_title',     value: 'Visión',                       type: 'string', description: 'Título de la tarjeta Visión' },
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
  // ── Acerca de — Pestañas (etiquetas y títulos)
  { key_name: 'about_tab1_label',       value: 'Colecciones',                  type: 'string', description: 'Etiqueta de la pestaña 1' },
  { key_name: 'about_tab2_label',       value: 'Investigación',                type: 'string', description: 'Etiqueta de la pestaña 2' },
  { key_name: 'about_tab3_label',       value: 'Equipo',                       type: 'string', description: 'Etiqueta de la pestaña 3' },
  { key_name: 'about_col_tab_title',    value: 'Nuestras Colecciones',         type: 'string', description: 'Título interno de la pestaña Colecciones' },
  { key_name: 'about_res_tab_title',    value: 'Líneas de Investigación',      type: 'string', description: 'Título interno de la pestaña Investigación' },
  { key_name: 'about_team_tab_title',   value: 'Nuestro Equipo',               type: 'string', description: 'Título interno de la pestaña Equipo' },
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
  // ── Acerca de — Líder del proyecto
  { key_name: 'about_leader_enabled',   value: 'true',                         type: 'boolean', description: 'Mostrar tarjeta del líder del proyecto (Acerca de)' },
  { key_name: 'about_leader_label',     value: 'Líder del proyecto',           type: 'string', description: 'Etiqueta superior de la tarjeta del líder' },
  { key_name: 'about_leader_image',     value: '',                             type: 'string', description: 'URL foto del líder del proyecto' },
  { key_name: 'about_leader_name',      value: 'MSc. Jhon Henry Cuellar Portilla', type: 'string', description: 'Nombre del líder del proyecto' },
  { key_name: 'about_leader_role',      value: 'Director de Programa Ingeniería de Sistemas', type: 'string', description: 'Cargo del líder del proyecto' },
  { key_name: 'about_leader_email',     value: 'jcuellar@itp.edu.co',          type: 'string', description: 'Correo del líder del proyecto' },
  { key_name: 'about_leader_phone',     value: '+57 314 335 1747',             type: 'string', description: 'Teléfono del líder del proyecto' },
  // ── Acerca de — Créditos de desarrollo
  { key_name: 'about_credits_enabled',  value: 'true',                         type: 'boolean', description: 'Mostrar sección de créditos de desarrollo (Acerca de)' },
  { key_name: 'about_credits_title',    value: 'Créditos de desarrollo',       type: 'string', description: 'Título de la sección de créditos' },
  { key_name: 'about_credits_text',     value: 'Aplicativo web desarrollado como producto de pasantía investigativa del programa de Ingeniería de Sistemas de la Institución Universitaria del Putumayo.', type: 'string', description: 'Texto introductorio de los créditos' },
  { key_name: 'about_credits_support_text', value: '¿Necesitas soporte técnico del aplicativo? Contacta a los desarrolladores por correo o GitHub.', type: 'string', description: 'Texto de soporte bajo las tarjetas de créditos' },
  { key_name: 'about_dev1_image',       value: 'https://avatars.githubusercontent.com/u/115267707?v=4', type: 'string', description: 'URL foto desarrollador 1' },
  { key_name: 'about_dev1_badge',       value: 'Desarrollador Full Stack',     type: 'string', description: 'Etiqueta superior desarrollador 1' },
  { key_name: 'about_dev1_name',        value: 'Jhon Esteban Josa Quinchoa',   type: 'string', description: 'Nombre desarrollador 1' },
  { key_name: 'about_dev1_role',        value: 'Estudiante de Ingeniería de Sistemas — Uniputumayo', type: 'string', description: 'Rol desarrollador 1' },
  { key_name: 'about_dev1_bio',         value: 'Backend y frontend con Node.js, Express, Next.js, React, MySQL y Docker.', type: 'string', description: 'Bio breve desarrollador 1' },
  { key_name: 'about_dev1_email',       value: 'jhonjosa2021@itp.edu.co',      type: 'string', description: 'Correo desarrollador 1' },
  { key_name: 'about_dev1_github',      value: 'https://github.com/esteban2oo1', type: 'string', description: 'Perfil de GitHub desarrollador 1' },
  { key_name: 'about_dev2_image',       value: 'https://avatars.githubusercontent.com/u/134365120?v=4', type: 'string', description: 'URL foto desarrollador 2' },
  { key_name: 'about_dev2_badge',       value: 'Desarrollador Full Stack',     type: 'string', description: 'Etiqueta superior desarrollador 2' },
  { key_name: 'about_dev2_name',        value: 'Maycol Sebastián Francisco Guerrero López', type: 'string', description: 'Nombre desarrollador 2' },
  { key_name: 'about_dev2_role',        value: 'Estudiante de Ingeniería de Sistemas — Uniputumayo', type: 'string', description: 'Rol desarrollador 2' },
  { key_name: 'about_dev2_bio',         value: 'Desarrollo web y móvil con Python, JavaScript, Laravel, Flutter, MySQL y Firebase.', type: 'string', description: 'Bio breve desarrollador 2' },
  { key_name: 'about_dev2_email',       value: 'maycolguerrero2021@itp.edu.co', type: 'string', description: 'Correo desarrollador 2' },
  { key_name: 'about_dev2_github',      value: 'https://github.com/mclguerrero', type: 'string', description: 'Perfil de GitHub desarrollador 2' },
  // ── Acerca de — Ubicación
  { key_name: 'about_location_title',    value: 'Visítanos',                   type: 'string', description: 'Título sección Ubicación (Acerca de)' },
  { key_name: 'about_location_address',  value: 'Institución Universitaria del Putumayo\nSede Mocoa - Barrio Luis Carlos Galán\nMocoa, Putumayo, Colombia', type: 'string', description: 'Dirección física (Acerca de)' },
  { key_name: 'about_location_schedule', value: 'El Herbario HEAA está abierto para visitas académicas y de investigación de lunes a viernes, de 8:00 am a 12:00 m y de 2:00 pm a 6:00 pm. Para grupos grandes o visitas especializadas, recomendamos agendar con anticipación.', type: 'string', description: 'Horario de atención (Acerca de)' },
  { key_name: 'about_location_image',    value: '',                            type: 'string', description: 'URL imagen/mapa sección Ubicación (Acerca de)' },
  { key_name: 'about_contact_button_text', value: 'Contactar al Herbario',     type: 'string', description: 'Texto del botón de contacto en Ubicación' },
  { key_name: 'about_contact_button_url',  value: '/contacto',                 type: 'string', description: 'URL del botón de contacto en Ubicación' },
  // ── Acerca de — Colaboraciones (4 instituciones)
  { key_name: 'about_partners_title',   value: 'Colaboraciones y Alianzas',    type: 'string', description: 'Título sección Colaboraciones (Acerca de)' },
  { key_name: 'about_partner1_name',    value: 'Uniputumayo',                  type: 'string', description: 'Nombre institución colaboradora 1' },
  { key_name: 'about_partner1_image',   value: '/images/logo-uniputumayo.png', type: 'string', description: 'URL logo institución colaboradora 1' },
  { key_name: 'about_partner1_url',     value: 'https://itp.edu.co',           type: 'string', description: 'URL enlace institución colaboradora 1' },
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
  // ── Accesibilidad — Lengua de señas (video por sección, aparece al pasar el cursor)
  { key_name: 'senas_enabled',                value: 'false', type: 'boolean', description: 'Activar el intérprete de lengua de señas al pasar el cursor sobre las secciones' },
  { key_name: 'senas_video_hero',             value: '',      type: 'string',  description: 'URL del video de señas para el Hero principal' },
  { key_name: 'senas_video_accesos',          value: '',      type: 'string',  description: 'URL del video de señas para la sección de Accesos rápidos' },
  { key_name: 'senas_video_publicaciones',    value: '',      type: 'string',  description: 'URL del video de señas para Publicaciones y Servicios' },
  { key_name: 'senas_video_caracteristicas',  value: '',      type: 'string',  description: 'URL del video de señas para la sección de Características' },
  { key_name: 'senas_video_destacadas',       value: '',      type: 'string',  description: 'URL del video de señas para Plantas destacadas' },
  // ── Tema institucional GOV.CO
  { key_name: 'theme_primary',        value: '#00833E', type: 'string', description: 'Color verde principal del tema (navbar, botones, títulos)' },
  { key_name: 'theme_primary_dark',   value: '#005C2A', type: 'string', description: 'Verde oscuro del tema (footer, hover de menú)' },
  { key_name: 'theme_accent',         value: '#F0A500', type: 'string', description: 'Color de acento amarillo del tema' },
  { key_name: 'govbar_enabled',       value: 'true',            type: 'boolean', description: 'Mostrar barra superior GOV.CO' },
  { key_name: 'govbar_text',          value: 'GOV.CO',          type: 'string',  description: 'Texto de la barra superior institucional' },
  { key_name: 'govbar_url',           value: 'https://www.gov.co', type: 'string', description: 'URL de la barra superior institucional' },
  // Accesos rápidos (página de inicio)
  { key_name: 'quick_enabled',        value: 'true',            type: 'boolean', description: 'Mostrar sección de accesos rápidos' },
  { key_name: 'quick_title',          value: 'Accesos rápidos', type: 'string',  description: 'Título de la sección de accesos rápidos' },
  { key_name: 'quick1_icon',          value: 'Leaf',            type: 'string',  description: 'Icono acceso rápido 1 (Leaf, Search, Database, Star, Globe, BookOpen, Mail, Info, MapPin, Users, FileText)' },
  { key_name: 'quick1_text',          value: 'Catálogo de plantas', type: 'string', description: 'Texto acceso rápido 1' },
  { key_name: 'quick1_url',           value: '/plantas',        type: 'string',  description: 'URL acceso rápido 1' },
  { key_name: 'quick2_icon',          value: 'BookOpen',        type: 'string',  description: 'Icono acceso rápido 2' },
  { key_name: 'quick2_text',          value: 'Publicaciones',   type: 'string',  description: 'Texto acceso rápido 2' },
  { key_name: 'quick2_url',           value: '/publicaciones',  type: 'string',  description: 'URL acceso rápido 2' },
  { key_name: 'quick3_icon',          value: 'Info',            type: 'string',  description: 'Icono acceso rápido 3' },
  { key_name: 'quick3_text',          value: 'Acerca del herbario', type: 'string', description: 'Texto acceso rápido 3' },
  { key_name: 'quick3_url',           value: '/acerca',         type: 'string',  description: 'URL acceso rápido 3' },
  { key_name: 'quick4_icon',          value: 'Mail',            type: 'string',  description: 'Icono acceso rápido 4' },
  { key_name: 'quick4_text',          value: 'Contacto',        type: 'string',  description: 'Texto acceso rápido 4' },
  { key_name: 'quick4_url',           value: '/contacto',       type: 'string',  description: 'URL acceso rápido 4' },
  // Sidebar institucional (página de inicio)
  { key_name: 'sidebar_enabled',      value: 'true',            type: 'boolean', description: 'Mostrar sidebar institucional en la página de inicio' },
  { key_name: 'sidebar_stats_title',  value: 'Estadísticas de la colección', type: 'string', description: 'Título del bloque de estadísticas del sidebar' },
  { key_name: 'sidebar_links_title',  value: 'Enlaces de interés', type: 'string', description: 'Título del bloque de enlaces del sidebar' },
  { key_name: 'sidebar_link1_text',   value: 'Catálogo de plantas', type: 'string', description: 'Texto enlace 1 del sidebar' },
  { key_name: 'sidebar_link1_url',    value: '/plantas',        type: 'string',  description: 'URL enlace 1 del sidebar' },
  { key_name: 'sidebar_link2_text',   value: 'Sugerencias y contacto', type: 'string', description: 'Texto enlace 2 del sidebar' },
  { key_name: 'sidebar_link2_url',    value: '/contacto',       type: 'string',  description: 'URL enlace 2 del sidebar' },
  { key_name: 'sidebar_link3_text',   value: 'Uniputumayo',     type: 'string',  description: 'Texto enlace 3 del sidebar' },
  { key_name: 'sidebar_link3_url',    value: 'https://itp.edu.co', type: 'string', description: 'URL enlace 3 del sidebar' },
  { key_name: 'sidebar_info_title',   value: 'Horario de atención', type: 'string', description: 'Título del bloque informativo del sidebar' },
  { key_name: 'sidebar_info_text',    value: 'Lunes a viernes\n8:00 a.m. – 12:00 m. y 2:00 p.m. – 6:00 p.m.', type: 'string', description: 'Texto del bloque informativo del sidebar' },
  // Footer — datos legales
  { key_name: 'footer_legal_info',    value: 'Institución Universitaria del Putumayo · NIT 800.247.940-1\nSede Mocoa — Barrio Luis Carlos Galán, Mocoa, Putumayo, Colombia', type: 'string', description: 'Datos legales del footer (NIT, dirección)' },
  // Redes sociales — barra flotante lateral
  { key_name: 'social_enabled',       value: 'true',  type: 'boolean', description: 'Mostrar la barra flotante lateral de redes sociales' },
  { key_name: 'social_position',      value: 'right', type: 'string',  description: 'Posición de la barra de redes: right o left' },
  { key_name: 'social_facebook_url',  value: '',      type: 'string',  description: 'URL de la página de Facebook (vacío = oculto)' },
  { key_name: 'social_x_url',         value: '',      type: 'string',  description: 'URL del perfil de X / Twitter (vacío = oculto)' },
  { key_name: 'social_instagram_url', value: '',      type: 'string',  description: 'URL del perfil de Instagram (vacío = oculto)' },
  { key_name: 'social_youtube_url',   value: '',      type: 'string',  description: 'URL del canal de YouTube (vacío = oculto)' },
  { key_name: 'social_whatsapp_url',  value: '',      type: 'string',  description: 'Enlace de WhatsApp, ej: https://wa.me/57XXXXXXXXXX (vacío = oculto)' },
  { key_name: 'social_tiktok_url',    value: '',      type: 'string',  description: 'URL del perfil de TikTok (vacío = oculto)' },
  { key_name: 'social_linkedin_url',  value: '',      type: 'string',  description: 'URL del perfil de LinkedIn (vacío = oculto)' },
  // Login
  { key_name: 'login_bg_image',       value: 'https://www.floresyplantas.net/wp-content/uploads/psychotria-elata-1.jpg', type: 'string', description: 'URL de imagen de fondo del panel izquierdo de la página de login' },
  { key_name: 'login_bg_attribution', value: 'IERNA SINCHI',       type: 'string',  description: 'Atribución de la imagen de fondo del login' },
  { key_name: 'login_tagline',        value: 'Descubre la flora de la Amazonia', type: 'string', description: 'Tagline que aparece en el panel izquierdo del login' },
  // Logo
  { key_name: 'logo_text',              value: 'Herbario HEAA',     type: 'string',  description: 'Nombre o texto del logo del sitio' },
  { key_name: 'logo_image_url',         value: '/images/logo-uniputumayo.png', type: 'string',  description: 'URL de imagen de logo (opcional, vacío usa icono)' },
  // Footer — texto general
  { key_name: 'footer_description',     value: 'Explorando y preservando la diversidad botánica para las generaciones futuras.', type: 'string', description: 'Descripción breve en el footer' },
  { key_name: 'footer_copyright',       value: 'Herbario HEAA — Institución Universitaria del Putumayo. Todos los derechos reservados.', type: 'string', description: 'Texto de copyright del footer' },
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

// ── Migración: configuración del Chatbot (categoría 'chatbot') ───────────────
// Los textos visibles son públicos (is_public=1); el proveedor, modelo, prompt
// y las API keys son privados (is_public=0) y nunca se exponen al frontend.
const CHATBOT_SETTINGS = [
  { key_name: 'chatbot_enabled',        value: 'false', type: 'boolean', is_public: 1, description: 'Activar el asistente virtual (chatbot) en el sitio público' },
  { key_name: 'chatbot_title',          value: 'Asistente del Herbario', type: 'string', is_public: 1, description: 'Título que aparece en la cabecera del chat' },
  { key_name: 'chatbot_welcome',        value: '¡Hola! 🌱 Soy el asistente virtual del Herbario HEAA. ¿En qué puedo ayudarte?', type: 'string', is_public: 1, description: 'Mensaje de bienvenida del chat' },
  { key_name: 'chatbot_placeholder',    value: 'Escribe tu pregunta…', type: 'string', is_public: 1, description: 'Texto del campo de entrada del chat' },
  { key_name: 'chatbot_launcher',       value: '¿Necesitas ayuda?', type: 'string', is_public: 1, description: 'Texto del botón flotante que abre el chat' },
  { key_name: 'chatbot_provider',       value: 'groq', type: 'string', is_public: 0, description: 'Proveedor de IA: "groq" o "google" (Gemini)' },
  { key_name: 'chatbot_model',          value: '', type: 'string', is_public: 0, description: 'Modelo a usar (vacío = predeterminado del proveedor). Groq: llama-3.1-8b-instant. Google: gemini-1.5-flash' },
  { key_name: 'chatbot_system_prompt',  value: '', type: 'string', is_public: 0, description: 'Instrucción de sistema / personalidad (vacío = predeterminado del Herbario)' },
  { key_name: 'chatbot_temperature',    value: '0.4', type: 'string', is_public: 0, description: 'Creatividad del modelo (0.0 a 1.0)' },
  { key_name: 'chatbot_max_history',    value: '10', type: 'string', is_public: 0, description: 'Número máximo de mensajes de historial enviados al modelo' },
  { key_name: 'chatbot_groq_api_key',   value: '', type: 'string', is_public: 0, description: 'API key de GroqCloud (https://console.groq.com/keys)' },
  { key_name: 'chatbot_google_api_key', value: '', type: 'string', is_public: 0, description: 'API key de Google AI Studio (https://aistudio.google.com/app/apikey)' },
];

(async () => {
  try {
    for (const s of CHATBOT_SETTINGS) {
      await db.query(
        `INSERT INTO settings (key_name, value, type, category, description, is_public)
         VALUES (?, ?, ?, 'chatbot', ?, ?)
         ON DUPLICATE KEY UPDATE
           category  = 'chatbot',
           type      = VALUES(type),
           is_public = VALUES(is_public)`,
        [s.key_name, s.value, s.type, s.description, s.is_public]
      );
    }
    logger.info(`✅ Settings del chatbot cargadas (${CHATBOT_SETTINGS.length})`);
  } catch (err) {
    logger.warn('No se pudieron migrar settings del chatbot:', err.message);
  }
})();

// ── Migración de marca: ITP → Uniputumayo ───────────────────────────────────
// Solo actualiza valores que aún conservan el default anterior (no pisa
// personalizaciones hechas desde el panel de administración).
const REBRAND_UPDATES = [
  { key: 'about_subtitle',
    from: 'Instituto Tecnológico del Putumayo (ITP) - Mocoa',
    to:   'Institución Universitaria del Putumayo (Uniputumayo) - Mocoa' },
  { key: 'about_history_p1',
    from: 'El Herbario HEAA del Instituto Tecnológico del Putumayo fue fundado en 2005 con el objetivo de documentar, preservar y estudiar la rica diversidad florística de la región amazónica colombiana, con especial énfasis en el departamento del Putumayo.',
    to:   'El Herbario HEAA de la Institución Universitaria del Putumayo (Uniputumayo) fue fundado en 2005 con el objetivo de documentar, preservar y estudiar la rica diversidad florística de la región amazónica colombiana, con especial énfasis en el departamento del Putumayo.' },
  { key: 'about_location_address',
    from: 'Instituto Tecnológico del Putumayo\nSede Mocoa - Barrio Luis Carlos Galán\nMocoa, Putumayo, Colombia',
    to:   'Institución Universitaria del Putumayo\nSede Mocoa - Barrio Luis Carlos Galán\nMocoa, Putumayo, Colombia' },
  { key: 'about_partner1_name',  from: 'Institución 1', to: 'Uniputumayo' },
  { key: 'about_partner1_image', from: '',              to: '/images/logo-uniputumayo.png' },
  { key: 'about_partner1_url',   from: '',              to: 'https://itp.edu.co' },
  { key: 'logo_text',            from: 'Herbario Digital', to: 'Herbario HEAA' },
  { key: 'logo_image_url',       from: '',              to: '/images/logo-uniputumayo.png' },
  // Unificar al PNG si la BD quedó con las rutas SVG anteriores
  { key: 'about_header_logo',    from: '/images/logo-uniputumayo.svg',       to: '/images/logo-uniputumayo.png' },
  { key: 'about_partner1_image', from: '/images/logo-uniputumayo.svg',       to: '/images/logo-uniputumayo.png' },
  { key: 'logo_image_url',       from: '/images/logo-uniputumayo-icono.svg', to: '/images/logo-uniputumayo.png' },
  { key: 'footer_copyright',
    from: 'Herbario Digital. Todos los derechos reservados.',
    to:   'Herbario HEAA — Institución Universitaria del Putumayo. Todos los derechos reservados.' },
  // Tarjetas profesionales de desarrolladores (avatares de GitHub y roles)
  { key: 'about_dev1_image', from: '', to: 'https://avatars.githubusercontent.com/u/115267707?v=4' },
  { key: 'about_dev2_image', from: '', to: 'https://avatars.githubusercontent.com/u/134365120?v=4' },
  { key: 'about_dev1_role',
    from: 'Desarrollador — Estudiante de Ingeniería de Sistemas',
    to:   'Estudiante de Ingeniería de Sistemas — Uniputumayo' },
  { key: 'about_dev2_role',
    from: 'Desarrollador — Estudiante de Ingeniería de Sistemas',
    to:   'Estudiante de Ingeniería de Sistemas — Uniputumayo' },
];

(async () => {
  try {
    let changed = 0;
    for (const u of REBRAND_UPDATES) {
      const [result] = await db.query(
        'UPDATE settings SET value = ?, updated_at = NOW() WHERE key_name = ? AND value = ?',
        [u.to, u.key, u.from]
      );
      if (result.affectedRows > 0) changed += result.affectedRows;
    }
    if (changed > 0) logger.info(`✅ Migración de marca Uniputumayo aplicada (${changed} settings)`);
  } catch (err) {
    logger.warn('No se pudo aplicar la migración de marca:', err.message);
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
