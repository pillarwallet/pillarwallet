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
import { StatusBar, View, TouchableOpacity, Animated } from 'react-native';
import { CachedImage } from 'react-native-cached-image';

import { fontSizes, fontStyles, spacing } from 'utils/variables';
import styled, { withTheme } from 'styled-components/native';
import { ThemeProvider } from 'styled-components';
import { SafeAreaView } from 'react-navigation';
import type { NavigationScreenProp } from 'react-navigation';
import { BaseText } from 'components/Typography';
import IconButton from 'components/IconButton';
import { getColorByTheme, getColorByThemeOutsideStyled, getThemeColors } from 'utils/themes';
import type { Theme } from 'models/Theme';

// partials
import HeaderTitleText from './HeaderTitleText';
import HeaderActionButton from './HeaderActionButton';

type NavItem = {
  [string]: any,
};

export type Props = {
  rightItems?: NavItem[],
  leftItems?: NavItem[],
  centerItems?: NavItem[],
  sideFlex?: number,
  navigation: NavigationScreenProp<*>,
  background?: string,
  floating?: boolean,
  transparent?: boolean,
  light?: boolean,
  noBack?: boolean,
  customOnBack?: () => void,
  theme: Theme,
  noPaddingTop?: boolean,
  noBottomBorder?: boolean,
  onClose?: () => void,
  leftSideFlex?: number,
  wrapperStyle?: Object,
  noHorizontalPadding?: boolean,
  forceInsetTop?: string,
  bottomBorderAnimationValue?: Animated.Value,
};

const Wrapper = styled(Animated.View)`
  width: 100%;
  border-bottom-width: 1;
  ${({ floating }) => floating && `
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
  height: 58px;
