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
import { Container, Wrapper, Footer } from 'components/Layout';
import Header from 'components/Header';
import Button from 'components/Button';
import Separator from 'components/Separator';
import ListItemWithImage from 'components/ListItem/ListItemWithImage';
import Spinner from 'components/Spinner';
import {
  Paragraph,
  SubHeading,
  TextLink,
  BaseText,
} from 'components/Typography';
import { baseColors, spacing, fontSizes } from 'utils/variables';
import assetsConfig from 'configs/assetsConfig';
import {
  // RECOVERY_AGENTS,
  CHOOSE_ASSETS_TO_TRANSFER,
  CONTACT,
  SMART_WALLET_UNLOCK,
} from 'constants/navigationConstants';
import { upgradeToSmartWalletAction } from 'actions/smartWalletActions';
import { fetchGasInfoAction } from 'actions/historyActions';
import { formatAmount } from 'utils/common';
import { getBalance } from 'utils/assets';
import { accountBalancesSelector } from 'selectors/balances';
import type { Assets, Balances, AssetTransfer } from 'models/Asset';
import type { GasInfo } from 'models/GasInfo';

type Props = {
  navigation: NavigationScreenProp<*>,
  fetchAssetsBalances: (assets: Assets, walletAddress: string) => Function,
  assets: Assets,
  balances: Balances,
  contacts: Object[],
  upgradeToSmartWallet: Function,
  transferAssets: AssetTransfer[],
  transferCollectibles: AssetTransfer[],
  fetchGasInfo: Function,
  gasInfo: GasInfo,
  session: Object,
};

type State = {
  upgradeStarted: boolean,
};

const WhiteWrapper = styled.View`
  background-color: ${baseColors.white};
  padding-bottom: 20px;
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

class UpgradeReviewScreen extends React.PureComponent<Props, State> {
  state = {
    upgradeStarted: false,
  };

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
    const gasPriceWei = this.getGasPriceWei();
    const transferFee = formatAmount(utils.formatEther(gasPriceWei));
    if (assetShouldRender) {
      return null;
    }

    return (
      <ListItemWithImage
        label={item.name}
        itemImageUrl={fullIconUrl || genericToken}
        itemValue={`${assetBalance} ${item.symbol}`}
        fallbackSource={genericToken}
        rightColumnInnerStyle={{
          flex: 1,
          alignItems: 'flex-end',
          justifyContent: 'flex-end',
        }}
        customAddon={
          <Label style={{ textAlign: 'right' }}>{`Fee ${transferFee} ETH`}</Label>
        }
      />
    );
  };

  onNextClick = () => {
    // TODO: navigate to final confirm screen
    const { navigation } = this.props;
    this.setState({
      upgradeStarted: true,
    });
    navigation.navigate(SMART_WALLET_UNLOCK);
  };

  getGasPriceWei = () => {
    const { gasInfo } = this.props;
    const gasPrice = gasInfo.gasPrice.avg || 0;
    return utils.parseUnits(gasPrice.toString(), 'gwei').mul(GAS_LIMIT);
  };

  render() {
    const {
      navigation,
      // contacts,
      transferAssets,
      transferCollectibles,
      assets,
      balances,
    } = this.props;
    const {
      upgradeStarted,
    } = this.state;

    const gasPriceWei = this.getGasPriceWei();
    const assetsTransferFee = formatAmount(utils.formatEther(
      gasPriceWei * (transferAssets.length + transferCollectibles.length)),
    );

    const assetsArray = Object.values(assets);
    const nonEmptyAssets = assetsArray.filter((asset: any) =>
      getBalance(balances, asset.symbol) !== 0
      && transferAssets.find((transferAsset: any) => asset.name === transferAsset.name),
    );
    const sections = [];
    /* if (contacts.length) {
      sections.push({
        title: 'RECOVERY AGENTS',
        data: contacts,
        extraData: assets,
        toEdit: RECOVERY_AGENTS,
      });
    } */
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
            title="review"
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
        <Footer>
          <FooterInner style={{ flexDirection: 'column', alignItems: 'flex-end' }}>
            <LabelWrapper>
              <Label style={{ textAlign: 'center' }}>{`Total fee ${assetsTransferFee} ETH`}</Label>
            </LabelWrapper>
            {!upgradeStarted && <Button block title="Continue" onPress={this.onNextClick} />}
            {upgradeStarted && <Wrapper style={{ width: '100%', alignItems: 'center' }}><Spinner /></Wrapper>}
          </FooterInner>
        </Footer>
      </Container>
    );
  }
}

const mapStateToProps = ({
  contacts: { data: contacts },
  smartWallet: { upgrade: { transfer: { assets: transferAssets, collectibles: transferCollectibles } } },
  assets: { data: assets },
  session: { data: session },
  history: { gasInfo },
}) => ({
  contacts,
  transferAssets,
  transferCollectibles,
  assets,
  session,
  gasInfo,
});

const structuredSelector = createStructuredSelector({
  balances: accountBalancesSelector,
});

const combinedMapStateToProps = (state) => ({
  ...structuredSelector(state),
  ...mapStateToProps(state),
});

const mapDispatchToProps = (dispatch) => ({
  upgradeToSmartWallet: () => dispatch(upgradeToSmartWalletAction()),
  fetchGasInfo: () => dispatch(fetchGasInfoAction()),
});

export default connect(combinedMapStateToProps, mapDispatchToProps)(UpgradeReviewScreen);
