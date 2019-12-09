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
import { StatusBar, View, TouchableOpacity } from 'react-native';
import { CachedImage } from 'react-native-cached-image';

import { fontSizes, fontStyles, spacing } from 'utils/variables';
import styled, { withTheme } from 'styled-components/native';
import { ThemeProvider } from 'styled-components';
import { SafeAreaView } from 'react-navigation';
import type { NavigationScreenProp } from 'react-navigation';
import { BaseText, MediumText } from 'components/Typography';
import IconButton from 'components/IconButton';
import { connect } from 'react-redux';
import ProfileImage from 'components/ProfileImage';
import { MANAGE_USERS_FLOW } from 'constants/navigationConstants';
import { responsiveSize } from 'utils/ui';
import { getThemeColors } from 'utils/themes';
import type { Theme } from 'models/Theme';

// partials
import { HeaderActionButton } from './HeaderActionButton';

type Props = {
  rightItems?: Object[],
  leftItems?: Object[],
  centerItems?: Object[],
  sideFlex?: number,
  user: Object,
  navigation: NavigationScreenProp<*>,
  background?: string,
  floating?: boolean,
  transparent?: boolean,
  light?: boolean,
  noBack?: boolean,
  customOnBack?: Function,
  theme: Theme,
  noPaddingTop?: boolean,
  noBottomBorder?: boolean,
}

const Wrapper = styled.View`
  width: 100%;
  background-color: ${({ theme }) => theme.colors.surface};
  ${({ noBottomBorder, theme }) => !noBottomBorder && `
    border-bottom-width: 1;
    border-bottom-color: ${theme.colors.border};
  `}
  ${({ floating }) => floating && `
    position: absolute;
    top: 0;
    left: 0;
    z-index: 1;
 `}
`;

const HeaderContentWrapper = styled.View`
  padding: 15px ${spacing.large}px;
  width: 100%;
  min-height: 58px;
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

const HeaderProfileImage = styled(ProfileImage)``;

const HeaderTitle = styled(MediumText)`
  font-size: ${fontSizes.medium}px;
  line-height: 26px;
  color: ${({ theme }) => theme.colors.text};
  text-align: ${props => props.centerText ? 'center' : 'left'};
`;

const UserButton = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
  margin-right: ${spacing.medium}px;
`;

const CenterItems = styled.View`
  flex: 4;
  padding: 0 ${spacing.medium}px;
  align-items: center;
  justify-content: center;
  flex-direction: row;
  min-height: 28px;
`;

const LeftItems = styled.View`
  flex: ${props => props.sideFlex || 1};
  align-items: center;
  justify-content: flex-start;
  flex-direction: row;
  flex-wrap: wrap;
  min-height: 28px;
`;

const RightItems = styled.View`
  flex: ${props => props.sideFlex || 1};
  align-items: center;
  justify-content: flex-end;
  flex-direction: row;
  flex-wrap: wrap;
  min-height: 28px;
`;

const BackIcon = styled(IconButton)`
  position: relative;
  height: 24px;
  width: 44px;
  padding-left: 10px;
  margin-left: -12px;
`;

const ActionIcon = styled(IconButton)`
  position: relative;
  align-self: center;
  height: 34px;
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
  ${props => props.withBackground
    ? `
      background-color: ${props.theme.colors.tertiary};
      border-radius: 6px;
      padding: 2px ${responsiveSize(12)}px;
      `
    : ''}
`;

