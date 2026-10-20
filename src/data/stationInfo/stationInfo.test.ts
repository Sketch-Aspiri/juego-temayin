import { describe, expect, it } from 'vitest';
import { ALL_LEVELS, BONUS_LEVELS, SEASONAL_LEVELS } from '../worlds';
import { STATIONS } from '../stations';
import { STATION_INFO } from './index';
import { guideUrl, pageLabel } from './types';

describe('Fichas de viaje de la campaña', () => {
  it('cubre cada destino principal y no revela los secretos ni el especial', () => {
    expect(Object.keys(STATION_INFO).sort()).toEqual(ALL_LEVELS.map(level => level.id).sort());
    for (const level of [...BONUS_LEVELS, ...SEASONAL_LEVELS]) expect(STATION_INFO[level.id]).toBeUndefined();
  });

  it('ofrece una descripción breve y tres datos distintos, todos con fuentes', () => {
    for (const info of Object.values(STATION_INFO)) {
      expect(info.location.length).toBeGreaterThan(5);
      expect(info.description.text.split(/\s+/).length).toBeGreaterThanOrEqual(35);
      expect(info.description.text.split(/\s+/).length).toBeLessThanOrEqual(65);
      expect(info.facts).toHaveLength(3);
      expect(new Set(info.facts.map(fact => fact.text)).size).toBe(3);
      const sources = info.facts.map(fact => fact.source);
      if (info.description.source !== 'game') sources.push(info.description.source);
      for (const source of sources) {
        const [first, last] = source.printedPages;
        expect(source.section.length).toBeGreaterThan(5);
        expect(Number.isInteger(first) && Number.isInteger(last)).toBe(true);
        expect(first).toBeGreaterThanOrEqual(4);
        expect(last).toBeGreaterThanOrEqual(first);
        expect(last).toBeLessThanOrEqual(253);
        expect(source.pdfPage).toBe(Math.floor(first / 2) + 2);
        expect(guideUrl(source)).toBe(`https://www.trenmaya.gob.mx/images/granguiainah.pdf#page=${source.pdfPage}`);
        expect(pageLabel(source)).toContain(String(first));
      }
    }
  });

  it('distingue la ficción del contexto cultural y explica la cobertura regional', () => {
    for (const [id, info] of Object.entries(STATION_INFO)) {
      expect(info.relation === 'fiction').toBe(STATIONS[id].kind === 'fiction');
      expect(info.description.source === 'game').toBe(info.relation === 'fiction');
      if (info.relation !== 'direct') expect(info.note?.length).toBeGreaterThan(30);
    }
    expect(STATION_INFO['3-4'].relation).toBe('regional');
    expect(STATION_INFO['5-5'].relation).toBe('regional');
    expect(STATION_INFO['2-1'].note).toContain('Quintana Roo');
    expect(STATION_INFO['6-3'].note).toContain('Campeche');
  });
});
