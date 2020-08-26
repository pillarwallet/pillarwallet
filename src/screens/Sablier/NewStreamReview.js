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
import { utils } from 'ethers';
import { BigNumber } from 'bignumber.js';
import { connect } from 'react-redux';
import { createStructuredSelector } from 'reselect';
import styled from 'styled-components/native';
import t from 'translations/translate';

import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import Button from 'components/Button';
import { Spacing } from 'components/Layout';
import FeeLabelToggle from 'components/FeeLabelToggle';
import { SEND_TOKEN_PIN_CONFIRM } from 'constants/navigationConstants';
import { defaultFiatCurrency } from 'constants/assetsConstants';
import { SABLIER_CREATE_STREAM } from 'constants/sablierConstants';
import { getCreateStreamFeeAndTransaction } from 'services/sablier';
import {
  countDownDHMS,
  formatFiat,
  formatAmount,
} from 'utils/common';
import { getRate, getAssetData, getAssetsAsList, isEnoughBalanceForTransactionFee } from 'utils/assets';
import { getTimestamp } from 'utils/sablier';
import { activeAccountAddressSelector } from 'selectors';
import { accountAssetsSelector } from 'selectors/assets';
import { useGasTokenSelector } from 'selectors/smartWallet';
import { accountBalancesSelector } from 'selectors/balances';

import type { Rates, Assets, Asset, Balances } from 'models/Asset';
import type { RootReducerState } from 'reducers/rootReducer';
import type { NavigationScreenProp } from 'react-navigation';
import type { EnsRegistry } from 'reducers/ensRegistryReducer';
import type { GasToken } from 'models/Transaction';

import NewStreamReviewScheme from './NewStreamReviewScheme';


type Props = {
  navigation: NavigationScreenProp<*>,
  activeAccountAddress: string,
  assets: Assets,
  supportedAssets: Asset[],
  useGasToken: boolean,
  baseFiatCurrency: ?string,
  rates: Rates,
  ensRegistry: EnsRegistry,
  balances: Balances,
};

type State = {
  isFetchingTransactionFee: boolean,
  txFeeInWei: ?BigNumber,
  gasToken: ?GasToken,
  transactionPayload: ?Object,
};

const RootContainer = styled.View`
  padding: 45px 0;
  align-items: center;
`;

const ButtonWrapper = styled.View`
  padding: 0 20px;
  align-self: stretch; 
`;

class NewStreamReview extends React.Component<Props, State> {
  state = {
    isFetchingTransactionFee: true,
    txFeeInWei: 0,
    gasToken: null,
    transactionPayload: null,
  }

  async componentDidMount() {
    const {
      navigation, activeAccountAddress, assets, supportedAssets, useGasToken,
    } = this.props;
    const {
      startDate, endDate, receiverAddress, assetValue, assetSymbol,
    } = navigation.state.params;

    const assetData = getAssetData(getAssetsAsList(assets), supportedAssets, assetSymbol);

    const {
      txFeeInWei,
      gasToken,
      transactionPayload,
    } = await getCreateStreamFeeAndTransaction(
      activeAccountAddress,
      receiverAddress,
      assetValue,
      assetData.address,
      getTimestamp(startDate),
      getTimestamp(endDate),
      useGasToken,
    );

    this.setState({
      isFetchingTransactionFee: false,
      gasToken,
      transactionPayload,
      txFeeInWei,
    });
  }

  onSubmit = () => {
    const { transactionPayload } = this.state;

    this.props.navigation.navigate(SEND_TOKEN_PIN_CONFIRM, {
      transactionPayload,
      goBackDismiss: true,
      transactionType: SABLIER_CREATE_STREAM,
    });
  }

  render() {
    const {
      baseFiatCurrency, rates, navigation, ensRegistry, balances, assets, supportedAssets,
    } = this.props;
    const { isFetchingTransactionFee, txFeeInWei, gasToken } = this.state;
    const {
      assetSymbol, assetValue, receiverAddress, startDate, endDate,
    } = navigation.state.params;
    const assetData = getAssetData(getAssetsAsList(assets), supportedAssets, assetSymbol);
    const { days, hours, minutes } = countDownDHMS(endDate.getTime() - startDate.getTime());

    const fiatCurrency = baseFiatCurrency || defaultFiatCurrency;
    const rate = getRate(rates, assetSymbol, fiatCurrency);
    const assetValueFiat = formatFiat(utils.formatUnits(assetValue, assetData?.decimals) * rate, fiatCurrency);

    const receiverUsername = ensRegistry[receiverAddress] || receiverAddress;

    const startStreamButtonTitle = isFetchingTransactionFee
      ? t('label.gettingFee')
      : t('sablierContent.button.startStream');
    const isEnoughForFee = !!txFeeInWei && isEnoughBalanceForTransactionFee(balances, {
      txFeeInWei,
      amount: assetValue,
      decimals: assetData?.decimals,
      symbol: assetSymbol,
      gasToken,
    });
    const isStartStreamButtonDisabled = !!isFetchingTransactionFee
    || !isEnoughForFee
    || (!!txFeeInWei && !txFeeInWei.gt(0));

    return (
      <ContainerWithHeader
        inset={{ bottom: 'never' }}
        headerProps={{ centerItems: [{ title: t('sablierContent.title.newStreamReviewScreen') }] }}
        putContentInScrollView
      >
        <RootContainer>
          <NewStreamReviewScheme
            assetValue={formatAmount(utils.formatUnits(assetValue, 18))}
            assetValueFiat={assetValueFiat}
            assetSymbol={assetSymbol}
            time={t('timeDaysHoursMinutes', { days, hours, minutes })}
            receiver={receiverUsername}
          />
          <Spacing h={70} />
          <FeeLabelToggle
            labelText={t('label.fee')}
            txFeeInWei={txFeeInWei}
            gasToken={gasToken}
            showFiatDefault
            isLoading={isFetchingTransactionFee}
          />
          <Spacing h={16} />
          <ButtonWrapper>
            <Button
              title={startStreamButtonTitle}
              onPress={this.onSubmit}
              disabled={isStartStreamButtonDisabled}
            />
          </ButtonWrapper>
        </RootContainer>
      </ContainerWithHeader>
    );
  }
}

const mapStateToProps = ({
  rates: { data: rates },
  appSettings: { data: { baseFiatCurrency } },
  assets: { supportedAssets },
  ensRegistry: { data: ensRegistry },
}: RootReducerState): $Shape<Props> => ({
  rates,
  baseFiatCurrency,
  supportedAssets,
  ensRegistry,
});

const structuredSelector = createStructuredSelector({
  activeAccountAddress: activeAccountAddressSelector,
  assets: accountAssetsSelector,
  useGasToken: useGasTokenSelector,
  balances: accountBalancesSelector,
});

const combinedMapStateToProps = (state: RootReducerState): $Shape<Props> => ({
  ...structuredSelector(state),
  ...mapStateToProps(state),
});

export default connect(combinedMapStateToProps)(NewStreamReview);
