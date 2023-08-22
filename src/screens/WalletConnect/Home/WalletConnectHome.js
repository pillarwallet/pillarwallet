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
import { Platform, SectionList, useWindowDimensions } from 'react-native';
import { NavigationActions } from 'react-navigation';
import { useNavigation } from 'react-navigation-hooks';
import { useInteractionManager } from '@react-native-community/hooks';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import styled from 'styled-components/native';
import { useTranslation, useTranslationWithPrefix } from 'translations/translate';
import { chunk } from 'lodash';

import { WALLETCONNECT_BROWSER } from 'constants/navigationConstants';

// Components
import { Container, Center } from 'components/layout/Layout';
import HeaderBlock from 'components/HeaderBlock';
import Text from 'components/core/Text';
import FloatingButtons from 'components/FloatingButtons';
import Spinner from 'components/Spinner';
import WalletConnectRequests from 'screens/WalletConnect/Requests';
import Modal from 'components/Modal';
import Icon from 'components/core/Icon';

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
import { appFont, fontStyles, spacing, borderRadiusSizes } from 'utils/variables';
import { useChainsConfig } from 'utils/uiConfig';
import { showServiceLaunchErrorToast } from 'utils/inAppBrowser';
import { isArchanovaAccount, isKeyBasedAccount } from 'utils/accounts';
import { isLightTheme } from 'utils/themes';

// Types
import type { SectionBase } from 'utils/types/react-native';
import { type Chain } from 'models/Chain';
import type { WalletConnectCmsApp } from 'models/WalletConnectCms';

// Constant
import { NFT } from 'constants/assetsConstants';

// Local
import WalletConnectListItem from './components/WalletConnectListItem';
import ConnectFloatingButton from './components/ConnectFloatingButton';
import ConnectedAppsFloatingButton from './components/ConnectedAppsFloatingButton';
import DeployBanner from './components/DeployBanner';
import SwitchChainModal from './components/SwitchChainModal';

function WalletConnectHome() {
  const { t } = useTranslationWithPrefix('walletConnect.home');
  const navigation = useNavigation();
  const safeArea = useSafeAreaInsets();
  const isReady = useInteractionManager(); // Used to prevent jank on screen entry animation

  const activeAccount = useActiveAccount();
  const tabItems = useTabItems();
  const [activeChain, setActiveChain] = React.useState<?Chain>(null);
  const [activeItem, setActiveItem] = React.useState(tabItems[0]);

  const { isDeployedOnChain } = useDeploymentStatus();

  const { numberOfColumns, columnWidth } = useColumnDimensions();
  const { data: sections, isFetching } = useSectionData(activeChain, numberOfColumns);

  const isLight = isLightTheme();
  const showDeployBanner = !isKeyBasedAccount(activeAccount) && activeChain != null && !isDeployedOnChain[activeChain];

  const updateActiveChain = (chain?) => {
    setActiveChain(chain ?? null);
  };

  const updateActiveItem = (item?) => {
    if (item) setActiveItem(item);
  };

  const closeModal = () => Modal.closeAll();

  const openSwitchChainModal = () => {
    Modal.open(() => {
      return (
        <SwitchChainModal
          items={tabItems}
          activeItem={activeItem}
          updateActiveChain={updateActiveChain}
          updateActiveItem={updateActiveItem}
          closeModal={closeModal}
        />
      );
    });
  };

  const renderListHeader = () => {
    const { key, title } = activeItem;
    return (
      <ListHeader>
        <WalletConnectRequests />
        {!isArchanovaAccount(activeAccount) && (
          <ContainerView isSelected onPress={() => openSwitchChainModal()}>
            <RowContainer>
              <ChainViewIcon
                size={24}
                style={IconContainer}
                name={key || (isLight ? 'all-networks-light' : 'all-networks')}
              />
              <Title>{title}</Title>
              <ChainViewIcon name="chevron-down" />
            </RowContainer>
          </ContainerView>
        )}

        {showDeployBanner && activeChain != null && <DeployBanner chain={activeChain} style={styles.banner} />}
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
          contentContainerStyle={{
            paddingBottom: safeArea.bottom + FloatingButtons.SCROLL_VIEW_BOTTOM_INSET,
            paddingTop: spacing.rhythm,
          }}
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

type itemType = {|
  key: ?Chain,
  title: ?string,
|};

const useColumnDimensions = () => {
  const { width } = useWindowDimensions();
  // eslint-disable-next-line no-mixed-operators
  const availableWidth = width - 2 * spacing.layoutSides;
  const minColumnWidth = 80;

  const numberOfColumns = Math.floor(availableWidth / minColumnWidth);
  const columnWidth = Math.floor(availableWidth / numberOfColumns);
  return { numberOfColumns, columnWidth };
};

const useTabItems = (): itemType[] => {
  const { t } = useTranslation();
  const chains = useSupportedChains();
  const config = useChainsConfig();

  const chainTabs = chains.map((chain) => ({
    key: chain,
    title: config[chain].titleShort,
  }));
  return [{ key: null, title: t('label.allNetwork') }, ...chainTabs];
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

  if (Platform.OS === 'ios') {
    const nft = categories.find((item) => item.title === NFT);
    const index = categories.indexOf(nft);
    if (index !== -1) {
      categories?.splice(index, 1);
    }
  }

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

const ContainerView = styled.TouchableOpacity`
  background-color: ${({ theme, isSelected }) => (isSelected ? theme.colors.basic60 : theme.colors.basic050)};
  margin: 0 ${spacing.layoutSides}px;
  padding: 0 ${spacing.large}px 0 ${spacing.mediumLarge}px;
  height: 66px;
  justify-content: center;
  border-radius: ${borderRadiusSizes.medium}px;
`;

const RowContainer = styled.View`
  align-items: center;
  justify-content: center;
  flex-direction: row;
  padding: ${spacing.small}px;
`;

const IconContainer = styled.View`
  align-items: center;
  justify-content: center;
`;

const Title = styled(Text)`
  flex: 1;
  flex-direction: row;
  ${fontStyles.big};
  padding: 0 ${spacing.medium}px 0 ${spacing.medium}px;
`;

const ChainViewIcon = styled(Icon)`
  height: 24px;
  width: 24px;
  background-color: ${({ theme }) => theme.colors.basic050};
  border-radius: ${borderRadiusSizes.medium}px;
`;
