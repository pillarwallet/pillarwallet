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
import { useNavigation } from 'react-navigation-hooks';
import { useTranslationWithPrefix } from 'translations/translate';

// Components
import { Container } from 'components/layout/Layout';
import HeaderBlock from 'components/HeaderBlock';
import AssetSelectorContent from 'components/Modals/AssetSelectorModal/AssetSelectorContent';

// Constants
import { SEND_TOKEN_SELECT_AMOUNT, SEND_COLLECTIBLE_CONFIRM } from 'constants/navigationConstants';

// Selectors
import { useRootSelector } from 'selectors';
import { accountAssetsWithBalanceSelector } from 'selectors/assets';
import { accountCollectiblesSelector } from 'selectors/collectibles';

// Utils
import { getContactTitle } from 'utils/contacts';

// Types
import type { AssetOption } from 'models/Asset';
import type { ChainRecord } from 'models/Chain';
import type { Collectible } from 'models/Collectible';
import type { Contact } from 'models/Contact';

const SendFlowSelectAsset = () => {
  const { t } = useTranslationWithPrefix('sendFlow.selectAsset');
  const navigation = useNavigation();

  const contact: Contact = navigation.getParam('contact');

  const tokens = useRootSelector(accountAssetsWithBalanceSelector);
  const collectibles = flattenCollectibles(useRootSelector(accountCollectiblesSelector));

  const selectToken = (token: AssetOption) => {
    navigation.navigate(SEND_TOKEN_SELECT_AMOUNT, { token, contact });
  };

  const selectCollectible = (collectible: Collectible) => {
    navigation.navigate(SEND_COLLECTIBLE_CONFIRM, {
      assetData: collectible,
      receiver: contact.ethAddress,
      source: undefined,
      receiverEnsName: contact.ensName,
      chain: collectible.chain,
    });
  };

  const title = t('title', { recipient: getContactTitle(contact) });

  return (
    <Container>
      <HeaderBlock centerItems={[{ title }]} navigation={navigation} noPaddingTop />

      <AssetSelectorContent
        tokens={tokens}
        onSelectToken={selectToken}
        collectibles={collectibles}
        onSelectCollectible={selectCollectible}
      />
    </Container>
  );
};

export default SendFlowSelectAsset;

function flattenCollectibles(collectiblesPerChain: ChainRecord<Collectible[]>): Collectible[] {
  return Object.keys(collectiblesPerChain).flatMap((chain) => collectiblesPerChain[chain] ?? []);
}
