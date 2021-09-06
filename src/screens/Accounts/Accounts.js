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
import { FlatList } from 'react-native';
import { useNavigation } from 'react-navigation-hooks';
import { connect } from 'react-redux';
import { createStructuredSelector } from 'reselect';
import { sortBy } from 'lodash';
import t from 'translations/translate';

// components
import ContainerWithHeader from 'components/legacy/Layout/ContainerWithHeader';
import SettingsItemCarded from 'components/ListItem/SettingsItemCarded';
import { ScrollWrapper } from 'components/legacy/Layout';
import Button from 'components/legacy/Button';

// utils
import { getAccountName, isNotKeyBasedType } from 'utils/accounts';
import { calculateTotalBalance } from 'utils/totalBalances';
import { spacing } from 'utils/variables';
import { images } from 'utils/images';
import { responsiveSize } from 'utils/ui';
import { useTheme } from 'utils/themes';
import { formatFiat } from 'utils/common';

// constants
import { KEY_BASED_ASSET_TRANSFER_INTRO } from 'constants/navigationConstants';
import { BLOCKCHAIN_NETWORK_TYPES } from 'constants/blockchainNetworkConstants';
import { REMOTE_CONFIG } from 'constants/remoteConfigConstants';
import { ACCOUNT_TYPES } from 'constants/accountsConstants';

// actions
import { switchAccountAction } from 'actions/accountsActions';
import { fetchAllAccountsTotalBalancesAction } from 'actions/assetsActions';

// selectors
import { useFiatCurrency } from 'selectors';
import { keyBasedWalletHasPositiveBalanceSelector } from 'selectors/balances';
import { totalBalancesPerAccountSelector } from 'selectors/totalBalances';

// services
import { firebaseRemoteConfig } from 'services/firebase';

// types
import type { RenderItemProps } from 'utils/types/react-native';
import type { Account } from 'models/Account';
import type { Dispatch, RootReducerState } from 'reducers/rootReducer';
import type { BlockchainNetwork } from 'models/BlockchainNetwork';
import type { TotalBalancesPerAccount } from 'models/TotalBalances';


const ITEM_TYPE = {
  ACCOUNT: 'ACCOUNT',
  BUTTON: 'BUTTON',
};

type ListItem = {|
  id: string,
  type: $Keys<typeof ITEM_TYPE>,
  title: string,
  mainAction: () => void | Promise<void>,
  balance?: string,
  isActive?: boolean,
  iconSource?: string,
|};

type Props = {|
  blockchainNetworks: BlockchainNetwork[],
  accounts: Account[],
  switchAccount: (accountId: string) => void,
  fetchAllAccountsTotalBalances: () => void,
  keyBasedWalletHasPositiveBalance: boolean,
  totalBalances: TotalBalancesPerAccount,
|};

const AccountsScreen = ({
  fetchAllAccountsTotalBalances,
  accounts,
  switchAccount,
  blockchainNetworks,
  keyBasedWalletHasPositiveBalance,
  totalBalances,
}: Props) => {
  const navigation = useNavigation();
  const theme = useTheme();
  const fiatCurrency = useFiatCurrency();

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchAllAccountsTotalBalances(); }, []);

  const [switchingToAccountId, setSwitchingToAccountId] = useState(false);

  const { smartWalletIcon } = images(theme);
  const activeBlockchainNetwork = blockchainNetworks.find(({ isActive }) => !!isActive);
  const isEthereumActive = activeBlockchainNetwork?.id === BLOCKCHAIN_NETWORK_TYPES.ETHEREUM;

  const setAccountActive = async (account: Account) => {
    await switchAccount(account.id);
    navigation.goBack(null);
  };

  const renderListItem = ({ item }: RenderItemProps<ListItem>) => {
    const {
      title,
      balance,
      mainAction,
      isActive,
      iconSource,
      id,
      type,
    } = item;

    if (type === ITEM_TYPE.BUTTON) {
      return (
        <Button
          title={title}
          onPress={mainAction}
          style={{ marginBottom: responsiveSize(15) }}
        />
      );
    }

    return (
      <SettingsItemCarded
        isLoading={id === switchingToAccountId}
        title={title}
        subtitle={balance}
        onPress={() => {
          setSwitchingToAccountId(id);
          mainAction();
        }}
        isActive={isActive}
        iconSource={iconSource}
      />
    );
  };

  // etherspot account first
  const sortedAccounts = sortBy(
    accounts,
    ({ type }) => type === ACCOUNT_TYPES.ETHERSPOT_SMART_WALLET ? -1 : 1,
  );

  const accountsList: ListItem[] = sortedAccounts
    .filter(isNotKeyBasedType) // filter key based due deprecation
    .map((account: Account): ListItem => {
      const { id, isActive, type } = account;
      const isActiveWallet = !!isActive && isEthereumActive;

      const totalBalance = calculateTotalBalance(totalBalances[id] ?? {});
      const totalBalanceFormatted = formatFiat(totalBalance, fiatCurrency);

      return {
        id: `ACCOUNT_${id}`,
        type: ITEM_TYPE.ACCOUNT,
        title: getAccountName(type),
        balance: totalBalanceFormatted,
        mainAction: () => setAccountActive(account),
        isActive: isActiveWallet,
        iconSource: smartWalletIcon,
      };
    });

  const isKeyBasedAssetsMigrationEnabled = firebaseRemoteConfig.getBoolean(REMOTE_CONFIG.KEY_BASED_ASSETS_MIGRATION);
  if (isKeyBasedAssetsMigrationEnabled && keyBasedWalletHasPositiveBalance) {
    accountsList.push({
      id: 'KEY_BASED',
      type: ITEM_TYPE.BUTTON,
      title: t('button.migrateAssetsToSmartWallet'),
      mainAction: () => {
        navigation.navigate(KEY_BASED_ASSET_TRANSFER_INTRO);
      },
    });
  }

  return (
    <ContainerWithHeader
      headerProps={{
        centerItems: [{ title: t('title.accounts') }],
        leftItems: [{ close: true, dismiss: true }],
      }}
    >
      <ScrollWrapper contentContainerStyle={{ flexGrow: 1 }}>
        <FlatList
          data={accountsList}
          keyExtractor={(item) => item.id || item.type}
          style={{ width: '100%', flexGrow: 0 }}
          contentContainerStyle={{ width: '100%', padding: spacing.large }}
          renderItem={renderListItem}
        />
      </ScrollWrapper>
    </ContainerWithHeader>
  );
};

const mapStateToProps = ({
  accounts: { data: accounts },
  blockchainNetwork: { data: blockchainNetworks },
}: RootReducerState): $Shape<Props> => ({
  accounts,
  blockchainNetworks,
});

const structuredSelector = createStructuredSelector({
  keyBasedWalletHasPositiveBalance: keyBasedWalletHasPositiveBalanceSelector,
  totalBalances: totalBalancesPerAccountSelector,
});

const combinedMapStateToProps = (state: RootReducerState): $Shape<Props> => ({
  ...structuredSelector(state),
  ...mapStateToProps(state),
});

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  switchAccount: (accountId: string) => dispatch(switchAccountAction(accountId)),
  fetchAllAccountsTotalBalances: () => dispatch(fetchAllAccountsTotalBalancesAction()),
});

export default connect(combinedMapStateToProps, mapDispatchToProps)(AccountsScreen);
