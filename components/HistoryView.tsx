"use client";

import type { Entry } from "@/lib/types";
import DataTransfer from "./DataTransfer";
import HistoryList from "./HistoryList";

/**
 * So o historico e a copia de seguranca. A conta, os consentimentos e o
 * apagamento vivem em /conta -- misturar definicoes com o registo do dia-a-dia
 * poe accoes que nao se desfazem ao lado de accoes triviais.
 */
export default function HistoryView({
  entries,
  onEdit,
}: {
  entries: Entry[];
  onEdit: (entry: Entry) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <HistoryList entries={entries} onEdit={onEdit} />
      <DataTransfer count={entries.length} />
    </div>
  );
}
