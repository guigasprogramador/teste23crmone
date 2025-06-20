import Link from "next/link"

export default function TestePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold mb-8">Página de Teste</h1>
        <p className="mb-4">Esta é uma página de teste simples</p>
        <div className="mt-8">
          <Link href="/" className="text-blue-500 underline">
            Voltar para a página inicial
          </Link>
        </div>
      </div>
    </main>
  )
}