const ButtonLabel = styled(BaseText)`
  ${fontStyles.regular}px;
  color: ${({ theme }) => theme.colors.primary};
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

const profileImageWidth = 24;

const LEFT = 'LEFT';
const CENTER = 'CENTER';
const RIGHT = 'RIGHT';

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
      transparent,
    } = this.props;
    const colors = getThemeColors(theme);

    return (
      <HeaderRow>
        <LeftItems sideFlex={sideFlex} style={!centerItems.length && !rightItems.length ? { flexGrow: 2 } : {}}>
          {(leftItems.length || !!noBack)
            ? leftItems.map((item) => this.renderSideItems(item, LEFT))
            : (
              <BackIcon
                icon="back"
                color={transparent ? colors.control : colors.text}
                onPress={customOnBack ? () => customOnBack() : () => { navigation.goBack(null); }}
                fontSize={fontSizes.large}
                horizontalAlign="flex-start"
              />)
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
    const { navigation, theme } = this.props;
    const colors = getThemeColors(theme);
    const commonStyle = {};
    if (type === RIGHT) commonStyle.marginLeft = spacing.small;
    if (item.user || item.userIcon) {
      return this.renderUser(!item.userIcon);
    }
    if (item.title) {
      return (
        <View style={{ ...commonStyle, flexDirection: 'row', flexWrap: 'wrap' }} key={item.title}>
          <HeaderTitle
            style={item.color ? { color: item.color } : {}}
            onPress={item.onPress}
            centerText={type === CENTER}
          >
            {item.title}
          </HeaderTitle>
        </View>
      );
    }
    if (item.icon) {
      return (
        <View style={{ marginRight: -10, ...commonStyle }} key={item.icon}>
          <ActionIcon
            icon={item.icon}
            color={item.color || colors.text}
            onPress={item.onPress}
            fontSize={item.fontSize || fontSizes.large}
            horizontalAlign="flex-start"
          />
          {!!item.indicator && <Indicator />}
        </View>
      );
    }
    if (item.iconSource) {
      return (
        <TouchableOpacity onPress={item.onPress} key={item.key || item.iconSource} style={commonStyle}>
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
          withBackground={item.withBackground}
          style={commonStyle}
        >
          <ButtonLabel>{item.link}</ButtonLabel>
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
        <View style={{ ...wrapperStyle, marginTop: -20, marginBottom: -20 }} key="close">
          <CloseIcon
            icon="close"
            color={colors.text}
            onPress={() => item.dismiss ? navigation.dismiss() : navigation.goBack()}
            fontSize={fontSizes.regular}
            horizontalAlign="flex-end"
          />
        </View>
      );
    }
    if (item.actionButton) {
      return (<HeaderActionButton {...item.actionButton} wrapperStyle={commonStyle} />);
    }
    if (item.custom) {
      return <View key={item.key || 'custom'} style={commonStyle}>{item.custom}</View>;
    }
    return null;
  };

  renderUser = (showName: boolean) => {
    const { user, navigation } = this.props;
    const userImageUri = user.profileImage ? `${user.profileImage}?t=${user.lastUpdateTime || 0}` : null;
    return (
      <UserButton key="user" onPress={() => { navigation.navigate(MANAGE_USERS_FLOW); }}>
        <HeaderProfileImage
          uri={userImageUri}
          userName={user.username}
          diameter={profileImageWidth}
          noShadow
          borderWidth={0}
        />
        {showName &&
        <View style={{ flex: 1, flexDirection: 'row', flexWrap: 'wrap' }}>
          <HeaderTitle style={{ marginLeft: 8 }}>{user.username}</HeaderTitle>
        </View>}
      </UserButton>
    );
  };

  render() {
    const {
      floating,
      theme,
      light,
      noPaddingTop,
      noBottomBorder,
    } = this.props;
    const updatedColors = {};
    if (floating) {
      updatedColors.surface = 'transparent';
      updatedColors.border = 'transparent';
    }
    if (light) {
      updatedColors.primary = theme.colors.control;
      updatedColors.text = theme.colors.control;
    }
    const updatedTheme = { ...theme, colors: { ...theme.colors, ...updatedColors } };

    return (
      <ThemeProvider theme={updatedTheme}>
        <Wrapper
          floating={floating}
          noBottomBorder={noBottomBorder}
        >
          <SafeArea
            forceInset={{ bottom: 'never', top: 'always' }}
            noPaddingTop={noPaddingTop}
            androidStatusbarHeight={StatusBar.currentHeight}
          >
            <HeaderContentWrapper>
              {this.renderHeaderContent()}
            </HeaderContentWrapper>
          </SafeArea>
        </Wrapper>
      </ThemeProvider>
    );
  }
}

const mapStateToProps = ({
  user: { data: user },
}) => ({
  user,
});

export default withTheme(connect(mapStateToProps)(HeaderBlock));
