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
import {
  WALLET_MIGRATION_ARCHANOVA_REVIEW,
  WALLET_MIGRATION_ARCHANOVA_SET_AMOUNT,
} from 'constants/navigationConstants';

// Selectors
import { useRootSelector } from 'selectors';
import { archanovaAccountSelector } from 'selectors/accounts';
import { archanovaCollectiblesSelector } from 'selectors/archanova';

// Actions
import { switchToArchanovaAccountIfNeededAction } from 'actions/accountsActions';
import {
  setTokenToMigrateAction,
  removeTokenToMigrateAction,
  setCollectibleToMigrateAction,
  removeCollectibleToMigrateAction,
} from 'actions/walletMigrationArchanovaActions';

// Utils
import { valueForAddress } from 'utils/common';
import { areCollectiblesEqual } from 'utils/collectibles';

// Types
import type { CollectibleId } from 'models/Collectible';

// Local
import WalletSummary from './WalletSummary';
import AssetList from './AssetList';
import { useTokensWithBalances, useTotalMigrationValueInFiat } from './utils';


const WalletMigrationArchanovaSelectAssets = () => {
  const { t } = useTranslationWithPrefix('walletMigrationArchanova.selectAssets');
  const navigation = useNavigation();

  const dispatch = useDispatch();
  const archanovaAccount = useRootSelector(archanovaAccountSelector);

  const tokensToMigrate = useRootSelector(root => root.walletMigrationArchanova.tokensToMigrate);
  const collectiblesToMigrate = useRootSelector((root) => root.walletMigrationArchanova.collectiblesToMigrate);

  const tokens = useTokensWithBalances();
  const collectibles = useRootSelector(archanovaCollectiblesSelector);
  const totalValueInFiat = useTotalMigrationValueInFiat();

  // Force active account to be archanova
  React.useEffect(() => {
    dispatch(switchToArchanovaAccountIfNeededAction());
  }, [dispatch]);

  const handleToggleToken = (address: string, balance: BigNumber, decimals: number) => {
    if (valueForAddress(tokensToMigrate, address)) {
      dispatch(removeTokenToMigrateAction(address));
    } else {
      dispatch(setTokenToMigrateAction(address, balance.toFixed(), decimals));
    }
  };

  const handleToggleCollectible = (id: CollectibleId) => {
    const isIncluded = collectiblesToMigrate.some((collectibleId) => areCollectiblesEqual(collectibleId, id));
    if (isIncluded) {
      dispatch(removeCollectibleToMigrateAction(id));
    } else {
      dispatch(setCollectibleToMigrateAction(id));
    }
  };

  const handleTokenBalancePress = (address: string, balance: BigNumber) => {
    navigation.navigate(WALLET_MIGRATION_ARCHANOVA_SET_AMOUNT, { address, balance: balance.toFixed() });
  };

  const navigateToReview = () => {
    navigation.navigate(WALLET_MIGRATION_ARCHANOVA_REVIEW);
  };

  const walletAddress = archanovaAccount?.id ?? '';
  const allowNextAction = !isEmpty(tokensToMigrate) || !isEmpty(collectiblesToMigrate);

  return (
    <Container>
      <HeaderBlock centerItems={[{ title: t('title') }]} navigation={navigation} noPaddingTop />

      <WalletSummary totalValueInFiat={totalValueInFiat} address={walletAddress} />

      <AssetList
        tokens={tokens}
        tokensToMigrate={tokensToMigrate}
        onPressToken={handleToggleToken}
        onPressTokenBalance={handleTokenBalancePress}
        collectibles={collectibles}
        collectiblesToMigrate={collectiblesToMigrate}
        onPressCollectible={handleToggleCollectible}
      />

      <Footer>
        <Button title={t('review')} onPress={navigateToReview} disabled={!allowNextAction} />
      </Footer>
    </Container>
  );
};

export default WalletMigrationArchanovaSelectAssets;