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

// import { getBTCDepositMint } from 'services/wbtcCafe';

import t from 'translations/translate';

type Props = {
  rate?: number | String,
  renFee?: number,
  btcFee?: number,
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
    // const mint = getBTCDepositMint('', 0.00001);
  }

  render() {
    const { rate, renFee, btcFee } = this.props;
    const { maxSlippage } = this.state;
    return (
      <Container>
        <InfoWrapper>
          <Row disabled>
            <Label>{t('wbtcCafe.rate')}</Label>
            <Label textColor={themedColors.text}>{rate || '-'}</Label>
          </Row>
          <Row disabled>
            <Label>{t('wbtcCafe.renFee')}</Label>
            <Label>{renFee || '-'}</Label>
          </Row>
          <Row disabled>
            <Label>{t('wbtcCafe.btcFee')}</Label>
            <Label>{btcFee || '-'}</Label>
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
