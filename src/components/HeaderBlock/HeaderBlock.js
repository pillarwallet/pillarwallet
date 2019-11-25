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

import { baseColors, fontSizes, fontStyles, spacing, UIColors } from 'utils/variables';
import styled from 'styled-components/native';
import { SafeAreaView } from 'react-navigation';
import type { NavigationScreenProp } from 'react-navigation';
import { BaseText, MediumText } from 'components/Typography';
import IconButton from 'components/IconButton';
import { connect } from 'react-redux';
import ProfileImage from 'components/ProfileImage';
import { USERS } from 'constants/navigationConstants';
import { responsiveSize } from 'utils/ui';

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
}

const Wrapper = styled.View`
  width: 100%;
  background-color: ${props => props.customTheme.backgroundColor || 'transparent'};
  border-bottom-width: ${props => props.customTheme.borderBottomWidth || 0};
  border-bottom-color: ${props => props.customTheme.borderBottomColor || 'transparent'};
  ${props => props.floating
    ? `
      position: absolute;
      top: 0;
      left: 0;
      z-index: 1;`
    : ''}
`;

const HeaderContentWrapper = styled.View`
  padding: 15px ${spacing.large}px;
  width: 100%;
  min-height: 58px;
`;

const SafeArea = styled(SafeAreaView)`
  ${props => props.androidStatusbarHeight ? `margin-top: ${props.androidStatusbarHeight}px` : ''};
`;

const HeaderRow = styled.View`
  flex-direction: row;
  width: 100%;
  align-items: center;
  justify-content: space-between;
`;

const HeaderProfileImage = styled(ProfileImage)``;

const HeaderTitle = styled(MediumText)`
  ${fontStyles.regular};
  color: ${props => props.customTheme.color || UIColors.defaultTextColor};
  text-align: ${props => props.centerText ? 'center' : 'left'};
  margin-top: 2px;
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
  padding: 5px 0;
  flex-direction: row;
  align-items: center;
  ${props => props.bordered
    ? `
      border-width: 1px;
      border-color: ${props.customTheme.rightActionBorderColor || baseColors.electricBlue};
      border-radius: 14px;
      padding: 5px ${responsiveSize(spacing.mediumLarge)}px;
      `
    : ''}
`;

const ButtonLabel = styled(BaseText)`
  font-size: ${fontSizes.regular}px;
  color: ${props => props.customTheme.rightActionLabelColor || baseColors.electricBlue};
`;

