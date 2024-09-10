'use client'

import { useState } from 'react'
import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { Plus } from "lucide-react"

export function ListComponent({ children }: { children: React.ReactNode }) {
  const [filter, setFilter] = useState('')



  return (
    <div className="max-w-md mx-auto p-4">
      <div className="mb-4">
        <h1 className="text-2xl font-bold mb-2">My List</h1>
        <div className="flex gap-2 mb-2">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Item
          </Button>
          <Input
            type="text"
            placeholder="Filter items..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="flex-grow"
          />
        </div>
      </div>
      <div className="max-w-xl space-y-3">
        {children}
      </div>
    </div>
  )
}