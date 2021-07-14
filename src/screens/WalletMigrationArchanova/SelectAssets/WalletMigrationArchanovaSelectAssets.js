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
import { BigNumber } from 'bignumber.js';
import { isEmpty } from 'lodash';

// Components
import { Container, Footer } from 'components/modern/Layout';
import Button from 'components/modern/Button';
import HeaderBlock from 'components/HeaderBlock';

// Constants
import { CHAIN } from 'constants/chainConstants';
import { WALLET_MIGRATION_CONFIRM } from 'constants/navigationConstants';

// Selectors
import { useRootSelector, useChainSupportedAssets, useChainRates, useFiatCurrency } from 'selectors';
import { achanovaAccountSelector } from 'selectors/accounts';
import { assetsBalancesPerAccountSelector } from 'selectors/balances';
import { collectiblesPerAccountSelector } from 'selectors/collectibles';

// Utils
import { buildWalletAssetBalanceInfoList } from 'utils/balances';
import { recordWithRemovedKey } from 'utils/object';

// Types
import type { WalletAssetBalanceInfo } from 'models/Balances';
import type {
  TokensToMigrateByAddress,
  CollectiblesToMigrateByAddress,
} from 'models/WalletMigrationArchanova';

// Local
import WalletSummary from './WalletSummary';
import AssetList from './AssetList';

const WalletMigrationArchanovaSelectAssets = () => {
  const { t, tRoot } = useTranslationWithPrefix('walletMigrationArchanova.selectAssets');
  const navigation = useNavigation();

  const archanovaAccount = useRootSelector(achanovaAccountSelector);
  const balancesPerAccount = useRootSelector(assetsBalancesPerAccountSelector);
  const collectiblesPerAccount = useRootSelector(collectiblesPerAccountSelector);
  const ethereumSupportedAssets = useChainSupportedAssets(CHAIN.ETHEREUM);
  const rates = useChainRates(CHAIN.ETHEREUM);
  const currency = useFiatCurrency();

  const [tokensToMigrate, setTokensToMigrate] = React.useState<TokensToMigrateByAddress>({});
  const [collectiblesToMigrate, setCollectiblesToMigrate] = React.useState<CollectiblesToMigrateByAddress>({});

  const archanovaAccountId = archanovaAccount?.id ?? '';
  const tokens = buildWalletAssetBalanceInfoList(
    balancesPerAccount[archanovaAccountId]?.ethereum?.wallet,
    ethereumSupportedAssets,
    rates,
    currency,
  );
  const collectibles = collectiblesPerAccount[archanovaAccountId]?.ethereum ?? [];

  const handleToggleToken = (address: string, balance: BigNumber) => {
    if (tokensToMigrate[address]) {
      setTokensToMigrate(recordWithRemovedKey(tokensToMigrate, address));
    } else {
      setTokensToMigrate({ ...tokensToMigrate, [address]: { address, balance } });
    }
  };

  const handleToggleCollectible = (address: string) => {
    if (collectiblesToMigrate[address]) {
      setCollectiblesToMigrate(recordWithRemovedKey(collectiblesToMigrate, address));
    } else {
      setCollectiblesToMigrate({ ...collectiblesToMigrate, [address]: { address } });
    }
  };

  const navigateToReview = () => {
    navigation.navigate(WALLET_MIGRATION_CONFIRM, {
      tokens: tokensToMigrate,
      collectibles: collectiblesToMigrate,
    });
  };

  const walletAddress = archanovaAccount?.id ?? '';
  const totalValueInFiat = getTotaValueInFiat(tokens, tokensToMigrate);
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

const getTotaValueInFiat = (tokens: WalletAssetBalanceInfo[], tokensToMigrate: TokensToMigrateByAddress) => {
  let result = 0;

  tokens.forEach((tokenBalance) => {
    if (tokensToMigrate[tokenBalance.asset.address]) {
      // TODO handle partial amount
      result += tokenBalance.balanceInFiat;
    }
  });

  return result;
};
