"use client"

import React, { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { apiService } from "@/lib/api"

const suggestionSchema = z.object({
  title: z
    .string()
    .min(5, { message: "El título debe tener al menos 5 caracteres" })
    .max(100, { message: "El título no puede exceder 100 caracteres" }),
  description: z
    .string()
    .min(20, { message: "La descripción debe tener al menos 20 caracteres" })
    .max(1000, { message: "La descripción no puede exceder 1000 caracteres" }),
  type: z.enum(["feature", "bug", "improvement", "data_correction", "new_plant"], {
    required_error: "Por favor seleccione un tipo de sugerencia",
  }),
  email: z
    .string()
    .email({ message: "Por favor ingrese un correo electrónico válido" })
    .optional(),
  name: z.string().optional(),
})

type SuggestionFormValues = z.infer<typeof suggestionSchema>

export function SuggestionForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const { toast } = useToast()

  const form = useForm<SuggestionFormValues>({
    resolver: zodResolver(suggestionSchema),
    defaultValues: {
      title: "",
      description: "",
      type: undefined,
      email: "",
      name: "",
    },
  })

  const onSubmit = async (data: SuggestionFormValues) => {
    setIsSubmitting(true)
    try {
      console.log("Enviando sugerencia:", data);
      
      // Llamar directamente a la API en lugar de usar apiService para depuración
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/service`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          service: "suggestions.create",
          data: {
            title: data.title,
            description: data.description,
            type: data.type,
            // Incluir campos opcionales solo si tienen valores
            ...(data.email && { email: data.email }),
            ...(data.name && { name: data.name })
          }
        }),
      });
      
      const result = await response.json();
      console.log("Respuesta API:", result);
      
      if (!result.success) {
        throw new Error(result.error || "Error desconocido");
      }

      toast({
        title: "Sugerencia enviada",
        description: "Gracias por tu contribución. Tu sugerencia ha sido recibida.",
      })
      form.reset()
      setIsOpen(false)
    } catch (error) {
      console.error("Error al enviar sugerencia:", error)
      toast({
        title: "Error",
        description: typeof error === 'object' && error !== null && 'message' in error 
          ? (error as Error).message 
          : "No se pudo enviar tu sugerencia. Por favor intenta nuevamente.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Enviar Sugerencia</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Enviar Sugerencia</DialogTitle>
          <DialogDescription>
            Comparte tu sugerencia con nosotros para mejorar el Herbario Digital.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título</FormLabel>
                  <FormControl>
                    <Input placeholder="Título de tu sugerencia" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Sugerencia</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="feature">Nueva característica</SelectItem>
                      <SelectItem value="bug">Reporte de error</SelectItem>
                      <SelectItem value="improvement">Mejora</SelectItem>
                      <SelectItem value="data_correction">Corrección de datos</SelectItem>
                      <SelectItem value="new_plant">Nueva planta</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe tu sugerencia en detalle"
                      className="min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre (opcional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Tu nombre" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Correo (opcional)</FormLabel>
                    <FormControl>
                      <Input placeholder="tu@email.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setIsOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Enviar Sugerencia
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
