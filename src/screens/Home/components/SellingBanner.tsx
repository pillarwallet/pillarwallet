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
import React, { FC } from 'react';
import styled, { withTheme } from 'styled-components/native';
import { useNavigation } from 'react-navigation-hooks';

// Components
import Icon from 'components/core/Icon';
import { Spacing } from 'components/legacy/Layout';
import Text from 'components/core/Text';

// Types
import type { Theme } from 'models/Theme';

// Utils
import { appFont, fontStyles, spacing } from 'utils/variables';
import { getThemeColors, useThemeColors } from 'utils/themes';
import { openUrl } from 'utils/inAppBrowser';
import { isValidURL } from 'utils/validators';
import { reportOrWarn } from 'utils/common';

// Constants
import * as RoutePath from 'constants/navigationConstants';

// Selectors
import { useRootSelector, bannerDataSelector } from 'selectors';

export default function () {
  const response = [
    { id: 1, name: 'abc' },
    { id: 2, name: 'abc' },
  ];

  if (!response) return null;

  return response.map((bannerData, index) => <MultiSellingBannerContainer index={index} />);
}

const MultiSellingBannerContainer = ({ index }) => {
  const colors = useThemeColors();
  const navigation = useNavigation();
  const [isVisible, setIsVisible] = React.useState(true);

  if (!isVisible) return null;
  return (
    <TouchableContainer key={index} onPress={() => {}}>
      <HorizontalContainer>
        <Summary>
          <HorizontalContainer style={{ justifyContent: 'flex-start', paddingLeft: 0, paddingTop: 0 }}>
            <Title>{'Selling 0.12 USDC'}</Title>
            <Icon name={'polygon'} width={20} height={20} style={{ paddingHorizontal: 7 }} />
            <SubText>{'($0.01) on'}</SubText>
            <Icon name={'optimism'} width={20} height={20} style={{ justifyContent: 'center', paddingHorizontal: 7 }} />
          </HorizontalContainer>
          <HorizontalContainer style={{ justifyContent: 'flex-start', paddingLeft: 0, paddingTop: 0 }}>
            <Title>{'for 0.12 USDC'}</Title>
            <Icon name={'xdai'} width={20} height={20} style={{ paddingHorizontal: 7 }} />
            <SubText>{'($0.01) on'}</SubText>
            <Icon name={'binance'} width={20} height={20} style={{ justifyContent: 'center', paddingHorizontal: 7 }} />
          </HorizontalContainer>
        </Summary>
        <CloseButtonContainer>
          <Icon color={colors.control} name={'close'} width={30} height={30} style={{}} />
        </CloseButtonContainer>
      </HorizontalContainer>
      <Line />
      <HorizontalContainer>
        <SubText>{'Time: 30'}</SubText>
        <SubText style={{ marginRight: '20%' }}>{'Gas: $0.30'}</SubText>
        <CloseButtonContainer>
          <Icon color={colors.control} name={'info'} width={24} height={24} style={{}} />
        </CloseButtonContainer>
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

const CloseButtonContainer = styled.TouchableOpacity`
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

const CloseContainer = styled.TouchableOpacity`
  padding: 8px 8px 10px 10px;
  position: absolute;
  top: 0px;
  right: 0px;
`;
