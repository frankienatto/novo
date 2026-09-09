import { describe, expect, it } from 'vitest';
import { validateIcalRemoteUrl } from './icalUrlSafety.ts';

const publicResolver = async () => [{ address: '203.0.113.10', family: 4 }];
const privateResolver = async () => [{ address: '10.0.0.8', family: 4 }];

describe('iCal URL safety', () => {
  it.each(['http://localhost/calendar.ics', 'http://127.0.0.1/a.ics', 'http://10.0.0.1/a.ics', 'http://172.16.0.1/a.ics', 'http://192.168.1.1/a.ics', 'http://169.254.169.254/a.ics', 'http://[::1]/a.ics', 'ftp://public.example/a.ics'])('blocks unsafe destination %s', async (url) => {
    await expect(validateIcalRemoteUrl(url, publicResolver)).rejects.toThrow('Destino de feed não permitido');
  });
  it('blocks a hostname resolving to a private address', async () => {
    await expect(validateIcalRemoteUrl('https://ota.example/calendar.ics', privateResolver)).rejects.toThrow('Destino de feed não permitido');
  });
  it('allows a public http(s) destination after all DNS answers are validated', async () => {
    await expect(validateIcalRemoteUrl('https://ota.example/calendar.ics', publicResolver)).resolves.toMatchObject({ hostname: 'ota.example' });
  });
});
