"use client"

import { useState } from "react"
import Image from "next/image"
import useSWR from "swr"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { Empty } from "@/components/ui/empty"
import { WeatherWidget } from "@/components/dashboard/weather-widget"
import { SparklesIcon, CheckIcon, ShirtIcon } from "lucide-react"
import { toast } from "sonner"
import { WeatherData, Occasion, OCCASIONS, ClothingItem } from "@/lib/types"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface OutfitSuggestion {
  items: {
    id: string
    name: string
    type: string
    color: string
    imagePath: string
  }[]
  additionalItems: string[]
  reasoning: string
  confidence: number
}

export default function SuggestPage() {
  const [occasion, setOccasion] = useState<Occasion>("casual")
  const [suggestions, setSuggestions] = useState<OutfitSuggestion[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [selectedOutfit, setSelectedOutfit] = useState<number | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  // Both WeatherWidget and this page use the same SWR key — zero duplicate requests
  const { data: weather } = useSWR<WeatherData>("/api/weather", fetcher)
  const { data: clothes } = useSWR<ClothingItem[]>("/api/clothes", fetcher)

  const handleGenerate = async () => {
    if (!weather) {
      toast.error("Weather data not available")
      return
    }

    if (!clothes || clothes.length < 2) {
      toast.error("You need at least 2 items in your wardrobe")
      return
    }

    setIsGenerating(true)
    setSuggestions([])
    setSelectedOutfit(null)

    try {
      const res = await fetch("/api/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weather, occasion }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Failed to generate suggestions")
      }

      const data = await res.json()
      setSuggestions(data.suggestions)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong")
    } finally {
      setIsGenerating(false)
    }
  }

  const handleWearOutfit = async () => {
    if (selectedOutfit === null || !weather) return

    const outfit = suggestions[selectedOutfit]
    if (!outfit) return

    setIsSaving(true)

    try {
      const res = await fetch("/api/outfits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: outfit.items.map((i) => i.id),
          occasion,
          weather,
          aiGenerated: true,
        }),
      })

      if (!res.ok) {
        throw new Error("Failed to save outfit")
      }

      toast.success("Outfit saved to your history!")
      setSelectedOutfit(null)
    } catch {
      toast.error("Failed to save outfit")
    } finally {
      setIsSaving(false)
    }
  }

  const hasEnoughClothes = clothes && clothes.length >= 2

  return (
    <>
      <header className="flex h-14 items-center gap-4 border-b bg-background px-6">
        <SidebarTrigger />
        <Separator orientation="vertical" className="h-6" />
        <div className="flex-1">
          <h1 className="font-serif text-lg font-semibold">Get Outfit Suggestion</h1>
        </div>
      </header>

      <div className="p-6 space-y-6">
        {/* Controls */}
        <div className="grid gap-6 md:grid-cols-3">
          <WeatherWidget />

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Occasion</CardTitle>
            </CardHeader>
            <div className="px-6 pb-6">
              <Select value={occasion} onValueChange={(v) => setOccasion(v as Occasion)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {OCCASIONS.map((o) => (
                    <SelectItem key={o} value={o} className="capitalize">
                      {o}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Generate</CardTitle>
            </CardHeader>
            <div className="px-6 pb-6">
              <Button
                onClick={handleGenerate}
                disabled={isGenerating || !weather || !hasEnoughClothes}
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <Spinner className="mr-2" />
                    Generating...
                  </>
                ) : (
                  <>
                    <SparklesIcon className="h-4 w-4 mr-2" />
                    Get Suggestions
                  </>
                )}
              </Button>
              {!hasEnoughClothes && (
                <p className="text-xs text-muted-foreground mt-2">
                  Add at least 2 items to your wardrobe
                </p>
              )}
            </div>
          </Card>
        </div>

        {/* Suggestions */}
        {isGenerating ? (
          <div className="grid gap-6 md:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardContent className="pt-6">
                  <div className="flex gap-2 mb-4">
                    <Skeleton className="h-24 w-24 rounded-lg" />
                    <Skeleton className="h-24 w-24 rounded-lg" />
                  </div>
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-3/4" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : suggestions.length > 0 ? (
          <>
            <div className="grid gap-6 md:grid-cols-3">
              {suggestions.map((outfit, index) => (
                <Card
                  key={index}
                  className={`cursor-pointer transition-all ${
                    selectedOutfit === index
                      ? "ring-2 ring-primary"
                      : "hover:shadow-md"
                  }`}
                  onClick={() => setSelectedOutfit(index)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">Outfit {index + 1}</CardTitle>
                      <Badge variant="secondary">{outfit.confidence}% match</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* Wardrobe item images */}
                    <div className="flex flex-wrap gap-2 mb-3">
                      {outfit.items.map((item) => (
                        <div
                          key={item.id}
                          className="relative h-20 w-20 rounded-lg overflow-hidden bg-muted"
                        >
                          <Image
                            src={`/api/file?pathname=${encodeURIComponent(item.imagePath)}`}
                            alt={item.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ))}
                    </div>

                    {/* Wardrobe item name badges */}
                    <div className="flex flex-wrap gap-1 mb-3">
                      {outfit.items.map((item) => (
                        <Badge key={item.id} variant="outline" className="text-xs">
                          {item.name}
                        </Badge>
                      ))}
                    </div>

                    {/* AI reasoning */}
                    {outfit.reasoning && (
                      <p className="text-sm text-muted-foreground mb-3">
                        {outfit.reasoning}
                      </p>
                    )}

                    {/* Additional items suggestions — only shown when wardrobe is small */}
                    {outfit.additionalItems.length > 0 && (
                      <div className="border-t pt-3 mt-1">
                        <p className="text-xs font-medium text-muted-foreground mb-2">
                          Complete this outfit with:
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {outfit.additionalItems.map((item, i) => (
                            <Badge
                              key={i}
                              variant="secondary"
                              className="text-xs capitalize"
                            >
                              + {item}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {selectedOutfit !== null && (
              <div className="flex justify-center">
                <Button
                  size="lg"
                  onClick={handleWearOutfit}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <Spinner className="mr-2" />
                  ) : (
                    <CheckIcon className="h-4 w-4 mr-2" />
                  )}
                  Wear This Outfit
                </Button>
              </div>
            )}
          </>
        ) : (
          <Empty
            icon={ShirtIcon}
            title="No suggestions yet"
            description="Select an occasion and click Generate to get AI-powered outfit suggestions based on the current weather"
          />
        )}
      </div>
    </>
  )
}