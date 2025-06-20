"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // Redirecionar para a página de autenticação quando a aplicação iniciar
    router.push("/auth");
  }, [router]);

  // Retorna null pois a página será redirecionada imediatamente
  return null;
}

