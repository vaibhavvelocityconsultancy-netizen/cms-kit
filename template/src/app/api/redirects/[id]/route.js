import {
  getRedirectById,
  updateRedirect,
  deleteRedirect,
  ServiceError,
} from "@/src/app/lib/services/seo/redirects.service.js";
import { NextResponse } from "next/server";

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const redirect = await getRedirectById(id);
    return NextResponse.json({ success: true, data: redirect });
  } catch (error) {
    if (error instanceof ServiceError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.status },
      );
    }
    return NextResponse.json(
      { success: false, error: "Failed to fetch redirect" },
      { status: 500 },
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const redirect = await updateRedirect(id, body);
    return NextResponse.json({ success: true, data: redirect });
  } catch (error) {
    if (error instanceof ServiceError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.status },
      );
    }
    return NextResponse.json(
      { success: false, error: "Failed to update redirect" },
      { status: 500 },
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    await deleteRedirect(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to delete redirect" },
      { status: 500 },
    );
  }
}
