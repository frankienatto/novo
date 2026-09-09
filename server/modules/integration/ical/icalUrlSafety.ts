import { lookup as dnsLookup } from 'node:dns/promises';

export type HostResolver = (hostname: string, options: { all: true }) => Promise<Array<{ address: string; family: number }>>;

export function isForbiddenRemoteAddress(address: string): boolean {
  const normalized = address.replace(/^\[|\]$/g, '').toLowerCase();
  return normalized === '::1' || normalized === '0.0.0.0' || normalized === '::' ||
    /^127\./.test(normalized) || /^10\./.test(normalized) || /^192\.168\./.test(normalized) ||
    /^169\.254\./.test(normalized) || /^172\.(1[6-9]|2\d|3[01])\./.test(normalized) ||
    /^fc/i.test(normalized) || /^fd/i.test(normalized) || /^fe80:/i.test(normalized);
}

/** Validates every DNS answer before a server-side iCal download. */
export async function validateIcalRemoteUrl(raw: string, resolver: HostResolver = dnsLookup as HostResolver): Promise<URL> {
  const url = new URL(raw);
  if (!['https:', 'http:'].includes(url.protocol) || !url.hostname || url.username || url.password) {
    throw new Error('Destino de feed não permitido.');
  }
  if (url.hostname.toLowerCase() === 'localhost' || isForbiddenRemoteAddress(url.hostname)) {
    throw new Error('Destino de feed não permitido.');
  }
  const addresses = await resolver(url.hostname, { all: true });
  if (!addresses.length || addresses.some(({ address }) => isForbiddenRemoteAddress(address))) {
    throw new Error('Destino de feed não permitido.');
  }
  return url;
}
