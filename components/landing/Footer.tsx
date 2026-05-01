export function Footer() {
  return (
    <footer className="border-t border-slate-200/80 py-10 px-6 bg-white/75 backdrop-blur">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-md bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
            <span className="w-2 h-2 rounded-full bg-white" />
          </span>
          <span className="font-bold text-sm">FrescoEnVivo</span>
        </div>

        <p className="text-xs text-gray-400">
          © {new Date().getFullYear()} FrescoEnVivo. Todos los derechos reservados.
        </p>

        <div className="flex items-center gap-5 text-xs text-gray-400">
          <a href="#" className="hover:text-gray-600 transition-colors">Privacidad</a>
          <a href="#" className="hover:text-gray-600 transition-colors">Términos</a>
        </div>
      </div>
    </footer>
  )
}
