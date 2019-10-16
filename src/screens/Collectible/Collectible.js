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
import { Platform } from 'react-native';
import isEqual from 'lodash.isequal';
import styled from 'styled-components/native';
import type { NavigationScreenProp } from 'react-navigation';
import { connect } from 'react-redux';
import { CachedImage } from 'react-native-cached-image';
import { createStructuredSelector } from 'reselect';

import { SEND_COLLECTIBLE_FROM_ASSET_FLOW } from 'constants/navigationConstants';
import { COLLECTIBLE_TRANSACTION } from 'constants/collectiblesConstants';

import ActivityFeed from 'components/ActivityFeed';
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import { ScrollWrapper, Wrapper } from 'components/Layout';
import { Paragraph } from 'components/Typography';
import CircleButton from 'components/CircleButton';

import { baseColors, spacing } from 'utils/variables';
import { mapOpenSeaAndBCXTransactionsHistory, mapTransactionsHistory } from 'utils/feedData';

import { accountCollectiblesHistorySelector, accountCollectiblesSelector } from 'selectors/collectibles';
import { accountHistorySelector } from 'selectors/history';

import type { Collectible } from 'models/Collectible';
import type { ContactSmartAddressData } from 'models/Contacts';
import type { Accounts } from 'models/Account';

type Props = {
  navigation: NavigationScreenProp<*>,
  collectibles: Collectible[],
  openSeaTxHistory: Object[],
  contacts: Object[],
  history: Object[],
  contactsSmartAddresses: ContactSmartAddressData[],
  accounts: Accounts,
};

const ActionButtonsWrapper = styled.View`
  flex: 1;
  justify-content: flex-start;
  padding-bottom: 30px;
  padding-top: ${Platform.select({
    ios: '10px',
    android: '30px',
  })};
  background-color: ${baseColors.snowWhite};
  border-top-width: 1px;
  border-bottom-width: 1px;
  border-color: ${baseColors.mediumLightGray};
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

const CollectibleImage = styled(CachedImage)`
  align-self: center;
  height: 180px;
  width: 180px;
  margin-top: 30px;
`;

const iconSend = require('assets/icons/icon_send.png');
const genericCollectible = require('assets/images/no_logo.png');

class CollectibleScreen extends React.Component<Props> {
  shouldComponentUpdate(nextProps: Props) {
    const isFocused = this.props.navigation.isFocused();
    if (!isFocused) {
      return false;
    }
    const isEq = isEqual(this.props, nextProps);
    return !isEq;
  }

  goToSendTokenFlow = (assetData: Object) => {
    this.props.navigation.navigate(SEND_COLLECTIBLE_FROM_ASSET_FLOW, { assetData });
  };

  render() {
    const {
      navigation,
      collectibles,
      openSeaTxHistory,
      contacts,
      history,
      contactsSmartAddresses,
      accounts,
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
      contacts,
      contactsSmartAddresses,
      accounts,
      COLLECTIBLE_TRANSACTION,
    );
    const relatedCollectibleTransactions = mappedCTransactions.filter(({ assetData: thisAssetData }) =>
      !!thisAssetData && !!thisAssetData.id && thisAssetData.id === id);

    return (
      <ContainerWithHeader headerProps={{ centerItems: [{ title: name }] }} inset={{ bottom: 0 }}>
        <ScrollWrapper>
          <CollectibleImage
            key={id.toString()}
            source={{ uri: image }}
            fallbackSource={genericCollectible}
            resizeMode="contain"
          />
          <DataWrapper>
            {!!description &&
              <Paragraph small light>{description.replace(new RegExp('\\n\\n', 'g'), '\n')}</Paragraph>
            }
          </DataWrapper>
          <ActionButtonsWrapper>
            <CircleButtonsWrapper center horizontal>
              <CircleButton
                label="Send"
                icon={iconSend}
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
            feedTitle="Transactions"
          />}
        </ScrollWrapper>
      </ContainerWithHeader>
    );
  }
}

const mapStateToProps = ({
  contacts: { data: contacts, contactsSmartAddresses: { addresses: contactsSmartAddresses } },
  accounts: { data: accounts },
}) => ({
  contacts,
  contactsSmartAddresses,
  accounts,
});

const structuredSelector = createStructuredSelector({
  collectibles: accountCollectiblesSelector,
  history: accountHistorySelector,
  openSeaTxHistory: accountCollectiblesHistorySelector,
});

const combinedMapStateToProps = (state) => ({
  ...structuredSelector(state),
  ...mapStateToProps(state),
});

export default connect(combinedMapStateToProps)(CollectibleScreen);
