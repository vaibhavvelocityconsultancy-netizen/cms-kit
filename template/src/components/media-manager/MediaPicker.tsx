"use client";

import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/src/ui/dialog";
import { UploadCloud } from "lucide-react";
import { Button } from "@/src/ui/button";
import { getBaseUrl } from "@/src/lib/config";

interface MediaItem {
  id: string;
  mimeType: string;
  url: string;
  originalName: string;
}
export function MediaPickerModal({
  open,
  onClose,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (item: MediaItem) => void;
}) {
  const [media, setMedia] = useState([]);
  const [tab, setTab] = useState<"LIBRARY" | "UPLOAD">("LIBRARY");
  const inputRef = useRef<HTMLInputElement>(null);
  async function fetchMedia() {
    const res = await fetch(`${getBaseUrl()}/api/media`);
    const data = await res.json();

    setMedia(data.data.items);
  }

  useEffect(() => {
    if (open) {
      fetchMedia();
    }
  }, [open]);
  async function uploadFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files?.length) return;

    // Upload one by one so each file gets correct resource_type
    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append("files", file); // ← singular "file" not "files"

      await fetch(`${getBaseUrl()}/api/media/upload`, {
        method: "POST",
        body: formData,
      });
    }

    await fetchMedia();
    setTab("LIBRARY");
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="">
        <DialogHeader>
          <DialogTitle className="sr-only">Choose media</DialogTitle>
          <div className="flex border-b">
            <button
              className={`px-4 py-2 ${
                tab === "LIBRARY" ? "border-b-2 border-primary font-medium" : ""
              }`}
              onClick={() => setTab("LIBRARY")}
            >
              Media Library
            </button>

            <button
              className={`px-4 py-2 ${
                tab === "UPLOAD" ? "border-b-2 border-primary font-medium" : ""
              }`}
              onClick={() => setTab("UPLOAD")}
            >
              Upload New
            </button>
          </div>
        </DialogHeader>
        {tab === "LIBRARY" ? (
          <div className="min-h-[500px] min-w-[800px] overflow-y-auto">
            {media.length === 0 ? (
              <div className="flex items-center justify-center h-40 text-muted-foreground">
                <p className="text-center">No media files to add</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
                {media.map((item: MediaItem) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      onSelect(item);
                      onClose();
                    }}
                    className="border rounded-lg overflow-hidden hover:ring-2 hover:ring-primary"
                  >
                    {item.mimeType.startsWith("image/") ? (
                      <img
                        src={item.url}
                        alt={item.originalName}
                        className="w-full h-32 object-cover"
                      />
                    ) : (
                      <div className="h-32 flex items-center justify-center bg-muted">
                        FILE
                      </div>
                    )}

                    <div className="p-2 text-xs truncate">
                      {item.originalName}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-[450px] border-2 border-dashed rounded-lg">
            <UploadCloud className="w-12 h-12 mb-4 text-muted-foreground" />

            <p className="text-muted-foreground">Drag & Drop files here</p>

            <Button className="mt-4" onClick={() => inputRef.current?.click()}>
              Choose Files
            </Button>

            <input
              ref={inputRef}
              hidden
              type="file"
              multiple
              onChange={uploadFiles}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
