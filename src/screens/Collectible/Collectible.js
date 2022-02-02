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

import React, { useMemo } from 'react';
import { Platform, TouchableOpacity } from 'react-native';
import styled from 'styled-components/native';
import { connect } from 'react-redux';
import { createStructuredSelector } from 'reselect';
import ImageViewer from 'react-native-image-zoom-viewer';
import t from 'translations/translate';
import { useNavigation, useNavigationParam } from 'react-navigation-hooks';

// Constants
import { SEND_COLLECTIBLE_FROM_ASSET_FLOW } from 'constants/navigationConstants';
import { COLLECTIBLE_TRANSACTION } from 'constants/collectiblesConstants';

// Components
import ActivityFeed from 'components/legacy/ActivityFeed';
import ContainerWithHeader from 'components/legacy/Layout/ContainerWithHeader';
import { ScrollWrapper, Wrapper } from 'components/legacy/Layout';
import { Paragraph } from 'components/legacy/Typography';
import CircleButton from 'components/CircleButton';
import CollectibleImage from 'components/CollectibleImage';
import HistoryList from 'components/HistoryList';
import SlideModal from 'components/Modals/SlideModal';
import Modal from 'components/Modal';

// Utils
import { getDeviceHeight, getDeviceWidth } from 'utils/common';
import { spacing } from 'utils/variables';
import { mapTransactionsHistory } from 'utils/feedData';
import { getThemeColors, themedColors, useTheme } from 'utils/themes';
import { images, isSvgImage, interpretNftMedia } from 'utils/images';
import { isMatchingCollectible } from 'utils/assets';
import {
  getAccountAddress,
  isArchanovaAccount,
  isEtherspotAccount,
} from 'utils/accounts';
import { getHistoryEventsFromCollectiblesTransactions } from 'utils/history';

// Selectors
import { accountCollectiblesHistorySelector, accountCollectiblesSelector } from 'selectors/collectibles';
import { activeAccountSelector } from 'selectors';

// Types
import type { Collectible, CollectibleTransaction } from 'models/Collectible';
import type { Account } from 'models/Account';
import type { RootReducerState } from 'reducers/rootReducer';
import type { Theme } from 'models/Theme';
import type { ChainRecord } from 'models/Chain';

type Props = {
  collectibles: ChainRecord<Collectible[]>,
  accountCollectibleHistory: ChainRecord<CollectibleTransaction[]>,
  accounts: Account[],
  theme: Theme,
  activeAccount: Account,
};

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


const CollectibleScreen = ({
  collectibles,
  accountCollectibleHistory,
  accounts,
  activeAccount,
}) => {
  const navigation = useNavigation();
  const theme = useTheme();

  const collectible: Collectible = useNavigationParam('collectible');

  const {
    id,
    name,
    description,
    imageUrl,
    contractAddress,
    chain,
  } = collectible;

  const goToSendTokenFlow = () => navigation.navigate(
    SEND_COLLECTIBLE_FROM_ASSET_FLOW,
    { assetData: collectible },
  );

  const openCollectibleImage = () => {
    const colors = getThemeColors(theme);

    const imageViewImage = {
      url: interpretNftMedia(imageUrl),
      width: null,
      height: null,
    };

    if (isSvgImage(imageUrl)) {
      imageViewImage.width = getDeviceWidth();
      imageViewImage.height = getDeviceHeight();
    }

    const imageViewImages = [imageViewImage];

    Modal.open(() => (
      <SlideModal
        fullScreen
        showHeader
      >
        <ImageViewer
          imageUrls={imageViewImages}
          renderImage={props => <CollectibleImage {...props} />}
          renderIndicator={() => null}
          backgroundColor={colors.basic070}
          saveToLocalByLongPress={false}
          menus={() => null}
        />
      </SlideModal>
    ));
  };

  const isOwned = useMemo(
    () => (collectibles[chain] ?? []).some((ownedCollectible) => ownedCollectible.id === id),
    [collectibles, id, chain],
  );

  const mappedCollectiblesTransactions = useMemo(
    () => {
      const collectiblesTransactions = accountCollectibleHistory[chain] ?? [];
      return mapTransactionsHistory(
        collectiblesTransactions,
        accounts,
        COLLECTIBLE_TRANSACTION,
      );
    },
    [accountCollectibleHistory, accounts, chain],
  );

  const transactions = useMemo(() => {
    const relatedTransactions = mappedCollectiblesTransactions.filter(({ assetData }) =>
      isMatchingCollectible(assetData, { id, contractAddress }),
    );

    return isEtherspotAccount(activeAccount)
      ? getHistoryEventsFromCollectiblesTransactions(relatedTransactions, chain, getAccountAddress(activeAccount))
      : relatedTransactions;
  }, [mappedCollectiblesTransactions, chain, id, contractAddress, activeAccount]);

  const { towellie: genericCollectible } = images(theme);

  return (
    <ContainerWithHeader headerProps={{ centerItems: [{ title: name }] }} inset={{ bottom: 0 }}>
      <ScrollWrapper>
        <TouchableOpacity onPress={openCollectibleImage}>
          <StyledCollectibleImage
            key={id.toString()}
            source={{ uri: imageUrl }}
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
              onPress={goToSendTokenFlow}
              disabled={!isOwned}
            />
          </CircleButtonsWrapper>
        </ActionButtonsWrapper>
        {!!transactions.length && (
          <>
            {isArchanovaAccount(activeAccount) && (
              <ActivityFeed
                navigation={navigation}
                feedData={transactions}
                showArrowsOnly
                contentContainerStyle={{ paddingTop: 10 }}
                invertAddon
                feedTitle={t('title.transactions')}
              />
            )}
            {isEtherspotAccount(activeAccount) && <HistoryList items={transactions} chain={chain} />}
          </>
        )}
      </ScrollWrapper>
    </ContainerWithHeader>
  );
};

const mapStateToProps = ({
  accounts: { data: accounts },
}: RootReducerState): $Shape<Props> => ({
  accounts,
});

const structuredSelector = createStructuredSelector({
  collectibles: accountCollectiblesSelector,
  accountCollectibleHistory: accountCollectiblesHistorySelector,
  activeAccount: activeAccountSelector,
});

const combinedMapStateToProps = (state: RootReducerState) => ({
  ...structuredSelector(state),
  ...mapStateToProps(state),
});

export default connect(combinedMapStateToProps)(CollectibleScreen);

