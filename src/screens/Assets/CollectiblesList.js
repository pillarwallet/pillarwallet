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

import { FlatList, View } from 'react-native';
import styled, { withTheme } from 'styled-components/native';
import type { NavigationScreenProp } from 'react-navigation';
import t from 'translations/translate';

// components
import EmptyStateParagraph from 'components/EmptyState/EmptyStateParagraph';
import ShadowedCard from 'components/ShadowedCard';
import { BaseText } from 'components/Typography';
import CollectibleImage from 'components/CollectibleImage';
import Button from 'components/Button';
import ReceiveModal from 'screens/Asset/ReceiveModal';
import Modal from 'components/Modal';

// constants
import { COLLECTIBLE } from 'constants/navigationConstants';

// utils
import { smallScreen } from 'utils/common';
import { fontStyles, fontTrackings, spacing } from 'utils/variables';
import { themedColors } from 'utils/themes';
import { images } from 'utils/images';

// types
import type { Collectible } from 'models/Collectible';
import type { Theme } from 'models/Theme';

const EmptyStateWrapper = styled.View`
  align-items: center;
  justify-content: center;
  padding: 20px;
  flex-grow: 1;
`;

const CardRow = styled.View`
  flex-direction: row;
  justify-content: center;
  align-items: center;
  width: 100%;
  margin-bottom: 10px;
`;

const Name = styled(BaseText)`
  ${props => props.smallScreen ? fontStyles.small : fontStyles.regular};
  letter-spacing: ${fontTrackings.small};
  color: ${themedColors.secondaryText};
  width: 100%;
  text-align: center;
`;

const viewConfig = {
  minimumViewTime: 300,
  viewAreaCoveragePercentThreshold: 100,
  waitForInteraction: true,
};

type Props = {
  collectibles: Collectible[],
  searchQuery: string,
  navigation: NavigationScreenProp<*>,
  theme: Theme,
  activeAccountAddress: string,
};

type CollectibleItem = {
  item: Collectible,
};

class CollectiblesList extends React.PureComponent<Props> {
  handleCardTap = (assetData: Collectible) => {
    const { navigation } = this.props;

    navigation.navigate(COLLECTIBLE, { assetData });
  };

  renderCollectible = ({ item }: CollectibleItem) => {
    const { name, image } = item;

    const icon = image;
    const { theme } = this.props;
    const { genericToken } = images(theme);

    return (
      <View style={{ width: '50%', paddingHorizontal: 8, paddingVertical: 3 }}>
        <ShadowedCard
          wrapperStyle={{ marginBottom: 10, width: '100%' }}
          contentWrapperStyle={{ padding: spacing.medium, alignItems: 'center' }}
          onPress={() => this.handleCardTap(item)}
        >
          <CollectibleImage
            style={{
              marginBottom: spacing.mediumLarge,
            }}
            width={135}
            height={135}
            source={{ uri: icon }}
            fallbackSource={genericToken}
            resizeMode="contain"
          />
          <CardRow>
            <Name center numberOfLines={1} ellipsizeMode="tail" smallScreen={smallScreen()}>{name}</Name>
          </CardRow>
        </ShadowedCard>
      </View>
    );
  };

  openReceiveModal = () => {
    Modal.open(() => <ReceiveModal address={this.props.activeAccountAddress} />);
  };

  render() {
    const { searchQuery, collectibles } = this.props;

    const emptyStateInfo = {
      title: t('collectiblesList.emptyState.noCollectibles.title'),
      bodyText: t('collectiblesList.emptyState.noCollectibles.paragraph'),
    };

    if (searchQuery) {
      emptyStateInfo.title = t('collectiblesList.emptyState.noneFound.title');
      emptyStateInfo.bodyText = t('collectiblesList.emptyState.noneFound.paragraph');
    }

    return (
      <>
        <FlatList
          data={collectibles}
          keyExtractor={(it) => { return `${it.assetContract}${it.id}`; }}
          renderItem={this.renderCollectible}
          numColumns={2}
          style={[searchQuery ? { flexGrow: 1, paddingTop: spacing.mediumLarge } : { flexGrow: 1 }]}
          contentContainerStyle={{
            paddingHorizontal: 12,
            paddingTop: 24,
            paddingBottom: 12,
            flexGrow: 1,
          }}
          ListEmptyComponent={
            <EmptyStateWrapper>
              <EmptyStateParagraph {...emptyStateInfo} />
              <Button
                title={t('button.receive')}
                block
                marginTop={40}
                secondary
                regularText
                onPress={this.openReceiveModal}
              />
            </EmptyStateWrapper>
          }
          initialNumToRender={4}
          removeClippedSubviews
          viewabilityConfig={viewConfig}
          keyboardShouldPersistTaps="always"
        />
      </>
    );
  }
}

export default withTheme(CollectiblesList);
