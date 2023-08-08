// @flow
/* eslint-disable */
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
import { StatusBar, View, TouchableOpacity, Animated } from 'react-native';

import { fontSizes, fontStyles, spacing, appFont } from 'utils/variables';
import styled, { ThemeProvider, withTheme } from 'styled-components/native';
import SafeAreaView from 'react-native-safe-area-view';
import type { NavigationScreenProp } from 'react-navigation';
import { BaseText } from 'components/legacy/Typography';
import IconButton from 'components/IconButton';
import SvgIcon from 'components/core/Icon';
import Image from 'components/Image';
import { getColorByTheme, getColorByThemeOutsideStyled, getThemeColors } from 'utils/themes';
import { noop, hitSlop20 } from 'utils/common';
import { Spacing } from 'components/legacy/Layout';

// types
import type { Theme } from 'models/Theme';
import type { ViewStyleProp } from 'utils/types/react-native';
import type { IconName as SvgIconName } from 'components/core/Icon';

// utils
import { images } from 'utils/images';

// local
import HeaderTitleText from 'components/HeaderBlock/HeaderTitleText';
import HeaderActionButton from 'components/HeaderBlock/HeaderActionButton';

type HeaderTitles = {
  token: string,
  chain: string,
  apy: string,
  staked: string,
  vaultFilling: string,
  stakers: string,
};

type NavItem = {|
  title?: string,
  icon?: string,
  svgIcon?: SvgIconName,
  link?: string,
  close?: boolean,
  onPress?: () => void,
  iconProps?: any,
  custom?: any,
  addon?: any,
  style?: ViewStyleProp,
  color?: string,
  fontSize?: number,
  testID?: string,
  accessibilityLabel?: string,
|};

export type OwnProps = {|
  rightItems?: NavItem[],
  leftItems?: NavItem[],
  centerItems?: NavItem[],
  sideFlex?: number,
  navigation?: NavigationScreenProp<*>,
  background?: string,
  floating?: boolean,
  transparent?: boolean,
  light?: boolean,
  noBack?: boolean,
  customOnBack?: () => void,
  noPaddingTop?: boolean,
  onClose?: () => void,
  leftSideFlex?: number,
  wrapperStyle?: Object,
  noHorizontalPadding?: boolean,
  forceInsetTop?: string,
  testIdTag?: string,
  headerTitles?: HeaderTitles,
  stakedAmount?: string,
  stakedPercentage?: string,
  stakers?: string,
  apy?: string,
|};

type Props = {|
  ...OwnProps,
  theme: Theme,
|};

const Wrapper = styled(Animated.View)`
  width: 100%;
  ${({ floating }) =>
    floating &&
    `
    position: absolute;
    top: 0;
    left: 0;
    z-index: 1;
 `}
`;

const HeaderContentWrapper = styled.View`
  padding-vertical: 10px;
  ${({ noHorizontalPadding }) => !noHorizontalPadding && `padding-horizontal: ${spacing.layoutSides}px;`}
  width: 100%;
  height: 220px;
  background-color: ${({ theme }) => theme.colors.plrStaking};
  overflow: hidden;
`;

const SafeArea = styled(SafeAreaView)`
  ${({ noPaddingTop, androidStatusbarHeight }) =>
    !noPaddingTop &&
    androidStatusbarHeight &&
    `
    margin-top: ${androidStatusbarHeight}px;
  `}
`;

const HeaderRow = styled.View`
  flex-direction: row;
  width: 100%;
  align-items: center;
  justify-content: space-between;
`;

const CenterItems = styled.View`
  flex: 4;
  padding: 0 ${spacing.medium}px;
  align-items: center;
  justify-content: center;
  flex-direction: row;
  height: 40px;
`;

const LeftItems = styled.View`
  flex: ${(props) => props.sideFlex ?? 1};
  align-items: center;
  justify-content: flex-start;
  flex-direction: row;
  height: 36px;
`;

