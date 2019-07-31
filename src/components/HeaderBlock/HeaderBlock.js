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
import { StatusBar, View } from 'react-native';

import { baseColors, fontSizes, spacing, UIColors } from 'utils/variables';
import styled from 'styled-components/native';
import { SafeAreaView } from 'react-navigation';
import type { NavigationScreenProp } from 'react-navigation';
import { BaseText } from 'components/Typography';
import IconButton from 'components/IconButton';
import { connect } from 'react-redux';
import ProfileImage from 'components/ProfileImage';
import { USERS } from 'constants/navigationConstants';

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
}

type State = {
  isMoreContentVisible: boolean,
}

const Wrapper = styled.View`
  width: 100%;
  background-color: ${props => props.theme.backgroundColor || 'transparent'};
  border-bottom-width: ${props => props.theme.borderBottomWidth || 0};
  border-bottom-color: ${props => props.theme.borderBottomColor || 'transparent'};
  ${props => props.floating
    ? `
      position: absolute;
      top: 0;
      left: 0;
      z-index: 1;`
    : ''}
`;
// const AnimatedWrapper = Animated.createAnimatedComponent(Wrapper);

const HeaderContentWrapper = styled.View`
  padding: ${spacing.large}px ${spacing.large}px 0;
  width: 100%;
`;

const SafeArea = styled(SafeAreaView)`
  ${props => props.androidStatusbarHeight ? `margin-top: ${props.androidStatusbarHeight}px` : ''};
`;

const HeaderRow = styled.View`
  flex-direction: row;
  width: 100%;
  align-items: flex-end;
  padding-bottom: ${spacing.large}px;
  margin-top: 10px;
`;

const HeaderProfileImage = styled(ProfileImage)``;

const HeaderTitle = styled(BaseText)`
  line-height: ${fontSizes.small};
  font-size: ${fontSizes.extraSmall}px;
  color: ${props => props.theme.color || UIColors.defaultTextColor};
  font-weight: 500;
`;

const UserButton = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
  margin-right: ${spacing.medium}px;
`;

const SideWrapper = styled.View`
  flex: ${props => props.sideFlex ? props.sideFlex : 1};
`;

const RightSide = styled.View`
  flex-direction: row;
  justify-content: flex-end;
`;

const LeftSide = styled.View`
  flex-direction: row;
  align-items: center;
`;

const CenterWrapper = styled.View`
  flex: 4;
  align-items: center;
  justify-content: center;
  padding: 0 ${spacing.medium}px;
`;

const MiddlePart = styled.View`
  flex-direction: row;
  width: 100%;
  align-items: center;
  justify-content: center;
`;

const BackIcon = styled(IconButton)`
  position: relative;
  align-self: flex-start;
  height: 44px;
  width: 44px;
  padding-left: 10px;
  margin-left: -12px;
  margin-bottom: -12px;
`;

const ActionIcon = styled(IconButton)`
  position: relative;
  align-self: center;
  height: 24px;
  width: 24px;
  margin: 0 3px -6px;
`;

const TextButton = styled.TouchableOpacity`
  padding: 5px;
  flex-direction: row;
  align-items: center;
  ${props => props.bordered
    ? `
      border-width: 1px;
      border-color: ${props.theme.rightActionBorderColor || baseColors.electricBlue};
      border-radius: 14px;
      padding: 5px 16px;
      `
    : ''}
`;

const ButtonLabel = styled(BaseText)`
  line-height: ${fontSizes.small};
  font-size: ${fontSizes.extraSmall}px;
  color: ${props => props.theme.rightActionLabelColor || baseColors.electricBlue};
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
    if (themes(background)[prop]) combinedThemes.push(themes(background)[prop]);
  });

  if (combinedThemes.length) return Object.assign({}, ...combinedThemes);
  return themes().default;
};


class HeaderBlock extends React.Component<Props, State> {
  renderHeaderContent = (theme: Object) => {
    const {
      rightItems = [],
      sideFlex,
      leftItems = [],
      centerItems = [],
    } = this.props;

    return (
      <HeaderRow>
        <SideWrapper sideFlex={sideFlex}>
          <LeftSide>
            {this.renderSideItems('LEFT', leftItems, theme)}
          </LeftSide>
        </SideWrapper>
        {!!centerItems.length &&
        <CenterWrapper>
          <MiddlePart>
            {this.renderSideItems('CENTER', centerItems, theme)}
          </MiddlePart>
        </CenterWrapper>}
        <SideWrapper sideFlex={sideFlex}>
          <RightSide>
            {this.renderSideItems('RIGHT', rightItems, theme)}
          </RightSide>
        </SideWrapper>
      </HeaderRow>
    );
  };

  renderSideItems = (side: string, items, theme) => {
    const { navigation } = this.props;
    if (side === 'LEFT' && !items.length) {
      return (
        <BackIcon
          icon="back"
          color={theme.iconColor || UIColors.defaultNavigationColor}
          onPress={() => {
            navigation.goBack(null);
          }}
          fontSize={fontSizes.extraLarge}
          horizontalAlign="flex-start"
        />
      );
    }

    return items.map((item) => {
      if (item.user || item.userIcon) {
        return this.renderUser(theme, !item.userIcon);
      }
      if (item.title) {
        return (
          <HeaderTitle theme={theme} key={item.title} style={item.color ? { color: item.color } : {}}>
            {item.title}
          </HeaderTitle>
        );
      }

      if (item.icon) {
        return (
          <ActionIcon
            key={item.icon}
            icon={item.icon}
            color={theme.rightActionIconColor || UIColors.defaultNavigationColor}
            onPress={item.action}
            fontSize={fontSizes.extraLarge}
            horizontalAlign="flex-start"
          />
        );
      }
      if (item.label) {
        return (
          <TextButton onPress={item.onPress} key={item.label} bordered={item.bordered} theme={theme}>
            <ButtonLabel theme={theme}>{item.label}</ButtonLabel>
            {item.addon}
          </TextButton>
        );
      }
      if (item.close) {
        return (
          <ActionIcon
            key="close"
            icon="close"
            color={baseColors.slateBlack}
            onPress={item.dismiss ? () => navigation.dismiss() : () => navigation.goBack()}
            fontSize={fontSizes.extraSmall}
            horizontalAlign="flex-start"
            style={{ marginBottom: -2, marginRight: -4 }}
          />
        );
      }
      if (item.actionButton) {
        return (<HeaderActionButton {...item.actionButton} theme={theme} />);
      }
      if (item.custom) {
        return <View key={item.key || 'custom'}>{item.custom}</View>;
      }
      return null;
    });
  };

  renderUser = (theme, showName: boolean) => {
    const { user, navigation } = this.props;
    return (
      <UserButton key="user" onPress={() => { navigation.navigate(USERS); }}>
        <HeaderProfileImage
          uri={`${user.profileImage}?t=${user.lastUpdateTime || 0}`}
          userName={user.username}
          diameter={profileImageWidth}
          containerStyle={{
            borderRadius: profileImageWidth / 2,
            backgroundColor: user.profileImage ? 'transparent' : baseColors.lightGray,
          }}
          noShadow
        />
        {showName &&
        <HeaderTitle theme={theme} style={{ marginLeft: spacing.medium }}>{user.username}</HeaderTitle>}
      </UserButton>
    );
  };

  render() {
    const { floating } = this.props;
    const theme = getTheme(this.props);

    return (
      <Wrapper theme={theme} floating={floating}>
        <SafeArea forceInset={{ bottom: 'never' }} androidStatusbarHeight={StatusBar.currentHeight}>
          <HeaderContentWrapper>
            {this.renderHeaderContent(theme)}
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
