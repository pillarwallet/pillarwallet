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
import { connect } from 'react-redux';
import styled from 'styled-components/native';
import { createStructuredSelector } from 'reselect';
import { utils } from 'ethers';
import { Container, Wrapper, Footer } from 'components/Layout';
import Header from 'components/Header';
import Button from 'components/Button';
import Spinner from 'components/Spinner';
import {
  Paragraph,
  BaseText,
} from 'components/Typography';
import { baseColors, spacing, fontSizes } from 'utils/variables';
import { SMART_WALLET_UNLOCK } from 'constants/navigationConstants';
import { upgradeToSmartWalletAction } from 'actions/smartWalletActions';
import { fetchGasInfoAction } from 'actions/historyActions';
import { formatAmount } from 'utils/common';
import { accountBalancesSelector } from 'selectors/balances';
import type { Assets, Balances, AssetTransfer } from 'models/Asset';
import type { GasInfo } from 'models/GasInfo';

type Props = {
  navigation: NavigationScreenProp<*>,
  fetchAssetsBalances: (assets: Assets, walletAddress: string) => Function,
  assets: Assets,
  balances: Balances,
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

class UpgradeConfirmScreen extends React.PureComponent<Props, State> {
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

  onNextClick = () => {
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
      transferAssets,
      transferCollectibles,
    } = this.props;
    const {
      upgradeStarted,
    } = this.state;

    const gasPriceWei = this.getGasPriceWei();
    const assetsTransferFee = formatAmount(utils.formatEther(
      gasPriceWei * (transferAssets.length + transferCollectibles.length)),
    );
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
        <Footer>
          <FooterInner style={{ flexDirection: 'column', alignItems: 'flex-end' }}>
            <LabelWrapper>
              <Label style={{ textAlign: 'center' }}>{`Total fee ${assetsTransferFee} ETH`}</Label>
            </LabelWrapper>
            {!upgradeStarted && <Button block title="Deploy Smart Wallet" onPress={this.onNextClick} />}
            {upgradeStarted && <Wrapper style={{ width: '100%', alignItems: 'center' }}><Spinner /></Wrapper>}
          </FooterInner>
        </Footer>
      </Container>
    );
  }
}

const mapStateToProps = ({
  smartWallet: { upgrade: { transfer: { assets: transferAssets, collectibles: transferCollectibles } } },
  assets: { data: assets },
  session: { data: session },
  history: { gasInfo },
}) => ({
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

export default connect(combinedMapStateToProps, mapDispatchToProps)(UpgradeConfirmScreen);