const RightItems = styled.View`
  flex: ${(props) => props.sideFlex ?? 1};
  align-items: center;
  justify-content: flex-end;
  flex-direction: row;
  flex-wrap: wrap;
  align-content: center;
  height: 36px;
`;

const BackIcon = styled(IconButton)`
  position: relative;
  width: 36px;
  height: 36px;
  border-radius: 36px;
  background-color: ${getColorByTheme({ lightKey: 'basic060', darkKey: 'basic050' })};
`;

const ActionIcon = styled(IconButton)`
  position: relative;
  align-self: center;
  height: 36px;
  width: 44px;
  padding: 5px 10px;
`;

const ActionSvgIcon = styled(SvgIcon)`
  position: relative;
  align-self: center;
  height: 36px;
  width: 44px;
  padding: 5px 10px;
`;

const CloseIcon = styled(IconButton)`
  position: relative;
  align-self: center;
  padding: 15px;
  border-radius: 36px;
  background-color: ${getColorByTheme({ lightKey: 'basic060', darkKey: 'basic050' })};
`;

const TextButton = styled.TouchableOpacity`
  padding: 2px 0;
  flex-direction: row;
  align-items: center;
`;

const ButtonLabel = styled(BaseText)`
  ${fontStyles.regular}px;
  color: ${({ theme }) => theme.colors.basic000};
`;

const Indicator = styled.View`
  width: 8px;
  height: 8px;
  background-color: ${({ theme }) => theme.colors.indicator};
  border-radius: 4px;
  position: absolute;
  top: 0;
  right: 0;
`;

const IconImage = styled(Image)`
  width: 24px;
  height: 24px;
`;

const BackgroundImage = styled(Image)`
  width: 200px;
  height: 600px;
  position: absolute;
  top: -240px;
  right: -50px;
`;

const StakeInfoWrapper = styled.View`
  display: flex;
  flex: 1;
  padding: 12px 24px;
`;

const InfoRow = styled.View`
  flex: 1;
  display: flex;
  flex-direction: row;
`;

const InfoItem = styled.View`
  ${({ small }) => (small ? 'flex: 3' : 'flex: 4;')};
`;

const InfoTitle = styled(BaseText)`
  ${fontStyles.regular};
  color: ${({ theme }) => theme.colors.basic010};
  margin-bottom: 8px;
`;

const InfoText = styled(BaseText)`
  ${fontStyles.regular};
  color: ${({ theme, apy }) => (apy ? theme.colors.positive : theme.colors.basic000)};
  font-family: ${appFont.medium};
`;

const IconRow = styled.View`
  flex: 1;
  display: flex;
  flex-direction: row;
  align-items: center;
`;

const LEFT = 'LEFT';
const CENTER = 'CENTER';
const RIGHT = 'RIGHT';

const getCloseAction = (props, navigation) => {
  if (props.onClose) return () => props.onClose?.();
  if (props.dismiss) return navigation ? () => navigation.dismiss() : noop;
  return navigation ? () => navigation.goBack(null) : noop;
};

class HeaderBlock extends React.Component<Props> {
  renderHeaderContent = () => {
    const {
      rightItems = [],
      sideFlex,
      leftItems = [],
      centerItems = [],
      navigation,
      noBack,
      customOnBack,
      theme,
      leftSideFlex,
      testIdTag,
    } = this.props;
    const colors = getThemeColors(theme);

    return (
      <HeaderRow>
        <LeftItems
          sideFlex={sideFlex ?? leftSideFlex}
          style={!centerItems.length && !rightItems.length && !leftSideFlex ? { flexGrow: 2 } : {}}
        >
          {leftItems.length || !!noBack ? (
            leftItems.map((item) => this.renderSideItems(item, LEFT))
          ) : (
            <BackIcon
              icon="back"
              color={colors.basic010}
              onPress={customOnBack || (() => navigation && navigation.goBack(null))}
              fontSize={fontSizes.big}
              testID={testIdTag && `${TAG}-${testIdTag}-button-left_back`}
              accessibilityLabel={testIdTag && `${TAG}-${testIdTag}-button-left_back`}
            />
          )}
        </LeftItems>
        {!!centerItems.length && (
          <CenterItems>{centerItems.map((item) => this.renderSideItems(item, CENTER))}</CenterItems>
        )}
        {(!!centerItems.length || !!rightItems.length) && (
          <RightItems sideFlex={sideFlex}>{rightItems.map((item) => this.renderSideItems(item, RIGHT))}</RightItems>
        )}
      </HeaderRow>
    );
  };

