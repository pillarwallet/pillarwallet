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
import { connect } from 'react-redux';
import { SDK_PROVIDER } from 'react-native-dotenv';
import styled from 'styled-components/native';
import { createStructuredSelector } from 'reselect';
import { utils } from 'ethers';
import { BigNumber } from 'bignumber.js';

// actions
import { fetchGasInfoAction } from 'actions/historyActions';

// components
import { Container, Wrapper, Footer } from 'components/Layout';
import Header from 'components/Header';
import Button from 'components/Button';
import Separator from 'components/Separator';
import ListItemWithImage from 'components/ListItem/ListItemWithImage';
import {
  Paragraph,
  SubHeading,
  TextLink,
  BaseText,
} from 'components/Typography';

// configs
import assetsConfig from 'configs/assetsConfig';

// constants
import {
  RECOVERY_AGENTS,
  CHOOSE_ASSETS_TO_TRANSFER,
  CONTACT,
  UPGRADE_CONFIRM,
} from 'constants/navigationConstants';
import { ETH } from 'constants/assetsConstants';

// selectors
import { accountBalancesSelector } from 'selectors/balances';
import { accountCollectiblesSelector } from 'selectors/collectibles';

// types
import type { Assets, Balances, AssetTransfer } from 'models/Asset';
import type { GasInfo } from 'models/GasInfo';
import type { RecoveryAgent } from 'models/RecoveryAgents';
import type { Collectible } from 'models/Collectible';

// utils
import { baseColors, spacing, fontSizes } from 'utils/variables';
import { formatAmount, getGasPriceWei } from 'utils/common';
import { getBalance } from 'utils/assets';


type Props = {
  navigation: NavigationScreenProp<*>,
  assets: Assets,
  balances: Balances,
  recoveryAgents: RecoveryAgent[],
  transferAssets: AssetTransfer[],
  transferCollectibles: AssetTransfer[],
  fetchGasInfo: Function,
  gasInfo: GasInfo,
  session: Object,
  collectibles: Collectible[],
};

const WhiteWrapper = styled.View`
  background-color: ${baseColors.white};
  padding-bottom: ${spacing.rhythm}px;
`;

const FooterInner = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: flex-end;
  width: 100%;
  background-color: ${baseColors.snowWhite};
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

const GAS_LIMIT = 500000;
const genericToken = require('assets/images/tokens/genericToken.png');

const WarningMessage = styled(Paragraph)`
  text-align: center;
  font-size: ${fontSizes.extraSmall};
  color: ${baseColors.fireEngineRed};
  padding-bottom: ${spacing.rhythm}px;
`;

class UpgradeReviewScreen extends React.PureComponent<Props> {
  componentDidMount() {
    this.props.fetchGasInfo();
  }

  componentDidUpdate(prevProps: Props) {
    if (prevProps.session.isOnline !== this.props.session.isOnline && this.props.session.isOnline) {
      this.props.fetchGasInfo();
    }
  }

  navigateToContactScreen = (contact: Object) => () => {
    this.props.navigation.navigate(CONTACT, { contact });
  };

  renderItem = ({ item }) => {
    const name = item.username || item.serviceName;
    // recovery agent item
    if (name) {
      return (
        <ListItemWithImage
          label={name}
          avatarUrl={item.profileImage || item.icon}
          navigateToProfile={() => this.navigateToContactScreen(item)}
          imageUpdateTimeStamp={item.lastUpdateTime}
        />
      );
    }

    // any asset transaction fee
    const gasPriceWei = getGasPriceWei(this.props.gasInfo);
    const transferFee = formatAmount(utils.formatEther(gasPriceWei));

    // collectible item
    if (item.collectibleKey) {
      return (
        <ListItemWithImage
          label={item.name}
          itemImageUrl={item.icon || genericToken}
          fallbackSource={genericToken}
          rightColumnInnerStyle={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
          }}
          customAddon={
            <Label style={{ textAlign: 'right' }}>{`Est. fee ${transferFee} ETH`}</Label>
          }
        />
      );
    }

    // token item
    const assetShouldRender = assetsConfig[item.symbol] && !assetsConfig[item.symbol].send;
    if (assetShouldRender) {
      return null;
    }

    const fullIconUrl = `${SDK_PROVIDER}/${item.iconUrl}?size=3`;
    const formattedAmount = formatAmount(item.amount);

