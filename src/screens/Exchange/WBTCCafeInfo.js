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
import styled, { withTheme } from 'styled-components/native';
import { BaseText } from 'components/Typography';
import Button from 'components/Button';
import { themedColors } from 'utils/themes';
import { fontStyles, spacing } from 'utils/variables';
import type { WBTCFeesWithRate } from 'models/WBTC';
import { BTC, WBTC } from 'constants/assetsConstants';
import type { Option } from 'models/Selector';
import { isWbtcCafe } from 'utils/exchange';

import t from 'translations/translate';

type Props = {
  wbtcData: ?WBTCFeesWithRate,
  fromAsset: Option,
  toAsset: Option,
}

type State = {
  maxSlippage: number,
}

const Container = styled.View`
  margin-horizontal: ${spacing.large}px;
`;

const InfoWrapper = styled.View`
  width: 100%;
  border-radius: 4;
  border-width: 1px;
  border-style: solid;
  border-color: ${themedColors.secondaryAccent};
  margin-bottom: 30px;
`;

const Row = styled.TouchableOpacity`
  flex-direction: row;
  height: 40px;
  justify-content: space-between;
  padding-horizontal: ${spacing.large}px;
  align-items: center;
  border-bottom-width: ${({ noBorder = false }) => noBorder ? '0px' : '1px'};
  border-style: solid;
  border-color: ${themedColors.secondaryAccent};
`;

const Label = styled(BaseText)`
  ${fontStyles.regular};
  color: ${({ textColor }) => textColor || themedColors.secondaryText};
`;

const ButtonWrapper = styled.View`
  margin: 0px ${spacing.layoutSides}px 20px;
`;

class WBTCCafeInfo extends React.Component<Props, State> {
  state = {
    maxSlippage: 0.5,
  }

  handleSlippagePress = () => {
    // modal
  }

  handleNextPress = () => {
    //
  }

  render() {
    const { wbtcData, fromAsset, toAsset } = this.props;
    if (!isWbtcCafe(fromAsset, toAsset)) return null;
    const { maxSlippage } = this.state;
    const rate = wbtcData?.exchangeRate;
    const { symbol } = fromAsset;
    const rateString = rate && symbol ? `1 ${symbol} = ${rate.toFixed(4)} ${symbol === BTC ? WBTC : BTC}` : '-';
    return (
      <Container>
        <InfoWrapper>
          <Row disabled>
            <Label>{t('wbtcCafe.rate')}</Label>
            <Label textColor={themedColors.text}>{rateString}</Label>
          </Row>
          <Row disabled>
            <Label>{t('wbtcCafe.renFee')}</Label>
            <Label>{wbtcData ? wbtcData.renVMFee.toFixed(8) : '-'}</Label>
          </Row>
          <Row disabled>
            <Label>{t('wbtcCafe.btcFee')}</Label>
            <Label>{wbtcData ? wbtcData.networkFee.toFixed(8) : '-'}</Label>
          </Row>
          <Row onPress={this.handleSlippagePress} noBorder>
            <Label textColor={themedColors.link}>{t('wbtcCafe.slippage')}</Label>
            <Label>{`${maxSlippage}%`}</Label>
          </Row>
        </InfoWrapper>
        <ButtonWrapper>
          <Button title="Next" onPress={this.handleNextPress} disabled={false} />
        </ButtonWrapper>
      </Container>
    );
  }
}

export default withTheme(WBTCCafeInfo);
