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
import { RefreshControl, FlatList, Switch, Platform } from 'react-native';
import { connect } from 'react-redux';
import type { NavigationScreenProp } from 'react-navigation';
import styled from 'styled-components/native/index';

// components
import Header from 'components/Header';
import { Container } from 'components/Layout';
import { spacing, baseColors } from 'utils/variables';
import ListItemWithImage from 'components/ListItem/ListItemWithImage';
// import Button from 'components/Button';
import SlideModal from 'components/Modals/SlideModal';
import CheckPin from 'components/CheckPin';

// actions
import { switchAccountAction } from 'actions/accountsActions';
import { resetIncorrectPasswordAction } from 'actions/authActions';

// constants
import { WALLET_SETTINGS } from 'constants/navigationConstants';
import { ACCOUNT_TYPES } from 'constants/accountsConstants';

// models
import type { Accounts, Account } from 'models/Account';

type Props = {
  navigation: NavigationScreenProp<*>,
  accounts: Accounts,
  switchAccount: Function,
  resetIncorrectPassword: Function,
}

type State = {
  showCheckPinModal: boolean,
}

const Wrapper = styled.View`
  position: relative;
  margin: 5px 20px 20px;
  padding-top: ${Platform.select({
    ios: '20px',
    android: '14px',
  })};
  background-color: transparent;
  flex: 1;
`;


class WalletsList extends React.Component<Props, State> {
  switchToAccount: ?Account = null;

  state = {
    showCheckPinModal: false,
  };

  switchAccount = (account) => {
    const { switchAccount } = this.props;

    if (account.type === ACCOUNT_TYPES.SMART_WALLET) {
      this.switchToAccount = account;
      this.setState({ showCheckPinModal: true });
    } else if (account.type === ACCOUNT_TYPES.KEY_BASED) {
      switchAccount(account.id);
    }
  };

  handleCheckPinModalClose = () => {
    const { resetIncorrectPassword } = this.props;
    resetIncorrectPassword();
    this.setState({ showCheckPinModal: false });
  };

  switchToSmartWalletAccount = (_: string, wallet: Object) => {
    if (!this.switchToAccount) return;
    this.props.switchAccount(this.switchToAccount.id, wallet.privateKey);
    this.switchToAccount = null;
    this.setState({ showCheckPinModal: false });
  };

  renderWalletListItem = ({ item }) => {
    const { navigation } = this.props;
    return (
      <ListItemWithImage
        label={item.type === ACCOUNT_TYPES.SMART_WALLET ? 'Smart Wallet' : 'Key Based Wallet'}
        imageColorFill={item.type === ACCOUNT_TYPES.SMART_WALLET ? baseColors.fireEngineRed : baseColors.deepSkyBlue}
        onPress={() => navigation.navigate(WALLET_SETTINGS, { wallet: item })}
        customAddon={
          <Switch
            onValueChange={() => this.switchAccount(item)}
            value={item.isActive}
            thumbColor={baseColors.white}
            trackColor={{ false: '#E5E5E5', true: '#4cd964' }}
            ios_backgroundColor="#f4f4f4"
          />
        }
      />
    );
  };

  render() {
    const { navigation, accounts } = this.props;
    const { showCheckPinModal } = this.state;
    return (
      <Container inset={{ bottom: 0 }}>
        <Header
          title="your wallets"
          onBack={() => navigation.goBack(null)}
        />
        <FlatList
          data={accounts}
          keyExtractor={(item) => item.id.toString()}
          renderItem={this.renderWalletListItem}
          initialNumToRender={8}
          contentContainerStyle={{
            paddingVertical: spacing.rhythm,
            paddingTop: 0,
          }}
          refreshControl={
            <RefreshControl
              refreshing={false}
              onRefresh={() => {}}
            />
          }
          style={{ flexGrow: 0 }}
        />
        {/*
        <ButtonWrapper>
          <Button title="Add Smart Wallet" onPress={() => {}} />
        </ButtonWrapper>
        */}
        <SlideModal
          isVisible={showCheckPinModal}
          onModalHide={this.handleCheckPinModalClose}
          title="enter pincode"
          centerTitle
          fullScreen
          showHeader
        >
          <Wrapper>
            <CheckPin onPinValid={this.switchToSmartWalletAccount} />
          </Wrapper>
        </SlideModal>
      </Container >
    );
  }
}

const mapStateToProps = ({
  accounts: { data: accounts },
}) => ({
  accounts,
});

const mapDispatchToProps = (dispatch: Function) => ({
  switchAccount: (accountId: string, privateKey?: string) => dispatch(switchAccountAction(accountId, privateKey)),
  resetIncorrectPassword: () => dispatch(resetIncorrectPasswordAction()),
});

export default connect(mapStateToProps, mapDispatchToProps)(WalletsList);
