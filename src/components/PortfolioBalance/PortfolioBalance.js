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
import { connect } from 'react-redux';
import { createStructuredSelector } from 'reselect';
import styled from 'styled-components/native';
import t from 'translations/translate';

import type { RootReducerState } from 'reducers/rootReducer';
import type { Balances, Rates, MixedBalance } from 'models/Asset';

import BalanceView from 'components/PortfolioBalance/BalanceView';
import { BaseText, MediumText } from 'components/Typography';
import Icon from 'components/Icon';
import { balanceInEth } from 'utils/assets';
import { fontSizes, fontStyles, spacing } from 'utils/variables';
import { allBalancesSelector, servicesBalanceListSelector } from 'selectors/balances';
import { ETH } from 'constants/assetsConstants';


type Props = {
  rates: Rates,
  balances: Balances,
  serviceBalances: MixedBalance[],
  fiatCurrency: string,
  style: Object,
  showBalance: boolean,
  toggleBalanceVisibility: () => void,
};


const BalanceWrapper = styled.View`
  width: 100%;
  align-items: center;
  justify-content: center;
`;

const BalanceButton = styled.TouchableOpacity`
  padding: 8px ${spacing.large}px;
`;

const ContentWrapper = styled.View`
  flex-direction: row;
  height: 36px;
  align-items: center;
  justify-content: center;
`;

const ToggleIcon = styled(Icon)`
  font-size: ${fontSizes.medium}px;
  color: ${({ theme }) => theme.colors.basic020};
  margin-left: 6px;
  margin-bottom: 5px;
`;

const BalanceText = styled(MediumText)`
  ${fontStyles.big};
  margin-bottom: 8px;
`;

const LabelText = styled(BaseText)`
  font-size: ${fontSizes.regular}px;
  margin-bottom: 8px;
`;

export const getTotalInEth = (values: MixedBalance[], rates: Rates) => {
  return values.map<number>(({ symbol, balance }) => {
    const rate = rates[symbol]?.[ETH]
      ?? (!!rates[ETH]?.[symbol] && 1 / rates[ETH]?.[symbol])
      ?? 0;
    const amount = typeof balance === 'number' ? balance : parseFloat(balance);
    return rate * amount;
  })
    .map(ethBalance => Number.isNaN(ethBalance) ? 0 : ethBalance)
    .reduce((a, b) => a + b, 0);
};

const getCombinedBalances = (props: Props): number => {
  const {
    balances,
    serviceBalances,
    fiatCurrency,
    rates,
  } = props;

  const ethRate = rates[ETH]?.[fiatCurrency] ?? 0;
  return ethRate * (balanceInEth(balances, rates) + getTotalInEth(serviceBalances, rates));
};

class PortfolioBalance extends React.PureComponent<Props> {
  render() {
    const {
      style,
      fiatCurrency,
      showBalance,
      toggleBalanceVisibility,
    } = this.props;

    const combinedBalance = getCombinedBalances(this.props);

    return (
      <BalanceWrapper>
        <LabelText secondary>{t('title.totalBalance')}</LabelText>
        <BalanceButton onPress={toggleBalanceVisibility}>
          <ContentWrapper>
            {!showBalance
              ? <BalanceText secondary>{t('button.viewBalance')}</BalanceText>
              : (
                <BalanceView
                  style={style}
                  fiatCurrency={fiatCurrency}
                  balance={combinedBalance}
                />)
            }
            {showBalance &&
              <ToggleIcon name="hidden" /> // different icon name will be passed when !showBalance
            }
          </ContentWrapper>
        </BalanceButton>
      </BalanceWrapper>
    );
  }
}

const mapStateToProps = ({
  rates: { data: rates },
}: RootReducerState): $Shape<Props> => ({
  rates,
});

const structuredSelector = createStructuredSelector({
  balances: allBalancesSelector,
  serviceBalances: servicesBalanceListSelector,
});

const combinedMapStateToProps = (state: RootReducerState): $Shape<Props> => ({
  ...structuredSelector(state),
  ...mapStateToProps(state),
});

export default connect(combinedMapStateToProps)(PortfolioBalance);
