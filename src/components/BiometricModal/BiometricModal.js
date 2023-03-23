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
/* eslint-disable i18next/no-literal-string */

import React, { useRef, useEffect, useCallback } from 'react';
import { View, Platform, InteractionManager } from 'react-native';
import styled from 'styled-components/native';
import t from 'translations/translate';
import { useDispatch } from 'react-redux';

// Components
import Button from 'components/core/Button';
import ModalBox from 'components/ModalBox';
import Text from 'components/core/Text';

// Utils
import { useThemeColors } from 'utils/themes';
import { spacing, appFont } from 'utils/variables';

// Actions
import { beginOnboardingAction } from 'actions/onboardingActions';
import { logEventAction } from 'actions/analyticsActions';

// Selectors
import { useRootSelector } from 'selectors';

type Props = {|
  onModalHide?: () => void,
  biometricType?: string,
  hasNoBiometrics?: boolean,
|};

const BiometricModal = ({ onModalHide, biometricType, hasNoBiometrics = false }: Props) => {
  const modalRef = useRef();
  const colors = useThemeColors();
  const dispatch = useDispatch();

  const proceedToBeginOnboarding = async (setBiometrics?: boolean) => {
    InteractionManager.runAfterInteractions(() => {
      close();
    });

    if (setBiometrics) dispatch(logEventAction(Platform.OS === 'ios' ? 'enable_face_id' : 'enable_biometric_id'));
    else dispatch(logEventAction(Platform.OS === 'ios' ? 'cancel_face_id' : 'cancel_biometric_id'));

    dispatch(beginOnboardingAction(setBiometrics));
  };

  useEffect(() => {
    if (hasNoBiometrics) proceedToBeginOnboarding();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const useBiometrics = useRootSelector((root) => root.appSettings.data.useBiometrics);

  const close = useCallback(() => {
    if (modalRef.current) modalRef.current.close();
  }, []);

  if (useBiometrics || hasNoBiometrics) return null;

  return (
    <ModalBox
      ref={modalRef}
      onModalHide={onModalHide}
      noBoxMinHeight
      modalStyle={styles.modal}
      backdropDismissable
      isSwipeClose
    >
      <View>
        <Title variant="big">{t('biometricLogin.title', { biometryType: biometricType })}</Title>
        <Description color={colors.secondaryText}>{t('biometricLogin.description')}</Description>
        <HorizontalDivider />
        <ButtonWrapper>
          <ButtonText
            title={t('biometricLogin.button.cancel')}
            titleColor={colors.buttonTextTitle}
            variant="text"
            onPress={() => proceedToBeginOnboarding()}
            testID={`${TAG}-button-cancel`}
            accessibilityLabel={`${TAG}-button-cancel`}
          />
          <VerticalDivider />
          <ButtonText
            title={t('biometricLogin.button.enable')}
            variant="text"
            style={styles.button}
            titleColor={colors.buttonTextTitle}
            onPress={() => proceedToBeginOnboarding(true)}
            testID={`${TAG}-button-enable`}
            accessibilityLabel={`${TAG}-button-enable`}
          />
        </ButtonWrapper>
      </View>
    </ModalBox>
  );
};

export default BiometricModal;

const styles = {
  modal: {
    marginHorizontal: spacing.large,
  },
  button: {
    marginLeft: spacing.extraSmall,
  },
};

const Title = styled(Text)`
  text-align: center;
  margin-top: ${spacing.rhythm}px;
  font-family: ${appFont.medium};
`;

const Description = styled(Text)`
  text-align: center;
  margin: ${spacing.medium}px ${spacing.rhythm}px;
`;

const HorizontalDivider = styled.View`
  height: 1px;
  background-color: ${({ theme }) => theme.colors.border};
`;

const VerticalDivider = styled.View`
  width: 1px;
  background-color: ${({ theme }) => theme.colors.border};
`;

const ButtonWrapper = styled.View`
  flex-direction: row;
`;

const ButtonText = styled(Button)`
  flex: 1;
`;

const TAG = 'BiometricModal';
