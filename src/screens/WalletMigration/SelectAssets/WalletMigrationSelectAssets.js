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
import { Container } from 'components/modern/Layout';
import HeaderBlock from 'components/HeaderBlock';

// Constants
import { CHAIN } from 'constants/chainConstants';

// Selectors
import { useRootSelector, useChainSupportedAssets, useChainRates, useFiatCurrency } from 'selectors';
import { achanovaAccountSelector } from 'selectors/archanova';
import { assetsBalancesPerAccountSelector } from 'selectors/balances';
import { collectiblesPerAccountSelector } from 'selectors/collectibles';

// Utils
import { buildWalletAssetBalanceInfoList } from 'utils/balances';

// Types
import type { AssetBalanceRecord } from 'models/WalletMigrationArchanova';

// Local
import WalletSummary from './WalletSummary';
import AssetList from './AssetList';

const WalletMigrationSelectAssets = () => {
  const { t } = useTranslationWithPrefix('walletMigration.etherspot.selectAssets');
  const navigation = useNavigation();

  const archanovaAccount = useRootSelector(achanovaAccountSelector);
  const balancesPerAccount = useRootSelector(assetsBalancesPerAccountSelector);
  const collectiblesPerAccount = useRootSelector(collectiblesPerAccountSelector);
  const ethereumSupportedAssets = useChainSupportedAssets(CHAIN.ETHEREUM);
  const rates = useChainRates(CHAIN.ETHEREUM);
  const currency = useFiatCurrency();

  const [selectedAssets, setSelectedAssets] = React.useState<AssetBalanceRecord>({});

  const archanovaAccountId = archanovaAccount?.id ?? '';
  const assets = buildWalletAssetBalanceInfoList(
    balancesPerAccount[archanovaAccountId]?.ethereum?.wallet,
    ethereumSupportedAssets,
    rates,
    currency,
  );
  const collectibles = collectiblesPerAccount[archanovaAccountId]?.ethereum ?? [];

  const walletAddress = archanovaAccount?.id ?? '';
  const totalValue = 0;

  const handleSelectedAssetsChange = (value: AssetBalanceRecord) => {
    console.log("AAA", value);
    setSelectedAssets(value);
  };

  return (
    <Container>
      <HeaderBlock centerItems={[{ title: t('title') }]} navigation={navigation} noPaddingTop />

      <AssetList
        ListHeaderComponent={<WalletSummary address={walletAddress} totalValueInFiat={totalValue} />}
        assets={assets}
        collectibles={collectibles}
        selectedAssets={selectedAssets}
        onSelectedAssetsChange={handleSelectedAssetsChange}
      />
    </Container>
  );
};

export default WalletMigrationSelectAssets;
