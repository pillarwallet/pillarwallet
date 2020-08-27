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

import React from 'react';
import styled, { withTheme } from 'styled-components/native';
import { connect } from 'react-redux';

// components
import ExchangeSwapIcon from 'screens/Exchange/ExchangeSwapIcon';
import TextInput from 'components/TextInputWithAssetSelector/TextInputWithAssetSelector';
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';

import { defaultFiatCurrency, BTC, } from 'constants/assetsConstants';

// utils
import { spacing } from 'utils/variables';
import { themedColors } from 'utils/themes';

// types
import type { Theme } from 'models/Theme';

import t from 'translations/translate';

type Props = {
  theme: Theme,
}

type State = {
  showSlippageModal: boolean,
}

const FormWrapper = styled.View`
  padding: ${spacing.large}px 40px 60px;
  background-color: ${themedColors.surface};
`;

class WBTCCafe extends React.Component<Props, State> {
  state: State = {
    showSlippageModal: false,
  };

  getFromInput = () => {
    // return (
    //   <TextInput
    //     getInputRef={ref => { this.fromInputRef = ref; }}
    // // onChange={this.handleFromInputChange}
    // // value={value}
    // // onBlur={this.blurFromInput}
    // // errorMessage={errorMessage}
    // // asset={fromAsset}
    // // onAssetPress={() => this.setState({ showSellOptions: true })}
    // // labelText={assetBalance && getFormattedSellMax(fromAsset)}
    // // onLabelPress={this.handleSellMax}
    // // leftSideText={displayFiatFromAmount
    // //   ? `${formatAmount(fromAmount || '0', 2)} ${fromAsset.symbol || ''}`
    // //   : formatFiat(fromAmountInFiat, baseFiatCurrency).replace(/ /g, '')
    // // }
    // // leftSideSymbol="-"
    // // onLeftSideTextPress={() => this.setState({ displayFiatFromAmount: !displayFiatFromAmount })}
    // // rightPlaceholder={displayFiatFromAmount ? baseFiatCurrency || defaultFiatCurrency : symbol}
    //   />
    // );
  }

  getToInput = () => {
    // return (
    //   <TextInput
    //     disabled
    //         // value={value}
    //         // onBlur={this.blurFromInput}
    //         // asset={toAsset}
    //         // onAssetPress={() => this.setState({ showBuyOptions: true })}
    //         // leftSideText={displayFiatToAmount
    //         //   ? `${formatAmount(toAmount || '0', 2)} ${toAsset.symbol || ''}`
    //         //   : formatFiat(toAmountInFiat || '0', fiatCurrency).replace(/ /g, '')
    //         // }
    //         // leftSideSymbol="+"
    //         // onLeftSideTextPress={() => this.setState({ displayFiatToAmount: !displayFiatToAmount })}
    //         // rightPlaceholder={displayFiatToAmount ? fiatCurrency : toAsset.symbol || ''}
    //   />
    // );
  }

  handleSwap = () => {
    //
  }

  render() {
    return (
      <ContainerWithHeader
        headerProps={{
          centerItems: [{ title: t('title.exchange') }],
        }}
        inset={{ bottom: 'never' }}
      >
        <FormWrapper>
          <ExchangeSwapIcon onPress={this.handleSwap} />
        </FormWrapper>
      </ContainerWithHeader>
    );
  }
}

export default withTheme(WBTCCafe);
