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
import { Dimensions, FlatList, DeviceEventEmitter } from 'react-native';
import { useNavigation } from 'react-navigation-hooks';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import styled from 'styled-components/native';
import { useTranslationWithPrefix } from 'translations/translate';

// Hooks
import { useNonStableAssets, useFilteredAssets } from 'hooks/assets';

// Components
import BalanceView from 'components/BalanceView';
import TokenListItem from 'components/lists/TokenListItem';
import FloatingButtons from 'components/FloatingButtons';
import Banner from 'components/Banner/Banner';
import ChainSelectorContent from 'components/ChainSelector/ChainSelectorContent';
import { Spacing } from 'components/legacy/Layout';
import ButtonGroup from 'components/layout/ButtonGroup';
import HorizontalProgressBar from 'components/Progress/HorizontalProgressBar';
import Icon from 'components/core/Icon';
import PortfolioRiskinessModal from 'components/Modals/PortfolioRiskiness/PortfolioRiskinessModal';
import EmptyStateParagraph from 'components/EmptyState/EmptyStateParagraph';
import SearchBar from 'components/SearchBar';
import Text from 'components/core/Text';

// Constants
import { ASSET, ADD_TOKENS } from 'constants/navigationConstants';
import { TOKENS, STABLES, ALL, WALLET_DROPDOWN_REF } from 'constants/walletConstants';

// Selectors
import { useIsPillarPaySupported } from 'selectors/archanova';

// Utils
import { spacing } from 'utils/variables';
import { wrapBigNumberOrNil } from 'utils/bigNumber';
import { useThemeColors } from 'utils/themes';
import { getMatchingTokens } from 'utils/wallet';
import { fontStyles } from 'utils/variables';
import { hitSlop20 } from 'utils/common';

// Modals
import type { Chain } from 'models/Chain';

// Local
import PillarPaySummary from '../components/PillarPaySummary';
import { buildAssetDataNavigationParam } from '../utils';
import AnimationScroll from './AnimationScroll';

type Props = {
  isNavigateToHome?: boolean;
  hasPositiveBalance: (status: boolean) => void;
};

