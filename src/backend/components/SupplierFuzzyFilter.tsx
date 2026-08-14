'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Building2 } from 'lucide-react'
import { Input } from '@/backend/components/ui'
import { listProductSupplierNames } from '@/backend/actions/ProductManagement'
import { tokenizeProductSearch } from '@/shared/productSearch'
import { cn } from '@/lib/utils'

function supplierMatchesQuery(name: string, query: string) {
  const tokens = tokenizeProductSearch(query)
  if (!tokens.length) return true
  const hay = String(name || '').toLowerCase()
  const compactHay = hay.replace(/[\s\-_/]+/g, '')
  return tokens.every((token) => hay.includes(token) || compactHay.includes(token.replace(/[\s\-_/]+/g, '')))
}

export function SupplierFuzzyFilter({
  value,
  onChange,
  onSearch,
}: {
  value: string
  onChange: (value: string) => void
  onSearch: () => void
}) {
  const [open, setOpen] = useState(false)
  const [options, setOptions] = useState<string[]>([])
  const composingRef = useRef(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const loadedRef = useRef(false)
  const debounceRef = useRef<number | null>(null)

  const loadOptions = (keyword?: string) => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current)
    debounceRef.current = window.setTimeout(async () => {
      try {
        const result = await listProductSupplierNames({ keyword: keyword?.trim() || undefined })
        setOptions(result.list || [])
        loadedRef.current = true
      } catch {
        if (!loadedRef.current) setOptions([])
      }
    }, 180)
  }

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      if (debounceRef.current) window.clearTimeout(debounceRef.current)
    }
  }, [])

  const suggestions = useMemo(() => {
    const q = value.trim()
    const filtered = options.filter((name) => supplierMatchesQuery(name, q) && name !== q)
    return filtered.slice(0, 12)
  }, [options, value])

  return (
    <div ref={rootRef} className="relative">
      <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
      <Input
        className="h-10 pl-9"
        placeholder="模糊搜索供应商"
        value={value}
        autoComplete="off"
        onFocus={() => {
          setOpen(true)
          void loadOptions(value)
        }}
        onChange={(event) => {
          onChange(event.target.value)
          setOpen(true)
          if (!composingRef.current) void loadOptions(event.target.value)
        }}
        onCompositionStart={() => {
          composingRef.current = true
        }}
        onCompositionEnd={(event) => {
          composingRef.current = false
          const next = (event.target as HTMLInputElement).value
          onChange(next)
          void loadOptions(next)
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault()
            setOpen(false)
            onSearch()
          }
          if (event.key === 'Escape') setOpen(false)
        }}
      />
      {open && suggestions.length > 0 ? (
        <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-50 max-h-56 overflow-auto rounded-md border bg-popover py-1 shadow-md">
          {suggestions.map((name) => (
            <button
              key={name}
              type="button"
              className={cn(
                'flex w-full px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground',
              )}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                onChange(name)
                setOpen(false)
                onSearch()
              }}
            >
              {name}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
