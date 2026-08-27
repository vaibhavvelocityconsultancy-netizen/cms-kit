"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { X, Trash2, Download, Copy, Check, Edit2, Save } from "lucide-react";
import { Button } from "@/src/ui/button";
import { toast } from "@/src/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/src/ui/dialog";
import { MediaItem } from "./MediaManager";
import { Field, FieldContent, FieldGroup, FieldLabel } from "@/src/ui/field";
import { resolveAppUrl } from "@/src/lib/base-path";
// import {
//   Field,
//   FieldLabel,
//   FieldContent,
//   FieldGroup,
// } from ;

// Extend MediaItem type to include new fields
interface ExtendedMediaItem extends MediaItem {
  altText?: string;
  title?: string;
  caption?: string;
  description?: string;
}

interface MediaPreviewProps {
  item: ExtendedMediaItem | null;
  onClose: () => void;
  onDelete: (item: ExtendedMediaItem) => void;
  onUpdate?: (
    item: ExtendedMediaItem,
    updates: Partial<ExtendedMediaItem>,
  ) => Promise<void>;
}

export function MediaPreview({
  item,
  onClose,
  onDelete,
  onUpdate,
}: MediaPreviewProps) {
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editedData, setEditedData] = useState<Partial<ExtendedMediaItem>>({});

  useEffect(() => {
    if (item && isEditing) {
      // Reset edited data when item changes or entering edit mode
      setEditedData({
        altText: item.altText || "",
        title: item.title || "",
        caption: item.caption || "",
        description: item.description || "",
      });
    }
  }, [item, isEditing]);

  if (!item) return null;

  const isImage = item.mimeType?.startsWith("image/");
  const fileUrl = getViewerUrl(item);

  const copyUrl = async () => {
    await navigator.clipboard.writeText(fileUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: "Success",
      description: "URL copied to clipboard",
    });
  };

  const downloadFile = () => {
    const a = document.createElement("a");
    a.href = fileUrl;
    a.download = item.originalName;
    a.click();
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedData({});
  };

  function getViewerUrl(item: ExtendedMediaItem) {
    return resolveAppUrl(`/api/media/${item.id}`, window.location.origin);
  }
  const handleSave = async () => {
    if (!onUpdate) return;

    setIsSaving(true);
    try {
      await onUpdate(item, editedData);
      setIsEditing(false);
      toast({
        title: "Success",
        description: "Media information updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update media information",
        variant: "destructive",
      });
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleFieldChange = (field: keyof ExtendedMediaItem, value: string) => {
    setEditedData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={!!item} onOpenChange={onClose}>
      <DialogContent
        className="w-full p-0 overflow-hidden sm:max-w-[90vw] md:max-w-[85vw] lg:max-w-6xl max-h-[90vh]"
        showCloseButton={false}
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Media Preview</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col md:flex-row h-full max-h-[90vh] overflow-y-auto">
          {/* Preview Area */}
          <div className="bg-muted/30 flex items-center justify-center p-8 md:w-2/3">
            {isImage ? (
              <div className="relative w-full max-h-[60vh] aspect-square">
                <Image
                  src={fileUrl}
                  alt={
                    isEditing
                      ? editedData.altText || ""
                      : item.altText || item.originalName
                  }
                  fill
                  className="object-contain"
                  unoptimized
                />
              </div>
            ) : (
              <div className="text-center">
                <div className="w-32 h-32 mx-auto bg-muted rounded-2xl flex items-center justify-center">
                  <span className="text-2xl font-bold">
                    {item.mimeType?.split("/")[1]?.toUpperCase().slice(0, 4)}
                  </span>
                </div>
                <p className="mt-3 text-sm text-muted-foreground">
                  {item.mimeType}
                </p>
              </div>
            )}
          </div>

          {/* Info Panel */}
          <div className="p-6 border-t md:border-t-0 md:border-l md:w-1/3 space-y-4 overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-start gap-2">
              <h3 className="font-semibold text-lg truncate flex-1">
                {item.originalName}
              </h3>
              <DialogClose className="text-muted-foreground hover:text-foreground transition-colors shrink-0">
                <X className="w-5 h-5" />
              </DialogClose>
            </div>

            <FieldGroup>
              {/* Basic Info Section - Read-only */}
              <Field>
                <FieldLabel>Basic Information</FieldLabel>
                <FieldContent>
                  <div className="space-y-2">
                    <InfoRow label="Type" value={item.mimeType} />
                    <InfoRow label="Size" value={formatFileSize(item.size)} />
                    {item.width && item.height && (
                      <InfoRow
                        label="Dimensions"
                        value={`${item.width} × ${item.height} px`}
                      />
                    )}
                    <InfoRow
                      label="Uploaded"
                      value={formatDate(item.createdAt)}
                    />
                    <InfoRow label="Filename" value={item.fileName} />
                  </div>
                </FieldContent>
              </Field>

              <div className="h-px bg-border my-2" />

              {/* SEO/Media Metadata Section - Only for images */}
              {isImage && (
                <>
                  <div className="flex justify-between items-center mb-2">
                    <FieldLabel>Media Metadata</FieldLabel>
                    {!isEditing ? (
                      <Button variant="outline" size="sm" onClick={handleEdit}>
                        <Edit2 className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                    ) : (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleCancel}
                          disabled={isSaving}
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleSave}
                          disabled={isSaving}
                        >
                          <Save className="w-4 h-4 mr-2" />
                          {isSaving ? "Saving..." : "Save Changes"}
                        </Button>
                      </div>
                    )}
                  </div>

                  <Field>
                    <FieldContent>
                      <div className="space-y-4">
                        {/* Alternative Text */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium">
                            Alternative Text
                            {!isEditing && item.altText && (
                              <span className="ml-2 text-xs text-green-600">
                                ✓ Saved
                              </span>
                            )}
                          </label>
                          {isEditing ? (
                            <textarea
                              value={editedData.altText || ""}
                              onChange={(e) =>
                                handleFieldChange("altText", e.target.value)
                              }
                              className="w-full p-2 text-sm border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                              rows={3}
                              placeholder="Describe the purpose of the image. Leave empty if the image is purely decorative."
                            />
                          ) : (
                            <div className="text-sm text-muted-foreground">
                              {item.altText ? (
                                <p className="whitespace-pre-wrap">
                                  {item.altText}
                                </p>
                              ) : (
                                <p className="italic">
                                  No alternative text provided
                                </p>
                              )}
                              <p className="text-xs text-muted-foreground mt-2">
                                Learn how to describe the purpose of the image.
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Title */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium">
                            Title
                            {!isEditing && item.title && (
                              <span className="ml-2 text-xs text-green-600">
                                ✓ Saved
                              </span>
                            )}
                          </label>
                          {isEditing ? (
                            <input
                              type="text"
                              value={editedData.title || item.fileName}
                              onChange={(e) =>
                                handleFieldChange("title", e.target.value)
                              }
                              className="w-full p-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                              placeholder="Image title"
                            />
                          ) : (
                            <div className="text-sm text-muted-foreground">
                              {item.title ? (
                                <p>{item.title}</p>
                              ) : (
                                <p className="italic">
                                  {item.fileName || "No title provided"}
                                </p>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Caption */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium">
                            Caption
                            {!isEditing && item.caption && (
                              <span className="ml-2 text-xs text-green-600">
                                ✓ Saved
                              </span>
                            )}
                          </label>
                          {isEditing ? (
                            <textarea
                              value={editedData.caption || ""}
                              onChange={(e) =>
                                handleFieldChange("caption", e.target.value)
                              }
                              className="w-full p-2 text-sm border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                              rows={2}
                              placeholder="Image caption"
                            />
                          ) : (
                            <div className="text-sm text-muted-foreground">
                              {item.caption ? (
                                <p className="whitespace-pre-wrap">
                                  {item.caption}
                                </p>
                              ) : (
                                <p className="italic">No caption provided</p>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Description */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium">
                            Description
                            {!isEditing && item.description && (
                              <span className="ml-2 text-xs text-green-600">
                                ✓ Saved
                              </span>
                            )}
                          </label>
                          {isEditing ? (
                            <textarea
                              value={editedData.description || ""}
                              onChange={(e) =>
                                handleFieldChange("description", e.target.value)
                              }
                              className="w-full p-2 text-sm border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                              rows={4}
                              placeholder="Detailed description of the image"
                            />
                          ) : (
                            <div className="text-sm text-muted-foreground">
                              {item.description ? (
                                <p className="whitespace-pre-wrap">
                                  {item.description}
                                </p>
                              ) : (
                                <p className="italic">
                                  No description provided
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </FieldContent>
                  </Field>

                  <div className="h-px bg-border my-2" />
                </>
              )}
            </FieldGroup>

            {/* Action Buttons */}
            <div className="space-y-3 pt-4">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="default"
                  className="flex-1"
                  onClick={copyUrl}
                >
                  {copied ? (
                    <Check className="w-4 h-4 mr-2" />
                  ) : (
                    <Copy className="w-4 h-4 mr-2" />
                  )}
                  {copied ? "Copied" : "Copy URL"}
                </Button>
                <Button
                  variant="outline"
                  size="default"
                  className="flex-1"
                  onClick={downloadFile}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </div>

              <Button
                variant="destructive"
                size="default"
                className="w-full"
                onClick={() => {
                  onDelete(item);
                  onClose();
                }}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Permanently
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center gap-3">
      <span className="text-muted-foreground text-sm">{label}</span>
      <span className="font-mono text-sm truncate max-w-[180px]" title={value}>
        {value}
      </span>
    </div>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
