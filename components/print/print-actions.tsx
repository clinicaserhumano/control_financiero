"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function PrintActions({ volverHref }: { volverHref: string }) {
  useEffect(() => {
    const t = setTimeout(() => window.print(), 250);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="no-imprimir flex items-center gap-2.5 max-w-[210mm] mx-auto px-4 pt-3">
      <Link href={volverHref} className="btn-ghost btn-sm">
        ← Volver
      </Link>
      <button type="button" onClick={() => window.print()} className="btn-navy btn-sm">
        ↦ Imprimir
      </button>
    </div>
  );
}
