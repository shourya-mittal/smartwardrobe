"use client"

import Image from "next/image"
import useSWR from "swr"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Empty } from "@/components/ui/empty"
import { ClockIcon, SparklesIcon, CloudIcon } from "lucide-react"
import { Outfit } from "@/lib/types"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  })
}

export default function HistoryPage() {
  const { data: outfits, isLoading: outfitsLoading } = useSWR<Outfit[]>(
    "/api/outfits?limit=20",
    fetcher
  )
  const isLoading = outfitsLoading

  return (
    <>
      <header className="flex h-14 items-center gap-4 border-b bg-background px-6">
        <SidebarTrigger />
        <Separator orientation="vertical" className="h-6" />
        <div className="flex-1">
          <h1 className="font-serif text-lg font-semibold">Outfit History</h1>
        </div>
      </header>

      <div className="p-6">
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Card key={i}>
                <CardContent className="pt-6">
                  <div className="flex gap-4">
                    <div className="flex gap-2">
                      <Skeleton className="h-16 w-16 rounded-lg" />
                      <Skeleton className="h-16 w-16 rounded-lg" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-48" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : outfits && outfits.length > 0 ? (
          <div className="space-y-4">
            {outfits.map((outfit) => {
              const items = outfit.items ?? []

              return (
                <Card key={String(outfit.id)}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-base">
                          {formatDate(outfit.worn_at)}
                        </CardTitle>
                        {outfit.ai_generated && (
                          <Badge variant="secondary" className="gap-1">
                            <SparklesIcon className="h-3 w-3" />
                            AI
                          </Badge>
                        )}
                      </div>
                      <Badge variant="outline" className="capitalize">
                        {outfit.occasion}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-4">
                      <div className="flex flex-wrap gap-2">
                        {items.map((item) => (
                          <div
                            key={String(item.id)}
                            className="relative h-16 w-16 rounded-lg overflow-hidden bg-muted"
                          >
                            <Image
                              src={`/api/file?pathname=${encodeURIComponent(item.image_pathname)}`}
                              alt={item.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                        ))}
                      </div>
                      <div className="flex-1">
                        <div className="flex flex-wrap gap-1 mb-2">
                          {items.map((item) => (
                            <Badge
                              key={String(item.id)}
                              variant="outline"
                              className="text-xs"
                            >
                              {item.name}
                            </Badge>
                          ))}
                        </div>
                        {outfit.weather && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <CloudIcon className="h-4 w-4" />
                            <span>
                              {outfit.weather.temp}°F, {outfit.weather.description}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        ) : (
          <Empty
            icon={ClockIcon}
            title="No outfit history"
            description="Your worn outfits will appear here. Get a suggestion and mark it as worn to start tracking."
          />
        )}
      </div>
    </>
  )
}