  renderSideItems = (item, type = '') => {
    const { navigation, theme, onClose } = this.props;
    const { style: itemStyle = {} } = item;
    const commonStyle = {};
    if (type === RIGHT && !item.noMargin) commonStyle.marginLeft = spacing.small;
    if (item.title) {
      return (
        <View style={[commonStyle, itemStyle]} key={item.title}>
          <HeaderTitleText
            style={item.color ? { color: item.color } : {}}
            onPress={item.onPress}
            centerText={type === CENTER}
            testID={item.testID}
            accessibilityLabel={item.accessibilityLabel}
          >
            {item.title}
          </HeaderTitleText>
        </View>
      );
    }
    if (item.icon) {
      const additionalIconStyle = {};
      const additionalIconProps = item.iconProps || {};
      if (type === LEFT) additionalIconStyle.marginLeft = -10;
      if (type === RIGHT) additionalIconStyle.marginRight = -10;
      return (
        <View style={[commonStyle, itemStyle, additionalIconStyle]} key={item.icon}>
          <ActionIcon
            icon={item.icon}
            color={
              item.color || getColorByThemeOutsideStyled(theme.current, { lightKey: 'basic010', darkKey: 'basic020' })
            }
            onPress={item.onPress}
            fontSize={item.fontSize || fontSizes.large}
            horizontalAlign="flex-start"
            {...additionalIconProps}
          />
          {!!item.indicator && <Indicator />}
        </View>
      );
    }
    if (item.svgIcon) {
      const additionalIconStyle = {};
      const additionalIconProps = item.iconProps || {};
      const buttonStyle = { paddingVertical: 2, paddingRight: 0, paddingLeft: 0 };
      if (type === LEFT) {
        additionalIconStyle.marginLeft = -10;
        buttonStyle.paddingRight = 15;
      }
      if (type === RIGHT) {
        additionalIconStyle.marginRight = -10;
        buttonStyle.paddingLeft = 15;
      }
      return (
        <View style={[commonStyle, itemStyle, additionalIconStyle]} key={item.svgIcon}>
          <TouchableOpacity onPress={item.onPress} hitSlop={hitSlop20} style={buttonStyle}>
            <ActionSvgIcon
              name={item.svgIcon}
              color={
                item.color || getColorByThemeOutsideStyled(theme.current, { lightKey: 'basic010', darkKey: 'basic020' })
              }
              horizontalAlign="flex-start"
              {...additionalIconProps}
            />
          </TouchableOpacity>
          {!!item.indicator && <Indicator />}
        </View>
      );
    }
    if (item.iconSource) {
      return (
        <TouchableOpacity onPress={item.onPress} key={item.key || item.iconSource} style={[commonStyle, itemStyle]}>
          <IconImage source={item.iconSource} />
          {!!item.indicator && <Indicator />}
        </TouchableOpacity>
      );
    }
    if (item.link) {
      return (
        <TextButton onPress={item.onPress} key={item.link} style={[commonStyle, itemStyle]}>
          <ButtonLabel maxFontSizeMultiplier={1.1}>{item.link}</ButtonLabel>
          {item.addon}
        </TextButton>
      );
    }
    if (item.close) {
      const wrapperStyle = {};
      if (type === LEFT) {
        wrapperStyle.marginLeft = -20;
        wrapperStyle.marginRight = -(20 - spacing.small);
      }
      if (type === RIGHT) {
        // not sure what's the full scope of this, but below causes close button to be moved too far right when in modal
        // wrapperStyle.marginRight = -20;

        wrapperStyle.marginLeft = -(20 - spacing.small);
      }

      return (
        <View
          style={[
            wrapperStyle,
            {
              marginTop: -20,
              marginBottom: -20,
              paddingLeft: 20,
            },
            itemStyle,
          ]}
          key="close"
        >
          <CloseIcon
            icon="close"
            color={getColorByThemeOutsideStyled(theme.current, {
              lightKey: 'basic010',
              darkKey: 'basic020',
            })}
            onPress={getCloseAction({ ...item, onClose }, navigation)}
            fontSize={fontSizes.small}
            horizontalAlign="flex-end"
          />
        </View>
      );
    }
    if (item.actionButton) {
      return <HeaderActionButton {...item.actionButton} wrapperStyle={[commonStyle, itemStyle]} />;
    }
    if (item.custom) {
      return (
        <TouchableOpacity key={item.key || 'custom'} style={[commonStyle, itemStyle]} onPress={item.onPress}>
          {item.custom}
        </TouchableOpacity>
      );
    }
    return null;
  };

