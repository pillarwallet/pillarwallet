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
import { TouchableOpacity } from 'react-native';
import { useNavigation } from 'react-navigation-hooks';
import styled from 'styled-components/native';
import { useTranslationWithPrefix } from 'translations/translate';

// Components
import Button from 'components/modern/Button';
import FiatValueView from 'components/modern/FiatValueView';
import Icon from 'components/modern/Icon';
import Text from 'components/modern/Text';
import Tooltip from 'components/Tooltip';

// Contants
import { PPN_HOME, FUND_TANK } from 'constants/navigationConstants';

// Selectors
import { useRootSelector, useFiatCurrency } from 'selectors';
import { paymentNetworkBalanceSelector } from 'selectors/balances';

// Utils
import { hitSlop20 } from 'utils/common';
import { useThemeColors } from 'utils/themes';
import { appFont, spacing } from 'utils/variables';

// Types
import type { ViewStyleProp } from 'utils/types/react-native';

type Props = {|
  style?: ViewStyleProp,
|};

function PillarPaySummary({ style }: Props) {
  const { t } = useTranslationWithPrefix('assets.wallet.pillarPay');
  const navigation = useNavigation();
  const colors = useThemeColors();

  const [showTooltip, setShowTooltip] = React.useState(false);

  const balance = useRootSelector(paymentNetworkBalanceSelector);
  const currency = useFiatCurrency();

  const navigateToPillarPay = () => {
    navigation.navigate(PPN_HOME);
  };

  const navigateToTopUp = () => {
    navigation.navigate(FUND_TANK);
  };

  return (
    <TouchableContainer onPress={navigateToPillarPay} style={style}>
      <TitleWrapper>
        <Title variant="big">{t('title')}</Title>
        <Tooltip body={t('hint')} isVisible={showTooltip} positionOnBottom={false}>
          <TouchableOpacity hitSlop={hitSlop20} activeOpacity={1} onPress={() => setShowTooltip(!showTooltip)}>
            <Icon name="question" width={12} height={12} color={colors.labelTertiary} />
          </TouchableOpacity>
        </Tooltip>
      </TitleWrapper>

      <FiatValueView value={balance} currency={currency} variant="big" />
      <Button title={t('topUp')} variant="text" compact onPress={navigateToTopUp} />
    </TouchableContainer>
  );
}

export default PillarPaySummary;

const TouchableContainer = styled.TouchableOpacity`
  flex-direction: row;
  align-self: stretch;
  align-items: center;
  margin: 0 ${spacing.layoutSides}px;
  padding-left: ${spacing.mediumLarge}px;
  padding-right: ${spacing.extraSmall}px;
  border-radius: 20px;
  ${({ theme }) => `background-color: ${theme.colors.card};`}
`;

const TitleWrapper = styled.View`
  flex: 1;
  flex-direction: row;
  margin: ${spacing.medium}px 0;
  align-items: center;
`;

const Title = styled(Text)`
  font-family: "${appFont.medium}";
  margin-right: ${spacing.small}px;
`;
