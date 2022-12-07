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

import React, { useEffect, useState } from 'react';
import { Keyboard, Platform } from 'react-native';
import styled from 'styled-components/native';
import { connect } from 'react-redux';
import { utils } from 'ethers';
import { createStructuredSelector } from 'reselect';
import { getEnv } from 'configs/envConfig';
import t from 'translations/translate';
import { useNavigation, useNavigationParam } from 'react-navigation-hooks';

// Actions
import { appsFlyerlogEventAction } from 'actions/analyticsActions';

// Components
import ContainerWithHeader from 'components/legacy/Layout/ContainerWithHeader';
import Table, { TableRow, TableLabel, TableAmount, TableTotal, TableUser, TableFee } from 'components/legacy/Table';
import Button from 'components/legacy/Button';
import { Spacing, ScrollWrapper } from 'components/legacy/Layout';
import CollectibleReviewSummary from 'components/ReviewSummary/CollectibleReviewSummary';
import { Paragraph } from 'components/legacy/Typography';

// Constants
import { SEND_TOKEN_PIN_CONFIRM } from 'constants/navigationConstants';
import { ETH } from 'constants/assetsConstants';
import { TRANSACTION_TYPE } from 'constants/transactionsConstants';

// Utils
import { isEnoughBalanceForTransactionFee } from 'utils/assets';
import { spacing } from 'utils/variables';
import { themedColors } from 'utils/themes';
import { reportErrorLog } from 'utils/common';
import { nativeAssetPerChain } from 'utils/chains';
import { isEtherspotAccount, getAccountType } from 'utils/accounts';
import { showTransactionRevertedToast } from 'utils/transactions';
import { isLogV2AppEvents } from 'utils/environment';
import { currentDate, currentTime } from 'utils/date';

// Services
import { fetchRinkebyETHBalance } from 'services/assets';

// Hooks
import { useDeploymentStatus } from 'hooks/deploymentStatus';
import { useEtherspotDeploymentFee } from 'hooks/transactions';

// Selectors
import { accountWalletAssetsBalancesSelector } from 'selectors/balances';
import { useActiveAccount } from 'selectors';

// Types
import type { CollectibleTransactionPayload, TransactionFeeInfo } from 'models/Transaction';
import type { Dispatch, RootReducerState } from 'reducers/rootReducer';
import type { WalletAssetsBalances } from 'models/Balances';
import type { Chain, ChainRecord } from 'models/Chain';
import type { Collectible } from 'models/Collectible';

type Props = {
  keyBasedWalletAddress: string,
  balances: ChainRecord<WalletAssetsBalances>,
  isOnline: boolean,
  feeInfo: ?TransactionFeeInfo,
  isEstimating: boolean,
  estimateErrorMessage: ?string,
  logAppsFlyerEvent: (name: string, properties: Object) => void,
};

