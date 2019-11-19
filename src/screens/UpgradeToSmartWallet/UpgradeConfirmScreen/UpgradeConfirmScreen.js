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
import { ScrollView } from 'react-native';
import { connect } from 'react-redux';
import styled from 'styled-components/native';
import { createStructuredSelector } from 'reselect';
import { utils } from 'ethers';
import { BigNumber } from 'bignumber.js';
import isEmpty from 'lodash.isempty';
import isEqual from 'lodash.isequal';
import type { NavigationScreenProp } from 'react-navigation';

import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import { Wrapper } from 'components/Layout';
import Button from 'components/Button';
import Spinner from 'components/Spinner';
import { Paragraph, BaseText, MediumText } from 'components/Typography';
import { baseColors, fontStyles, spacing } from 'utils/variables';
import { SMART_WALLET_UNLOCK } from 'constants/navigationConstants';
import { ETH, defaultFiatCurrency } from 'constants/assetsConstants';
import { fetchGasInfoAction } from 'actions/historyActions';
import { fetchAssetsBalancesAction } from 'actions/assetsActions';
import { formatAmount, getCurrencySymbol, getGasPriceWei } from 'utils/common';
import { getRate, getBalance, getAssetsAsList } from 'utils/assets';
import { accountBalancesSelector } from 'selectors/balances';
import { accountCollectiblesSelector } from 'selectors/collectibles';
import { accountAssetsSelector } from 'selectors/assets';
import smartWalletService from 'services/smartWallet';

import type { Assets, Balances, AssetTransfer, Rates } from 'models/Asset';
import type { GasInfo } from 'models/GasInfo';
import type { Collectible } from 'models/Collectible';

type Props = {
  navigation: NavigationScreenProp<*>,
  fetchAssetsBalances: () => Function,
  assets: Assets,
  balances: Balances,
  transferAssets: AssetTransfer[],
  transferCollectibles: AssetTransfer[],
  fetchGasInfo: Function,
  gasInfo: GasInfo,
  isOnline: boolean,
  baseFiatCurrency: string,
  rates: Rates,
  collectibles: Collectible[],
};

type State = {
  upgradeStarted: boolean,
  deployEstimateFee: BigNumber,
};

const DetailsTitle = styled(BaseText)`
  ${fontStyles.regular};
  color: #999999;
`;

const DetailsValue = styled(MediumText)`
  ${fontStyles.big};
  color: ${baseColors.text};
`;

const DetailsLine = styled.View`
  padding-bottom: ${spacing.rhythm}px;
`;

const DetailsWrapper = styled.View`
  padding: 30px ${spacing.large}px 0px ${spacing.large}px;
`;

const WarningMessage = styled(Paragraph)`
  text-align: center;
  color: ${baseColors.negative};
  padding-bottom: ${spacing.rhythm}px;
`;

class UpgradeConfirmScreen extends React.PureComponent<Props, State> {
  gasLimit: number = 0;
  state = {
    upgradeStarted: false,
    deployEstimateFee: 0,
  };

  componentDidMount() {
    this.updateGasInfoAndBalances();
    this.updateDeploymentFee();
  }

  componentDidUpdate(prevProps: Props) {
    const {
      isOnline,
      gasInfo,
    } = this.props;
    if (prevProps.isOnline !== isOnline && isOnline) {
      this.updateGasInfoAndBalances();
      this.updateDeploymentFee();
    } else if (!isEqual(prevProps.gasInfo, gasInfo)) {
      this.updateDeploymentFee();
    }
  }

  updateGasInfoAndBalances = () => {
    const { fetchGasInfo, fetchAssetsBalances } = this.props;
    fetchGasInfo();
    fetchAssetsBalances();
  };

  updateDeploymentFee = () => {
    const { gasInfo } = this.props;
    const { deployEstimateFee: currentDeployEstimateFee } = this.state;
    // set "getting fee" (fee is 0) state
    if (currentDeployEstimateFee !== 0) this.setState({ deployEstimateFee: 0 });
    smartWalletService.estimateAccountDeployment(gasInfo)
      .then(deployEstimateFee => this.setState({ deployEstimateFee }))
      .catch(() => {});
  };

