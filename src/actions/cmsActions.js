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

import { Predicates } from '@prismicio/client';
import type { Dispatch, GetState } from 'reducers/rootReducer';
import prismicClient from 'services/prismic';
import { reportErrorLog, logBreadcrumb } from 'utils/common';
import { CMS_DATA_TYPES, DOCUMENT_TYPE } from 'constants/cmsConstants';
import { SET_TUTORIAL_DATA } from 'constants/onboardingConstants';
import type { CmsData } from 'models/CMSData';
import { getTutorialDataObject, isValidTutorialData } from 'utils/cms';

const {
  ONBOARDING_SCREENS_FOR_NATIVES: NATIVES,
  ONBOARDING_SCREENS_FOR_NEWBIES: NEWBIES,
} = CMS_DATA_TYPES;

export const getTutorialDataAction = () => async (dispatch: Dispatch, getState: GetState) => {
  const { appSettings: { data: { hasSeenTutorial } } } = getState();
  // no need to do anything if user has already completed tutorial
  if (hasSeenTutorial) return;

  try {
    const response: CmsData = await prismicClient.query(Predicates.any(DOCUMENT_TYPE, [NATIVES, NEWBIES]));
    const tutorialData = getTutorialDataObject(response);
    if (!isValidTutorialData(tutorialData)) {
      return;
    }

    /* eslint-disable no-template-curly-in-string */
    /* eslint-disable i18next/no-literal-string */
    logBreadcrumb('tutorial', 'cmsActions.js: Dispatching action: ${ SET_TUTORIAL_DATA }');
    dispatch({
      type: SET_TUTORIAL_DATA,
      payload: tutorialData,
    });
  } catch (e) {
    reportErrorLog('set tutorial data error', e);
  }
};
