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

import React, { useEffect, useState } from 'react';
import Prismic from '@prismicio/client';
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import { HOME } from 'constants/navigationConstants';

import type { NavigationScreenProp } from 'react-navigation';
import type { Theme } from 'models/Theme';
import type { CMSData, CMSDocument, ParsedCMSDocument } from 'models/CMSData';

import prismicClient from 'services/prismic';
import { CMS_DATA_TYPES, DOCUMENT_TYPE } from 'constants/cmsConstants';
import { reportErrorLog } from 'utils/common';
import { getSortedOnboardingData } from 'utils/cms';
import TutorialSwiper from './TutorialSwiper';

type Props = {
  navigation: NavigationScreenProp<*>,
  theme: Theme,
}

const {
  ONBOARDING_SCREENS_FOR_NATIVES: NATIVES,
  ONBOARDING_SCREENS_FOR_NEWBIES: NEWBIES,
} = CMS_DATA_TYPES;

type TUTORIAL_PATH = typeof NATIVES | typeof NEWBIES;

type CMSSortedDocuments = {
  [key: string]: ParsedCMSDocument[],
};

const INITIAL_STATE: CMSSortedDocuments = {
  [NATIVES]: [],
  [NEWBIES]: [],
};

export default ({ navigation }: Props) => {
  const [data, setData] = useState<CMSSortedDocuments>(INITIAL_STATE);
  const [activePath, setActivePath] = useState<TUTORIAL_PATH>(NEWBIES);

  const handleFetchedResults = (docs: CMSDocument[]) => {
    setData({
      [NATIVES]: getSortedOnboardingData(docs, NATIVES),
      [NEWBIES]: getSortedOnboardingData(docs, NEWBIES),
    });
  };

  useEffect(() => {
    prismicClient.query(Prismic.Predicates.any(DOCUMENT_TYPE, [NATIVES, NEWBIES]))
      .then((res: CMSData) => handleFetchedResults(res.results))
      .catch(e => reportErrorLog(e));
  }, []);
  if (!data) return null;

  const handleFinish = () => {
    // TODO: change seen tutorial flag
    navigation.navigate(HOME);
  };

  return (
    <ContainerWithHeader style={{ flex: 1 }}>
      <TutorialSwiper data={data[activePath]} onButtonPress={val => setActivePath(val)} onFinish={handleFinish} />
    </ContainerWithHeader>
  );
};
