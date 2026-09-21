"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { calcularRacioCinturaAltura } from "@/lib/calculators";
import { CHROME, useTheme } from "../theme";
import { Card } from "../ui";

export default function RacioCinturaAlturaCalculator({
  cinturaInicial,
  alturaInicial,
}: {
  cinturaInicial: number | null;
  alturaInicial: number | null;
}) {
  const { mode } = useTheme();
  const chrome = CHROME[mode];
  const [cintura, setCintura] = useState(cinturaInicial?.toString() ?? "");
  const [altura, setAltura] = useState(alturaInicial?.toString() ?? "");

  const field = "touch w-full rounded-xl border px-3 text-base";
  const fieldStyle = {
    background: "var(--plane)",
    borderColor: "var(--border)",
    color: chrome.ink,
  };

  const resultado = useMemo(() => {
    const c = parseFloat(cintura.replace(",", "."));
    const a = parseFloat(altura.replace(",", "."));
    if (!c || !a || c <= 0 || a <= 0) return null;
    return calcularRacioCinturaAltura(c, a);
  }, [cintura, altura]);

  return (
    <div className="flex flex-col gap-4">
      <Card className="p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium" style={{ color: chrome.inkSecondary }}>
              Perímetro abdominal (cm)
            </span>
            <input
              type="text"
              inputMode="decimal"
              value={cintura}
              onChange={(e) => setCintura(e.target.value)}
              placeholder="--"
              className={`${field} tabular`}
              style={fieldStyle}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium" style={{ color: chrome.inkSecondary }}>
              Altura (cm)
            </span>
            <input
              type="text"
              inputMode="decimal"
              value={altura}
              onChange={(e) => setAltura(e.target.value)}
              placeholder="--"
              className={`${field} tabular`}
              style={fieldStyle}
            />
          </label>
        </div>
      </Card>

      <Card className="p-5">
        {resultado !== null ? (
          <>
            <span className="tabular text-5xl leading-none font-semibold" style={{ color: chrome.ink }}>
              {resultado.toFixed(2)}
            </span>
            <p className="mt-2 text-sm font-medium" style={{ color: chrome.inkSecondary }}>
              {resultado < 0.5
                ? "Abaixo de 0,5 -- dentro da referência habitual."
                : "Acima de 0,5 -- fora da referência habitual."}
            </p>
          </>
        ) : (
          <p className="text-sm" style={{ color: chrome.muted }}>
            Preenche o perímetro abdominal e a altura para veres o rácio.
          </p>
        )}
      </Card>

      <p className="px-1 text-sm leading-relaxed" style={{ color: chrome.muted }}>
        Um valor de referência de rastreio, não um diagnóstico.{" "}
        <Link href="/artigos/racio-cintura-altura" style={{ color: chrome.inkSecondary }}>
          Ler mais sobre este rácio
        </Link>
        .
      </p>
    </div>
  );
}
