"use client";
import { useParams } from "next/navigation";
import BrandForm from "@/src/components/admin/ecommerce/BrandForm";
export default function Route() {
  const { id } = useParams();
  return <BrandForm mode="edit" id={String(id)} />;
}
