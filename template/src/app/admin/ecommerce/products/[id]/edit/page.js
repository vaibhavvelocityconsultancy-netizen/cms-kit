"use client";

import { useParams } from "next/navigation";
import ProductForm from "@/src/components/admin/ecommerce/ProductForm";

export default function EditProductRoute() {
  const { id } = useParams();
  return <ProductForm mode="edit" productId={String(id)} />;
}
