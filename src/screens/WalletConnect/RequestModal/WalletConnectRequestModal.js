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
import { BigNumber } from 'bignumber.js';
import { useTranslation } from 'translations/translate';

// Components
import BottomModal from 'components/modern/BottomModal';
import Button from 'components/modern/Button';
import Text from 'components/modern/Text';
import Image from 'components/Image';
import LargeTokenValueView from 'components/modern/LargeTokenValueView';
import FeeLabel from 'components/modern/FeeLabel';

// Constants
import { REQUEST_TYPE } from 'constants/walletConnectConstants';

// Utils
import { spacing } from 'utils/variables';
import { useChainsConfig } from 'utils/uiConfig';
import { formatRequestType } from 'utils/walletConnect';


// Types
import { CHAIN } from 'models/Chain';
import type { WalletConnectCallRequest } from 'models/WalletConnect';


type Props = {|
  request: WalletConnectCallRequest,
|};

function WalletConnectRequestModal({ request }: Props) {
  const { t } = useTranslation();
  const configs = useChainsConfig();

  const ref = React.useRef();

  const { title, iconUrl, type, chain, value, fee } = mapRequestDetails(request);
  const config = configs[chain];

  const confirmRequest = () => {
    // TODO: perform actual confirmation
    ref.current?.close();
  };

  const rejectRequest = () => {
    // TODO: perform actual rejection
    ref.current?.close();
  };

  return (
    <BottomModal ref={ref} title={formatRequestType(type)}>
      <Text color={config.color}>
        {title} {t('label.dotSeparator')} {config.titleShort}
      </Text>

      <Image source={{ uri: iconUrl }} style={styles.icon} />

      <LargeTokenValueView value={value.value} symbol={value.symbol} style={styles.tokenValue} />
      <FeeLabel value={fee.value} symbol={fee.symbol} style={styles.fee} />

      <Button title={t('button.confirm')} onPress={confirmRequest} style={styles.button} />
      <Button title={t('button.reject')} onPress={rejectRequest} variant="text-destructive" style={styles.button} />
    </BottomModal>
  );
}

export default WalletConnectRequestModal;

/* eslint-disable i18next/no-literal-string */
// TODO: replace by mapping real data
const mapRequestDetails = (request: WalletConnectCallRequest) => {
  return {
    title: 'Pool Together',
    type: REQUEST_TYPE.TRANSACTION,
    iconUrl:
      'https://images.prismic.io/pillar-app/3c0d1f5a-58ea-402b-b001-04dcc508bafb_pticon.jpg?auto=compress,format',
    chain: CHAIN.XDAI,
    value: { value: BigNumber(120.4), symbol: 'DAI' },
    fee: { value: BigNumber(0.01), symbol: 'ETH' },
    model: request,
  };
};

const styles = {
  icon: {
    width: 64,
    height: 64,
    marginVertical: spacing.largePlus,
    borderRadius: 32,
  },
  tokenValue: {
    marginBottom: spacing.largePlus,
  },
  fee: {
    marginBottom: spacing.medium,
  },
  button: {
    marginVertical: spacing.small / 2,
  },
};
