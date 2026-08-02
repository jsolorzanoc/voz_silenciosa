import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from 'react';
import { Link, useParams } from 'react-router';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { containsRiskContent } from '../lib/moderation';
import { formatSessionDate } from '../lib/dates';
import type { GroupMessage, GroupSession, SupportGroup } from '../lib/types';

/**
 * Foro confidencial en tiempo real con seudónimo (HU-13).
 *
 * - Solo miembros del grupo (RLS); los mensajes muestran únicamente el
 *   seudónimo, fijado por el servidor al insertar.
 * - Supabase Realtime entrega los mensajes nuevos respetando RLS.
 * - Moderación (WBS 1.4.3.2): el trigger marca contenido de riesgo para
 *   revisión humana; aquí, además, se ofrece apoyo inmediato a quien lo
 *   escribió y cualquier miembro puede reportar un mensaje.
 */
export default function GroupForum() {
  const { id: groupId } = useParams<{ id: string }>();
  const { session, profile } = useAuth();
  const [group, setGroup] = useState<SupportGroup | null>(null);
  const [isMember, setIsMember] = useState<boolean | null>(null);
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [sessions, setSessions] = useState<GroupSession[]>([]);
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [careNotice, setCareNotice] = useState(false);
  const [reported, setReported] = useState<Set<string>>(new Set());
  const bottomRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    if (!groupId) return;
    const [groupRes, memberRes, messagesRes, sessionsRes] = await Promise.all([
      supabase
        .from('support_groups')
        .select('id, university_id, name, topic, description, active')
        .eq('id', groupId)
        .maybeSingle(),
      supabase.from('group_members').select('group_id').eq('group_id', groupId),
      supabase
        .from('group_messages')
        .select('*')
        .eq('group_id', groupId)
        .order('created_at', { ascending: true })
        .limit(200),
      supabase
        .from('group_sessions')
        .select('id, group_id, title, starts_at, modality, location')
        .eq('group_id', groupId)
        .gte('starts_at', new Date().toISOString())
        .order('starts_at'),
    ]);
    setGroup(groupRes.data ?? null);
    setIsMember((memberRes.data ?? []).length > 0);
    setMessages(messagesRes.data ?? []);
    setSessions(sessionsRes.data ?? []);
  }, [groupId]);

  useEffect(() => {
    void load();
  }, [load]);

  // Suscripción en tiempo real (respeta RLS: solo miembros reciben)
  useEffect(() => {
    if (!groupId || !isMember) return;
    const channel = supabase
      .channel(`foro-${groupId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'group_messages',
          filter: `group_id=eq.${groupId}`,
        },
        (payload) => {
          const message = payload.new as GroupMessage;
          setMessages((prev) =>
            prev.some((m) => m.id === message.id) ? prev : [...prev, message],
          );
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'group_messages',
          filter: `group_id=eq.${groupId}`,
        },
        (payload) => {
          const message = payload.new as GroupMessage;
          setMessages((prev) =>
            message.hidden
              ? prev.filter((m) => m.id !== message.id)
              : prev.map((m) => (m.id === message.id ? message : m)),
          );
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [groupId, isMember]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' });
  }, [messages.length]);

  async function send(event: FormEvent) {
    event.preventDefault();
    if (!session || !groupId) return;
    const text = content.trim();
    if (!text) return;

    setSending(true);
    setError(null);
    const { error: sendError } = await supabase.from('group_messages').insert({
      group_id: groupId,
      user_id: session.user.id,
      content: text,
    });
    setSending(false);

    if (sendError) {
      setError('No se pudo enviar el mensaje. Intenta de nuevo.');
      return;
    }
    // Apoyo inmediato a quien escribió contenido de riesgo: el mensaje
    // se publica (no se censura) y se acompaña, no se castiga.
    setCareNotice(containsRiskContent(text));
    setContent('');
  }

  async function report(messageId: string) {
    if (!session) return;
    await supabase
      .from('message_reports')
      .insert({ message_id: messageId, reporter_id: session.user.id });
    setReported((prev) => new Set(prev).add(messageId));
  }

  if (isMember === null) {
    return (
      <p role="status" className="p-8 text-center text-gray-600">
        Cargando foro…
      </p>
    );
  }

  if (!group) {
    return (
      <div className="py-16 text-center">
        <h1 className="text-2xl font-bold text-gray-900">
          Grupo no disponible
        </h1>
        <Link
          to="/grupos"
          className="mt-4 inline-block font-semibold text-violet-800 underline"
        >
          Volver a grupos
        </Link>
      </div>
    );
  }

  if (!isMember) {
    return (
      <div className="py-16 text-center">
        <h1 className="text-2xl font-bold text-gray-900">{group.name}</h1>
        <p className="mt-3 text-gray-700">
          Debes unirte al grupo para participar en su foro confidencial.
        </p>
        <Link
          to="/grupos"
          className="mt-4 inline-block rounded-lg bg-violet-800 px-6 py-3 font-bold text-white hover:bg-violet-900"
        >
          Ir a grupos y unirme
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{group.name}</h1>
        <p className="text-sm text-gray-600">
          Foro confidencial: aquí solo existe tu seudónimo. Sé amable; un equipo
          humano modera el espacio.
        </p>
      </div>

      {sessions.length > 0 && (
        <section
          aria-label="Próximas sesiones del grupo"
          className="rounded-xl border border-violet-200 bg-violet-50 p-4 text-sm text-gray-800"
        >
          {sessions.map((s) => (
            <p key={s.id}>
              📅 <span className="font-semibold">{s.title}</span> ·{' '}
              {formatSessionDate(s.starts_at)} ·{' '}
              {s.modality === 'virtual' ? 'Virtual' : 'Presencial'}
              {s.location ? ` · ${s.location}` : ''}
            </p>
          ))}
        </section>
      )}

      <ul
        aria-label="Mensajes del foro"
        aria-live="polite"
        className="flex max-h-[50vh] flex-col gap-3 overflow-y-auto rounded-xl border border-gray-200 bg-white p-4"
      >
        {messages.length === 0 && (
          <li className="py-8 text-center text-gray-600">
            Aún no hay mensajes. Rompe el hielo con un saludo.
          </li>
        )}
        {messages.map((message) => {
          const own = message.user_id === session?.user.id;
          return (
            <li
              key={message.id}
              className={`max-w-[85%] rounded-xl p-3 ${
                own ? 'self-end bg-violet-100' : 'self-start bg-gray-100'
              }`}
            >
              <p className="text-xs font-bold text-violet-900">
                {own
                  ? `${profile?.pseudonym ?? 'Tú'} (tú)`
                  : message.author_pseudonym}
              </p>
              <p className="whitespace-pre-wrap text-gray-900">
                {message.content}
              </p>
              <div className="mt-1 flex items-center gap-3 text-xs text-gray-500">
                <span>{formatSessionDate(message.created_at)}</span>
                {!own &&
                  (reported.has(message.id) ? (
                    <span className="font-semibold text-amber-700">
                      Reportado ✓
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => void report(message.id)}
                      className="font-semibold text-gray-600 underline hover:text-red-700 focus:outline-2 focus:outline-violet-700"
                    >
                      Reportar
                    </button>
                  ))}
              </div>
            </li>
          );
        })}
        <div ref={bottomRef} />
      </ul>

      {careNotice && (
        <div
          role="alert"
          className="rounded-xl border-2 border-red-700 bg-red-50 p-4 text-gray-900"
        >
          <p className="font-bold text-red-900">
            Leímos tu mensaje y nos importa cómo estás.
          </p>
          <p className="mt-1">
            No tienes que pasar por esto en soledad. El botón rojo{' '}
            <strong>Ayuda 24/7</strong> (abajo a la derecha) te conecta ahora
            mismo con una persona real. Tu mensaje sigue en el foro y una
            persona del equipo de bienestar podrá acompañarte.
          </p>
        </div>
      )}

      {error && (
        <p role="alert" className="rounded-md bg-red-100 p-3 text-red-900">
          {error}
        </p>
      )}

      <form onSubmit={(e) => void send(e)} className="flex gap-2">
        <label htmlFor="mensaje" className="sr-only">
          Escribe un mensaje para el grupo
        </label>
        <textarea
          id="mensaje"
          rows={2}
          maxLength={2000}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Escribe con respeto y desde tu experiencia…"
          className="flex-1 rounded-lg border border-gray-400 px-3 py-2 focus:outline-2 focus:outline-violet-700"
        />
        <button
          type="submit"
          disabled={sending || content.trim().length === 0}
          className="self-end rounded-lg bg-violet-800 px-5 py-2 font-bold text-white hover:bg-violet-900 focus:outline-4 focus:outline-offset-2 focus:outline-violet-700 disabled:opacity-50"
        >
          Enviar
        </button>
      </form>
    </div>
  );
}
