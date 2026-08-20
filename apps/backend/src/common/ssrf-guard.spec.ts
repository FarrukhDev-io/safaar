import { BadRequestException } from '@nestjs/common';

const lookupMock = jest.fn();
jest.mock('node:dns/promises', () => ({
  lookup: (...args: unknown[]) => lookupMock(...args),
}));

import { assertPublicHttpUrl } from './ssrf-guard';

describe('assertPublicHttpUrl', () => {
  beforeEach(() => {
    lookupMock.mockReset();
  });

  it('allows a public URL that resolves to a public IP', async () => {
    lookupMock.mockResolvedValue([{ address: '93.184.216.34', family: 4 }]);

    await expect(
      assertPublicHttpUrl('https://example.com/webhook'),
    ).resolves.toBeInstanceOf(URL);
  });

  it('rejects non-http(s) schemes without hitting DNS', async () => {
    await expect(
      assertPublicHttpUrl('file:///etc/passwd'),
    ).rejects.toMatchObject({
      response: { code: 'WEBHOOK_URL_SCHEME_NOT_ALLOWED' },
    });
    expect(lookupMock).not.toHaveBeenCalled();
  });

  it('rejects a malformed URL', async () => {
    await expect(assertPublicHttpUrl('not a url')).rejects.toMatchObject({
      response: { code: 'WEBHOOK_URL_INVALID' },
    });
  });

  it('rejects localhost outright', async () => {
    await expect(
      assertPublicHttpUrl('http://localhost/webhook'),
    ).rejects.toMatchObject({
      response: { code: 'WEBHOOK_URL_NOT_ALLOWED' },
    });
  });

  it('rejects an IP-literal loopback URL', async () => {
    await expect(
      assertPublicHttpUrl('http://127.0.0.1/webhook'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects the cloud metadata IP literal (169.254.169.254)', async () => {
    await expect(
      assertPublicHttpUrl('http://169.254.169.254/latest/meta-data'),
    ).rejects.toMatchObject({
      response: { code: 'WEBHOOK_URL_NOT_ALLOWED' },
    });
  });

  it('rejects a private IPv4 range (10.x, 172.16-31.x, 192.168.x)', async () => {
    for (const host of [
      '10.0.0.5',
      '172.16.0.5',
      '172.31.255.255',
      '192.168.1.1',
    ]) {
      await expect(
        assertPublicHttpUrl(`http://${host}/webhook`),
      ).rejects.toBeInstanceOf(BadRequestException);
    }
  });

  it('rejects an IPv6 loopback and link-local literal', async () => {
    await expect(
      assertPublicHttpUrl('http://[::1]/webhook'),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      assertPublicHttpUrl('http://[fe80::1]/webhook'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects a public-looking hostname that resolves to a private IP (DNS-rebinding-style attack)', async () => {
    lookupMock.mockResolvedValue([{ address: '10.0.0.5', family: 4 }]);

    await expect(
      assertPublicHttpUrl('https://internal-looking.attacker.example/webhook'),
    ).rejects.toMatchObject({
      response: { code: 'WEBHOOK_URL_NOT_ALLOWED' },
    });
  });

  it('rejects when ANY of several resolved addresses is private', async () => {
    lookupMock.mockResolvedValue([
      { address: '93.184.216.34', family: 4 },
      { address: '192.168.1.1', family: 4 },
    ]);

    await expect(
      assertPublicHttpUrl('https://mixed.example/webhook'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects when DNS resolution fails', async () => {
    lookupMock.mockRejectedValue(new Error('ENOTFOUND'));

    await expect(
      assertPublicHttpUrl('https://does-not-exist.invalid/webhook'),
    ).rejects.toMatchObject({
      response: { code: 'WEBHOOK_URL_UNRESOLVABLE' },
    });
  });
});
