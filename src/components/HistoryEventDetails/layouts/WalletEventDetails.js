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

// Components
import { Spacing } from 'components/Layout';
import Button from 'components/modern/Button';
import Modal from 'components/Modal';
import ReceiveModal from 'screens/Asset/ReceiveModal';
import SWActivationModal from 'components/SWActivationModal';
import Text from 'components/modern/Text';

// Selectors
import { useRootSelector } from 'selectors';
import { isSmartWalletActivatedSelector } from 'selectors/smartWallet';

// Utils
import { spacing } from 'utils/variables';
import { getSmartWalletAddress } from 'utils/accounts';

// Types
import type { WalletEvent } from 'models/History';

// Local
import BaseEventDetails from './BaseEventDetails';

type Props = {|
  event: WalletEvent,
|};

function WalletEventDetails({ event }: Props) {
  const { t } = useTranslation();
  const navigation = useNavigation();

  const accounts = useRootSelector(root => root.accounts.data);
  const isActivated = useRootSelector(isSmartWalletActivatedSelector);

  const handleActivate = () => {
    Modal.open(() => <SWActivationModal navigation={navigation} />);
  };

  const handleTopUp = () => {
    const smartWalletAddress = getSmartWalletAddress(accounts);
    if (!smartWalletAddress) return;

    Modal.open(() => <ReceiveModal address={smartWalletAddress} />);
  };

  return (
    <BaseEventDetails date={event.date} title={event.title} iconName="wallet">
      <Text variant="large">{event.event}</Text>
      <Spacing h={spacing.extraLarge} />

      {isActivated ? (
        <Button variant="secondary" title={t('button.topUp')} onPress={handleTopUp} />
      ) : (
        <Button variant="secondary" title={t('button.activate')} onPress={handleActivate} />
      )}
    </BaseEventDetails>
  );
}

export default WalletEventDetails;
