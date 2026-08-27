"use client";

import React, { useState } from "react";
import useSWR from "swr";
import { Button } from "@/src/ui/button";
import { Badge } from "@/src/ui/badge";
import { Input } from "@/src/ui/input";
import { Label } from "@/src/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/ui/card";
import { toast } from "@/src/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/src/ui/alert-dialog";
import {
  Plus,
  Pencil,
  Trash2,
  RotateCcw,
  BookOpen,
  Star,
  Eye,
  EyeOff,
  ChevronUp,
  ChevronDown,
  Check,
  Sparkles,
  Clock,
  User,
  BarChart2,
} from "lucide-react";
import { fetchers } from "@/src/lib/fetchers";
import { apiMutations } from "@/src/lib/apimutation";

// ── Types ──────────────────────────────────────────────────────────────────

interface CourseModule {
  id?: number;
  title: string;
}
type BillingCycle = "LIFETIME" | "MONTHLY" | "YEARLY";
type CourseLevel = "Beginner" | "Intermediate" | "Advanced";

interface Course {
  id?: number;
  title: string;
  slug: string;
  shortDescription: string;
  instructor: string;
  thumbnail: string;
  price?: number;
  durationHours: number;
  level: CourseLevel;
  billingCycle: BillingCycle;
  isFeatured: boolean;
  isPublished: boolean;
  modules: CourseModule[];
}

// add to existing CourseModule interface area
interface SourceCourseModule {
  id: number;
  title: string;
}

interface SourceCourse {
  id: number;
  title: string;
  slug: string;
  shortDescription: string;
  instructor: string;
  thumbnail: string;
  hasPricingCard: boolean; // backend should return this flag
  modules: SourceCourseModule[];
}

// ── Helpers ────────────────────────────────────────────────────────────────

const emptyCourse = (): Course => ({
  title: "",
  slug: "",
  shortDescription: "",
  instructor: "",
  thumbnail: "",
  price: 0,
  durationHours: 1,
  level: "Beginner",
  billingCycle: "LIFETIME",
  isFeatured: false,
  isPublished: true,
  modules: [],
});

function formatINR(val?: number | null) {
  const amount = Number(val ?? 0);

  if (amount === 0) return "₹0";

  return "₹" + amount.toLocaleString("en-IN");
}
function accessTypeLabel(billingCycle: BillingCycle) {
  if (billingCycle === "LIFETIME") return "Lifetime Access";
  if (billingCycle === "MONTHLY") return "Monthly Subscription";
  if (billingCycle === "YEARLY") return "Yearly Subscription";
  return billingCycle;
}

// ── Component ──────────────────────────────────────────────────────────────

