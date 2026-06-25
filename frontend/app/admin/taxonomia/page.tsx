"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ChevronRight, ChevronDown, Network, Loader2, Search } from "lucide-react"
import { apiService, type TaxonNode } from "@/lib/api"

const RANK_LABEL: Record<string, string> = {
  kingdom: "Reino", phylum: "Filo", class: "Clase", order: "Orden",
  family: "Familia", genus: "Género", species: "Especie",
}
const RANK_COLOR: Record<string, string> = {
  kingdom: "#2E5E38", phylum: "#3b7ea1", class: "#7BA66C", order: "#c98a2e",
  family: "#6b5ca5", genus: "#1d9e75", species: "#9c4f8a",
}
const ITALIC = new Set(["genus", "species"])

// Filtra el árbol: conserva nodos cuyo nombre coincide o que tienen descendientes que coinciden
function filterTree(nodes: TaxonNode[], q: string): TaxonNode[] {
  if (!q) return nodes
  const ql = q.toLowerCase()
  const walk = (list: TaxonNode[]): TaxonNode[] =>
    list.reduce<TaxonNode[]>((acc, n) => {
      const kids = n.children ? walk(n.children) : []
      if (n.name.toLowerCase().includes(ql) || kids.length) {
        acc.push({ ...n, children: kids.length ? kids : n.children })
      }
      return acc
    }, [])
  return walk(nodes)
}

function TreeNode({ node, depth, expandAll }: { node: TaxonNode; depth: number; expandAll: boolean }) {
  const [open, setOpen] = useState(depth < 1)
  useEffect(() => { if (expandAll) setOpen(true) }, [expandAll])
  const hasKids = !!node.children?.length

  return (
    <div>
      <div
        className="flex items-center gap-2 py-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
        style={{ paddingLeft: depth * 18 + 6 }}
        onClick={() => hasKids && setOpen(o => !o)}
      >
        <span className="w-4 shrink-0 text-muted-foreground">
          {hasKids ? (open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />) : null}
        </span>
        <span
          className="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded shrink-0"
          style={{ background: `${RANK_COLOR[node.type]}1f`, color: RANK_COLOR[node.type] }}
        >
          {RANK_LABEL[node.type] ?? node.type}
        </span>
        <span className={`text-sm ${ITALIC.has(node.type) ? "italic" : ""}`} style={{ color: "var(--bot-ink)" }}>
          {node.name}
        </span>
        <span className="ml-auto mr-2 text-xs tabular-nums text-muted-foreground">{node.plantCount}</span>
      </div>
      {hasKids && open && (
        <div>
          {node.children!.map((c, i) => (
            <TreeNode key={`${c.type}-${c.name}-${i}`} node={c} depth={depth + 1} expandAll={expandAll} />
          ))}
        </div>
      )}
    </div>
  )
}

export default function TaxonomiaPage() {
  const [data, setData] = useState<{ levels: string[]; totalTaxa: number; tree: TaxonNode[] } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [q, setQ] = useState("")

  useEffect(() => {
    ;(async () => {
      const r = await apiService.getTaxonomyHierarchy()
      if (r.success && r.data) setData(r.data)
      else setError(r.error ?? "No se pudo cargar la jerarquía")
      setLoading(false)
    })()
  }, [])

  const filtered = useMemo(() => filterTree(data?.tree ?? [], q.trim()), [data, q])

  return (
    <div className="space-y-6 pb-10 pt-6">
      <div>
        <h1 className="text-[32px] font-bold tracking-tight flex items-center gap-2" style={{ color: "var(--bot-ink)" }}>
          <Network className="h-7 w-7" style={{ color: "var(--bot-green)" }} />
          Árbol taxonómico
        </h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--bot-ink-soft)" }}>
          Jerarquía Darwin Core completa: reino → filo → clase → orden → familia → género → especie
          {data && <span className="ml-2 opacity-70">· {data.totalTaxa} taxones</span>}
        </p>
      </div>

      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Filtrar por nombre (familia, género, especie…)"
          className="pl-9"
        />
      </div>

      <Card>
        <CardContent className="p-3 md:p-4">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : error ? (
            <div className="py-16 text-center text-sm text-red-500">{error}</div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-sm text-muted-foreground">
              {q ? "Sin coincidencias para el filtro." : "Aún no hay datos taxonómicos publicados."}
            </div>
          ) : (
            <div>
              {filtered.map((n, i) => (
                <TreeNode key={`${n.type}-${n.name}-${i}`} node={n} depth={0} expandAll={!!q.trim()} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
