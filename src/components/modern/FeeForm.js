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
import { View, TouchableOpacity } from 'react-native';
import { useTranslationWithPrefix, useTranslation } from 'translations/translate';

// Components
import * as Form from 'components/modern/Form';
import Tooltip from 'components/Tooltip';

// Contansts
import { ETH } from 'constants/assetsConstants';

// Selectors
import { useRates, useFiatCurrency } from 'selectors';

// Utils
import { getFormattedBalanceInFiat } from 'utils/assets';
import { formatTokenAmount, hitSlop20 } from 'utils/common';

// Types
import type { ViewStyleProp } from 'utils/types/react-native';
import type { Value } from 'utils/common';

type Props = {|
  fee: Value,
  style?: ViewStyleProp,
|};

function FeeForm({ fee, style }: Props) {
  const { t, tRoot } = useTranslationWithPrefix('transactions.label');

  return (
    <View style={style}>
      <Form.Header>{t('fees')}</Form.Header>

      <FeeItem title={t('ethFee')} symbol={ETH} fee={fee} separator={false} />
      <Form.Item title={t('pillarFee')} value={tRoot('label.free')} variant="positive" />
      <FeeItem title={t('totalFee')} symbol={ETH} fee={fee} separator={false} />
    </View>
  );
}

export default FeeForm;

type FeeItemProps = {|
  title: string,
  symbol: string,
  fee: Value,
  separator?: boolean,
|};

export function FeeItem({
  title,
  symbol,
  fee,
  separator,
}: FeeItemProps) {
  const { t } = useTranslation();

  const [showTooltip, setShowTooltip] = React.useState(false);

  const rates = useRates();
  const fiatCurrency = useFiatCurrency();

  const formattedFee = t('tokenValue', { value: formatTokenAmount(fee, symbol), token: symbol });
  const formattedFeeInFiat = getFormattedBalanceInFiat(fiatCurrency, fee, rates, symbol);

  return (
    <Form.ItemRow separator={separator}>
      <Form.ItemTitle>{title}</Form.ItemTitle>

      <Tooltip body={formattedFee} isVisible={showTooltip} positionOnBottom={false}>
        <TouchableOpacity hitSlop={hitSlop20} activeOpacity={1} onPress={() => setShowTooltip(!showTooltip)}>
          <Form.ItemValue fontVariant="tabular-nums">{formattedFeeInFiat}</Form.ItemValue>
        </TouchableOpacity>
      </Tooltip>
    </Form.ItemRow>
  );
}
