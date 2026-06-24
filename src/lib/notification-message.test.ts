import { describe, it, expect } from 'vitest';
import { buildNotificationMessage } from '@/lib/notification-message';

describe('buildNotificationMessage', () => {
  it('lists tomorrow\'s waste types for a collection day', () => {
    const rows = [
      { is_holiday: false, holiday_note_it: null, waste_types: { name_it: 'Umido' } },
      { is_holiday: false, holiday_note_it: null, waste_types: { name_it: 'Vetro' } },
    ];
    expect(buildNotificationMessage(rows)).toBe('Domani si raccoglie: Umido, Vetro');
  });

  it('says no collection when there are no rows', () => {
    expect(buildNotificationMessage([])).toBe('Domani non si effettua la raccolta');
  });

  it('appends the holiday note when a holiday has one', () => {
    const rows = [
      { is_holiday: true, holiday_note_it: 'Festa della Repubblica', waste_types: null },
    ];
    expect(buildNotificationMessage(rows)).toBe(
      'Domani non si effettua la raccolta (Festa della Repubblica)'
    );
  });

  it('collapses duplicate waste type names', () => {
    const rows = [
      { is_holiday: false, holiday_note_it: null, waste_types: { name_it: 'Umido' } },
      { is_holiday: false, holiday_note_it: null, waste_types: { name_it: 'Umido' } },
      { is_holiday: false, holiday_note_it: null, waste_types: { name_it: 'Lattine' } },
    ];
    expect(buildNotificationMessage(rows)).toBe('Domani si raccoglie: Umido, Lattine');
  });
});
