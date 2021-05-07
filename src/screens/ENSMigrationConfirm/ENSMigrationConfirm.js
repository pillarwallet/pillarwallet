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
import { connect, useDispatch } from 'react-redux';
import styled from 'styled-components/native';
import { useTranslationWithPrefix } from 'translations/translate';
import { createStructuredSelector } from 'reselect';
import { useNavigation } from 'react-navigation-hooks';

// actions
import {
  estimateENSMigrationFromArchanovaToEtherspotAction,
  migrateENSFromArchanovaToEtherspotAction,
} from 'actions/smartWalletActions';

// constants
import { ETH } from 'constants/assetsConstants';
import { SEND_TOKEN_TRANSACTION } from 'constants/navigationConstants';

// components
import { ScrollWrapper, Spacing } from 'components/Layout';
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import { BaseText, MediumText } from 'components/Typography';
import Button from 'components/Button';
import FeeLabelToggle from 'components/FeeLabelToggle';

// utils
import { fontStyles, spacing } from 'utils/variables';
import { findFirstArchanovaAccount, getAccountEnsName } from 'utils/accounts';
import { isEnoughBalanceForTransactionFee } from 'utils/assets';

// selectors
import { accountsSelector } from 'selectors';
import { accountBalancesSelector } from 'selectors/balances';

// types
import type { Balances } from 'models/Asset';
import type { Accounts } from 'models/Account';
import type { RootReducerState } from 'reducers/rootReducer';
import type { TransactionFeeInfo } from 'models/Transaction';
import type { TransactionStatus } from 'actions/assetsActions';


type Props = {|
  accounts: Accounts,
  feeInfo: ?TransactionFeeInfo,
  isEstimating: boolean,
  estimateErrorMessage: ?string,
  balances: Balances,
|};

const Title = styled(MediumText)`
  ${fontStyles.large};
`;

const FeesWrapper = styled.View`
  justify-content: center;
  margin-bottom: ${spacing.largePlus}px;
`;

const ENSMigrationConfirm = ({
  feeInfo,
  accounts,
  isEstimating,
  estimateErrorMessage,
  balances,
}: Props) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const { t, tRoot } = useTranslationWithPrefix('migrateENSContent.details');

  useEffect(() => {
    dispatch(estimateENSMigrationFromArchanovaToEtherspotAction());
  }, []);

  const archanovaAccount = findFirstArchanovaAccount(accounts);
  const ensName = getAccountEnsName(archanovaAccount);

  const showFees = isEstimating || !!feeInfo;

  const isEnoughForFee = isEnoughBalanceForTransactionFee(balances, {
    txFeeInWei: feeInfo?.fee,
    gasToken: feeInfo?.gasToken,
  });

  const errorMessage = isEnoughForFee
    ? estimateErrorMessage
    : tRoot('error.notEnoughTokenForFee', { token: feeInfo?.gasToken?.symbol || ETH });

  const migrationTransactionStatusCallback = (transactionStatus: TransactionStatus) => {
    navigation.dismiss();
    navigation.navigate(SEND_TOKEN_TRANSACTION, {
      ...transactionStatus,
      noRetry: true,
      transactionPayload: {},
    });
  };

  const onSubmit = () => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    dispatch(migrateENSFromArchanovaToEtherspotAction(migrationTransactionStatusCallback));
  };

  const submitDisabled = !!estimateErrorMessage || isEstimating || isSubmitting;
  const submitTitle = estimateErrorMessage ? t('cannotMigrate') : t('migrate');

  return (
    <ContainerWithHeader headerProps={{ floating: true }}>
      <ScrollWrapper regularPadding contentContainerStyle={{ paddingTop: 80 }}>
        <Title center>{t('title')}</Title>
        <Spacing h={35} />
        <BaseText medium secondary center>{t('body', { ensName })}</BaseText>
        <Spacing h={50} />
        {showFees && (
          <FeesWrapper>
            <FeeLabelToggle
              labelText={tRoot('label.fee')}
              txFeeInWei={feeInfo?.fee}
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
          disabled={submitDisabled}
          title={submitTitle}
          isLoading={isSubmitting}
          onPress={onSubmit}
        />
      </ScrollWrapper>
    </ContainerWithHeader>
  );
};

const mapStateToProps = ({
  transactionEstimate: { feeInfo, isEstimating, errorMessage: estimateErrorMessage },
}: RootReducerState): $Shape<Props> => ({
  feeInfo,
  isEstimating,
  estimateErrorMessage,
});

const structuredSelector = createStructuredSelector({
  accounts: accountsSelector,
  balances: accountBalancesSelector,
});

const combinedMapStateToProps = (state: RootReducerState): $Shape<Props> => ({
  ...structuredSelector(state),
  ...mapStateToProps(state),
});

export default connect(combinedMapStateToProps)(ENSMigrationConfirm);
