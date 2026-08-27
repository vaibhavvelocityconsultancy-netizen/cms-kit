"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import useSWR from "swr";
import {
  ChevronLeft,
  PlayCircle,
  CheckCircle2,
  Loader2,
  BookOpen,
  Clock,
} from "lucide-react";
import { getBaseUrl } from "@/src/lib/config";

// ── URL converter ─────────────────────────────────────────────
function toEmbedUrl(url: string): string | null {
  if (!url) return null;

  // YouTube
  const ytMatch = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
  );
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;

  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;

  // Already an embed URL
  if (url.includes("/embed/")) return url;

  return null;
}

function formatDuration(minutes: number) {
  if (!minutes) return null;
  if (minutes < 60) return `${minutes}m`;
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function WatchPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [activeIndex, setActiveIndex] = useState(0);
  const [checking, setChecking] = useState(true);

  // Check enrollment
  useEffect(() => {
    if (!id) return;
    fetch(`${getBaseUrl()}/api/enrollments/check/${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (!d.data?.enrolled) {
          router.replace(`/courses/${id}`);
        } else {
          setChecking(false);
        }
      })
      .catch(() => router.replace(`/courses/${id}`));
  }, [id]);

  // Fetch course detail (has curriculum)
  const { data, isLoading } = useSWR(
    !checking && id ? `course-detail-${id}` : null,
    () =>
      fetch(`${getBaseUrl()}/api/courses/${id}/detail`).then((r) => r.json()),
  );

  const course = data?.data;
  const modules = course?.curriculum ?? [];
  // console.log(course.curriculum);
  const activeModule = modules[activeIndex];
  const embedUrl = activeModule ? toEmbedUrl(activeModule.videoUrl) : null;
  const isFileVideo = activeModule?.videoType === "FILE";

  if (checking || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Course not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <div className="h-14 border-b border-border flex items-center px-4 gap-3 bg-card shrink-0">
        <button
          onClick={() => router.push("/dashboard")}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition"
        >
          <ChevronLeft className="w-4 h-4" />
          Dashboard
        </button>
        <span className="text-sm font-medium text-foreground truncate">
          {course.title}
        </span>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Main — video + title */}
        <div className="flex-1 flex flex-col overflow-y-auto">
          <div className="w-full bg-black aspect-video">
            {isFileVideo && activeModule?.videoUrl ? (
              <video
                controls
                className="w-full h-full"
                src={activeModule.videoUrl}
              />
            ) : embedUrl ? (
              <iframe
                src={embedUrl}
                className="w-full h-full"
                allowFullScreen
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                No video available
              </div>
            )}
          </div>
          {/* Lesson info */}
          <div className="p-6 space-y-2 border-b border-border">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                Lesson {activeIndex + 1} of {modules.length}
              </span>
              {activeModule?.durationMinutes > 0 && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  {formatDuration(activeModule.durationMinutes)}
                </span>
              )}
            </div>
            <h2 className="text-xl font-semibold text-foreground">
              {activeModule?.title}
            </h2>
          </div>

          {/* Prev / Next */}
          <div className="p-6 flex items-center justify-between">
            <button
              onClick={() => setActiveIndex((i) => Math.max(0, i - 1))}
              disabled={activeIndex === 0}
              className="text-sm font-medium px-4 py-2 rounded-lg border border-border hover:bg-muted transition disabled:opacity-40"
            >
              ← Previous
            </button>
            <button
              onClick={() =>
                setActiveIndex((i) => Math.min(modules.length - 1, i + 1))
              }
              disabled={activeIndex === modules.length - 1}
              className="text-sm font-medium px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition disabled:opacity-40"
            >
              Next →
            </button>
          </div>
        </div>

        {/* Sidebar — module list */}
        <div className="w-80 border-l border-border flex flex-col shrink-0 overflow-hidden">
          <div className="p-4 border-b border-border">
            <p className="text-sm font-semibold text-foreground">
              Course Content
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {modules.length} lessons
            </p>
          </div>

          <div className="flex-1 overflow-y-auto">
            {modules.map((mod: any, i: number) => {
              const isActive = i === activeIndex;
              const isDone = i < activeIndex;

              return (
                <button
                  key={mod.id}
                  onClick={() => setActiveIndex(i)}
                  className={`w-full text-left px-4 py-3 flex items-start gap-3 border-b border-border transition hover:bg-muted/50 ${
                    isActive ? "bg-blue-50 dark:bg-blue-900/20" : ""
                  }`}
                >
                  {/* Icon */}
                  <div className="mt-0.5 shrink-0">
                    {isDone ? (
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    ) : isActive ? (
                      <PlayCircle className="w-4 h-4 text-blue-600" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/40" />
                    )}
                  </div>

                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm leading-snug truncate ${
                        isActive
                          ? "font-semibold text-blue-700 dark:text-blue-400"
                          : "text-foreground"
                      }`}
                    >
                      {i + 1}. {mod.title}
                    </p>
                    {mod.durationMinutes > 0 && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatDuration(mod.durationMinutes)}
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
