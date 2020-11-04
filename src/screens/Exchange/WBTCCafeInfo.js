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
import { fontStyles, spacing, UIColors } from 'utils/variables';
import type { WBTCFeesWithRate } from 'models/WBTC';
import { BTC, WBTC } from 'constants/assetsConstants';
import type { Option } from 'models/Selector';
import { isWbtcCafe } from 'utils/exchange';
import { hitslop10, hitslopFull } from 'utils/common';

import t from 'translations/translate';

type Props = {
  wbtcData: ?WBTCFeesWithRate,
  fromAsset: Option,
  toAsset: Option,
}

type State = {
  maxSlippage: number,
  showRenFeeInfo: boolean
}

const Container = styled.TouchableOpacity`
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

const Tooltip = styled.TouchableOpacity`
  position: absolute;
  bottom: 15px;
  width: 230px;
  align-items: center;
  `;

const TooltipBody = styled.View`
  padding: 15px;
  background-color: ${UIColors.darkShadowColor};
  border-width: 1px;
  border-radius: 16;
  border-color: ${UIColors.darkShadowColor};
  opacity: 0.8;
  border-width: 0;
`;

const TooltipText = styled(BaseText)`
  ${fontStyles.small};
  color: ${themedColors.control};
  opacity: 1;
`;

const TooltipArrow = styled.View`
  width: 0px;
  height: 0px;
  border-left-width: 10px;
  border-right-width: 10px;
  border-top-width: 10px;
  border-color: transparent;
  border-top-color: ${UIColors.darkShadowColor};
  opacity: 0.8;
`;

const TextRow = styled.View`
  flex-direction: row;
  align-items: center;
`;

const RenFeeIcon = styled.TouchableOpacity`
  height: 13px;
  width: 13px;
  border-color: ${themedColors.inactiveTabBarIcon};
  border-width: 1px;
  border-radius: 7;
  justify-content: center;
  align-items: center;
  margin-left: 5px;
  margin-right: 5px;
  text-align: center;
`;

const RenFeeIconText = styled(BaseText)`
  color: ${themedColors.inactiveTabBarIcon};
  font-size: 10px;
  text-align: center;
`;

const IconWrapper = styled.View`
  align-items: center;
`;

class WBTCCafeInfo extends React.Component<Props, State> {
  state = {
    maxSlippage: 0.5,
    showRenFeeInfo: false,
  }

  handleSlippagePress = () => {
    // modal
  }

  handleNextPress = () => {
    //
  }

  getTooltip = () => (
    <Tooltip activeOpacity={1} onPress={this.switchOffFeeInfo} hitSlop={hitslopFull}>
      <TooltipBody><TooltipText>{t('wbtcCafe.renDescription')}</TooltipText></TooltipBody>
      <TooltipArrow />
    </Tooltip>
  );

  switchOffFeeInfo = () => {
    if (this.state.showRenFeeInfo) {
      this.setState({ showRenFeeInfo: false });
    }
  }

  render() {
    const { wbtcData, fromAsset, toAsset } = this.props;
    if (!isWbtcCafe(fromAsset, toAsset)) return null;
    const { maxSlippage, showRenFeeInfo } = this.state;
    const rate = wbtcData?.exchangeRate;
    const { symbol } = fromAsset;
    const rateString = rate && symbol ? `1 ${symbol} = ${rate.toFixed(4)} ${symbol === BTC ? WBTC : BTC}` : '-';
    return (
      <Container activeOpacity={1} onPress={this.switchOffFeeInfo}>
        <InfoWrapper>
          <Row disabled>
            <Label>{t('wbtcCafe.rate')}</Label>
            <Label textColor={themedColors.text}>{rateString}</Label>
          </Row>
          <Row disabled>
            <TextRow>
              <Label>{t('wbtcCafe.renFee')}</Label>
              <IconWrapper style={{ alignItems: 'center' }}>
                {showRenFeeInfo && this.getTooltip()}
                <RenFeeIcon
                  onPress={() => this.setState({ showRenFeeInfo: !showRenFeeInfo })}
                  activeOpacity={1}
                  hitSlop={hitslop10}
                >
                  <RenFeeIconText>?</RenFeeIconText>
                </RenFeeIcon>
              </IconWrapper>
            </TextRow>
            <Label>{wbtcData ? wbtcData.renVMFee.toFixed(8) : '-'}</Label>
          </Row>
          <Row disabled>
            <Label>{t('wbtcCafe.btcFee')}</Label>
            <Label>{wbtcData ? wbtcData.networkFee.toFixed(8) : '-'}</Label>
          </Row>
          <Row onPress={this.handleSlippagePress} noBorder disabled={showRenFeeInfo}>
            <Label textColor={themedColors.link}>{t('wbtcCafe.slippage')}</Label>
            <Label>{`${maxSlippage}%`}</Label>
          </Row>
        </InfoWrapper>
        <ButtonWrapper>
          <Button title="Next" onPress={this.handleNextPress} disabled={showRenFeeInfo} />
        </ButtonWrapper>
      </Container>
    );
  }
}

export default withTheme(WBTCCafeInfo);
