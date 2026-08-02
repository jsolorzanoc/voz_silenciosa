import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { LEVEL_LABELS, RESOURCE_LABELS } from '../../lib/recommendations';
import type {
  AdminOverview,
  AssessmentStat,
  HelpStat,
  ReferralStat,
} from '../../lib/types';

/**
 * Dashboard de indicadores agregados y anónimos (HU-16).
 * Los datos vienen de funciones RPC security definer que solo
 * devuelven conteos: RLS impide leer filas individuales.
 */
export default function StatsAdmin() {
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [assessments, setAssessments] = useState<AssessmentStat[]>([]);
  const [referrals, setReferrals] = useState<ReferralStat[]>([]);
  const [help, setHelp] = useState<HelpStat[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const [o, a, r, h] = await Promise.all([
        supabase.rpc('admin_overview'),
        supabase.rpc('admin_assessment_stats'),
        supabase.rpc('admin_referral_stats'),
        supabase.rpc('admin_help_stats'),
      ]);
      if (o.error || a.error || r.error || h.error) {
        setError('No se pudieron cargar los indicadores.');
        return;
      }
      setOverview((o.data as AdminOverview[])[0] ?? null);
      setAssessments((a.data as AssessmentStat[]) ?? []);
      setReferrals((r.data as ReferralStat[]) ?? []);
      setHelp((h.data as HelpStat[]) ?? []);
    }
    void load();
  }, []);

  if (error) {
    return (
      <p role="alert" className="rounded-md bg-red-100 p-3 text-red-900">
        {error}
      </p>
    );
  }

  const maxAssessment = Math.max(1, ...assessments.map((s) => s.total));

  return (
    <div className="space-y-8">
      {overview && (
        <section
          aria-label="Resumen general"
          className="grid gap-4 sm:grid-cols-3"
        >
          {[
            { label: 'Estudiantes registrados', value: overview.students },
            {
              label: 'Autoevaluaciones realizadas',
              value: overview.assessments_total,
            },
            { label: 'Casos con ruta de crisis', value: overview.crisis_total },
            { label: 'Grupos activos', value: overview.groups_active },
            { label: 'Mensajes por moderar', value: overview.flagged_pending },
            { label: 'Administradores', value: overview.admins },
          ].map((card) => (
            <div
              key={card.label}
              className="rounded-xl border border-gray-200 bg-white p-5 text-center shadow-sm"
            >
              <p className="text-3xl font-extrabold text-violet-900">
                {card.value}
              </p>
              <p className="mt-1 text-sm text-gray-700">{card.label}</p>
            </div>
          ))}
        </section>
      )}

      <section aria-labelledby="niveles">
        <h2 id="niveles" className="text-lg font-bold text-gray-900">
          Autoevaluaciones por nivel de riesgo
        </h2>
        {assessments.length === 0 ? (
          <p className="mt-2 text-gray-600">Sin datos todavía.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {assessments.map((stat) => (
              <li
                key={`${stat.instrument}-${stat.level}`}
                className="flex items-center gap-3"
              >
                <span className="w-56 shrink-0 text-sm text-gray-800">
                  {stat.instrument === 'phq9' ? 'PHQ-9' : 'GAD-7'} ·{' '}
                  {LEVEL_LABELS[stat.level]}
                </span>
                <div className="h-5 flex-1 rounded bg-gray-100">
                  <div
                    className="h-5 rounded bg-violet-700"
                    style={{ width: `${(stat.total / maxAssessment) * 100}%` }}
                  />
                </div>
                <span className="w-8 text-right font-semibold text-gray-900">
                  {stat.total}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="derivaciones">
        <h2 id="derivaciones" className="text-lg font-bold text-gray-900">
          Derivaciones por recurso
        </h2>
        {referrals.length === 0 ? (
          <p className="mt-2 text-gray-600">Sin datos todavía.</p>
        ) : (
          <ul className="mt-3 flex flex-wrap gap-4">
            {referrals.map((stat) => (
              <li
                key={stat.resource}
                className="rounded-xl border border-gray-200 bg-white px-5 py-3 text-center"
              >
                <p className="text-2xl font-extrabold text-violet-900">
                  {stat.total}
                </p>
                <p className="text-sm text-gray-700">
                  {RESOURCE_LABELS[stat.resource]}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="ayuda">
        <h2 id="ayuda" className="text-lg font-bold text-gray-900">
          Uso del botón de ayuda (últimos 30 días)
        </h2>
        {help.length === 0 ? (
          <p className="mt-2 text-gray-600">Sin usos registrados.</p>
        ) : (
          <table className="mt-3 w-full max-w-md border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-gray-300 text-gray-700">
                <th scope="col" className="py-2">
                  Fecha
                </th>
                <th scope="col" className="py-2">
                  Canal
                </th>
                <th scope="col" className="py-2 text-right">
                  Usos
                </th>
              </tr>
            </thead>
            <tbody>
              {help.map((stat) => (
                <tr
                  key={`${stat.day}-${stat.channel}`}
                  className="border-b border-gray-100 text-gray-900"
                >
                  <td className="py-2">{stat.day}</td>
                  <td className="py-2 capitalize">{stat.channel}</td>
                  <td className="py-2 text-right font-semibold">
                    {stat.total}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
