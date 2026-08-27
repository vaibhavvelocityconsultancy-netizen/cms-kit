import { NextResponse } from "next/server";
import {
  getApprovedCommentsForPost,
  submitComment,
} from "@/src/app/lib/services/posts/comment.service";

// GET /api/posts/[id]/comments - Get approved comments for a post
export async function GET(req, { params }) {
  try {
    const { id: postId } = await params;

    if (!postId) {
      return NextResponse.json(
        { error: "Post ID is required" },
        { status: 400 },
      );
    }

    const comments = await getApprovedCommentsForPost(postId);
    return NextResponse.json(comments);
  } catch (err) {
    console.error("Error fetching comments:", err);
    return NextResponse.json(
      { error: "Failed to fetch comments" },
      { status: 500 },
    );
  }
}

// POST /api/posts/[id]/comments - Submit a new comment
export async function POST(req, { params }) {
  try {
    const { id: postId } = await params;

    if (!postId) {
      return NextResponse.json(
        { error: "Post ID is required" },
        { status: 400 },
      );
    }

    const body = await req.json();
    const { authorName, authorEmail, authorUrl, content, parentId } = body;

    // Basic validation
    if (!authorName || !authorEmail || !content) {
      return NextResponse.json(
        { error: "Name, email, and content are required" },
        { status: 400 },
      );
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(authorEmail)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 },
      );
    }

    // Get client IP and user agent for spam prevention
    const ipAddress =
      req.headers.get("x-forwarded-for") ||
      req.headers.get("x-real-ip") ||
      "unknown";

    const userAgent = req.headers.get("user-agent") || "unknown";

    const comment = await submitComment({
      postId,
      authorName: authorName.trim(),
      authorEmail: authorEmail.trim(),
      authorUrl: authorUrl?.trim() || null,
      content: content.trim(),
      parentId: parentId || null,
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      comment,
      status: comment.status.toLowerCase(), // pending or approved
    });
  } catch (err) {
    console.error("Error submitting comment:", err);
    return NextResponse.json(
      { error: "Failed to submit comment" },
      { status: 500 },
    );
  }
}
