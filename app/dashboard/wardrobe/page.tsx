"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import useSWR from "swr"
import { Button } from "@/components/ui/button"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Empty } from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"
import { ClothingCard } from "@/components/dashboard/clothing-card"
import { AddClothingDialog } from "@/components/dashboard/add-clothing-dialog"
import { PlusIcon, ShirtIcon } from "lucide-react"
import { ClothingItem, CLOTHING_TYPES } from "@/lib/types"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function WardrobePage() {
  const searchParams = useSearchParams()
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("all")
  const { data: clothes, isLoading, mutate } = useSWR<ClothingItem[]>(
    "/api/clothes",
    fetcher
  )

  // Open add dialog if coming from quick action
  useEffect(() => {
    if (searchParams.get("add") === "true") {
      setAddDialogOpen(true)
    }
  }, [searchParams])

  const filteredClothes =
    activeTab === "all"
      ? clothes
      : clothes?.filter((item) => item.type === activeTab)

  const handleDelete = () => {
    mutate()
  }

  return (
    <>
      <header className="flex h-14 items-center gap-4 border-b bg-background px-6">
        <SidebarTrigger />
        <Separator orientation="vertical" className="h-6" />
        <div className="flex-1">
          <h1 className="font-serif text-lg font-semibold">My Wardrobe</h1>
        </div>
        <Button onClick={() => setAddDialogOpen(true)}>
          <PlusIcon className="h-4 w-4 mr-2" />
          Add Clothing
        </Button>
      </header>

      <div className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="all">
              All ({clothes?.length || 0})
            </TabsTrigger>
            {CLOTHING_TYPES.map((type) => {
              const count = clothes?.filter((c) => c.type === type).length || 0
              return (
                <TabsTrigger key={type} value={type} className="capitalize">
                  {type} ({count})
                </TabsTrigger>
              )
            })}
          </TabsList>

          <TabsContent value={activeTab} className="mt-0">
            {isLoading ? (
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {[...Array(10)].map((_, i) => (
                  <Skeleton key={i} className="aspect-square rounded-lg" />
                ))}
              </div>
            ) : filteredClothes && filteredClothes.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {filteredClothes.map((item) => (
                  <ClothingCard
                    key={String(item.id)}
                    item={item}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            ) : (
              <Empty
                icon={ShirtIcon}
                title={activeTab === "all" ? "Your wardrobe is empty" : `No ${activeTab} items`}
                description={
                  activeTab === "all"
                    ? "Start by adding some clothes to your wardrobe"
                    : `Add some ${activeTab} items to see them here`
                }
                action={
                  <Button onClick={() => setAddDialogOpen(true)}>
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Add Item
                  </Button>
                }
              />
            )}
          </TabsContent>
        </Tabs>
      </div>

      <AddClothingDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onSuccess={() => mutate()}
      />
    </>
  )
}
