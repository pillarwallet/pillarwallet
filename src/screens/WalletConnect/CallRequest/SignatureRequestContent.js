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
import styled from 'styled-components/native';

// Components
import Button from 'components/core/Button';
import Image from 'components/Image';
import Text from 'components/core/Text';

// Constants
import { CHAIN } from 'constants/chainConstants';

// Utils
import { chainFromChainId } from 'utils/chains';
import { useChainsConfig } from 'utils/uiConfig';
import { spacing } from 'utils/variables';
import { parsePeerName } from 'utils/walletConnect';
import { isEtherspotAccountDeployed } from 'utils/etherspot';
import { isArchanovaAccount, isEtherspotAccount, isKeyBasedAccount } from 'utils/accounts';

// Selectors
import { useActiveAccount, useRootSelector } from 'selectors';
import { isArchanovaAccountDeployedSelector } from 'selectors/archanova';

// Types
import type { WalletConnectCallRequest } from 'models/WalletConnect';

type Props = {|
  request: WalletConnectCallRequest,
  onConfirm: () => mixed,
  onReject: () => mixed,
|};

function SignatureRequestContent({ request, onConfirm, onReject }: Props) {
  const { t } = useTranslation();
  const configs = useChainsConfig();
  const activeAccount = useActiveAccount();
  const isArchanovaAccountDeployed = useRootSelector(isArchanovaAccountDeployedSelector);

  const { title, iconUrl, chain } = getViewData(request);
  const config = configs[chain];

  /**
   * Archanova account needs to be deployed for all types call requests.
   * Etherspot account needs to be deployed for signature type call requests only.
   */
  const requiresDeployedAccount =
    (isArchanovaAccount(activeAccount) && !isArchanovaAccountDeployed) ||
    (isEtherspotAccount(activeAccount) && !isEtherspotAccountDeployed(activeAccount, chain)) ||
    (isKeyBasedAccount(activeAccount) && chain !== CHAIN.ETHEREUM);

  return (
    <>
      <Text color={config.color}>
        {title} {t('label.dotSeparator')} {config.titleShort}
      </Text>

      <Image source={{ uri: iconUrl }} style={styles.icon} />

      {requiresDeployedAccount && (
        <ErrorMessage variant="small">{t('walletConnectContent.error.smartWalletNeedToBeActivated')}</ErrorMessage>
      )}

      <Button
        title={t('button.confirm')}
        onPress={onConfirm}
        disabled={requiresDeployedAccount}
        style={styles.button}
      />

      <Button title={t('button.reject')} onPress={onReject} variant="destructive" style={styles.button} />
    </>
  );
}

export default SignatureRequestContent;

const getViewData = (request: WalletConnectCallRequest) => {
  const title = parsePeerName(request.name);
  const iconUrl: any = request.icon;
  const chain = chainFromChainId[request.chainId] ?? CHAIN.ETHEREUM;

  return { title, iconUrl, chain };
};

const styles = {
  icon: {
    width: 64,
    height: 64,
    marginVertical: spacing.largePlus,
    borderRadius: 32,
  },
  button: {
    marginVertical: spacing.small / 2,
  },
};

const ErrorMessage = styled(Text)`
  margin: ${spacing.extraSmall}px 0 ${spacing.mediumLarge}px;
  text-align: center;
  color: ${({ theme }) => theme.colors.negative};
`;
