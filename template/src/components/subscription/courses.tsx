"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  BookOpen,
  Play,
  Loader2,
  X,
  Clock,
  FileText,
  Link,
  File,
  Video as VideoIcon,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fetchers } from "@/src/lib/fetchers";
import { queryKeys } from "@/src/lib/query-key";

interface Material {
  id: number;
  title: string;
  type: "PDF" | "DOC" | "LINK" | "VIDEO" | "OTHER";
  url: string;
  size?: number | null;
}

interface Video {
  id: string;
  title: string;
  durationMinutes: number;
  videoUrl?: string;
  videoType?: string;
  thumbnail?: string;
  courseMaterials?: Material[];
}

interface Course {
  id: string;
  title: string;
  courseContent?: {
    modules?: Video[];
  };
}

interface Enrollment {
  id: string;
  course: Course;
}

function toEmbedUrl(url: string): string | null {
  if (!url) return null;
  const ytMatch = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
  );
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1`;
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch)
    return `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1`;
  if (url.includes("/embed/")) return url;
  return null;
}

function getDownloadUrl(url: string) {
  return url.replace("/raw/upload/", "/raw/upload/fl_attachment/");
}

function getYoutubeThumbnail(url: string): string | null {
  const ytMatch = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
  );
  if (ytMatch) return `https://img.youtube.com/vi/${ytMatch[1]}/mqdefault.jpg`;
  return null;
}

