import { Link } from 'react-router';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const { session } = useAuth();

  return (
    <div className="space-y-10">
      <section className="rounded-2xl bg-violet-900 px-6 py-12 text-center text-white">
        <h1 className="text-3xl font-extrabold sm:text-4xl">
          Tu bienestar importa. Tu identidad se protege.
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-violet-100">
          La Voz Silenciosa es la plataforma confidencial de bienestar
          estudiantil del consorcio RUBE-CR: autoevalúa cómo te sientes,
          encuentra servicios de apoyo y pide ayuda sin exponer quién eres.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            to={session ? '/autoevaluacion' : '/registro'}
            className="rounded-lg bg-white px-6 py-3 font-bold text-violet-900 hover:bg-violet-50 focus:outline-4 focus:outline-offset-2 focus:outline-white"
          >
            {session ? 'Hacer mi autoevaluación' : 'Crear mi cuenta anónima'}
          </Link>
          <Link
            to="/directorio"
            className="rounded-lg border-2 border-white px-6 py-3 font-bold text-white hover:bg-violet-800 focus:outline-4 focus:outline-offset-2 focus:outline-white"
          >
            Ver servicios de apoyo
          </Link>
        </div>
      </section>

      <section
        aria-labelledby="como-funciona"
        className="grid gap-6 sm:grid-cols-3"
      >
        <h2 id="como-funciona" className="sr-only">
          Cómo funciona
        </h2>
        {[
          {
            title: 'Autoevalúate con instrumentos validados',
            body: 'Cuestionarios PHQ-9 y GAD-7 revisados por profesionales. El resultado orienta, no diagnostica, y nadie más lo ve.',
          },
          {
            title: 'Encuentra apoyo real',
            body: 'Directorio de servicios de tu universidad y del consorcio, con filtros por modalidad y horario.',
          },
          {
            title: 'Ayuda inmediata 24/7',
            body: 'Un botón siempre visible te conecta con una línea atendida por personas reales, con canal de respaldo si algo falla.',
          },
        ].map((card) => (
          <article
            key={card.title}
            className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
          >
            <h3 className="font-bold text-gray-900">{card.title}</h3>
            <p className="mt-2 text-gray-700">{card.body}</p>
          </article>
        ))}
      </section>

      <section
        aria-labelledby="privacidad"
        className="rounded-xl border border-violet-200 bg-violet-50 p-6"
      >
        <h2 id="privacidad" className="text-lg font-bold text-violet-950">
          Tu privacidad, por diseño (Ley 8968)
        </h2>
        <ul className="mt-3 list-disc space-y-1 pl-6 text-gray-800">
          <li>
            Te registras con tu correo institucional solo para verificar que
            perteneces a una universidad del consorcio; ante los demás, solo
            existe tu seudónimo.
          </li>
          <li>
            Tus respuestas y resultados se guardan cifrados y únicamente tú
            puedes verlos: la seguridad a nivel de fila (RLS) impide accesos
            cruzados.
          </li>
          <li>
            Recolectamos lo mínimo, pedimos tu consentimiento explícito y puedes
            solicitar la eliminación de tus datos.
          </li>
        </ul>
      </section>
    </div>
  );
}
