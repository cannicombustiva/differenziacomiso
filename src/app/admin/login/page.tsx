'use client';

import { useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useLocale } from '@/hooks/useLocale';
import {
  loginReducer,
  initialLoginState,
  resendSecondsLeft,
  type LoginEvent,
  type LoginEffect,
  type LoginState,
} from '@/lib/login-machine';
import styles from './page.module.css';

export default function AdminLoginPage() {
  const { t } = useLocale();
  const router = useRouter();

  const [state, setState] = useState<LoginState>(initialLoginState);
  const [code, setCode] = useState('');
  const [now, setNow] = useState(() => Date.now());

  // The reducer is pure; effects (Supabase calls, redirect) run here. A ref
  // keeps the latest state available to the async effect → event chain.
  const stateRef = useRef(state);
  const codeRef = useRef(code);
  stateRef.current = state;
  codeRef.current = code;

  const apply = async (event: LoginEvent) => {
    const { state: next, effect } = loginReducer(stateRef.current, event);
    stateRef.current = next;
    setState(next);
    if (effect) await runEffect(effect, next);
  };

  const runEffect = async (effect: LoginEffect, current: LoginState) => {
    const supabase = createClient();
    if (effect === 'requestCode') {
      const { error } = await supabase.auth.signInWithOtp({
        email: current.email,
        options: { shouldCreateUser: false },
      });
      await apply(
        error
          ? { type: 'codeRequestFailed', error }
          : { type: 'codeRequestSucceeded', now: Date.now() }
      );
    } else if (effect === 'verifyCode') {
      const { error } = await supabase.auth.verifyOtp({
        email: current.email,
        token: codeRef.current.trim(),
        type: 'email',
      });
      await apply(error ? { type: 'codeVerifyFailed', error } : { type: 'codeVerifySucceeded' });
    } else if (effect === 'redirect') {
      router.replace('/admin');
    }
  };

  // Tick once a second while a resend cooldown is counting down.
  useEffect(() => {
    if (state.step !== 'enterCode' || state.cooldownUntil === null) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [state.step, state.cooldownUntil]);

  const secondsLeft = resendSecondsLeft(state, now);
  const errorText = state.errorKey ? t(state.errorKey) : '';

  return (
    <div className={styles.page} data-admin>
      <div className={styles.card}>
        <div className={styles.head}>
          <span className={styles.logo}>C</span>
          <h1 className={styles.title}>{t('admin.loginTitle')}</h1>
          <p className={styles.subtitle}>{t('admin.loginSubtitle')}</p>
        </div>

        {state.step === 'enterEmail' ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void apply({ type: 'submitEmail', now: Date.now() });
            }}
            className={styles.form}
          >
            <div className={styles.field}>
              <label htmlFor="email" className={styles.label}>{t('admin.email')}</label>
              <input
                id="email"
                type="email"
                value={state.email}
                onChange={(e) => void apply({ type: 'emailChanged', email: e.target.value })}
                className={styles.input}
                required
                autoComplete="email"
              />
            </div>

            {errorText && <p className={styles.error}>{errorText}</p>}

            <button type="submit" className={styles.submit} disabled={state.loading}>
              {state.loading ? t('common.loading') : t('admin.otpRequestCode')}
            </button>
          </form>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void apply({ type: 'submitCode' });
            }}
            className={styles.form}
          >
            <p className={styles.subtitle}>
              {t('admin.otpCodeSentTo')} <strong>{state.email}</strong>
            </p>

            <div className={styles.field}>
              <label htmlFor="code" className={styles.label}>{t('admin.otpCodeLabel')}</label>
              <input
                id="code"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]*"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                className={styles.input}
                required
                autoFocus
              />
            </div>

            {errorText && <p className={styles.error}>{errorText}</p>}

            <button type="submit" className={styles.submit} disabled={state.loading || code.length < 6}>
              {state.loading ? t('common.loading') : t('admin.signIn')}
            </button>

            <div className={styles.actions}>
              <button
                type="button"
                className={styles.linkButton}
                onClick={() => {
                  setCode('');
                  void apply({ type: 'changeEmail' });
                }}
                disabled={state.loading}
              >
                {t('admin.otpChangeEmail')}
              </button>
              <button
                type="button"
                className={styles.linkButton}
                onClick={() => void apply({ type: 'resend', now: Date.now() })}
                disabled={state.loading || secondsLeft > 0}
              >
                {secondsLeft > 0
                  ? `${t('admin.otpResendIn')} ${secondsLeft}s`
                  : t('admin.otpResend')}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
