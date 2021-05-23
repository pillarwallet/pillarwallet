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
import { useDispatch } from 'react-redux';
import { useTranslation } from 'translations/translate';

// Components
import { Row, Spacing } from 'components/modern/Layout';
import Button from 'components/modern/Button';
import FeeLabel from 'components/modern/FeeLabel';
import Modal from 'components/Modal';
import ReceiveModal from 'screens/Asset/ReceiveModal';
import Text from 'components/modern/Text';
import Toast from 'components/Toast';
import TransactionStatusIcon from 'components/modern/TransactionStatusIcon';
import TransactionStatusText from 'components/modern/TransactionStatusText';

// Actions
import { goToInvitationFlowAction } from 'actions/referralsActions';
import { viewTransactionOnBlockchainAction } from 'actions/historyActions';

// Selectors
import { useSmartWalletAccounts } from 'selectors';

// Utils
import { getActiveAccountAddress } from 'utils/accounts';
import { useThemeColors } from 'utils/themes';
import { spacing } from 'utils/variables';

// Types
import { EVENT_TYPE, type WalletEvent } from 'models/History';

// Local
import BaseEventDetails from './BaseEventDetails';

type Props = {|
  event: WalletEvent,
|};

function WalletEventDetails({ event }: Props) {
  const { t } = useTranslation();

  const accounts = useSmartWalletAccounts();
  const dispatch = useDispatch();

  const colors = useThemeColors();

  const openTopUp = () => {
    const activeAccountAddress = getActiveAccountAddress(accounts);
    if (!activeAccountAddress) {
      Toast.show({
        message: t('toast.cannotGetWalletAddress'),
        emoji: 'hushed',
        supportLink: true,
        autoClose: false,
      });
      return;
    }

    Modal.open(() => <ReceiveModal address={activeAccountAddress} />);
  };

  const navigateToInviteFriends = () => dispatch(goToInvitationFlowAction());

  const viewOnBlockchain = () => dispatch(viewTransactionOnBlockchainAction(event));

  if (event.type === EVENT_TYPE.WALLET_CREATED) {
    return (
      <BaseEventDetails date={event.date} title={t('label.wallet')} iconName="wallet">
        <Text variant="large">{t('label.created')}</Text>
        <Spacing h={spacing.extraLarge} />

        <Button variant="secondary" title={t('button.topUp')} onPress={openTopUp} />

        <Spacing h={spacing.small} />
        <Button variant="text" title={t('button.inviteFriends')} onPress={navigateToInviteFriends} />
      </BaseEventDetails>
    );
  }

  if (event.type === EVENT_TYPE.WALLET_ACTIVATED) {
    return (
      <BaseEventDetails date={event.date} title={t('label.wallet')} iconName="wallet">
        <Row>
          <Text variant="large">{t('label.activated')}</Text>
          <TransactionStatusIcon status={event.status} size={24} />
        </Row>
        <TransactionStatusText status={event.status} color={colors.basic030} variant="medium" />
        <Spacing h={spacing.extraLarge} />

        {!!event?.fee && <FeeLabel value={event.fee.value} symbol={event.fee.symbol} mode="actual" />}
        <Spacing h={spacing.mediumLarge} />

        <Button variant="secondary" title={t('button.viewOnBlockchain')} onPress={viewOnBlockchain} />
        <Spacing h={spacing.small} />
        <Button variant="text" title={t('button.inviteFriends')} onPress={navigateToInviteFriends} />
      </BaseEventDetails>
    );
  }

  return null;
}

export default WalletEventDetails;
