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

import * as React from 'react';
import { SectionList } from 'react-native';
import { useNavigation } from 'react-navigation-hooks';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import styled from 'styled-components/native';
import { BigNumber } from 'bignumber.js';
import { useTranslationWithPrefix } from 'translations/translate';

// Components
import BalanceView from 'components/BalanceView';
import ChainListHeader from 'components/lists/ChainListHeader';
import ChainListFooter from 'components/lists/ChainListFooter';
import FloatingButtons from 'components/FloatingButtons';
import Text from 'components/core/Text';

// Selectors
import { useSupportedChains } from 'selectors/chains';

// Utils
import { useThemeColors } from 'utils/themes';
import { spacing } from 'utils/variables';

// Types
import type { SectionBase } from 'utils/types/react-native';
import type { Chain } from 'models/Chain';

// Local
import { type FlagPerChain, useExpandItemsPerChain } from '../utils';
import { type RewardItem, useRewardsTotalBalance, useRewardsBalancePerChain, useRewardsAssets } from './selectors';
import RewardListItem from './RewardListItem';

function RewardsTab() {
  const { t } = useTranslationWithPrefix('assets.rewards');
  const navigation = useNavigation();
  const colors = useThemeColors();
  const safeArea = useSafeAreaInsets();

  const initialChain: ?Chain = navigation.getParam('chain');
  const { expandItemsPerChain, toggleExpandItems } = useExpandItemsPerChain(initialChain);

  const totalBalance = useRewardsTotalBalance();
  const sections = useSectionData(expandItemsPerChain);

  const renderListHeader = () => {
    return (
      <ListHeader>
        <BalanceView balance={totalBalance} style={styles.balanceView} />
        <Text color={colors.secondaryText}>{t('availableToClaim')}</Text>
      </ListHeader>
    );
  };

  const renderSectionHeader = ({ chain, balance }: Section) => {
    return (
      <ChainListHeader
        chain={chain}
        balance={balance}
        isExpanded={expandItemsPerChain[chain] ?? null}
        onPress={() => toggleExpandItems(chain)}
      />
    );
  };

  const renderItem = ({ title, service, iconUrl, value, assetSymbol, assetAddress, chain }: RewardItem) => (
    <RewardListItem
      title={title}
      subtitle={service}
      iconUrl={iconUrl}
      value={value}
      assetSymbol={assetSymbol}
      assetAddress={assetAddress}
      chain={chain}
    />
  );

  return (
    <Container>
      <SectionList
        sections={sections}
        renderSectionHeader={({ section }) => renderSectionHeader(section)}
        renderSectionFooter={() => <ChainListFooter />}
        renderItem={({ item }) => renderItem(item)}
        ListHeaderComponent={renderListHeader()}
        contentContainerStyle={{ paddingBottom: safeArea.bottom + FloatingButtons.SCROLL_VIEW_BOTTOM_INSET }}
      />
    </Container>
  );
}

export default RewardsTab;

type Section = {
  ...SectionBase<RewardItem>,
  chain: Chain,
  balance: BigNumber,
};

const useSectionData = (expandItemsPerChain: FlagPerChain): Section[] => {
  const chains = useSupportedChains();
  const balancePerChain = useRewardsBalancePerChain();
  const assetsPerChain = useRewardsAssets();

  return chains.map((chain) => {
    const items = assetsPerChain[chain] ?? [];
    const balance = balancePerChain[chain] ?? BigNumber(0);
    const data = expandItemsPerChain[chain] ? items : [];
    return { key: chain, chain, balance, data };
  });
};

const styles = {
  balanceView: {
    marginBottom: spacing.extraSmall,
  },
};

const Container = styled.View`
  flex: 1;
`;

const ListHeader = styled.View`
  align-items: center;
  margin-top: ${spacing.largePlus}px;
  margin-bottom: 32px;
`;
