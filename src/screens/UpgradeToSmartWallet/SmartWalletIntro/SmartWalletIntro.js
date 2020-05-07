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
import styled, { withTheme } from 'styled-components/native';
import type { NavigationScreenProp } from 'react-navigation';
import { connect } from 'react-redux';
import { CachedImage } from 'react-native-cached-image';

import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import { ScrollWrapper, Wrapper, Container } from 'components/Layout';
import { MediumText, BoldText } from 'components/Typography';
import Button from 'components/Button';
import CheckAuth from 'components/CheckAuth';
import Loader from 'components/Loader';

import { fontStyles } from 'utils/variables';
import { responsiveSize } from 'utils/ui';
import { getThemeColors, themedColors } from 'utils/themes';

import { ASSETS } from 'constants/navigationConstants';
import {
  importSmartWalletAccountsAction,
  initSmartWalletSdkAction,
} from 'actions/smartWalletActions';
import { switchAccountAction } from 'actions/accountsActions';
import { ACCOUNT_TYPES } from 'constants/accountsConstants';

import type { Theme } from 'models/Theme';
import type { Dispatch, RootReducerState } from 'reducers/rootReducer';
import type { Accounts } from 'models/Account';
import type { Assets } from 'models/Asset';


type Props = {
  navigation: NavigationScreenProp<*>,
  theme: Theme,
  accounts: Accounts,
  initSmartWalletSdk: (privateKey: string) => void,
  importSmartWalletAccounts: (privateKey: string, createNewAccount: boolean, initAssets: Assets) => void,
  switchAccount: (accountId: string) => void,
};

type State = {
  showPinModal: boolean,
  showLoader: boolean,
};


const CustomWrapper = styled.View`
  flex: 1;
  padding: 20px 55px 20px 46px;
`;

const Title = styled(BoldText)`
  color: ${themedColors.smartWalletText};
  ${fontStyles.rJumbo};
`;

const BodyText = styled(MediumText)`
  color: ${themedColors.smartWalletText};
  ${fontStyles.rBig};
  margin-top: ${responsiveSize(26)}px;
`;

const ButtonWrapper = styled(Wrapper)`
  margin: 30px 0 50px;
  padding: 0 46px;
`;

const FeatureIcon = styled(CachedImage)`
  height: 124px;
  width: 124px;
  margin-bottom: 24px;
`;

const smartWalletIcon = require('assets/images/logo_smart_wallet.png');


class SmartWalletIntro extends React.PureComponent<Props, State> {
  state = {
    showPinModal: false,
    showLoader: false,
  };

  proceed = async (_, wallet) => {
    const {
      importSmartWalletAccounts, initSmartWalletSdk, switchAccount, navigation,
    } = this.props;
    this.setState({ showLoader: true });
    await initSmartWalletSdk(wallet.privateKey);
    await importSmartWalletAccounts(wallet.privateKey, true, {});
    const { accounts } = this.props;
    const smartAccount = (accounts.find((acc) => acc.type === ACCOUNT_TYPES.SMART_WALLET) || { id: '' });
    await switchAccount(smartAccount.id);
    navigation.navigate(ASSETS);
  };

  render() {
    const { showPinModal, showLoader } = this.state;
    const {
      theme,
    } = this.props;
    const colors = getThemeColors(theme);

    if (showLoader) {
      return (
        <Container center>
          <Loader />
        </Container>
      );
    }

    return (
      <ContainerWithHeader
        headerProps={{ floating: true }}
        backgroundColor={colors.smartWalletSurface}
      >
        <ScrollWrapper contentContainerStyle={{ paddingTop: 80 }}>
          <CustomWrapper>
            <FeatureIcon source={smartWalletIcon} />
            <Title>
              Smart Wallet
            </Title>
            <BodyText>
              Your new Pillar Smart Wallet is powered by a personal smart contract. This provides better asset
              management, security and recovery functionality.
            </BodyText>
            <BodyText>
              In order to enable your Smart Wallet, it needs to be deployed which comes with a small fee.
            </BodyText>
            <BodyText>
              Pillar also recommends that you transfer most of your assets to your Smart Wallet due to the benefits
              listed.
            </BodyText>
          </CustomWrapper>
          <ButtonWrapper>
            <Button
              block
              title="Proceed"
              onPress={() => this.setState({ showPinModal: true })}
              style={{
                backgroundColor: colors.smartWalletText,
                marginTop: 40,
                marginBottom: 20,
                borderRadius: 6,
              }}
              textStyle={{ color: colors.control }}
            />
          </ButtonWrapper>
        </ScrollWrapper>
        <CheckAuth
          onPinValid={this.proceed}
          revealMnemonic
          modalProps={{
            isVisible: showPinModal,
            onModalHide: () => this.setState({ showPinModal: false }),
          }}
        />
      </ContainerWithHeader>
    );
  }
}

const mapStateToProps = ({
  accounts: { data: accounts },
}: RootReducerState): $Shape<Props> => ({
  accounts,
});

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  initSmartWalletSdk: (privateKey: string) => dispatch(initSmartWalletSdkAction(privateKey)),
  importSmartWalletAccounts: (privateKey: string, createNewAccount: boolean, initAssets: Assets) =>
    dispatch(importSmartWalletAccountsAction(privateKey, createNewAccount, initAssets)),
  switchAccount: (accountId: string) => dispatch(switchAccountAction(accountId)),
});

export default withTheme(connect(mapStateToProps, mapDispatchToProps)(SmartWalletIntro));