    return (
      <ListItemWithImage
        label={item.name}
        itemImageUrl={fullIconUrl || genericToken}
        itemValue={`${formattedAmount} ${item.symbol}`}
        fallbackSource={genericToken}
        rightColumnInnerStyle={{
          flex: 1,
          alignItems: 'flex-end',
          justifyContent: 'flex-end',
        }}
        customAddon={
          <Label style={{ textAlign: 'right' }}>{`Est. fee ${transferFee} ETH`}</Label>
        }
      />
    );
  };

  onNextClick = () => {
    const { navigation } = this.props;
    navigation.navigate(UPGRADE_CONFIRM);
  };

  getTokenTransferPrice(gasPriceWei: BigNumber) {
    return gasPriceWei.mul(GAS_LIMIT);
  }

  render() {
    const {
      balances,
      navigation,
      transferAssets,
      transferCollectibles,
      assets,
      collectibles,
      recoveryAgents,
      gasInfo,
    } = this.props;

    const gasPriceWei = getGasPriceWei(gasInfo);
    const tokenTransferPrice = this.getTokenTransferPrice(gasPriceWei);
    const assetsTransferFeeEth = formatAmount(utils.formatEther(
      new BigNumber(tokenTransferPrice * (transferAssets.length + transferCollectibles.length)).toFixed(),
    ));

    const assetsArray = Object.values(assets);
    const nonEmptyAssets = transferAssets.map((transferAsset: any) => {
      const asset = assetsArray.find((_asset: any) => _asset.name === transferAsset.name);
      return {
        ...asset,
        amount: transferAsset.amount,
      };
    });

    const detailedCollectibles: any[] = transferCollectibles.map((transferCollectible: any) => {
      const asset: any = collectibles.find(
        (_asset: any) => `${_asset.assetContract}${_asset.name}` === transferCollectible.key,
      );
      const collectibleKey = `${asset.assetContract}${asset.name}`;
      return {
        ...asset,
        collectibleKey,
      };
    });

    const sections = [];
    if (recoveryAgents.length) {
      sections.push({
        title: 'RECOVERY AGENTS',
        data: recoveryAgents,
        toEdit: RECOVERY_AGENTS,
      });
    }
    if (nonEmptyAssets.length) {
      sections.push({
        title: 'TOKENS',
        data: nonEmptyAssets,
        toEdit: CHOOSE_ASSETS_TO_TRANSFER,
      });
    }
    if (detailedCollectibles.length) {
      sections.push({
        title: 'COLLECTIBLES',
        data: detailedCollectibles,
        toEdit: CHOOSE_ASSETS_TO_TRANSFER,
      });
    }
    const etherBalance = getBalance(balances, ETH);

    // there should be enough to transfer selected assets from primary wallet
    const notEnoughEther = !etherBalance || etherBalance < parseFloat(assetsTransferFeeEth);
    return (
      <Container>
        <WhiteWrapper>
          <Header
            title="review"
            centerTitle
            onBack={() => navigation.goBack(null)}
          />
          <Wrapper regularPadding>
            <Paragraph small>
              Please confirm that the details below are correct before deploying your Smart Wallet.
            </Paragraph>
          </Wrapper>
        </WhiteWrapper>
        <SectionList
          sections={sections}
          renderSectionHeader={({ section }) => (
            <ListSeparator>
              <SubHeading>{section.title}</SubHeading>
              <TextLink onPress={() => navigation.navigate(section.toEdit, { isEditing: true })}>Edit</TextLink>
            </ListSeparator>
          )}
          renderItem={this.renderItem}
          keyExtractor={(item) => item.id}
          ItemSeparatorComponent={() => <Separator spaceOnLeft={82} />}
        />
        <Footer>
          {!!notEnoughEther &&
          <WarningMessage>
            There is not enough ether for asset transfer transactions estimated fee.
          </WarningMessage>}
          <FooterInner style={{ flexDirection: 'column', alignItems: 'flex-end' }}>
            <LabelWrapper>
              <Label style={{ textAlign: 'center' }}>{`Total estimated fee ${assetsTransferFeeEth} ETH`}</Label>
            </LabelWrapper>
            <Button disabled={!!notEnoughEther} block title="Continue" onPress={this.onNextClick} />
          </FooterInner>
        </Footer>
      </Container>
    );
  }
}

const mapStateToProps = ({
  smartWallet: {
    upgrade: {
      recoveryAgents,
      transfer: {
        assets: transferAssets,
        collectibles: transferCollectibles,
      },
    },
  },
  assets: { data: assets },
  session: { data: session },
  history: { gasInfo },
}) => ({
  recoveryAgents,
  transferAssets,
  transferCollectibles,
  assets,
  session,
  gasInfo,
});

const structuredSelector = createStructuredSelector({
  balances: accountBalancesSelector,
  collectibles: accountCollectiblesSelector,
});

const combinedMapStateToProps = (state) => ({
  ...structuredSelector(state),
  ...mapStateToProps(state),
});

const mapDispatchToProps = (dispatch) => ({
  fetchGasInfo: () => dispatch(fetchGasInfoAction()),
});

export default connect(combinedMapStateToProps, mapDispatchToProps)(UpgradeReviewScreen);
