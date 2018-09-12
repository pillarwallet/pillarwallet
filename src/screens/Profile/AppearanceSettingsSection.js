// @flow
import * as React from 'react';
import { TouchableOpacity, Image as RNImage, ScrollView } from 'react-native';
import styled from 'styled-components/native';

// constants
import { EXPANDED, EXTRASMALL, MINIMIZED, SIMPLIFIED } from 'constants/assetsLayoutConstants';

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
const EXPANDED_IMG = require('assets/images/assetsExtended.png');

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
{
  image: EXPANDED_IMG,
  name: 'Extended',
  id: EXPANDED,
}];

const AssetLayoutHolder = styled.View`
  display: flex;
  flex-direction: column;
  padding-right: ${spacing.rhythm - 4}px;
  margin-bottom: ${spacing.rhythm}px;
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
`;

class AppearanceSettingsSection extends React.Component<Props, State> {
  state = {
    visibleModal: null,
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
          <AssetsLayoutImage source={image} resizeMode="cover" />
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

  render() {
    const { settings: { assetsLayout } } = this.props;
    // TODO: add memoization
    const activeAssetsLayout = assetsLayouts.find(({ id }) => id === assetsLayout) || {};

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
        >
          <SettingsModalTitle extraHorizontalSpacing>
            Choose your asset list appearance
          </SettingsModalTitle>
          <ScrollView contentContainerStyle={{ height: '100%', padding: spacing.rhythm - 4 }}>
            {this.renderAssetsLayouts()}
          </ScrollView>
        </SlideModal>
      </React.Fragment>
    );
  }
}

export default AppearanceSettingsSection;