  onNextClick = (ethTransferAmountBN: BigNumber) => {
    const {
      assets,
      collectibles,
      navigation,
      transferAssets,
      transferCollectibles,
      gasInfo,
    } = this.props;
    const { upgradeStarted } = this.state;
    if (upgradeStarted) return;
    this.setState({ upgradeStarted: true });
    const gasPriceWei = getGasPriceWei(gasInfo);
    const gasPrice = gasPriceWei.toNumber();
    const assetsArray = getAssetsAsList(assets);
    const transferTransactionsCombined = [
      ...transferCollectibles,
      ...transferAssets,
    ].map((transferTransaction: any) => {
      const {
        name: assetName,
        key: collectibleKey,
        amount,
        gasLimit,
      } = transferTransaction;
      // receiver address is added on last upgrade step, account address is yet to be received
      // no amount means collectible
      if (!amount) {
        const collectible: any = collectibles.find(
          (_collectible: any) => `${_collectible.assetContract}${_collectible.name}` === collectibleKey,
        );
        const {
          name,
          tokenType,
          id: tokenId,
          contractAddress,
        } = collectible;
        return {
          name,
          contractAddress,
          tokenType,
          tokenId,
          gasLimit,
          gasPrice,
        };
      }
      const asset: any = assetsArray.find((_asset: any) => _asset.name === assetName);
      const {
        symbol,
        address: contractAddress,
        decimals,
      } = asset;
      return {
        amount,
        gasLimit,
        gasPrice,
        symbol,
        contractAddress,
        decimals,
      };
    });
    const ethTransaction = transferTransactionsCombined.find(({ symbol }: any) => symbol === ETH);
    // make sure ether transaction is the last one, very important!
    const transferTransactions = transferTransactionsCombined
      .filter(({ symbol }: any) => symbol !== ETH)
      .concat({ ...ethTransaction, amount: ethTransferAmountBN.toNumber() });
    this.setState({ upgradeStarted: false }, () => {
      navigation.navigate(SMART_WALLET_UNLOCK, { transferTransactions });
    });
  };

  calculateTransferFee = (gasLimit) => {
    const { gasInfo } = this.props;
    const gasPriceWei = getGasPriceWei(gasInfo);
    return gasLimit && gasPriceWei.mul(gasLimit).toNumber();
  };

  renderSpinner() {
    return <Wrapper style={{ width: '100%', alignItems: 'center' }}><Spinner /></Wrapper>;
  }

