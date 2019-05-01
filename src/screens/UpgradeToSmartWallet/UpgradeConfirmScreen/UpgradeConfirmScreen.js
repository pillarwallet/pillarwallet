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
import type { NavigationScreenProp } from 'react-navigation';
import { SectionList } from 'react-native';
import styled from 'styled-components/native';
import { Container, Wrapper, Footer } from 'components/Layout';
import Header from 'components/Header';
import Button from 'components/Button';
import Separator from 'components/Separator';
import ListItemWithImage from 'components/ListItem/ListItemWithImage';
import Spinner from 'components/Spinner';
import { Paragraph, SubHeading, TextLink, BaseText } from 'components/Typography';
import { baseColors, spacing } from 'utils/variables';
import assetsConfig from 'configs/assetsConfig';
import {
  RECOVERY_AGENTS,
  CHOOSE_ASSETS_TO_TRANSFER,
  CONTACT,
  SMART_WALLET_UNLOCK,
} from 'constants/navigationConstants';
import type { Assets, Balances } from 'models/Asset';
import { upgradeToSmartWalletAction } from 'actions/walletActions';
import { connect } from 'react-redux';
import { SDK_PROVIDER } from 'react-native-dotenv';
import { formatAmount } from 'utils/common';
import { getBalance } from 'utils/assets';
import { fontSizes } from '../../../utils/variables';

type Props = {
  navigation: NavigationScreenProp<*>,
  fetchAssetsBalances: (assets: Assets, walletAddress: string) => Function,
  assets: Assets,
  balances: Balances,
  contacts: Object[],
  upgradeToSmartWallet: Function,
  sdkInitialized: boolean,
};

type State = {
  upgradeStarted: boolean,
};

const WhiteWrapper = styled.View`
  background-color: ${baseColors.white};
  padding-bottom: 20px;
`;

const FooterInner = styled.View`
  background-color: ${baseColors.snowWhite};
  flex-direction: column;
  align-items: flex-end;
`;

const ListSeparator = styled.View`
  padding: 20px ${spacing.rhythm}px;
  background-color: ${baseColors.lighterGray};
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
`;

const Label = styled(BaseText)`
  font-size: ${fontSizes.extraExtraSmall}px;
  color: #999999;
`;

const LabelWrapper = styled.View`
  width: 100%;
  padding: 0 ${spacing.large}px 10px;
  justify-content: center;
`;

const genericToken = require('assets/images/tokens/genericToken.png');

class UpgradeConfirmScreen extends React.PureComponent<Props, State> {
  state = {
    upgradeStarted: false,
  };

  navigateToContactScreen = (contact: Object) => () => {
    this.props.navigation.navigate(CONTACT, { contact });
  };

  renderItem = ({ item }) => {
    if (item.username) {
      return (
        <ListItemWithImage
          label={item.username}
          avatarUrl={item.profileImage}
          navigateToProfile={() => this.navigateToContactScreen(item)}
          imageUpdateTimeStamp={item.lastUpdateTime}
        />
      );
    }

    const { balances } = this.props;
    const assetBalance = formatAmount(getBalance(balances, item.symbol));
    const fullIconUrl = `${SDK_PROVIDER}/${item.iconUrl}?size=3`;
    const assetShouldRender = assetsConfig[item.symbol] && !assetsConfig[item.symbol].send;
    if (assetShouldRender) {
      return null;
    }

    return (
      <ListItemWithImage
        label={item.name}
        itemImageUrl={fullIconUrl || genericToken}
        itemValue={`${assetBalance} ${item.symbol}`}
        fallbackSource={genericToken}
        rightColumnInnerStyle={{ flex: 1, justifyContent: 'flex-end' }}
        customAddon={
          <Label style={{ textAlign: 'right' }}>Fee 0,004</Label>
        }
      />
    );
  };

  onEnableClick = () => {
    const { navigation } = this.props;
    this.setState({
      upgradeStarted: true,
    });
    navigation.navigate(SMART_WALLET_UNLOCK);
  };

  render() {
    const {
      navigation,
      contacts,
      assets,
      balances,
    } = this.props;
    const {
      upgradeStarted,
    } = this.state;
    const assetsArray = Object.values(assets);
    const nonEmptyAssets = assetsArray.filter((asset: any) => {
      return getBalance(balances, asset.symbol) !== 0;
    });
    const sections = [];
    if (contacts.length) {
      sections.push({
        title: 'RECOVERY AGENTS',
        data: contacts,
        extraData: assets,
        toEdit: RECOVERY_AGENTS,
      });
    }
    if (nonEmptyAssets.length) {
      sections.push({
        title: 'TOKENS',
        data: nonEmptyAssets,
        extraData: assets,
        toEdit: CHOOSE_ASSETS_TO_TRANSFER,
      });
    }

    console.log('nonEmptyAssets --->', nonEmptyAssets);

    return (
      <Container>
        <WhiteWrapper>
          <Header
            title="confirm"
            centerTitle
            onBack={() => navigation.goBack(null)}
          />
          <Wrapper regularPadding>
            <Paragraph small>
              Description here to educate people about deploying the contract.
            </Paragraph>
          </Wrapper>
        </WhiteWrapper>
        <SectionList
          sections={sections}
          renderSectionHeader={({ section }) => (
            <ListSeparator>
              <SubHeading>{section.title}</SubHeading>
              <TextLink onPress={() => navigation.navigate(section.toEdit)}>Edit</TextLink>
            </ListSeparator>
          )}
          renderItem={this.renderItem}
          keyExtractor={(item) => item.id}
          ItemSeparatorComponent={() => <Separator spaceOnLeft={82} />}
        />
        <Footer style={{ flexDirection: 'column', alignItems: 'flex-end' }}>
          <FooterInner>
            <LabelWrapper>
              <Label style={{ textAlign: 'center' }}>Total fee 0,004</Label>
            </LabelWrapper>
            {!upgradeStarted && <Button block title="Enable Smart Wallet" onPress={this.onEnableClick} />}
            {upgradeStarted && <Wrapper style={{ width: '100%', alignItems: 'center' }}><Spinner /></Wrapper>}
          </FooterInner>
        </Footer>
      </Container>
    );
  }
}

const mapStateToProps = ({
  contacts: { data: contacts },
  assets: { data: assets, balances },
  wallet: {
    smartWallet: {
      sdkInitialized,
    },
  },
}) => ({
  contacts,
  assets,
  balances,
  sdkInitialized,
});

const mapDispatchToProps = (dispatch) => ({
  upgradeToSmartWallet: () => dispatch(upgradeToSmartWalletAction()),
});

export default connect(mapStateToProps, mapDispatchToProps)(UpgradeConfirmScreen);
