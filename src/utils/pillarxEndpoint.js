// @flow
/*
    Pillar Wallet: the personal data locker
    Copyright (C) 2021 Stiftung Pillar Project

    This program is free software; you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation; either version 2 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License along
    with this program; if not, write to the Free Software Foundation, Inc.,
    51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
*/
import { PRESET_URLS } from './homeScreenUrl';

/**
 * Hosts the Home WebView is permitted to load.
 *
 * The Home WebView exposes a native signing bridge (see
 * docs/WebViewMessaging.md): any page it loads can request message,
 * transaction, typed-data and EIP-7702 signatures. The URL it loads comes
 * from Firebase Remote Config (`pillarx_endpoint`) or a stored override,
 * neither of which is trusted. If either is tampered with, an attacker
 * could repoint the WebView at a host they control and drive the bridge.
 *
 * In production the resolved endpoint MUST match this allowlist exactly
 * (host comparison, https only); anything else falls back to the pinned
 * production URL. Extend this list deliberately.
 */
export const ALLOWED_WEBVIEW_HOSTS: string[] = ['pillarx.app', 'staging.pillarx.app'];

// Pinned fallback used whenever the candidate endpoint is not allowed.
const DEFAULT_WEBVIEW_URL: string = PRESET_URLS.PRODUCTION; // https://pillarx.app

/**
 * Extract the lowercased host from a candidate endpoint, defaulting to an
 * https scheme when none is present. Parsed with a regex rather than URL()
 * for predictable behaviour across the React Native runtime.
 *
 * Returns null when no host can be determined. Correctly isolates the host
 * from userinfo and port so that values such as
 * `https://pillarx.app@evil.com` or `https://pillarx.app.evil.com` do not
 * masquerade as an allowed host.
 */
export const extractHost = (candidate: ?string): ?string => {
  if (!candidate || typeof candidate !== 'string') return null;
  const trimmed = candidate.trim();
  if (!trimmed) return null;
  const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  const match = withScheme.match(/^https?:\/\/([^/?#]+)/i);
  if (!match) return null;
  let host = match[1];
  const at = host.lastIndexOf('@');
  if (at !== -1) host = host.slice(at + 1);
  const colon = host.indexOf(':');
  if (colon !== -1) host = host.slice(0, colon);
  return host.toLowerCase() || null;
};

/**
 * True only when the candidate is an https URL whose exact host is on the
 * allowlist.
 */
export const isAllowedWebViewUrl = (candidate: ?string): boolean => {
  if (!candidate || typeof candidate !== 'string') return false;
  const trimmed = candidate.trim();
  // Reject explicit non-https schemes (http:, javascript:, data:, ...).
  if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed) && !/^https:\/\//i.test(trimmed)) {
    return false;
  }
  const host = extractHost(trimmed);
  if (!host) return false;
  return ALLOWED_WEBVIEW_HOSTS.includes(host);
};

/**
 * Resolve the base URL to load in the Home WebView.
 *
 * Production: a candidate whose host is not on the allowlist (or is not
 * https) is rejected and replaced with the pinned production URL, so a
 * tampered Remote Config value or override cannot repoint the
 * signing-bridge WebView.
 *
 * Development (__DEV__): any candidate is honoured so developers can point
 * at local or custom builds.
 */
export const resolveWebViewBaseUrl = (
  candidate: ?string,
  isDev: boolean = typeof __DEV__ !== 'undefined' && __DEV__,
): string => {
  const trimmed = (candidate || '').trim();
  if (!trimmed) return DEFAULT_WEBVIEW_URL;
  const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  if (isDev) return withScheme;
  return isAllowedWebViewUrl(withScheme) ? withScheme : DEFAULT_WEBVIEW_URL;
};
