"use client"

import * as React from "react"
import Cropper, { type Area } from "react-easy-crop"
import { useMutation } from "convex/react"
import { CameraIcon, PencilIcon } from "lucide-react"
import { toast } from "sonner"

import { api } from "@repo/backend/convex/_generated/api"
import { Avatar } from "@repo/ui/components/avatar"
import { Button } from "@repo/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/dialog"
import { cn } from "@repo/ui/lib/utils"

import { profile } from "../_content/fr"

type PhotoUploaderProps = {
  firstName?: string | null
  lastName?: string | null
  currentPhotoUrl?: string | null
  size?: 60 | 72
  className?: string
}

const MAX_SIZE_BYTES = 5 * 1024 * 1024 // 5 Mo
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"]

async function getCroppedBlob(
  imageSrc: string,
  pixelCrop: Area,
): Promise<Blob | null> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.crossOrigin = "anonymous"
    image.onload = () => {
      const canvas = document.createElement("canvas")
      // On contraint à 512px (largement suffisant pour avatar et léger)
      const targetSize = 512
      canvas.width = targetSize
      canvas.height = targetSize
      const ctx = canvas.getContext("2d")
      if (!ctx) {
        resolve(null)
        return
      }
      ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        targetSize,
        targetSize,
      )
      canvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.9)
    }
    image.onerror = () => reject(new Error("Image load failed"))
    image.src = imageSrc
  })
}

export function PhotoUploader({
  firstName,
  lastName,
  currentPhotoUrl,
  size = 72,
  className,
}: PhotoUploaderProps) {
  const [open, setOpen] = React.useState(false)
  const [imageSrc, setImageSrc] = React.useState<string | null>(null)
  const [crop, setCrop] = React.useState({ x: 0, y: 0 })
  const [zoom, setZoom] = React.useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = React.useState<Area | null>(null)
  const [submitting, setSubmitting] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const generateUploadUrl = useMutation(api.profile.generateProfilePhotoUploadUrl)
  const setProfilePhoto = useMutation(api.profile.setProfilePhoto)

  const onPick = () => fileInputRef.current?.click()

  const onFileChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error(profile.editPhoto.invalidType)
      return
    }
    if (file.size > MAX_SIZE_BYTES) {
      toast.error(profile.editPhoto.tooLarge)
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      setImageSrc(reader.result as string)
      setCrop({ x: 0, y: 0 })
      setZoom(1)
      setOpen(true)
    }
    reader.readAsDataURL(file)
    // reset input so the same file can be picked again later
    e.target.value = ""
  }

  const onCropComplete = React.useCallback(
    (_: Area, areaPixels: Area) => setCroppedAreaPixels(areaPixels),
    [],
  )

  const onSave = async () => {
    if (!imageSrc || !croppedAreaPixels) return
    setSubmitting(true)
    try {
      const blob = await getCroppedBlob(imageSrc, croppedAreaPixels)
      if (!blob) throw new Error("Crop failed")
      const uploadUrl = await generateUploadUrl()
      const res = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": blob.type },
        body: blob,
      })
      if (!res.ok) throw new Error("Upload failed")
      const { storageId } = (await res.json()) as { storageId: string }
      await setProfilePhoto({ storageRef: storageId as never })
      toast.success(profile.editPhoto.successToast)
      setOpen(false)
      setImageSrc(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : profile.editPhoto.errorToast)
    } finally {
      setSubmitting(false)
    }
  }

  const onCancel = () => {
    setOpen(false)
    setImageSrc(null)
  }

  return (
    <div className={cn("relative inline-block", className)}>
      <Avatar
        firstName={firstName}
        lastName={lastName}
        src={currentPhotoUrl}
        size={size}
      />
      <button
        type="button"
        onClick={onPick}
        aria-label={profile.editPhoto.aria}
        className="absolute -bottom-1 -right-1 flex size-7 items-center justify-center rounded-full border-2 border-background bg-idn-green text-white shadow-sm transition-colors hover:bg-idn-green-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <PencilIcon className="size-3.5" aria-hidden="true" />
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept={ALLOWED_TYPES.join(",")}
        onChange={onFileChange}
        className="sr-only"
      />

      <Dialog open={open} onOpenChange={(o) => (o ? setOpen(true) : onCancel())}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{profile.editPhoto.cropTitle}</DialogTitle>
            <DialogDescription>{profile.editPhoto.cropHelp}</DialogDescription>
          </DialogHeader>
          {imageSrc && (
            <>
              <div className="relative h-[320px] w-full overflow-hidden rounded-md bg-secondary">
                <Cropper
                  image={imageSrc}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  cropShape="round"
                  showGrid={false}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={onCropComplete}
                />
              </div>
              <div className="flex items-center gap-3">
                <CameraIcon className="size-4 text-muted-foreground" aria-hidden="true" />
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.05}
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="flex-1 accent-idn-green"
                  aria-label="Zoom"
                />
              </div>
            </>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={submitting}
            >
              {profile.editPhoto.cancel}
            </Button>
            <Button type="button" onClick={onSave} disabled={submitting}>
              {submitting ? "…" : profile.editPhoto.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
