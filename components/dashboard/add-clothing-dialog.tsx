"use client"

import { useState, useCallback } from "react"
import Image from "next/image"
import { useDropzone } from "react-dropzone"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import { UploadIcon, XIcon } from "lucide-react"
import { toast } from "sonner"
import {
  CLOTHING_TYPES,
  COLORS,
  SEASONS,
  OCCASIONS,
  ClothingType,
  Color,
  Season,
  Occasion,
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
  // FIX #3 & #4: store the pathname from the first upload so we don't re-upload on submit
  const [uploadedPathname, setUploadedPathname] = useState<string | null>(null)
  const [name, setName] = useState("")
  const [type, setType] = useState<ClothingType>("top")
  const [color, setColor] = useState<Color>("black")
  const [seasons, setSeasons] = useState<Season[]>(["all"])
  const [occasions, setOccasions] = useState<Occasion[]>(["casual"])


const analyzeClothing = async (file: File) => {
  try {
    setIsAnalyzing(true)
    const formData = new FormData()
    formData.append("file", file)
    const res = await fetch("/api/analyze-clothing", {
      method: "POST",
      body: formData,           // no Content-Type header — browser sets it with boundary
    })
    if (!res.ok) {
      console.error("AI clothing analysis failed")
      return
    }
    const data = await res.json()
    if (data.name) setName(data.name)        // new — autofill name
    if (data.type) setType(data.type)
    if (data.color) setColor(data.color)
    if (Array.isArray(data.seasons) && data.seasons.length > 0) setSeasons(data.seasons)
    if (Array.isArray(data.occasions) && data.occasions.length > 0) setOccasions(data.occasions)
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
      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })
      if (!uploadRes.ok) throw new Error("Upload failed")

      const { pathname } = await uploadRes.json()
      // FIX #3 & #4: save pathname so submit can reuse it
      setUploadedPathname(pathname)

      await analyzeClothing(file)
    } catch (err) {
      console.error("Upload or AI analysis failed", err)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/jpeg": [],
      "image/png": [],
      "image/webp": [],
    },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024,
  })

  const toggleSeason = (season: Season) => {
    if (season === "all") {
      setSeasons(["all"])
    } else {
      const newSeasons = seasons.includes(season)
        ? seasons.filter((s) => s !== season)
        : [...seasons.filter((s) => s !== "all"), season]
      setSeasons(newSeasons.length > 0 ? newSeasons : ["all"])
    }
  }

  const toggleOccasion = (occasion: Occasion) => {
    const newOccasions = occasions.includes(occasion)
      ? occasions.filter((o) => o !== occasion)
      : [...occasions, occasion]
    setOccasions(newOccasions.length > 0 ? newOccasions : ["casual"])
  }

  const resetForm = () => {
    setPreview(null)
    setFile(null)
    setUploadedPathname(null) // FIX #5: clear saved pathname on reset
    setName("")
    setType("top")
    setColor("black")
    setSeasons(["all"])
    setOccasions(["casual"])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!file) {
      toast.error("Please upload an image")
      return
    }
    if (!name.trim()) {
      toast.error("Please enter a name")
      return
    }

    setIsLoading(true)

    try {
      // FIX #3 & #4: reuse the already-uploaded pathname; only upload again if missing
      let pathname = uploadedPathname
      if (!pathname) {
        const formData = new FormData()
        formData.append("file", file)
        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        })
        if (!uploadRes.ok) {
          const error = await uploadRes.json()
          throw new Error(error.error || "Upload failed")
        }
        const data = await uploadRes.json()
        pathname = data.pathname
      }

      const clothingRes = await fetch("/api/clothes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          type,
          color,
          seasons,
          occasions,
          imagePath: pathname,
        }),
      })

      if (!clothingRes.ok) {
        const error = await clothingRes.json()
        throw new Error(error.error || "Failed to save item")
      }

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

  // FIX #1 & #2: single return with <Dialog> and <DialogContent> wrapping everything
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-serif">Add Clothing Item</DialogTitle>
          <DialogDescription>
            Upload a photo and tag your clothing item
          </DialogDescription>
        </DialogHeader>

        {isAnalyzing && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Spinner className="h-4 w-4" />
            AI analyzing clothing...
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div
            {...getRootProps()}
            className={`
              relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
              transition-colors
              ${isDragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}
              ${preview ? "p-2" : ""}
            `}
          >
            <input {...getInputProps()} />
            {preview ? (
              <div className="relative aspect-square w-full max-w-[200px] mx-auto">
                <Image src={preview} alt="Preview" fill className="object-cover rounded-lg" />
                <Button
                  type="button"
                  size="icon"
                  variant="destructive"
                  className="absolute -top-2 -right-2 h-6 w-6"
                  onClick={(e) => {
                    e.stopPropagation()
                    setPreview(null)
                    setFile(null)
                    setUploadedPathname(null) // also clear pathname when removing image
                  }}
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
              <Input
                id="name"
                placeholder="Blue Oxford Shirt"
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
          </FieldGroup>

          <div className="flex gap-3 justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || isAnalyzing || !file}>
              {isLoading ? <Spinner className="mr-2" /> : null}
              Add to Wardrobe
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}