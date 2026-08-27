"use client";
import { useParams } from "next/navigation";
import OrderDetailPage from "@/src/components/admin/ecommerce/OrderDetailPage";
export default function Route() {
  const { id } = useParams();
  return <OrderDetailPage id={String(id)} />;
}
