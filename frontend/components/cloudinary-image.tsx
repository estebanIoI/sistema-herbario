'use client';

import React, { useState } from 'react';
import { AdvancedImage, placeholder, lazyload, responsive } from '@cloudinary/react';
import { cld, isCloudinaryUrl, extractPublicId } from '@/lib/cloudinary';
import { auto, fill, scale } from '@cloudinary/url-gen/actions/resize';
import { autoGravity } from '@cloudinary/url-gen/qualifiers/gravity';
import Image from 'next/image';

interface CloudinaryImageProps {
  src: string; // Puede ser publicId o URL completa
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  fallbackSrc?: string;
  priority?: boolean;
  fill?: boolean;
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
}

export function CloudinaryImage({
  src,
  alt,
  width = 500,
  height = 500,
  className = '',
  fallbackSrc = '/placeholder.svg',
  priority = false,
  fill: fillContainer = false,
  objectFit = 'cover',
}: CloudinaryImageProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Si hay error, mostrar fallback
  if (hasError || !src) {
    return (
      <Image
        src={fallbackSrc}
        alt={alt}
        width={fillContainer ? undefined : width}
        height={fillContainer ? undefined : height}
        fill={fillContainer}
        className={className}
        style={fillContainer ? { objectFit } : undefined}
      />
    );
  }

  // Si es una URL blob (vista previa local), usar img nativo
  if (src.startsWith('blob:')) {
    return (
      <div className={`relative ${className}`} style={fillContainer ? { width: '100%', height: '100%' } : {}}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          className={className}
          style={fillContainer ? { width: '100%', height: '100%', objectFit } : { width, height, objectFit }}
          onError={() => setHasError(true)}
          onLoad={() => setIsLoading(false)}
        />
      </div>
    );
  }

  // Si es una URL de Cloudinary, usar AdvancedImage
  if (isCloudinaryUrl(src)) {
    const publicId = extractPublicId(src);

    if (publicId) {
      const img = cld
        .image(publicId)
        .format('auto')
        .quality('auto')
        .resize(auto().gravity(autoGravity()).width(width).height(height));

      return (
        <div className={`relative ${className}`} style={fillContainer ? { width: '100%', height: '100%' } : {}}>
          {isLoading && (
            <div className="absolute inset-0 bg-muted animate-pulse" />
          )}
          <AdvancedImage
            cldImg={img}
            plugins={[lazyload(), responsive(), placeholder({ mode: 'blur' })]}
            alt={alt}
            className={className}
            onLoad={() => setIsLoading(false)}
            onError={() => setHasError(true)}
            style={fillContainer ? { width: '100%', height: '100%', objectFit } : {}}
          />
        </div>
      );
    }
  }

  // Si es una ruta local (comienza con /), usar Next Image
  if (src.startsWith('/')) {
    return (
      <Image
        src={src}
        alt={alt}
        width={fillContainer ? undefined : width}
        height={fillContainer ? undefined : height}
        fill={fillContainer}
        className={className}
        style={fillContainer ? { objectFit } : undefined}
        priority={priority}
        onError={() => setHasError(true)}
        onLoad={() => setIsLoading(false)}
      />
    );
  }

  // Si es un publicId directo (sin URL), usar AdvancedImage
  if (!src.startsWith('http')) {
    const img = cld
      .image(src)
      .format('auto')
      .quality('auto')
      .resize(auto().gravity(autoGravity()).width(width).height(height));

    return (
      <div className={`relative ${className}`} style={fillContainer ? { width: '100%', height: '100%' } : {}}>
        {isLoading && (
          <div className="absolute inset-0 bg-muted animate-pulse" />
        )}
        <AdvancedImage
          cldImg={img}
          plugins={[lazyload(), responsive(), placeholder({ mode: 'blur' })]}
          alt={alt}
          className={className}
          onLoad={() => setIsLoading(false)}
          onError={() => setHasError(true)}
          style={fillContainer ? { width: '100%', height: '100%', objectFit } : {}}
        />
      </div>
    );
  }

  // Si es una URL local o externa (no Cloudinary), usar Next Image
  return (
    <Image
      src={src}
      alt={alt}
      width={fillContainer ? undefined : width}
      height={fillContainer ? undefined : height}
      fill={fillContainer}
      className={className}
      style={fillContainer ? { objectFit } : undefined}
      priority={priority}
      onError={() => setHasError(true)}
      onLoad={() => setIsLoading(false)}
    />
  );
}

export default CloudinaryImage;