function WalletTabScrollContent({ isNavigateToHome, hasPositiveBalance }: Props) {
  const { tRoot } = useTranslationWithPrefix('assets.wallet');
  const navigation = useNavigation();
  const safeArea = useSafeAreaInsets();
  const ref: any = React.useRef();
  const colors = useThemeColors();

  const items = [
    { key: ALL, title: ALL, color: colors.preciousPersimmon },
    { key: TOKENS, title: TOKENS, color: colors.darkViolet },
    { key: STABLES, title: STABLES, color: colors.dodgerBlue },
  ];

  const [selectedChain, setSelectedChain] = React.useState(null);
  const [visibleRiskinessModal, setVisibleRiskinessModal] = React.useState(false);
  const [selectedTabNm, setSelectedTabNm] = React.useState(items[0].title);
  const [query, setQuery] = React.useState('');

  const { percentage } = useNonStableAssets(selectedChain);

  const { assets, totalBalance } = useFilteredAssets(selectedChain, selectedTabNm);

  React.useEffect(() => {
    hasPositiveBalance(totalBalance > 0);
  }, [totalBalance]);

  const isPillarPaySupported = useIsPillarPaySupported();

  const searchItems = getMatchingTokens(assets, query);

  const navigateToAssetDetails = (category: any, chain: Chain) => {
    const assetData = buildAssetDataNavigationParam(category, chain);
    navigation.navigate(ASSET, { assetData, isNavigateToHome });
  };

  React.useEffect(() => {
    DeviceEventEmitter.emit(WALLET_DROPDOWN_REF, ref);
  }, [ref, visibleRiskinessModal]);

  const openPortfolioRiskinessModal = () => {
    setVisibleRiskinessModal(true);
  };

  const renderListHeader = () => {
    return (
      <ListHeader>
        <BalanceView balance={totalBalance} />
        {/* The below part is could be implemented in future (Price changes) */}
        {/* {!!change && (
          <FiatChangeView value={value} change={totalBalance.change} currency={currency} style={styles.balanceChange} />
        )} */}

        {isPillarPaySupported && <PillarPaySummary style={styles.pillarPay} />}

        <BannerContent>
          <Banner screenName="HOME_WALLET" bottomPosition={false} />
        </BannerContent>

        <Spacing h={10} />

        <ChainSelectorContent selectedAssetChain={selectedChain} onSelectChain={setSelectedChain} />

        <ButtonGroup items={items} tabName={selectedTabNm} onSelectedTabName={setSelectedTabNm} />

        <Spacing h={18} />

        <ProgressContent>
          <HorizontalProgressBar
            style={{ width: Dimensions.get('screen').width - 70, marginRight: 15 }}
            selectedName={selectedTabNm}
            progress={percentage}
            forgroundColor={items[1].color}
            backgroundColor={items[2].color}
          />

          <Button ref={ref} onPress={openPortfolioRiskinessModal}>
            <Icon name="help" />
          </Button>
        </ProgressContent>

        {visibleRiskinessModal && (
          <PortfolioRiskinessModal chain={selectedChain} visible onHide={setVisibleRiskinessModal} />
        )}
      </ListHeader>
    );
  };

  const searchContent = (
    <SearchBar style={{ width: '100%' }} query={query} onQueryChange={setQuery} placeholder={tRoot('label.search')} />
  );

  const renderItem = (token: any) => {
    return (
      <TokenListItem
        chain={token.chain}
        address={token.address}
        symbol={token.symbol}
        name={token.name}
        iconUrl={token.iconUrl}
        balance={wrapBigNumberOrNil(token.balance?.balance)}
        onPress={async () => {
          navigateToAssetDetails(token, token.chain);
        }}
      />
    );
  };

  const renderEmptyState = () => {
    return (
      <EmptyStateWrapper>
        <Spacing flex={1} />
        <EmptyStateParagraph title={tRoot('label.nothingFound')} />
        <Spacing flex={3} />
      </EmptyStateWrapper>
    );
  };

  const renderAddToken = () => {
    return (
      <AddTokenButton
        hitSlop={hitSlop20}
        onPress={() => {
          navigation.navigate(ADD_TOKENS);
        }}
      >
        <Icon name="add-token" />
        <Spacing w={7} />
        <AddTokenText>{tRoot('label.add_tokens')}</AddTokenText>
      </AddTokenButton>
    );
  };

  return (
    <AnimationScroll
      maincontent={
        <FlatList
          data={query ? searchItems : assets}
          renderItem={({ item }) => renderItem(item)}
          ListEmptyComponent={renderEmptyState}
          style={{ marginTop: 28 }}
          contentContainerStyle={{
            paddingBottom: safeArea.bottom + FloatingButtons.SCROLL_VIEW_BOTTOM_INSET,
          }}
          ListFooterComponent={renderAddToken}
          ListFooterComponentStyle={{ marginVertical: 30 }}
          scrollEnabled={false}
        />
      }
      headerContent={renderListHeader()}
      searchContent={searchContent}
      query={query}
    />
  );
}

export default WalletTabScrollContent;

const styles = {
  balanceChange: {
    marginTop: spacing.extraSmall,
  },
  pillarPay: {
    marginTop: spacing.largePlus,
  },
};

const ListHeader = styled.View`
  align-items: center;
  height: 230px;
  margin-top: ${spacing.medium}px;
`;

const BannerContent = styled.View`
  width: 100%;
`;

const AddTokenButton = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
  justify-content: center;
  padding: 15px;
`;

const AddTokenText = styled(Text)`
  ${fontStyles.medium};
`;

const ProgressContent = styled.View`
  flex-direction: row;
  align-items: center;
`;

const Button = styled.TouchableOpacity``;

const EmptyStateWrapper = styled.View`
  flex: 1;
  align-items: center;
`;
