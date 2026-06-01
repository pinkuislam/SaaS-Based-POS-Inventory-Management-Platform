"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { notify } from "@/lib/notify";
import { confirmDelete } from "@/lib/confirm";
import { Button } from "@/components/ui/button";
import { ImagePlus, Trash2 } from "lucide-react";

export function CategoryImageUpload({
  categoryId,
  imageUrl,
}: {
  categoryId: string;
  imageUrl: string | null;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState(imageUrl);
  const [loading, setLoading] = useState(false);

  async function handleUpload(file: File) {
    setLoading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(`/api/categories/${categoryId}/image`, {
        method: "POST",
        body: form,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setPreview(data.image);
      notify.success("Image updated");
      router.refresh();
    } catch (e) {
      notify.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleRemove() {
    const ok = await confirmDelete("Remove category image?");
    if (!ok) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/categories/${categoryId}/image`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Remove failed");
      }
      setPreview(null);
      notify.success("Image removed");
      router.refresh();
    } catch (e) {
      notify.error(e instanceof Error ? e.message : "Remove failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-4">
      <div className="relative h-20 w-20 rounded-md border bg-muted overflow-hidden flex items-center justify-center">
        {preview ? (
          <Image src={preview} alt="" fill className="object-cover" unoptimized />
        ) : (
          <ImagePlus className="h-8 w-8 text-muted-foreground" />
        )}
      </div>
      <div className="flex flex-col gap-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleUpload(file);
            e.target.value = "";
          }}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={loading}
          onClick={() => inputRef.current?.click()}
        >
          {loading ? "Uploading..." : preview ? "Replace image" : "Upload image"}
        </Button>
        {preview && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={loading}
            onClick={handleRemove}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Remove
          </Button>
        )}
      </div>
    </div>
  );
}
