import { describe, it, expect } from 'vitest';
import { searchRiciclabolario } from '@/lib/riciclabolario-search';
import type { RiciclabolarioItem } from '@/types';

function item(over: Partial<RiciclabolarioItem> & { id: string }): RiciclabolarioItem {
  return {
    item_name_it: '',
    waste_type_id: '1',
    created_at: '',
    ...over,
  };
}

const CAFFE = item({ id: '1', item_name_it: 'Fondi di caffè' });

describe('searchRiciclabolario', () => {
  it('matches accented item names from an unaccented query', () => {
    // "caffe" should find "caffè" — the killer path for Italian users.
    expect(searchRiciclabolario([CAFFE], 'caffe')).toEqual([CAFFE]);
  });

  it('returns every item for a blank query', () => {
    const items = [CAFFE, item({ id: '2', item_name_it: 'Bottiglia' })];
    expect(searchRiciclabolario(items, '   ')).toEqual(items);
  });

  it('matches text found only in the disposal tip', () => {
    const sciacqua = item({ id: '3', item_name_it: 'Lattina', tip_it: 'Sciacqua prima di gettare' });
    expect(searchRiciclabolario([sciacqua], 'sciacqua')).toEqual([sciacqua]);
  });

  it('searches the English name and tip too, and excludes non-matches', () => {
    const bottle = item({ id: '4', item_name_it: 'Bottiglia', item_name_en: 'Plastic bottle' });
    const peels = item({ id: '5', item_name_it: 'Bucce', tip_en: 'Compost at home' });
    const can = item({ id: '6', item_name_it: 'Lattina' });
    const items = [bottle, peels, can];
    expect(searchRiciclabolario(items, 'plastic')).toEqual([bottle]);
    expect(searchRiciclabolario(items, 'compost')).toEqual([peels]);
    expect(searchRiciclabolario(items, 'zzz')).toEqual([]);
  });
});
