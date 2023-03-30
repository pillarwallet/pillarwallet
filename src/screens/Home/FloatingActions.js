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
import { isEmpty } from 'lodash';
import { useTranslationWithPrefix } from 'translations/translate';
import { Platform } from 'react-native';
import { useDispatch } from 'react-redux';

// Components
import FloatingButtons from 'components/FloatingButtons';
import Modal from 'components/Modal';
import ReceiveModal from 'screens/Asset/ReceiveModal';
import Tooltip from 'components/Tooltip';

// Constants
import {
  CONNECT_FLOW,
  BRIDGE_FLOW,
  SEND_TOKEN_FROM_HOME_FLOW,
  RECEIVE_TOKENS_WARNING,
} from 'constants/navigationConstants';

// Utils
import { isArchanovaAccount } from 'utils/accounts';
import { sumRecord } from 'utils/bigNumber';
import { spacing } from 'utils/variables';

// Selectors
import {
  useRootSelector,
  activeAccountAddressSelector,
  useActiveAccount,
  useIsExchangeAvailable,
  viewedReceiveTokensWarningSelector,
} from 'selectors';
import { accountWalletBalancePerChainSelector } from 'selectors/totalBalances';
import { useArchanovaWalletStatus } from 'selectors/archanova';

// Actions
import { dismissSignInDeFiTooltipAction } from 'actions/appSettingsActions';

function FloatingActions() {
  const { t, tRoot } = useTranslationWithPrefix('home.actions');
  const navigation = useNavigation();
  const dispatch = useDispatch();

  const address = useRootSelector(activeAccountAddressSelector);
  const viewedReceiveTokensWarning = useRootSelector(viewedReceiveTokensWarningSelector);
  const { signInDeFiTooltipDismissed } = useRootSelector(({ appSettings }) => appSettings.data);
  const isExchangeAvailable = useIsExchangeAvailable();
  const [visibleTooltip, setVisibleTooltip] = React.useState(false);

  const { isSendEnabled, isExchangeEnabled } = useEnabledActions();

  const showReceiveModal = () => {
    Modal.open(() => <ReceiveModal address={address} />);
  };

  const onReceivePress = () => {
    if (viewedReceiveTokensWarning) {
      showReceiveModal();
    } else {
      navigation.navigate(RECEIVE_TOKENS_WARNING, {
        onContinue: showReceiveModal,
      });
    }
  };

  const items = [
    {
      title: t('receive'),
      iconName: 'qrcode',
      onPress: onReceivePress,
    },
    isExchangeAvailable && {
      title: t('swap'),
      iconName: 'exchange',
      onPress: () => navigation.navigate(BRIDGE_FLOW),
      disabled: !isExchangeEnabled,
    },
    {
      title: t('send'),
      iconName: 'send',
      onPress: () => navigation.navigate(SEND_TOKEN_FROM_HOME_FLOW),
      disabled: !isSendEnabled,
    },
    {
      title: t('connect'),
      iconName: 'wallet-connect',
      onPress: () => onPressButton(),
    },
  ];

  React.useEffect(() => {
    if (!signInDeFiTooltipDismissed) {
      setTimeout(() => {
        setVisibleTooltip(true);
      }, 4000);
      setTimeout(() => {
        setVisibleTooltip(false);
      }, 15000);
    } else {
      setVisibleTooltip(false);
    }
  }, [signInDeFiTooltipDismissed]);

  const onPressButton = () => {
    navigation.navigate(CONNECT_FLOW);
    dispatch(dismissSignInDeFiTooltipAction());
  };

  return (
    <>
      <Tooltip
        isVisible={visibleTooltip}
        body={tRoot('tooltip.signInDeFi')}
        wrapperStyle={[wrapperStyle, { left: isExchangeAvailable ? spacing.largePlus * 5 : spacing.largePlus * 3 }]}
        onPress={onPressButton}
        positionOnBottom={false}
      />
      <FloatingButtons items={items} />
    </>
  );
}

const useEnabledActions = () => {
  const walletTotalBalance = sumRecord(useRootSelector(accountWalletBalancePerChainSelector));
  const activeAccount = useActiveAccount();
  const smartWalletState = useArchanovaWalletStatus();

  const isEnabled =
    walletTotalBalance.gt(0) && (!isArchanovaAccount(activeAccount) || isEmpty(smartWalletState.sendingBlockedMessage));

  return {
    isSendEnabled: true,
    isExchangeEnabled: isEnabled,
  };
};

const wrapperStyle = {
  zIndex: 9999,
  alignSelf: 'center',
  position: 'relative',
  width: 1,
  bottom: Platform.OS === 'ios' ? '14.5%' : '11%',
};

export default FloatingActions;