`;

const SafeArea = styled(SafeAreaView)`
  ${({ noPaddingTop, androidStatusbarHeight }) => !noPaddingTop && androidStatusbarHeight && `
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
  height: 36px;
`;

const LeftItems = styled.View`
  flex: ${props => props.sideFlex || 1};
  align-items: center;
  justify-content: flex-start;
  flex-direction: row;
  height: 36px;
`;

const RightItems = styled.View`
  flex: ${props => props.sideFlex || 1};
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
  background-color: ${getColorByTheme({ lightKey: 'basic060', darkKey: 'basic050' })}
`;

const ActionIcon = styled(IconButton)`
  position: relative;
  align-self: center;
  height: 36px;
  width: 44px;
  padding: 5px 10px;
`;

const CloseIcon = styled(IconButton)`
  position: relative;
  align-self: center;
  padding: 20px;
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

const IconImage = styled(CachedImage)`
  width: 24px;
  height: 24px;
`;

const LEFT = 'LEFT';
const CENTER = 'CENTER';
const RIGHT = 'RIGHT';
const animatedValueZero = new Animated.Value(0);

const getCloseAction = (props, navigation) => {
  if (props.onClose) return () => props.onClose();
  if (props.dismiss) return () => navigation.dismiss();
  return () => navigation.goBack(null);
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
    } = this.props;
    const colors = getThemeColors(theme);

    return (
      <HeaderRow>
        <LeftItems
          sideFlex={sideFlex || leftSideFlex}
          style={!centerItems.length && !rightItems.length && !leftSideFlex ? { flexGrow: 2 } : {}}
        >
          {(leftItems.length || !!noBack)
            ? leftItems.map((item) => this.renderSideItems(item, LEFT))
            : (
              <BackIcon
                icon="back"
                color={colors.basic010}
                onPress={customOnBack || (() => navigation.goBack(null))}
                fontSize={fontSizes.big}
              />
            )
          }
        </LeftItems>
        {!!centerItems.length &&
        <CenterItems>
          {centerItems.map((item) => this.renderSideItems(item, CENTER))}
        </CenterItems>
        }
        {(!!centerItems.length || !!rightItems.length) &&
          <RightItems sideFlex={sideFlex}>
            {rightItems.map((item) => this.renderSideItems(item, RIGHT))}
          </RightItems>
        }
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
        <View
          style={{
            ...commonStyle,
            flexDirection: 'row',
            flexWrap: 'wrap',
            ...itemStyle,
          }}
          key={item.title}
        >
          <HeaderTitleText
            style={item.color ? { color: item.color } : {}}
            onPress={item.onPress}
            centerText={type === CENTER}
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
        <View style={{ ...commonStyle, ...itemStyle, ...additionalIconStyle }} key={item.icon}>
          <ActionIcon
            icon={item.icon}
            color={item.color
              || getColorByThemeOutsideStyled(theme.current, { lightKey: 'basic010', darkKey: 'basic020' })}
            onPress={item.onPress}
            fontSize={item.fontSize || fontSizes.large}
            horizontalAlign="flex-start"
            {...additionalIconProps}
          />
          {!!item.indicator && <Indicator />}
        </View>
      );
    }
    if (item.iconSource) {
      return (
        <TouchableOpacity
          onPress={item.onPress}
          key={item.key || item.iconSource}
          style={{ ...commonStyle, ...itemStyle }}
        >
          <IconImage source={item.iconSource} />
          {!!item.indicator && <Indicator />}
        </TouchableOpacity>
      );
    }
    if (item.link) {
      return (
        <TextButton
          onPress={item.onPress}
          key={item.link}
          style={{ ...commonStyle, ...itemStyle }}
        >
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
        wrapperStyle.marginRight = -20;
        wrapperStyle.marginLeft = -(20 - spacing.small);
      }

      return (
        <View
          style={{
            ...wrapperStyle,
            marginTop: -20,
            marginBottom: -20,
            ...itemStyle,
          }}
          key="close"
        >
          <CloseIcon
            icon="close"
            color={getColorByThemeOutsideStyled(theme.current, { lightKey: 'basic010', darkKey: 'basic020' })}
            onPress={getCloseAction({ ...item, onClose }, navigation)}
            fontSize={fontSizes.regular}
            horizontalAlign="flex-end"
          />
        </View>
      );
    }
    if (item.actionButton) {
      return (<HeaderActionButton {...item.actionButton} wrapperStyle={{ ...commonStyle, ...itemStyle }} />);
    }
    if (item.custom) {
      return <View key={item.key || 'custom'} style={{ ...commonStyle, ...itemStyle }}>{item.custom}</View>;
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
      bottomBorderAnimationValue = animatedValueZero,
      noBottomBorder,
    } = this.props;
    const updatedColors = {};
    if (light) {
      updatedColors.primary = theme.colors.control;
      updatedColors.text = theme.colors.control;
    }
    const updatedTheme = { ...theme, colors: { ...theme.colors, ...updatedColors } };

    let backgroundColor;
    let borderColor;

    if (noBottomBorder || floating) {
      backgroundColor = floating ? 'transparent' : updatedTheme.colors.basic050;
      borderColor = 'transparent';
    } else {
      backgroundColor = bottomBorderAnimationValue.interpolate({
        inputRange: [0, 1],
        outputRange: [theme.colors.basic070, theme.colors.basic050],
        extrapolate: 'clamp',
      });

      const borderColorByTheme =
        getColorByThemeOutsideStyled(theme.current, { lightKey: 'basic080', darkKey: 'basic050' });

      borderColor = bottomBorderAnimationValue.interpolate({
        inputRange: [0, 1],
        outputRange: [`${borderColorByTheme}00`, borderColorByTheme],
        extrapolate: 'clamp',
      });
    }

    return (
      <ThemeProvider theme={updatedTheme}>
        <Wrapper
          floating={floating}
          style={{ backgroundColor, borderColor, ...wrapperStyle }}
        >
          <SafeArea
            forceInset={{ bottom: 'never', top: forceInsetTop }}
            noPaddingTop={noPaddingTop}
            androidStatusbarHeight={StatusBar.currentHeight}
          >
            <HeaderContentWrapper noHorizontalPadding={noHorizontalPadding}>
              {this.renderHeaderContent()}
            </HeaderContentWrapper>
          </SafeArea>
        </Wrapper>
      </ThemeProvider>
    );
  }
}

export default withTheme(HeaderBlock);
