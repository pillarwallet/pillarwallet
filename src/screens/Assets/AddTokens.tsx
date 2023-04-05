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
import { FlatList } from 'react-native';
import { useNavigation } from 'react-navigation-hooks';
import { useTranslation } from 'translations/translate';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Components
import { Container } from 'components/layout/Layout';
import HeaderBlock from 'components/HeaderBlock';
import ChainSelectorContent from 'components/ChainSelector/ChainSelectorContent';
import AddTokenListItem from 'components/lists/AddTokenListItem';
import EmptyStateParagraph from 'components/EmptyState/EmptyStateParagraph';
import Icon from 'components/core/Icon';
import FloatingButtons from 'components/FloatingButtons';

// Utils
import { filteredWithChain } from 'utils/etherspot';
import { getActiveAccount, isSmartWalletAccount } from 'utils/accounts';
import AddTokensLinks from 'utils/tokens/add-tokens.json';
import { isProdEnv } from 'utils/environment';

// Constants
import { TOKENS_WITH_TOGGLES, MANAGE_TOKEN_LISTS } from 'constants/navigationConstants';
import { CHAIN } from 'constants/chainConstants';

// Selector
import { useAccounts } from 'selectors';

export function AddTokens() {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const safeArea = useSafeAreaInsets();

  const accounts = useAccounts();
  const activeAccount = getActiveAccount(accounts);
  const isSmartWallet = isSmartWalletAccount(activeAccount);

  const isMainnet = isProdEnv();

  const [selectedChain, setSelectedChain] = React.useState(null);
  let tokensAccordingToChain = filteredWithChain(AddTokensLinks, !isSmartWallet ? CHAIN.ETHEREUM : selectedChain);

  if (selectedChain) {
    const multiChainTokens = AddTokensLinks.filter((token) => token.chain === 'multichain');
    tokensAccordingToChain = [...tokensAccordingToChain, ...multiChainTokens];
  }

  tokensAccordingToChain?.sort((tokenA, tokenB) =>
    isMainnet ? tokenB.mainnetTokens - tokenA.mainnetTokens : tokenB.testnetTokens - tokenA.testnetTokens,
  );

  const renderItem = (token: any) => {
    if (!token) return;
    return (
      <AddTokenListItem
        {...token}
        onPress={() => {
          navigation.navigate(TOKENS_WITH_TOGGLES, { tokenInfo: token });
        }}
      />
    );
  };

  function getItemKey(item) {
    const { name, chain } = item;
    return name + '__' + chain;
  }

  const buttons = [
    {
      title: t('label.custom_token_import'),
      customIcon: <Icon name="tokens" width={28} height={28} />,
      onPress: () => navigation.navigate(MANAGE_TOKEN_LISTS),
    },
  ];

  return (
    <Container>
      <HeaderBlock navigation={navigation} centerItems={[{ title: t('label.add_tokens') }]} noPaddingTop />

      <ChainSelectorContent selectedAssetChain={selectedChain} onSelectChain={setSelectedChain} />

      <FlatList
        key={'add_tokens_list'}
        data={tokensAccordingToChain}
        renderItem={({ item }) => renderItem(item)}
        keyExtractor={getItemKey}
        contentContainerStyle={{
          paddingBottom: safeArea.bottom + FloatingButtons.SCROLL_VIEW_BOTTOM_INSET,
        }}
        ListEmptyComponent={() => <EmptyStateParagraph wide title={t('label.nothingFound')} />}
      />

      <FloatingButtons items={buttons} />
    </Container>
  );
}

export default AddTokens;
