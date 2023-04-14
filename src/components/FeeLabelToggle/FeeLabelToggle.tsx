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

import React, { FC, useState } from 'react';
import styled from 'styled-components/native';
import Emoji from 'react-native-emoji';
import t from 'translations/translate';

// components
import { Label, BaseText } from 'components/legacy/Typography';
import Spinner from 'components/Spinner';
import { Spacing } from 'components/legacy/Layout';
import RelayerMigrationModal from 'components/RelayerMigrationModal';
import Modal from 'components/Modal';
import Icon from 'components/core/Icon';

// constants
import { REMOTE_CONFIG } from 'constants/remoteConfigConstants';

// utils
import { formatTransactionFee, getCurrencySymbol } from 'utils/common';
import { getTxFeeInFiat, isHighGasFee } from 'utils/transactions';
import { useThemeColors } from 'utils/themes';
import { spacing } from 'utils/variables';

// selectors
import { useRootSelector, useFiatCurrency, useChainRates } from 'selectors';
import { accountAssetsPerChainSelector } from 'selectors/assets';
import { accountHistorySelector } from 'selectors/history';
import { isGasTokenSupportedSelector } from 'selectors/archanova';
import { gasThresholdsSelector } from 'redux/selectors/gas-threshold-selector';

// services
import { firebaseRemoteConfig } from 'services/firebase';

// types
import type { Value } from 'models/Value';
import type { Chain } from 'models/Chain';
import type { GasToken } from 'models/Transaction';

interface IFeeLabelToggle {
  txFeeInWei: Value | null;
  gasToken: GasToken | null;
  chain: Chain;
  isLoading?: boolean;
  labelText?: string;
  showRelayerMigration?: boolean;
  hasError?: boolean;
  highGasFeeModal?: JSX.Element;
}

const FeeLabelToggle: FC<IFeeLabelToggle> = ({
  txFeeInWei,
  gasToken,
  chain,
  isLoading,
  labelText,
  showRelayerMigration = true,
  hasError,
  highGasFeeModal,
}) => {
  const colors = useThemeColors();

  const chainRates = useChainRates(chain);
  const fiatCurrency = useFiatCurrency();
  const accountAssets = useRootSelector(accountAssetsPerChainSelector);
  const accountHistory = useRootSelector(accountHistorySelector);
  const isGasTokenSupported = useRootSelector(isGasTokenSupportedSelector);
  const gasThresholds = useRootSelector(gasThresholdsSelector);

  const [isFiatValueVisible, setIsFiatValueVisible] = useState(true);

  if (isLoading) {
    return <Spinner size={20} trackWidth={2} />;
  }

  const chainAccountAssets = accountAssets[chain] ?? {};

  const feeDisplayValue = formatTransactionFee(chain, txFeeInWei, gasToken);
  const currencySymbol = getCurrencySymbol(fiatCurrency);

  const feeInFiat = getTxFeeInFiat(chain, txFeeInWei, gasToken, chainRates, fiatCurrency);
  const feeInFiatDisplayValue =
    feeInFiat < 0.01 && feeInFiat > 0 ? `< ${currencySymbol}0.01` : `${currencySymbol}${feeInFiat.toFixed(2)}`;
  const labelValue = isFiatValueVisible ? feeInFiatDisplayValue : feeDisplayValue;

  showRelayerMigration =
    showRelayerMigration &&
    firebaseRemoteConfig.getBoolean(REMOTE_CONFIG.APP_FEES_PAID_WITH_PLR) &&
    !isGasTokenSupported;

  const openRelayerMigrationModal = () => {
    if (!showRelayerMigration) return;
    Modal.open(() => <RelayerMigrationModal accountAssets={chainAccountAssets} accountHistory={accountHistory} />);
  };

  const highFee = isHighGasFee(chain, txFeeInWei, gasToken, chainRates, fiatCurrency, gasThresholds);

  const onHighFeeInfoPress = () => {
    if (!highGasFeeModal) return;

    Modal.open(() => highGasFeeModal);
  };

  const renderRelayerMigration = () => {
    return (
      <>
        <Spacing w={spacing.small} />
        <BaseText small link onPress={openRelayerMigrationModal}>
          {t('label.payWithPLR')} <Emoji name="ok_hand" style={{ fontSize: 12 }} />
        </BaseText>
      </>
    );
  };

  const renderHighGasFeeWarning = () => {
    return (
      <>
        <Label color={highFee && colors.negative}>{labelText || t('label.highGasFee')}&nbsp;</Label>
        {highGasFeeModal && (
          <HighGasFeeButton onPress={onHighFeeInfoPress} padding={spacing.small}>
            <Icon name={'info'} color={colors.primary} />
          </HighGasFeeButton>
        )}
      </>
    );
  };

  return (
    <LabelWrapper>
      <Label color={highFee && colors.negative}>{labelText || t('label.estimatedFee')}&nbsp;</Label>

      <Spacing w={spacing.small} />

      <FeePill onPress={() => setIsFiatValueVisible(!isFiatValueVisible)} hasError={hasError} highFee={highFee}>
        <BaseText small color={colors.white}>
          {labelValue}
        </BaseText>
      </FeePill>

      {highFee && renderHighGasFeeWarning()}

      {showRelayerMigration && renderRelayerMigration()}
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
    highFee,
    theme: {
      colors: { negative, labelTertiary },
    },
  }) => `
    background-color: ${hasError || highFee ? negative : labelTertiary};
  `}
  padding: 0 8px;
  border-radius: 12px;
  justify-content: center;
`;

const HighGasFeeButton = styled.TouchableOpacity`
  padding: ${({ padding }) => padding}px
  flex-direction: row;
`;
