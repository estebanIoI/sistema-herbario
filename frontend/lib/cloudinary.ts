// lib/cloudinary.ts
import { Cloudinary } from '@cloudinary/url-gen';
import { auto } from '@cloudinary/url-gen/actions/resize';
import { autoGravity } from '@cloudinary/url-gen/qualifiers/gravity';
import { format, quality } from '@cloudinary/url-gen/actions/delivery';

// Configuracion de Cloudinary
const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'djhhtzcwu';

// Instancia de Cloudinary
export const cld = new Cloudinary({
  cloud: {
    cloudName: CLOUD_NAME,
  },
});

// Tipos para las opciones de imagen
interface ImageOptions {
  width?: number;
  height?: number;
  crop?: 'auto' | 'fill' | 'scale' | 'fit' | 'thumb';
  gravity?: 'auto' | 'face' | 'center';
  quality?: 'auto' | 'auto:low' | 'auto:good' | 'auto:best' | number;
}

// Genera URL optimizada de imagen
export function getCloudinaryUrl(publicId: string, options: ImageOptions = {}): string {
  const { width = 500, height = 500 } = options;

  const img = cld
    .image(publicId)
    .format('auto')
    .quality('auto')
    .resize(auto().gravity(autoGravity()).width(width).height(height));

  return img.toURL();
}

// Genera URL de thumbnail
export function getThumbnailUrl(publicId: string, size: number = 150): string {
  return getCloudinaryUrl(publicId, { width: size, height: size });
}

// Genera URL de imagen para card de planta
export function getPlantCardImageUrl(publicId: string): string {
  return getCloudinaryUrl(publicId, { width: 400, height: 300 });
}

// Genera URL de imagen grande para detalle
export function getPlantDetailImageUrl(publicId: string): string {
  return getCloudinaryUrl(publicId, { width: 800, height: 600 });
}

// Genera URL de imagen full para galeria
export function getFullImageUrl(publicId: string): string {
  const img = cld
    .image(publicId)
    .format('auto')
    .quality('auto:best');

  return img.toURL();
}

// Extrae el publicId de una URL de Cloudinary
export function extractPublicId(url: string): string | null {
  if (!url) return null;

  // Si ya es un publicId (no es URL), retornarlo
  if (!url.startsWith('http')) {
    return url;
  }

  // Extraer publicId de URL de Cloudinary
  const regex = /\/v\d+\/(.+?)(?:\.[a-z]+)?$/i;
  const match = url.match(regex);

  if (match && match[1]) {
    return match[1];
  }

  return null;
}

// Verifica si una URL es de Cloudinary
export function isCloudinaryUrl(url: string): boolean {
  if (!url) return false;
  return url.includes('cloudinary.com') || url.includes('res.cloudinary.com');
}

export default cld;
