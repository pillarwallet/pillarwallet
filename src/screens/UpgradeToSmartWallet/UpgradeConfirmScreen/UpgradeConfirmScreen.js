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
import { BigNumber } from 'bignumber.js';
import { Container, Wrapper } from 'components/Layout';
import Header from 'components/Header';
import Button from 'components/Button';
import Spinner from 'components/Spinner';
import {
  Paragraph,
  BaseText,
} from 'components/Typography';
import { baseColors, fontSizes, fontWeights, spacing } from 'utils/variables';
import { SMART_WALLET_UNLOCK } from 'constants/navigationConstants';
import { ETH, defaultFiatCurrency } from 'constants/assetsConstants';
import { fetchGasInfoAction } from 'actions/historyActions';
import { formatAmount, getCurrencySymbol } from 'utils/common';
import { getRate } from 'utils/assets';
import { accountBalancesSelector } from 'selectors/balances';
import type { Assets, Balances, AssetTransfer, Rates } from 'models/Asset';
import type { GasInfo } from 'models/GasInfo';

type Props = {
  navigation: NavigationScreenProp<*>,
  fetchAssetsBalances: (assets: Assets, walletAddress: string) => Function,
  assets: Assets,
  balances: Balances,
  transferAssets: AssetTransfer[],
  transferCollectibles: AssetTransfer[],
  fetchGasInfo: Function,
  gasInfo: GasInfo,
  session: Object,
  baseFiatCurrency: string,
  rates: Rates,
};

type State = {
  upgradeStarted: boolean,
};

const WhiteWrapper = styled.View`
  background-color: ${baseColors.white};
  padding-bottom: ${spacing.rhythm}px;
`;

const DetailsTitle = styled(BaseText)`
  font-size: ${fontSizes.extraSmall}px;
  padding-bottom: 5px;
  color: #999999;
`;

const DetailsValue = styled(BaseText)`
  font-size: ${fontSizes.medium};
  color: ${baseColors.slateBlack};
  font-weight: ${fontWeights.medium};
`;

const DetailsLine = styled.View`
  padding-bottom: ${spacing.rhythm}px;
`;

const DetailsWrapper = styled.View`
  padding: 30px 20px 0px 20px;
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

  onNextClick = (gasPrice) => {
    const {
      assets,
      transferAssets,
      transferCollectibles,
      navigation,
    } = this.props;
    this.setState({ upgradeStarted: true });
    const assetsArray = Object.values(assets);
    const transferTransactions = [
      ...transferCollectibles,
      ...transferAssets,
    ].map(({ name: assetName, amount }) => {
      // receiver address is added on last upgrade step, account address is yet to be received
      if (!amount) {
        // TODO: collectible transfer
        // const asset: any = assetsArray.find((_asset: any) => _asset.name === assetName);
        // const {
        //   tokenType,
        //   id: tokenId,
        //   contractAddress,
        // } = asset;
        // return {
        //   name,
        //   contractAddress,
        //   tokenType,
        //   tokenId,
        // }
        return {}; // temporary return before collectibles is sorted out
      }
      const asset: any = assetsArray.find((_asset: any) => _asset.name === assetName);
      const txFeeInWei = gasPrice.div(GAS_LIMIT).toNumber();
      const {
        symbol,
        address: contractAddress,
        decimals,
      } = asset;
      return {
        amount,
        gasLimit: GAS_LIMIT,
        gasPrice,
        txFeeInWei,
        symbol,
        contractAddress,
        decimals,
      };
    }).filter(tx => Object.keys(tx).length); // temporary filter before collectibles is sorted out
    this.setState({ upgradeStarted: false }, () => {
      navigation.navigate(SMART_WALLET_UNLOCK, { transferTransactions });
    });
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
      assets,
      baseFiatCurrency,
      rates,
    } = this.props;
    const {
      upgradeStarted,
    } = this.state;

    const fiatCurrency = baseFiatCurrency || defaultFiatCurrency;
    const gasPriceWei = this.getGasPriceWei();
    const fiatSymbol = getCurrencySymbol(fiatCurrency);

    const feeTokensTransferEth = formatAmount(utils.formatEther(
      BigNumber(gasPriceWei * (transferAssets.length + transferCollectibles.length)).toFixed(),
    ));
    const feeTokensTransferFiat = parseFloat(feeTokensTransferEth) * getRate(rates, ETH, fiatCurrency);
    const assetsTransferFee =
      `${feeTokensTransferEth} ETH (${fiatSymbol}${feeTokensTransferFiat.toFixed(2)})`;

    const feeSmartContractDeployEth = formatAmount(utils.formatEther(gasPriceWei));
    const feeSmartContractDeployFiat = parseFloat(feeSmartContractDeployEth) * getRate(rates, ETH, fiatCurrency);
    const smartContractDeployFee =
      `${feeSmartContractDeployEth} ETH (${fiatSymbol}${feeSmartContractDeployFiat.toFixed(2)})`;

    const assetsArray = Object.values(assets);
    const nonEmptyAssets = transferAssets.map((transferAsset: any) => {
      const asset: any = assetsArray.find((_asset: any) => _asset.name === transferAsset.name);
      const { amount } = transferAsset;
      const { symbol } = asset;
      return {
        amount,
        symbol,
      };
    });

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
        <DetailsWrapper>
          <DetailsLine>
            <DetailsTitle>Assets to transfer</DetailsTitle>
            {nonEmptyAssets.map((asset: any, index: number) =>
              <DetailsValue key={index}>{`${asset.amount} ${asset.symbol}`}</DetailsValue>)
            }
          </DetailsLine>
          <DetailsLine>
            <DetailsTitle>Fee for transfer</DetailsTitle>
            <DetailsValue>{assetsTransferFee}</DetailsValue>
          </DetailsLine>
          <DetailsLine>
            <DetailsTitle>Fee for smart contract deployment</DetailsTitle>
            <DetailsValue>{smartContractDeployFee}</DetailsValue>
          </DetailsLine>
          {!upgradeStarted &&
          <Button
            block
            title="Deploy Smart Wallet"
            onPress={() => this.onNextClick(gasPriceWei)}
          />}
          {upgradeStarted && <Wrapper style={{ width: '100%', alignItems: 'center' }}><Spinner /></Wrapper>}
        </DetailsWrapper>
      </Container>
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
  assets: { data: assets },
  session: { data: session },
  history: { gasInfo },
  appSettings: { data: { baseFiatCurrency } },
  rates: { data: rates },
}) => ({
  transferAssets,
  transferCollectibles,
  assets,
  session,
  gasInfo,
  baseFiatCurrency,
  rates,
});

const structuredSelector = createStructuredSelector({
  balances: accountBalancesSelector,
});

const combinedMapStateToProps = (state) => ({
  ...structuredSelector(state),
  ...mapStateToProps(state),
});

const mapDispatchToProps = (dispatch) => ({
  fetchGasInfo: () => dispatch(fetchGasInfoAction()),
});

export default connect(combinedMapStateToProps, mapDispatchToProps)(UpgradeConfirmScreen);
