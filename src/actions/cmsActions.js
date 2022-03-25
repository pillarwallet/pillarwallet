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

// constants
import { CMS_DATA_TYPES, DOCUMENT_TYPE } from 'constants/cmsConstants';
import { SET_TUTORIAL_DATA, SET_BANNER_DATA } from 'constants/onboardingConstants';

// services
import prismicClient from 'services/prismic';
import * as Prismic from 'services/prismic';

// utils
import { reportErrorLog, logBreadcrumb } from 'utils/common';
import { getTutorialDataObject, isValidTutorialData } from 'utils/cms';

// types
import type { Dispatch, GetState } from 'reducers/rootReducer';
import type { CmsData } from 'models/CMSData';


const {
  ONBOARDING_SCREENS_FOR_NATIVES: NATIVES,
  ONBOARDING_SCREENS_FOR_NEWBIES: NEWBIES,
} = CMS_DATA_TYPES;

const TYPE_CUSTOMISABLE_BANNER = 'customisable_banner';

export const fetchTutorialDataIfNeededAction = () => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const { appSettings: { data: { hasSeenTutorial } } } = getState();
    // no need to do anything if user has already completed tutorial
    if (hasSeenTutorial) return;

    try {
      const response: CmsData = await prismicClient.query(Predicates.any(DOCUMENT_TYPE, [NATIVES, NEWBIES]));
      const tutorialData = getTutorialDataObject(response);
      if (!isValidTutorialData(tutorialData)) {
        logBreadcrumb('fetchTutorialDataIfNeededAction', 'tutorialData bot valid: ', { tutorialData });
        return;
      }

      // eslint-disable-next-line no-template-curly-in-string
      logBreadcrumb('tutorial', 'cmsActions.js: Dispatching action: ${ SET_TUTORIAL_DATA }');
      dispatch({
        type: SET_TUTORIAL_DATA,
        payload: tutorialData,
      });
    } catch (error) {
      reportErrorLog('fetchTutorialDataIfNeededAction failed', { error });
    }
  };
};

export const bannerDataAction = () => {
  return async (dispatch: Dispatch) => {
    try {
      const bannerData = await Prismic.queryDocumentsByType(TYPE_CUSTOMISABLE_BANNER);
      if (!bannerData.results) {
        logBreadcrumb('bannerDataAction', 'bannerData not valid: ', { bannerData });
        return;
      }
      logBreadcrumb('bannerData', 'cmsActions.js: Dispatching action: SET_BANNER_DATA');
      dispatch({
        type: SET_BANNER_DATA,
        payload: bannerData,
      });
    } catch (error) {
      reportErrorLog('bannerDataAction failed', { error });
    }
  };
};
