// @flow
/*
    Pillar Wallet: the personal data locker
    Copyright (C) 2019 Stiftung Pillar Project

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
import { BigNumber } from 'bignumber.js';
import { useState } from 'react';
import Emoji from 'react-native-emoji';
import t from 'translations/translate';

// components
import { Label, BaseText } from 'components/Typography';
import Spinner from 'components/Spinner';
import { Spacing } from 'components/Layout';
import RelayerMigrationModal from 'components/RelayerMigrationModal';
import Modal from 'components/Modal';

// constants
import { REMOTE_CONFIG } from 'constants/remoteConfigConstants';

// utils
import { getRate } from 'utils/assets';
import { formatTransactionFee, getFormattedTransactionFeeValue, getCurrencySymbol } from 'utils/common';
import { getGasSymbol } from 'utils/transactions';

// selectors
import { useRootSelector, useRates, useFiatCurrency } from 'selectors';
import { accountAssetsSelector } from 'selectors/assets';
import { accountHistorySelector } from 'selectors/history';
import { isGasTokenSupportedSelector } from 'selectors/archanova';

// services
import { firebaseRemoteConfig } from 'services/firebase';

// types
import type { Chain } from 'models/Chain';
import type { GasToken } from 'models/Transaction';

type Props = {
  txFeeInWei: ?BigNumber | number | string,
  gasToken: ?GasToken,
  chain: Chain,
  isLoading?: boolean,
  labelText?: string,
  showRelayerMigration?: boolean,
  hasError?: boolean,
};

const FeeLabelToggle = ({
  txFeeInWei,
  gasToken,
  chain,
  isLoading,
  labelText,
  showRelayerMigration = true,
  hasError,
}: Props) => {
  const rates = useRates();
  const fiatCurrency = useFiatCurrency();
  const accountAssets = useRootSelector(accountAssetsSelector);
  const accountHistory = useRootSelector(accountHistorySelector);
  const isGasTokenSupported = useRootSelector(isGasTokenSupportedSelector);

  const [isFiatValueVisible, setIsFiatValueVisible] = useState(true);

  if (isLoading) {
    return <Spinner size={20} trackWidth={2} />;
  }

  const feeDisplayValue = formatTransactionFee(txFeeInWei, gasToken);
  const feeValue = getFormattedTransactionFeeValue(txFeeInWei, gasToken);

  const gasSymbol = getGasSymbol(chain, gasToken);
  const currencySymbol = getCurrencySymbol(fiatCurrency);

  const feeInFiat = parseFloat(feeValue) * getRate(rates, gasSymbol, fiatCurrency);
  const feeInFiatDisplayValue = `${currencySymbol}${feeInFiat.toFixed(2)}`;
  const labelValue = isFiatValueVisible ? feeInFiatDisplayValue : feeDisplayValue;

  showRelayerMigration = showRelayerMigration &&
    firebaseRemoteConfig.getBoolean(REMOTE_CONFIG.APP_FEES_PAID_WITH_PLR) &&
    !isGasTokenSupported;

  const openRelayerMigrationModal = () => {
    if (!showRelayerMigration) return;
    Modal.open(() => (
      <RelayerMigrationModal
        accountAssets={accountAssets}
        accountHistory={accountHistory}
      />
    ));
  };

  return (
    <LabelWrapper >
      <Label>{labelText || t('label.estimatedFee')}&nbsp;</Label>
      <Spacing w={8} />
      <FeePill onPress={() => setIsFiatValueVisible(!isFiatValueVisible)} hasError={hasError}>
        <BaseText small color="#ffffff">{labelValue}</BaseText>
      </FeePill>
      <Spacing w={8} />
      {showRelayerMigration && (
        <BaseText small link onPress={openRelayerMigrationModal}>
          {t('label.payWithPLR')} <Emoji name="ok_hand" style={{ fontSize: 12 }} />
        </BaseText>
      )}
    </LabelWrapper>
  );
};

export default FeeLabelToggle;

const LabelWrapper = styled.View`
  flex-direction: row;
  align-items: center;
`;

const FeePill = styled.TouchableOpacity`
  ${({
    hasError,
    theme: {
      colors: { negative, labelTertiary },
    },
  }) => `
    background-color: ${hasError ? negative : labelTertiary};
  `}
  padding: 0 8px;
  border-radius: 12px;
  justify-content: center;
`;
