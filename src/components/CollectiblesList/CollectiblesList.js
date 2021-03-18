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

import React from 'react';
import { FlatList } from 'react-native';
import styled, { useTheme } from 'styled-components/native';
import t from 'translations/translate';

// Components
import { BaseText } from 'components/Typography';
import CollectibleImage from 'components/CollectibleImage';
import Button from 'components/Button';
import EmptyStateParagraph from 'components/EmptyState/EmptyStateParagraph';
import ReceiveModal from 'screens/Asset/ReceiveModal';
import { Spacing } from 'components/Layout';
import Modal from 'components/Modal';

// Selectors
import { useRootSelector, activeAccountAddressSelector } from 'selectors';

// Utils
import { smallScreen, getDeviceWidth } from 'utils/common';
import { fontStyles } from 'utils/variables';
import { images } from 'utils/images';

// Types
import type { Collectible } from 'models/Collectible';


type Props = {|
  collectibles: Collectible[],
  onCollectiblePress: Collectible => void,
  isSearching: boolean,
|};

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
  background-color: ${({ theme }) => theme.colors.basic050};
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

const CollectiblesList = ({ collectibles, onCollectiblePress, isSearching }: Props) => {
  const theme = useTheme();
  const activeAccountAddress = useRootSelector(activeAccountAddressSelector);

  const openReceiveModal = () => Modal.open(() => (
    <ReceiveModal address={activeAccountAddress} />
  ));

  const renderCollectible = ({ item }: CollectibleItem) => {
    const { name, image: icon } = item;
    const { genericToken } = images(theme);

    const collectibleSize = (screenWidth / 2) - collectibleMargins;

    return (
      <CardWrapper>
        <Card onPress={() => onCollectiblePress(item)}>
          <CollectibleImage
            width={collectibleSize}
            height={collectibleSize}
            source={{ uri: icon }}
            fallbackSource={genericToken}
            resizeMode="contain"
          />
          <Spacing h={10} />
          <Name center numberOfLines={1} ellipsizeMode="tail" smallScreen={smallScreen()}>
            {name}
          </Name>
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
        keyExtractor={(it) => `${it.assetContract}${it.id}`}
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
            <Button title={t('button.receive')} marginTop={40} secondary onPress={openReceiveModal} />
          </EmptyStateWrapper>
        }
        removeClippedSubviews
        viewabilityConfig={viewConfig}
        keyboardShouldPersistTaps="always"
      />
    </>
  );
};

export default CollectiblesList;
