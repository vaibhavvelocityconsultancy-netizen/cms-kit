"use client";
import { useParams } from "next/navigation";
import CategoryForm from "@/src/components/admin/ecommerce/CategoryForm";
export default function Route() {
  const { id } = useParams();
  return <CategoryForm mode="edit" id={String(id)} />;
}
