/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { Profile } from '../lib/types';

/**
 * Sesión y perfil del usuario (HU-08).
 * El perfil expone solo el seudónimo: el correo real nunca se muestra
 * a otros usuarios ni se asocia a resultados visibles.
 */

interface AuthContextValue {
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (
    email: string,
    password: string,
    pseudonym: string,
  ) => Promise<{ error: string | null }>;
  signIn: (
    email: string,
    password: string,
  ) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function friendlyAuthError(message: string): string {
  const map: [RegExp, string][] = [
    [/invalid login credentials/i, 'Correo o contraseña incorrectos.'],
    [
      /email not confirmed/i,
      'Debes confirmar tu correo institucional antes de ingresar.',
    ],
    [
      /correos institucionales/i,
      'Solo se aceptan correos institucionales de las universidades del consorcio RUBE-CR.',
    ],
    [
      /database error saving new user/i,
      'No se pudo crear la cuenta. Verifica que el correo sea institucional y que el seudónimo no esté en uso.',
    ],
    [
      /user already registered/i,
      'Ya existe una cuenta con ese correo institucional.',
    ],
    [
      /password should be at least/i,
      'La contraseña debe tener al menos 8 caracteres.',
    ],
  ];
  const found = map.find(([pattern]) => pattern.test(message));
  return found ? found[1] : message;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) {
      setProfile(null);
      return;
    }
    let cancelled = false;
    supabase
      .from('profiles')
      .select('id, pseudonym, university_id, role')
      .eq('id', session.user.id)
      .single()
      .then(({ data }) => {
        if (!cancelled) setProfile(data);
      });
    return () => {
      cancelled = true;
    };
  }, [session]);

  const signUp = useCallback(
    async (email: string, password: string, pseudonym: string) => {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { pseudonym } },
      });
      return { error: error ? friendlyAuthError(error.message) : null };
    },
    [],
  );

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error: error ? friendlyAuthError(error.message) : null };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  return (
    <AuthContext.Provider
      value={{ session, profile, loading, signUp, signIn, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
