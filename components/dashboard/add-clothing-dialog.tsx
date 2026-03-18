"use client"

import { useState, useCallback } from "react"
import Image from "next/image"
import { useDropzone } from "react-dropzone"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { XIcon, UploadIcon } from "lucide-react"
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
} from "@/lib/types"

interface AddClothingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function AddClothingDialog({
  open,
  onOpenChange,
  onSuccess,
}: AddClothingDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [uploadedPathname, setUploadedPathname] = useState<string | null>(null)
  const [name, setName] = useState("")
  const [type, setType] = useState<ClothingType>("top")
  const [color, setColor] = useState<Color>("black")
  const [seasons, setSeasons] = useState<Season[]>(["all"])
  const [occasions, setOccasions] = useState<Occasion[]>(["casual"])
  const [material, setMaterial] = useState<Material>("cotton")
  const [fit, setFit] = useState<Fit>("regular")
  const [pattern, setPattern] = useState<Pattern>("solid")

  const analyzeClothing = async (file: File) => {
    try {
      setIsAnalyzing(true)
      const formData = new FormData()
      formData.append("file", file)
      const res = await fetch("/api/analyze-clothing", { method: "POST", body: formData })
      if (!res.ok) return
      const data = await res.json()
      if (data.name) setName(data.name)
      if (data.type) setType(data.type)
      if (data.color) setColor(data.color)
      if (Array.isArray(data.seasons) && data.seasons.length > 0) setSeasons(data.seasons)
      if (Array.isArray(data.occasions) && data.occasions.length > 0) setOccasions(data.occasions)
      if (data.material) setMaterial(data.material)
      if (data.fit) setFit(data.fit)
      if (data.pattern) setPattern(data.pattern)
    } catch (err) {
      console.error("Error analyzing clothing", err)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return
    setFile(file)
    const reader = new FileReader()
    reader.onload = () => setPreview(reader.result as string)
    reader.readAsDataURL(file)
    try {
      const formData = new FormData()
      formData.append("file", file)
      const uploadRes = await fetch("/api/upload", { method: "POST", body: formData })
      if (!uploadRes.ok) throw new Error("Upload failed")
      const { pathname } = await uploadRes.json()
      setUploadedPathname(pathname)
      await analyzeClothing(file)
    } catch (err) {
      console.error("Upload or AI analysis failed", err)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/jpeg": [], "image/png": [], "image/webp": [] },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024,
  })

  const toggleSeason = (season: Season) => {
    if (season === "all") { setSeasons(["all"]); return }
    const next = seasons.includes(season)
      ? seasons.filter((s) => s !== season)
      : [...seasons.filter((s) => s !== "all"), season]
    setSeasons(next.length > 0 ? next : ["all"])
  }

  const toggleOccasion = (occasion: Occasion) => {
    const next = occasions.includes(occasion)
      ? occasions.filter((o) => o !== occasion)
      : [...occasions, occasion]
    setOccasions(next.length > 0 ? next : ["casual"])
  }

  const resetForm = () => {
    setPreview(null); setFile(null); setUploadedPathname(null)
    setName(""); setType("top"); setColor("black")
    setSeasons(["all"]); setOccasions(["casual"])
    setMaterial("cotton"); setFit("regular"); setPattern("solid")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) { toast.error("Please upload an image"); return }
    if (!name.trim()) { toast.error("Please enter a name"); return }
    setIsLoading(true)
    try {
      let pathname = uploadedPathname
      if (!pathname) {
        const formData = new FormData()
        formData.append("file", file)
        const uploadRes = await fetch("/api/upload", { method: "POST", body: formData })
        if (!uploadRes.ok) { const err = await uploadRes.json(); throw new Error(err.error || "Upload failed") }
        const data = await uploadRes.json()
        pathname = data.pathname
      }
      const clothingRes = await fetch("/api/clothes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), type, color, seasons, occasions, material, fit, pattern, imagePath: pathname }),
      })
      if (!clothingRes.ok) { const err = await clothingRes.json(); throw new Error(err.error || "Failed to save item") }
      toast.success("Item added to your wardrobe!")
      resetForm()
      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        {/* Overlay */}
        <DialogPrimitive.Overlay
          style={{
            position: "fixed", inset: 0, zIndex: 50,
            backgroundColor: "rgba(0,0,0,0.5)",
          }}
        />

        {/* Content */}
        <DialogPrimitive.Content
          style={{
            position: "fixed",
            top: "50%", left: "50%",
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
              position: "absolute", top: "1rem", right: "1rem",
              opacity: 0.7, cursor: "pointer",
              background: "none", border: "none", padding: 0, zIndex: 10,
            }}
          >
            <XIcon style={{ width: "1rem", height: "1rem" }} />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>

          {/* Header */}
          <div style={{ padding: "1.5rem 1.5rem 0.75rem", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
            <DialogPrimitive.Title style={{ fontSize: "1.125rem", fontWeight: 600, marginBottom: "0.25rem" }}>
              Add Clothing Item
            </DialogPrimitive.Title>
            <DialogPrimitive.Description style={{ fontSize: "0.875rem", color: "var(--muted-foreground)" }}>
              Upload a photo and tag your clothing item
            </DialogPrimitive.Description>
          </div>

          {/* Scrollable body */}
          <div style={{ overflowY: "auto", flex: 1, padding: "1rem 1.5rem" }}>
            {isAnalyzing && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                <Spinner className="h-4 w-4" />
                AI analyzing clothing...
              </div>
            )}

            <form id="add-form" onSubmit={handleSubmit} className="space-y-6">
              {/* Dropzone */}
              <div
                {...getRootProps()}
                className={`relative border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors
                  ${isDragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}
                  ${preview ? "p-2" : "p-6"}`}
              >
                <input {...getInputProps()} />
                {preview ? (
                  <div className="relative aspect-square w-full max-w-[200px] mx-auto">
                    <Image src={preview} alt="Preview" fill className="object-cover rounded-lg" />
                    <Button
                      type="button" size="icon" variant="destructive"
                      className="absolute -top-2 -right-2 h-6 w-6"
                      onClick={(e) => { e.stopPropagation(); setPreview(null); setFile(null); setUploadedPathname(null) }}
                    >
                      <XIcon className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <UploadIcon className="h-10 w-10 mx-auto text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      {isDragActive ? "Drop the image here" : "Drag & drop or click to upload"}
                    </p>
                    <p className="text-xs text-muted-foreground">JPEG, PNG or WebP, max 5MB</p>
                  </div>
                )}
              </div>

              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="name">Name</FieldLabel>
                  <Input id="name" placeholder="Blue Oxford Shirt" value={name} onChange={(e) => setName(e.target.value)} disabled={isLoading} />
                </Field>

                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel>Type</FieldLabel>
                    <Select value={type} onValueChange={(v) => setType(v as ClothingType)} disabled={isLoading}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{CLOTHING_TYPES.map((t) => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}</SelectContent>
                    </Select>
                  </Field>
                  <Field>
                    <FieldLabel>Color</FieldLabel>
                    <Select value={color} onValueChange={(v) => setColor(v as Color)} disabled={isLoading}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{COLORS.map((c) => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}</SelectContent>
                    </Select>
                  </Field>
                </div>

                <Field>
                  <FieldLabel>Seasons</FieldLabel>
                  <div className="flex flex-wrap gap-2">
                    {SEASONS.map((s) => (
                      <Badge key={s} variant={seasons.includes(s) ? "default" : "outline"} className="cursor-pointer capitalize" onClick={() => !isLoading && toggleSeason(s)}>{s}</Badge>
                    ))}
                  </div>
                </Field>

                <Field>
                  <FieldLabel>Occasions</FieldLabel>
                  <div className="flex flex-wrap gap-2">
                    {OCCASIONS.map((o) => (
                      <Badge key={o} variant={occasions.includes(o) ? "default" : "outline"} className="cursor-pointer capitalize" onClick={() => !isLoading && toggleOccasion(o)}>{o}</Badge>
                    ))}
                  </div>
                </Field>

                <div className="grid grid-cols-3 gap-4">
                  <Field>
                    <FieldLabel>Material</FieldLabel>
                    <Select value={material} onValueChange={(v) => setMaterial(v as Material)} disabled={isLoading}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{MATERIALS.map((m) => <SelectItem key={m} value={m} className="capitalize">{m}</SelectItem>)}</SelectContent>
                    </Select>
                  </Field>
                  <Field>
                    <FieldLabel>Fit</FieldLabel>
                    <Select value={fit} onValueChange={(v) => setFit(v as Fit)} disabled={isLoading}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{FITS.map((f) => <SelectItem key={f} value={f} className="capitalize">{f}</SelectItem>)}</SelectContent>
                    </Select>
                  </Field>
                  <Field>
                    <FieldLabel>Pattern</FieldLabel>
                    <Select value={pattern} onValueChange={(v) => setPattern(v as Pattern)} disabled={isLoading}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{PATTERNS.map((p) => <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>)}</SelectContent>
                    </Select>
                  </Field>
                </div>
              </FieldGroup>
            </form>
          </div>

          {/* Footer — always visible */}
          <div style={{ flexShrink: 0, borderTop: "1px solid var(--border)", padding: "1rem 1.5rem", display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>Cancel</Button>
            <Button type="submit" form="add-form" disabled={isLoading || isAnalyzing || !file}>
              {isLoading ? <Spinner className="mr-2" /> : null}
              Add to Wardrobe
            </Button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}