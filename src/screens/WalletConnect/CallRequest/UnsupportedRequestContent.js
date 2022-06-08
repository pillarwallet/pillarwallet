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
import styled from 'styled-components/native';
import { useTranslation } from 'translations/translate';

// Components
import Button from 'components/core/Button';
import Image from 'components/Image';
import Text from 'components/core/Text';

// Utils
import { chainFromChainId } from 'utils/chains';
import { useChainsConfig } from 'utils/uiConfig';
import { spacing } from 'utils/variables';
import { parsePeerName } from 'utils/walletConnect';

// Constants
import { CHAIN } from 'constants/chainConstants';

// Types
import type { WalletConnectCallRequest } from 'models/WalletConnect';

type Props = {|
  request: WalletConnectCallRequest,
  onReject: () => mixed,
|};

function UnsupportedRequestContent({ request, onReject }: Props) {
  const { t } = useTranslation();
  const configs = useChainsConfig();

  const { title, iconUrl, chain }: any = getViewData(request);
  const config = configs[chain];

  return (
    <>
      <Text color={config.color}>
        {title} {t('label.dotSeparator')} {config.titleShort}
      </Text>

      <Image source={{ uri: iconUrl }} style={styles.icon} />

      <ErrorMessage>{t('walletConnectContent.error.unsupportedRequestCallRequestType')}</ErrorMessage>

      <Button title={t('button.reject')} onPress={onReject} variant="destructive" style={styles.button} />
    </>
  );
}

export default UnsupportedRequestContent;

const getViewData = (request: WalletConnectCallRequest) => {
  const title = parsePeerName(request.name);
  const iconUrl = request.icon;
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
