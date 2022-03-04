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
import { BigNumber } from 'bignumber.js';
import styled from 'styled-components/native';
import { useTranslation } from 'translations/translate';

// components
import Text from 'components/core/Text';
import Spinner from 'components/Spinner';
import { Spacing } from 'components/legacy/Layout';
import Modal from 'components/Modal';

// Selectors
import { useRootSelector, useFiatCurrency, useChainRates } from 'selectors';
import { gasThresholdsSelector } from 'redux/selectors/gas-threshold-selector';

// Utils
import { getBalanceInFiat } from 'utils/assets';
import { formatTokenValue, formatFiatValue } from 'utils/format';
import { useThemeColors } from 'utils/themes';
import { isHighGasFee } from 'utils/transactions';
import { ethToWei } from '@netgum/utils';

// Types
import type { ViewStyleProp } from 'utils/types/react-native';
import type { Chain } from 'models/Chain';
import { spacing } from 'utils/variables';
import Icon from 'components/core/Icon';
import type { Value } from 'models/Value';

type Mode = 'actual' | 'estimate';

/**
 * TODO: get assetSymbol from matching asset once assets can be queried by assetAddress as key
 * instead of performing expensive search on whole assets array
 */
type Props = {
  value: Value;
  assetSymbol: string;
  assetAddress: string;
  chain: Chain;
  mode?: Mode;
  isLoading?: boolean;
  isNotEnough?: boolean;
  style?: ViewStyleProp;
  highGasFeeModal?: JSX.Element;
};

function FeeLabel({
  value,
  assetSymbol,
  assetAddress,
  mode,
  isLoading,
  isNotEnough,
  style,
  chain,
  highGasFeeModal,
}: Props) {
  const { t } = useTranslation();

  const [showFiatValue, setShowFiatValue] = React.useState(true);

  const gasThresholds = useRootSelector(gasThresholdsSelector);

  const chainRates = useChainRates(chain);
  const currency = useFiatCurrency();

  const colors = useThemeColors();

  if (isLoading) {
    return <Spinner size={20} trackWidth={2} style={style} />;
  }

  const valueInFiat = new BigNumber(getBalanceInFiat(currency, value, chainRates, assetAddress));
  const labelValue = showFiatValue ? formatFiatValue(valueInFiat, currency) : formatTokenValue(value, assetSymbol);

  const feeInWei = ethToWei(value).toString();
  const highFee = isHighGasFee(chain, feeInWei, null, chainRates, currency, gasThresholds);

  const onHighFeeInfoPress = () => {
    if (!highGasFeeModal) return;

    Modal.open(() => highGasFeeModal);
  };

  return (
    <LabelWrapper style={style}>
      <Text color={isNotEnough || highFee ? colors.negative : colors.basic030}>
        {mode === 'actual' ? t('label.fee') : t('label.estimatedFee')}
      </Text>

      <Spacing w={spacing.small} />

      <FeeValue onPress={() => setShowFiatValue(!showFiatValue)} $isNotEnough={isNotEnough}>
        <Text color={isNotEnough || highFee ? colors.negative : colors.secondaryText}>{labelValue}</Text>
        {highFee && <Text color={colors.negative}>{t('label.highGasFee')}</Text>}
        {highFee && highGasFeeModal && (
          <HighGasFeeButton onPress={onHighFeeInfoPress} padding={spacing.small}>
            <Icon name={'info'} color={colors.primary} />
          </HighGasFeeButton>
        )}
      </FeeValue>
    </LabelWrapper>
  );
}

export default FeeLabel;

const LabelWrapper = styled.View`
  flex-direction: row;
  align-items: center;
`;

const FeeValue = styled.TouchableOpacity`
  justify-content: center;
  flex-direction: row;
`;

const HighGasFeeButton = styled.TouchableOpacity`
  padding: ${({ padding }) => padding}px
  flex-direction: row;
`;
