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
import { ASSET_TYPES } from 'constants/assetsConstants';
import { COLLECTIBLE_TRANSACTION } from 'constants/collectiblesConstants';

// actions
import {
  checkKeyBasedAssetTransferTransactionsAction,
  setAndStoreKeyBasedAssetsToTransferAction,
} from 'actions/keyBasedAssetTransferActions';

// components
import ContainerWithHeader from 'components/legacy/Layout/ContainerWithHeader';
import { Footer, ScrollWrapper, Wrapper } from 'components/legacy/Layout';
import Button from 'components/legacy/Button';
import ActivityFeed from 'components/legacy/ActivityFeed';
import Animation from 'components/Animation';
import { MediumText, Paragraph } from 'components/legacy/Typography';
import Spinner from 'components/Spinner';

// utils
import { buildHistoryTransaction } from 'utils/history';
import { parseTokenBigNumberAmount } from 'utils/common';
import { fontStyles, spacing } from 'utils/variables';
import t from 'translations/translate';

// types
import type { KeyBasedAssetTransfer } from 'models/Asset';
import type { Dispatch, RootReducerState } from 'reducers/rootReducer';


type Props = {
  navigation: NavigationScreenProp<*>,
  resetKeyBasedAssetsTransfer: () => void,
  checkKeyBasedAssetTransferTransactions: () => void,
  keyBasedAssetsTransfer: KeyBasedAssetTransfer[],
  creatingTransactions: boolean,
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
  resetKeyBasedAssetsTransfer,
  creatingTransactions,
}: Props) => {
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
      value: amount ? parseTokenBigNumberAmount(amount, assetData?.decimals) : undefined,
      type: assetData?.tokenType === ASSET_TYPES.COLLECTIBLE ? COLLECTIBLE_TRANSACTION : TRANSACTION_EVENT,
      assetSymbol: assetData?.token ?? '',
      assetAddress: assetData?.contractAddress,
    }),
    assetData,
    icon: assetData?.icon,
    name: assetData?.name,
    _id: transactionHash || assetData?.name,
  }));

  const transferComplete = isEmpty(keyBasedAssetsTransfer);

  return (
    <ContainerWithHeader
      headerProps={{ centerItems: [{ title: t('transactions.title.assetsTransferToSmartWalletStatusScreen') }] }}
      footer={!transferComplete && !creatingTransactions && (
        <Footer>
          <Button
            title={t('transactions.button.cancelUnsent')}
            onPress={() => {
              resetKeyBasedAssetsTransfer();
              navigation.goBack();
            }}
          />
        </Footer>
      )}
    >
      {transferComplete && (
        <ScrollWrapper contentContainerStyle={{ paddingVertical: spacing.large }}>
          <Wrapper flex={1} center regularPadding>
            <Animation source={animationSuccess} />
            <Title center>{t('transactions.title.keyBasedAssetsMigrationComplete')}</Title>
            <Button
              title={t('button.magic')}
              onPress={() => navigation.goBack()}
              marginTop={50}
            />
          </Wrapper>
        </ScrollWrapper>
      )}
      {creatingTransactions && (
        <ScrollWrapper contentContainerStyle={{ paddingVertical: spacing.large }}>
          <LoadingWrapper>
            <Paragraph center>{t('transactions.title.creatingTransactions')}</Paragraph>
            <Spinner style={{ marginTop: spacing.small }} size={25} trackWidth={2} />
          </LoadingWrapper>
        </ScrollWrapper>
      )}
      {!transferComplete && !creatingTransactions && (
        <ActivityFeed
          navigation={navigation}
          noBorder
          feedData={assetTransferTransactions}
          hideInviteToPillar
          isAssetView
        />
      )}
    </ContainerWithHeader>
  );
};

const mapStateToProps = ({
  keyBasedAssetTransfer: { data: keyBasedAssetsTransfer, creatingTransactions },
}: RootReducerState): $Shape<Props> => ({
  keyBasedAssetsTransfer,
  creatingTransactions,
});

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  checkKeyBasedAssetTransferTransactions: () => dispatch(checkKeyBasedAssetTransferTransactionsAction()),
  resetKeyBasedAssetsTransfer: () => dispatch(setAndStoreKeyBasedAssetsToTransferAction([])),
});

export default connect(mapStateToProps, mapDispatchToProps)(KeyBasedAssetTransferStatus);
