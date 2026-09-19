import type { Metadata } from "next";
import AuthForm from "@/components/AuthForm";

export const metadata: Metadata = {
  title: "Entrar - Medidas",
};

export default function EntrarPage() {
  return (
    <main>
      <AuthForm />
    </main>
  );
}
