import { cookies } from "next/headers";
import { requireAuth } from "@/src/app/lib/withPermission";
import { prisma } from "@/src/app/lib/prisma";
import {
  addCartItem,
  clearCart,
  getCart,
  removeCartItem,
  updateCartItem,
} from "@/src/app/lib/services/ecommerce/ecom.cart.service";
import { ApiError } from "@/src/app/lib/utils/ApiError";
import { ApiResponse } from "@/src/app/lib/utils/ApiResponse";
import { asyncHandler } from "@/src/app/lib/utils/asyncHandler";

async function cartContext() {
  const cookieStore = await cookies();
  let sessionId = cookieStore.get("storefront-cart")?.value;
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    cookieStore.set("storefront-cart", sessionId, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });
  }

  let userId;
  let tenantId;
  try {
    const session = await requireAuth();
    userId = Number(session.user.id);
    tenantId = Number(session.user.tenantId);
  } catch (error) {
    if (error?.statusCode !== 401) throw error;
    const tenant = await prisma.tenant.findFirst({
      orderBy: { id: "asc" },
      select: { id: true },
    });
    tenantId = tenant?.id;
  }

  if (!tenantId) throw new ApiError(404, "No storefront tenant configured");
  return { sessionId, tenantId, userId };
}

export const GET = asyncHandler(async () => {
  const context = await cartContext();
  return Response.json(
    new ApiResponse(
      200,
      await getCart(...Object.values(context)),
      "Cart fetched successfully",
    ),
  );
});

export const POST = asyncHandler(async (req) => {
  const context = await cartContext();
  const input = await req.json();
  if (!input.productId) throw new ApiError(400, "Product ID is required");
  return Response.json(
    new ApiResponse(
      200,
      await addCartItem(...Object.values(context), input),
      "Item added to cart",
    ),
  );
});

export const PATCH = asyncHandler(async (req) => {
  const context = await cartContext();
  const input = await req.json();
  if (!input.itemId) throw new ApiError(400, "Cart item ID is required");
  return Response.json(
    new ApiResponse(
      200,
      await updateCartItem(...Object.values(context), input),
      "Cart updated",
    ),
  );
});

export const DELETE = asyncHandler(async (req) => {
  const context = await cartContext();
  const input = await req.json().catch(() => ({}));
  const cart = input.itemId
    ? await removeCartItem(...Object.values(context), input.itemId)
    : await clearCart(...Object.values(context));
  return Response.json(new ApiResponse(200, cart, "Cart updated"));
});

export const dynamic = "force-dynamic";
