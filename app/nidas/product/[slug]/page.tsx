import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { PRODUCTS, getProduct } from "../../lib/catalog";
import ProductView from "../../components/ProductView";

export function generateStaticParams() {
  return PRODUCTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) return { title: "Nidas" };
  return {
    title: `${product.name} · Nidas`,
    description: product.description,
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) notFound();

  return (
    <section className="px-[var(--gutter)] pt-10 pb-24">
      <div className="max-w-[88rem] mx-auto">
        <Link href="/nidas" className="n-label inline-flex items-center gap-2 mb-8" style={{ color: "var(--faded)" }}>
          <span aria-hidden="true">←</span> All Pieces
        </Link>
        <ProductView product={product} />
      </div>
    </section>
  );
}
