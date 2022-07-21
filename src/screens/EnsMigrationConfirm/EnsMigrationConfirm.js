// @flow
/*
    Pillar Wallet: the personal data locker
    Copyright (C) 2021 Stiftung Pillar Project

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
import { useDispatch } from 'react-redux';
import styled from 'styled-components/native';
import { useTranslationWithPrefix } from 'translations/translate';
import { useNavigation } from 'react-navigation-hooks';
import { type Wallet as EthersWallet } from 'ethers';

// actions
import {
  estimateEnsMigrationFromArchanovaToEtherspotAction,
  migrateEnsFromArchanovaToEtherspotAction,
} from 'actions/smartWalletActions';
import { resetIncorrectPasswordAction } from 'actions/authActions';
import { fetchGasThresholds } from 'redux/actions/gas-threshold-actions';

// constants
import { ETH } from 'constants/assetsConstants';
import { SEND_TOKEN_TRANSACTION } from 'constants/navigationConstants';
import { CHAIN } from 'constants/chainConstants';

// components
import { ScrollWrapper, Spacing } from 'components/legacy/Layout';
import ContainerWithHeader from 'components/legacy/Layout/ContainerWithHeader';
import { BaseText, MediumText } from 'components/legacy/Typography';
import FeeLabelToggle from 'components/FeeLabelToggle';
import CheckAuth from 'components/CheckAuth';
import Button from 'components/legacy/Button';

// utils
import { fontStyles, spacing } from 'utils/variables';
import { findFirstArchanovaAccount, getAccountAddress, getAccountEnsName } from 'utils/accounts';
import { isEnoughBalanceForTransactionFee } from 'utils/assets';
import { buildEnsMigrationRawTransactions } from 'utils/archanova';
import { isHighGasFee } from 'utils/transactions';

// selectors
import { accountsSelector, useRootSelector, useFiatCurrency, useChainRates } from 'selectors';
import { accountEthereumWalletAssetsBalancesSelector } from 'selectors/balances';
import { useBiometricsSelector } from 'selectors/appSettings';
import { gasThresholdsSelector } from 'redux/selectors/gas-threshold-selector';

// types
import type { TransactionStatus } from 'models/Transaction';

const Title = styled(MediumText)`
  ${fontStyles.large};
`;

const FeesWrapper = styled.View`
  align-items: center;
  margin-bottom: ${spacing.largePlus}px;
`;

const EnsMigrationConfirm = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [wallet, setWallet] = useState(null);
  const [rawTransactions, setRawTransactions] = useState(null);
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const { t, tRoot } = useTranslationWithPrefix('migrateENSContent.details');
  const accounts = useRootSelector(accountsSelector);
  const balances = useRootSelector(accountEthereumWalletAssetsBalancesSelector);
  const useBiometrics = useBiometricsSelector();
  const {
    feeInfo,
    isEstimating,
    errorMessage: estimateErrorMessage,
  } = useRootSelector(({ transactionEstimate }) => transactionEstimate);

  const chain = CHAIN.ETHEREUM;

  const chainRates = useChainRates(chain);
  const fiatCurrency = useFiatCurrency();
  const gasThresholds = useRootSelector(gasThresholdsSelector);

  useEffect(() => {
    dispatch(fetchGasThresholds());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const buildRawTransactions = async () => {
      const transactions = await buildEnsMigrationRawTransactions(accounts, wallet);
      setRawTransactions(transactions);
      setWallet(null);
    };

    if (wallet) buildRawTransactions();
  }, [wallet, accounts]);

  useEffect(() => {
    if (!rawTransactions) return;
    dispatch(estimateEnsMigrationFromArchanovaToEtherspotAction(rawTransactions));
  }, [rawTransactions, dispatch]);

  const archanovaAccount = findFirstArchanovaAccount(accounts);

  const showFees = isEstimating || !!feeInfo;

  const balanceCheckTransaction = {
    txFeeInWei: feeInfo?.fee,
    gasToken: feeInfo?.gasToken,
  };

  const isEnoughForFee = isEnoughBalanceForTransactionFee(balances, balanceCheckTransaction, chain);

  let errorMessage = isEnoughForFee
    ? estimateErrorMessage
    : tRoot('error.notEnoughTokenForFee', { token: feeInfo?.gasToken?.symbol || ETH });

  if (!archanovaAccount) {
    errorMessage = t('noAccountFound');
  }

  const migrationTransactionStatusCallback = (transactionStatus: TransactionStatus) => {
    setIsSubmitting(false);
    navigation.navigate(SEND_TOKEN_TRANSACTION, {
      ...transactionStatus,
      transactionPayload: {},
    });
  };

  const onPinValid = (pin: string, unlockedWallet: EthersWallet) => {
    setWallet(unlockedWallet);
  };

  const onLockedNavigationBack = () => {
    navigation.goBack(null);
    dispatch(resetIncorrectPasswordAction());
  };

  const onSubmit = () => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    dispatch(migrateEnsFromArchanovaToEtherspotAction(rawTransactions, migrationTransactionStatusCallback));
  };

  const submitDisabled = !!estimateErrorMessage || isEstimating || isSubmitting;
  const submitTitle = estimateErrorMessage ? t('cannotMigrate') : t('migrate');

  if (!rawTransactions) {
    return (
      <CheckAuth onPinValid={onPinValid} headerProps={{ onBack: onLockedNavigationBack }} enforcePin={!useBiometrics} />
    );
  }

  const highFee = isHighGasFee(chain, feeInfo?.fee, feeInfo?.gasToken, chainRates, fiatCurrency, gasThresholds);

  return (
    <ContainerWithHeader headerProps={{ floating: true }}>
      <ScrollWrapper regularPadding contentContainerStyle={{ paddingTop: 80 }}>
        <Title center>{t('title')}</Title>
        <Spacing h={35} />
        {archanovaAccount && (
          <BaseText medium secondary center>
            {t('body', {
              ensName: getAccountEnsName(archanovaAccount),
              address: getAccountAddress(archanovaAccount),
            })}
          </BaseText>
        )}
        <Spacing h={50} />
        {showFees && (
          <FeesWrapper>
            <FeeLabelToggle
              labelText={tRoot('label.fee')}
              txFeeInWei={feeInfo?.fee}
              chain={chain}
              isLoading={isEstimating}
              gasToken={feeInfo?.gasToken}
              hasError={!!errorMessage}
              showFiatDefault
            />
          </FeesWrapper>
        )}
        {!!errorMessage && (
          <BaseText negative center style={{ marginVertical: spacing.largePlus }}>
            {errorMessage}
          </BaseText>
        )}
        <Button
          title={submitTitle}
          warning={highFee}
          isLoading={isSubmitting}
          onPress={onSubmit}
          disabled={submitDisabled}
        />
        <Spacing h={spacing.medium} />
        <BaseText small secondary center>
          {tRoot('transactions.highGasFee.pillarEthFeeDisclaimer')}
        </BaseText>
      </ScrollWrapper>
    </ContainerWithHeader>
  );
};

export default EnsMigrationConfirm;
