"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { notify } from "@/lib/notify";
import { Button } from "@/components/ui/button";
import { Building2, Upload, Trash2 } from "lucide-react";

export function BusinessLogoUpload({ logo }: { logo: string | null }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [currentLogo, setCurrentLogo] = useState(logo);

  async function handleUpload(file: File) {
    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/tenant/profile/logo", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setCurrentLogo(data.logo);
      notify.success("Logo updated");
      router.refresh();
    } catch (e) {
      notify.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleRemove() {
    setLoading(true);
    try {
      const res = await fetch("/api/tenant/profile/logo", { method: "DELETE" });
      if (!res.ok) throw new Error();
      setCurrentLogo(null);
      notify.success("Logo removed");
      router.refresh();
    } catch {
      notify.error("Failed to remove logo");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col sm:flex-row items-start gap-4">
      <div className="h-24 w-24 rounded-lg border bg-muted flex items-center justify-center overflow-hidden shrink-0">
        {currentLogo ? (
          <Image
            src={currentLogo}
            alt="Business logo"
            width={96}
            height={96}
            className="object-contain h-full w-full"
            unoptimized
          />
        ) : (
          <Building2 className="h-10 w-10 text-muted-foreground" />
        )}
      </div>
      <div className="space-y-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleUpload(file);
            e.target.value = "";
          }}
        />
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={loading}
            onClick={() => inputRef.current?.click()}
          >
            <Upload className="h-4 w-4 mr-2" />
            {currentLogo ? "Change logo" : "Upload logo"}
          </Button>
          {currentLogo && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={loading}
              onClick={handleRemove}
            >
              <Trash2 className="h-4 w-4 mr-2 text-destructive" />
              Remove
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          JPEG, PNG, WebP or GIF. Max 2MB. Shown on invoices and receipts when
          enabled.
        </p>
      </div>
    </div>
  );
}
