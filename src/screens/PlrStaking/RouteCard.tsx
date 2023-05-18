// @flow
/*
    Pillar Wallet: the personal data locker
    Copyright (C) 2021 Stiftung Pillar Project

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

import React, { FC } from 'react';
import styled from 'styled-components/native';

// Constants
import { OFFERS } from 'constants/exchangeConstants';

// Utils
import { fontStyles } from 'utils/variables';

// Types
import type { AssetOption } from 'models/Asset';
import type { Chain } from 'models/Chain';
import type { TransactionFeeInfo } from 'models/Transaction';

// Components
import TokenIcon from 'components/display/TokenIcon';
import { TableFee } from 'components/legacy/Table';
import RadioButton from 'components/RadioButton';
import Text from 'components/core/Text';

interface IRouteCard {
  offer?: any;
  selected?: boolean;
  chain?: Chain;
  plrToken?: AssetOption;
  formattedToAmount?: string;
  formattedFromAmount?: string;
  networkName?: string;
  providerConfig?: any;
  feeInfo?: any;
  highFee?: boolean;
  onSelectOffer?: (offer: any, feeInfo: TransactionFeeInfo | null) => void;
  disabled?: boolean;
}

const RouteCard: FC<IRouteCard> = ({
  offer,
  selected,
  chain,
  plrToken,
  formattedToAmount,
  formattedFromAmount,
  networkName,
  providerConfig: config,
  feeInfo,
  highFee,
  onSelectOffer,
  disabled,
}) => {
  return (
    <RouteWrapper>
      <RouteContainer onPress={() => onSelectOffer?.(offer, feeInfo)} disabled={disabled || !onSelectOffer}>
        <IconWrapper>{plrToken && <TokenIcon url={plrToken?.iconUrl} size={48} chain={plrToken?.chain} />}</IconWrapper>

        <RouteInfoWrapper>
          <RouteInfoRow>
            <MainText>{formattedToAmount}</MainText>
            <MainText highlighted>{`on ${networkName}`}</MainText>
          </RouteInfoRow>

          <RouteInfoRow>
            <SubText>
              <HighlightText>{'Est. fee: '}</HighlightText>
              <TableFee txFeeInWei={feeInfo?.fee} gasToken={feeInfo?.gasToken} chain={chain} highFee={highFee} />
            </SubText>
            <SubText>
              <HighlightText>Est. time:</HighlightText>
              {` 2 mins`}
            </SubText>
          </RouteInfoRow>
        </RouteInfoWrapper>

        <RadioButtonWrapper>
          <RadioButton type={OFFERS} visible={selected} style={{ marginRight: 0, marginLeft: 12 }} />
        </RadioButtonWrapper>
      </RouteContainer>

      <RouteBreakdownContainer>
        <IconWrapper>{config && <TokenIcon url={config.iconUrl} size={32} chain={plrToken?.chain} />}</IconWrapper>

        <RouteInfoWrapper>
          <RouteInfoRow>
            <MainText>{`Swap via ${config?.title} on ${networkName}`}</MainText>
          </RouteInfoRow>

          <RouteInfoRow>
            <MainText>{`${formattedFromAmount} → ${formattedToAmount}`}</MainText>
          </RouteInfoRow>
        </RouteInfoWrapper>
      </RouteBreakdownContainer>

      <RouteBreakdownContainer>
        <IconWrapper>{plrToken && <TokenIcon url={plrToken?.iconUrl} size={32} chain={plrToken?.chain} />}</IconWrapper>

        <RouteInfoWrapper>
          <RouteInfoRow>
            <MainText>{`Stake ${formattedToAmount} on ${networkName}`}</MainText>
          </RouteInfoRow>
        </RouteInfoWrapper>
      </RouteBreakdownContainer>
    </RouteWrapper>
  );
};

export default RouteCard;
// Routes
const RouteWrapper = styled.View`
  flex-direction: column;
`;

const RouteContainer = styled.TouchableOpacity`
  margin: 0 0 8px;
  padding: 10px 10px 12px 16px;
  border-radius: 20px;
  background-color: ${({ theme }) => theme.colors.basic050};

  display: flex;
  flex-direction: row;
  justify-content: space-between;
`;

const RouteBreakdownContainer = styled.View`
  margin: 0 0 8px;
  padding: 10px;
  border-radius: 20px;
  background-color: ${({ theme }) => theme.colors.basic050};

  display: flex;
  flex-direction: row;
  justify-content: space-between;
`;

const IconWrapper = styled.View`
  align-items: center;
  justify-content: center;
`;

const RouteInfoWrapper = styled.View`
  display: flex;
  flex: 1;
  flex-direction: column;
  padding-left: 16px;
  justify-content: center;
`;

const RouteInfoRow = styled.View`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
`;

const MainText = styled(Text).attrs((props: { highlighted?: boolean }) => props)`
  ${fontStyles.medium};

  color: ${({ theme, highlighted }) => (highlighted ? theme.colors.plrStakingHighlight : theme.colors.basic000)};
`;

const SubText = styled(Text).attrs((props: { highlighted?: boolean }) => props)`
  ${fontStyles.regular};

  color: ${({ theme, highlighted }) => (highlighted ? theme.colors.plrStakingHighlight : theme.colors.basic000)};
`;

const RadioButtonWrapper = styled.View`
  display: flex;
  justify-content: center;
  align-items: center;
`;

const HighlightText = styled(Text)`
  color: ${({ theme }) => theme.colors.plrStakingHighlight};
`;
