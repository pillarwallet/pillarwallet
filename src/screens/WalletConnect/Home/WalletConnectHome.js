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
import { SectionList, useWindowDimensions } from 'react-native';
import { useNavigation } from 'react-navigation-hooks';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import styled from 'styled-components/native';
import { useTranslation, useTranslationWithPrefix } from 'translations/translate';
import { isEqual, chunk } from 'lodash';

// Components
import { Container, Center } from 'components/modern/Layout';
import HeaderBlock from 'components/HeaderBlock';
import TabBar from 'components/modern/TabBar';
import Text from 'components/modern/Text';
import FloatingButtons from 'components/FloatingButtons';
import Spinner from 'components/Spinner';

// Selectors
import { useSupportedChains, useIsDeployedOnEthereum } from 'selectors/chains';

// Services
import { useFetchWalletConnectAppsQuery } from 'services/cms/WalletConnectApps';
import { useFetchWalletConnectCategoriesQuery } from 'services/cms/WalletConnectCategories';

// Utils
import { mapNotNil } from 'utils/array';
import { appFont, fontStyles, spacing } from 'utils/variables';
import { useChainsConfig } from 'utils/uiConfig';

// Types
import type { SectionBase } from 'utils/types/react-native';
import { type Chain, CHAIN } from 'models/Chain';
import type { WalletConnectApp } from 'models/WalletConnect';

// Local
import ConnectFloatingButton from './components/ConnectFloatingButton';
import ConnectedAppsFloatingButton from './components/ConnectedAppsFloatingButton';
import DeployOnEthereumBanner from './components/DeployOnEthereumBanner';
import WalletConnectListItem from './components/WalletConnectListItem';
import { filterAppsByChain } from './utils';

function WalletConnectHome() {
  const { t } = useTranslationWithPrefix('walletConnect.home');
  const navigation = useNavigation();
  const safeArea = useSafeAreaInsets();

  const tabItems = useTabItems();
  const [activeChain, setActiveChain] = React.useState<?Chain>(null);

  const { numberOfColumns, columnWidth } = useColumnDimensions();
  const { data: sections, isFetching } = useSectionData(activeChain, numberOfColumns);
  const isDeployedOnEthereum = useIsDeployedOnEthereum();

  if (isFetching) {
    return (
      <Container>
        <HeaderBlock centerItems={[{ title: t('title') }]} navigation={navigation} noPaddingTop />
        <Center flex={1}>
          <Spinner />
        </Center>
      </Container>
    );
  }

  const renderListHeader = () => {
    const showDeployOnEthereumBanner = !isDeployedOnEthereum && activeChain === CHAIN.ETHEREUM;

    return (
      <ListHeader>
        <TabBar items={tabItems} activeTab={activeChain} onActiveTabChange={setActiveChain} />
        {showDeployOnEthereumBanner && <DeployOnEthereumBanner style={styles.deployOnEthereumBanner} />}
      </ListHeader>
    );
  };

  // Note: in order to achieve multicolumn layout, we group n normal items into one list row item.
  const renderListRow = (items: WalletConnectApp[]) => {
    return (
      <ListRow>{items.map(renderItem)}</ListRow>
    );
  };

  const renderItem = (item: WalletConnectApp) => {
    const isEthereumOnly = activeChain === CHAIN.ETHEREUM || isEqual(item.chains.length, [CHAIN.ETHEREUM]);
    const disabled = isEthereumOnly && !isDeployedOnEthereum;

    return (
      <WalletConnectListItem
        key={item.id}
        title={item.title}
        iconUrl={item.iconUrl}
        width={columnWidth}
        disabled={disabled}
      />
    );
  };

  return (
    <Container>
      <HeaderBlock centerItems={[{ title: t('title') }]} navigation={navigation} noPaddingTop />

      <SectionList
        sections={sections ?? []}
        renderSectionHeader={({ section }) => <SectionHeader>{section.title}</SectionHeader>}
        renderSectionFooter={() => <SectionFooter />}
        renderItem={({ item }) => renderListRow(item)}
        keyExtractor={(items) => items[0]?.id}
        ListHeaderComponent={renderListHeader()}
        contentContainerStyle={{ paddingBottom: safeArea.bottom + FloatingButtons.SCROLL_VIEW_BOTTOM_INSET }}
      />

      <ConnectFloatingButton />
      <ConnectedAppsFloatingButton />
    </Container>
  );
}

export default WalletConnectHome;

type Section = {
  ...SectionBase<WalletConnectApp[]>,
  title: string,
};

const useColumnDimensions = () => {
  const { width } = useWindowDimensions();
  const availableWidth = width - (2 * spacing.layoutSides);
  const minColumnWidth = 80;

  const numberOfColumns = Math.floor(availableWidth / minColumnWidth);
  const columnWidth = Math.floor(availableWidth / numberOfColumns);
  return { numberOfColumns, columnWidth };
};

const useTabItems = () => {
  const { t } = useTranslation();
  const chains = useSupportedChains();
  const config = useChainsConfig();

  const chainTabs = chains.map((chain) => ({
    key: chain,
    title: config[chain].titleShort,
  }));
  return [{ key: null, title: t('label.all') }, ...chainTabs];
};

type SectionData = {|
  data?: Section[],
  isFetching?: boolean,
|};

const useSectionData = (chain: ?Chain, numberOfColumns: number): SectionData => {
  const categoriesQuery = useFetchWalletConnectCategoriesQuery();
  const appsQuery = useFetchWalletConnectAppsQuery();

  if (!categoriesQuery.data || !appsQuery.data) return { isFetching: true };

  const categories = categoriesQuery.data;
  const apps = filterAppsByChain(appsQuery.data, chain);

  const data = mapNotNil(categories, ({ id, title }) => {
    const matchingApps = apps.filter((app) => app.categoryId === id);
    if (matchingApps.length === 0) return null;

    return {
      key: id,
      title,
      data: chunk(matchingApps, numberOfColumns),
    };
  });

  return { data, isFetching: false };
};

const styles = {
  deployOnEthereumBanner: {
    marginTop: spacing.large,
    marginBottom: spacing.large,
  },
};

const ListHeader = styled.View`
  margin: 0 ${spacing.layoutSides}px ${spacing.large}px;
`;

const SectionHeader = styled(Text)`
  padding: ${spacing.extraSmall}px ${spacing.layoutSides}px;
  font-family: ${appFont.medium};
  ${fontStyles.big};
  background-color: ${({ theme }) => theme.colors.background};
`;

const SectionFooter = styled.View`
  height: 24px;
`;

const ListRow = styled.View`
  flex-direction: row;
  align-items: stretch;
  padding: 0 ${spacing.layoutSides}px;
`;
