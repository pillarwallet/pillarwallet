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
import { Platform, TouchableOpacity } from 'react-native';
import isEqual from 'lodash.isequal';
import styled, { withTheme } from 'styled-components/native';
import type { NavigationScreenProp } from 'react-navigation';
import { connect } from 'react-redux';
import { createStructuredSelector } from 'reselect';
import ImageViewer from 'react-native-image-zoom-viewer';
import t from 'translations/translate';

import { SEND_COLLECTIBLE_FROM_ASSET_FLOW } from 'constants/navigationConstants';
import { COLLECTIBLE_TRANSACTION } from 'constants/collectiblesConstants';

import ActivityFeed from 'components/ActivityFeed';
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import { ScrollWrapper, Wrapper } from 'components/Layout';
import { Paragraph } from 'components/Typography';
import CircleButton from 'components/CircleButton';
import CollectibleImage from 'components/CollectibleImage';
import SlideModal from 'components/Modals/SlideModal/SlideModal-old';

import { getDeviceHeight, getDeviceWidth } from 'utils/common';
import { spacing } from 'utils/variables';
import { mapOpenSeaAndBCXTransactionsHistory, mapTransactionsHistory } from 'utils/feedData';
import { getThemeColors, themedColors } from 'utils/themes';
import { images, isSvgImage } from 'utils/images';

import { accountCollectiblesHistorySelector, accountCollectiblesSelector } from 'selectors/collectibles';
import { accountHistorySelector } from 'selectors/history';

import type { Collectible } from 'models/Collectible';
import type { Accounts } from 'models/Account';
import type { RootReducerState } from 'reducers/rootReducer';
import type { Theme } from 'models/Theme';


type Props = {
  navigation: NavigationScreenProp<*>,
  collectibles: Collectible[],
  openSeaTxHistory: Object[],
  history: Object[],
  accounts: Accounts,
  theme: Theme,
};

type State = {|
  isImageViewVisible: boolean,
|};


const ActionButtonsWrapper = styled.View`
  flex: 1;
  justify-content: flex-start;
  padding-bottom: 30px;
  padding-top: ${Platform.select({
    ios: '10px',
    android: '30px',
  })};
  border-top-width: 1px;
  border-color: ${themedColors.border};
  margin-top: 4px;
`;

const DataWrapper = styled.View`
  margin: 64px ${spacing.large}px ${spacing.large}px;
  justify-content: center;
`;

const CircleButtonsWrapper = styled(Wrapper)`
  margin-top: ${Platform.select({
    ios: 0,
    android: '-20px',
  })};
`;

const StyledCollectibleImage = styled(CollectibleImage)`
  align-self: center;
  margin-top: 30px;
`;


class CollectibleScreen extends React.Component<Props, State> {
  forceRender = false;
  state = {
    isImageViewVisible: false,
  };

  shouldComponentUpdate(nextProps: Props, nextState: State) {
    const isEq = isEqual(this.props, nextProps) && isEqual(this.state, nextState);
    const isFocused = this.props.navigation.isFocused();

    if (!isFocused) {
      if (!isEq) this.forceRender = true;
      return false;
    }

    if (this.forceRender) {
      this.forceRender = false;
      return true;
    }

    return !isEq;
  }

  goToSendTokenFlow = (assetData: Object) => {
    this.props.navigation.navigate(SEND_COLLECTIBLE_FROM_ASSET_FLOW, { assetData });
  };

  onTouchImage = () => {
    this.setState({ isImageViewVisible: true });
  };

  onCloseImageView = () => {
    this.setState({ isImageViewVisible: false });
  };

  renderImageView(collectible: Collectible) {
    const { isImageViewVisible } = this.state;
    const { image } = collectible;
    const { theme } = this.props;
    const colors = getThemeColors(theme);

    const imageViewImage = {
      url: image,
      width: null,
      height: null,
    };

    if (isSvgImage(image)) {
      imageViewImage.width = getDeviceWidth();
      imageViewImage.height = getDeviceHeight();
    }

    const imageViewImages = [imageViewImage];

    return (
      <SlideModal
        isVisible={isImageViewVisible}
        onModalHide={this.onCloseImageView}
        fullScreen
        showHeader
      >
        <ImageViewer
          imageUrls={imageViewImages}
          renderImage={props => <CollectibleImage {...props} />}
          renderIndicator={() => null}
          backgroundColor={colors.surface}
          saveToLocalByLongPress={false}
          menus={() => null}
        />
      </SlideModal>
    );
  }

  render() {
    const {
      navigation,
      collectibles,
      openSeaTxHistory,
      history,
      accounts,
      theme,
    } = this.props;
    const { assetData } = navigation.state.params;
    const {
      id,
      name,
      description,
      image,
    } = assetData;

    const isOwned = collectibles.find(collectible => {
      return collectible.id === id;
    });

    const bcxCollectiblesTxHistory = history.filter(({ tranType }) => tranType === 'collectible');

    const collectiblesTransactions = mapOpenSeaAndBCXTransactionsHistory(openSeaTxHistory, bcxCollectiblesTxHistory);
    const mappedCTransactions = mapTransactionsHistory(
      collectiblesTransactions,
      accounts,
      COLLECTIBLE_TRANSACTION,
    );
    const relatedCollectibleTransactions = mappedCTransactions.filter(({ assetData: thisAssetData }) =>
      !!thisAssetData && !!thisAssetData.id && thisAssetData.id === id);
    const { towellie: genericCollectible } = images(theme);

    return (
      <ContainerWithHeader headerProps={{ centerItems: [{ title: name }] }} inset={{ bottom: 0 }}>
        {this.renderImageView(assetData)}
        <ScrollWrapper>
          <TouchableOpacity onPress={this.onTouchImage}>
            <StyledCollectibleImage
              key={id.toString()}
              source={{ uri: image }}
              fallbackSource={genericCollectible}
              resizeMode="contain"
              width={180}
              height={180}
            />
          </TouchableOpacity>
          <DataWrapper>
            {!!description &&
              <Paragraph small light>{description.replace(new RegExp('\\n\\n', 'g'), '\n')}</Paragraph>
            }
          </DataWrapper>
          <ActionButtonsWrapper>
            <CircleButtonsWrapper center horizontal>
              <CircleButton
                label={t('button.send')}
                fontIcon="paperPlane"
                onPress={() => this.goToSendTokenFlow(assetData)}
                disabled={!isOwned}
              />
            </CircleButtonsWrapper>
          </ActionButtonsWrapper>
          {!!relatedCollectibleTransactions.length &&
          <ActivityFeed
            navigation={navigation}
            feedData={relatedCollectibleTransactions}
            showArrowsOnly
            contentContainerStyle={{ paddingTop: 10 }}
            invertAddon
            feedTitle={t('title.transactions')}
          />}
        </ScrollWrapper>
      </ContainerWithHeader>
    );
  }
}

const mapStateToProps = ({
  accounts: { data: accounts },
}: RootReducerState): $Shape<Props> => ({
  accounts,
});

const structuredSelector = createStructuredSelector({
  collectibles: accountCollectiblesSelector,
  history: accountHistorySelector,
  openSeaTxHistory: accountCollectiblesHistorySelector,
});

const combinedMapStateToProps = (state: RootReducerState) => ({
  ...structuredSelector(state),
  ...mapStateToProps(state),
});

export default withTheme(connect(combinedMapStateToProps)(CollectibleScreen));