  renderDetails = () => {
    const {
      transferAssets,
      transferCollectibles,
      assets,
      balances,
      baseFiatCurrency,
      rates,
      isOnline,
    } = this.props;
    const {
      upgradeStarted,
      deployEstimateFee,
    } = this.state;

    const fiatCurrency = baseFiatCurrency || defaultFiatCurrency;
    const fiatSymbol = getCurrencySymbol(fiatCurrency);

    const assetsTransferFeeTotal = transferAssets
      .reduce((a, b: any) => a + this.calculateTransferFee(b.gasLimit), 0);
    const feeTokensTransferEthBN = new BigNumber(utils.formatEther(
      new BigNumber(assetsTransferFeeTotal).toFixed(),
    ));
    const feeTokensTransferFiatBN = feeTokensTransferEthBN.multipliedBy(getRate(rates, ETH, fiatCurrency));
    const feeTokensTransferEthFormatted = formatAmount(feeTokensTransferEthBN.toString());
    const assetsTransferFee =
      `${feeTokensTransferEthFormatted} ETH (${fiatSymbol}${feeTokensTransferFiatBN.toFixed(2)})`;

    let collectiblesTransferFee;
    if (transferCollectibles.length) {
      const collectiblesTransferFeeTotal = transferCollectibles
        .reduce((a, b: any) => a + this.calculateTransferFee(b.gasLimit), 0);
      const feeCollectiblesTransferEthBN = new BigNumber(utils.formatEther(
        new BigNumber(collectiblesTransferFeeTotal).toFixed(),
      ));
      const feeCollectiblesTransferFiatBN = feeCollectiblesTransferEthBN
        .multipliedBy(getRate(rates, ETH, fiatCurrency));
      const feeCollectiblesTransferEthFormatted = formatAmount(feeCollectiblesTransferEthBN.toString());
      collectiblesTransferFee =
        `${feeCollectiblesTransferEthFormatted} ETH (${fiatSymbol}${feeCollectiblesTransferFiatBN.toFixed(2)})`;
    }

    const feeSmartContractDeployEthBN = new BigNumber(utils.formatEther(deployEstimateFee.toString()));
    const feeSmartContractDeployFiatBN = feeSmartContractDeployEthBN.multipliedBy(getRate(rates, ETH, fiatCurrency));
    const feeSmartContractDeployEthFormatted = formatAmount(feeSmartContractDeployEthBN.toString());
    const smartContractDeployFee =
      `${feeSmartContractDeployEthFormatted} ETH (${fiatSymbol}${feeSmartContractDeployFiatBN.toFixed(2)})`;

    const assetsArray = getAssetsAsList(assets);
    const nonEmptyAssets = transferAssets.map((transferAsset: any) => {
      const asset: any = assetsArray.find((_asset: any) => _asset.name === transferAsset.name) || {};
      const { amount } = transferAsset;
      const { symbol } = asset;
      return {
        amount,
        symbol,
      };
    });

    const etherTransfer = nonEmptyAssets.find(asset => asset.symbol === ETH);
    const etherBalanceBN = new BigNumber(getBalance(balances, ETH));
    const { amount: etherTransferAmount } = etherTransfer || {};
    const etherTransferAmountBN = new BigNumber(etherTransferAmount);
    const etherBalanceAfterTransfer = etherBalanceBN
      .minus(etherTransferAmountBN)
      .minus(feeTokensTransferEthBN);
    const etherTransferAmountUpdatedBN = etherBalanceAfterTransfer.lt(0)
      ? etherTransferAmountBN.minus(feeTokensTransferEthBN)
      : etherTransferAmountBN;

    const updatedTransferAssets = nonEmptyAssets
      .filter(asset => asset.symbol !== ETH)
      .concat({ ...etherTransfer, amount: etherTransferAmountUpdatedBN.toNumber() });

    /**
     * there should be selected enough ether for contract deployment
     * and there should be enough ether in primary wallet for assets transfer
     ***
     * feeSmartContractDeployEth is formatted float with 6 decimals, when comparing
     * we want to make sure that compared values also are with 6 decimals as comparison
     * might fail due rounding
     */

    const notEnoughEtherForTokensTransfer = !etherTransfer
      || etherBalanceBN.minus(etherTransferAmountUpdatedBN).lt(feeTokensTransferEthBN);

    const notEnoughEtherForContractDeployment = !etherTransfer
      || etherTransferAmountUpdatedBN.lt(feeSmartContractDeployEthBN);

    const notEnoughEther = notEnoughEtherForTokensTransfer || notEnoughEtherForContractDeployment;

    let errorMessage = '';
    if (!isOnline) {
      errorMessage = 'You need to be online in order to create Smart Wallet.';
    } else if (!etherTransfer) {
      errorMessage = 'You need to select to transfer ETH in order to cover the contract deployment fee.';
    } else if (notEnoughEtherForTokensTransfer) {
      errorMessage = `There is not enough ether left in order to cover the assets transfer fee.
        Please reduce the amount of ETH you would like to transfer`;
    } else if (notEnoughEtherForContractDeployment) {
      errorMessage = 'There is not enough ether being sent to smart contract ' +
        'in order to cover the contract deployment fee.';
    }

    const isGettingDeploymentFee = isOnline && parseFloat(deployEstimateFee.toString()) <= 0;
    const submitButtonTitle = isGettingDeploymentFee
      ? 'Getting deployment fee..'
      : 'Create Smart Wallet';
    const isSubmitDisabled = !!notEnoughEther || !isEmpty(errorMessage) || isGettingDeploymentFee;

    return (
      <React.Fragment>
        <DetailsLine>
          <DetailsTitle>Assets to transfer</DetailsTitle>
          {updatedTransferAssets.map((asset: any, index: number) =>
            <DetailsValue key={index}>{`${asset.amount} ${asset.symbol}`}</DetailsValue>)
          }
        </DetailsLine>
        <DetailsLine>
          <DetailsTitle>Est. fee for assets transfer</DetailsTitle>
          <DetailsValue>{assetsTransferFee}</DetailsValue>
        </DetailsLine>
        {!!transferCollectibles.length &&
          <DetailsLine>
            <DetailsTitle>Est. fee for collectibles transfer</DetailsTitle>
            <DetailsValue>{collectiblesTransferFee}</DetailsValue>
          </DetailsLine>
        }
        <DetailsLine>
          <DetailsTitle>Est. fee for smart contract deployment</DetailsTitle>
          {isGettingDeploymentFee && <Spinner style={{ marginTop: 5 }} width={20} height={20} />}
          {!isGettingDeploymentFee && <DetailsValue>{smartContractDeployFee}</DetailsValue>}
        </DetailsLine>
        {!isEmpty(errorMessage) && <WarningMessage small>{errorMessage}</WarningMessage>}
        {!upgradeStarted &&
          <Button
            block
            disabled={isSubmitDisabled}
            title={submitButtonTitle}
            onPress={() => this.onNextClick(etherTransferAmountUpdatedBN)}
          />
        }
      </React.Fragment>
    );
  };

  render() {
    const { gasInfo } = this.props;
    const { upgradeStarted } = this.state;
    const showSpinner = !gasInfo.isFetched || upgradeStarted;
    return (
      <ContainerWithHeader
        headerProps={{ centerItems: [{ title: 'Confirm' }] }}
        backgroundColor={baseColors.white}
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} style={{ flexGrow: 1 }}>
          <Paragraph small style={{ margin: spacing.large }}>
            Please confirm that the details below are correct before deploying your Smart Wallet.
          </Paragraph>
          <DetailsWrapper>
            {showSpinner && this.renderSpinner()}
            {!showSpinner && this.renderDetails()}
          </DetailsWrapper>
        </ScrollView>
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
  session: { data: { isOnline } },
  history: { gasInfo },
  appSettings: { data: { baseFiatCurrency } },
  rates: { data: rates },
}) => ({
  transferAssets,
  transferCollectibles,
  isOnline,
  gasInfo,
  baseFiatCurrency,
  rates,
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
  fetchAssetsBalances: () => dispatch(fetchAssetsBalancesAction()),
});

export default connect(combinedMapStateToProps, mapDispatchToProps)(UpgradeConfirmScreen);
