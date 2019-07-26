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
import { RefreshControl, FlatList, Platform } from 'react-native';
import { connect } from 'react-redux';
import type { NavigationScreenProp } from 'react-navigation';
import styled from 'styled-components/native/index';

// components
import { spacing, baseColors, fontSizes } from 'utils/variables';
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import SlideModal from 'components/Modals/SlideModal';
import CheckPin from 'components/CheckPin';
import ShadowedCard from 'components/ShadowedCard';
import Icon from 'components/Icon';
import { BaseText, BoldText } from 'components/Typography';

// actions
import { switchAccountAction } from 'actions/accountsActions';
import { resetIncorrectPasswordAction } from 'actions/authActions';

// constants
import { ASSETS, WALLET_SETTINGS } from 'constants/navigationConstants';
import { ACCOUNT_TYPES } from 'constants/accountsConstants';

// models
import type { Accounts, Account } from 'models/Account';

import { responsiveSize } from 'utils/ui';

type Props = {
  navigation: NavigationScreenProp<*>,
  accounts: Accounts,
  switchAccount: Function,
  resetIncorrectPassword: Function,
  user: Object,
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

const ItemWrapper = styled.View`
   flex-direction: row;
   flex: 1;
   margin-bottom: ${spacing.medium}px;
`;

const CardRow = styled.View`
   flex-direction: row;
   width: 100%;
   align-items: center;
`;

const CardContent = styled.View`
  flex-direction: column;
  width: 0;
  flexGrow: 1;
`;

const CardTitle = styled(BoldText)`
  color: ${baseColors.slateBlack};
  font-size: ${fontSizes.small}px;
  line-height: ${fontSizes.small}px;
`;

const CardSubtitle = styled(BaseText)`
  color: ${baseColors.coolGrey};
  font-size: 13px;
  line-height: 15px;
  margin-top: 4px;
`;

const CheckIcon = styled(Icon)`
  font-size: ${responsiveSize(14)};
  color: ${baseColors.electricBlue};
  align-self: flex-start;
`;

const SettingsIcon = styled(Icon)`
  font-size: ${fontSizes.extraLarge};
  color: ${baseColors.malibu};
`;

const iconRadius = responsiveSize(52);
const WalletIconWrapper = styled.View`
  height: ${iconRadius}px;
  width: ${iconRadius}px;
  border-radius: ${iconRadius / 2}px;
  background-color: ${baseColors.zircon};
  margin-right: ${spacing.medium}px;
  align-items: center;
  justify-content: center;
`;

const iconSide = responsiveSize(20);
const WalletIcon = styled.View`
  background-color: ${baseColors.electricBlueIntense};
  ${props => props.isSmart
    ? `height: ${iconSide}px;
      width: ${iconSide}px;
      border-top-right-radius: 6px;
      border-bottom-left-radius: 6px;`
    : `height: ${iconSide}px;
      width: ${iconSide}px;`}
`;

class WalletsList extends React.Component<Props, State> {
  switchToAccount: ?Account = null;

  state = {
    showCheckPinModal: false,
  };

  switchAccount = (account) => {
    const { switchAccount, navigation } = this.props;

    if (account.type === ACCOUNT_TYPES.SMART_WALLET) {
      this.switchToAccount = account;
      this.setState({ showCheckPinModal: true });
    } else if (account.type === ACCOUNT_TYPES.KEY_BASED) {
      switchAccount(account.id);
      navigation.navigate(ASSETS);
    }
  };

  handleCheckPinModalClose = () => {
    const { resetIncorrectPassword } = this.props;
    resetIncorrectPassword();
    this.setState({ showCheckPinModal: false });
  };

  switchToSmartWalletAccount = (_: string, wallet: Object) => {
    const { navigation } = this.props;
    if (!this.switchToAccount) return;
    this.props.switchAccount(this.switchToAccount.id, wallet.privateKey);
    this.switchToAccount = null;
    this.setState({ showCheckPinModal: false });
    navigation.navigate(ASSETS);
  };

  renderWalletListItem = ({ item }) => {
    const { navigation } = this.props;
    const isSmartWallet = item.type === ACCOUNT_TYPES.SMART_WALLET;
    const buttonSideLength = responsiveSize(84);
    return (
      <ItemWrapper>
        <ShadowedCard
          wrapperStyle={{
            flex: 1,
          }}
          contentWrapperStyle={{
            paddingVertical: 6,
            paddingHorizontal: responsiveSize(16),
            minHeight: buttonSideLength,
            justifyContent: 'center',
            flexWrap: 'wrap',
            borderWidth: 2,
            borderColor: item.isActive ? baseColors.electricBlue : baseColors.white,
            borderRadius: 6,
          }}
          onPress={() => this.switchAccount(item)}
        >
          <CardRow>
            <WalletIconWrapper>
              <WalletIcon isSmart={isSmartWallet} />
            </WalletIconWrapper>
            <CardContent>
              <CardTitle>{isSmartWallet ? 'Smart Wallet' : 'Key Wallet'}</CardTitle>
              <CardSubtitle>£236</CardSubtitle>
            </CardContent>
            {!!item.isActive && <CheckIcon name="check" />}
          </CardRow>
        </ShadowedCard>
        <ShadowedCard
          wrapperStyle={{ width: buttonSideLength, marginLeft: 8, height: '100%' }}
          contentWrapperStyle={{
            padding: 20,
            height: '100%',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onPress={() => navigation.navigate(WALLET_SETTINGS, { wallet: item })}
        >
          <SettingsIcon name="settings" />
        </ShadowedCard>
      </ItemWrapper>
    );

    // return (
    //   <ListItemWithImage
    //     label={item.type === ACCOUNT_TYPES.SMART_WALLET ? 'Smart Wallet' : 'Key Based Wallet'}
    //     imageColorFill={item.type === ACCOUNT_TYPES.SMART_WALLET ? baseColors.fireEngineRed : baseColors.deepSkyBlue}
    //     onPress={() => navigation.navigate(WALLET_SETTINGS, { wallet: item })}
    //     customAddon={
    //       <Switch
    //         onValueChange={() => this.switchAccount(item)}
    //         value={item.isActive}
    //         thumbColor={baseColors.white}
    //         trackColor={{ false: '#E5E5E5', true: '#4cd964' }}
    //         ios_backgroundColor="#f4f4f4"
    //       />
    //     }
    //   />
    // );
  };

  render() {
    const { accounts, user } = this.props;
    const { showCheckPinModal } = this.state;
    return (
      <ContainerWithHeader
        color={baseColors.white}
        headerProps={{
          background: baseColors.jellyBean,
          light: true,
          centerItems: [
            { userIcon: true },
            { title: `${user.username}'s Ethereum wallets` },
          ],
        }}
      >
        <FlatList
          data={accounts}
          keyExtractor={(item) => item.id.toString()}
          renderItem={this.renderWalletListItem}
          initialNumToRender={8}
          contentContainerStyle={{
            padding: spacing.large,
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
      </ContainerWithHeader>
    );
  }
}

const mapStateToProps = ({
  accounts: { data: accounts },
  user: { data: user },
}) => ({
  accounts,
  user,
});

const mapDispatchToProps = (dispatch: Function) => ({
  switchAccount: (accountId: string, privateKey?: string) => dispatch(switchAccountAction(accountId, privateKey)),
  resetIncorrectPassword: () => dispatch(resetIncorrectPasswordAction()),
});

export default connect(mapStateToProps, mapDispatchToProps)(WalletsList);
