import type { Metadata } from "next";
import SuccessClient from "./SuccessClient";

export const metadata: Metadata = {
  title: "Order Confirmed · Nidas",
  robots: { index: false },
};

export default function SuccessPage() {
  return <SuccessClient />;
}
