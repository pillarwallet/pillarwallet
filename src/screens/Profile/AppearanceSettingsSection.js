// @flow
import * as React from 'react';
import { TouchableOpacity, Image as RNImage, ScrollView } from 'react-native';
import styled from 'styled-components/native';

// constants
import { EXPANDED, EXTRASMALL, MINIMIZED, SIMPLIFIED } from 'constants/assetsLayoutConstants';

// utils
import { baseColors, UIColors, fontSizes } from 'utils/variables';

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
  border-radius: 20px;
  padding: 30px 0px 0px;
  align-items: center;
  justify-content: space-between;
`;

const AssetsLayout = styled.View`
  background: ${baseColors.lightGray};
  height: 100%;
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-around;
`;

const AssetsLayoutImageHolder = styled.View`
  elevation: 2;
  box-shadow: 0px 1px 2px ${UIColors.defaultShadowColor};
  border-radius: 15px;
`;

const AssetsLayoutImage = styled(RNImage)`
  height: 185px;
  width: 150px;
  border-radius: 15px;
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
          <AssetsLayoutImageHolder>
            <AssetsLayoutImage source={image} />
          </AssetsLayoutImageHolder>
          <BaseText style={{ fontSize: fontSizes.small, paddingTop: 15, color: baseColors.darkGray }}>{name}</BaseText>
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
            Choose your asset list appeareance
          </SettingsModalTitle>
          <ScrollView contentContainerStyle={{ height: '100%', backgroundColor: 'red' }}>
            {this.renderAssetsLayouts()}
          </ScrollView>
        </SlideModal>
      </React.Fragment>
    );
  }
}

export default AppearanceSettingsSection;
