"use client";
import { useParams } from "next/navigation";
import CustomerDetailPage from "@/src/components/admin/ecommerce/CustomerDetailPage";
export default function Route() {
  const { id } = useParams();
  return <CustomerDetailPage id={String(id)} />;
}
