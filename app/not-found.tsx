import Link from "next/link"

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="text-center space-y-4">
        <p className="text-6xl font-bold text-muted-foreground/30">404</p>
        <h2 className="text-xl font-semibold">Página no encontrada</h2>
        <p className="text-sm text-muted-foreground">La página que buscas no existe.</p>
        <Link
          href="/"
          className="inline-block px-4 py-2 rounded-md border text-sm hover:bg-muted transition-colors"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  )
}
