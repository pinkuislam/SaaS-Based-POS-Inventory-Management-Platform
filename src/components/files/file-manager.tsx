"use client";

import { useCallback, useEffect, useState } from "react";
import { notify } from "@/lib/notify";
import { confirmDelete } from "@/lib/confirm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Trash2, RefreshCw, ExternalLink } from "lucide-react";
import { formatDate } from "@/lib/utils";

type FileRow = {
  name: string;
  path: string;
  size: number;
  modified: string;
  type: string;
};

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function FileManager() {
  const [files, setFiles] = useState<FileRow[]>([]);
  const [publicBase, setPublicBase] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/tenant/files");
      const data = await res.json();
      if (res.ok) {
        setFiles(data.files || []);
        setPublicBase(data.publicBase || "");
      }
    } catch {
      setFiles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleDelete(filePath: string, name: string) {
    const ok = await confirmDelete(`Delete file "${name}"?`);
    if (!ok) return;
    const res = await fetch("/api/tenant/files", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filePath }),
    });
    if (res.ok) {
      notify.success("File deleted");
      load();
    } else {
      notify.error("Delete failed");
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Uploaded files</CardTitle>
        <Button variant="ghost" size="icon" onClick={load}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading files...</p>
        ) : files.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No files uploaded yet. Add product images from Products or upload
            a business logo from Business profile.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Modified</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {files.map((f) => (
                  <TableRow key={f.path}>
                    <TableCell className="font-mono text-xs max-w-[200px] truncate">
                      {f.path}
                    </TableCell>
                    <TableCell>{f.type}</TableCell>
                    <TableCell>{formatBytes(f.size)}</TableCell>
                    <TableCell>{formatDate(f.modified)}</TableCell>
                    <TableCell className="text-right">
                      <a
                        href={`${publicBase}/${f.path}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex h-8 w-8 items-center justify-center hover:bg-muted rounded"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(f.path, f.name)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
