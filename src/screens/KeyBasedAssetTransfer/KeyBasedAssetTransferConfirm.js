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
import React from 'react';
import { ScrollView } from 'react-native';
import { connect } from 'react-redux';
import styled from 'styled-components/native';
import { formatEther } from 'ethers/lib/utils';
import { BigNumber } from 'bignumber.js';
import isEmpty from 'lodash.isempty';
import { createStructuredSelector } from 'reselect';
import type { NavigationScreenProp } from 'react-navigation';
import t from 'translations/translate';

// components
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import { Footer, Wrapper } from 'components/Layout';
import Button from 'components/Button';
import Spinner from 'components/Spinner';
import { BaseText, MediumText } from 'components/Typography';
import FeeLabelToggle from 'components/FeeLabelToggle';

// utils
import { fontStyles, spacing } from 'utils/variables';
import { formatFullAmount, humanizeHexString } from 'utils/common';
import { getBalance } from 'utils/assets';

// constants
import { ETH, COLLECTIBLES } from 'constants/assetsConstants';
import { KEY_BASED_ASSET_TRANSFER_UNLOCK } from 'constants/navigationConstants';

// selectors
import { activeAccountAddressSelector } from 'selectors';

// types
import type { Balances, KeyBasedAssetTransfer } from 'models/Asset';
import type { RootReducerState } from 'reducers/rootReducer';


type Props = {
  navigation: NavigationScreenProp<*>,
  keyBasedAssetsToTransfer: KeyBasedAssetTransfer[],
  isCalculatingGas: boolean,
  availableBalances: Balances,
  activeAccountAddress: string,
  keyBasedWalletAddress: ?string,
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
  availableBalances,
  activeAccountAddress,
  keyBasedWalletAddress,
  navigation,
}: Props) => {
  const isLoading = isCalculatingGas;

  const tokensTransfer = keyBasedAssetsToTransfer.filter(
    ({ assetData }) => assetData?.tokenType !== COLLECTIBLES,
  );
  const collectiblesTransfer = keyBasedAssetsToTransfer.filter(
    ({ assetData }) => assetData?.tokenType === COLLECTIBLES,
  );

  const renderFooter = () => {
    let ethBalanceBN = new BigNumber(getBalance(availableBalances, ETH));
    const ethTransfer = keyBasedAssetsToTransfer.find(({ assetData }) => assetData?.token === ETH);
    if (ethTransfer) ethBalanceBN = ethBalanceBN.minus(new BigNumber(ethTransfer.amount));
    const totalTransferFeeWeiBN: BigNumber = keyBasedAssetsToTransfer.reduce(
      (a: BigNumber, b: any) => a.plus(new BigNumber(b.gasPrice.toString()).multipliedBy(b.calculatedGasLimit)),
      new BigNumber(0),
    );
    const totalTransferFeeBN = new BigNumber(formatEther(totalTransferFeeWeiBN.toFixed()));
    const notEnoughFee = !isCalculatingGas && totalTransferFeeBN.isGreaterThan(ethBalanceBN);

    return (
      <Footer>
        <FooterInner>
          <FeeLabelToggle
            labelText={t('label.fee')}
            txFeeInWei={totalTransferFeeWeiBN}
            showFiatDefault={!notEnoughFee}
          />
          {!!notEnoughFee && <NotEnoughFee negative>{t('error.notEnoughTokenForFee', { token: ETH })}</NotEnoughFee>}
          <Button
            style={{ marginTop: spacing.large }}
            disabled={!!notEnoughFee}
            title={t('button.confirm')}
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
          <DetailsTitle>{t('transactions.label.fromKeyWallet')}</DetailsTitle>
          <DetailsValue>{humanizeHexString(keyBasedWalletAddress)}</DetailsValue>
        </DetailsLine>
        <DetailsLine>
          <DetailsTitle>{t('transactions.label.toSmartWallet')}</DetailsTitle>
          <DetailsValue>{humanizeHexString(activeAccountAddress)}</DetailsValue>
        </DetailsLine>
        {!isEmpty(tokensTransfer) && (
          <DetailsLine>
            <DetailsTitle>{t('transactions.label.tokensToTransfer')}</DetailsTitle>
            {tokensTransfer.map(({ assetData: { token: symbol }, amount }) => (
              <DetailsValue key={symbol}>
                {t('tokenValue', { value: formatFullAmount(amount || ''), token: symbol })}
              </DetailsValue>
            ))}
          </DetailsLine>
        )}
        {!isEmpty(collectiblesTransfer) && (
          <DetailsLine>
            <DetailsTitle>{t('transactions.label.collectiblesToTransfer')}</DetailsTitle>
            {collectiblesTransfer.map(({ assetData: { name } }) => (
              <DetailsValue key={name}>{name}</DetailsValue>
            ))}
          </DetailsLine>
        )}
      </DetailsWrapper>
    </ScrollView>
  );

  return (
    <ContainerWithHeader
      headerProps={{ centerItems: [{ title: t('title.confirm') }] }}
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
  wallet: { data: walletData },
}: RootReducerState): $Shape<Props> => ({
  keyBasedAssetsToTransfer,
  isCalculatingGas,
  availableBalances,
  keyBasedWalletAddress: walletData?.address,
});

const structuredSelector = createStructuredSelector({
  activeAccountAddress: activeAccountAddressSelector,
});

const combinedMapStateToProps = (state: RootReducerState): $Shape<Props> => ({
  ...structuredSelector(state),
  ...mapStateToProps(state),
});

export default connect(combinedMapStateToProps)(KeyBasedAssetTransferConfirm);
