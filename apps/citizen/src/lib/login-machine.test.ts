import { describe, it, expect } from 'vitest';
import { initialLoginState, loginReducer, resendSecondsLeft } from '@/lib/login-machine';

describe('loginReducer', () => {
  it('requests a code when a valid email is submitted, staying on the email step', () => {
    const state = { ...initialLoginState, email: 'admin@comiso.it' };
    const { state: next, effect } = loginReducer(state, { type: 'submitEmail', now: 1000 });

    expect(effect).toBe('requestCode');
    expect(next.step).toBe('enterEmail');
    expect(next.loading).toBe(true);
    expect(next.errorKey).toBeNull();
  });

  it('rejects an invalid email without requesting a code', () => {
    const state = { ...initialLoginState, email: 'not-an-email' };
    const { state: next, effect } = loginReducer(state, { type: 'submitEmail', now: 1000 });

    expect(effect).toBeUndefined();
    expect(next.step).toBe('enterEmail');
    expect(next.loading).toBe(false);
    expect(next.errorKey).toBe('admin.otpInvalidEmail');
  });

  it('moves to the code step with a started cooldown once the code request succeeds', () => {
    const state = { ...initialLoginState, email: 'admin@comiso.it', loading: true };
    const { state: next, effect } = loginReducer(state, { type: 'codeRequestSucceeded', now: 1000 });

    expect(effect).toBeUndefined();
    expect(next.step).toBe('enterCode');
    expect(next.loading).toBe(false);
    expect(next.cooldownUntil).toBeGreaterThan(1000);
  });

  it('stays on the email step with an error when the code request fails', () => {
    const state = { ...initialLoginState, email: 'admin@comiso.it', loading: true };
    const { state: next, effect } = loginReducer(state, {
      type: 'codeRequestFailed',
      error: new Error('network'),
    });

    expect(effect).toBeUndefined();
    expect(next.step).toBe('enterEmail');
    expect(next.loading).toBe(false);
    expect(next.errorKey).toBe('admin.otpRequestFailed');
  });

  it('blocks resend while the cooldown is active', () => {
    const state = { ...initialLoginState, step: 'enterCode' as const, email: 'admin@comiso.it', cooldownUntil: 5000 };
    const { state: next, effect } = loginReducer(state, { type: 'resend', now: 4000 });

    expect(effect).toBeUndefined();
    expect(next.loading).toBe(false);
  });

  it('allows resend once the cooldown has elapsed', () => {
    const state = { ...initialLoginState, step: 'enterCode' as const, email: 'admin@comiso.it', cooldownUntil: 5000 };
    const { state: next, effect } = loginReducer(state, { type: 'resend', now: 5000 });

    expect(effect).toBe('requestCode');
    expect(next.loading).toBe(true);
  });

  it('verifies the code when submitted from the code step', () => {
    const state = { ...initialLoginState, step: 'enterCode' as const, email: 'admin@comiso.it', cooldownUntil: 5000 };
    const { state: next, effect } = loginReducer(state, { type: 'submitCode' });

    expect(effect).toBe('verifyCode');
    expect(next.loading).toBe(true);
    expect(next.errorKey).toBeNull();
  });

  it('stays on the code step with an error when the code is wrong or expired', () => {
    const state = { ...initialLoginState, step: 'enterCode' as const, email: 'admin@comiso.it', loading: true, cooldownUntil: 5000 };
    const { state: next, effect } = loginReducer(state, {
      type: 'codeVerifyFailed',
      error: { message: 'Token has expired or is invalid' },
    });

    expect(effect).toBeUndefined();
    expect(next.step).toBe('enterCode');
    expect(next.loading).toBe(false);
    expect(next.errorKey).toBe('admin.otpInvalidCode');
  });

  it('signals a redirect when the code is verified successfully', () => {
    const state = { ...initialLoginState, step: 'enterCode' as const, email: 'admin@comiso.it', loading: true, cooldownUntil: 5000 };
    const { effect } = loginReducer(state, { type: 'codeVerifySucceeded' });

    expect(effect).toBe('redirect');
  });

  it('returns to the email step on change email, keeping the email but clearing error and cooldown', () => {
    const state = { step: 'enterCode' as const, email: 'admin@comiso.it', errorKey: 'admin.otpInvalidCode', loading: false, cooldownUntil: 5000 };
    const { state: next, effect } = loginReducer(state, { type: 'changeEmail' });

    expect(effect).toBeUndefined();
    expect(next.step).toBe('enterEmail');
    expect(next.email).toBe('admin@comiso.it');
    expect(next.errorKey).toBeNull();
    expect(next.cooldownUntil).toBeNull();
  });

  it('updates the email and clears any error as the user edits', () => {
    const state = { ...initialLoginState, email: 'bad', errorKey: 'admin.otpInvalidEmail' };
    const { state: next } = loginReducer(state, { type: 'emailChanged', email: 'admin@comiso.it' });

    expect(next.email).toBe('admin@comiso.it');
    expect(next.errorKey).toBeNull();
  });
});

describe('resendSecondsLeft', () => {
  it('is zero when there is no cooldown', () => {
    expect(resendSecondsLeft({ ...initialLoginState, cooldownUntil: null }, 1000)).toBe(0);
  });

  it('is zero once the cooldown has elapsed', () => {
    expect(resendSecondsLeft({ ...initialLoginState, cooldownUntil: 5000 }, 5000)).toBe(0);
  });

  it('rounds the remaining cooldown up to whole seconds', () => {
    expect(resendSecondsLeft({ ...initialLoginState, cooldownUntil: 5000 }, 2300)).toBe(3);
  });
});
