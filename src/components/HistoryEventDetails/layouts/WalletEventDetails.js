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
import { Row, Spacing } from 'components/layout/Layout';
import Button from 'components/core/Button';
import FeeLabel from 'components/display/FeeLabel';
import Modal from 'components/Modal';
import ReceiveModal from 'screens/Asset/ReceiveModal';
import Text from 'components/core/Text';
import Toast from 'components/Toast';
import TransactionStatusIcon from 'components/display/TransactionStatusIcon';
import TransactionStatusText from 'components/display/TransactionStatusText';

// Actions
import { viewTransactionOnBlockchainAction } from 'actions/historyActions';

// Selectors
import {
  useAccounts,
  useActiveAccount,
} from 'selectors';

// Hooks
import { useDeploymentStatus } from 'hooks/deploymentStatus';

// Utils
import {
  getActiveAccountAddress,
  isKeyBasedAccount,
} from 'utils/accounts';
import { useThemeColors } from 'utils/themes';
import { spacing } from 'utils/variables';
import { useChainsConfig } from 'utils/uiConfig';

// Types
import { EVENT_TYPE, type WalletEvent } from 'models/History';
import type { Chain } from 'models/Chain';

// Local
import BaseEventDetails from './BaseEventDetails';

type Props = {|
  event: WalletEvent,
  chain: Chain,
|};

function WalletEventDetails({ event, chain }: Props) {
  const { t } = useTranslation();
  const accounts = useAccounts();
  const dispatch = useDispatch();
  const colors = useThemeColors();
  const chainsConfig = useChainsConfig();
  const activeAccount = useActiveAccount();
  const { isDeployedOnChain, showDeploymentInterjection } = useDeploymentStatus();

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

  const viewOnBlockchain = () => dispatch(viewTransactionOnBlockchainAction(chain, event));

  if (event.type === EVENT_TYPE.WALLET_CREATED) {
    const { iconName, title } = chainsConfig[chain];

    const subtitle = isKeyBasedAccount(activeAccount) || isDeployedOnChain?.[chain]
      ? null
      : t('label.walletNotDeployed');

    return (
      <BaseEventDetails
        date={event.date}
        title={title}
        subtitle={subtitle}
        subtitleColor={colors.primary}
        onSubtitlePress={() => showDeploymentInterjection(chain)}
        iconName={iconName}
        customIconProps={{ width: 62, height: 62 }} // complete wrapper fill size icon
      >
        <Text variant="large">{t('label.created')}</Text>
        <Spacing h={spacing.extraLarge} />

        <Button variant="secondary" title={t('button.topUp')} onPress={openTopUp} />
      </BaseEventDetails>
    );
  }

  if (event.type === EVENT_TYPE.WALLET_ACTIVATED) {
    const { iconName, title } = chainsConfig[chain];

    const deploymentLabel = isKeyBasedAccount(activeAccount) || isDeployedOnChain
      ? t('label.deployed')
      : t('label.walletDeployment');


    return (
      <BaseEventDetails
        date={event.date}
        title={title}
        iconName={iconName}
      >
        <Row>
          <Text variant="large">{deploymentLabel}</Text>
          <TransactionStatusIcon status={event.status} size={24} />
        </Row>
        <TransactionStatusText status={event.status} color={colors.basic030} variant="medium" />
        <Spacing h={spacing.extraLarge} />

        {!!event?.fee && (
          <FeeLabel
            value={event.fee.value}
            assetSymbol={event.fee.symbol}
            assetAddress={event.fee.address}
            mode="actual"
            chain={chain}
          />
        )}
        <Spacing h={spacing.mediumLarge} />

        <Button variant="secondary" title={t('button.viewOnBlockchain')} onPress={viewOnBlockchain} />
      </BaseEventDetails>
    );
  }

  return null;
}

export default WalletEventDetails;
