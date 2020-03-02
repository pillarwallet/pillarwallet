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
import { withNavigation } from 'react-navigation';
import { connect } from 'react-redux';
import { createStructuredSelector } from 'reselect';
import styled, { withTheme } from 'styled-components/native';
import type { NavigationScreenProp } from 'react-navigation';
import SlideModal from 'components/Modals/SlideModal';
import { getThemeColors, themedColors } from 'utils/themes';
import { defaultFiatCurrency, ETH } from 'constants/assetsConstants';
import { EXCHANGE } from 'constants/navigationConstants';
import { MediumText, BaseText } from 'components/Typography';
import Icon from 'components/Icon';
import { spacing, fontStyles } from 'utils/variables';
import { getBalance, getRate } from 'utils/assets';
import { formatFiat } from 'utils/common';
import { accountBalancesSelector } from 'selectors/balances';
import type { Theme } from 'models/Theme';
import type { Balances, Rates } from 'models/Asset';
import type { RootReducerState } from 'reducers/rootReducer';

type Props = {
  navigation: NavigationScreenProp<*>,
  theme: Theme,
  baseFiatCurrency: ?string,
  onModalClose: (() => void) => void,
  deploySmartWallet: () => void,
  isVisible: boolean,
  balances: Balances,
  rates: Rates,
};

const MainContainer = styled.View`
  padding: 15px ${spacing.layoutSides}px 40px;
`;

const ItemContainer = styled.TouchableOpacity`
  flex-direction: row;
  padding: 15px 0;
  align-items: center;
  justify-content: space-between;
`;

const ChevronIcon = styled(Icon)`
  color: ${themedColors.secondaryText};
  ${fontStyles.small}
`;

const SWActivationModal = ({
  navigation, theme, baseFiatCurrency, onModalClose, deploySmartWallet, isVisible, balances, rates,
}: Props) => {
  const fiatCurrency = baseFiatCurrency || defaultFiatCurrency;
  const colors = getThemeColors(theme);
  const ethBalance = getBalance(balances, ETH);
  const balanceInFiat = ethBalance * getRate(rates, ETH, fiatCurrency);
  const fiatAmount = formatFiat(balanceInFiat, baseFiatCurrency || defaultFiatCurrency);

  return (
    <SlideModal
      isVisible={isVisible}
      noClose
      background={colors.card}
      hideHeader
      onModalHide={() => onModalClose(() => {})}
    >
      <MainContainer>
        <ItemContainer onPress={() => {
            onModalClose(() => {
              onModalClose(deploySmartWallet);
            });
          }}
        >
          <MediumText big>I have ETH</MediumText>
          <BaseText medium secondary>{fiatAmount}</BaseText>
        </ItemContainer>
        <ItemContainer onPress={() => {
            onModalClose(() => {
              navigation.navigate(EXCHANGE, {
                fromAssetCode: baseFiatCurrency || defaultFiatCurrency,
                toAssetCode: ETH,
              });
            });
          }}
        >
          <MediumText big>I{"'"}d like to have some</MediumText>
          <ChevronIcon name="chevron-right" />
        </ItemContainer>
      </MainContainer>
    </SlideModal>
  );
};

const mapStateToProps = ({
  appSettings: { data: { baseFiatCurrency } },
  rates: { data: rates },
}) => ({
  baseFiatCurrency,
  rates,
});

const structuredSelector = createStructuredSelector({
  balances: accountBalancesSelector,
});

const combinedMapStateToProps = (state: RootReducerState): $Shape<Props> => ({
  ...structuredSelector(state),
  ...mapStateToProps(state),
});

export default withNavigation(withTheme(connect(combinedMapStateToProps)(SWActivationModal)));
