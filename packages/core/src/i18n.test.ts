import { describe, it, expect } from 'vitest';
import { getTranslation } from './i18n';

describe('getTranslation', () => {
  it('reads shared keys in the chosen locale', () => {
    expect(getTranslation('it')('common.loading')).toBe('Caricamento...');
    expect(getTranslation('en')('common.loading')).toBe('Loading...');
  });

  it('does not carry the Admin namespace in the shared dictionaries', () => {
    // The Citizen app loads only these; admin.* would otherwise ship to every phone.
    expect(getTranslation('it')('admin.loginTitle')).toBe('admin.loginTitle');
  });

  it("layers an app's own namespaces over the shared dictionaries", () => {
    const t = getTranslation('en', {
      it: { admin: { signIn: 'Accedi', onlyItalian: 'Solo italiano' } },
      en: { admin: { signIn: 'Sign in' } },
    });

    expect(t('admin.signIn')).toBe('Sign in');
    expect(t('common.loading')).toBe('Loading...');
    // Missing in English: falls back to the app's Italian, as shared keys do.
    expect(t('admin.onlyItalian')).toBe('Solo italiano');
    expect(t('admin.nowhere')).toBe('admin.nowhere');
  });
});
