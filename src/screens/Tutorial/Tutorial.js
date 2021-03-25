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
import styled, { withTheme } from 'styled-components/native';
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import Button from 'components/Button';
import { BaseText, MediumText } from 'components/Typography';
import type { NavigationScreenProp } from 'react-navigation';
import type { Theme } from 'models/Theme';
import type { CMSData, CMSDocument, ParsedCMSDocument } from 'models/CMSData';

import prismicClient from 'services/prismic';
import { CMS_DATA_TYPES, DOCUMENT_TYPE } from 'constants/cmsConstants';
import { reportErrorLog, getDeviceWidth } from 'utils/common';
import { getSortedOnboardingData } from 'utils/cms';
import TutorialSwiper from './TutorialSwiper';

const InitialScreenWrapper = styled.View`
  height: 100%;
  width: ${getDeviceWidth()}px;
`;

type Props = {
  navigation: NavigationScreenProp<*>,
  theme: Theme,
}

const { ONBOARDING_SCREENS_FOR_NATIVES, ONBOARDING_SCREENS_FOR_NEWBIES } = CMS_DATA_TYPES;

type TUTORIAL_PATH = typeof ONBOARDING_SCREENS_FOR_NATIVES | typeof ONBOARDING_SCREENS_FOR_NEWBIES;

type CMSSortedDocuments = {
  [key: string]: ParsedCMSDocument[],
};

const INITIAL_STATE: CMSSortedDocuments = {
  [ONBOARDING_SCREENS_FOR_NATIVES]: [],
  [ONBOARDING_SCREENS_FOR_NEWBIES]: [],
};

const Tutorial = ({ navigation }: Props) => {
  const [data, setData] = useState<CMSSortedDocuments>(INITIAL_STATE);
  const [activePath, setActivePath] = useState<TUTORIAL_PATH>(ONBOARDING_SCREENS_FOR_NEWBIES);

  const handleFetchedResults = (docs: CMSDocument[]) => {
    setData({
      [ONBOARDING_SCREENS_FOR_NATIVES]: getSortedOnboardingData(docs, ONBOARDING_SCREENS_FOR_NATIVES),
      [ONBOARDING_SCREENS_FOR_NEWBIES]: getSortedOnboardingData(docs, ONBOARDING_SCREENS_FOR_NEWBIES),
    });
  };

  useEffect(() => {
    prismicClient.query(Prismic.Predicates.any(DOCUMENT_TYPE, [
      ONBOARDING_SCREENS_FOR_NATIVES, ONBOARDING_SCREENS_FOR_NEWBIES,
    ]))
      .then((res: CMSData) => handleFetchedResults(res.results))
      .catch(e => reportErrorLog(e));
  }, []);
  if (!data) return null;
  return (
    <ContainerWithHeader style={{ flex: 1 }}>
      <TutorialSwiper data={data[activePath]}>
        <InitialScreenWrapper>
          <Button title={'newbie TODO change'} onPress={() => setActivePath(ONBOARDING_SCREENS_FOR_NEWBIES)} />
          <Button title={'pro TODO change'} onPress={() => setActivePath(ONBOARDING_SCREENS_FOR_NATIVES)} />
        </InitialScreenWrapper>
      </TutorialSwiper>
    </ContainerWithHeader>
  );
};

export default withTheme(Tutorial);
