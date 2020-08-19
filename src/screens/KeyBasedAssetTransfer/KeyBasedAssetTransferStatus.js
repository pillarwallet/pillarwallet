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
import { connect } from 'react-redux';
import isEmpty from 'lodash.isempty';
import styled from 'styled-components/native';
import type { NavigationScreenProp } from 'react-navigation';

// constants
import { TRANSACTION_EVENT } from 'constants/historyConstants';
import { COLLECTIBLES } from 'constants/assetsConstants';
import { COLLECTIBLE_TRANSACTION } from 'constants/collectiblesConstants';

// actions
import {
  checkKeyBasedAssetTransferTransactionsAction,
  setAndStoreKeyBasedAssetsToTransferAction,
} from 'actions/keyBasedAssetTransferActions';

// components
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import { Footer, ScrollWrapper, Wrapper } from 'components/Layout';
import Button from 'components/Button';
import ActivityFeed from 'components/ActivityFeed';
import Animation from 'components/Animation';
import { MediumText, Paragraph } from 'components/Typography';
import Spinner from 'components/Spinner';

// constants
import { ACCOUNT_TYPES } from 'constants/accountsConstants';

// utils
import { mapTransactionsHistory } from 'utils/feedData';
import { buildHistoryTransaction } from 'utils/history';
import { parseTokenBigNumberAmount } from 'utils/common';
import { fontStyles, spacing } from 'utils/variables';
import t from 'translations/translate';
import { isNotKeyBasedType } from 'utils/accounts';

// types
import type { KeyBasedAssetTransfer } from 'models/Asset';
import type { Dispatch, RootReducerState } from 'reducers/rootReducer';
import type { Accounts } from 'models/Account';


type Props = {
  navigation: NavigationScreenProp<*>,
  resetKeyBasedAssetsTransfer: () => void,
  checkKeyBasedAssetTransferTransactions: () => void,
  keyBasedAssetsTransfer: KeyBasedAssetTransfer[],
  accounts: Accounts,
  creatingTransactions: boolean,
  keyBasedWalletAddress: string,
};

const Title = styled(MediumText)`
  ${fontStyles.large};
  text-align: center;
  margin-bottom: ${spacing.small}px;
`;

const LoadingWrapper = styled.View`
  padding-top: ${spacing.large}px;
  flex: 1;
  justify-content: center;
  align-items: center;
`;

const animationSuccess = require('assets/animations/transactionSentConfirmationAnimation.json');

const KeyBasedAssetTransferStatus = ({
  navigation,
  checkKeyBasedAssetTransferTransactions,
  keyBasedAssetsTransfer,
  accounts,
  resetKeyBasedAssetsTransfer,
  creatingTransactions,
  keyBasedWalletAddress,
}: Props) => {
  useEffect(() => { checkKeyBasedAssetTransferTransactions(); }, []);

  // mock only
  const accountsWithKeyBased = [
    {
      id: keyBasedWalletAddress,
      type: ACCOUNT_TYPES.KEY_BASED,
      isActive: false,
      walletId: '',
    },
    ...accounts.filter(isNotKeyBasedType),
  ];

  const assetTransferTransactions = keyBasedAssetsTransfer.map(({
    signedTransaction,
    transactionHash,
    amount,
    status,
    assetData,
  }) => ({
    ...buildHistoryTransaction({
      from: signedTransaction?.from || '',
      to: signedTransaction?.to || '',
      hash: transactionHash || '',
      status,
      value: amount && parseTokenBigNumberAmount(amount, assetData?.decimals),
      type: assetData?.tokenType === COLLECTIBLES ? COLLECTIBLE_TRANSACTION : '',
      asset: assetData?.token,
    }),
    assetData,
    icon: assetData?.icon,
    name: assetData?.name,
  }));

  const assetTransferTransactionsHistory = [
    ...mapTransactionsHistory(
      assetTransferTransactions.filter(({ assetData }) => assetData?.tokenType !== COLLECTIBLES),
      accountsWithKeyBased,
      TRANSACTION_EVENT,
      true,
    ),
    ...mapTransactionsHistory(
      assetTransferTransactions.filter(({ assetData }) => assetData?.tokenType === COLLECTIBLES),
      accountsWithKeyBased,
      COLLECTIBLE_TRANSACTION,
      true,
    ),
  ];

  const transferComplete = isEmpty(keyBasedAssetsTransfer);

  return (
    <ContainerWithHeader
      headerProps={{ centerItems: [{ title: 'Key based assets migration' }] }}
      footer={!transferComplete && !creatingTransactions && (
        <Footer>
          <Button
            title="Cancel unsent"
            onPress={() => {
              navigation.goBack();
              resetKeyBasedAssetsTransfer();
            }}
          />
        </Footer>
      )}
    >
      {transferComplete && (
        <ScrollWrapper contentContainerStyle={{ paddingVertical: spacing.large }}>
          <Wrapper flex={1} center regularPadding>
            <Animation source={animationSuccess} />
            <Title center>Key based assets migration complete</Title>
            <Button
              block
              title={t('auth:button.magic')}
              onPress={() => navigation.goBack()}
              marginTop={50}
            />
          </Wrapper>
        </ScrollWrapper>
      )}
      {creatingTransactions && (
        <ScrollWrapper contentContainerStyle={{ paddingVertical: spacing.large }}>
          <LoadingWrapper>
            <Paragraph center>Creating transactions</Paragraph>
            <Spinner style={{ marginTop: spacing.small }} width={25} height={25} />
          </LoadingWrapper>
        </ScrollWrapper>
      )}
      {!transferComplete && !creatingTransactions && (
        <ActivityFeed
          navigation={navigation}
          noBorder
          feedData={assetTransferTransactionsHistory}
          hideInviteToPillar
          isAssetView
        />
      )}
    </ContainerWithHeader>
  );
};

const mapStateToProps = ({
  accounts: { data: accounts },
  keyBasedAssetTransfer: { data: keyBasedAssetsTransfer, creatingTransactions },
  wallet: { data: { address: keyBasedWalletAddress } },
}: RootReducerState): $Shape<Props> => ({
  keyBasedAssetsTransfer,
  accounts,
  creatingTransactions,
  keyBasedWalletAddress,
});

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  checkKeyBasedAssetTransferTransactions: () => dispatch(checkKeyBasedAssetTransferTransactionsAction()),
  resetKeyBasedAssetsTransfer: () => dispatch(setAndStoreKeyBasedAssetsToTransferAction([])),
});

export default connect(mapStateToProps, mapDispatchToProps)(KeyBasedAssetTransferStatus);
