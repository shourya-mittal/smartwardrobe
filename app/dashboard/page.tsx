"use client"

import { useState } from "react"
import Link from "next/link"
import useSWR from "swr"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { WeatherWidget } from "@/components/dashboard/weather-widget"
import { ClothingCard } from "@/components/dashboard/clothing-card"
import { AddClothingDialog } from "@/components/dashboard/add-clothing-dialog"
import { DailyOutfitWidget } from "@/components/dashboard/daily-outfit-widget"
import { PlusIcon, SparklesIcon, ShirtIcon, ArrowRightIcon } from "lucide-react"
import { ClothingItem, WeatherData } from "@/lib/types"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function DashboardPage() {
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const { data: clothes, isLoading, mutate } = useSWR<ClothingItem[]>(
    "/api/clothes",
    fetcher
  )

  const recentClothes = clothes?.slice(0, 4) || []
  const totalItems = clothes?.length || 0

  const stats = [
    { label: "Total Items", value: totalItems, icon: ShirtIcon },
    { label: "Tops", value: clothes?.filter((c) => c.type === "top").length || 0 },
    { label: "Bottoms", value: clothes?.filter((c) => c.type === "bottom").length || 0 },
    { label: "Outerwear", value: clothes?.filter((c) => c.type === "outerwear").length || 0 },
  ]

  return (
    <>
      <header className="flex h-14 items-center gap-4 border-b bg-background px-6">
        <SidebarTrigger />
        <Separator orientation="vertical" className="h-6" />
        <div className="flex-1">
          <h1 className="font-serif text-lg font-semibold">Dashboard</h1>
        </div>
        <Button onClick={() => setAddDialogOpen(true)}>
          <PlusIcon className="h-4 w-4 mr-2" />
          Add Clothing
        </Button>
      </header>

      <div className="p-6 space-y-6">
        {/* Welcome & Weather */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="md:col-span-2 lg:col-span-2">
            <CardHeader>
              <CardTitle className="font-serif text-2xl">
                Welcome to SmartWardrobe
              </CardTitle>
              <CardDescription>
                Your AI-powered outfit planning assistant. Upload your clothes, and let AI suggest
                the perfect outfit based on weather and occasion.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/dashboard/suggest">
                <Button size="lg" className="gap-2">
                  <SparklesIcon className="h-4 w-4" />
                  Get Outfit Suggestion
                </Button>
              </Link>
            </CardContent>
          </Card>
          <WeatherWidget onWeatherLoad={setWeather} />
        </div>

        {/* Daily Outfit Planner */}
        <div className="grid gap-6">
          <DailyOutfitWidget weather={weather} />
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-3xl font-bold">{stat.value}</p>
                  </div>
                  {stat.icon && (
                    <stat.icon className="h-8 w-8 text-muted-foreground/50" />
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent Items */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Items</CardTitle>
              <CardDescription>Your latest additions to the wardrobe</CardDescription>
            </div>
            <Link href="/dashboard/wardrobe">
              <Button variant="ghost" size="sm" className="gap-1">
                View all
                <ArrowRightIcon className="h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="aspect-square rounded-lg" />
                ))}
              </div>
            ) : recentClothes.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {recentClothes.map((item) => (
                  <ClothingCard
                    key={String(item.id)}
                    item={item}
                    onDelete={() => mutate()}
                    onEdit={() => mutate()}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <ShirtIcon className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground mb-4">
                  Your wardrobe is empty. Start by adding some clothes!
                </p>
                <Button onClick={() => setAddDialogOpen(true)}>
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Add Your First Item
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <AddClothingDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onSuccess={() => mutate()}
      />
    </>
  )
}