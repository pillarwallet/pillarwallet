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

import React, { useState, useEffect } from 'react';
import { connect } from 'react-redux';
import { useNavigation } from 'react-navigation-hooks';

import { HOME } from 'constants/navigationConstants';

import type { TutorialDataObject } from 'models/CMSData';
import type { Dispatch, RootReducerState } from 'reducers/rootReducer';
import { CMS_DATA_TYPES } from 'constants/cmsConstants';

import { hasSeenTutorialAction } from 'actions/appSettingsActions';

import TutorialSwiper from './TutorialSwiper';

type Props = {
  hasSeenTutorial: () => void,
  tutorialData: ?TutorialDataObject,
}

const {
  ONBOARDING_SCREENS_FOR_NATIVES: NATIVES,
  ONBOARDING_SCREENS_FOR_NEWBIES: NEWBIES,
} = CMS_DATA_TYPES;

type TUTORIAL_PATH = typeof NATIVES | typeof NEWBIES;

const TutorialScreen = ({ hasSeenTutorial, tutorialData }: Props) => {
  const [activePath, setActivePath] = useState<TUTORIAL_PATH>(NEWBIES);
  const navigation = useNavigation();
  const routeName = navigation?.state?.params?.nextNavigationRouteName || HOME;

  useEffect(() => {
    if (!tutorialData) {
      navigation.navigate(routeName);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFinish = () => {
    hasSeenTutorial();
    navigation.navigate(routeName);
  };
  if (!tutorialData) return null;
  return (
    <TutorialSwiper
      data={tutorialData[activePath]}
      onButtonPress={val => setActivePath(val)}
      onFinish={handleFinish}
    />
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
