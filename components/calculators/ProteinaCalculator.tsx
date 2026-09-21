"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  calcularProteina,
  PROTEINA_CONTEXTOS,
  type ProteinaContextoKey,
} from "@/lib/calculators";
import { CHROME, useTheme } from "../theme";
import { Card } from "../ui";

export default function ProteinaCalculator({
  pesoInicial,
}: {
  pesoInicial: number | null;
}) {
  const { mode } = useTheme();
  const chrome = CHROME[mode];
  const [peso, setPeso] = useState(pesoInicial?.toString() ?? "");
  const [contexto, setContexto] = useState<ProteinaContextoKey>("treino");

  const field = "touch w-full rounded-xl border px-3 text-base";
  const selectField = "touch w-full rounded-xl border px-3 text-base";
  const fieldStyle = {
    background: "var(--plane)",
    borderColor: "var(--border)",
    color: chrome.ink,
  };

  const contextoAtual = PROTEINA_CONTEXTOS.find((c) => c.key === contexto)!;

  const resultado = useMemo(() => {
    const p = parseFloat(peso.replace(",", "."));
    if (!p || p <= 0) return null;
    return calcularProteina(p, contexto);
  }, [peso, contexto]);

  return (
    <div className="flex flex-col gap-4">
      <Card className="p-5">
        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium" style={{ color: chrome.inkSecondary }}>
              Peso (kg)
            </span>
            <input
              type="text"
              inputMode="decimal"
              value={peso}
              onChange={(e) => setPeso(e.target.value)}
              placeholder="--"
              className={`${field} tabular`}
              style={fieldStyle}
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium" style={{ color: chrome.inkSecondary }}>
              Contexto
            </span>
            <select
              value={contexto}
              onChange={(e) => setContexto(e.target.value as ProteinaContextoKey)}
              className={selectField}
              style={fieldStyle}
            >
              {PROTEINA_CONTEXTOS.map((c) => (
                <option key={c.key} value={c.key}>
                  {c.label}
                </option>
              ))}
            </select>
            <span className="text-xs" style={{ color: chrome.muted }}>
              {contextoAtual.nota}
            </span>
          </label>
        </div>
      </Card>

      <Card className="p-5">
        {resultado ? (
          <>
            <span className="tabular text-4xl leading-none font-semibold" style={{ color: chrome.ink }}>
              {resultado.min === resultado.max
                ? resultado.min
                : `${resultado.min}-${resultado.max}`}
            </span>{" "}
            <span className="text-lg" style={{ color: chrome.inkSecondary }}>
              g / dia
            </span>
          </>
        ) : (
          <p className="text-sm" style={{ color: chrome.muted }}>
            Preenche o peso para veres a referência de proteína.
          </p>
        )}
      </Card>

      <p className="px-1 text-sm leading-relaxed" style={{ color: chrome.muted }}>
        Necessidades individuais variam com idade e função renal.{" "}
        <Link href="/artigos/proteina-e-musculo" style={{ color: chrome.inkSecondary }}>
          Ler mais sobre proteína e músculo
        </Link>
        .
      </p>
    </div>
  );
}
