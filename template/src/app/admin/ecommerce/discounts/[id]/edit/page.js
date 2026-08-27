"use client";
import { useParams } from "next/navigation";
import DiscountForm from "@/src/components/admin/ecommerce/DiscountForm";
export default function Route() {
  const { id } = useParams();
  return <DiscountForm mode="edit" id={String(id)} />;
}
