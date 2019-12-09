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
import * as React from 'react';
import { connect } from 'react-redux';
import styled from 'styled-components/native';
import { CachedImage } from 'react-native-cached-image';

import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import { MediumText } from 'components/Typography';
import Button from 'components/Button';
import ButtonText from 'components/ButtonText';
import { fontSizes, fontStyles, spacing } from 'utils/variables';
import { registerWalletAction } from 'actions/onboardingActions';

type Props = {
  registerWallet: (setBiometrics: boolean) => void,
};

const touchIdImageSource = require('assets/images/touch_id.png');

const ContentWrapper = styled.ScrollView`
  flex: 1;
`;

const HeaderText = styled(MediumText)`
  ${fontStyles.large};
  text-align: center;
`;

const ContentInnerWrapper = styled.View`
  flex-grow: 1;
  align-items: center;
  justify-content: space-around;
`;

const ButtonsWrapper = styled.View`
  padding-bottom: 15%;
`;

const TouchIdImage = styled(CachedImage)`
  width: 164px;
  height: 164px;
`;

class BiometricsPrompt extends React.Component<Props> {
  proceedToRegisterWallet = (setBiometrics) => {
    const { registerWallet } = this.props;
    registerWallet(setBiometrics);
  };

  render() {
    return (
      <ContainerWithHeader headerProps={{ centerItems: [{ title: 'Make crypto easy' }] }}>
        <ContentWrapper contentContainerStyle={{ paddingVertical: 20, paddingHorizontal: 30, flexGrow: 1 }}>
          <HeaderText>{'Would you like to use\nTouch ID with your\nwallet?'}</HeaderText>
          <ContentInnerWrapper>
            <TouchIdImage source={touchIdImageSource} />
            <ButtonsWrapper>
              <Button title="Yes, please" onPress={() => this.proceedToRegisterWallet(true)} />
              <ButtonText
                buttonText="I'm happy with PIN only"
                onPress={() => this.proceedToRegisterWallet(false)}
                fontSize={fontSizes.medium}
                wrapperStyle={{ marginTop: spacing.large }}
              />
            </ButtonsWrapper>
          </ContentInnerWrapper>
        </ContentWrapper>
      </ContainerWithHeader>
    );
  }
}

const mapDispatchToProps = (dispatch: Function) => ({
  registerWallet: (setBiometrics) => { dispatch(registerWalletAction(setBiometrics)); },
});

export default connect(null, mapDispatchToProps)(BiometricsPrompt);
