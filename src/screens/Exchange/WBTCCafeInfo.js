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
import { Clipboard } from 'react-native';
import styled, { withTheme } from 'styled-components/native';
import type { NavigationScreenProp } from 'react-navigation';
import { BaseText } from 'components/Typography';
import Icon from 'components/Icon';
import Button from 'components/Button';
import Toast from 'components/Toast';
import { themedColors } from 'utils/themes';
import { fontStyles, spacing, UIColors, baseColors } from 'utils/variables';
import type { WBTCFeesWithRate } from 'models/WBTC';
import { BTC, WBTC } from 'constants/assetsConstants';
import { hitslop10, hitslopFull } from 'utils/common';
import Modal from 'components/Modal';
import t from 'translations/translate';
import { EXCHANGE_CONFIRM } from 'constants/navigationConstants';
import WBTCSlippageModal from './WBTCSlippageModal';
import WBTCCafeAddress from './WBTCCafeAddress';

type Props = {
  wbtcData: ?WBTCFeesWithRate,
  extendedInfo?: boolean,
  navigation?: NavigationScreenProp<*>,
  amount?: string,
  address?: string,
}

const Container = styled.TouchableOpacity`
  margin-horizontal: ${spacing.large}px;
`;

const InfoWrapper = styled.View`
  width: 100%;
  border-radius: 4;
  border-width: ${({ noBorder = false }) => noBorder ? '0px' : '1px'};
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

const FeeRow = styled.View`
  flex-direction: row;
  justify-content: center;
  align-items: center;
  width: 100%;
  margin-bottom: 15px;
`;

const FeeWrapper = styled.View`
  background-color: ${baseColors.blueYonder};
  border-radius: 10px;
  padding: 2px 10px;
  margin-left: 10px;
`;

const Fee = styled(BaseText)`
  ${fontStyles.small};
  color: ${baseColors.white};
`;

const ExchangeIcon = styled(Icon)`
  color: ${themedColors.primary};
  font-size: 16px;
  margin-right: 4px;
`;

const RateWrapper = styled.View`
  flex-direction: row;
  align-items: center;
`;

const WBTCCafeInfo = (props: Props) => {
  const [maxSlippage, setMaxSlippage] = React.useState<number>(0.5);
  const [showRenFeeInfo, setShowRenFeeInfo] = React.useState<boolean>(false);

  const handleSlippagePress = () => Modal.open(() => (
    <WBTCSlippageModal onModalWillHide={selectedVal => setMaxSlippage(selectedVal)} />
  ));

  const {
    wbtcData, extendedInfo, navigation, amount, address,
  } = props;

  const handleNextPress = () => {
    if (!extendedInfo && !!navigation) {
      return navigation.navigate(EXCHANGE_CONFIRM, {
        wbtcTxData: { maxSlippage: maxSlippage / 100, amount: Number(amount) },
        wbtcEstData: wbtcData,
      });
    }
    Clipboard.setString(address || '');
    const message = t('toast.addressCopiedToClipboard');
    Toast.show({ message, emoji: 'ok_hand' });
    return null;
  };

  const switchOffFeeInfo = () => showRenFeeInfo && setShowRenFeeInfo(false);

  const getTooltip = () => (
    <Tooltip activeOpacity={1} onPress={switchOffFeeInfo} hitSlop={hitslopFull}>
      <TooltipBody><TooltipText>{t('wbtcCafe.renDescription')}</TooltipText></TooltipBody>
      <TooltipArrow />
    </Tooltip>
  );

  const getFeeNumber = () => {
    if (!wbtcData) return 0;
    const { renVMFee = 0, networkFee = 0 } = wbtcData;
    return Number(renVMFee.toFixed(5) || 0) + Number(networkFee.toFixed(5) || 0);
  };

  const getFeeInfo = () => `${wbtcData?.estimate ? getFeeNumber() : '0'} ${BTC}`;

  const getButtonTitle = () => t(`${extendedInfo ? 'wbtcCafe.copy' : 'title.confirm'}`);

  const rate = wbtcData?.exchangeRate;
  const rateString = rate ? `1 ${BTC} = ${rate.toFixed(4)} ${WBTC}` : '-';
  const buttonDisabled = !wbtcData?.estimate || showRenFeeInfo || (extendedInfo && !address);
  return (
    <Container activeOpacity={1} onPress={switchOffFeeInfo}>
      <InfoWrapper noBorder={!extendedInfo}>
        <Row disabled>
          <Label>{t('wbtcCafe.rate')}</Label>
          <RateWrapper>
            <ExchangeIcon name="exchange" />
            <Label textColor={themedColors.text}>{rateString}</Label>
          </RateWrapper>
        </Row>
        {extendedInfo && (
          <>
            <Row disabled>
              <TextRow>
                <Label>{t('wbtcCafe.renFee')}</Label>
                <IconWrapper style={{ alignItems: 'center' }}>
                  {showRenFeeInfo && getTooltip()}
                  <RenFeeIcon
                    onPress={() => setShowRenFeeInfo(!showRenFeeInfo)}
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
            <Row disabled>
              <Label>{t('transactions.label.pillarFee')}</Label>
              <Label textColor={themedColors.positive}>{t('label.free')}</Label>
            </Row>
          </>
        )}
        <Row onPress={handleSlippagePress} noBorder disabled={extendedInfo || showRenFeeInfo}>
          <Label>{t('wbtcCafe.slippage')}</Label>
          <Label textColor={extendedInfo ? null : themedColors.link}>{`${maxSlippage}%`}</Label>
        </Row>
      </InfoWrapper>
      {extendedInfo
      ? <WBTCCafeAddress amount={amount || wbtcData.amount} address={address} />
      : (
        <FeeRow>
          <Label>{t('transactions.label.transactionFee')}</Label>
          <FeeWrapper>
            <Fee>{getFeeInfo()}</Fee>
          </FeeWrapper>
        </FeeRow>
      )}
      <ButtonWrapper>
        <Button title={getButtonTitle()} onPress={handleNextPress} disabled={buttonDisabled} />
      </ButtonWrapper>
    </Container>
  );
};

export default withTheme(WBTCCafeInfo);
