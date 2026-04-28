"use client"

import { useState, useEffect } from "react"
import { Filter, X, Plus, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

interface AdvancedFiltersProps {
  onFiltersChange: (filters: { field: string; value: string }[]) => void
}

export default function AdvancedFilters({ onFiltersChange }: AdvancedFiltersProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [filters, setFilters] = useState<{ field: string; value: string }[]>([])
  const [currentField, setCurrentField] = useState("")
  const [currentValue, setCurrentValue] = useState("")

  // Opciones de campos para filtrar
  const fieldOptions = [
    { value: "familia", label: "Familia" },
    { value: "genero", label: "Género" },
    { value: "especie", label: "Especie" },
    { value: "departamento", label: "Departamento" },
    { value: "municipio", label: "Municipio" },
    { value: "nombreComun", label: "Nombre común" },
    { value: "colector", label: "Nombre del colector" },
    { value: "numeroColector", label: "Número del colector" },
  ]

  // Opciones de valores para cada campo (en una aplicación real, estos vendrían de una API)
  const valueOptions: Record<string, { value: string; label: string }[]> = {
    familia: [
      { value: "lamiaceae", label: "Lamiaceae" },
      { value: "asteraceae", label: "Asteraceae" },
      { value: "asphodelaceae", label: "Asphodelaceae" },
      { value: "solanaceae", label: "Solanaceae" },
      { value: "rubiaceae", label: "Rubiaceae" },
    ],
    genero: [
      { value: "lavandula", label: "Lavandula" },
      { value: "rosmarinus", label: "Rosmarinus" },
      { value: "aloe", label: "Aloe" },
      { value: "mentha", label: "Mentha" },
      { value: "ocimum", label: "Ocimum" },
      { value: "calendula", label: "Calendula" },
      { value: "solanum", label: "Solanum" },
      { value: "coffea", label: "Coffea" },
    ],
    departamento: [
      { value: "cundinamarca", label: "Cundinamarca" },
      { value: "antioquia", label: "Antioquia" },
      { value: "valle", label: "Valle del Cauca" },
      { value: "santander", label: "Santander" },
      { value: "atlantico", label: "Atlántico" },
      { value: "putumayo", label: "Putumayo" },
      { value: "huila", label: "Huila" },
    ],
    municipio: [
      { value: "bogota", label: "Bogotá" },
      { value: "medellin", label: "Medellín" },
      { value: "cali", label: "Cali" },
      { value: "bucaramanga", label: "Bucaramanga" },
      { value: "barranquilla", label: "Barranquilla" },
      { value: "mocoa", label: "Mocoa" },
      { value: "pitalito", label: "Pitalito" },
    ],
  }

  // Notificar al componente padre cuando cambian los filtros
  useEffect(() => {
    onFiltersChange(filters)
  }, [filters, onFiltersChange])

  const addFilter = () => {
    if (currentField && currentValue) {
      setFilters([...filters, { field: currentField, value: currentValue }])
      setCurrentField("")
      setCurrentValue("")
    }
  }

  const removeFilter = (index: number) => {
    const newFilters = [...filters]
    newFilters.splice(index, 1)
    setFilters(newFilters)
  }

  const clearFilters = () => {
    setFilters([])
  }

  const applyFilters = () => {
    setIsOpen(false)
  }

  // Obtener el label para un valor dado
  const getValueLabel = (field: string, value: string) => {
    if (valueOptions[field]) {
      const option = valueOptions[field].find((opt) => opt.value === value)
      return option ? option.label : value
    }
    return value
  }

  // Obtener el label para un campo dado
  const getFieldLabel = (field: string) => {
    const option = fieldOptions.find((opt) => opt.value === field)
    return option ? option.label : field
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          Más filtros
        </Button>
      </SheetTrigger>
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Filtros avanzados</SheetTitle>
          <SheetDescription>Refina tu búsqueda utilizando múltiples criterios</SheetDescription>
        </SheetHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="field">Campo</Label>
              <Select value={currentField} onValueChange={setCurrentField}>
                <SelectTrigger id="field">
                  <SelectValue placeholder="Seleccione..." />
                </SelectTrigger>
                <SelectContent>
                  {fieldOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="value">Índice</Label>
              {currentField && valueOptions[currentField] ? (
                <Select value={currentValue} onValueChange={setCurrentValue}>
                  <SelectTrigger id="value">
                    <SelectValue placeholder="Seleccione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {valueOptions[currentField].map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="value"
                    value={currentValue}
                    onChange={(e) => setCurrentValue(e.target.value)}
                    placeholder="Buscar o tecla Enter"
                    className="pl-8"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && currentField && currentValue) {
                        e.preventDefault()
                        addFilter()
                      }
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          <Button onClick={addFilter} disabled={!currentField || !currentValue} className="w-full">
            <Plus className="mr-2 h-4 w-4" />
            Añadir filtro
          </Button>

          {filters.length > 0 && (
            <>
              <Separator />

              <div className="space-y-2">
                <Label>Filtros aplicados</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {filters.map((filter, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      {getFieldLabel(filter.field)}: {getValueLabel(filter.field, filter.value)}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-4 w-4 p-0 hover:bg-transparent"
                        onClick={() => removeFilter(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              </div>

              <Button variant="outline" onClick={clearFilters} className="w-full">
                Limpiar todos los filtros
              </Button>
            </>
          )}
        </div>

        <SheetFooter>
          <Button className="w-full bg-green-600 hover:bg-green-700" onClick={applyFilters}>
            Aplicar filtros
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
