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
import styled from 'styled-components/native';
import { useNavigation } from 'react-navigation-hooks';
import { BigNumber } from 'bignumber.js';

// Components
import Icon from 'components/core/Icon';
import Text from 'components/core/Text';
import TokenIcon from 'components/display/TokenIcon';

// Hooks
import { useAssetRates } from 'hooks/transactions';

// Utils
import { appFont, fontStyles, spacing } from 'utils/variables';
import { useThemeColors } from 'utils/themes';
import { getAssetValueInFiat } from 'utils/rates';
import { formatFiatValue } from 'utils/format';
import { chainFromChainId } from 'utils/chains';

// Selectors
import { useExchangeNotification, useFiatCurrency } from 'selectors';
import { STATUS, useTimer } from 'hooks/timer';

export default function () {
  const response = useExchangeNotification();

  if (!response?.[0]) return null;

  return response.map((notificationData, index) => (
    <ExchangeNotificationContainer data={notificationData} index={index} />
  ));
}

const ExchangeNotificationContainer = ({ data, index }) => {
  const colors = useThemeColors();
  const navigation = useNavigation();
  const [isVisible, setIsVisible] = React.useState(true);
  const [timerStatus, setTimerStatus] = React.useState(STATUS.STARTED);

  const time = useTimer(timerStatus, setTimerStatus);

  const { fromAmount, toAmount, fromAsset, captureFee, toAsset, gasFeeAsset, feeInfo } = data.offer;

  if (fromAsset?.chainId) {
    fromAsset.chain = chainFromChainId[fromAsset.chainId];
  }
  if (toAsset?.chainId) {
    toAsset.chain = chainFromChainId[toAsset.chainId];
  }

  const fromRates = useAssetRates(fromAsset.chain, fromAsset);
  const toRates = useAssetRates(toAsset.chain, toAsset);
  const gasFeeRates = useAssetRates(gasFeeAsset.chain, gasFeeAsset);
  const currency = useFiatCurrency();

  const decimalValue: any = `10e${gasFeeAsset?.decimals - 1}`;
  const gasFee: any = parseInt(feeInfo.fee) / (decimalValue ?? 1);

  const fromFiatValue = getAssetValueInFiat(fromAmount, fromAsset?.address, fromRates, currency) ?? new BigNumber(0);
  const fromFormattedFiatValue = formatFiatValue(fromFiatValue, currency);
  const toFiatValue = getAssetValueInFiat(toAmount, toAsset?.address, toRates, currency) ?? new BigNumber(0);
  const toFormattedFiatValue = formatFiatValue(toFiatValue, currency);
  const gasFeeFiatValue = getAssetValueInFiat(gasFee, gasFeeAsset?.address, gasFeeRates, currency) ?? new BigNumber(0);
  const gasFeeFormattedFiatValue = formatFiatValue(gasFeeFiatValue, currency);

  if (!isVisible) return null;
  return (
    <TouchableContainer key={index} onPress={() => {}}>
      <HorizontalContainer>
        <Summary>
          <HorizontalContainer style={{ justifyContent: 'flex-start', paddingLeft: 0, paddingTop: 0 }}>
            <Title>
              {'Selling ' + fromAmount?.toFixed(4) + ' ' + fromAsset.symbol}
              <TokenIcon
                url={fromAsset?.logoURI || fromAsset?.iconUrl}
                size={18}
                style={{ paddingHorizontal: 7, paddingTop: 5 }}
              />
              <SubText>{'(' + fromFormattedFiatValue + ') on'}</SubText>
              <Icon name={fromAsset.chain} width={18} height={18} style={{ paddingHorizontal: 7, paddingTop: 5 }} />
            </Title>
          </HorizontalContainer>
          <HorizontalContainer style={{ justifyContent: 'flex-start', paddingLeft: 0, paddingTop: 0 }}>
            <Title>
              {'for ' + toAmount?.toFixed(4) + ' ' + toAsset.symbol}
              <TokenIcon
                url={toAsset?.logoURI || toAsset?.iconUrl}
                size={18}
                style={{ paddingHorizontal: 7, paddingTop: 5 }}
              />
              <SubText>{'(' + toFormattedFiatValue + ') on'}</SubText>
              <Icon
                name={toAsset.chain}
                width={18}
                height={18}
                style={{ paddingHorizontal: 7, paddingTop: 7, justifyContent: 'center' }}
              />
            </Title>
          </HorizontalContainer>
        </Summary>
        <ButtonContainer onPress={() => setIsVisible(false)}>
          <Icon color={colors.control} name={'close'} width={30} height={30} style={{}} />
        </ButtonContainer>
      </HorizontalContainer>
      <Line />
      <HorizontalContainer>
        <SubText>{'Time: ' + time}</SubText>
        <SubText style={{ marginRight: '20%' }}>{'Gas: ' + gasFeeFormattedFiatValue}</SubText>
        <ButtonContainer onPress={() => {}}>
          <Icon color={colors.control} name={'info'} width={24} height={24} style={{}} />
        </ButtonContainer>
      </HorizontalContainer>
    </TouchableContainer>
  );
};

const TouchableContainer = styled.TouchableOpacity`
  min-height: 120px;
  background-color: ${({ theme }) => theme.colors.synthetic180};
  border-radius: 16px;
  margin: ${spacing.mediumLarge}px;
`;

const ButtonContainer = styled.TouchableOpacity`
  align-self: flex-start;
`;

const Summary = styled.View`
  padding: 4px;
`;

const Line = styled.View`
  width: 100%;
  height: 1;
  background-color: ${({ theme }) => theme.colors.background};
`;

const HorizontalContainer = styled.View`
  flex-direction: row;
  align-items: center;
  padding: 12px;
  justify-content: space-between;
`;

const Title = styled(Text)`
  ${fontStyles.medium};
  font-family: '${appFont.regular}';
  color: ${({ theme }) => theme.colors.control}; ;
`;

const SubText = styled(Text)`
  font-family: '${appFont.regular}';
  color: ${({ theme }) => theme.colors.control}; ;
`;
