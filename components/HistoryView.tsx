"use client";

import type { Entry } from "@/lib/types";
import DataTransfer from "./DataTransfer";
import HistoryList from "./HistoryList";

export default function HistoryView({ entries }: { entries: Entry[] }) {
  return (
    <div className="flex flex-col gap-4">
      <HistoryList entries={entries} />
      <DataTransfer count={entries.length} />
    </div>
  );
}
