"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { notify } from "@/lib/notify";
import { confirmDelete } from "@/lib/confirm";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import Image from "next/image";
import { Upload, Trash2 } from "lucide-react";

export function ProductImageUpload({
  productId,
  imageUrl,
}: {
  productId: string;
  imageUrl: string | null;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(imageUrl);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`/api/products/${productId}/image`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPreview(data.image);
      notify.success("Image uploaded");
      router.refresh();
    } catch (err) {
      notify.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleRemove() {
    const confirmed = await confirmDelete(
      "Remove product image?",
      "The image will be deleted from this product."
    );
    if (!confirmed) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/products/${productId}/image`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      setPreview(null);
      notify.success("Image removed");
      router.refresh();
    } catch {
      notify.error("Failed to remove image");
    } finally {
      setLoading(false);
    }
  }

  return (
    <FormField label="Product Image">
      {preview ? (
        <div className="flex items-start gap-4">
          <div className="relative h-24 w-24 rounded-lg border overflow-hidden bg-muted">
            <Image
              src={preview}
              alt="Product"
              fill
              className="object-cover"
              unoptimized
            />
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleRemove}
            disabled={loading}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Remove
          </Button>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">No image (max 2MB)</p>
      )}
      <div>
        <label className="inline-flex items-center gap-2 cursor-pointer text-sm text-primary hover:underline">
          <Upload className="h-4 w-4" />
          {loading ? "Uploading..." : preview ? "Replace image" : "Upload image"}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            disabled={loading}
            onChange={handleUpload}
          />
        </label>
      </div>
    </FormField>
  );
}
