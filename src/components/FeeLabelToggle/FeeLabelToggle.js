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
import { connect } from 'react-redux';
import get from 'lodash.get';
import { BigNumber } from 'bignumber.js';
import { useState } from 'react';
import Emoji from 'react-native-emoji';
import { createStructuredSelector } from 'reselect';
import t from 'translations/translate';

// components
import { Label, BaseText } from 'components/Typography';
import Spinner from 'components/Spinner';
import { Spacing } from 'components/Layout';
import RelayerMigrationModal from 'components/RelayerMigrationModal';
import Modal from 'components/Modal';

// constants
import { defaultFiatCurrency, ETH } from 'constants/assetsConstants';
import { REMOTE_CONFIG } from 'constants/remoteConfigConstants';

// utils
import { formatTransactionFee, getFormattedTransactionFeeValue, getCurrencySymbol } from 'utils/common';
import { getRate } from 'utils/assets';

// selectors
import { accountAssetsSelector } from 'selectors/assets';
import { accountHistorySelector } from 'selectors/history';
import { isGasTokenSupportedSelector } from 'selectors/archanova';

// services
import { firebaseRemoteConfig } from 'services/firebase';

// types
import type { Rates, Assets } from 'models/Asset';
import type { GasToken, Transaction } from 'models/Transaction';
import type { RootReducerState } from 'reducers/rootReducer';
import type { ChainRecord } from 'models/Chain';


type Props = {
  baseFiatCurrency: ?string,
  rates: Rates,
  txFeeInWei: BigNumber | number | string,
  gasToken: ?GasToken,
  isLoading?: boolean,
  labelText?: string,
  isGasTokenSupported: boolean,
  accountAssets: Assets,
  accountHistory: ChainRecord<Transaction[]>,
  showRelayerMigration?: boolean,
  hasError?: boolean,
};

const LabelWrapper = styled.View`
  flex-direction: row;
  align-items: center;
`;

const FeePill = styled.TouchableOpacity`
  ${({ hasError, theme: { colors: { negative, labelTertiary } } }) => `
    background-color: ${hasError ? negative : labelTertiary};
  `}
  padding: 0 8px;
  border-radius: 12px;
  justify-content: center;
`;

export const FeeLabelToggleComponent = ({
  txFeeInWei,
  gasToken,
  baseFiatCurrency,
  rates,
  isLoading,
  labelText,
  showRelayerMigration = true,
  accountAssets,
  accountHistory,
  isGasTokenSupported,
  hasError,
}: Props) => {
  const [isFiatValueVisible, setIsFiatValueVisible] = useState(true);

  if (isLoading) {
    return <Spinner size={20} trackWidth={2} />;
  }

  const fiatCurrency = baseFiatCurrency || defaultFiatCurrency;
  const feeDisplayValue = formatTransactionFee(txFeeInWei, gasToken);
  const feeValue = getFormattedTransactionFeeValue(txFeeInWei, gasToken);
  const gasTokenSymbol = get(gasToken, 'symbol', ETH);
  const currencySymbol = getCurrencySymbol(fiatCurrency);

  const feeInFiat = parseFloat(feeValue) * getRate(rates, gasTokenSymbol, fiatCurrency);
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

const mapStateToProps = ({
  appSettings: { data: { baseFiatCurrency } },
  rates: { data: rates },
}: RootReducerState): $Shape<Props> => ({
  baseFiatCurrency,
  rates,
});

const structuredSelector = createStructuredSelector({
  accountAssets: accountAssetsSelector,
  accountHistory: accountHistorySelector,
  isGasTokenSupported: isGasTokenSupportedSelector,
});

const combinedMapStateToProps = (state: RootReducerState): $Shape<Props> => ({
  ...structuredSelector(state),
  ...mapStateToProps(state),
});

export default connect(combinedMapStateToProps)(FeeLabelToggleComponent);
