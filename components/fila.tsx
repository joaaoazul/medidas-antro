"use client";

import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import {
  chave,
  descartar as descartarDaFila,
  enfileirar,
  enviar,
  ler,
  type Pendente,
  type ResultadoEnvio,
} from "@/lib/fila-offline";
import type { EntryInput } from "@/lib/validation";

/**
 * A fila offline, vista do React.
 *
 * Vive no localStorage, que e uma fonte externa ao React -- o mesmo caso do
 * tema, e com o mesmo mecanismo: useSyncExternalStore. O snapshot e o TEXTO
 * guardado e nao a lista ja lida, porque o snapshot tem de ser igual por
 * valor entre leituras; uma lista nova a cada leitura faria o React
 * re-renderizar sem fim.
 */
const ouvintes = new Set<() => void>();

function avisar() {
  for (const ouvinte of ouvintes) ouvinte();
}

function subscrever(ouvinte: () => void) {
  ouvintes.add(ouvinte);
  // Outro separador do browser a mexer na mesma fila.
  window.addEventListener("storage", ouvinte);
  return () => {
    ouvintes.delete(ouvinte);
    window.removeEventListener("storage", ouvinte);
  };
}

export type EstadoEnvio =
  | { tipo: "parado" }
  | { tipo: "a-enviar" }
  | { tipo: "enviadas"; n: number }
  | { tipo: "sem-rede" }
  | { tipo: "sem-sessao" }
  | { tipo: "servidor" };

function paraEstado(r: ResultadoEnvio): EstadoEnvio {
  return r.parou ? { tipo: r.parou } : { tipo: "enviadas", n: r.enviadas };
}

export type Fila = {
  pendentes: Pendente[];
  estado: EstadoEnvio;
  /** Guarda no aparelho. Lanca se o armazenamento recusar. */
  guardar: (entrada: EntryInput) => Pendente;
  descartar: (id: string) => void;
  /** Enviar pedido pela pessoa: mostra o progresso enquanto decorre. */
  enviarAgora: () => Promise<void>;
};

export function useFila(userId: string): Fila {
  const router = useRouter();

  const bruto = useSyncExternalStore(
    subscrever,
    () => {
      try {
        return localStorage.getItem(chave(userId)) ?? "";
      } catch {
        return "";
      }
    },
    // O servidor nao ve o aparelho: fila vazia, e o valor real entra a
    // seguir a hidratacao, sem divergencia.
    () => "",
  );

  // `bruto` e o que muda; e so por ele que a lista se volta a ler.
  const pendentes = useMemo(
    () => (bruto ? ler(localStorage, userId) : []),
    [bruto, userId],
  );

  const [estado, setEstado] = useState<EstadoEnvio>({ tipo: "parado" });
  // Dois envios ao mesmo tempo (o evento "online" e uma gravacao, juntos) nao
  // duplicavam nada -- o envio e idempotente pelo id -- mas faziam pedidos a
  // dobrar. Um de cada vez.
  const aEnviar = useRef(false);

  /*
   * So envia; nao toca em estado do React nenhum.
   *
   * A separacao e o que deixa o efeito de baixo arrancar o envio sem um
   * setState sincrono la dentro -- que forcava um segundo render logo ao
   * montar. O estado muda quando o resultado chega, e so entao.
   */
  const correr = useCallback(async (): Promise<ResultadoEnvio | null> => {
    if (aEnviar.current) return null;
    try {
      if (!ler(localStorage, userId).some((p) => !p.falha)) return null;
    } catch {
      return null;
    }

    aEnviar.current = true;
    try {
      const r = await enviar(localStorage, userId, fetch);
      avisar();
      if (r.enviadas > 0) router.refresh();
      return r;
    } finally {
      aEnviar.current = false;
    }
  }, [router, userId]);

  useEffect(() => {
    // Ao abrir a app, e sempre que a rede volta.
    const tentar = () => {
      void correr().then((r) => {
        if (r) setEstado(paraEstado(r));
      });
    };
    tentar();
    window.addEventListener("online", tentar);
    return () => window.removeEventListener("online", tentar);
  }, [correr]);

  const enviarAgora = useCallback(async () => {
    setEstado({ tipo: "a-enviar" });
    const r = await correr();
    setEstado(r ? paraEstado(r) : { tipo: "parado" });
  }, [correr]);

  const guardar = useCallback(
    (entrada: EntryInput) => {
      const p = enfileirar(localStorage, userId, entrada, () =>
        crypto.randomUUID(),
      );
      avisar();
      return p;
    },
    [userId],
  );

  const descartar = useCallback(
    (id: string) => {
      descartarDaFila(localStorage, userId, id);
      avisar();
    },
    [userId],
  );

  return { pendentes, estado, guardar, descartar, enviarAgora };
}
