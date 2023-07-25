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
import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import styled from 'styled-components/native';
import t from 'translations/translate';
import { useDispatch } from 'react-redux';

// Components
import Text from 'components/core/Text';
import { Container } from 'components/layout/Layout';
import Animation from 'components/Animation';

// Utils
import { appFont, fontStyles } from 'utils/variables';

// Actions
import { SET_FETCHING, SET_LOADING_MESSAGE } from 'constants/onboardingConstants';
import { walletSetupAction } from 'actions/onboardingActions';

// Selectors
import { useOnboardingFetchingSelector, useOnboardingLoaderMessageSelector, useRootSelector } from 'selectors';

const onboardingLoader = require('assets/loaders/onboardingLoader.json');
const onboardingIosloader = require('assets/loaders/onboardingLoader-ios.json');

export default function ({}) {
  const dispatch = useDispatch();
  const { isOnline } = useRootSelector(({ session }) => session.data);
  const { enableBiometrics } = useRootSelector(({ onboarding }) => onboarding);

  const isIos = Platform.OS === 'ios';

  const isFetching = useOnboardingFetchingSelector();
  const loaderMessage = useOnboardingLoaderMessageSelector();

  useEffect(() => {
    if (!isOnline) dispatch({ type: SET_LOADING_MESSAGE, payload: t('onboardingLoaders.noInternet') });
    if (isOnline && loaderMessage === t('onboardingLoaders.noInternet') && !isIos) {
      dispatch({ type: SET_LOADING_MESSAGE, payload: '' });
      dispatch(walletSetupAction(enableBiometrics));
    }
  }, [isFetching, loaderMessage, isOnline]);

  useEffect(() => {
    if (loaderMessage === t('onboardingLoaders.ready'))
      setTimeout(() => {
        dispatch({ type: SET_LOADING_MESSAGE, payload: '' });
        dispatch({ type: SET_FETCHING, payload: false });
      }, 0);
  }, [isFetching, loaderMessage]);

  return (
    <MainContainer>
      {!!loaderMessage && (
        <Animation
          source={isIos ? onboardingIosloader : onboardingLoader}
          loop={isOnline}
          speed={1}
          style={{ width: 150, height: 150 }}
        />
      )}
      <Label>{loaderMessage}</Label>
    </MainContainer>
  );
}

const MainContainer = styled(Container)`
  align-items: center;
  justify-content: center;
  background-color: transparent;
  position: absolute;
  width: 100%;
  height: 100%;
`;

const Label = styled(Text)`
  ${fontStyles.large};
  font-family: '${appFont.regular}';
  color: ${({ theme }) => theme.colors.control};
  top: -25px;
`;
