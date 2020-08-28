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
import { ScrollView, Image } from 'react-native';
import { connect } from 'react-redux';
import { withNavigation, type NavigationScreenProp } from 'react-navigation';
import styled, { withTheme } from 'styled-components/native';
import t from 'translations/translate';

import { fontStyles } from 'utils/variables';
import { BaseText, MediumText } from 'components/Typography';
import type { Theme } from 'models/Theme';
import { ASSETS } from 'constants/navigationConstants';
import Button from 'components/Button';
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import { images } from 'utils/images';
import { switchAccountAction } from 'actions/accountsActions';
import { getActiveAccountType, findFirstSmartAccount } from 'utils/accounts';
import { ACCOUNT_TYPES } from 'constants/accountsConstants';
import type { Accounts } from 'models/Account';
import type { Dispatch, RootReducerState } from 'reducers/rootReducer';

type Props = {
  theme: Theme,
  navigation: NavigationScreenProp<*>,
  accounts: Accounts,
  isChanging: boolean,
  switchAccount: (id: string) => void,
}

const Title = styled(MediumText)`
  ${fontStyles.large};
  margin: 24px 30px 0;
  text-align: center;
`;

const Text = styled(BaseText)`
  ${fontStyles.medium};
  margin: 35px 56px;
`;

const ButtonWrapper = styled.View`
  width: 100%;
  padding: 0 30px;
`;

class WalletActivated extends React.PureComponent<Props> {
  handleNavigate = async () => {
    const { navigation, accounts, switchAccount } = this.props;
    const activeAccountType = getActiveAccountType(accounts);
    if (activeAccountType !== ACCOUNT_TYPES.SMART_WALLET) {
      const smartWallet = findFirstSmartAccount(accounts);
      if (smartWallet) {
        await switchAccount(smartWallet.id);
      }
    }
    navigation.navigate(ASSETS);
  }

  render() {
    const { theme, navigation, isChanging } = this.props;
    const { swActivated } = images(theme);
    return (
      <ContainerWithHeader
        headerProps={{
          leftItems: [{ title: t('smartWalletContent.title.walletActivatedScreen') }],
          rightItems: [{ close: true }],
          onClose: () => navigation.goBack(),
          close: true,
        }}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          style={{ flex: 1 }}
        >
          <Title>{t('smartWalletContent.title.smartWalletIsActivated')}</Title>
          <Image source={swActivated} style={{ height: 137, width: '100%' }} resizeMode="stretch" />
          <Text>{t('smartWalletContent.paragraph.walletIsActivated')}</Text>
          <ButtonWrapper>
            <Button
              isLoading={isChanging}
              title={t('smartWalletContent.button.goToSmartWallet')}
              onPress={this.handleNavigate}
              secondary
              textStyle={fontStyles.medium}
            />
          </ButtonWrapper>
        </ScrollView>
      </ContainerWithHeader>
    );
  }
}

const mapStateToProps = ({
  accounts: { data: accounts, isChanging },
}: RootReducerState): $Shape<Props> => ({
  accounts,
  isChanging,
});

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  switchAccount: (accountId: string) => dispatch(switchAccountAction(accountId)),
});

export default connect(mapStateToProps, mapDispatchToProps)(withTheme(withNavigation(WalletActivated)));
