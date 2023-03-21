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
import { connect, useDispatch } from 'react-redux';
import styled from 'styled-components/native';
import t from 'translations/translate';

// Components
import ContainerWithHeader from 'components/legacy/Layout/ContainerWithHeader';
import PinCode from 'components/PinCode';
import { MediumText, Paragraph } from 'components/legacy/Typography';

// Constants
import { PIN_CODE_CONFIRMATION } from 'constants/navigationConstants';

// Selectors
import { useRootSelector } from 'selectors';
import { maxPinCodeLengthSelector } from 'selectors/appSettings';

// Utils
import { validatePin } from 'utils/validators';
import { fontStyles, spacing } from 'utils/variables';

// Actions
import { logEventAction } from 'actions/analyticsActions';

// Types
import type { RootReducerState } from 'reducers/rootReducer';
import type { NavigationScreenProp } from 'react-navigation';

type Props = {
  navigation: NavigationScreenProp<*>,
  wallet: ?Object,
};

const SetWalletPinCode = ({ navigation, wallet }: Props) => {
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

  // used to block navigation back in web recovery portal flow
  const noBack = navigation.getParam('noBack');

  const username = navigation.getParam('username');
  let welcomeText = t('auth:title.welcomeToPillar');
  if (username) welcomeText = t('auth:title.welcomeToPillarUser', { user: username });

  return (
    <ContainerWithHeader
      headerProps={{
        centerItems: [{ title: t('auth:title.createPin') }],
        noBack: !!noBack,
      }}
    >
      <ContentWrapper contentContainerStyle={{ padding: spacing.large, flexGrow: 1 }}>
        {!wallet && <HeaderText>{welcomeText}</HeaderText>}
        <Paragraph center>{t('auth:paragraph.createPin')}</Paragraph>
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

const mapStateToProps = ({ onboarding: { wallet } }: RootReducerState): $Shape<Props> => ({
  wallet,
});

export default connect(mapStateToProps)(SetWalletPinCode);

const ContentWrapper = styled.ScrollView`
  flex: 1;
`;

const HeaderText = styled(MediumText)`
  ${fontStyles.large};
  text-align: center;
  margin-top: ${spacing.large}px;
  margin-bottom: 9px;
`;

const TAG = 'SetWalletPinCode';
