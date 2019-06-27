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
import { StatusBar, Platform } from 'react-native';
import styled from 'styled-components/native';
import { SafeAreaView } from 'react-navigation';
import { baseColors, fontSizes, spacing } from 'utils/variables';
import { BaseText } from 'components/Typography';
import IconButton from 'components/IconButton';

type Props = {
  style?: Object,
  color?: string,
  title?: string,
  subtitle?: string,
  fontColor?: string,
  onClose?: Function,
  subtitleAddon?: React.Node,
  rightSideAddon?: React.Node,
}

const Wrapper = styled.View`
  width: 100%;
  background-color: ${props => props.color || 'transparent'};
`;

const HeaderContentWrapper = styled.View`
  padding: ${spacing.large}px;
`;

const SafeArea = styled(SafeAreaView)`
  ${props => props.androidStatusbarHeight ? `margin-top: ${props.androidStatusbarHeight}px` : ''};
`;

const HeaderRow = styled.View`
  flex-direction: row;
  align-items: flex-start;
  justify-content: space-between;
`;

const TitleWrapper = styled.View`
  flex: 1;
`;

const RightSide = styled.View`
`;

const SubtitleRow = styled.View`
  flex-direction: row;
  margin-top: ${props => props.marginTop ? '4px' : 0};
  flex-wrap: wrap;
  width: 100%;
  align-items: center;
`;

const Title = styled(BaseText)`
  width: 100%;
  line-height: ${fontSizes.small};
  font-size: ${fontSizes.extraSmall}px;
  color: ${props => props.fontColor};
  font-weight: ${Platform.select({
    ios: '500',
    android: '400',
  })};
`;

const SubTitle = styled(BaseText)`
  line-height: ${fontSizes.small};
  font-size: ${fontSizes.extraSmall}px;
  color: ${props => props.fontColor};
  font-weight: ${Platform.select({
    ios: '500',
    android: '400',
  })};
  opacity: ${Platform.select({
    ios: 0.5,
    android: 0.4,
  })};
  marginRight: ${props => props.marginRight ? `${spacing.medium}px` : 0}
`;

const HeaderIcon = styled(IconButton)`
  height: 40px;
  width: 40px;
  padding-right: 10px;
  margin-right: -10px;
  margin-top: -12px;
`;


const HeaderBlock = (props: Props) => {
  const {
    style,
    color,
    title,
    subtitle,
    fontColor = baseColors.white,
    onClose,
    subtitleAddon,
    rightSideAddon,
  } = props;
  return (
    <Wrapper style={style} color={color}>
      <SafeArea forceInset={{ bottom: 'never' }} androidStatusbarHeight={StatusBar.currentHeight}>
        <HeaderContentWrapper>
          <HeaderRow>
            <TitleWrapper>
              <Title fontColor={fontColor}>{title}</Title>
              <SubtitleRow marginTop={!!subtitle || !!subtitleAddon}>
                {!!subtitle && <SubTitle fontColor={fontColor} marginRight={!!subtitleAddon}>{subtitle}</SubTitle>}
                {subtitleAddon}
              </SubtitleRow>
            </TitleWrapper>
            <RightSide>
              {rightSideAddon}
              {onClose &&
                <HeaderIcon
                  icon="close"
                  color={fontColor}
                  onPress={onClose}
                  fontSize={fontSizes.extraExtraSmall}
                  horizontalAlign="flex-end"
                />
              }
            </RightSide>
          </HeaderRow>
        </HeaderContentWrapper>
      </SafeArea>
    </Wrapper>
  );
};

export default HeaderBlock;
