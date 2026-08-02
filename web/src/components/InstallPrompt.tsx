import { useEffect, useState } from 'react';

/**
 * Aviso de instalación de la PWA (HU-18, WBS 1.6.1.1).
 * Captura el evento beforeinstallprompt del navegador y ofrece
 * instalar la app en el teléfono con un toque.
 */

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_KEY = 'lvs_install_dismissed';

export default function InstallPrompt() {
  const [promptEvent, setPromptEvent] =
    useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (localStorage.getItem(DISMISS_KEY)) return;
    const handler = (event: Event) => {
      event.preventDefault();
      setPromptEvent(event as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  if (!promptEvent) return null;

  async function install() {
    if (!promptEvent) return;
    await promptEvent.prompt();
    const choice = await promptEvent.userChoice;
    if (choice.outcome === 'dismissed') {
      localStorage.setItem(DISMISS_KEY, '1');
    }
    setPromptEvent(null);
  }

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, '1');
    setPromptEvent(null);
  }

  return (
    <div className="border-b border-violet-200 bg-violet-50 px-4 py-3">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-gray-800">
          📱 Instala <strong>La Voz Silenciosa</strong> en tu teléfono para
          acceder rápido, incluso con mala conexión.
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => void install()}
            className="rounded-lg bg-violet-800 px-4 py-1.5 text-sm font-bold text-white hover:bg-violet-900 focus:outline-4 focus:outline-offset-2 focus:outline-violet-700"
          >
            Instalar
          </button>
          <button
            type="button"
            onClick={dismiss}
            className="rounded-lg px-3 py-1.5 text-sm font-semibold text-gray-700 hover:bg-violet-100 focus:outline-2 focus:outline-violet-700"
          >
            Ahora no
          </button>
        </div>
      </div>
    </div>
  );
}
