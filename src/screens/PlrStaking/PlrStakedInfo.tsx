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
import { BigNumber, ethers } from 'ethers';
import styled from 'styled-components/native';

// Selectors
import { useFiatCurrency, useChainRates } from 'selectors';

// Utils
import { getBalanceInFiat } from 'utils/assets';
import { formatFiatValue } from 'utils/format';
import { fontStyles } from 'utils/variables';

// Components
import Text from 'components/core/Text';
import Icon from 'components/core/Icon';
import { Spacing } from 'components/legacy/Layout';
import { StyleProp } from 'react-native';

interface IStakedInfoTitles {
  pillarStaking: string;
  onEthereum: string;
  rewards: string;
}

interface IPlrStakedInfo {
  titles: IStakedInfoTitles;
  formattedStakedAmount?: string;
  formattedFiatAmount?: string;
  formattedRewardsAmount?: string;
}

const PlrStakedInfo: React.FC<IPlrStakedInfo> = ({
  titles,
  formattedStakedAmount,
  formattedFiatAmount,
  formattedRewardsAmount,
}) => {
  return (
    <Container>
      <IconContainer>
        <Icon name="plr32" />
        <IconSmallWrapper>
          <Icon name="ethereum16" />
        </IconSmallWrapper>
      </IconContainer>

      <Spacing w={8} />

      <InfoCol>
        <InfoRow>
          <MainText>{titles.pillarStaking}</MainText>
          <ValueText bold>{formattedStakedAmount}</ValueText>
        </InfoRow>

        <InfoRow>
          <SubText>{titles.onEthereum}</SubText>
          <ValueText sub>{formattedFiatAmount}</ValueText>
        </InfoRow>

        <InfoRow>
          <SubText>{titles.rewards}</SubText>
          <ValueText success>{formattedRewardsAmount}</ValueText>
        </InfoRow>
      </InfoCol>
    </Container>
  );
};

const Container = styled.View`
  display: flex;
  flex-direction: row;
  background-color: ${({ theme }) => theme.colors.basic050};
  padding: 10px 16px 12px;

  border-width: 1px;
  border-radius: 12px;
  border-color: ${({ theme }) => theme.colors.plrStakingAlt};
`;

const IconContainer = styled.View`
  display: flex;
  position: relative;
`;

const IconSmallWrapper = styled.View`
  position: absolute;
  top: 0;
  right: 0;
  border: 1px solid ${({ theme }) => theme.colors.basic050};
  border-radius: 50px;
`;

const InfoCol = styled.View`
  display: flex;
  flex: 1;
  flex-direction: column;
`;

const InfoRow = styled.View`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
`;

const MainText = styled(Text)`
  ${fontStyles.medium};
  color: ${({ theme }) => theme.colors.basic000};
`;

const SubText = styled(Text)`
  ${fontStyles.regular};
  color: ${({ theme }) => theme.colors.basic010};
`;

const ValueText = styled(Text)<{ bold?: boolean; success?: boolean; sub?: boolean }>`
  ${fontStyles.medium};
  color: ${({ theme, success, sub }) =>
    success ? theme.colors.positive : sub ? theme.colors.basic010 : theme.colors.basic000};
  ${({ bold }) => bold && `font-weight: 500;`};
`;

export default PlrStakedInfo;
