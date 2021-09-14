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
import { Keyboard } from 'react-native';
import { orderBy } from 'lodash';
import { useTranslationWithPrefix } from 'translations/translate';

// Components
import { Container } from 'components/layout/Layout';
import TabView from 'components/layout/TabView';
import HeaderBlock from 'components/HeaderBlock';
import SlideModal from 'components/Modals/SlideModal';

// Constants
import { ASSET_TYPES } from 'constants/assetsConstants';

// Utils
import { defaultSortAssetOptions } from 'utils/assets';
import { useThemeColors } from 'utils/themes';
import { useChainConfig } from 'utils/uiConfig';

// Types
import type { AssetOption } from 'models/Asset';
import type { Chain } from 'models/Chain';
import type { Collectible } from 'models/Collectible';

// Local
import TokenList from './TokenList';
import CollectibleList from './CollectibleList';

type Props = {|
  chain: Chain,
  tokens: AssetOption[],
  onSelectToken: (asset: AssetOption) => mixed,
  collectibles?: Collectible[],
  onSelectCollectible?: (collectible: Collectible) => mixed,
|};

const ChainAssetSelectorModal = ({ chain, tokens, onSelectToken, collectibles, onSelectCollectible }: Props) => {
  const { t } = useTranslationWithPrefix('chainAssetSelector');
  const chainConfig = useChainConfig(chain);

  const modalRef = React.useRef(null);

  const [tabIndex, setTabIndex] = React.useState(0);

  const colors = useThemeColors();

  const close = () => {
    Keyboard.dismiss();
    modalRef.current?.close();
  };

  const selectToken = (token: AssetOption) => {
    close();
    onSelectToken(token);
  };

  const selectCollectible = (collectible: Collectible) => {
    close();
    onSelectCollectible?.(collectible);
  };

  const tokenItems = getTokens(tokens, chain);
  const collectibleItems = getCollectibles(collectibles, chain);

  const renderTokenList = () => <TokenList items={tokenItems} onSelectItem={selectToken} />;

  const showCollectibles = !!collectibleItems.length;

  const tabItems = [
    {
      key: ASSET_TYPES.TOKEN,
      title: t('tabs.tokens'),
      render: renderTokenList,
    },
  ];

  if (showCollectibles) {
    tabItems.push({
      key: ASSET_TYPES.COLLECTIBLE,
      title: t('tabs.collectibles'),
      render: () => <CollectibleList items={collectibleItems} onSelectItem={selectCollectible} />,
    });
  }

  const title = t('title', { chain: chainConfig.titleShort });

  return (
    <SlideModal ref={modalRef} fullScreen noSwipeToDismiss noClose backgroundColor={colors.basic050} noTopPadding>
      <Container>
        <HeaderBlock leftItems={[{ close: true }]} centerItems={[{ title }]} onClose={close} noPaddingTop />

        {showCollectibles && (
          <TabView items={tabItems} tabIndex={tabIndex} onTabIndexChange={setTabIndex} scrollEnabled={false} />
        )}

        {!showCollectibles && renderTokenList()}
      </Container>
    </SlideModal>
  );
};

export default ChainAssetSelectorModal;

const getTokens = (tokens: AssetOption[], chain: Chain): AssetOption[] => {
  const chainTokens = tokens.filter((token) => token.chain === chain);
  return defaultSortAssetOptions(chainTokens);
};

const getCollectibles = (collectibles: Collectible[] = [], chain: Chain): Collectible[] => {
  const chainCollectibles = collectibles.filter((collectible) => collectible.chain === chain);
  return orderBy(chainCollectibles, [(option: Collectible) => option.name?.trim().toLowerCase()], ['asc']);
};
