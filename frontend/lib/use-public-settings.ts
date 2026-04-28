"use client"

import { useState, useEffect } from "react"
import { apiService } from "./api"

// Cache a nivel de módulo para no repetir la llamada entre navbar y footer
let _cached: Record<string, any> | null = null
let _promise: Promise<Record<string, any>> | null = null

export function usePublicSettings(): Record<string, any> {
  const [settings, setSettings] = useState<Record<string, any>>(_cached ?? {})

  useEffect(() => {
    if (_cached) {
      setSettings(_cached)
      return
    }
    if (!_promise) {
      _promise = apiService
        .getPublicSettings()
        .then(res => (res.success && res.data ? res.data : {}))
        .catch(() => ({}))
    }
    _promise.then(data => {
      _cached = data
      setSettings(data)
    })
  }, [])

  return settings
}

// Invalida la caché (útil después de guardar cambios en el admin)
export function invalidatePublicSettingsCache() {
  _cached = null
  _promise = null
}
