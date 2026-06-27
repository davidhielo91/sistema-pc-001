"use client";

import { useRouter } from "next/navigation";
import { aprobarDiagnostico } from "@/lib/actions/diagnosticos";

export function AprobarDiagnostico({
  diagnosticoId,
}: {
  diagnosticoId: string;
}) {
  const router = useRouter();

  return (
    <div className="aprobar-actions">
      <button
        type="button"
        className="btn-primary btn-sm"
        onClick={async () => {
          await aprobarDiagnostico(diagnosticoId, true);
          router.refresh();
        }}
      >
        Aprobar
      </button>
      <button
        type="button"
        className="btn-secondary btn-sm"
        onClick={async () => {
          await aprobarDiagnostico(diagnosticoId, false);
          router.refresh();
        }}
      >
        Rechazar
      </button>
    </div>
  );
}
