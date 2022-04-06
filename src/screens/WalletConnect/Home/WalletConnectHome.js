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
import { NavigationActions } from 'react-navigation';
import { useNavigation } from 'react-navigation-hooks';
import { useInteractionManager } from '@react-native-community/hooks';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import styled from 'styled-components/native';
import { useTranslationWithPrefix } from 'translations/translate';
import { chunk } from 'lodash';

import { WALLETCONNECT_BROWSER } from 'constants/navigationConstants';

// Components
import { Container, Center } from 'components/layout/Layout';
import HeaderBlock from 'components/HeaderBlock';
import Text from 'components/core/Text';
import FloatingButtons from 'components/FloatingButtons';
import Spinner from 'components/Spinner';
import WalletConnectRequests from 'screens/WalletConnect/Requests';
import Banner from 'components/Banner/Banner';
import DropdownChainView from 'components/ChainView/DropdownChainView';

// Selectors
import { useActiveAccount } from 'selectors';
import { useSupportedChains } from 'selectors/chains';

// Hooks
import { useDeploymentStatus } from 'hooks/deploymentStatus';

// Services
import { useFetchWalletConnectCategoriesQuery } from 'services/cms/WalletConnectCategories';
import { useFetchWalletConnectAppsQuery } from 'services/cms/WalletConnectApps';
import { navigate } from 'services/navigation';

// Utils
import { mapNotNil } from 'utils/array';
import { appFont, fontStyles, spacing } from 'utils/variables';
import { showServiceLaunchErrorToast } from 'utils/inAppBrowser';
import { isArchanovaAccount, isKeyBasedAccount } from 'utils/accounts';
import { getActiveScreenName } from 'utils/navigation';

// Types
import type { SectionBase } from 'utils/types/react-native';
import { type Chain } from 'models/Chain';
import type { WalletConnectCmsApp } from 'models/WalletConnectCms';

// Local
import WalletConnectListItem from './components/WalletConnectListItem';
import ConnectFloatingButton from './components/ConnectFloatingButton';
import ConnectedAppsFloatingButton from './components/ConnectedAppsFloatingButton';
import DeployBanner from './components/DeployBanner';

function WalletConnectHome() {
  const { t } = useTranslationWithPrefix('walletConnect.home');
  const navigation = useNavigation();
  const safeArea = useSafeAreaInsets();
  const isReady = useInteractionManager(); // Used to prevent jank on screen entry animation

  const activeAccount = useActiveAccount();
  const [activeChain, setActiveChain] = React.useState<?Chain>(null);
  const screenName = getActiveScreenName(navigation);

  const { isDeployedOnChain } = useDeploymentStatus();

  const { numberOfColumns, columnWidth } = useColumnDimensions();
  const { data: sections, isFetching } = useSectionData(activeChain, numberOfColumns);

  const showDeployBanner = !isKeyBasedAccount(activeAccount) && activeChain != null && !isDeployedOnChain[activeChain];

  const renderListHeader = () => {
    return (
      <ListHeader>
        <WalletConnectRequests />
        {!isArchanovaAccount(activeAccount) && <DropdownChainView selectedChain={setActiveChain} />}

        {showDeployBanner && activeChain != null && <DeployBanner chain={activeChain} style={styles.banner} />}
        <Banner screenName={screenName} bottomPosition={false} />
      </ListHeader>
    );
  };

  // Note: in order to achieve multicolumn layout, we group n normal items into one list row item.
  const renderListRow = (items: WalletConnectCmsApp[]) => <ListRow>{items.map(renderItem)}</ListRow>;

  const openAppUrl = (url: string, title: string, iconUrl: ?string) => {
    if (url) {
      navigate(
        NavigationActions.navigate({
          routeName: WALLETCONNECT_BROWSER,
          params: {
            url,
            title,
            iconUrl,
          },
        }),
      );
    } else {
      showServiceLaunchErrorToast();
    }
  };

  const renderItem = (item: WalletConnectCmsApp) => (
    <WalletConnectListItem
      key={item.id}
      title={item.title}
      iconUrl={item.iconUrl}
      width={columnWidth}
      onPress={() => openAppUrl(item.url, item.title, item.iconUrl)}
    />
  );

  return (
    <Container>
      <HeaderBlock
        leftItems={[{ close: true }]}
        centerItems={[{ title: t('title') }]}
        navigation={navigation}
        noPaddingTop
      />

      {isReady && !isFetching && (
        <SectionList
          sections={sections ?? []}
          renderSectionHeader={({ section }) => <SectionHeader>{section.title}</SectionHeader>}
          renderSectionFooter={() => <SectionFooter />}
          renderItem={({ item }) => renderListRow(item)}
          keyExtractor={(items) => items[0]?.id}
          ListHeaderComponent={renderListHeader()}
          contentContainerStyle={{ paddingBottom: safeArea.bottom + FloatingButtons.SCROLL_VIEW_BOTTOM_INSET }}
        />
      )}
      {isReady && isFetching && (
        <>
          {renderListHeader()}
          <Center flex={1}>
            <Spinner />
          </Center>
        </>
      )}

      <ConnectFloatingButton />
      <ConnectedAppsFloatingButton />
    </Container>
  );
}

export default WalletConnectHome;

type Section = {
  ...SectionBase<WalletConnectCmsApp[]>,
  title: string,
};

const useColumnDimensions = () => {
  const { width } = useWindowDimensions();
  // eslint-disable-next-line no-mixed-operators
  const availableWidth = width - 2 * spacing.layoutSides;
  const minColumnWidth = 80;

  const numberOfColumns = Math.floor(availableWidth / minColumnWidth);
  const columnWidth = Math.floor(availableWidth / numberOfColumns);
  return { numberOfColumns, columnWidth };
};

type SectionData = {|
  data?: Section[],
  isFetching?: boolean,
|};

const useSectionData = (chain: ?Chain, numberOfColumns: number): SectionData => {
  const supportedChains = useSupportedChains();
  const categoriesQuery = useFetchWalletConnectCategoriesQuery();
  const appsQuery = useFetchWalletConnectAppsQuery();

  if (!categoriesQuery.data || !appsQuery.data) return { isFetching: true };

  const categories = categoriesQuery.data;
  const apps = filterAppsByChain(appsQuery.data, supportedChains, chain);

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

const filterAppsByChain = (
  apps: WalletConnectCmsApp[],
  supportedChains: Chain[],
  chain: ?Chain,
): WalletConnectCmsApp[] => {
  if (chain) {
    return apps.filter((app) => app.chains.includes(chain));
  }

  return apps.filter((app) => supportedChains.some((supporedChain) => app.chains.includes(supporedChain)));
};

const styles = {
  tabs: {
    marginTop: spacing.medium,
    marginHorizontal: spacing.large,
  },
  banner: {
    marginVertical: spacing.medium,
    marginHorizontal: spacing.large,
  },
};

const ListHeader = styled.View`
  margin-bottom: ${spacing.large}px;
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
