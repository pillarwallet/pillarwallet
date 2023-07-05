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
import { isEmpty } from 'lodash';

// Components
import Button from 'components/core/Button';
import Text from 'components/core/Text';
import Image from 'components/Image';
import TokenIcon from 'components/display/TokenIcon';
import { Spacing } from 'components/legacy/Layout';

// Constants
import { CHAIN } from 'constants/chainConstants';
import { ETH_SIGN_TYPED_DATA, ETH_SIGN_TYPED_DATA_V4 } from 'constants/walletConnectConstants';

// Utils
import { chainFromChainId } from 'utils/chains';
import { useChainsConfig } from 'utils/uiConfig';
import { spacing } from 'utils/variables';
import { parsePeerName } from 'utils/walletConnect';
import { isEtherspotAccountDeployed } from 'utils/etherspot';
import { isArchanovaAccount, isEtherspotAccount, isKeyBasedAccount } from 'utils/accounts';
import { useThemeColors } from 'utils/themes';

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
  const colors = useThemeColors();
  const isArchanovaAccountDeployed = useRootSelector(isArchanovaAccountDeployedSelector);

  const { title, iconUrl, chain, method, params } = getViewData(request);
  const config = configs[chain];

  const isSignTypedData = method === ETH_SIGN_TYPED_DATA || method === ETH_SIGN_TYPED_DATA_V4;

  const { message, primaryType } =
    isSignTypedData && !isEmpty(params?.[1]) ? JSON.parse(params[1]) : { message: null, primaryType: null };

  const messageText = React.useMemo(() => {
    if (isEmpty(message)) return [];

    const values = Object.entries(message);
    if (isEmpty(values)) return [];

    return values.map((value) => {
      const key = value?.[0];
      const description = value?.[1];

      if (!key) return '';

      const label = `${key.charAt(0).toUpperCase()}${key.slice(1)}`;

      // eslint-disable-next-line i18next/no-literal-string
      if (!description) return `${label}\n\n`;

      if (typeof description === 'object') {
        const descObject = Object.entries(description);
        // eslint-disable-next-line i18next/no-literal-string
        if (isEmpty(descObject)) return `${label}\n\n`;

        const descMap = descObject.map((descValues, index) => {
          return `${index !== 0 ? '\n' : ''} ${descValues[0]}: ${JSON.stringify(descValues[1])}`;
        });
        // eslint-disable-next-line i18next/no-literal-string
        return `${label}\n${descMap}\n\n`;
      }
      // eslint-disable-next-line i18next/no-literal-string
      return `${label} ${JSON.stringify(description)}\n\n`;
    });
  }, [message]);

  // eslint-disable-next-line i18next/no-literal-string
  const messageTitle = primaryType ? `${primaryType}\n\n` : null;

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
      {!isSignTypedData && (
        <>
          <Text color={config.color}>
            {title} {t('label.dotSeparator')} {config.titleShort}
          </Text>
          <Image source={{ uri: iconUrl }} style={styles.icon} />
        </>
      )}

      {isSignTypedData && (
        <>
          <Spacing h={spacing.medium} />

          <TokenIcon
            url={iconUrl}
            size={64}
            chain={chain}
            chainIconStyle={{ top: -10, right: -10 }}
            imageStyle={{ borderRadius: 24 }}
          />

          <Spacing h={spacing.large} />

          <Text variant="medium" color={colors.secondaryText}>
            {t('walletConnect.requests.signMessageRequest')}
          </Text>

          <Spacing h={spacing.large} />

          {(!isEmpty(messageText) || messageTitle) && (
            <MessageContainer>
              <ScrollContainer>
                {messageTitle && <Text>{messageTitle}</Text>}
                {messageText.map((text) => (
                  <Text>{text}</Text>
                ))}
              </ScrollContainer>
            </MessageContainer>
          )}

          <Spacing h={spacing.large} />
        </>
      )}

      {requiresDeployedAccount && (
        <ErrorMessage variant="small">{t('walletConnectContent.error.smartWalletNeedToBeActivated')}</ErrorMessage>
      )}

      <Button
        title={isSignTypedData ? t('button.approve') : t('button.confirm')}
        onPress={onConfirm}
        disabled={requiresDeployedAccount || (isSignTypedData && isEmpty(params?.[1]))}
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

  return { title, iconUrl, chain, ...request };
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

const MessageContainer = styled.View`
  background-color: ${({ theme }) => theme.colors.basic070};
  max-height: 162px;
  width: 100%;
  padding: 10px 12px 8px;
  border-radius: 14px;
  border: solid 1px ${({ theme }) => theme.colors.basic080};
`;

const ScrollContainer = styled.ScrollView``;
