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
import { MediumText } from 'components/Typography';

// utils
import { mapTransactionsHistory } from 'utils/feedData';
import { buildHistoryTransaction } from 'utils/history';
import { parseTokenBigNumberAmount } from 'utils/common';
import { fontStyles, spacing } from 'utils/variables';
import t from 'translations/translate';

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
};

const Title = styled(MediumText)`
  ${fontStyles.large};
  text-align: center;
  margin-bottom: ${spacing.small}px;
`;

const animationSuccess = require('assets/animations/transactionSentConfirmationAnimation.json');

const KeyBasedAssetTransferStatus = ({
  navigation,
  checkKeyBasedAssetTransferTransactions,
  keyBasedAssetsTransfer,
  accounts,
  resetKeyBasedAssetsTransfer,
}: Props) => {
  useEffect(() => { checkKeyBasedAssetTransferTransactions(); }, []);

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
      accounts,
      TRANSACTION_EVENT,
    ),
    ...mapTransactionsHistory(
      assetTransferTransactions.filter(({ assetData }) => assetData?.tokenType === COLLECTIBLES),
      accounts,
      COLLECTIBLE_TRANSACTION,
    ),
  ];

  const transferComplete = isEmpty(keyBasedAssetsTransfer);

  return (
    <ContainerWithHeader
      headerProps={{ centerItems: [{ title: 'Key based assets transfer' }] }}
      footer={!transferComplete && (
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
            <Title center>Key based asset transfer complete</Title>
            <Button
              block
              title={t('auth:button.magic')}
              onPress={() => navigation.goBack()}
              marginTop={50}
            />
          </Wrapper>
        </ScrollWrapper>
      )}
      {!transferComplete && (
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
  keyBasedAssetTransfer: { data: keyBasedAssetsTransfer },
}: RootReducerState): $Shape<Props> => ({
  keyBasedAssetsTransfer,
  accounts,
});

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  checkKeyBasedAssetTransferTransactions: () => dispatch(checkKeyBasedAssetTransferTransactionsAction()),
  resetKeyBasedAssetsTransfer: () => dispatch(setAndStoreKeyBasedAssetsToTransferAction([])),
});

export default connect(mapStateToProps, mapDispatchToProps)(KeyBasedAssetTransferStatus);
