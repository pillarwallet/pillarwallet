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

// Components
import { Container, Content, Footer } from 'components/modern/Layout';
import Button from 'components/modern/Button';
import HeaderBlock from 'components/HeaderBlock';
import ValueInput from 'components/ValueInput';

// Constants
import { CHAIN } from 'constants/chainConstants';

// Selectors
import { useRootSelector, useChainSupportedAssets, useChainRates, useFiatCurrency } from 'selectors';
import { accountAssetsBalancesSelector } from 'selectors/balances';

// Actions
import { switchToArchanovaAccountIfNeededAction } from 'actions/accountsActions';
import { setTokenToMigrateAction } from 'actions/walletMigrationArchanovaActions';

// Utils
import { findAssetByAddress, getAssetOption } from 'utils/assets';

// Types
import type { AssetOption } from 'models/Asset';


function WalletMigrationArchanovaSetAmount() {
  const { t, tRoot } = useTranslationWithPrefix('walletMigrationArchanova.setAmount');
  const navigation = useNavigation();
  const dispatch = useDispatch();

  const address: string = navigation.getParam('address');
  const initialBalance: string = navigation.getParam('balance');

  const assetOption = useAssetOption(address);

  const [balance, setBalance] = React.useState(initialBalance ?? '');
  const [isValid, setIsValid] = React.useState(true);

  // Force active account to be archanova
  React.useEffect(() => {
    dispatch(switchToArchanovaAccountIfNeededAction());
  }, [dispatch]);

  const handleSubmit = () => {
    if (!assetOption || !isValid) return;

    dispatch(setTokenToMigrateAction(address, balance, assetOption.decimals));
    navigation.goBack(null);
  };

  return (
    <Container>
      <HeaderBlock centerItems={[{ title: t('title') }]} navigation={navigation} noPaddingTop />

      <Content>
        {assetOption != null && (
          <ValueInput
            value={balance}
            onValueChange={setBalance}
            onFormValid={setIsValid}
            assetData={assetOption}
            customAssets={[]}
            autoFocus={false}
          />
        )}
      </Content>

      <Footer>
        <Button title={tRoot('button.confirm')} onPress={handleSubmit} disabled={!isValid} />
      </Footer>
    </Container>
  );
}

export default WalletMigrationArchanovaSetAmount;

const useAssetOption = (assetAddress: string): ?AssetOption => {
  const walletBalances = useRootSelector(accountAssetsBalancesSelector)?.ethereum?.wallet;
  const supportedAssets = useChainSupportedAssets(CHAIN.ETHEREUM);
  const rates = useChainRates(CHAIN.ETHEREUM);
  const currency = useFiatCurrency();

  const asset = findAssetByAddress(supportedAssets, assetAddress);
  if (!asset) return null;

  const assetOption = getAssetOption(asset, walletBalances, rates, currency);
  return assetOption;
};