const Indicator = styled.View`
  width: 8px;
  height: 8px;
  background-color: ${baseColors.sunYellow};
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

const themes = (backgroundColor?: string = '') => ({
  transparent: {
    backgroundColor: 'transparent',
    color: baseColors.slateBlack,
    borderBottomColor: 'transparent',
    borderBottomWidth: 0,
    iconColor: baseColors.slateBlack,
    rightActionIconColor: baseColors.electricBlue,
    rightActionLabelColor: baseColors.electricBlue,
    buttonBorderColor: baseColors.mediumLightGray,
    buttonLabelColor: baseColors.coolGrey,
  },
  light: {
    color: baseColors.white,
    borderBottomWidth: 0,
    iconColor: baseColors.white,
    rightActionIconColor: baseColors.white,
    rightActionLabelColor: baseColors.white,
    buttonBorderColor: UIColors.actionButtonBorderColor,
    buttonLabelColor: baseColors.white,
  },
  background: {
    backgroundColor,
    borderBottomColor: backgroundColor,
  },
  darkBorder: {
    borderBottomWidth: 1,
    borderBottomColor: baseColors.slateBlack,
  },
  default: {
    backgroundColor: baseColors.white,
    color: baseColors.slateBlack,
    borderBottomColor: baseColors.mediumLightGray,
    borderBottomWidth: 1,
    iconColor: baseColors.slateBlack,
    rightActionIconColor: baseColors.electricBlue,
    rightActionLabelColor: baseColors.electricBlue,
    rightActionBorderColor: UIColors.headerButtonBorder,
    buttonBorderColor: baseColors.mediumLightGray,
    buttonLabelColor: baseColors.slateBlack,
  },
});

const getTheme = (props: Props) => {
  const { background = '' } = props;
  const combinedThemes = [];

  Object.keys(props).forEach((prop: string) => {
    if (!!props[prop] && themes(background)[prop]) combinedThemes.push(themes(background)[prop]);
  });

  if (combinedThemes.length) return Object.assign({}, ...combinedThemes);
  return themes().default;
};

const LEFT = 'LEFT';
const CENTER = 'CENTER';
const RIGHT = 'RIGHT';

class HeaderBlock extends React.Component<Props> {
  renderHeaderContent = (customTheme: Object) => {
    const {
      rightItems = [],
      sideFlex,
      leftItems = [],
      centerItems = [],
      navigation,
      noBack,
      customOnBack,
    } = this.props;

    return (
      <HeaderRow>
        <LeftItems sideFlex={sideFlex} style={!centerItems.length && !rightItems.length ? { flexGrow: 2 } : {}}>
          {(leftItems.length || !!noBack)
            ? leftItems.map((item) => this.renderSideItems(item, customTheme, LEFT))
            : (
              <BackIcon
                icon="back"
                color={customTheme.iconColor || UIColors.defaultNavigationColor}
                onPress={customOnBack ? () => customOnBack() : () => { navigation.goBack(null); }}
                fontSize={fontSizes.large}
                horizontalAlign="flex-start"
              />)
          }
        </LeftItems>
        {!!centerItems.length &&
        <CenterItems>
          {centerItems.map((item) => this.renderSideItems(item, customTheme, CENTER))}
        </CenterItems>
        }
        {(!!centerItems.length || !!rightItems.length) &&
          <RightItems sideFlex={sideFlex}>
            {rightItems.map((item) => this.renderSideItems(item, customTheme, RIGHT))}
          </RightItems>
        }
      </HeaderRow>
    );
  };

  renderSideItems = (item, customTheme, type = '') => {
    const { navigation } = this.props;
    const commonStyle = {};
    if (type === RIGHT) commonStyle.marginLeft = spacing.small;
    if (item.user || item.userIcon) {
      return this.renderUser(customTheme, !item.userIcon);
    }
    if (item.title) {
      return (
        <View style={{ ...commonStyle, flexDirection: 'row', flexWrap: 'wrap' }} key={item.title}>
          <HeaderTitle
            customTheme={customTheme}
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
            color={item.color || customTheme.rightActionIconColor || UIColors.defaultNavigationColor}
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
    if (item.label) {
      return (
        <TextButton
          onPress={item.onPress}
          key={item.label}
          bordered={item.bordered}
          customTheme={customTheme}
          style={commonStyle}
        >
          <ButtonLabel customTheme={customTheme}>{item.label}</ButtonLabel>
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
            color={baseColors.slateBlack}
            onPress={() => item.dismiss ? navigation.dismiss() : navigation.goBack()}
            fontSize={fontSizes.regular}
            horizontalAlign="flex-end"
          />
        </View>
      );
    }
    if (item.actionButton) {
      return (<HeaderActionButton {...item.actionButton} customTheme={customTheme} wrapperStyle={commonStyle} />);
    }
    if (item.custom) {
      return <View key={item.key || 'custom'} style={commonStyle}>{item.custom}</View>;
    }
    return null;
  };

  renderUser = (customTheme, showName: boolean) => {
    const { user, navigation } = this.props;
    return (
      <UserButton key="user" onPress={() => { navigation.navigate(USERS); }}>
        <HeaderProfileImage
          uri={`${user.profileImage}?t=${user.lastUpdateTime || 0}`}
          userName={user.username}
          diameter={profileImageWidth}
          noShadow
        />
        {showName &&
        <View style={{ flex: 1, flexDirection: 'row', flexWrap: 'wrap' }}>
          <HeaderTitle customTheme={customTheme} style={{ marginLeft: spacing.medium }}>{user.username}</HeaderTitle>
        </View>}
      </UserButton>
    );
  };

  render() {
    const { floating } = this.props;
    const customTheme = getTheme(this.props);

    return (
      <Wrapper customTheme={customTheme} floating={floating}>
        <SafeArea forceInset={{ bottom: 'never', top: 'always' }} androidStatusbarHeight={StatusBar.currentHeight}>
          <HeaderContentWrapper>
            {this.renderHeaderContent(customTheme)}
          </HeaderContentWrapper>
        </SafeArea>
      </Wrapper>
    );
  }
}

const mapStateToProps = ({
  user: { data: user },
}) => ({
  user,
});

export default connect(mapStateToProps)(HeaderBlock);
