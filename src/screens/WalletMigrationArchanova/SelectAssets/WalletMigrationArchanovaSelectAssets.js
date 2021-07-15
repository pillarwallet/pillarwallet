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
import { useDispatch } from 'react-redux';
import { useTranslationWithPrefix } from 'translations/translate';
import { BigNumber } from 'bignumber.js';
import { isEmpty } from 'lodash';

// Components
import { Container, Footer } from 'components/modern/Layout';
import Button from 'components/modern/Button';
import HeaderBlock from 'components/HeaderBlock';

// Constants
import { WALLET_MIGRATION_REVIEW } from 'constants/navigationConstants';

// Selectors
import { useRootSelector } from 'selectors';
import { achanovaAccountSelector } from 'selectors/accounts';

// Actions
import { setTokensToMigrateAction, setCollectiblesToMigrateAction } from 'actions/walletMigrationArchanovaActions';

// Utils
import { recordWithRemovedKey } from 'utils/object';

// Local
import { useTokenItems, useCollectibles, useTotalValueInFiat } from '../utils';
import WalletSummary from './WalletSummary';
import AssetList from './AssetList';

const WalletMigrationArchanovaSelectAssets = () => {
  const { t, tRoot } = useTranslationWithPrefix('walletMigrationArchanova.selectAssets');
  const navigation = useNavigation();

  const dispatch = useDispatch();
  const archanovaAccount = useRootSelector(achanovaAccountSelector);
  const archanovaAccountId = archanovaAccount?.id ?? '';

  const tokensToMigrate = useRootSelector(root => root.walletMigrationArchanova.tokensToMigrate);
  const collectiblesToMigrate = useRootSelector((root) => root.walletMigrationArchanova.collectiblesToMigrate);

  const tokens = useTokenItems(archanovaAccountId);
  const collectibles = useCollectibles(archanovaAccountId);
  const totalValueInFiat = useTotalValueInFiat(tokensToMigrate);

  const handleToggleToken = (address: string, balance: BigNumber) => {
    if (tokensToMigrate[address]) {
      dispatch(setTokensToMigrateAction(recordWithRemovedKey(tokensToMigrate, address)));
    } else {
      dispatch(setTokensToMigrateAction({ ...tokensToMigrate, [address]: { address, balance } }));
    }
  };

  const handleToggleCollectible = (address: string) => {
    if (collectiblesToMigrate[address]) {
      dispatch(setCollectiblesToMigrateAction(recordWithRemovedKey(collectiblesToMigrate, address)));
    } else {
      dispatch(setCollectiblesToMigrateAction({ ...collectiblesToMigrate, [address]: { address } }));
    }
  };

  const navigateToReview = () => {
    navigation.navigate(WALLET_MIGRATION_REVIEW);
  };

  const walletAddress = archanovaAccount?.id ?? '';
  const showNextButton = !isEmpty(tokensToMigrate) || !isEmpty(collectiblesToMigrate);

  return (
    <Container>
      <HeaderBlock centerItems={[{ title: t('title') }]} navigation={navigation} noPaddingTop />

      <WalletSummary totalValueInFiat={totalValueInFiat} address={walletAddress} />

      <AssetList
        tokens={tokens}
        tokensToMigrate={tokensToMigrate}
        onToggleToken={handleToggleToken}
        collectibles={collectibles}
        collectiblesToMigrate={collectiblesToMigrate}
        onToggleCollectible={handleToggleCollectible}
      />

      {showNextButton && (
        <Footer>
          <Button title={tRoot('button.next')} onPress={navigateToReview} />
        </Footer>
      )}
    </Container>
  );
};

export default WalletMigrationArchanovaSelectAssets;
