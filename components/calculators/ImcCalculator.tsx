"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { calcularImc, categoriaImc, IMC_CATEGORIAS, IMC_DOMINIO_MAX } from "@/lib/calculators";
import { CHROME, useTheme } from "../theme";
import { Card } from "../ui";
import { RangeBar } from "./RangeBar";

export default function ImcCalculator({
  pesoInicial,
  alturaInicial,
}: {
  pesoInicial: number | null;
  alturaInicial: number | null;
}) {
  const { mode } = useTheme();
  const chrome = CHROME[mode];
  const [peso, setPeso] = useState(pesoInicial?.toString() ?? "");
  const [altura, setAltura] = useState(alturaInicial?.toString() ?? "");

  const field = "touch w-full rounded-xl border px-3 text-base";
  const fieldStyle = {
    background: "var(--plane)",
    borderColor: "var(--border)",
    color: chrome.ink,
  };

  const resultado = useMemo(() => {
    const p = parseFloat(peso.replace(",", "."));
    const a = parseFloat(altura.replace(",", "."));
    if (!p || !a || p <= 0 || a <= 0) return null;
    const imc = calcularImc(p, a);
    return { imc, categoria: categoriaImc(imc) };
  }, [peso, altura]);

  return (
    <div className="flex flex-col gap-4">
      <Card className="p-5">
        <div className="grid gap-4 sm:grid-cols-2">
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
        {resultado ? (
          <>
            <span className="tabular text-5xl leading-none font-semibold" style={{ color: chrome.ink }}>
              {resultado.imc.toFixed(1)}
            </span>
            <p className="mt-2 text-sm font-medium" style={{ color: resultado.categoria.cor }}>
              {resultado.categoria.label}
            </p>
            <RangeBar categorias={IMC_CATEGORIAS} dominioMax={IMC_DOMINIO_MAX} valor={resultado.imc} />
            <div className="flex justify-between text-xs" style={{ color: chrome.muted }}>
              <span>0</span>
              <span>{IMC_DOMINIO_MAX}+</span>
            </div>
          </>
        ) : (
          <p className="text-sm" style={{ color: chrome.muted }}>
            Preenche o peso e a altura para veres o IMC.
          </p>
        )}
      </Card>

      <p className="px-1 text-sm leading-relaxed" style={{ color: chrome.muted }}>
        O IMC não distingue músculo de gordura, nem diz onde no corpo ela
        está.{" "}
        <Link href="/artigos/limitacoes-do-imc" style={{ color: chrome.inkSecondary }}>
          Ler porque isso importa
        </Link>
        .
      </p>
    </div>
  );
}
