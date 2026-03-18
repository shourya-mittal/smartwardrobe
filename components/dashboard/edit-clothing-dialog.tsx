"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { XIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import {
  CLOTHING_TYPES,
  COLORS,
  SEASONS,
  OCCASIONS,
  MATERIALS,
  FITS,
  PATTERNS,
  ClothingType,
  Color,
  Season,
  Occasion,
  Material,
  Fit,
  Pattern,
  ClothingItem,
} from "@/lib/types"

interface EditClothingDialogProps {
  item: ClothingItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function EditClothingDialog({
  item,
  open,
  onOpenChange,
  onSuccess,
}: EditClothingDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [name, setName] = useState("")
  const [type, setType] = useState<ClothingType>("top")
  const [color, setColor] = useState<Color>("black")
  const [seasons, setSeasons] = useState<Season[]>(["all"])
  const [occasions, setOccasions] = useState<Occasion[]>(["casual"])
  const [material, setMaterial] = useState<Material>("cotton")
  const [fit, setFit] = useState<Fit>("regular")
  const [pattern, setPattern] = useState<Pattern>("solid")

  useEffect(() => {
    if (item) {
      setName(item.name)
      setType(item.type)
      setColor(item.color)
      setSeasons(item.seasons)
      setOccasions(item.occasions)
      setMaterial(item.material ?? "other")
      setFit(item.fit ?? "regular")
      setPattern(item.pattern ?? "solid")
    }
  }, [item])

  const toggleSeason = (season: Season) => {
    if (season === "all") {
      setSeasons(["all"])
    } else {
      const next = seasons.includes(season)
        ? seasons.filter((s) => s !== season)
        : [...seasons.filter((s) => s !== "all"), season]
      setSeasons(next.length > 0 ? next : ["all"])
    }
  }

  const toggleOccasion = (occasion: Occasion) => {
    const next = occasions.includes(occasion)
      ? occasions.filter((o) => o !== occasion)
      : [...occasions, occasion]
    setOccasions(next.length > 0 ? next : ["casual"])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!item) return
    if (!name.trim()) {
      toast.error("Please enter a name")
      return
    }
    setIsLoading(true)
    try {
      const res = await fetch(`/api/clothes/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), type, color, seasons, occasions, material, fit, pattern }),
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Failed to update item")
      }
      toast.success("Item updated!")
      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong")
    } finally {
      setIsLoading(false)
    }
  }

  const imageUrl = item
    ? `/api/file?pathname=${encodeURIComponent(item.image_pathname)}`
    : null

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        {/* Overlay */}
        <DialogPrimitive.Overlay
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 50,
            backgroundColor: "rgba(0,0,0,0.5)",
          }}
        />

        {/* Content — inline styles guarantee scroll works on all devices */}
        <DialogPrimitive.Content
          style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 50,
            width: "calc(100% - 2rem)",
            maxWidth: "32rem",
            maxHeight: "85dvh",
            display: "flex",
            flexDirection: "column",
            borderRadius: "0.5rem",
            border: "1px solid var(--border)",
            backgroundColor: "var(--background)",
            boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
            overflow: "hidden",
          }}
        >
          {/* Close button */}
          <DialogPrimitive.Close
            style={{
              position: "absolute",
              top: "1rem",
              right: "1rem",
              opacity: 0.7,
              cursor: "pointer",
              background: "none",
              border: "none",
              padding: 0,
              zIndex: 10,
            }}
          >
            <XIcon style={{ width: "1rem", height: "1rem" }} />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>

          {/* Header — never scrolls */}
          <div style={{ padding: "1.5rem 1.5rem 0.75rem", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
            <DialogPrimitive.Title style={{ fontSize: "1.125rem", fontWeight: 600, marginBottom: "0.25rem" }}>
              Edit Clothing Item
            </DialogPrimitive.Title>
            <DialogPrimitive.Description style={{ fontSize: "0.875rem", color: "var(--muted-foreground)" }}>
              Update the tags for this item
            </DialogPrimitive.Description>
          </div>

          {/* Scrollable body */}
          <div style={{ overflowY: "auto", flex: 1, padding: "1rem 1.5rem" }}>
            {imageUrl && (
              <div style={{ position: "relative", width: 100, height: 100, margin: "0 auto 1.25rem", borderRadius: "0.75rem", overflow: "hidden" }}>
                <Image src={imageUrl} alt={name} fill className="object-cover" />
              </div>
            )}

            <form id="edit-form" onSubmit={handleSubmit} className="space-y-5">
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="edit-name">Name</FieldLabel>
                  <Input
                    id="edit-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={isLoading}
                  />
                </Field>

                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel>Type</FieldLabel>
                    <Select value={type} onValueChange={(v) => setType(v as ClothingType)} disabled={isLoading}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {CLOTHING_TYPES.map((t) => (
                          <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field>
                    <FieldLabel>Color</FieldLabel>
                    <Select value={color} onValueChange={(v) => setColor(v as Color)} disabled={isLoading}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {COLORS.map((c) => (
                          <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                </div>

                <Field>
                  <FieldLabel>Seasons</FieldLabel>
                  <div className="flex flex-wrap gap-2">
                    {SEASONS.map((s) => (
                      <Badge
                        key={s}
                        variant={seasons.includes(s) ? "default" : "outline"}
                        className="cursor-pointer capitalize"
                        onClick={() => !isLoading && toggleSeason(s)}
                      >
                        {s}
                      </Badge>
                    ))}
                  </div>
                </Field>

                <Field>
                  <FieldLabel>Occasions</FieldLabel>
                  <div className="flex flex-wrap gap-2">
                    {OCCASIONS.map((o) => (
                      <Badge
                        key={o}
                        variant={occasions.includes(o) ? "default" : "outline"}
                        className="cursor-pointer capitalize"
                        onClick={() => !isLoading && toggleOccasion(o)}
                      >
                        {o}
                      </Badge>
                    ))}
                  </div>
                </Field>

                <div className="grid grid-cols-3 gap-3">
                  <Field>
                    <FieldLabel>Material</FieldLabel>
                    <Select value={material} onValueChange={(v) => setMaterial(v as Material)} disabled={isLoading}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {MATERIALS.map((m) => (
                          <SelectItem key={m} value={m} className="capitalize">{m}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field>
                    <FieldLabel>Fit</FieldLabel>
                    <Select value={fit} onValueChange={(v) => setFit(v as Fit)} disabled={isLoading}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {FITS.map((f) => (
                          <SelectItem key={f} value={f} className="capitalize">{f}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field>
                    <FieldLabel>Pattern</FieldLabel>
                    <Select value={pattern} onValueChange={(v) => setPattern(v as Pattern)} disabled={isLoading}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {PATTERNS.map((p) => (
                          <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                </div>
              </FieldGroup>
            </form>
          </div>

          {/* Footer — always visible */}
          <div style={{ flexShrink: 0, borderTop: "1px solid var(--border)", padding: "1rem 1.5rem", display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" form="edit-form" disabled={isLoading}>
              {isLoading ? <Spinner className="mr-2" /> : null}
              Save Changes
            </Button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}