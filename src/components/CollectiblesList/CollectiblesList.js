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

import React, { useState } from 'react';
import { FlatList } from 'react-native';
import { connect } from 'react-redux';
import styled, { withTheme } from 'styled-components/native';
import { createStructuredSelector } from 'reselect';
import t from 'translations/translate';

// components
import { BaseText } from 'components/Typography';
import CollectibleImage from 'components/CollectibleImage';
import Button from 'components/Button';
import EmptyStateParagraph from 'components/EmptyState/EmptyStateParagraph';
import ReceiveModal from 'screens/Asset/ReceiveModal';
import { Spacing } from 'components/Layout';

// utils
import { smallScreen, getDeviceWidth } from 'utils/common';
import { fontStyles } from 'utils/variables';
import { themedColors } from 'utils/themes';
import { images } from 'utils/images';

import { activeAccountAddressSelector } from 'selectors';

import type { Theme } from 'models/Theme';
import type { Collectible } from 'models/Collectible';


type Props = {
  collectibles: Collectible[],
  onCollectiblePress: Collectible => void,
  isSearching: boolean,
  theme: Theme,
  activeAccountAddress: string
};

type CollectibleItem = {
  item: Collectible,
};

const screenWidth = getDeviceWidth();
const collectibleMargins = 60;

const EmptyStateWrapper = styled.View`
  align-items: center;
  justify-content: center;
  padding: 20px;
  flex-grow: 1;
`;

const Name = styled(BaseText)`
  ${fontStyles.small};
  width: 100%; 
  text-align: center;
`;

const Card = styled.TouchableOpacity`
  background-color: ${themedColors.card};
  border-radius: 10px;
  padding: 16px;
  align-items: center;
  margin: 3px 8px;
`;

const CardWrapper = styled.View`
  width: 50%;
`;

const viewConfig = {
  minimumViewTime: 300,
  viewAreaCoveragePercentThreshold: 100,
  waitForInteraction: true,
};

const CollectiblesList = ({
  collectibles, onCollectiblePress, isSearching, theme, activeAccountAddress,
}: Props) => {
  const [isReceiveModalVisible, setIsReceiveModalVisible] = useState<boolean>(false);

  const renderCollectible = ({ item }: CollectibleItem) => {
    const { name, image: icon } = item;
    const { genericToken } = images(theme);

    const collectibleSize = (screenWidth / 2) - collectibleMargins;

    return (
      <CardWrapper>
        <Card
          onPress={() => onCollectiblePress(item)}
        >
          <CollectibleImage
            width={collectibleSize}
            height={collectibleSize}
            source={{ uri: icon }}
            fallbackSource={genericToken}
            resizeMode="contain"
          />
          <Spacing h={10} />
          <Name center numberOfLines={1} ellipsizeMode="tail" smallScreen={smallScreen()}>{name}</Name>
        </Card>
      </CardWrapper>
    );
  };

  const emptyStateInfo = {
    title: t('collectiblesList.emptyState.noCollectibles.title'),
    bodyText: t('collectiblesList.emptyState.noCollectibles.paragraph'),
  };

  if (isSearching) {
    emptyStateInfo.title = t('collectiblesList.emptyState.noneFound.title');
    emptyStateInfo.bodyText = t('collectiblesList.emptyState.noneFound.paragraph');
  }

  return (
    <>
      <FlatList
        data={collectibles}
        keyExtractor={(it) => { return `${it.assetContract}${it.id}`; }}
        renderItem={renderCollectible}
        numColumns={2}
        style={{ flexGrow: 1 }}
        contentContainerStyle={{
          paddingTop: 20,
          paddingHorizontal: 12,
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
              onPress={() => setIsReceiveModalVisible(true)}
            />
          </EmptyStateWrapper>
        }
        removeClippedSubviews
        viewabilityConfig={viewConfig}
        keyboardShouldPersistTaps="always"
      />
      <ReceiveModal
        address={activeAccountAddress}
        onModalHide={() => setIsReceiveModalVisible(false)}
        isVisible={isReceiveModalVisible}
      />
    </>
  );
};

const structuredSelector = createStructuredSelector({
  activeAccountAddress: activeAccountAddressSelector,
});

export default connect(structuredSelector)(withTheme(CollectiblesList));
