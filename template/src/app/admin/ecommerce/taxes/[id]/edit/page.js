"use client";
import { useParams } from "next/navigation";
import TaxForm from "@/src/components/admin/ecommerce/TaxForm";
export default function Route() {
  const { id } = useParams();
  return <TaxForm mode="edit" id={String(id)} />;
}
