// @flow
/*
    Pillar Wallet: the personal data locker
    Copyright (C) 2019 Stiftung Pillar Project

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
import { UPDATE_SESSION } from 'constants/sessionConstants';
import type { Dispatch, GetState } from 'reducers/rootReducer';
import { getDefaultSupportedUserLanguage } from 'services/localisation/translations';
import { changeLanguageAction } from 'actions/localisationActions';
import localeConfig from 'configs/localeConfig';


export const updateSessionNetworkStatusAction = (isOnline: boolean) => ({
  type: UPDATE_SESSION,
  payload: { isOnline },
});

export const setSessionTranslationBundleInitialisedAction = () => ({
  type: UPDATE_SESSION,
  payload: { areTranslationsInitialised: true },
});

export const setFallbackLanguageVersionAction = (version: string) => {
  // TODO: pass in real version when it will be set
  //  ('1' is passed to prevent unnecessary fallback language resources' updates on network status change)
  return {
    type: UPDATE_SESSION,
    payload: { fallbackLanguageVersion: version === 'LOCAL' ? version : '1' },
  };
};

export const setSessionLanguageAction = (languageCode: string) => {
  return {
    type: UPDATE_SESSION,
    payload: { sessionLanguageCode: languageCode },
  };
};

export const handleSystemLanguageChangeAction = () => {
  return (dispatch: Dispatch, getState: GetState) => {
    const {
      session: { data: { sessionLanguageCode } },
      appSettings: { data: { localisation } },
    } = getState();

    // should not react to device language changes if localisation is not enabled
    // or user has language selected in settings
    if (!localeConfig.isEnabled || localisation?.activeLngCode) return;

    const deviceLanguage = getDefaultSupportedUserLanguage();
    if (sessionLanguageCode === deviceLanguage) return;

    dispatch(changeLanguageAction(deviceLanguage));
  };
};
