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
import { StatusBar, View, FlatList, TouchableOpacity } from 'react-native';
import { CachedImage } from 'react-native-cached-image';

import { baseColors, fontSizes, spacing, UIColors } from 'utils/variables';
import styled from 'styled-components/native';
import { SafeAreaView } from 'react-navigation';
import type { NavigationScreenProp } from 'react-navigation';
import { BaseText } from 'components/Typography';
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

const HeaderContentWrapper = styled.View`
  padding: ${spacing.large}px;
  width: 100%;
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

const HeaderTitle = styled(BaseText)`
  line-height: ${fontSizes.small};
  font-size: ${fontSizes.extraSmall}px;
  color: ${props => props.theme.color || UIColors.defaultTextColor};
  font-weight: 500;
  text-align: ${props => props.centerText ? 'center' : 'left'};
  padding: 5px 0;
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
`;

const LeftItems = styled.View`
  flex: ${props => props.sideFlex || 1};
  align-items: center;
  justify-content: flex-start;
  flex-direction: row;
  flex-wrap: wrap;
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

const TextButton = styled.TouchableOpacity`
  padding: 5px 0;
  flex-direction: row;
  align-items: center;
  ${props => props.bordered
    ? `
      border-width: 1px;
      border-color: ${props.theme.rightActionBorderColor || baseColors.electricBlue};
      border-radius: 14px;
      padding: 5px ${responsiveSize(spacing.mediumLarge)}px;
      `
    : ''}
`;

const ButtonLabel = styled(BaseText)`
  line-height: ${fontSizes.small};
  font-size: ${fontSizes.extraSmall}px;
  color: ${props => props.theme.rightActionLabelColor || baseColors.electricBlue};
`;

const Separator = styled.View`
  width: ${spacing.small}px;
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

class HeaderBlock extends React.Component<Props> {
  renderHeaderContent = (theme: Object) => {
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
            ? leftItems.map((item) => this.renderSideItems(item, theme))
            : (
              <BackIcon
                icon="back"
                color={theme.iconColor || UIColors.defaultNavigationColor}
                onPress={customOnBack ? () => customOnBack() : () => { navigation.goBack(null); }}
                fontSize={fontSizes.extraLarge}
                horizontalAlign="flex-start"
              />)
          }
        </LeftItems>
        {!!centerItems.length &&
        <CenterItems>
          {centerItems.map((item) => this.renderSideItems(item, theme, 'CENTER'))}
        </CenterItems>
        }
        {(!!centerItems.length || !!rightItems.length) &&
        <FlatList
          keyExtractor={(item) => item.key || item.label || item.title || item.icon || 'close'}
          data={rightItems}
          renderItem={({ item }) => this.renderSideItems(item, theme)}
          ItemSeparatorComponent={() => <Separator />}
          horizontal
          contentContainerStyle={{ justifyContent: 'flex-end', flexGrow: 1 }}
          style={{ flex: sideFlex || 1 }}
          scrollEnabled={false}
        />}
      </HeaderRow>
    );
  };

  renderSideItems = (item, theme, type = '') => {
    const { navigation } = this.props;
    if (item.user || item.userIcon) {
      return this.renderUser(theme, !item.userIcon);
    }
    if (item.title) {
      return (
        <HeaderTitle
          theme={theme}
          key={item.title}
          style={item.color ? { color: item.color } : {}}
          onPress={item.onPress}
          centerText={type === 'CENTER'}
        >
          {item.title}
        </HeaderTitle>
      );
    }
    if (item.icon) {
      return (
        <View style={{ marginRight: -10 }}>
          <ActionIcon
            key={item.icon}
            icon={item.icon}
            color={item.color || theme.rightActionIconColor || UIColors.defaultNavigationColor}
            onPress={item.onPress}
            fontSize={item.fontSize || fontSizes.extraLarge}
            horizontalAlign="flex-start"
          />
          {!!item.indicator && <Indicator />}
        </View>
      );
    }
    if (item.iconSource) {
      return (
        <TouchableOpacity onPress={item.onPress}>
          <IconImage source={item.iconSource} />
          {!!item.indicator && <Indicator />}
        </TouchableOpacity>
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
        <View style={{ marginRight: -10 }}>
          <ActionIcon
            key="close"
            icon="close"
            color={baseColors.slateBlack}
            onPress={item.dismiss ? () => navigation.dismiss() : () => navigation.goBack()}
            fontSize={fontSizes.extraSmall}
            horizontalAlign="flex-end"
          />
        </View>
      );
    }
    if (item.actionButton) {
      return (<HeaderActionButton {...item.actionButton} theme={theme} />);
    }
    if (item.custom) {
      return <View key={item.key || 'custom'}>{item.custom}</View>;
    }
    return null;
  };

  renderUser = (theme, showName: boolean) => {
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
          <HeaderTitle theme={theme} style={{ marginLeft: spacing.medium }}>{user.username}</HeaderTitle>
        </View>}
      </UserButton>
    );
  };

  render() {
    const { floating } = this.props;
    const theme = getTheme(this.props);

    return (
      <Wrapper theme={theme} floating={floating}>
        <SafeArea forceInset={{ bottom: 'never', top: 'always' }} androidStatusbarHeight={StatusBar.currentHeight}>
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
