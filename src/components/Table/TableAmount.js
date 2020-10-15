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
import React, { useState } from 'react';
import { connect } from 'react-redux';
import styled, { withTheme } from 'styled-components/native';
import { CachedImage } from 'react-native-cached-image';
import t from 'translations/translate';
import { getFormattedRate } from 'utils/assets';
import { formatAmount } from 'utils/common';
import { images } from 'utils/images';
import { BaseText } from 'components/Typography';
import Tooltip from 'components/Tooltip';
import { defaultFiatCurrency } from 'constants/assetsConstants';
import type { Rates } from 'models/Asset';
import type { Theme } from 'models/Theme';
import type { RootReducerState } from 'reducers/rootReducer';


type Props = {
  amount: number,
  token: string,
  highFees?: boolean,
  rates: Rates,
  baseFiatCurrency: ?string,
  theme: Theme,
};

const HighFeesIcon = styled(CachedImage)`
  height: 16px;
  width: 16px;
  margin-right: 4px;
`;

const Row = styled.View`
  flex-direction: row;
  align-items: center;
`;

const TableAmount = ({
  amount, token, highFees, rates, baseFiatCurrency, theme,
}: Props) => {
  const [showTokenAmount, setShowTokenAmount] = useState<boolean>(false);
  if (amount === 0) {
    return (
      <BaseText regular positive>{t('label.free')}</BaseText>
    );
  }
  const fiatAmount = getFormattedRate(rates, amount, token, baseFiatCurrency || defaultFiatCurrency);
  const formattedAmount = formatAmount(amount);
  const tooltipText = t('tokenValue', { value: formattedAmount, token });

  const { highFeesIcon } = images(theme);

  return (
    <Tooltip body={tooltipText} isVisible={showTokenAmount} positionOnBottom={false}>
      <Row>
        {!!highFees && <HighFeesIcon source={highFeesIcon} />}
        <BaseText regular onPress={() => setShowTokenAmount(!showTokenAmount)}>{fiatAmount}</BaseText>
      </Row>
    </Tooltip>
  );
};

const mapStateToProps = ({
  rates: { data: rates },
  appSettings: { data: { baseFiatCurrency } },
}: RootReducerState): $Shape<Props> => ({
  rates,
  baseFiatCurrency,
});

export default withTheme(connect(mapStateToProps)(TableAmount));
