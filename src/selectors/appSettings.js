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
import { createSelector } from 'reselect';

// Config
import localeConfig from 'configs/localeConfig';

// Selectors
import { useRootSelector } from 'selectors';

// Types
import type { Selector } from 'reducers/rootReducer';
import type { AppSettingsReducerState } from 'reducers/appSettingsReducer';


export function useThemeType() {
  return useRootSelector((root) => root.appSettings.data.themeType);
}

export function useLanguageCode() {
  const localisation = useRootSelector((root) => root.appSettings.data.localisation);
  const sessionLanguageCode = useRootSelector((root) => root.session.data.sessionLanguageCode);

  return localisation?.activeLngCode || sessionLanguageCode || localeConfig.defaultLanguage;
}

export function useBiometricsSelector() {
  return useRootSelector((root) => root.appSettings.data.useBiometrics);
}

export const maxPinCodeLengthSelector: Selector<number> = createSelector(
  ({ appSettings }) => appSettings,
  ({ data: appSettings }: AppSettingsReducerState): number => {
    if (appSettings?.hasSixDigitsPin) return 6;
    return 4;
  },
);
