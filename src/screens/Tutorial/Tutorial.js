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

import React, { useState } from 'react';
import { connect } from 'react-redux';
import type { NavigationScreenProp } from 'react-navigation';

import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import { HOME } from 'constants/navigationConstants';

import type { TutorialDataObject } from 'models/CMSData';
import type { Dispatch, RootReducerState } from 'reducers/rootReducer';
import { CMS_DATA_TYPES } from 'constants/cmsConstants';

import { hasSeenTutorialAction } from 'actions/appSettingsActions';

import TutorialSwiper from './TutorialSwiper';

type Props = {
  navigation: NavigationScreenProp<*>,
  hasSeenTutorial: () => void,
  tutorialData: ?TutorialDataObject,
}

const {
  ONBOARDING_SCREENS_FOR_NATIVES: NATIVES,
  ONBOARDING_SCREENS_FOR_NEWBIES: NEWBIES,
} = CMS_DATA_TYPES;

type TUTORIAL_PATH = typeof NATIVES | typeof NEWBIES;

const TutorialScreen = ({ navigation, hasSeenTutorial, tutorialData }: Props) => {
  const [activePath, setActivePath] = useState<TUTORIAL_PATH>(NEWBIES);
  const routeName = navigation?.state?.params?.nextNavigationRouteName || HOME;

  if (!tutorialData) {
    navigation.navigate(routeName);
    return null;
  }

  const handleFinish = () => {
    hasSeenTutorial();
    navigation.navigate(routeName);
  };

  return (
    <ContainerWithHeader style={{ flex: 1 }}>
      <TutorialSwiper
        data={tutorialData[activePath]}
        onButtonPress={val => setActivePath(val)}
        onFinish={handleFinish}
      />
    </ContainerWithHeader>
  );
};

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  hasSeenTutorial: () => dispatch(hasSeenTutorialAction()),
});

const mapStateToProps = ({
  onboarding: { tutorialData },
}: RootReducerState): $Shape<Props> => ({
  tutorialData,
});

export default connect(mapStateToProps, mapDispatchToProps)(TutorialScreen);
