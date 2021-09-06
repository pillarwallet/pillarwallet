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

import * as React from 'react';
import { useDispatch } from 'react-redux';
import { useNavigation } from 'react-navigation-hooks';
import { useTranslationWithPrefix } from 'translations/translate';

// Components
import { Container } from 'components/layout/Layout';
import ActivityFeed from 'components/legacy/ActivityFeed';
import HeaderBlock from 'components/HeaderBlock';
import RefreshControl from 'components/RefreshControl';

// Constants
import { TRANSACTION_EVENT } from 'constants/historyConstants';

// Selectors
import { useRootSelector, accountsSelector } from 'selectors';
import { isFetchingHistorySelector } from 'selectors/history';
import { archanovaMigrationTransactionsSelector } from 'selectors/walletMigrationArchanova';

// Actions
import { fetchTransactionsHistoryAction } from 'actions/historyActions';

// Utils
import { mapTransactionsHistory } from 'utils/feedData';


const WalletMigrationArchanovaStatus = () => {
  const { t } = useTranslationWithPrefix('walletMigrationArchanova.status');
  const navigation = useNavigation();
  const dispatch = useDispatch();

  const migrationTransactions = useMigrationTransactions();
  const isRefreshing = useRootSelector(isFetchingHistorySelector);

  const handleRefresh = () => {
    dispatch(fetchTransactionsHistoryAction());
  };

  const flatListProps = {
    refreshControl: <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />,
  };

  return (
    <Container>
      <HeaderBlock centerItems={[{ title: t('title') }]} navigation={navigation} noPaddingTop />

      {migrationTransactions.length && (
        <ActivityFeed
          feedData={migrationTransactions}
          emptyState={{ title: t('emptyState') }}
          flatListProps={flatListProps}
          navigation={navigation}
          noBorder
          hideInviteToPillar
          isAssetView
        />
      )}
    </Container>
  );
};

export default WalletMigrationArchanovaStatus;

function useMigrationTransactions() {
  const transactions = useRootSelector(archanovaMigrationTransactionsSelector);
  const accounts = useRootSelector(accountsSelector);

  return React.useMemo(() => mapTransactionsHistory(transactions, accounts, TRANSACTION_EVENT), [
    transactions,
    accounts,
  ]);
}
