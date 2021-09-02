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
import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import { Wallet } from 'ethers';
import t from 'translations/translate';
import type { NavigationScreenProp } from 'react-navigation';

// actions
import { createKeyBasedAssetsToTransferTransactionsAction } from 'actions/keyBasedAssetTransferActions';

// components
import CheckAuth from 'components/CheckAuth';

// constants
import { SEND_TOKEN_TRANSACTION } from 'constants/navigationConstants';

// types
import type { Dispatch, RootReducerState } from 'reducers/rootReducer';


type Props = {
  navigation: NavigationScreenProp<*>,
  createKeyBasedAssetsToTransferTransactions: (wallet: Wallet) => void,
  useBiometrics: boolean,
  creatingTransactions: boolean,
};

const KeyBasedAssetTransferUnlock = ({
  createKeyBasedAssetsToTransferTransactions,
  navigation,
  useBiometrics,
  creatingTransactions,
}: Props) => {
  const [isPinValid, setIsPinValid] = useState(false);

  // will fire when creatingTransactions reset to false after pin was set as valid
  useEffect(() => {
    if (!creatingTransactions && isPinValid) {
      navigation.navigate(SEND_TOKEN_TRANSACTION, { isSuccess: true, transactionPayload: {} });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [creatingTransactions]);

  return (
    <CheckAuth
      onPinValid={(pin: string, wallet: Wallet) => {
        setIsPinValid(true);
        createKeyBasedAssetsToTransferTransactions(wallet);
      }}
      isChecking={creatingTransactions}
      customCheckingMessage={t('transactions.title.creatingTransactions')}
      headerProps={{ onBack: () => navigation.goBack() }}
      enforcePin={!useBiometrics}
    />
  );
};

const mapStateToProps = ({
  appSettings: { data: { useBiometrics } },
  keyBasedAssetTransfer: { creatingTransactions },
}: RootReducerState): $Shape<Props> => ({
  useBiometrics,
  creatingTransactions,
});

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  createKeyBasedAssetsToTransferTransactions: (wallet: Wallet) => dispatch(
    createKeyBasedAssetsToTransferTransactionsAction(wallet),
  ),
});

export default connect(mapStateToProps, mapDispatchToProps)(KeyBasedAssetTransferUnlock);
