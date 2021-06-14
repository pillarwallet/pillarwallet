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
import { useTranslation } from 'translations/translate';
import { NavigationActions } from 'react-navigation';

// Components
import BottomModal from 'components/modern/BottomModal';
import Toast from 'components/Toast';

// Constants
import { ASSETS, WALLETCONNECT_PIN_CONFIRM_SCREEN } from 'constants/navigationConstants';
import { REQUEST_TYPE } from 'constants/walletConnectConstants';

// Hooks
import useWalletConnect from 'hooks/useWalletConnect';

// Utils
import { getWalletConnectCallRequestType, formatRequestType } from 'utils/walletConnect';
import { chainFromChainId } from 'utils/chains';
import { isEtherspotAccountDeployed } from 'utils/etherspot';

// Selectors
import { useActiveAccount } from 'selectors';

// Types
import type { WalletConnectCallRequest } from 'models/WalletConnect';
import type { TransactionPayload } from 'models/Transaction';

// Local
import SignatureRequestContent from './SignatureRequestContent';
import TransactionRequestContent from './TransactionRequestContent';
import UnsupportedRequestContent from './UnsupportedRequestContent';

type Props = {|
  request: WalletConnectCallRequest,
|};

function WalletConnectCallRequestModal({ request }: Props) {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const activeAccount = useActiveAccount();

  const ref = React.useRef();

  const { rejectCallRequest } = useWalletConnect();

  const type = getWalletConnectCallRequestType(request);
  const title = formatRequestType(type);

  const handleConfirm = (transactionPayload?: TransactionPayload) => {
    const chain = chainFromChainId[request.chainId];
    if (!chain) {
      Toast.show({
        message: t('error.walletConnect.cannotDetermineEthereumChain'),
        emoji: 'eyes',
        supportLink: true,
      });
      return;
    }

    // account must to be deployed for signature requests
    const isAccountDeployed = isEtherspotAccountDeployed(activeAccount, chain);
    if (type === REQUEST_TYPE.MESSAGE && !isAccountDeployed) {
      Toast.show({
        message: t('toast.walletConnectSmartWalletNotActive'),
        emoji: 'point_up',
        link: t('label.activateSmartWallet'),
        autoClose: false,
        // contains sw activation card
        onLinkPress: () => navigation.navigate(NavigationActions.navigate({ routeName: ASSETS })),
      });
      return;
    }

    if (!request) {
      Toast.show({
        message: t('toast.walletConnectCallRequestApproveFailed'),
        emoji: 'woman-shrugging',
        supportLink: true,
      });

      ref.current?.close();
      return;
    }

    ref.current?.close();
    navigation.navigate(WALLETCONNECT_PIN_CONFIRM_SCREEN, { callRequest: request, transactionPayload });
  };

  const handleReject = () => {
    if (!request) {
      Toast.show({
        message: t('toast.walletConnectCallRequestRejectFailed'),
        emoji: 'woman-shrugging',
        supportLink: true,
      });

      ref.current?.close();
      return;
    }

    ref.current?.close();
    rejectCallRequest(request);
  };

  return (
    <BottomModal ref={ref} title={title}>
      {type === REQUEST_TYPE.MESSAGE && (
        <SignatureRequestContent request={request} onConfirm={handleConfirm} onReject={handleReject} />
      )}
      {type === REQUEST_TYPE.TRANSACTION && (
        <TransactionRequestContent request={request} onConfirm={handleConfirm} onReject={handleReject} />
      )}
      {type === REQUEST_TYPE.UNSUPPORTED && <UnsupportedRequestContent request={request} onReject={handleReject} />}
    </BottomModal>
  );
}

export default WalletConnectCallRequestModal;
