"use client";
import { useParams } from "next/navigation";
import ShippingForm from "@/src/components/admin/ecommerce/ShippingForm";
export default function Route() {
  const { id } = useParams();
  return <ShippingForm mode="edit" id={String(id)} />;
}
