"use client"

import { useEffect, useState } from "react"
import useSWR from "swr"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { CloudIcon, SunIcon, CloudRainIcon, CloudSnowIcon, WindIcon } from "lucide-react"
import { WeatherData } from "@/lib/types"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

function getWeatherIcon(icon: string) {
  if (icon.includes("01") || icon.includes("02")) {
    return <SunIcon className="h-10 w-10 text-yellow-500" />
  }
  if (icon.includes("09") || icon.includes("10")) {
    return <CloudRainIcon className="h-10 w-10 text-blue-400" />
  }
  if (icon.includes("13")) {
    return <CloudSnowIcon className="h-10 w-10 text-blue-200" />
  }
  if (icon.includes("50")) {
    return <WindIcon className="h-10 w-10 text-gray-400" />
  }
  return <CloudIcon className="h-10 w-10 text-gray-400" />
}

export function WeatherWidget({ onWeatherLoad }: { onWeatherLoad?: (w: WeatherData) => void }) {
  const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null)

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          })
        },
        () => {
          // Fallback to default city
          setLocation(null)
        }
      )
    }
  }, [])

  const url = location
    ? `/api/weather?lat=${location.lat}&lon=${location.lon}`
    : "/api/weather"

  const { data: weather, isLoading, error } = useSWR<WeatherData>(url, fetcher, {
    refreshInterval: 600000,
    onSuccess: (data) => onWeatherLoad?.(data),
  })

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Current Weather</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error || !weather) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Current Weather</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Unable to load weather data
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Current Weather</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          {getWeatherIcon(weather.icon)}
          <div>
            <p className="text-3xl font-bold">{weather.temp}°F</p>
            <p className="text-sm text-muted-foreground capitalize">
              {weather.description}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Feels like {weather.feelsLike}°F in {weather.location}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
