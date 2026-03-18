"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldLabel, FieldGroup } from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "sonner"
import { PencilIcon, CheckIcon, XIcon } from "lucide-react"

export default function SettingsPage() {
  const { data: session, update } = useSession()

  const [editingName, setEditingName] = useState(false)
  const [name, setName] = useState("")
  const [isSavingName, setIsSavingName] = useState(false)

  const [editingPassword, setEditingPassword] = useState(false)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isSavingPassword, setIsSavingPassword] = useState(false)

  const startEditingName = () => {
    setName(session?.user?.name ?? "")
    setEditingName(true)
  }

  const cancelEditingName = () => {
    setEditingName(false)
    setName("")
  }

  const handleSaveName = async () => {
    if (!name.trim()) { toast.error("Name cannot be empty"); return }
    setIsSavingName(true)
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to update name")
      await update({ name: name.trim() })
      toast.success("Name updated!")
      setEditingName(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong")
    } finally {
      setIsSavingName(false)
    }
  }

  const handleSavePassword = async () => {
    if (!currentPassword) { toast.error("Enter your current password"); return }
    if (newPassword.length < 6) { toast.error("New password must be at least 6 characters"); return }
    if (newPassword !== confirmPassword) { toast.error("Passwords do not match"); return }
    setIsSavingPassword(true)
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to update password")
      toast.success("Password updated!")
      setEditingPassword(false)
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong")
    } finally {
      setIsSavingPassword(false)
    }
  }

  const cancelEditingPassword = () => {
    setEditingPassword(false)
    setCurrentPassword("")
    setNewPassword("")
    setConfirmPassword("")
  }

  return (
    <>
      <header className="flex h-14 items-center gap-4 border-b bg-background px-6">
        <SidebarTrigger />
        <Separator orientation="vertical" className="h-6" />
        <div className="flex-1">
          <h1 className="font-serif text-lg font-semibold">Settings</h1>
        </div>
      </header>

      <div className="p-6 space-y-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Manage your account details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 flex-shrink-0">
                <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                  {session?.user?.name?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                {editingName ? (
                  <div className="flex items-center gap-2">
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={isSavingName}
                      className="h-8"
                      autoFocus
                      onKeyDown={(e) => { if (e.key === "Enter") handleSaveName(); if (e.key === "Escape") cancelEditingName() }}
                    />
                    <Button size="icon" variant="ghost" className="h-8 w-8 flex-shrink-0" onClick={handleSaveName} disabled={isSavingName}>
                      {isSavingName ? <Spinner className="h-3 w-3" /> : <CheckIcon className="h-4 w-4 text-green-600" />}
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 flex-shrink-0" onClick={cancelEditingName} disabled={isSavingName}>
                      <XIcon className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-lg truncate">{session?.user?.name}</p>
                    <Button size="icon" variant="ghost" className="h-7 w-7 flex-shrink-0" onClick={startEditingName}>
                      <PencilIcon className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
                <p className="text-muted-foreground text-sm truncate">{session?.user?.email}</p>
              </div>
            </div>

            <Separator />

            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="font-medium text-sm">Password</p>
                  <p className="text-muted-foreground text-xs mt-0.5">Update your account password</p>
                </div>
                {!editingPassword && (
                  <Button variant="outline" size="sm" onClick={() => setEditingPassword(true)}>
                    Change Password
                  </Button>
                )}
              </div>

              {editingPassword && (
                <FieldGroup>
                  <Field>
                    <FieldLabel>Current Password</FieldLabel>
                    <Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} disabled={isSavingPassword} placeholder="Enter current password" />
                  </Field>
                  <Field>
                    <FieldLabel>New Password</FieldLabel>
                    <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} disabled={isSavingPassword} placeholder="At least 6 characters" />
                  </Field>
                  <Field>
                    <FieldLabel>Confirm New Password</FieldLabel>
                    <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} disabled={isSavingPassword} placeholder="Repeat new password" onKeyDown={(e) => { if (e.key === "Enter") handleSavePassword() }} />
                  </Field>
                  <div className="flex gap-2 pt-1">
                    <Button onClick={handleSavePassword} disabled={isSavingPassword} size="sm">
                      {isSavingPassword ? <Spinner className="mr-2 h-3 w-3" /> : null}
                      Save Password
                    </Button>
                    <Button variant="outline" size="sm" onClick={cancelEditingPassword} disabled={isSavingPassword}>Cancel</Button>
                  </div>
                </FieldGroup>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>About SmartWardrobe</CardTitle>
            <CardDescription>AI-powered outfit planning</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              SmartWardrobe uses artificial intelligence to help you plan the perfect outfit
              based on weather conditions, occasion, and your personal wardrobe. Upload photos
              of your clothes, tag them appropriately, and let the AI do the rest.
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Version</span>
                <span>1.0.0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Weather Data</span>
                <span>OpenWeatherMap</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">AI Model</span>
                <span>Llama 4 Scout (Groq)</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}