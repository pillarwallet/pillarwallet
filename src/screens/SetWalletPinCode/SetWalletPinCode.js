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
import { connect } from 'react-redux';
import styled from 'styled-components/native';
import t from 'translations/translate';

// components
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import PinCode from 'components/PinCode';
import { MediumText, Paragraph } from 'components/Typography';

// constants
import { PIN_CODE_CONFIRMATION } from 'constants/navigationConstants';

// utils
import { validatePin } from 'utils/validators';
import { fontStyles, spacing } from 'utils/variables';

// types
import type { RootReducerState } from 'reducers/rootReducer';
import type { NavigationScreenProp } from 'react-navigation';


type Props = {
  navigation: NavigationScreenProp<*>,
  wallet: ?Object,
};

const ContentWrapper = styled.ScrollView`
  flex: 1;
`;

const HeaderText = styled(MediumText)`
  ${fontStyles.large};
  text-align: center;
  margin-top: ${spacing.large}px;
  margin-bottom: 9px;
`;

const SetWalletPinCode = ({
  navigation,
  wallet,
}: Props) => {
  const [pinCode, setPinCode] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    if (errorMessage) setErrorMessage(null);
  }, [pinCode]);

  const handlePinSubmit = (submittedPinCode: string) => {
    const validationError = validatePin(submittedPinCode);
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }
    navigation.navigate(PIN_CODE_CONFIRMATION, { pinCode: submittedPinCode });
  };

  const username = navigation.getParam('username');
  let welcomeText = t('auth:title.welcomeToPillar');
  if (username) welcomeText += `,\n${username}`;

  return (
    <ContainerWithHeader headerProps={{ centerItems: [{ title: t('auth:title.createPin') }] }}>
      <ContentWrapper contentContainerStyle={{ padding: spacing.large, flexGrow: 1 }}>
        {!wallet && <HeaderText>{welcomeText}</HeaderText>}
        <Paragraph center>{t('auth:paragraph.createPin')}</Paragraph>
        <PinCode
          onPinEntered={handlePinSubmit}
          onPinChanged={setPinCode}
          showForgotButton={false}
          pinError={!!errorMessage}
          flex={false}
        />
      </ContentWrapper>
    </ContainerWithHeader>
  );
};

const mapStateToProps = ({
  onboarding: { wallet },
}: RootReducerState): $Shape<Props> => ({
  wallet,
});

export default connect(mapStateToProps)(SetWalletPinCode);
