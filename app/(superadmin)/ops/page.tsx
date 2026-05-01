import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { LoginForm } from "./LoginForm"

export const metadata = { title: "Acceder" }

export default async function OpsLoginPage() {
  const session = await auth()
  if (session?.user?.type === "superadmin") redirect("/dashboard")

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Panel izquierdo: fondo abstracto sin texto */}
      <div
        className="hidden lg:block relative overflow-hidden"
        style={{ background: "linear-gradient(145deg, #0a0a0a 0%, #1a1a1a 100%)" }}
      >
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-rule='evenodd'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3Ccircle cx='0' cy='0' r='2'/%3E%3Ccircle cx='60' cy='0' r='2'/%3E%3Ccircle cx='0' cy='60' r='2'/%3E%3Ccircle cx='60' cy='60' r='2'/%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      {/* Panel derecho: formulario sin contexto */}
      <div className="flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h2 className="text-2xl font-bold tracking-tight">Acceder</h2>
          </div>
          <LoginForm />
        </div>
      </div>
    </div>
  )
}
