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
import { Container, Content, Footer } from 'components/layout/Layout';
import Button from 'components/core/Button';
import CheckAuth from 'components/CheckAuth';
import HeaderBlock from 'components/layout/HeaderBlock';

// Constants
import { WALLET_MIGRATION_ARCHANOVA_PIN_CONFIRM } from 'constants/navigationConstants';

// Selectors
import { useRootSelector, useAccounts } from 'selectors';
import { useBiometricsSelector } from 'selectors/appSettings';
import { accountAssetsBalancesSelector } from 'selectors/balances';

// Utils
import { findFirstEtherspotAccount, findFirstArchanovaAccount } from 'utils/accounts';
import { reportErrorLog } from 'utils/common';
import { estimateMigrationTransactions } from 'utils/walletMigrationArchanova';

// Local
import MigrationSummary from './MigrationSummary';
import { useAssetItemsAfterFee, hasEnoughEthBalance } from './utils';

function WalletMigrationArchanovaReview() {
  const { t, tRoot } = useTranslationWithPrefix('walletMigrationArchanova.review');
  const navigation = useNavigation();

  const accounts = useAccounts();
  const etherspotAccount = findFirstEtherspotAccount(accounts);
  const archanovaAccount = findFirstArchanovaAccount(accounts);

  const walletBalances = useRootSelector(accountAssetsBalancesSelector)?.ethereum?.wallet;
  const tokensToMigrate = useRootSelector((root) => root.walletMigrationArchanova.tokensToMigrate);
  const collectiblesToMigrate = useRootSelector((root) => root.walletMigrationArchanova.collectiblesToMigrate);
  const useBiometrics = useBiometricsSelector();

  const [showCheckAuth, setShowCheckAuth] = React.useState(false);
  const [isEstimating, setIsEstimating] = React.useState(false);
  const [fee, setFee] = React.useState(null);

  const items = useAssetItemsAfterFee(fee);

  const handlePinValid = async (pin: string, wallet: any) => {
    setShowCheckAuth(false);
    setIsEstimating(true);

    try {
      const feeInEth = await estimateMigrationTransactions(wallet, accounts, tokensToMigrate, collectiblesToMigrate);
      setFee(feeInEth);
    } catch (error) {
      reportErrorLog('WalletMigrationArchanovaReview: failed to estimate transaction', {
        error,
        tokensToMigrate,
        collectiblesToMigrate,
      });
    } finally {
      setIsEstimating(false);
    }
  };

  if (showCheckAuth) {
    return (
      <CheckAuth
        enforcePin={!useBiometrics}
        onPinValid={handlePinValid}
        headerProps={{ onBack: () => navigation.goBack() }}
        isChecking={isEstimating}
        customCheckingMessage={t('estimatingTransactions')}
      />
    );
  }

  const handleSubmit = () => {
    navigation.navigate(WALLET_MIGRATION_ARCHANOVA_PIN_CONFIRM);
  };

  const hasEnoughGas = hasEnoughEthBalance(walletBalances, fee);

  return (
    <Container>
      <HeaderBlock centerItems={[{ title: t('title') }]} navigation={navigation} noPaddingTop />

      <Content>
        <MigrationSummary
          etherspotAccount={etherspotAccount}
          archanovaAccount={archanovaAccount}
          items={items}
          feeInEth={fee}
        />
      </Content>

      <Footer>
        {!fee && (
          <Button
            title={isEstimating ? t('calculatingFee') : t('calculateFee')}
            onPress={() => setShowCheckAuth(true)}
            disabled={isEstimating}
          />
        )}
        {fee && (
          <Button
            title={hasEnoughGas ? t('submit') : tRoot('label.notEnoughGas')}
            onPress={handleSubmit}
            disabled={!hasEnoughGas}
          />
        )}
      </Footer>
    </Container>
  );
}

export default WalletMigrationArchanovaReview;
