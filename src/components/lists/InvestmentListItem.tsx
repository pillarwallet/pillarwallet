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

import * as React from 'react';
import { TouchableOpacity, SectionList } from 'react-native';

import styled from 'styled-components/native';
import { useTranslation } from 'react-i18next';

// Components
import Text from 'components/core/Text';
import TokenIcon from 'components/display/TokenIcon';
import Icon from 'components/core/Icon';

// Utils
import { fontStyles, spacing } from 'utils/variables';
import { useChainConfig } from 'utils/uiConfig';
import { formatFiatValue } from 'utils/format';
import { sortInvestmentPositions } from 'utils/assets';
import { useThemeColors } from 'utils/themes';
import { fiatInvestmentBalance } from 'utils/rates';

// Constants
import { CHAIN } from 'constants/chainConstants';

// Selector
import { useFiatCurrency, useChainRates } from 'selectors';

// Types
import type { ViewStyleProp } from 'utils/types/react-native';
import type { Chain } from 'models/Chain';

type Props = {
  network: Chain;
  name: string;
  position: number;
  logoURI: string;
  balance?: number;
  onPress?: () => void;
  style?: ViewStyleProp;
  positionsInfo?: any[];
  isSelected?: boolean;
};

/**
 * Standard investment list item displaying network, name, balance, logoURI, and position.
 */
export default function ({
  isSelected,
  network,
  name,
  balance,
  onPress,
  positionsInfo,
  style,
  logoURI,
  position,
}: Props) {
  const { t } = useTranslation();

  const config = useChainConfig(network || CHAIN.ETHEREUM);
  const currency = useFiatCurrency();
  const colors = useThemeColors();
  const ethereumRates = useChainRates(CHAIN.ETHEREUM);

  const networkName = network ? config.title : undefined;
  const balanceInFiat = formatFiatValue(balance, currency);

  const positionsSection = sortInvestmentPositions(positionsInfo);

  const renderSectionHeader = ({ metaType }: any) => {
    if (!metaType) return null;

    const title = metaType?.charAt(0)?.toUpperCase() + metaType?.slice(1);
    return (
      <TitleContainer>
        <HeaderTitle numberOfLines={1}>{title}</HeaderTitle>
      </TitleContainer>
    );
  };

  const renderItem = (item) => {
    const { logoURI: positionImgUri, name: positionName, balance: positionBalance } = item;
    const positionBalanceInFiat = fiatInvestmentBalance(positionBalance, ethereumRates, currency);
    const balanceWithCurrency = formatFiatValue(positionBalanceInFiat, currency);

    return (
      <MainContainer>
        <Container disabled>
          <TokenIcon url={positionImgUri} chain={network} setMarginRight />

          <TitleContainer>
            <Title numberOfLines={1}>{positionName}</Title>
          </TitleContainer>

          <BalanceWrapper>
            <BalanceFiatValue numberOfLines={1}>{balanceWithCurrency}</BalanceFiatValue>
          </BalanceWrapper>
        </Container>
      </MainContainer>
    );
  };

  const getItemKey = (item) => {
    const { name, balance } = item;
    return name + balance;
  };

  return (
    <MainContainer>
      <Container onPress={onPress} style={style} hitSlop={{ top: spacing.medium, bottom: spacing.medium }}>
        <TokenIcon url={logoURI} chain={network} setMarginRight />

        <TitleContainer>
          <Title numberOfLines={1}>{name}</Title>
          {!!network && <Subtitle numberOfLines={1}>{t('label.on_network', { network: networkName })}</Subtitle>}
        </TitleContainer>

        <BalanceWrapper>
          <BalanceFiatValue numberOfLines={1}>{balanceInFiat}</BalanceFiatValue>
          <PositionValue numberOfLines={1}>{t('label.on_position', { position })}</PositionValue>
        </BalanceWrapper>

        <Icon name={isSelected ? 'up-arrow' : 'down-arrow'} width={16} height={16} />
      </Container>

      {isSelected && (
        <SectionList
          sections={positionsSection}
          scrollEnabled={false}
          style={{ backgroundColor: colors.basic050 }}
          keyExtractor={getItemKey}
          renderSectionHeader={({ section }) => renderSectionHeader(section)}
          renderItem={({ item }) => renderItem(item)}
        />
      )}
    </MainContainer>
  );
}

const MainContainer = styled.View``;

const Container = styled(TouchableOpacity)`
  flex-direction: row;
  align-items: center;
  min-height: 76px;
  margin-horizontal: 20px;
`;

const TitleContainer = styled.View`
  flex: 1;
  justify-content: center;
  padding-left: 10px;
`;

const HeaderTitle = styled(Text)`
  ${fontStyles.medium};
  padding: 12px 10px 5px;
`;

const Title = styled(Text)`
  ${fontStyles.medium};
`;

const Subtitle = styled(Text)`
  color: ${({ theme }) => theme.colors.secondaryText};
`;

const BalanceWrapper = styled.View`
  margin-left: ${spacing.medium}px;
  justify-content: flex-end;
  align-items: flex-end;
  margin-right: 20px;
`;

const BalanceFiatValue = styled(Text)`
  ${fontStyles.medium};
  font-variant: tabular-nums;
`;

const PositionValue = styled(Text)`
  color: ${({ theme }) => theme.colors.secondaryText};
  font-variant: tabular-nums;
`;
