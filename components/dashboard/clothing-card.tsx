"use client"

import { useState } from "react"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreVerticalIcon, TrashIcon } from "lucide-react"
import { ClothingItem } from "@/lib/types"
import { toast } from "sonner"

interface ClothingCardProps {
  item: ClothingItem
  onDelete?: (id: string) => void
}

export function ClothingCard({ item, onDelete }: ClothingCardProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!item.id) return
    
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/clothes?id=${item.id}`, {
        method: "DELETE",
      })

      if (!res.ok) {
        throw new Error("Failed to delete")
      }

      toast.success("Item deleted")
      onDelete?.(item.id)
    } catch {
      toast.error("Failed to delete item")
    } finally {
      setIsDeleting(false)
    }
  }

  const imageUrl = `/api/file?pathname=${encodeURIComponent(item.image_pathname)}`

  return (
    <Card className="overflow-hidden group">
      <div className="relative aspect-square bg-muted">
        <Image
          src={imageUrl}
          alt={item.name}
          fill
          className="object-cover transition-transform group-hover:scale-105"
          sizes="(max-width: 768px) 50vw, 25vw"
        />
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="icon"
                variant="secondary"
                className="h-8 w-8 shadow-md"
              >
                <MoreVerticalIcon className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={handleDelete}
                disabled={isDeleting}
                className="text-destructive"
              >
                <TrashIcon className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <CardContent className="p-3">
        <h3 className="font-medium truncate">{item.name}</h3>
        <div className="flex flex-wrap gap-1 mt-2">
          <Badge variant="secondary" className="text-xs">
            {item.type}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {item.color}
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
}