  render() {
    const {
      floating,
      theme,
      light,
      noPaddingTop,
      wrapperStyle,
      noHorizontalPadding,
      forceInsetTop = 'always',
      stakedAmount,
      stakedPercentage,
      stakers,
      headerTitles,
      apy,
    } = this.props;
    const updatedColors = {};
    if (light) {
      updatedColors.primary = theme.colors.control;
      updatedColors.text = theme.colors.control;
    }
    const updatedTheme = { ...theme, colors: { ...theme.colors, ...updatedColors } };

    const backgroundColor = theme.colors.basic070;

    const { plrStakingBg } = images(theme);

    return (
      <ThemeProvider theme={updatedTheme}>
        <Wrapper floating={floating} style={{ backgroundColor, ...wrapperStyle }}>
          <SafeArea
            forceInset={{ bottom: 'never', top: forceInsetTop }}
            noPaddingTop={noPaddingTop}
            androidStatusbarHeight={StatusBar.currentHeight}
          >
            <HeaderContentWrapper noHorizontalPadding={noHorizontalPadding}>
              {this.renderHeaderContent()}

              <StakeInfoWrapper>
                <InfoRow>
                  <InfoItem small>
                    <InfoTitle>{headerTitles?.token}</InfoTitle>
                    <IconRow>
                      <SvgIcon name="plr24" />
                      <Spacing w={8} />
                      <InfoText>PLR</InfoText>
                    </IconRow>
                  </InfoItem>

                  <InfoItem>
                    <InfoTitle>{headerTitles?.chain}</InfoTitle>
                    <IconRow>
                      <SvgIcon name="ethereum" />
                      <Spacing w={8} />
                      <InfoText>Ethereum</InfoText>
                    </IconRow>
                  </InfoItem>

                  <InfoItem>
                    <InfoTitle>{headerTitles?.apy}</InfoTitle>
                    <InfoText apy>{`${apy || `0%`}`}</InfoText>
                  </InfoItem>
                </InfoRow>

                <Spacing h={30} />

                <InfoRow>
                  <InfoItem small>
                    <InfoTitle>{headerTitles?.staked}</InfoTitle>
                    <InfoText>{stakedAmount || 0}</InfoText>
                  </InfoItem>

                  <InfoItem>
                    <InfoTitle>{headerTitles?.vaultFilling}</InfoTitle>
                    <InfoText>{`${stakedPercentage || 0}%`}</InfoText>
                  </InfoItem>

                  <InfoItem>
                    <InfoTitle>{headerTitles?.stakers}</InfoTitle>
                    <InfoText>{stakers || 0}</InfoText>
                  </InfoItem>
                </InfoRow>
              </StakeInfoWrapper>

              <BackgroundImage source={plrStakingBg} resizeMode="contain" />
            </HeaderContentWrapper>
          </SafeArea>
        </Wrapper>
      </ThemeProvider>
    );
  }
}

export default (withTheme(HeaderBlock): React.AbstractComponent<OwnProps>);

const TAG = 'HeaderBlock';
