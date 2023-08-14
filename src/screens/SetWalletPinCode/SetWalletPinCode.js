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
import { Dimensions } from 'react-native';
import { useDispatch } from 'react-redux';
import styled from 'styled-components/native';
import t from 'translations/translate';

// Components
import ContainerWithHeader from 'components/legacy/Layout/ContainerWithHeader';
import PinCode from 'components/PinCode';
import { MediumText } from 'components/legacy/Typography';
import IconWithBackgroundGif from 'components/Gif/IconWithBackgroundGif';
import { Spacing } from 'components/legacy/Layout';

// Constants
import { PIN_CODE_CONFIRMATION } from 'constants/navigationConstants';

// Selectors
import { useRootSelector } from 'selectors';
import { maxPinCodeLengthSelector } from 'selectors/appSettings';

// Utils
import { validatePin } from 'utils/validators';
import { spacing } from 'utils/variables';

// Actions
import { logEventAction } from 'actions/analyticsActions';

// Types
import type { NavigationScreenProp } from 'react-navigation';

type Props = {
  navigation: NavigationScreenProp<*>,
};

const { height } = Dimensions.get('window');

const SetWalletPinCode = ({ navigation }: Props) => {
  const [pinCode, setPinCode] = useState(null);
  const dispatch = useDispatch();
  const [errorMessage, setErrorMessage] = useState(null);
  const maxPinCodeLength = useRootSelector(maxPinCodeLengthSelector);

  useEffect(() => {
    if (errorMessage) setErrorMessage(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pinCode]);

  const handlePinSubmit = (submittedPinCode: string) => {
    const validationError = validatePin(submittedPinCode, maxPinCodeLength);
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }
    dispatch(logEventAction('create_pin', { pinCode: submittedPinCode }));
    navigation.navigate(PIN_CODE_CONFIRMATION, { pinCode: submittedPinCode });
  };

  return (
    <ContainerWithHeader
      headerProps={{
        noBack: false,
      }}
    >
      <ContentWrapper contentContainerStyle={{ padding: spacing.large, flexGrow: 1 }}>
        <IconWithBackgroundGif />
        <Spacing h={height * 0.05} />

        <MediumText fontSize={24} center>
          {t('auth:paragraph.letsCreatePin')}
        </MediumText>
        <PinCode
          onPinEntered={handlePinSubmit}
          onPinChanged={setPinCode}
          showForgotButton={false}
          pinError={!!errorMessage}
          flex={false}
          testIdTag={TAG}
        />
      </ContentWrapper>
    </ContainerWithHeader>
  );
};

export default SetWalletPinCode;

const ContentWrapper = styled.ScrollView`
  flex: 1;
`;

const TAG = 'SetWalletPinCode';
