export type LoginStep = 'enterEmail' | 'enterCode';

export interface LoginState {
  step: LoginStep;
  email: string;
  errorKey: string | null;
  loading: boolean;
  cooldownUntil: number | null;
}

export type LoginEvent =
  | { type: 'emailChanged'; email: string }
  | { type: 'submitEmail'; now: number }
  | { type: 'codeRequestSucceeded'; now: number }
  | { type: 'codeRequestFailed'; error: unknown }
  | { type: 'submitCode' }
  | { type: 'codeVerifySucceeded' }
  | { type: 'codeVerifyFailed'; error: unknown }
  | { type: 'changeEmail' }
  | { type: 'resend'; now: number };

export type LoginEffect = 'requestCode' | 'verifyCode' | 'redirect';

export interface LoginResult {
  state: LoginState;
  effect?: LoginEffect;
}

export const initialLoginState: LoginState = {
  step: 'enterEmail',
  email: '',
  errorKey: null,
  loading: false,
  cooldownUntil: null,
};

export const RESEND_COOLDOWN_MS = 60_000;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidEmail(email: string): boolean {
  return EMAIL_PATTERN.test(email.trim());
}

/** Whole seconds remaining before resend is allowed; 0 when the cooldown has elapsed or is unset. */
export function resendSecondsLeft(state: LoginState, now: number): number {
  if (state.cooldownUntil === null || now >= state.cooldownUntil) {
    return 0;
  }
  return Math.ceil((state.cooldownUntil - now) / 1000);
}

export function loginReducer(state: LoginState, event: LoginEvent): LoginResult {
  switch (event.type) {
    case 'emailChanged':
      return { state: { ...state, email: event.email, errorKey: null } };
    case 'submitEmail':
      if (!isValidEmail(state.email)) {
        return { state: { ...state, errorKey: 'admin.otpInvalidEmail' } };
      }
      return {
        state: { ...state, loading: true, errorKey: null },
        effect: 'requestCode',
      };
    case 'codeRequestSucceeded':
      return {
        state: {
          ...state,
          step: 'enterCode',
          loading: false,
          errorKey: null,
          cooldownUntil: event.now + RESEND_COOLDOWN_MS,
        },
      };
    case 'resend':
      if (state.cooldownUntil !== null && event.now < state.cooldownUntil) {
        return { state };
      }
      return {
        state: { ...state, loading: true, errorKey: null },
        effect: 'requestCode',
      };
    case 'submitCode':
      return {
        state: { ...state, loading: true, errorKey: null },
        effect: 'verifyCode',
      };
    case 'codeRequestFailed':
      return {
        state: { ...state, loading: false, errorKey: 'admin.otpRequestFailed' },
      };
    case 'codeVerifyFailed':
      return {
        state: { ...state, loading: false, errorKey: 'admin.otpInvalidCode' },
      };
    case 'codeVerifySucceeded':
      return { state: { ...state, loading: false }, effect: 'redirect' };
    case 'changeEmail':
      return {
        state: { ...state, step: 'enterEmail', errorKey: null, loading: false, cooldownUntil: null },
      };
    default:
      return { state };
  }
}
