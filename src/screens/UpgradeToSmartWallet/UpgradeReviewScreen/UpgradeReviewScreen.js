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
import { SectionList, ScrollView } from 'react-native';
import { connect } from 'react-redux';
import { SDK_PROVIDER } from 'react-native-dotenv';
import styled from 'styled-components/native';
import { createStructuredSelector } from 'reselect';
import { utils } from 'ethers';
import { BigNumber } from 'bignumber.js';

// actions
import { fetchGasInfoAction } from 'actions/historyActions';
import { getAssetTransferGasLimitsAction } from 'actions/smartWalletActions';

// components
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import { Footer } from 'components/Layout';
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
import type { Collectible } from 'models/Collectible';

// utils
import { spacing, fontStyles } from 'utils/variables';
import { formatAmount, getGasPriceWei } from 'utils/common';
import { getAssetsAsList, getBalance } from 'utils/assets';
import { themedColors } from 'utils/themes';
import { accountAssetsSelector } from 'selectors/assets';


type Props = {
  navigation: NavigationScreenProp<*>,
  assets: Assets,
  balances: Balances,
  transferAssets: AssetTransfer[],
  transferCollectibles: AssetTransfer[],
  fetchGasInfo: Function,
  gasInfo: GasInfo,
  session: Object,
  collectibles: Collectible[],
  getAssetTransferGasLimits: Function,
};


const FooterInner = styled.View`
  flex-direction: column;
  justify-content: space-between;
  align-items: flex-end;
  width: 100%;
`;

const ListSeparator = styled.View`
  padding: 20px ${spacing.rhythm}px;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
`;

const Label = styled(BaseText)`
  ${fontStyles.small};
  color: #999999;
`;

const LabelWrapper = styled.View`
  width: 100%;
  padding: 0 ${spacing.large}px 10px;
  justify-content: center;
`;

const WarningMessage = styled(Paragraph)`
  text-align: center;
  color: ${themedColors.negative};
  padding-bottom: ${spacing.rhythm}px;
`;


class UpgradeReviewScreen extends React.PureComponent<Props> {
  componentDidMount() {
    this.props.fetchGasInfo();
    this.props.getAssetTransferGasLimits();
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
    const transferFee = item.transferFee && formatAmount(utils.formatEther(item.transferFee));

    // collectible item
    if (item.collectibleKey) {
      return (
        <ListItemWithImage
          label={item.name}
          itemImageUrl={item.icon}
          fallbackToGenericToken
          rightColumnInnerStyle={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
          }}
          customAddon={
            <Label style={{ textAlign: 'right' }}>{(transferFee && `Est. fee ${transferFee} ETH`) || ''}</Label>
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
        itemImageUrl={fullIconUrl}
        itemValue={`${formattedAmount} ${item.symbol}`}
        fallbackToGenericToken
        rightColumnInnerStyle={{
          flex: 1,
          alignItems: 'flex-end',
          justifyContent: 'flex-end',
        }}
        customAddon={
          <Label style={{ textAlign: 'right' }}>{(transferFee && `Est. fee ${transferFee} ETH`) || ''}</Label>
        }
      />
    );
  };

  onNextClick = () => {
    const { navigation } = this.props;
    navigation.navigate(UPGRADE_CONFIRM, { gasLimit: 0 });
  };

  calculateTransferFee = (gasLimit) => {
    const { gasInfo } = this.props;
    const gasPriceWei = getGasPriceWei(gasInfo);
    return gasLimit && gasPriceWei.mul(gasLimit).toNumber();
  };

  render() {
    const {
      balances,
      navigation,
      transferAssets,
      transferCollectibles,
      assets,
      collectibles,
    } = this.props;
    const assetsArray = getAssetsAsList(assets);
    const detailedAssets = transferAssets.map((transferAsset: any) => {
      const asset = assetsArray.find((_asset: any) => _asset.name === transferAsset.name);
      const transferFee = this.calculateTransferFee(transferAsset.gasLimit);
      return {
        ...asset,
        amount: transferAsset.amount,
        transferFee,
      };
    });

    const detailedCollectibles: any[] = transferCollectibles.map((transferCollectible: any) => {
      const asset: any = collectibles.find(
        ({ assetContract, name }) => `${assetContract}${name}` === transferCollectible.key,
      );
      const collectibleKey = `${asset.assetContract}${asset.name}`;
      const transferFee = this.calculateTransferFee(transferCollectible.gasLimit);
      return {
        ...asset,
        collectibleKey,
        transferFee,
      };
    });

    const sections = [];
    if (detailedAssets.length) {
      sections.push({
        title: 'TOKENS',
        data: detailedAssets,
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

    // check if any asset transfer left without gas limit
    const gettingGasLimits = !![...transferAssets, ...transferCollectibles].find(({ gasLimit }) => !gasLimit);

    const assetsTransferFeeTotal = [
      ...detailedAssets,
      ...detailedCollectibles,
    ].reduce((a, b: any) => a + b.transferFee, 0);

    const assetsTransferFeeTotalEth = assetsTransferFeeTotal
      ? formatAmount(utils.formatEther(
        new BigNumber(assetsTransferFeeTotal).toFixed(),
      ))
      : 0;

    // there should be enough eth to transfer selected assets from primary wallet
    const etherBalance = getBalance(balances, ETH);
    const notEnoughEther = !gettingGasLimits && (!etherBalance || etherBalance < parseFloat(assetsTransferFeeTotalEth));

    const nextButtonTitle = gettingGasLimits
      ? 'Getting the fees..'
      : 'Continue';

    return (
      <ContainerWithHeader
        headerProps={{ centerItems: [{ title: 'Review' }] }}
      >
        <ScrollView>
          <Paragraph small style={{ margin: spacing.large }}>
            Please confirm that the details below are correct before deploying your Smart Wallet.
          </Paragraph>
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
            stickySectionHeadersEnabled={false}
          />
        </ScrollView>
        <Footer>
          {!!notEnoughEther &&
          <WarningMessage small>
            There is not enough ether for asset transfer transactions estimated fee.
          </WarningMessage>}
          <FooterInner>
            <LabelWrapper>
              {!gettingGasLimits &&
                <Label style={{ textAlign: 'center' }}>{`Total estimated fee ${assetsTransferFeeTotalEth} ETH`}</Label>
              }
            </LabelWrapper>
            <Button
              block
              disabled={!!notEnoughEther || gettingGasLimits}
              title={nextButtonTitle}
              onPress={this.onNextClick}
            />
          </FooterInner>
        </Footer>
      </ContainerWithHeader>
    );
  }
}

const mapStateToProps = ({
  smartWallet: {
    upgrade: {
      transfer: {
        assets: transferAssets,
        collectibles: transferCollectibles,
      },
    },
  },
  session: { data: session },
  history: { gasInfo },
}) => ({
  transferAssets,
  transferCollectibles,
  session,
  gasInfo,
});

const structuredSelector = createStructuredSelector({
  balances: accountBalancesSelector,
  collectibles: accountCollectiblesSelector,
  assets: accountAssetsSelector,
});

const combinedMapStateToProps = (state) => ({
  ...structuredSelector(state),
  ...mapStateToProps(state),
});

const mapDispatchToProps = (dispatch) => ({
  fetchGasInfo: () => dispatch(fetchGasInfoAction()),
  getAssetTransferGasLimits: () => dispatch(getAssetTransferGasLimitsAction()),
});

export default connect(combinedMapStateToProps, mapDispatchToProps)(UpgradeReviewScreen);
