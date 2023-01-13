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
import { SectionList, useWindowDimensions } from 'react-native';
import { useNavigation } from 'react-navigation-hooks';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import styled from 'styled-components/native';
import { chunk } from 'lodash';
import { useTranslation } from 'translations/translate';

// Components
import ChainListHeader from 'components/lists/ChainListHeader';
import ChainListFooter from 'components/lists/ChainListFooter';
import FloatingButtons from 'components/FloatingButtons';
import Modal from 'components/Modal';
import ReceiveModal from 'screens/Asset/ReceiveModal';
import Banner from 'components/Banner/Banner';

// Constants
import { COLLECTIBLE, SEND_COLLECTIBLE_FROM_ASSET_FLOW } from 'constants/navigationConstants';

// Selectors
import { useRootSelector, activeAccountAddressSelector } from 'selectors';
import { useSupportedChains } from 'selectors/chains';

// Utils
import { spacing } from 'utils/variables';

// Types
import type { SectionBase } from 'utils/types/react-native';
import type { Chain } from 'models/Chain';

// Local
import { type FlagPerChain, useExpandItemsPerChain } from '../utils';
import { type CollectibleItem, useCollectibleAssets } from './selectors';
import { buildCollectibleFromCollectibleItem, calculateTotalCollectibleCount } from './utils';
import CollectibleListItem from './CollectibleListItem';

function CollectiblesTab() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const safeArea = useSafeAreaInsets();

  const initialChain: ?Chain = navigation.getParam('chain');
  const { expandItemsPerChain, toggleExpandItems } = useExpandItemsPerChain(initialChain);

  const { width } = useWindowDimensions();
  const numberOfColumns = 2;

  const sections = useSectionData(numberOfColumns, expandItemsPerChain);

  // Temporarily Removed NFT Banner Temporarily
  // const [totalCollectibleCount, setTotalCollectibleCount] = React.useState(0);
  // React.useEffect(() => {
  //   setTotalCollectibleCount(sections[0]?.totalCollectibleCount ?? 0);
  // }, [sections]);

  const accountAddress = useRootSelector(activeAccountAddressSelector);

  const showReceiveModal = () => {
    Modal.open(() => <ReceiveModal address={accountAddress} />);
  };

  const navigateToCollectibleDetails = (item: CollectibleItem, chain: Chain) => {
    const collectible = buildCollectibleFromCollectibleItem(item, chain);
    navigation.navigate(COLLECTIBLE, { collectible });
  };

  const renderSectionHeader = ({ chain }: Section) => {
    return (
      <ChainListHeader
        chain={chain}
        isExpanded={expandItemsPerChain[chain] ?? null}
        onPress={() => toggleExpandItems(chain)}
      />
    );
  };

  const renderItem = (items: CollectibleItem[], chain: Chain) => {
    const itemWidth = (width - 48) / numberOfColumns;

    return (
      <ListRow>
        {items.map((item) => (
          <CollectibleListItem
            key={item.key}
            title={item.title}
            iconUrl={item.iconUrl}
            width={itemWidth}
            onPress={() => navigateToCollectibleDetails(item, chain)}
          />
        ))}
      </ListRow>
    );
  };

  const buttons = [
    {
      title: t('button.receive'),
      iconName: 'qrcode',
      onPress: showReceiveModal,
    },
    {
      title: t('button.send'),
      iconName: 'send',
      onPress: () => navigation.navigate(SEND_COLLECTIBLE_FROM_ASSET_FLOW),
    },
  ];

  return (
    <Container>
      {/* Temporarily Removed NFT banner for empty wallets
      <ImageContainer>
        {(totalCollectibleCount === 0) && <ContentIcon source={collectibleBanner} />}
      </ImageContainer> */}
      <Banner screenName="COLLECTIBLES" bottomPosition={false} />
      <SectionList
        sections={sections}
        renderSectionHeader={({ section }) => renderSectionHeader(section)}
        renderSectionFooter={() => <ChainListFooter />}
        renderItem={({ item, section }) => renderItem(item, section.chain)}
        keyExtractor={(items) => items[0]?.key}
        contentContainerStyle={{ paddingBottom: safeArea.bottom + FloatingButtons.SCROLL_VIEW_BOTTOM_INSET }}
      />
      <Banner screenName="COLLECTIBLES" bottomPosition />

      <FloatingButtons items={buttons} />
    </Container>
  );
}

export default CollectiblesTab;

type Section = {
  ...SectionBase<CollectibleItem[]>,
  chain: Chain,
    totalCollectibleCount: number,
};

const useSectionData = (numberOfColumns: number, expandItemsPerChain: FlagPerChain): Section[] => {
  const chains = useSupportedChains();
  const assetsPerChain = useCollectibleAssets();
  const totalCollectibleCount = calculateTotalCollectibleCount(assetsPerChain);

  return chains.map((chain) => {
    const items = assetsPerChain[chain] ?? [];
    const data = expandItemsPerChain[chain] ? chunk(items, numberOfColumns) : [];
    return { key: chain, chain, data, totalCollectibleCount };
  });
};

const Container = styled.View`
  flex: 1;
`;

const ListRow = styled.View`
  flex-direction: row;
  align-items: stretch;
  padding: 0 ${spacing.mediumLarge}px;
`;

// Temporarily Removed NFT banner componenets
// const ContentIcon = styled.Image`
//   margin-right: ${spacing.mediumLarge}px;
// `;

// const ImageContainer = styled.View`
//   align-items: center;
//   justify-content: center;
//   margin: ${spacing.extraLarge}px ${spacing.small}px ${spacing.largePlus}px ${spacing.large}px;
// `;
