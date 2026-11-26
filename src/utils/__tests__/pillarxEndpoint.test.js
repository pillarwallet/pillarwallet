// @flow
import {
  ALLOWED_WEBVIEW_HOSTS,
  extractHost,
  isAllowedWebViewUrl,
  resolveWebViewBaseUrl,
} from 'utils/pillarxEndpoint';

const PROD = 'https://pillarx.app';

describe('pillarxEndpoint', () => {
  describe('extractHost', () => {
    it('reads the host, defaulting to https', () => {
      expect(extractHost('pillarx.app')).toBe('pillarx.app');
      expect(extractHost('https://pillarx.app/path?x=1')).toBe('pillarx.app');
      expect(extractHost('https://PillarX.app')).toBe('pillarx.app');
    });

    it('isolates host from userinfo and port', () => {
      expect(extractHost('https://pillarx.app@evil.com')).toBe('evil.com');
      expect(extractHost('https://staging.pillarx.app:8443/x')).toBe('staging.pillarx.app');
    });

    it('ends the authority at a backslash, as browsers do', () => {
      expect(extractHost('https://evil.com\\@pillarx.app')).toBe('evil.com');
      expect(extractHost('https://evil.com\\.pillarx.app')).toBe('evil.com');
    });

    it('returns null for empty or non-string values', () => {
      expect(extractHost(undefined)).toBeNull();
      expect(extractHost(null)).toBeNull();
      expect(extractHost('')).toBeNull();
      expect(extractHost('   ')).toBeNull();
      // $FlowFixMe intentional wrong type
      expect(extractHost(42)).toBeNull();
    });
  });

  describe('isAllowedWebViewUrl', () => {
    it('accepts allowlisted https hosts', () => {
      expect(isAllowedWebViewUrl('https://pillarx.app')).toBe(true);
      expect(isAllowedWebViewUrl('https://staging.pillarx.app/app')).toBe(true);
      expect(isAllowedWebViewUrl('pillarx.app')).toBe(true); // defaults to https
    });

    it('rejects look-alike and embedded hosts', () => {
      expect(isAllowedWebViewUrl('https://pillarx.app.evil.com')).toBe(false);
      expect(isAllowedWebViewUrl('https://pillarx.app@evil.com')).toBe(false);
      expect(isAllowedWebViewUrl('https://evilpillarx.app')).toBe(false);
      expect(isAllowedWebViewUrl('https://notpillarx.app')).toBe(false);
    });

    it('rejects backslash-based host confusion', () => {
      // Browsers load evil.com for these; the allowlist must agree.
      expect(isAllowedWebViewUrl('https://evil.com\\@pillarx.app')).toBe(false);
      expect(isAllowedWebViewUrl('https://evil.com\\@staging.pillarx.app/app')).toBe(false);
      expect(isAllowedWebViewUrl('https:\\\\evil.com\\@pillarx.app')).toBe(false);
      expect(isAllowedWebViewUrl('evil.com\\@pillarx.app')).toBe(false);
    });

    it('rejects non-https schemes', () => {
      expect(isAllowedWebViewUrl('http://pillarx.app')).toBe(false);
      // eslint-disable-next-line no-script-url
      expect(isAllowedWebViewUrl('javascript:alert(1)')).toBe(false);
      expect(isAllowedWebViewUrl('data:text/html,<script>1</script>')).toBe(false);
    });

    it('rejects empty values', () => {
      expect(isAllowedWebViewUrl(undefined)).toBe(false);
      expect(isAllowedWebViewUrl('')).toBe(false);
    });
  });

  describe('resolveWebViewBaseUrl (production)', () => {
    it('passes through allowlisted endpoints', () => {
      expect(resolveWebViewBaseUrl('https://pillarx.app', false)).toBe('https://pillarx.app');
      expect(resolveWebViewBaseUrl('staging.pillarx.app', false)).toBe('https://staging.pillarx.app');
    });

    it('replaces a tampered endpoint with the pinned production URL', () => {
      expect(resolveWebViewBaseUrl('https://evil.com', false)).toBe(PROD);
      expect(resolveWebViewBaseUrl('https://pillarx.app.evil.com', false)).toBe(PROD);
      expect(resolveWebViewBaseUrl('http://pillarx.app', false)).toBe(PROD);
      expect(resolveWebViewBaseUrl('https://evil.com\\@pillarx.app', false)).toBe(PROD);
      expect(resolveWebViewBaseUrl('https:\\\\evil.com\\@pillarx.app', false)).toBe(PROD);
      // eslint-disable-next-line no-script-url
      expect(resolveWebViewBaseUrl('javascript:alert(1)', false)).toBe(PROD);
    });

    it('falls back for empty input', () => {
      expect(resolveWebViewBaseUrl('', false)).toBe(PROD);
      expect(resolveWebViewBaseUrl(undefined, false)).toBe(PROD);
    });
  });

  describe('resolveWebViewBaseUrl (development)', () => {
    it('honours any endpoint when isDev', () => {
      expect(resolveWebViewBaseUrl('http://localhost:3000', true)).toBe('http://localhost:3000');
      expect(resolveWebViewBaseUrl('https://my-branch.vercel.app', true)).toBe('https://my-branch.vercel.app');
    });
  });

  it('allowlist does not accidentally include an attacker host', () => {
    expect(ALLOWED_WEBVIEW_HOSTS).toEqual(['pillarx.app', 'staging.pillarx.app']);
  });
});
