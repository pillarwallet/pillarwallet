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
import { withTheme } from 'styled-components/native';
import { FlatList } from 'react-native';
import { connect } from 'react-redux';
import { createStructuredSelector } from 'reselect';
import t from 'translations/translate';

// components
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import SettingsItemCarded from 'components/ListItem/SettingsItemCarded';
import { ScrollWrapper } from 'components/Layout';
import Button from 'components/Button';

// configs
import { PPN_TOKEN } from 'configs/assetsConfig';

// utils
import { getAccountName, isEthersportSmartWalletType } from 'utils/accounts';
import { formatFiat, formatMoney } from 'utils/common';
import { spacing } from 'utils/variables';
import { calculateBalanceInFiat } from 'utils/assets';
import { images } from 'utils/images';
import { responsiveSize } from 'utils/ui';

// constants
import { ASSETS, KEY_BASED_ASSET_TRANSFER_CHOOSE } from 'constants/navigationConstants';
import { BLOCKCHAIN_NETWORK_TYPES } from 'constants/blockchainNetworkConstants';
import { defaultFiatCurrency } from 'constants/assetsConstants';
import { REMOTE_CONFIG } from 'constants/remoteConfigConstants';

// actions
import { setActiveBlockchainNetworkAction } from 'actions/blockchainNetworkActions';
import { switchAccountAction } from 'actions/accountsActions';
import { fetchAllAccountsBalancesAction } from 'actions/assetsActions';

// selectors
import { availableStakeSelector } from 'selectors/paymentNetwork';
import { keyBasedWalletHasPositiveBalanceSelector } from 'selectors/balances';

// services
import { firebaseRemoteConfig } from 'services/firebase';

// types
import type { NavigationScreenProp } from 'react-navigation';
import type { Balances, BalancesStore, Rates } from 'models/Asset';
import type { Account, Accounts } from 'models/Account';
import type { Dispatch, RootReducerState } from 'reducers/rootReducer';
import type { BlockchainNetwork } from 'models/BlockchainNetwork';
import type { Theme } from 'models/Theme';
import type { RenderItemProps } from 'utils/types/react-native';


const ITEM_TYPE = {
  NETWORK: 'NETWORK',
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
  navigation: NavigationScreenProp<*>,
  setActiveBlockchainNetwork: (id: string) => void,
  blockchainNetworks: BlockchainNetwork[],
  baseFiatCurrency: ?string,
  availableStake: number,
  accounts: Accounts,
  switchAccount: (accountId: string) => void,
  balances: BalancesStore,
  rates: Rates,
  theme: Theme,
  fetchAllAccountsBalances: () => void,
  keyBasedWalletHasPositiveBalance: boolean,
|};

const AccountsScreen = ({
  fetchAllAccountsBalances,
  setActiveBlockchainNetwork,
  navigation,
  accounts,
  switchAccount,
  blockchainNetworks,
  balances,
  rates,
  baseFiatCurrency,
  theme,
  availableStake,
  keyBasedWalletHasPositiveBalance,
}: Props) => {
  useEffect(() => { fetchAllAccountsBalances(); }, []);

  const [switchingToWalletId, setSwitchingToWalletId] = useState(false);

  const fiatCurrency = baseFiatCurrency || defaultFiatCurrency;
  const { PPNIcon, smartWalletIcon } = images(theme);
  const activeBlockchainNetwork = blockchainNetworks.find(({ isActive }) => !!isActive);
  const isEthereumActive = activeBlockchainNetwork?.id === BLOCKCHAIN_NETWORK_TYPES.ETHEREUM;
  const ppnNetwork = blockchainNetworks.find(({ id }) => id === BLOCKCHAIN_NETWORK_TYPES.PILLAR_NETWORK);

  const setPPNAsActiveBlockchainNetwork = () => {
    setActiveBlockchainNetwork(BLOCKCHAIN_NETWORK_TYPES.PILLAR_NETWORK);
    navigation.navigate(ASSETS);
  };

  const setAccountActive = async (wallet: Account) => {
    switchAccount(wallet.id);
    navigation.navigate(ASSETS);
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
        isLoading={id === switchingToWalletId}
        title={title}
        subtitle={balance}
        onPress={() => {
          setSwitchingToWalletId(id);
          mainAction();
        }}
        isActive={isActive}
        iconSource={iconSource}
      />
    );
  };


  const walletsToShow: ListItem[] = accounts
    .filter(isEthersportSmartWalletType) // filter others due migration to etherspot
    .map((account: Account): ListItem => {
      const { id, isActive, type } = account;
      const accountBalances: Balances = balances[id];
      const isActiveWallet = !!isActive && isEthereumActive;
      let walletBalance;
      if (accountBalances) {
        const thisAccountBalance = calculateBalanceInFiat(rates, accountBalances, fiatCurrency);
        walletBalance = formatFiat(thisAccountBalance, baseFiatCurrency);
      }
      return {
        id: `ACCOUNT_${id}`,
        type: ITEM_TYPE.ACCOUNT,
        title: getAccountName(type),
        balance: walletBalance,
        mainAction: () => setAccountActive(account),
        isActive: isActiveWallet,
        iconSource: smartWalletIcon,
      };
    });

  const isKeyBasedAssetsMigrationEnabled = firebaseRemoteConfig.getBoolean(REMOTE_CONFIG.KEY_BASED_ASSETS_MIGRATION);
  if (isKeyBasedAssetsMigrationEnabled && keyBasedWalletHasPositiveBalance) {
    walletsToShow.push({
      id: 'KEY_BASED',
      type: ITEM_TYPE.BUTTON,
      title: t('button.migrateAssetsToSmartWallet'),
      mainAction: () => navigation.navigate(KEY_BASED_ASSET_TRANSFER_CHOOSE),
    });
  }

  const networksToShow: ListItem[] = [];

  const ppnEnabled = firebaseRemoteConfig.getBoolean(REMOTE_CONFIG.PPN_ENABLED);

  if (ppnEnabled && ppnNetwork) {
    const { isActive } = ppnNetwork;
    const availableStakeFormattedAmount = formatMoney(availableStake);
    networksToShow.push({
      id: `NETWORK_${ppnNetwork.id}`,
      type: ITEM_TYPE.NETWORK,
      title: t('pillarNetwork'),
      balance: `${availableStakeFormattedAmount} ${PPN_TOKEN}`,
      mainAction: setPPNAsActiveBlockchainNetwork,
      isActive,
      iconSource: PPNIcon,
    });
  }

  const accountsList = [...walletsToShow, ...networksToShow];

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
  appSettings: { data: { baseFiatCurrency } },
  balances: { data: balances },
  rates: { data: rates },
}: RootReducerState): $Shape<Props> => ({
  accounts,
  blockchainNetworks,
  baseFiatCurrency,
  balances,
  rates,
});

const structuredSelector = createStructuredSelector({
  availableStake: availableStakeSelector,
  keyBasedWalletHasPositiveBalance: keyBasedWalletHasPositiveBalanceSelector,
});

const combinedMapStateToProps = (state: RootReducerState): $Shape<Props> => ({
  ...structuredSelector(state),
  ...mapStateToProps(state),
});

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  setActiveBlockchainNetwork: (id: string) => dispatch(setActiveBlockchainNetworkAction(id)),
  switchAccount: (accountId: string) => dispatch(switchAccountAction(accountId)),
  fetchAllAccountsBalances: () => dispatch(fetchAllAccountsBalancesAction()),
});

export default withTheme(connect(combinedMapStateToProps, mapDispatchToProps)(AccountsScreen));
