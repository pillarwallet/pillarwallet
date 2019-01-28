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
import { TouchableOpacity, Image as RNImage, ScrollView, Dimensions, ViewLayoutEvent } from 'react-native';
import styled from 'styled-components/native';

// constants
import { EXTRASMALL, MINIMIZED, SIMPLIFIED } from 'constants/assetsLayoutConstants';

// utils
import { baseColors, fontSizes, spacing } from 'utils/variables';

// components
import { BaseText } from 'components/Typography';
import SlideModal from 'components/Modals/SlideModal';
import ProfileSettingsItem from './ProfileSettingsItem';
import SettingsModalTitle from './SettingsModalTitle';

const SIMPLIFIED_IMG = require('assets/images/assetsSimplified.png');
const MINIMIZED_IMG = require('assets/images/assetsMinified.png');
const EXTRASMALL_IMG = require('assets/images/assetsExtraSmall.png');
// const EXPANDED_IMG = require('assets/images/assetsExtended.png');

const halfScreenWidth = (Dimensions.get('window').width - 80) / 2;

type Layout = {
  image: string,
  id: string,
  name: string,
}
type AppearanceSettings = {
  assetsLayout: string
}

type Props = {
  settings: AppearanceSettings,
  onUpdate: Function
}

type State = {
  visibleModal: ?string,
  scrollOffset?: any,
}

const assetsLayouts = [{
  image: SIMPLIFIED_IMG,
  name: 'Simplified',
  id: SIMPLIFIED,
}, {
  image: MINIMIZED_IMG,
  name: 'Minified',
  id: MINIMIZED,
}, {
  image: EXTRASMALL_IMG,
  name: 'Extra Small',
  id: EXTRASMALL,
},
// {
//   image: EXPANDED_IMG,
//   name: 'Extended',
//   id: EXPANDED,
// }
];

const AssetLayoutHolder = styled.View`
  display: flex;
  flex-direction: column;
  padding-right: ${spacing.rhythm - 4}px;
  margin-bottom: ${spacing.small}px;
  align-items: center;
  justify-content: space-between;
`;

const AssetsLayout = styled.View`
  background: ${baseColors.lightGray};
  height: 100%;
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: flex-start;
`;

const AssetsLayoutImage = styled(RNImage)`
  height: 194px;
  width: 132px;
  max-width: ${halfScreenWidth}px;
`;

class AppearanceSettingsSection extends React.Component<Props, State> {
  state = {
    visibleModal: null,
    scrollOffset: null,
  }

  toggleSlideModalOpen = (visibleModal: ?string = null) => {
    this.setState({ visibleModal });
  };

  handleAssetsLayoutSelect = (layoutId: string) => {
    this.props.onUpdate('appearanceSettings.assetsLayout', layoutId);
    this.toggleSlideModalOpen();
  }

  renderAssetsLayouts() {
    const layouts = assetsLayouts.map(({ image, id, name }: Layout) => (
      <TouchableOpacity key={id} onPress={() => this.handleAssetsLayoutSelect(id)}>
        <AssetLayoutHolder>
          <AssetsLayoutImage source={image} resizeMode="contain" />
          <BaseText
            style={{
              fontSize: fontSizes.small,
              color: baseColors.darkGray,
            }}
          >
            {name}
          </BaseText>
        </AssetLayoutHolder>
      </TouchableOpacity>
    ));
    return <AssetsLayout>{layouts}</AssetsLayout>;
  }

  handleOnScroll = (e: ViewLayoutEvent) => {
    this.setState({
      scrollOffset: e.nativeEvent.contentOffset.y,
    });
  };

  render() {
    const { settings: { assetsLayout } } = this.props;
    const { scrollOffset } = this.state;
    // TODO: add memoization
    // add fallback if EXTENDED was set before
    const activeAssetsLayout = assetsLayouts.find(({ id }) => id === assetsLayout) || { name: 'Simplified' };

    return (
      <React.Fragment>
        <ProfileSettingsItem
          key="assetsLayout"
          label="Assets Layout"
          value={activeAssetsLayout.name}
          onPress={() => this.toggleSlideModalOpen('assetsLayout')}
        />
        <SlideModal
          isVisible={this.state.visibleModal === 'assetsLayout'}
          fullScreen
          showHeader
          onModalHide={this.toggleSlideModalOpen}
          backgroundColor={baseColors.lightGray}
          scrollOffset={scrollOffset}
        >
          <SettingsModalTitle extraHorizontalSpacing>
            Choose your asset list appearance
          </SettingsModalTitle>
          <ScrollView
            contentContainerStyle={{ padding: spacing.rhythm - 4 }}
            onScroll={this.handleOnScroll}
          >
            {this.renderAssetsLayouts()}
          </ScrollView>
        </SlideModal>
      </React.Fragment>
    );
  }
}

export default AppearanceSettingsSection;
