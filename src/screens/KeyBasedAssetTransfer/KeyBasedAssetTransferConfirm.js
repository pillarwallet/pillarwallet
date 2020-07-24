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
import React, { useEffect } from 'react';
import { ScrollView } from 'react-native';
import { connect } from 'react-redux';
import styled from 'styled-components/native';
import { formatEther } from 'ethers/lib/utils';
import { BigNumber } from 'bignumber.js';
import isEmpty from 'lodash.isempty';
import { createStructuredSelector } from 'reselect';
import type { NavigationScreenProp } from 'react-navigation';

// actions
import { fetchGasInfoAction } from 'actions/historyActions';

// components
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import { Footer, Wrapper } from 'components/Layout';
import Button from 'components/Button';
import Spinner from 'components/Spinner';
import { BaseText, MediumText } from 'components/Typography';
import FeeLabelToggle from 'components/FeeLabelToggle';

// utils
import { fontStyles, spacing } from 'utils/variables';
import { formatFullAmount, getGasPriceWei, humanizeHexString } from 'utils/common';
import { getBalance } from 'utils/assets';

// constants
import { ETH, COLLECTIBLES } from 'constants/assetsConstants';
import { KEY_BASED_ASSET_TRANSFER_UNLOCK } from 'constants/navigationConstants';

// selectors
import { activeAccountAddressSelector } from 'selectors';

// types
import type { Balances, KeyBasedAssetTransfer } from 'models/Asset';
import type { Dispatch, RootReducerState } from 'reducers/rootReducer';
import type { GasInfo } from 'models/GasInfo';


type Props = {
  navigation: NavigationScreenProp<*>,
  keyBasedAssetsToTransfer: KeyBasedAssetTransfer[],
  isCalculatingGas: boolean,
  gasInfo: GasInfo,
  fetchGasInfo: () => void,
  availableBalances: Balances,
  activeAccountAddress: string,
  keyBasedWalletAddress: string,
};

const DetailsTitle = styled(BaseText)`
  ${fontStyles.regular};
  color: #999999;
`;

const DetailsValue = styled(MediumText)`
  ${fontStyles.big};
`;

const DetailsLine = styled.View`
  padding-bottom: ${spacing.rhythm}px;
`;

const DetailsWrapper = styled.View`
  padding: 30px ${spacing.large}px 0px ${spacing.large}px;
`;

const FooterInner = styled.View`
  align-items: center;
`;

const NotEnoughFee = styled(BaseText)`
  margin-top: ${spacing.large}px;
`;

const KeyBasedAssetTransferConfirm = ({
  keyBasedAssetsToTransfer,
  isCalculatingGas,
  fetchGasInfo,
  gasInfo,
  availableBalances,
  activeAccountAddress,
  keyBasedWalletAddress,
  navigation,
}: Props) => {
  useEffect(() => { fetchGasInfo(); }, []);

  const isLoading = isCalculatingGas || isEmpty(gasInfo);
  const tokensTransfer = keyBasedAssetsToTransfer.filter(({ asset }) => asset?.tokenType !== COLLECTIBLES);
  const collectiblesTransfer = keyBasedAssetsToTransfer.filter(({ asset }) => asset?.tokenType === COLLECTIBLES);

  const renderFooter = () => {
    const ethBalanceBN = new BigNumber(getBalance(availableBalances, ETH));
    const totalTransferFeeWeiBN = isCalculatingGas
      ? null
      : keyBasedAssetsToTransfer.reduce(
        (a: BigNumber, b: any) => a.plus(getGasPriceWei(gasInfo).mul(b.calculatedGasLimit)),
        new BigNumber(0),
      );
    const totalTransferFeeBN = new BigNumber(formatEther(totalTransferFeeWeiBN.toFixed()));
    const notEnoughFee = !isCalculatingGas && totalTransferFeeBN.isGreaterThan(ethBalanceBN);
    return (
      <Footer>
        <FooterInner>
          <FeeLabelToggle
            labelText="Fee"
            txFeeInWei={totalTransferFeeWeiBN}
            showFiatDefault
          />
          {!!notEnoughFee && <NotEnoughFee negative>Not enough ETH left for transaction fee</NotEnoughFee>}
          <Button
            block
            style={{ marginTop: spacing.large }}
            disabled={!!notEnoughFee}
            title="Confirm"
            onPress={() => navigation.navigate(KEY_BASED_ASSET_TRANSFER_UNLOCK)}
          />
        </FooterInner>
      </Footer>
    );
  };

  const renderDetails = () => (
    <ScrollView>
      <DetailsWrapper>
        <DetailsLine>
          <DetailsTitle>From Key based wallet</DetailsTitle>
          <DetailsValue>{humanizeHexString(keyBasedWalletAddress)}</DetailsValue>
        </DetailsLine>
        <DetailsLine>
          <DetailsTitle>To Smart Wallet</DetailsTitle>
          <DetailsValue>{humanizeHexString(activeAccountAddress)}</DetailsValue>
        </DetailsLine>
        {!isEmpty(tokensTransfer) && (
          <DetailsLine>
            <DetailsTitle>Tokens to transfer</DetailsTitle>
            {tokensTransfer.map(({ asset: { symbol, amount } }) => (
              <DetailsValue key={symbol}>{formatFullAmount(amount)} {symbol}</DetailsValue>
            ))}
          </DetailsLine>
        )}
        {!isEmpty(collectiblesTransfer) && (
          <DetailsLine>
            <DetailsTitle>Collectibles to transfer</DetailsTitle>
            {collectiblesTransfer.map(({ asset: { name } }) => (
              <DetailsValue key={name}>{name}</DetailsValue>
            ))}
          </DetailsLine>
        )}
      </DetailsWrapper>
    </ScrollView>
  );

  return (
    <ContainerWithHeader
      headerProps={{ centerItems: [{ title: 'Confirm' }] }}
      footer={!isLoading && renderFooter()}
    >
      {isLoading && <Wrapper flex={1} center><Spinner /></Wrapper>}
      {!isLoading && renderDetails()}
    </ContainerWithHeader>
  );
};

const mapStateToProps = ({
  keyBasedAssetTransfer: {
    data: keyBasedAssetsToTransfer,
    isCalculatingGas,
    availableBalances,
  },
  wallet: { data: { address: keyBasedWalletAddress } },
  history: { gasInfo },
}: RootReducerState): $Shape<Props> => ({
  keyBasedAssetsToTransfer,
  isCalculatingGas,
  gasInfo,
  availableBalances,
  keyBasedWalletAddress,
});

const structuredSelector = createStructuredSelector({
  activeAccountAddress: activeAccountAddressSelector,
});

const combinedMapStateToProps = (state: RootReducerState): $Shape<Props> => ({
  ...structuredSelector(state),
  ...mapStateToProps(state),
});

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  fetchGasInfo: () => dispatch(fetchGasInfoAction()),
});

export default connect(combinedMapStateToProps, mapDispatchToProps)(KeyBasedAssetTransferConfirm);