const SendCollectibleConfirm = ({
  isOnline,
  balances,
  keyBasedWalletAddress,
  feeInfo,
  isEstimating,
  estimateErrorMessage,
  logAppsFlyerEvent,
}: Props) => {
  const navigation = useNavigation();

  const receiverEnsName: ?string = useNavigationParam('receiverEnsName');
  const assetData: Collectible = useNavigationParam('assetData');
  const receiver: string = useNavigationParam('receiver');
  const navigationSource: ?string = useNavigationParam('source');
  const chain: Chain = useNavigationParam('chain');

  const activeAccount = useActiveAccount();
  const walletBalances = balances?.[chain] ?? {};
  const { deploymentFee, feeWithoutDeployment } = useEtherspotDeploymentFee(chain, feeInfo?.fee, feeInfo?.gasToken);
  const isKovanNetwork = getEnv().NETWORK_PROVIDER === 'kovan';

  const { name, tokenType, id: tokenId, contractAddress, isLegacy } = assetData;

  let transactionPayload: CollectibleTransactionPayload = {
    to: receiver,
    name,
    contractAddress,
    tokenType,
    tokenId,
    amount: 0,
    chain,
    useLegacyTransferMethod: isLegacy,
    type: TRANSACTION_TYPE.SENDNFT,
  };

  if (receiverEnsName) {
    transactionPayload = { ...transactionPayload, receiverEnsName };
  }

  /**
   * we're fetching Rinkeby ETH if current network is Kovan because
   * our used collectibles in testnets are sent only using Rinkeby
   * so if we're not on Rinkeby itself we can only check Rinkeby balance
   * using this additional call
   */
  const [rinkebyEth, setRinkebyEth] = useState(0);
  const fetchRinkebyEth = () =>
    fetchRinkebyETHBalance(keyBasedWalletAddress)
      .then(setRinkebyEth)
      .catch((error) => {
        reportErrorLog('SendCollectibleConfirm screen fetchRinkebyEth failed', { error, keyBasedWalletAddress });
        return null;
      });

  useEffect(() => {
    if (isKovanNetwork) fetchRinkebyEth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFormSubmit = () => {
    Keyboard.dismiss();

    if (!feeInfo) {
      showTransactionRevertedToast();
      return;
    }

    const { fee: txFeeInWei, gasToken } = feeInfo;

    const transactionPayloadUpdated = {
      ...transactionPayload,
      txFeeInWei,
      gasToken,
    };

    if (activeAccount && isLogV2AppEvents()) {
      // eslint-disable-next-line i18next/no-literal-string
      logAppsFlyerEvent(`nft_sent_${chain}`, {
        token: assetData?.tokenType,
        tokenId: assetData?.tokenId,
        date: currentDate(),
        time: currentTime(),
        address: assetData?.contractAddress,
        platform: Platform.OS,
        walletType: getAccountType(activeAccount),
      });
    }

    navigation.navigate(SEND_TOKEN_PIN_CONFIRM, {
      transactionPayload: transactionPayloadUpdated,
      source: navigationSource,
    });
  };

  let isEnoughForFee = true;

  if (feeInfo) {
    // rinkeby testnet fee check
    const txFee = utils.formatEther(feeInfo.fee?.toString() ?? 0);
    const canProceedKovanTesting = isKovanNetwork && parseFloat(rinkebyEth) > parseFloat(txFee);

    // fee
    const balanceCheckTransaction = {
      txFeeInWei: feeInfo?.fee,
      amount: 0,
      gasToken: feeInfo?.gasToken,
    };

    isEnoughForFee =
      canProceedKovanTesting || isEnoughBalanceForTransactionFee(walletBalances, balanceCheckTransaction, chain);
  }

  const feeSymbol = feeInfo?.gasToken?.symbol || nativeAssetPerChain[chain].symbol;
  const errorMessage = isEnoughForFee ? estimateErrorMessage : t('error.notEnoughTokenForFee', { token: feeSymbol });

  // confirm button
  const isConfirmDisabled = isEstimating || !isOnline || !feeInfo || !!errorMessage;
  const confirmButtonTitle = isEstimating ? t('label.gettingFee') : t('transactions.button.send');

  const { isDeployedOnChain } = useDeploymentStatus();
  const feeTooltip =
    isEtherspotAccount(activeAccount) && !isDeployedOnChain?.[chain] ? t('tooltip.includesDeploymentFee') : undefined;

  const transactionFeeLabel = deploymentFee
    ? t('transactions.label.maxTransactionFee')
    : t('transactions.label.maximumFee');

  return (
    <ContainerWithHeader
      headerProps={{
        centerItems: [{ title: t('transactions.title.review') }],
      }}
    >
      <ScrollWrapper
        disableAutomaticScroll
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16 }}
        disableOnAndroid
      >
        <CollectibleReviewSummary collectible={assetData} text={t('transactions.label.youAreSending')} />
        <Spacing h={32} />
        <Table>
          <TableRow>
            <TableLabel>{t('transactions.label.recipient')}</TableLabel>
            <TableUser address={receiver} />
          </TableRow>
          <TableRow>
            <TableLabel tooltip={feeTooltip}>{transactionFeeLabel}</TableLabel>
            <TableFee txFeeInWei={feeWithoutDeployment} gasToken={feeInfo?.gasToken} chain={chain} />
          </TableRow>
          {!!deploymentFee && (
            <TableRow>
              <TableLabel tooltip={feeTooltip}>{t('transactions.label.deploymentFee')}</TableLabel>
              <TableFee txFeeInWei={deploymentFee} gasToken={feeInfo?.gasToken} chain={chain} />
            </TableRow>
          )}
          <TableRow>
            <TableLabel>{t('transactions.label.pillarFee')}</TableLabel>
            <TableAmount amount={0} chain={chain} />
          </TableRow>
          {isKovanNetwork && (
            <TableRow>
              <TableLabel style={{ flex: 1 }}>
                {/* eslint-disable i18next/no-literal-string */}
                Balance in Rinkeby ETH (visible in dev and staging while on Kovan)
              </TableLabel>
              <TableAmount
                amount={rinkebyEth}
                assetSymbol={ETH}
                assetAddress={nativeAssetPerChain.ethereum.address}
                chain={chain}
              />
            </TableRow>
          )}
          <TableRow>
            <TableTotal>{t('transactions.label.totalFee')}</TableTotal>
            <TableFee txFeeInWei={feeInfo?.fee} gasToken={feeInfo?.gasToken} chain={chain} />
          </TableRow>
        </Table>
        <Spacing h={40} />
        {!!errorMessage && <WarningMessage small>{errorMessage}</WarningMessage>}
        <Button disabled={isConfirmDisabled} onPress={handleFormSubmit} title={confirmButtonTitle} />
      </ScrollWrapper>
    </ContainerWithHeader>
  );
};

const mapStateToProps = ({
  session: {
    data: { isOnline },
  },
  wallet: { data: walletData },
  transactionEstimate: { feeInfo, isEstimating, errorMessage: estimateErrorMessage },
}: RootReducerState): $Shape<Props> => ({
  keyBasedWalletAddress: walletData?.address,
  isOnline,
  feeInfo,
  isEstimating,
  estimateErrorMessage,
});

const structuredSelector = createStructuredSelector({
  balances: accountWalletAssetsBalancesSelector,
});

const combinedMapStateToProps = (state: RootReducerState): $Shape<Props> => ({
  ...structuredSelector(state),
  ...mapStateToProps(state),
});

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  logAppsFlyerEvent: (name: string, properties: Object) => dispatch(appsFlyerlogEventAction(name, properties)),
});

export default connect(combinedMapStateToProps, mapDispatchToProps)(SendCollectibleConfirm);

const WarningMessage = styled(Paragraph)`
  text-align: center;
  color: ${themedColors.negative};
  padding-bottom: ${spacing.small}px;
`;
