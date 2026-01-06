import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useTodos } from '@/contexts/TodosContext'
import { cn } from '@/lib/utils'

export function Header() {
  const { logout } = useAuth()
  const { isConnected, myTodos } = useTodos()
  const location = useLocation()

  return (
    <header className="flex items-center justify-between p-4 border-b">
      <div className="flex items-center gap-4">
        <Link
          to="/"
          className={cn(
            "font-medium",
            location.pathname === "/" && "underline"
          )}
        >
          Pool
        </Link>
        <Link
          to="/mine"
          className={cn(
            "font-medium",
            location.pathname === "/mine" && "underline"
          )}
        >
          Meine ({myTodos.length})
        </Link>
      </div>
      <div className="flex items-center gap-4">
        <span className={cn(
          "h-2 w-2 rounded-full",
          isConnected ? "bg-green-500" : "bg-red-500"
        )} />
        <button onClick={logout} className="text-sm text-muted-foreground">
          Logout
        </button>
      </div>
    </header>
  )
}
