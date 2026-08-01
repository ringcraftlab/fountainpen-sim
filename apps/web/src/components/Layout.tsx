import { NavLink, Outlet } from 'react-router-dom';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/simulator', label: 'シミュレーター' },
  { to: '/collections', label: 'コレクション' },
  { to: '/inventory', label: '手持ち' },
];

export function Layout() {
  return (
    <div className="min-h-full flex flex-col bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100">
      <header className="border-b border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/70 backdrop-blur">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-semibold">Fountain Pen Buffet</h1>
        </div>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-6">
        <Outlet />
      </main>

      <nav className="sticky bottom-0 border-t border-neutral-200 dark:border-neutral-800 bg-white/90 dark:bg-neutral-900/90 backdrop-blur">
        <ul className="max-w-5xl mx-auto grid grid-cols-3">
          {navItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'block text-center py-3 text-sm',
                    isActive
                      ? 'text-indigo-600 dark:text-indigo-400 font-medium'
                      : 'text-neutral-500 dark:text-neutral-400',
                  )
                }
              >
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
