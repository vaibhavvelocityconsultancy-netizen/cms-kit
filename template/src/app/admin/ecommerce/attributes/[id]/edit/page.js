"use client";
import { useParams } from "next/navigation";
import AttributeForm from "@/src/components/admin/ecommerce/AttributeForm";
export default function Route() {
  const { id } = useParams();
  return <AttributeForm mode="edit" id={String(id)} />;
}
