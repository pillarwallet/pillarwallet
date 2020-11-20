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
import { Clipboard } from 'react-native';
import styled, { withTheme } from 'styled-components/native';
import type { NavigationScreenProp } from 'react-navigation';
import t from 'translations/translate';

// components
import { BaseText } from 'components/Typography';
import Button from 'components/Button';
import Toast from 'components/Toast';
import Modal from 'components/Modal';
import Table, { TableRow, TableAmount } from 'components/Table';

// utils
import { themedColors } from 'utils/themes';
import { fontStyles, spacing, baseColors } from 'utils/variables';

// models, constants
import type { WBTCFeesWithRate } from 'models/WBTC';
import { BTC, WBTC } from 'constants/assetsConstants';
import { EXCHANGE_CONFIRM } from 'constants/navigationConstants';

// partials
import WBTCSlippageModal from './WBTCSlippageModal';
import WBTCCafeAddress from './WBTCCafeAddress';
import { ExchangeIcon, TableWrapper } from './ConfirmationTable';
import RenFeeIcon from './RenFeeIcon';

type Props = {
  wbtcData: ?WBTCFeesWithRate,
  extendedInfo?: boolean,
  navigation?: NavigationScreenProp<*>,
  amount?: string,
  address?: string,
  error?: boolean,
}

const Row = styled.View`
  flex-direction: row;
  align-items: center;
`;

const Label = styled(BaseText)`
  ${fontStyles.regular};
  color: ${({ textColor }) => textColor || themedColors.secondaryText};
`;

const ButtonWrapper = styled.View`
  margin: 0px ${spacing.layoutSides}px 20px;
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

const WBTCCafeInfo = (props: Props) => {
  const [maxSlippage, setMaxSlippage] = useState<number>(0.5);

  const handleSlippagePress = () => Modal.open(() => (
    <WBTCSlippageModal onModalWillHide={selectedVal => setMaxSlippage(selectedVal)} />
  ));

  const {
    wbtcData, extendedInfo, navigation, amount, address, error,
  } = props;

  const handleNextPress = () => {
    if (!extendedInfo && !!navigation) {
      return navigation.navigate(EXCHANGE_CONFIRM, {
        wbtcTxData: { maxSlippage: maxSlippage / 100, amount: Number(amount) },
        wbtcEstData: wbtcData,
      });
    }
    Clipboard.setString(address || '');
    return Toast.show({ message: t('toast.addressCopiedToClipboard'), emoji: 'ok_hand' });
  };

  const getFeeNumber = () => {
    if (!wbtcData) return 0;
    const { renVMFee = 0, networkFee = 0 } = wbtcData;
    return Number(renVMFee.toFixed(5) || 0) + Number(networkFee.toFixed(5) || 0);
  };

  const getFeeInfo = () => `${wbtcData?.estimate ? getFeeNumber() : '0'} ${BTC}`;

  const getButtonTitle = () => t(`${extendedInfo ? 'wbtcCafe.copy' : 'title.confirm'}`);

  const rate = wbtcData?.exchangeRate;
  const rateString = rate ? `1 ${BTC} = ${rate.toFixed(4)} ${WBTC}` : '-';
  const buttonDisabled = error || !wbtcData?.estimate || (extendedInfo && !address);
  return (
    <TableWrapper>
      <Table>
        <TableRow>
          <Label>{t('wbtcCafe.rate')}</Label>
          <Row>
            <ExchangeIcon name="exchange" />
            <Label textColor={themedColors.text}>{rateString}</Label>
          </Row>
        </TableRow>
        {extendedInfo && (
          <TableRow>
            <Row>
              <Label>{t('wbtcCafe.renFee')}</Label>
              <RenFeeIcon />
            </Row>
            <TableAmount amount={wbtcData?.renVMFee || 0} token={BTC} />
          </TableRow>
        )}
        {extendedInfo && (
          <TableRow>
            <Label>{t('wbtcCafe.btcFee')}</Label>
            <TableAmount amount={wbtcData?.networkFee || 0} token={BTC} />
          </TableRow>
        )}
        {extendedInfo && (
          <TableRow>
            <Label>{t('transactions.label.pillarFee')}</Label>
            <Label textColor={themedColors.positive}>{t('label.free')}</Label>
          </TableRow>
        )}
        <TableRow>
          <Label>{t('wbtcCafe.slippage')}</Label>
          <Label
            onPress={handleSlippagePress}
            disabled={extendedInfo}
            textColor={extendedInfo ? null : themedColors.link}
          >
            {`${maxSlippage}%`}
          </Label>
        </TableRow>
        {extendedInfo && (
          <TableRow>
            <Label >{t('transactions.label.totalFee')}</Label>
            <TableAmount amount={getFeeNumber()} token={BTC} />
          </TableRow>
        )}
      </Table>
      {extendedInfo
      ? <WBTCCafeAddress amount={amount} address={address} error={error} />
      : (
        <FeeRow>
          <Label>{t('transactions.label.transactionFee')}</Label>
          <FeeWrapper><Fee>{getFeeInfo()}</Fee></FeeWrapper>
        </FeeRow>
      )}
      <ButtonWrapper>
        <Button title={getButtonTitle()} onPress={handleNextPress} disabled={buttonDisabled} />
      </ButtonWrapper>
    </TableWrapper>
  );
};

export default withTheme(WBTCCafeInfo);
