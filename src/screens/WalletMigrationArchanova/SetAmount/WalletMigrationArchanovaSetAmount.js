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
import { InteractionManager } from 'react-native';
import { useNavigation } from 'react-navigation-hooks';
import { useDispatch } from 'react-redux';
import { BigNumber } from 'bignumber.js';
import { useTranslationWithPrefix } from 'translations/translate';

// Components
import { Container, Content, Footer } from 'components/layout/Layout';
import Button from 'components/core/Button';
import HeaderBlock from 'components/HeaderBlock';
import TokenValueInput from 'components/inputs/TokenValueInput';
import TokenBalanceAccessory from 'components/inputs/TokenValueInput/TokenBalanceAccessory';

// Constants
import { CHAIN } from 'constants/chainConstants';

// Selectors
import { useSupportedAsset } from 'selectors/assets';
import { useWalletAssetBalance } from 'selectors/balances';

// Actions
import { switchToArchanovaAccountIfNeededAction } from 'actions/accountsActions';
import { setTokenToMigrateAction } from 'actions/walletMigrationArchanovaActions';

// Utils
import { wrapBigNumberOrNil } from 'utils/bigNumber';
import { isValidValueForTransfer, isLessThanOrEqualToBalance } from 'utils/transactions';

function WalletMigrationArchanovaSetAmount() {
  const { t, tRoot } = useTranslationWithPrefix('walletMigrationArchanova.setAmount');
  const navigation = useNavigation();
  const dispatch = useDispatch();

  const inputRef = React.useRef();

  const address: string = navigation.getParam('address');
  const initialValue = wrapBigNumberOrNil(navigation.getParam('value'));

  const asset = useSupportedAsset(CHAIN.ETHEREUM, address);
  const balance = useWalletAssetBalance(CHAIN.ETHEREUM, address);

  const [value, setValue] = React.useState<?BigNumber>(initialValue);

  // Force active account to be archanova
  React.useEffect(() => {
    dispatch(switchToArchanovaAccountIfNeededAction());
  }, [dispatch]);

  React.useEffect(() => {
    const promise = InteractionManager.runAfterInteractions(() => inputRef.current?.focus());
    return () => { promise.cancel(); };
  }, []);

  const isValid = isValidValueForTransfer(value, balance);
  const hasEnoughBalance = isLessThanOrEqualToBalance(value, balance);

  const handleUseMax = () => {
    setValue(balance);
  };

  const handleSubmit = () => {
    if (!asset || !value || !isValid) return;

    dispatch(setTokenToMigrateAction(address, value.toFixed(), asset.decimals));
    navigation.goBack(null);
  };

  const buttonTitle = hasEnoughBalance
    ? tRoot('button.confirm')
    : tRoot('label.notEnoughBalance', { symbol: asset?.symbol });

  return (
    <Container>
      <HeaderBlock centerItems={[{ title: t('title') }]} navigation={navigation} noPaddingTop />

      <Content>
        {!!asset && (
          <>
            <TokenValueInput
              // $FlowFixMe: ref type inference
              ref={inputRef}
              value={value}
              onValueChange={setValue}
              maxValue={balance}
              referenceValue={balance}
              chain={CHAIN.ETHEREUM}
              asset={asset}
            />

            <TokenBalanceAccessory balance={balance} onUseMax={handleUseMax} chain={CHAIN.ETHEREUM} asset={asset} />
          </>
        )}
      </Content>

      <Footer>
        <Button title={buttonTitle} onPress={handleSubmit} disabled={!isValid} />
      </Footer>
    </Container>
  );
}

export default WalletMigrationArchanovaSetAmount;
