import { useState } from 'react';
import StatsAdmin from './StatsAdmin';
import ServicesAdmin from './ServicesAdmin';
import LinesAdmin from './LinesAdmin';
import GroupsAdmin from './GroupsAdmin';
import ModerationAdmin from './ModerationAdmin';
import UsersAdmin from './UsersAdmin';

/**
 * Panel administrativo (EP-05): indicadores agregados y anónimos,
 * gestión del directorio, líneas de emergencia, grupos, moderación
 * del foro y roles de usuario.
 */

const TABS = [
  { id: 'stats', label: 'Indicadores', component: StatsAdmin },
  { id: 'services', label: 'Directorio', component: ServicesAdmin },
  { id: 'lines', label: 'Líneas de emergencia', component: LinesAdmin },
  { id: 'groups', label: 'Grupos', component: GroupsAdmin },
  { id: 'moderation', label: 'Moderación', component: ModerationAdmin },
  { id: 'users', label: 'Usuarios y roles', component: UsersAdmin },
] as const;

export default function AdminPanel() {
  const [active, setActive] = useState<(typeof TABS)[number]['id']>('stats');
  const ActiveComponent =
    TABS.find((t) => t.id === active)?.component ?? StatsAdmin;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Panel administrativo
        </h1>
        <p className="mt-1 text-gray-700">
          Gestión de bienestar estudiantil. Los indicadores son agregados y
          anónimos: nunca se accede a resultados individuales.
        </p>
      </div>

      <nav aria-label="Secciones del panel" className="flex flex-wrap gap-2">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActive(tab.id)}
            aria-current={active === tab.id ? 'page' : undefined}
            className={`rounded-lg px-4 py-2 font-semibold focus:outline-4 focus:outline-offset-2 focus:outline-violet-700 ${
              active === tab.id
                ? 'bg-violet-800 text-white'
                : 'border border-gray-300 bg-white text-gray-800 hover:bg-violet-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <ActiveComponent />
    </div>
  );
}
