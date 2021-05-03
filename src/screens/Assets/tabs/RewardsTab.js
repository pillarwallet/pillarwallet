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
import { LayoutAnimation, SectionList } from 'react-native';
import { useNavigation } from 'react-navigation-hooks';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BigNumber } from 'bignumber.js';
import styled from 'styled-components/native';
import { useTranslationWithPrefix } from 'translations/translate';

// Components
import BalanceView from 'components/BalanceView';
import FloatingButtons from 'components/FloatingButtons';
import Text from 'components/modern/Text';

// Selectors
import { useSupportedChains } from 'selectors/smartWallet';

// Utils
import { sum } from 'utils/bigNumber';
import { type HeaderListItem, prepareHeaderListItems } from 'utils/headerList';
import { LIST_ITEMS_APPEARANCE } from 'utils/layoutAnimations';
import { useThemeColors } from 'utils/themes';
import { spacing } from 'utils/variables';

// Types
import type { SectionBase } from 'utils/types/react-native';
import type { Chain } from 'models/Chain';

// Local
import { type RewardItem, useRewardsBalance, useRewardsAssets } from '../selectors/rewards';
import ChainListHeader from '../components/ChainListHeader';
import ServiceListHeader from '../components/ServiceListHeader';
import AssetListItem from '../items/AssetListItem';

type FlagPerChain = { [Chain]: ?boolean };

function RewardsTab() {
  const { t } = useTranslationWithPrefix('assets.rewards');
  const navigation = useNavigation();
  const safeArea = useSafeAreaInsets();
  const colors = useThemeColors();

  const { chain: initialChain } = navigation.state.params;

  const [showItemsPerChain, setShowItemsPerChain] = React.useState<FlagPerChain>({ [initialChain]: true });

  const totalBalance = useRewardsBalance();
  const sections = useSectionData(showItemsPerChain);

  const toggleShowItems = (chain: Chain) => {
    LayoutAnimation.configureNext(LIST_ITEMS_APPEARANCE);
    // $FlowFixMe: type inference limitation
    setShowItemsPerChain({ ...showItemsPerChain, [chain]: !showItemsPerChain[chain] });
  };


  const renderListHeader = () => {
    return (
      <ListHeader>
        <BalanceView balance={totalBalance} style={styles.balanceView} />
        <Text color={colors.secondaryText}>{t('availableToClaim')}</Text>
      </ListHeader>
    );
  };

  const renderSectionHeader = ({ chain, balance }: Section) => {
    return <ChainListHeader chain={chain} balance={balance} onPress={() => toggleShowItems(chain)} />;
  };

  const renderItem = (headerListItem: HeaderListItem<RewardItem>) => {
    if (headerListItem.type === 'header') {
      return <ServiceListHeader title={headerListItem.key} />;
    }

    const { title, iconUrl, value, navigateAction } = headerListItem.item;
    return <AssetListItem title={title} iconSource={iconUrl ? { uri: iconUrl } : null} value={value} onPress={navigateAction} />;
  };

  return (
    <Container>
      <SectionList
        sections={sections}
        renderSectionHeader={({ section }) => renderSectionHeader(section)}
        renderItem={({ item }) => renderItem(item)}
        ListHeaderComponent={renderListHeader()}
        contentContainerStyle={{ paddingBottom: safeArea.bottom + FloatingButtons.SCROLL_VIEW_BOTTOM_INSET }}
      />
    </Container>
  );
}

export default RewardsTab;

type Section = {
  ...SectionBase<HeaderListItem<RewardItem>>,
  chain: Chain,
  balance: BigNumber,
};

const useSectionData = (showChainAssets: FlagPerChain): Section[] => {
  const chains = useSupportedChains();
  const assetsPerChain = useRewardsAssets();

  return chains.map((chain) => {
    const items = assetsPerChain[chain] ?? [];
    const balance = sum(items.map((item) => item.value));

    return {
      key: chain,
      chain,
      balance,
      data: showChainAssets[chain] ? prepareHeaderListItems(items, (item) => item.service) : [],
    };
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
  margin: ${spacing.largePlus}px 0 ${spacing.small}px;
`;
