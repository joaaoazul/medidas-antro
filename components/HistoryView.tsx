"use client";

"use client";

import Link from "next/link";
import type { Entry } from "@/lib/types";
import DataTransfer from "./DataTransfer";
import HistoryList from "./HistoryList";
import SignOutButton from "./SignOutButton";
import { CHROME, useTheme } from "./theme";
import { Card, SectionTitle } from "./ui";

export default function HistoryView({
  entries,
  email,
  admin,
}: {
  entries: Entry[];
  email: string;
  admin: boolean;
}) {
  const { mode } = useTheme();
  const chrome = CHROME[mode];

  return (
    <div className="flex flex-col gap-4">
      <HistoryList entries={entries} />
      <DataTransfer count={entries.length} />

      <Card className="p-5">
        <SectionTitle hint="Os registos estao presos a esta conta pela propria base de dados: mais ninguem os consegue ler, nem com a chave publica da aplicacao.">
          Conta
        </SectionTitle>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-sm break-all" style={{ color: chrome.inkSecondary }}>
            {email}
          </span>
          <SignOutButton />
        </div>

        <div className="mt-4 flex flex-wrap gap-4 text-xs">
          <Link href="/conta/palavra-passe" style={{ color: chrome.inkSecondary }}>
            Mudar a palavra-passe
          </Link>
          <Link href="/termos" style={{ color: chrome.muted }}>
            Termos
          </Link>
          <Link href="/privacidade" style={{ color: chrome.muted }}>
            Privacidade
          </Link>
          {admin ? (
            <Link href="/admin" style={{ color: chrome.inkSecondary }}>
              Administracao
            </Link>
          ) : null}
        </div>
      </Card>
    </div>
  );
}
