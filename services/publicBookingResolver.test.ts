import { describe, expect, it, vi } from 'vitest';
import {
  extractPublicPropertyIdFromPath,
  extractPublicPropertyIdFromSearch,
  resolvePublicBookingInitialRoute,
  resolvePublicPropertyId,
  sanitizePublicPropertyId,
} from './publicBookingResolver.ts';

describe('publicBookingResolver', () => {
  describe('1. Validação e sanitização de publicPropertyId', () => {
    it('aceita identificadores válidos com letras, números, hífens e underscores', () => {
      expect(sanitizePublicPropertyId('stg-public-synapse-core')).toBe('stg-public-synapse-core');
      expect(sanitizePublicPropertyId('hotel_florianopolis_01')).toBe('hotel_florianopolis_01');
      expect(sanitizePublicPropertyId('pousada-sol-mar')).toBe('pousada-sol-mar');
      expect(sanitizePublicPropertyId('   valid-trimmed   ')).toBe('valid-trimmed');
    });

    it('rejeita valores nulos, vazios ou com caracteres perigosos/inválidos', () => {
      expect(sanitizePublicPropertyId(null)).toBeUndefined();
      expect(sanitizePublicPropertyId(undefined)).toBeUndefined();
      expect(sanitizePublicPropertyId('')).toBeUndefined();
      expect(sanitizePublicPropertyId('   ')).toBeUndefined();
      expect(sanitizePublicPropertyId('prop/with/slashes')).toBeUndefined();
      expect(sanitizePublicPropertyId('prop with spaces')).toBeUndefined();
      expect(sanitizePublicPropertyId('prop?injection=true')).toBeUndefined();
      expect(sanitizePublicPropertyId('<script>')).toBeUndefined();
    });
  });

  describe('2. Extração de publicPropertyId da URL (Path e Search)', () => {
    it('extrai corretamente do path /booking/:publicPropertyId', () => {
      expect(extractPublicPropertyIdFromPath('/booking/stg-public-synapse-core')).toBe('stg-public-synapse-core');
      expect(extractPublicPropertyIdFromPath('/booking/hotel-araucarias/')).toBe('hotel-araucarias');
      expect(extractPublicPropertyIdFromPath('/p/pousada-mar')).toBe('pousada-mar');
    });

    it('retorna undefined para rotas genéricas sem ID no path', () => {
      expect(extractPublicPropertyIdFromPath('/booking')).toBeUndefined();
      expect(extractPublicPropertyIdFromPath('/booking/')).toBeUndefined();
      expect(extractPublicPropertyIdFromPath('/')).toBeUndefined();
      expect(extractPublicPropertyIdFromPath('/admin')).toBeUndefined();
    });

    it('extrai corretamente de query parameters (?publicPropertyId=...)', () => {
      expect(extractPublicPropertyIdFromSearch('?publicPropertyId=stg-public-synapse-core')).toBe('stg-public-synapse-core');
      expect(extractPublicPropertyIdFromSearch('?page=booking&publicPropertyId=stg-public-synapse-core')).toBe('stg-public-synapse-core');
      expect(extractPublicPropertyIdFromSearch('?propertySlug=hotel-alpha')).toBe('hotel-alpha');
      expect(extractPublicPropertyIdFromSearch('?property=pousada-beta')).toBe('pousada-beta');
    });

    it('retorna undefined para query sem parâmetros de propriedade pública', () => {
      expect(extractPublicPropertyIdFromSearch('')).toBeUndefined();
      expect(extractPublicPropertyIdFromSearch('?page=home')).toBeUndefined();
      expect(extractPublicPropertyIdFromSearch('?checkin=2026-10-01&checkout=2026-10-05')).toBeUndefined();
    });
  });

  describe('3. Resolução hierárquica e Fail-Closed', () => {
    it('prioriza pageParams explícito quando fornecido na navegação interna', () => {
      const resolved = resolvePublicPropertyId({
        pageParams: { publicPropertyId: 'param-override-id' },
        pathname: '/booking/path-id',
        search: '?publicPropertyId=search-id',
      });
      expect(resolved).toBe('param-override-id');
    });

    it('resolve pelo path quando pageParams não contiver publicPropertyId', () => {
      const resolved = resolvePublicPropertyId({
        pathname: '/booking/stg-public-synapse-core',
        search: '',
      });
      expect(resolved).toBe('stg-public-synapse-core');
    });

    it('resolve pela query quando não houver ID no path', () => {
      const resolved = resolvePublicPropertyId({
        pathname: '/booking',
        search: '?publicPropertyId=stg-public-synapse-core',
      });
      expect(resolved).toBe('stg-public-synapse-core');
    });

    it('resolve da propriedade ativa em dbState se configurada explicitamente', () => {
      const dbState = {
        currentPropertyId: 'prop_real',
        properties: [
          { id: 'prop_real', publicPropertyId: 'custom-public-id' },
        ],
      } as any;
      const resolved = resolvePublicPropertyId({ dbState });
      expect(resolved).toBe('custom-public-id');
    });

    it('mantém fail-closed retornando undefined se nenhum publicPropertyId for fornecido', () => {
      const resolved = resolvePublicPropertyId({
        pathname: '/booking',
        search: '',
        pageParams: null,
        dbState: { currentPropertyId: 'P01', properties: [{ id: 'P01' }] } as any,
      });
      expect(resolved).toBeUndefined();
    });

    it('NUNCA infere tenant demo (P01, beach, sanctuary, org_dev_default)', () => {
      const resolved = resolvePublicPropertyId({
        pathname: '/',
        search: '',
      });
      expect(resolved).toBeUndefined();
      expect(resolved).not.toBe('P01');
      expect(resolved).not.toBe('beach');
      expect(resolved).not.toBe('sanctuary');
      expect(resolved).not.toBe('stg-public-synapse-core');
    });
  });

  describe('4. Roteamento inicial de Public Booking (resolvePublicBookingInitialRoute)', () => {
    it('roteia diretamente para booking com ID quando acessado via /booking/:publicPropertyId', () => {
      const route = resolvePublicBookingInitialRoute('/booking/stg-public-synapse-core', '');
      expect(route).toEqual({
        page: 'booking',
        params: { publicPropertyId: 'stg-public-synapse-core' },
      });
    });

    it('roteia diretamente para booking com ID quando acessado com ?publicPropertyId=...', () => {
      const route = resolvePublicBookingInitialRoute('/', '?publicPropertyId=stg-public-synapse-core');
      expect(route).toEqual({
        page: 'booking',
        params: { publicPropertyId: 'stg-public-synapse-core' },
      });
    });

    it('roteia diretamente para booking com ID quando acessado com ?page=booking&publicPropertyId=...', () => {
      const route = resolvePublicBookingInitialRoute('/', '?page=booking&publicPropertyId=custom-prop-id');
      expect(route).toEqual({
        page: 'booking',
        params: { publicPropertyId: 'custom-prop-id' },
      });
    });

    it('roteia para booking sem params quando rota for /booking pura (fail-closed)', () => {
      const route = resolvePublicBookingInitialRoute('/booking', '');
      expect(route).toEqual({
        page: 'booking',
        params: undefined,
      });
    });

    it('retorna null para acessos normais da home (mantendo o fluxo normal de apresentação pública)', () => {
      const route = resolvePublicBookingInitialRoute('/', '');
      expect(route).toBeNull();
    });
  });

  describe('5. Suporte a múltiplas propriedades dinâmicas sem hardcoding', () => {
    const testProperties = [
      'stg-public-synapse-core',
      'resort-mata-atlantica',
      'chalet-serra-geral',
      'urban-hotel-porto-alegre',
    ];

    testProperties.forEach((id) => {
      it(`resolve e suporta dinamicamente ${id} via path`, () => {
        const route = resolvePublicBookingInitialRoute(`/booking/${id}`, '');
        expect(route?.params?.publicPropertyId).toBe(id);
      });

      it(`resolve e suporta dinamicamente ${id} via query`, () => {
        const route = resolvePublicBookingInitialRoute('/', `?publicPropertyId=${id}`);
        expect(route?.params?.publicPropertyId).toBe(id);
      });
    });
  });

  describe('6. Propagação pelo botão Reservar Agora', () => {
    it('permite que contexto da página propague publicPropertyId preservando parâmetros de busca', () => {
      const knownPublicPropertyId = 'stg-public-synapse-core';
      const searchParams = { checkIn: '2026-12-01', checkOut: '2026-12-05', guests: '2' };

      const navigationPayload = {
        ...searchParams,
        ...(knownPublicPropertyId ? { publicPropertyId: knownPublicPropertyId } : {}),
      };

      expect(navigationPayload.publicPropertyId).toBe('stg-public-synapse-core');
      expect(navigationPayload.checkIn).toBe('2026-12-01');

      const resolved = resolvePublicPropertyId({ pageParams: navigationPayload });
      expect(resolved).toBe('stg-public-synapse-core');
    });
  });
});
