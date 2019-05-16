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
import { Platform } from 'react-native';
import styled from 'styled-components/native';
import isEqual from 'lodash.isequal';

// components
import { BaseText } from 'components/Typography';
import Icon from 'components/Icon';
import SlideModal from 'components/Modals/SlideModal';
import CheckPin from 'components/CheckPin';

// actions
import { switchAccountAction } from 'actions/accountsActions';
import { resetIncorrectPasswordAction } from 'actions/authActions';

// utils
import { baseColors, fontSizes } from 'utils/variables';

// types
import type { NavigationScreenProp } from 'react-navigation';

// models
import type { Account, Accounts } from 'models/Account';

// constants
import { ACCOUNT_TYPES } from 'constants/accountsConstants';

type Props = {
  navigation: NavigationScreenProp<*>,
  accounts: Accounts,
  switchAccount: Function,
  resetIncorrectPassword: Function,
}

type State = {
  showCheckPinModal: boolean,
}

const SWButtonWrapper = styled.TouchableOpacity`
  flex-direction: row;
  padding: 0 14px;
  align-items: center;
  min-height: 20px;
  margin-right: -14px;
`;

const ButtonIcon = styled(Icon)`
  font-size: ${fontSizes.tiny}px;
  color: ${baseColors.coolGrey};
  line-height: ${fontSizes.tiny}px;
`;

const ButtonText = styled(BaseText)`
  color: ${props => props.color};
  font-size: ${fontSizes.extraSmall}px;
`;

const IconsWrapper = styled.View`
  flex-direction: column;
  margin-left: 8px;
  justify-content: space-between;
  align-items: center;
  height: 20px;
`;

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

class ManageWalletsButton extends React.Component<Props, State> {
  switchToAccount: ?Account = null;

  state = {
    showCheckPinModal: false,
  };

  shouldComponentUpdate(nextProps: Props, nextState: State) {
    const isFocused = this.props.navigation.isFocused();
    if (!isFocused) {
      return false;
    }
    const isEq = isEqual(this.props, nextProps) && isEqual(this.state, nextState);
    return !isEq;
  }

  switchAccount = () => {
    const { accounts, switchAccount } = this.props;
    const inactiveAccount = accounts.find(({ isActive }) => !isActive);
    if (!inactiveAccount) return;

    if (inactiveAccount.type === ACCOUNT_TYPES.SMART_WALLET) {
      this.switchToAccount = inactiveAccount;
      this.setState({ showCheckPinModal: true });
    } else if (inactiveAccount.type === ACCOUNT_TYPES.KEY_BASED) {
      switchAccount(inactiveAccount.id);
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

  render() {
    const { accounts } = this.props;
    const { showCheckPinModal } = this.state;
    const activeAccount = accounts.find(({ isActive }) => isActive) || { type: '' };
    const { type: walletType } = activeAccount;
    if (!walletType) return null;

    const buttonText = walletType === ACCOUNT_TYPES.KEY_BASED ? 'Boring.Wallet' : 'Smart.Wallet';
    // TO BE UPDATED
    // CURRENTLY TRIGGERS ACC SWITCH ON PRESS
    // RATHER THAN LEADING TO MANAGEMENT FLOW
    return (
      <SWButtonWrapper
        onPress={this.switchAccount}
        // onPress={() => navigation.navigate(MANAGE_WALLETS_FLOW)}
      >
        <ButtonText color={walletType === ACCOUNT_TYPES.KEY_BASED ? baseColors.electricBlue : baseColors.fireEngineRed}>
          {buttonText}
        </ButtonText>
        <IconsWrapper>
          <ButtonIcon
            name="chevron-right"
            style={{ transform: [{ rotate: '-90deg' }] }}
          />
          <ButtonIcon
            name="chevron-right"
            style={{ transform: [{ rotate: '90deg' }] }}
          />
        </IconsWrapper>

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
      </SWButtonWrapper>
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

export default connect(mapStateToProps, mapDispatchToProps)(ManageWalletsButton);
