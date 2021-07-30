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
import CheckAuth from 'components/CheckAuth';

// Constants
import { SEND_TOKEN_TRANSACTION } from 'constants/navigationConstants';

// Selectors
import { useRootSelector, useAccounts } from 'selectors';
import { accountAssetsBalancesSelector } from 'selectors/balances';

// Actions
import {
  addMigrationTransactionToHistoryAction,
  resetAssetsToMigrateAction,
} from 'actions/walletMigrationArchanovaActions';

// Utils
import { reportErrorLog } from 'utils/common';
import { submitMigrationTransactions } from 'utils/walletMigrationArchanova';


function WalletMigrationArchanovaPinConfirm() {
  const { t } = useTranslationWithPrefix('walletMigrationArchanova.pinConfirm');
  const navigation = useNavigation();
  const dispatch = useDispatch();

  const accounts = useAccounts();
  const walletBalances = useRootSelector(accountAssetsBalancesSelector)?.ethereum?.wallet;
  const tokensToMigrate = useRootSelector((root) => root.walletMigrationArchanova.tokensToMigrate);
  const collectiblesToMigrate = useRootSelector((root) => root.walletMigrationArchanova.collectiblesToMigrate);
  const useBiometrics = useRootSelector((root) => root.appSettings.data.useBiometrics);

  const [isSubmiting, setIsSubmiting] = React.useState(false);

  const handlePinValid = async (pin: string, wallet: any) => {
    setIsSubmiting(true);

    try {
      const hash = await submitMigrationTransactions(
        wallet,
        accounts,
        walletBalances,
        tokensToMigrate,
        collectiblesToMigrate,
      );
      dispatch(addMigrationTransactionToHistoryAction(hash));
      dispatch(resetAssetsToMigrateAction());
      navigation.navigate(SEND_TOKEN_TRANSACTION, { hash, isSuccess: true });
    } catch (error) {
      reportErrorLog('WalletMigrationArchanovaPinConfirm: submit transactions failed', {
        error,
        accounts,
        tokensToMigrate,
        collectiblesToMigrate,
      });
      navigation.navigate(SEND_TOKEN_TRANSACTION, { isSuccess: false });
    }
  };

  return (
    <CheckAuth
      enforcePin={!useBiometrics}
      onPinValid={handlePinValid}
      headerProps={{ onBack: () => navigation.goBack() }}
      isChecking={isSubmiting}
      customCheckingMessage={t('submittingTransactions')}
    />
  );
}

export default WalletMigrationArchanovaPinConfirm;