function formatDuration(minutes: number) {
  if (!minutes) return null;
  if (minutes < 60) return `${minutes}m`;
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

function TypeIcon({ type }: { type: string }) {
  switch (type) {
    case "PDF":
      return <FileText className="w-4 h-4 text-red-500 shrink-0" />;
    case "DOC":
      return <File className="w-4 h-4 text-blue-500 shrink-0" />;
    case "LINK":
      return <Link className="w-4 h-4 text-green-500 shrink-0" />;
    case "VIDEO":
      return <VideoIcon className="w-4 h-4 text-purple-500 shrink-0" />;
    default:
      return <File className="w-4 h-4 text-muted-foreground shrink-0" />;
  }
}

// ── Materials list ────────────────────────────────────────────
function MaterialsList({ videos }: { videos: Video[] }) {
  const allMaterials = videos.flatMap((v) =>
    (v.courseMaterials || []).map((m) => ({ ...m, videoTitle: v.title })),
  );

  if (allMaterials.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4 text-center">
        No materials available for this course.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {allMaterials.map((material) => (
        <a
          key={material.id}
          href={getDownloadUrl(material.url)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-border bg-card hover:bg-muted/50 hover:border-primary/40 transition group"
        >
          <TypeIcon type={material.type} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate group-hover:text-primary transition">
              {material.title}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {material.videoTitle}
            </p>
          </div>
          <span className="text-xs bg-muted px-2 py-0.5 rounded shrink-0">
            {material.type}
          </span>
        </a>
      ))}
    </div>
  );
}

// ── Video Card ────────────────────────────────────────────────
function VideoCard({ video, onClick }: { video: Video; onClick: () => void }) {
  const thumbnail =
    video.thumbnail ||
    (video.videoUrl ? getYoutubeThumbnail(video.videoUrl) : null);

  return (
    <div
      className="group cursor-pointer rounded-xl overflow-hidden border border-border hover:border-primary/50 hover:shadow-lg transition-all duration-200"
      onClick={onClick}
    >
      <div className="relative aspect-video bg-muted overflow-hidden">
        {thumbnail ? (
          <img
            src={thumbnail}
            alt={video.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted">
            <Play className="w-8 h-8 text-muted-foreground/40" />
          </div>
        )}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-200 flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100 transition-all duration-200 shadow-lg">
            <Play className="w-5 h-5 text-black fill-black ml-0.5" />
          </div>
        </div>
        {video.durationMinutes > 0 && (
          <span className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded font-medium">
            {formatDuration(video.durationMinutes)}
          </span>
        )}
      </div>
      <div className="p-3">
        <p className="text-sm font-medium line-clamp-2 leading-snug">
          {video.title}
        </p>
        {/* Show material count badge */}
        {video.courseMaterials && video.courseMaterials.length > 0 && (
          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
            <FileText className="w-3 h-3" />
            {video.courseMaterials.length} material
            {video.courseMaterials.length > 1 ? "s" : ""}
          </p>
        )}
      </div>
    </div>
  );
}

// ── Player Modal ──────────────────────────────────────────────
function PlayerModal({
  video,
  onClose,
}: {
  video: Video;
  onClose: () => void;
}) {
  const embedUrl =
    video.videoType === "FILE"
      ? video.videoUrl
      : toEmbedUrl(video.videoUrl || "");

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-card rounded-xl overflow-hidden w-full max-w-4xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="aspect-video bg-black">
          {video.videoType === "FILE" ? (
            <video
              controls
              autoPlay
              src={embedUrl || ""}
              className="w-full h-full"
            />
          ) : embedUrl ? (
            <iframe
              src={embedUrl}
              className="w-full h-full"
              allowFullScreen
              allow="autoplay"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white/50 text-sm">
              No playable URL
            </div>
          )}
        </div>
        <div className="px-5 py-4 flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base">{video.title}</h3>
            {video.durationMinutes > 0 && (
              <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatDuration(video.durationMinutes)}
              </p>
            )}
            {/* Materials inside modal */}
            {video.courseMaterials && video.courseMaterials.length > 0 && (
              <div className="mt-3 space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Materials
                </p>
                {video.courseMaterials.map((m) => (
                  <a
                    key={m.id}
                    href={getDownloadUrl(m.url)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-primary hover:underline"
                  >
                    <TypeIcon type={m.type} />
                    {m.title}
                    <span className="text-xs text-muted-foreground">
                      ({m.type})
                    </span>
                  </a>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-muted transition shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Tab Button ────────────────────────────────────────────────
function TabButton({
  active,
  onClick,
  children,
  badge,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  badge?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 text-xs font-medium rounded-md transition flex items-center gap-1 ${
        active
          ? "bg-background shadow text-foreground"
          : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
      {badge !== undefined && badge > 0 && (
        <span className="ml-1 bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded-full">
          {badge}
        </span>
      )}
    </button>
  );
}

// ── Course Section ────────────────────────────────────────────
function CourseSection({ enrollment }: { enrollment: Enrollment }) {
  const [activeVideo, setActiveVideo] = useState<Video | null>(null);
  const [activeTab, setActiveTab] = useState<"videos" | "materials">("videos");

  const course = enrollment.course;
  const videos: Video[] = course.courseContent?.modules || [];
  const allMaterials = videos.flatMap((v) => v.courseMaterials || []);

  return (
    <section>
      {activeVideo && (
        <PlayerModal video={activeVideo} onClose={() => setActiveVideo(null)} />
      )}

      {/* Course heading + tabs */}
      <div className="mb-4 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-semibold">{course.title}</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {videos.length} video{videos.length !== 1 ? "s" : ""}
            {allMaterials.length > 0 &&
              ` • ${allMaterials.length} material${allMaterials.length !== 1 ? "s" : ""}`}
          </p>
        </div>

        {/* Always show tabs */}
        <div className="flex gap-1 bg-muted rounded-lg p-1">
          <TabButton
            active={activeTab === "videos"}
            onClick={() => setActiveTab("videos")}
            badge={videos.length}
          >
            Videos
          </TabButton>
          <TabButton
            active={activeTab === "materials"}
            onClick={() => setActiveTab("materials")}
            badge={allMaterials.length}
          >
            Materials
          </TabButton>
        </div>
      </div>

      {/* Content */}
      {videos.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No videos in this course yet.
        </p>
      ) : activeTab === "videos" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {videos.map((video) => (
            <VideoCard
              key={video.id}
              video={video}
              onClick={() => setActiveVideo(video)}
            />
          ))}
        </div>
      ) : (
        <MaterialsList videos={videos} />
      )}
    </section>
  );
}

// ── Main Page ─────────────────────────────────────────────────
export function CoursesPage() {
  const router = useRouter();

  const {
    data: enrollments,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: queryKeys.myCourses,
    queryFn: fetchers.getMycourses,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 2,
    retryDelay: 1000,
  });

  if (isLoading) {
    return (
      <div className="p-10 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-10 flex flex-col items-center justify-center gap-3 text-center">
        <p className="text-sm font-medium text-red-600">
          Error loading courses
        </p>
        <p className="text-xs text-muted-foreground">
          {(error as Error)?.message || "Something went wrong"}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="mt-2 text-xs font-medium bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition"
        >
          Try Again
        </button>
      </div>
    );
  }

  const enrollmentData = enrollments?.success ? enrollments.data : enrollments;

  if (!enrollmentData || enrollmentData.length === 0) {
    return (
      <div className="p-10 flex flex-col items-center justify-center gap-3 text-center">
        <BookOpen className="w-10 h-10 text-muted-foreground" />
        <p className="text-sm font-medium">No courses yet</p>
        <p className="text-xs text-muted-foreground">
          Browse our catalog and enroll in a course.
        </p>
        <button
          onClick={() => router.push("/courses")}
          className="mt-2 text-xs font-medium bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition"
        >
          Browse Courses
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-10 overflow-y-auto">
      {enrollmentData.map((enrollment: Enrollment) => (
        <CourseSection key={enrollment.id} enrollment={enrollment} />
      ))}
    </div>
  );
}
