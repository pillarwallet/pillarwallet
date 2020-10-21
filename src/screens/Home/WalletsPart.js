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
import { withNavigation } from 'react-navigation';
import styled from 'styled-components/native';

// components
import PortfolioBalance from 'components/PortfolioBalance';

// constants
import { defaultFiatCurrency } from 'constants/assetsConstants';

// actions
import { toggleBalanceAction } from 'actions/appSettingsActions';

// utils
import { themedColors } from 'utils/themes';

// models, types
import type { RootReducerState, Dispatch } from 'reducers/rootReducer';
import type { NavigationScreenProp } from 'react-navigation';

// partials
import ActionButtons from './ActionButtons';


type Props = {
  navigation: NavigationScreenProp<*>,
  baseFiatCurrency: ?string,
  hideBalance: boolean,
  toggleBalance: () => void,
  rewardActive?: boolean,
  sessionLanguageCode: ?string, // important for re-rendering on language change
};

const Wrapper = styled.View`
  width: 100%;
  padding-top: 40px;
  border-bottom-width: 1px;
  border-bottom-color: ${themedColors.border};
`;

const WalletsPart = ({
  baseFiatCurrency,
  toggleBalance,
  hideBalance,
  rewardActive,
  sessionLanguageCode,
}: Props) => (
  <Wrapper>
    <PortfolioBalance
      fiatCurrency={baseFiatCurrency || defaultFiatCurrency}
      showBalance={!hideBalance}
      toggleBalanceVisibility={toggleBalance}
      sessionLanguageCode={sessionLanguageCode}
    />
    <ActionButtons rewardActive={rewardActive} sessionLanguageCode={sessionLanguageCode} />
  </Wrapper>
);

const mapStateToProps = ({
  appSettings: { data: { baseFiatCurrency, hideBalance } },
  session: { data: { sessionLanguageCode } },
}: RootReducerState): $Shape<Props> => ({
  baseFiatCurrency,
  hideBalance,
  sessionLanguageCode,
});

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  toggleBalance: () => dispatch(toggleBalanceAction()),
});

export default withNavigation(connect(mapStateToProps, mapDispatchToProps)(WalletsPart));