export function AdminCoursesPlan() {
  // ── Remote state via SWR ──
  const { data, isLoading, mutate } = useSWR("courses", fetchers.courses);

  const courses: Course[] = data?.data ?? data ?? [];

  // ── Local UI state ──
  const [editing, setEditing] = useState<Course | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [newModuleText, setNewModuleText] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState<string>(""); // NEW
  // ── Form helpers ──
  const { data: sourceCoursesData } = useSWR(
    "course-content-available",
    fetchers.availableCourseContent, // TODO: add this fetcher → GET /api/course-content?withoutPricing=true
  );
  const availableCourses: SourceCourse[] = sourceCoursesData?.data ?? [];

  function openEdit(course: Course) {
    setEditing({ ...course, modules: course.modules.map((m) => ({ ...m })) });
    setIsNew(false);
    setSelectedCourseId(""); // dropdown not shown when editing existing
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function openNew() {
    setEditing(emptyCourse());
    setIsNew(true);
    setSelectedCourseId("");
  }
  function resetForm() {
    setEditing(null);
    setIsNew(false);
  }

  // ── Create / Update ──

  function handleCourseSelect(courseId: string) {
    setSelectedCourseId(courseId);
    if (!courseId) return;

    const source = availableCourses.find((c) => String(c.id) === courseId);
    if (!source || !editing) return;

    setEditing({
      ...editing,
      title: source.title,
      slug: source.slug,
      shortDescription: source.shortDescription,
      instructor: source.instructor,
      thumbnail: source.thumbnail,
      modules: source.modules.map((m) => ({ id: m.id, title: m.title })),
    });
  }
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editing || !editing.title.trim()) return;
    if (isNew && !selectedCourseId) {
      toast({
        title: "Error",
        description: "Please select a course",
        variant: "destructive",
      });
      return;
    }
    try {
      setSubmitting(true);
      if (isNew) {
        await apiMutations.create({
          ...editing,
          courseContentId: Number(selectedCourseId),
        });
        toast({ title: "Success", description: "Course created successfully" });
      } else {
        await apiMutations.update(editing, String(editing.id));
        toast({ title: "Success", description: "Course updated successfully" });
      }
      await mutate();
      resetForm();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.message || "Failed to save course",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  }

  // ── Delete ──

  async function handleDelete() {
    if (!courseToDelete) return;
    try {
      await apiMutations.delete(String(courseToDelete.id));
      if (editing?.id === courseToDelete.id) resetForm();
      toast({ title: "Success", description: "Course deleted successfully" });
      await mutate();
      setDeleteDialogOpen(false);
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.message || "Failed to delete course",
        variant: "destructive",
      });
    }
  }

  // ── Toggle published (optimistic) ──

  async function togglePublished(id: number) {
    try {
      await mutate(
        async () => {
          await apiMutations.toggleStatus(String(id));
          return undefined;
        },
        {
          optimisticData: {
            ...data,
            data: courses.map((c) =>
              c.id === id ? { ...c, isPublished: !c.isPublished } : c,
            ),
          },
          rollbackOnError: true,
          revalidate: true,
        },
      );
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.message || "Failed to update course status",
        variant: "destructive",
      });
    }
  }

  // ── Reorder (optimistic) ──

  async function moveCourse(id: number, dir: -1 | 1) {
    const idx = courses.findIndex((c) => c.id === id);
    const next = idx + dir;
    if (next < 0 || next >= courses.length) return;

    const reordered = [...courses];
    [reordered[idx], reordered[next]] = [reordered[next], reordered[idx]];

    try {
      await mutate(
        async () => {
          await apiMutations.reorder(reordered);
          return undefined;
        },
        {
          optimisticData: { ...data, data: reordered },
          rollbackOnError: true,
          revalidate: true,
        },
      );
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.message || "Failed to reorder courses",
        variant: "destructive",
      });
    }
  }

  // ── Module helpers ──

  function addModule() {
    if (!editing || !newModuleText.trim()) return;
    setEditing({
      ...editing,
      modules: [...editing.modules, { title: newModuleText.trim() }],
    });
    setNewModuleText("");
  }

  function removeModule(idx: number) {
    if (!editing) return;
    setEditing({
      ...editing,
      modules: editing.modules.filter((_, i) => i !== idx),
    });
  }

  function updateModuleText(idx: number, text: string) {
    if (!editing) return;
    setEditing({
      ...editing,
      modules: editing.modules.map((m, i) =>
        i === idx ? { ...m, title: text } : m,
      ),
    });
  }

  // ── Loading state ──

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground text-sm gap-2">
        <BookOpen className="h-4 w-4 animate-pulse" />
        Loading courses…
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <>
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold">Available Courses</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Browse and manage available courses.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Form ── */}
        <div className="lg:col-span-1">
          <Card
            className={`transition-all duration-200 ${editing ? "ring-2 ring-primary/30 shadow-md" : ""}`}
          >
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <div
                  className={`p-1.5 rounded-md ${editing && !isNew ? "bg-primary/10" : "bg-muted"}`}
                >
                  {editing && !isNew ? (
                    <Pencil className="h-4 w-4 text-primary" />
                  ) : (
                    <Plus className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <CardTitle className="text-base">
                    {editing && !isNew ? "Edit course" : "Add new course"}
                  </CardTitle>
                  <CardDescription className="text-xs mt-0.5">
                    {editing && !isNew
                      ? "Update the selected course details"
                      : "Create a new course listing"}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              {!editing ? (
                <Button className="w-full gap-2" onClick={openNew}>
                  <Plus className="h-4 w-4" />
                  Create new course
                </Button>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Course selector (replaces free-text title for NEW courses) */}
                  {isNew && (
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="course-select"
                        className="text-sm font-medium"
                      >
                        Select course{" "}
                        <span className="text-destructive">*</span>
                      </Label>
                      <div className="relative">
                        <BookOpen className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <select
                          id="course-select"
                          value={selectedCourseId}
                          onChange={(e) => handleCourseSelect(e.target.value)}
                          className="w-full pl-8 pr-3 py-2 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                          required
                        >
                          <option value="">Choose a course…</option>
                          {availableCourses.length === 0 && (
                            <option value="" disabled>
                              No courses available — all courses already have
                              pricing
                            </option>
                          )}
                          {availableCourses.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.title}
                            </option>
                          ))}
                        </select>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Title, description, instructor, thumbnail and modules
                        will auto-fill from the selected course.
                      </p>
                    </div>
                  )}

                  {/* Title — read-only display once a course is selected, or always shown when editing existing */}
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="course-title"
                      className="text-sm font-medium"
                    >
                      Course title
                    </Label>
                    <div className="relative">
                      <BookOpen className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="course-title"
                        value={editing.title}
                        readOnly={isNew}
                        onChange={(e) =>
                          !isNew &&
                          setEditing({ ...editing, title: e.target.value })
                        }
                        placeholder={
                          isNew ? "Auto-filled from selected course" : ""
                        }
                        className={`pl-8 ${isNew ? "bg-muted cursor-not-allowed" : ""}`}
                      />
                    </div>
                  </div>

                  {/* Slug — same read-only-on-create pattern */}
                  <div className="space-y-1.5">
                    <Label>Slug</Label>
                    <Input
                      value={editing.slug}
                      readOnly={isNew}
                      onChange={(e) =>
                        !isNew &&
                        setEditing({ ...editing, slug: e.target.value })
                      }
                      className={isNew ? "bg-muted cursor-not-allowed" : ""}
                    />
                  </div>
                  {/* Short description */}
                  <div className="space-y-1.5">
                    <Label htmlFor="short-desc" className="text-sm font-medium">
                      Short description
                    </Label>
                    <Input
                      id="short-desc"
                      value={editing.shortDescription}
                      onChange={(e) =>
                        setEditing({
                          ...editing,
                          shortDescription: e.target.value,
                        })
                      }
                      placeholder="e.g. Learn React from beginner to advanced"
                    />
                  </div>

                  {/* Instructor */}
                  <div className="space-y-1.5">
                    <Label htmlFor="instructor" className="text-sm font-medium">
                      Instructor
                    </Label>
                    <div className="relative">
                      <User className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="instructor"
                        value={editing.instructor}
                        onChange={(e) =>
                          setEditing({ ...editing, instructor: e.target.value })
                        }
                        placeholder="e.g. John Doe"
                        className="pl-8"
                      />
                    </div>
                  </div>

                  {/* Thumbnail URL */}
                  <div className="space-y-1.5">
                    <Label htmlFor="thumbnail" className="text-sm font-medium">
                      Thumbnail URL
                    </Label>
                    <Input
                      id="thumbnail"
                      value={editing.thumbnail}
                      onChange={(e) =>
                        setEditing({ ...editing, thumbnail: e.target.value })
                      }
                      placeholder="https://..."
                    />
                  </div>

                  {/* Price + Duration */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="price" className="text-sm font-medium">
                        Price (₹)
                      </Label>
                      <Input
                        id="price"
                        type="number"
                        min={0}
                        value={editing.price}
                        onChange={(e) =>
                          setEditing({
                            ...editing,
                            price: Math.max(0, Number(e.target.value)),
                          })
                        }
                        placeholder="0"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="duration" className="text-sm font-medium">
                        Duration (hrs)
                      </Label>
                      <div className="relative">
                        <Clock className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="duration"
                          type="number"
                          min={1}
                          value={editing.durationHours}
                          onChange={(e) =>
                            setEditing({
                              ...editing,
                              durationHours: Math.max(
                                1,
                                Number(e.target.value),
                              ),
                            })
                          }
                          placeholder="1"
                          className="pl-8"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Level */}
                  <div className="space-y-1.5">
                    <Label htmlFor="level" className="text-sm font-medium">
                      Level
                    </Label>
                    <div className="relative">
                      <BarChart2 className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <select
                        id="level"
                        value={editing.level}
                        onChange={(e) =>
                          setEditing({
                            ...editing,
                            level: e.target.value as CourseLevel,
                          })
                        }
                        className="w-full pl-8 pr-3 py-2 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                      >
                        <option value="Beginner">Beginner</option>
                        <option value="Intermediate">Intermediate</option>
                        <option value="Advanced">Advanced</option>
                      </select>
                    </div>
                  </div>

                  {/* Access type */}
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="billing-cycle"
                      className="text-sm font-medium"
                    >
                      Access type
                    </Label>
                    <select
                      id="billing-cycle"
                      value={editing.billingCycle}
                      onChange={(e) =>
                        setEditing({
                          ...editing,
                          billingCycle: e.target.value as BillingCycle,
                        })
                      }
                      className="w-full px-3 py-2 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="LIFETIME">Lifetime Access</option>
                      <option value="MONTHLY">Monthly Subscription</option>
                      <option value="YEARLY">Yearly Subscription</option>
                    </select>
                  </div>

                  {/* Toggles */}
                  <div className="space-y-2 pt-1">
                    {[
                      {
                        key: "isFeatured",
                        label: "Mark as featured",
                        icon: <Star className="h-3.5 w-3.5" />,
                      },
                      {
                        key: "isPublished",
                        label: "Publish course",
                        icon: <Eye className="h-3.5 w-3.5" />,
                      },
                    ].map(({ key, label, icon }) => (
                      <label
                        key={key}
                        className="flex items-center justify-between cursor-pointer group"
                      >
                        <span className="flex items-center gap-2 text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                          {icon}
                          {label}
                        </span>
                        <div
                          role="switch"
                          aria-checked={(editing as any)[key]}
                          onClick={() =>
                            setEditing({
                              ...editing,
                              [key]: !(editing as any)[key],
                            })
                          }
                          className={`relative w-9 h-5 rounded-full cursor-pointer transition-colors duration-200 ${
                            (editing as any)[key]
                              ? "bg-primary"
                              : "bg-muted border border-border"
                          }`}
                        >
                          <span
                            className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-all duration-200 ${
                              (editing as any)[key] ? "left-4" : "left-0.5"
                            }`}
                          />
                        </div>
                      </label>
                    ))}
                  </div>

                  {/* Modules */}
                  <div className="space-y-2 pt-1">
                    <Label className="text-sm font-medium">
                      Course Modules
                    </Label>

                    {editing.modules.length === 0 && (
                      <p className="text-xs text-muted-foreground italic">
                        {isNew
                          ? "Select a course above to load its modules"
                          : "No modules"}
                      </p>
                    )}

                    {editing.modules.length > 0 && (
                      <div className="space-y-1.5">
                        {editing.modules.map((m, idx) => (
                          <div key={idx} className="flex items-center gap-1.5">
                            <Check className="flex-shrink-0 h-4 w-4 text-primary" />
                            <span className="text-sm flex-1 py-1.5">
                              {m.title}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {isNew && (
                      <p className="text-xs text-muted-foreground">
                        Modules are managed in Course Content — not editable
                        here.
                      </p>
                    )}
                  </div>
                  {/* Actions */}
                  <div className="flex gap-2 pt-1">
                    <Button
                      type="submit"
                      className="flex-1"
                      disabled={submitting || !editing.title.trim()}
                    >
                      {submitting
                        ? "Saving..."
                        : isNew
                          ? "Create course"
                          : "Save changes"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={resetForm}
                      className="gap-1.5"
                      title="Discard changes"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      Cancel
                    </Button>
                  </div>

                  {editing && !isNew && (
                    <p className="text-xs text-primary flex items-center gap-1.5">
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                      Editing an existing course
                    </p>
                  )}
                </form>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Course list + preview ── */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Courses</CardTitle>
                  <CardDescription className="text-xs mt-0.5">
                    {courses.length} course{courses.length !== 1 ? "s" : ""} ·
                    order reflects the public catalog page
                  </CardDescription>
                </div>
                <Badge variant="outline" className="gap-1.5 font-normal">
                  <BookOpen className="h-3 w-3" />
                  {courses.length}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-2">
              {courses.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground">
                  <BookOpen className="h-8 w-8 opacity-40" />
                  <p className="text-sm">
                    No courses yet. Create your first course using the form.
                  </p>
                </div>
              )}

              {courses.map((course, idx) => (
                <div
                  key={course.id}
                  className={`flex items-center gap-3 rounded-lg border px-4 py-3 transition-all duration-150 ${
                    editing?.id === course.id
                      ? "ring-2 ring-primary/30 border-primary/30 bg-primary/5"
                      : "bg-card hover:bg-muted/40"
                  } ${!course.isPublished ? "opacity-50" : ""}`}
                >
                  {/* Reorder */}
                  <div className="flex flex-col gap-0.5">
                    <button
                      onClick={() => moveCourse(course.id, -1)}
                      disabled={idx === 0}
                      aria-label="Move up"
                      className="p-0.5 rounded text-muted-foreground hover:text-foreground disabled:opacity-20 disabled:cursor-default"
                    >
                      <ChevronUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => moveCourse(course.id, 1)}
                      disabled={idx === courses.length - 1}
                      aria-label="Move down"
                      className="p-0.5 rounded text-muted-foreground hover:text-foreground disabled:opacity-20 disabled:cursor-default"
                    >
                      <ChevronDown className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Thumbnail */}
                  <div className="flex-shrink-0 h-10 w-14 rounded-md overflow-hidden bg-muted">
                    {course.thumbnail ? (
                      <img
                        src={course.thumbnail}
                        alt={course.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center">
                        <BookOpen className="h-4 w-4 text-muted-foreground opacity-50" />
                      </div>
                    )}
                  </div>

                  {/* Title + badges */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">
                        {course.title || "Untitled"}
                      </span>
                      {course.isPublished ? (
                        <Badge className="gap-1 text-xs py-0 bg-green-500/15 text-green-700 border-green-200 hover:bg-green-500/20">
                          Published
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs py-0">
                          Draft
                        </Badge>
                      )}
                      {course.isFeatured && (
                        <Badge className="gap-1 text-xs py-0 bg-blue-500/15 text-blue-700 border-blue-200 hover:bg-blue-500/20">
                          <Star className="h-2.5 w-2.5" />
                          Featured
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      {course.instructor ? `By ${course.instructor}` : "—"}{" "}
                      {course.level && (
                        <span className="ml-1 opacity-70">
                          · {course.level}
                        </span>
                      )}
                    </p>
                  </div>

                  {/* Price + access */}
                  <div className="text-right min-w-[110px]">
                    <p className="text-sm font-medium">
                      {Number(course.price ?? 0) === 0
                        ? "Free"
                        : formatINR(course.price)}{" "}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {accessTypeLabel(course.billingCycle)}
                    </p>
                  </div>

                  {/* Module count */}
                  <Badge
                    variant="secondary"
                    className="font-normal text-xs gap-1 hidden sm:flex"
                  >
                    {course.modules?.length ?? 0} modules
                  </Badge>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => togglePublished(course.id)}
                      className="h-8 w-8 p-0 hover:bg-muted"
                      title={
                        course.isPublished
                          ? "Unpublish course"
                          : "Publish course"
                      }
                    >
                      {course.isPublished ? (
                        <Eye className="h-3.5 w-3.5" />
                      ) : (
                        <EyeOff className="h-3.5 w-3.5" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEdit(course)}
                      className={`h-8 w-8 p-0 transition-colors ${
                        editing?.id === course.id
                          ? "bg-primary/10 text-primary hover:bg-primary/20"
                          : "hover:bg-muted"
                      }`}
                      title="Manage course"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setCourseToDelete(course);
                        setDeleteDialogOpen(true);
                      }}
                      className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive transition-colors"
                      title="Delete course"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Live preview */}
          {editing && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-md bg-muted">
                    <Sparkles className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Live preview</CardTitle>
                    <CardDescription className="text-xs mt-0.5">
                      How this card will look on the public course catalog
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex justify-center py-2">
                  <div
                    className={`relative w-full max-w-[280px] rounded-xl border overflow-hidden transition-all ${
                      editing.isFeatured
                        ? "border-primary shadow-md ring-2 ring-primary/20"
                        : "border-border"
                    }`}
                  >
                    {/* Thumbnail */}
                    <div className="h-36 bg-muted w-full relative">
                      {editing.thumbnail ? (
                        <img
                          src={editing.thumbnail}
                          alt={editing.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center">
                          <BookOpen className="h-8 w-8 text-muted-foreground opacity-30" />
                        </div>
                      )}
                      {editing.isFeatured && (
                        <div className="absolute top-2 left-2">
                          <Badge className="gap-1 shadow-sm bg-blue-600 text-white text-xs">
                            <Star className="h-2.5 w-2.5" />
                            Featured
                          </Badge>
                        </div>
                      )}
                      {editing.isPublished ? (
                        <div className="absolute top-2 right-2">
                          <Badge className="text-xs bg-green-500/90 text-white border-0">
                            Published
                          </Badge>
                        </div>
                      ) : (
                        <div className="absolute top-2 right-2">
                          <Badge variant="secondary" className="text-xs">
                            Draft
                          </Badge>
                        </div>
                      )}
                    </div>

                    <div className="p-4">
                      <h3 className="text-base font-semibold leading-tight mb-1">
                        {editing.title || "Course Title"}
                      </h3>
                      <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                        {editing.shortDescription ||
                          "Short description will appear here."}
                      </p>

                      {/* Meta */}
                      <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground mb-3">
                        {editing.instructor && (
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {editing.instructor}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {editing.durationHours}h
                        </span>
                        <span className="flex items-center gap-1">
                          <BarChart2 className="h-3 w-3" />
                          {editing.level}
                        </span>
                      </div>

                      {/* Price + access */}
                      <div className="flex items-baseline gap-1.5 mb-1">
                        <span className="text-xl font-bold">
                          {Number(editing.price ?? 0) === 0
                            ? "Free"
                            : formatINR(editing.price)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mb-4">
                        {accessTypeLabel(editing.billingCycle)}
                      </p>

                      <Button
                        className="w-full mb-4"
                        variant={editing.isFeatured ? "default" : "outline"}
                        size="sm"
                      >
                        {editing.price === 0 ? "Enroll Now" : "View Course"}
                      </Button>

                      {/* Modules */}
                      {editing.modules.length > 0 && (
                        <div className="border-t pt-3">
                          <p className="text-xs font-medium mb-2">
                            Course Modules
                          </p>
                          <div className="space-y-1.5">
                            {editing.modules.map((m, i) => (
                              <div key={i} className="flex items-center gap-2">
                                <Check className="flex-shrink-0 h-3.5 w-3.5 text-primary" />
                                <span className="text-xs text-foreground">
                                  {m.title}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Delete dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete course?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                <p>
                  You're about to permanently delete{" "}
                  <span className="font-medium text-foreground">
                    "{courseToDelete?.title}"
                  </span>
                  . This action cannot be undone.
                </p>
                {courseToDelete?.isFeatured && (
                  <div className="mt-3 flex items-start gap-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    <span>⚠</span>
                    <span>This course is currently marked as featured.</span>
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Delete course
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
