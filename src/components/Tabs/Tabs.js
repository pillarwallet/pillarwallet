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
import { Platform, PixelRatio } from 'react-native';
import styled from 'styled-components/native';
import ImageCapInset from 'react-native-image-capinsets';
import { CachedImage } from 'react-native-cached-image';
import Title from 'components/Title';
import Icon from 'components/Icon';
import { BaseText } from 'components/Typography';
import { ALL } from 'constants/activityConstants';
import { baseColors, UIColors, spacing, fontSizes } from 'utils/variables';

type Tab = {
  id: string,
  name: string,
  icon?: string,
  onPress: Function,
  unread?: number,
  tabImageNormal?: string,
  tabImageActive?: string
}

type Props = {
  initialActiveTab?: string,
  title?: string,
  tabs: Tab[],
  bgColor?: string,
}

type State = {
  activeTab: string,
}

const pixelRatio = PixelRatio.get();
const androidTabSpacing = pixelRatio > 3 ? 2 : 1;
const androidFixHorizontalSpacing = 10 - androidTabSpacing;

const TabOuterWrapper = styled.View`
`;

const TabWrapper = styled.View`
  flex-direction: row;
  background-color: ${baseColors.pattensBlue};
  padding: ${Platform.select({
    ios: '2px',
    android: '2px 0',
  })};
  border-radius: 18px;
  margin: 12px 16px;
  height: 36px;
`;

const TabSizer = styled.View`
  flex-grow: 1;
  position: relative;
  ${props => props.fixSpacing
    ? `margin-top: -4px;
      margin-left: -${androidFixHorizontalSpacing}px;
      margin-right: -${androidFixHorizontalSpacing}px;`
    : ''}
`;

const TabItem = styled.TouchableOpacity`
  height: ${props => props.isAndroid ? 53.5 : 32};
  align-items: flex-start;
  justify-content: center;
  background-color: ${props => props.active ? baseColors.white : 'transparent'};
  border-radius: 16px;
  flex-direction: row;
  flex-grow: 1;
  ${props => props.active
    ? `
    shadow-color: ${UIColors.tabShadowColor};
    shadow-radius: 10px;
    shadow-opacity: 1;
    shadow-offset: 0px 7px;
    `
    : ''}
`;

const TabItemIcon = styled(Icon)`
  font-size: ${fontSizes.extraSmall};
  margin-right: 4px;
  margin-top: 2px;
  color: ${props => props.active ? baseColors.slateBlack : baseColors.electricBlue};
`;

const TabItemText = styled(BaseText)`
  font-size: ${fontSizes.extraSmall};
  font-weight: 500;
  color: ${props => props.active ? baseColors.slateBlack : baseColors.electricBlue};
`;

const ActivityFeedHeader = styled.View`
  padding: 4px ${spacing.mediumLarge}px 0;
`;

const TextWrapper = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: center;
  height: 32px;
  margin-top: ${Platform.select({
    ios: '0',
    android: '3px',
  })};
  ${props => props.extraPadding
    ? `padding-left: 34px;
      padding-right: 34px;`
    : ''}
`;

const UnreadBadge = styled.View`
  height: 24px;
  width: 24px;
  border-radius: 12px;
  background-color: ${baseColors.electricBlue};
  position: absolute;
  top: ${Platform.select({
    ios: '4px',
    android: '4.5px',
  })};
  right: 2px;
  align-items: center;
  justify-content: center;
`;

const UnreadText = styled(BaseText)`
  font-size: ${fontSizes.extraSmall};
  font-weight: 500;
  color: ${baseColors.white};
`;

const TabImage = styled(CachedImage)`
  width: 16px;
  height: 16px;
  margin-right: 4px;
`;

const tabBackground9Patch = require('assets/images/tab.png');

export default class Tabs extends React.Component<Props, State> {
  state = {
    activeTab: this.props.initialActiveTab || ALL,
  };

  renderIcon = (tab: Object) => {
    const {
      icon,
      tabImageNormal,
      tabImageActive,
      id,
    } = tab;
    const { activeTab } = this.state;
    const isActive = activeTab === id;
    const tabImage = isActive ? tabImageActive : tabImageNormal;

    if (icon) {
      return (
        <TabItemIcon active={isActive} name={icon} />
      );
    }

    if (tabImageActive || tabImageNormal) {
      return (
        <TabImage source={tabImage} resizeMethod="resize" resizeMode={Platform.OS === 'ios' ? 'contain' : 'cover'} />
      );
    }

    return null;
  };

  renderTabItems = (tabs: Tab[]) => {
    const { activeTab } = this.state;
    const tabItems = tabs.map(tab => {
      const isActive = activeTab === tab.id;
      const {
        id,
        name,
        unread,
        onPress,
      } = tab;

      if (isActive && Platform.OS === 'android') {
        return (
          <TabSizer
            key={id}
            style={tabs.length === 2 ? { width: '50%' } : {}}
            fixSpacing
          >
            <ImageCapInset
              source={tabBackground9Patch}
              capInsets={{
                top: 14 / pixelRatio,
                right: 90 / pixelRatio,
                bottom: 35 / pixelRatio,
                left: 90 / pixelRatio,
              }}
            >
              <TabItem
                isAndroid
                onPress={() => this.setState({
                  activeTab: id,
                }, onPress)}
              >
                <TextWrapper extraPadding={!!unread}>
                  {this.renderIcon(tab)}
                  <TabItemText active={isActive}>{name}</TabItemText>
                  {!!unread && <UnreadBadge><UnreadText>{unread < 10 ? unread : '9+'}</UnreadText></UnreadBadge>}
                </TextWrapper>
              </TabItem>
            </ImageCapInset>
          </TabSizer>
        );
      }

      return (
        <TabSizer
          key={id}
          style={tabs.length === 2 ? { width: '50%' } : {}}
          fixSpacing={Platform.OS === 'android'}
        >
          <TabItem
            isAndroid={Platform.OS === 'android'}
            active={isActive && Platform.OS === 'ios'}
            onPress={() => this.setState({
              activeTab: id,
            }, onPress)}
          >
            <TextWrapper extraPadding={!!unread}>
              {this.renderIcon(tab)}
              <TabItemText active={isActive}>{name}</TabItemText>
              {!!unread && <UnreadBadge><UnreadText>{unread < 10 ? unread : '9+'}</UnreadText></UnreadBadge>}
            </TextWrapper>
          </TabItem>
        </TabSizer>
      );
    });
    return tabItems;
  };

  render() {
    const { title, tabs, bgColor } = this.props;
    return (
      <TabOuterWrapper backgroundColor={bgColor}>
        {!!title &&
        <ActivityFeedHeader>
          <Title subtitle noMargin title={title} />
        </ActivityFeedHeader>
        }
        <TabWrapper>
          {this.renderTabItems(tabs)}
        </TabWrapper>
      </TabOuterWrapper>
    );
  }
}
