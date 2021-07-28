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
import { useTranslation } from 'translations/translate';

// Components
import Text from 'components/modern/Text';

// Utils
import { useThemeColors } from 'utils/themes';
import { useChainsConfig } from 'utils/uiConfig';

// Selectors
import { useRootSelector } from 'selectors';
import { isDeployedOnChainSelector } from 'selectors/chains';

// Types
import { type WalletEvent, EVENT_TYPE } from 'models/History';
import type { Chain } from 'models/Chain';

// Local
import HistoryListItem from './HistoryListItem';

type Props = {|
  event: WalletEvent,
  onPress?: () => mixed,
  chain: Chain,
|};

function WalletEventItem({ event, onPress, chain }: Props) {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const chainsConfig = useChainsConfig();
  const isDeployedOnChain = useRootSelector(isDeployedOnChainSelector)?.[chain];

  if (event.type === EVENT_TYPE.WALLET_CREATED) {
    const { iconName, title } = chainsConfig[chain];

    const subtitle = isDeployedOnChain
      ? null
      : t('label.walletNotDeployed');

    return (
      <HistoryListItem
        iconName={iconName}
        customIconProps={{ width: 46, height: 46 }} // complete wrapper fill size icon
        title={title}
        subtitle={subtitle}
        subtitleColor={colors.primary}
        valueComponent={<Text color={colors.basic030}>{t('label.created')}</Text>}
        onPress={onPress}
      />
    );
  }

  if (event.type === EVENT_TYPE.WALLET_ACTIVATED) {
    return (
      <HistoryListItem
        iconName="wallet"
        title={t('label.wallet')}
        valueComponent={<Text color={colors.basic030}>{t('label.activated')}</Text>}
        onPress={onPress}
      />
    );
  }

  return null;
}

export default WalletEventItem;
