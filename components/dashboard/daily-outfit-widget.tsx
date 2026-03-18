"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import useSWR from "swr"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { SparklesIcon, RefreshCwIcon, CheckIcon, ShirtIcon } from "lucide-react"
import { toast } from "sonner"
import { WeatherData } from "@/lib/types"

interface DailySuggestionItem {
  id: number
  name: string
  type: string
  color: string
  image_pathname: string
}

interface DailySuggestion {
  id: number
  outfit_title: string
  reasoning: string
  confidence: number
  additional_items: string[]
  items: DailySuggestionItem[]
  date: string
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

function getWeatherUrl(weather: WeatherData | null) {
  if (!weather) return "/api/daily-suggestion"
  return `/api/daily-suggestion?weather=${encodeURIComponent(JSON.stringify(weather))}`
}

interface DailyOutfitWidgetProps {
  weather?: WeatherData | null
}

export function DailyOutfitWidget({ weather = null }: DailyOutfitWidgetProps) {
  const [url, setUrl] = useState<string | null>(null)
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [isLoggingWear, setIsLoggingWear] = useState(false)
  const [wornToday, setWornToday] = useState(false)

  // Wait until weather is resolved before fetching (avoids double fetch)
  useEffect(() => {
    setUrl(getWeatherUrl(weather ?? null))
  }, [weather])

  const { data: suggestion, isLoading, error, mutate } = useSWR<DailySuggestion>(
    url,
    fetcher,
    { revalidateOnFocus: false }
  )

  const handleRegenerate = async () => {
    setIsRegenerating(true)
    try {
      // Delete today's cached suggestion then re-fetch
      await fetch("/api/daily-suggestion", { method: "DELETE" })
      await mutate(undefined, { revalidate: true })
      setWornToday(false)
      toast.success("New outfit suggestion generated!")
    } catch {
      toast.error("Failed to regenerate suggestion")
    } finally {
      setIsRegenerating(false)
    }
  }

  const handleWoreIt = async () => {
    if (!suggestion) return
    setIsLoggingWear(true)
    try {
      const itemIds = suggestion.items.map((i) => i.id)
      await fetch("/api/outfits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: itemIds,
          occasion: "casual",
          weather: weather,
          aiGenerated: true,
        }),
      })
      setWornToday(true)
      toast.success("Outfit logged to your history!")
    } catch {
      toast.error("Failed to log outfit")
    } finally {
      setIsLoggingWear(false)
    }
  }

  if (!url || isLoading) {
    return (
      <Card className="col-span-full">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <SparklesIcon className="h-5 w-5 text-primary" />
            <CardTitle className="font-serif text-lg">Today's Outfit</CardTitle>
          </div>
          <CardDescription>Your AI-picked outfit for the day</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-28 w-24 rounded-xl flex-shrink-0" />
            ))}
            <div className="flex-1 space-y-3 py-1">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error || !suggestion || "error" in suggestion) {
    const msg = (suggestion as any)?.error
    return (
      <Card className="col-span-full">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <SparklesIcon className="h-5 w-5 text-primary" />
            <CardTitle className="font-serif text-lg">Today's Outfit</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 text-muted-foreground py-4">
            <ShirtIcon className="h-8 w-8 flex-shrink-0 opacity-40" />
            <p className="text-sm">
              {msg === "No clothes in wardrobe"
                ? "Add some clothes to your wardrobe to get daily outfit suggestions."
                : "Couldn't generate today's suggestion. Try again later."}
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const additionalItems: string[] = Array.isArray(suggestion.additional_items)
    ? suggestion.additional_items
    : typeof suggestion.additional_items === "string"
    ? JSON.parse(suggestion.additional_items)
    : []

  return (
    <Card className="col-span-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SparklesIcon className="h-5 w-5 text-primary" />
            <CardTitle className="font-serif text-lg">Today's Outfit</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {suggestion.confidence}% match
            </Badge>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleRegenerate}
              disabled={isRegenerating}
              title="Regenerate"
            >
              <RefreshCwIcon className={`h-4 w-4 ${isRegenerating ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>
        <CardDescription>
          <span className="font-medium text-foreground">{suggestion.outfit_title}</span>
          {" · "}
          {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Outfit items */}
        <div className="flex gap-3 overflow-x-auto pb-1">
          {suggestion.items.map((item) => (
            <div key={item.id} className="flex-shrink-0 text-center space-y-1 w-24">
              <div className="relative h-28 w-24 rounded-xl overflow-hidden bg-muted">
                {item.image_pathname ? (
                  <Image
                    src={`/api/file?pathname=${encodeURIComponent(item.image_pathname)}`}
                    alt={item.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center">
                    <ShirtIcon className="h-8 w-8 text-muted-foreground/40" />
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground truncate px-1">{item.name}</p>
              <Badge variant="outline" className="text-[10px] capitalize px-1.5 py-0">
                {item.type}
              </Badge>
            </div>
          ))}

          {/* Additional suggested items (not in wardrobe) */}
          {additionalItems.map((item, i) => (
            <div key={`add-${i}`} className="flex-shrink-0 text-center space-y-1 w-24">
              <div className="h-28 w-24 rounded-xl border-2 border-dashed border-border flex items-center justify-center bg-muted/30">
                <ShirtIcon className="h-6 w-6 text-muted-foreground/40" />
              </div>
              <p className="text-xs text-muted-foreground truncate px-1 capitalize">{item}</p>
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-muted-foreground">
                suggested
              </Badge>
            </div>
          ))}
        </div>

        {/* Reasoning */}
        <p className="text-sm text-muted-foreground leading-relaxed">
          {suggestion.reasoning}
        </p>

        {/* Action */}
        <div className="flex justify-end">
          <Button
            size="sm"
            variant={wornToday ? "outline" : "default"}
            onClick={handleWoreIt}
            disabled={isLoggingWear || wornToday}
            className="gap-2"
          >
            {wornToday ? (
              <>
                <CheckIcon className="h-4 w-4" />
                Logged!
              </>
            ) : (
              <>
                <CheckIcon className="h-4 w-4" />
                {isLoggingWear ? "Logging..." : "I Wore This"}
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}