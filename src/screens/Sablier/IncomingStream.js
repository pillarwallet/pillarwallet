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
import { connect } from 'react-redux';
import { createStructuredSelector } from 'reselect';
import styled from 'styled-components/native';
import { CachedImage } from 'react-native-cached-image';
import { getEnv } from 'configs/envConfig';
import t from 'translations/translate';
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import Button from 'components/Button';
import SablierStreamCircles from 'components/SablierStreamCircles';
import Selector from 'components/Selector';
import { Spacing } from 'components/Layout';
import ActivityFeed from 'components/ActivityFeed';
import { BaseText, MediumText } from 'components/Typography';
import ShadowedCard from 'components/ShadowedCard';
import { findEnsNameCaseInsensitive, formatAmount, formatUnits, getDecimalPlaces } from 'utils/common';
import { SABLIER_WITHDRAW } from 'constants/navigationConstants';
import { TRANSACTION_EVENT } from 'constants/historyConstants';
import { mapTransactionsHistory } from 'utils/feedData';
import { isSablierTransactionTag, getTotalStreamed, getTotalWithdrawn, getTimestamp } from 'utils/sablier';
import { getAssetDataByAddress, getAssetsAsList } from 'utils/assets';
import { sablierEventsSelector } from 'selectors/sablier';
import { accountHistorySelector } from 'selectors/history';
import { accountAssetsSelector } from 'selectors/assets';

import type { RootReducerState } from 'reducers/rootReducer';
import type { NavigationScreenProp } from 'react-navigation';
import type { EnsRegistry } from 'reducers/ensRegistryReducer';
import type { Asset, Assets } from 'models/Asset';
import type { Accounts } from 'models/Account';
import ArrowIcon from '../../components/ArrowIcon/ArrowIcon';


type Props = {
  navigation: NavigationScreenProp<*>,
  ensRegistry: EnsRegistry,
  supportedAssets: Asset[],
  assets: Assets,
  history: Object[],
  sablierEvents: Object[],
  accounts: Accounts,
};

const TokenIcon = styled(CachedImage)`
  width: 48px;
  height: 48px;
`;

const Row = styled.View`
  flex-direction: row;
`;

const Column = styled.View``;

const WithdrawCardWrapper = styled.View`
  padding: 16px;
`;

const SelectorWrapper = styled.View`
  align-items: center;
  padding: 24px 0 16px;
`;

class IncomingStream extends React.Component<Props> {
  goToWithdrawScreen = () => {
    const { navigation } = this.props;
    navigation.navigate(SABLIER_WITHDRAW, { stream: navigation.getParam('stream') });
  }

  render() {
    const {
      ensRegistry, navigation, history, accounts, sablierEvents, assets, supportedAssets,
    } = this.props;
    const stream = navigation.getParam('stream');

    const sender = {
      name: findEnsNameCaseInsensitive(ensRegistry, stream.sender) || stream.sender,
      ethAddress: stream.sender,
    };

    const assetData = getAssetDataByAddress(getAssetsAsList(assets), supportedAssets, stream.token.id);
    const decimalPlaces = getDecimalPlaces(assetData.symbol);
    const totalStreamedAmount = getTotalStreamed(stream);
    const formattedStreamedAmount = formatAmount(formatUnits(totalStreamedAmount, assetData.decimals), decimalPlaces);
    const totalWithdrawnAmount = getTotalWithdrawn(stream);
    const formattedWithdrawnAmount = formatAmount(formatUnits(totalWithdrawnAmount, assetData.decimals), decimalPlaces);
    const formattedDeposit = formatAmount(formatUnits(stream.deposit, assetData.decimals), decimalPlaces);
    const assetIcon = `${getEnv().SDK_PROVIDER}/${assetData.iconUrl}?size=3`;

    const transactionsOnMainnet = mapTransactionsHistory(
      history,
      accounts,
      TRANSACTION_EVENT,
    );

    const relatedHistory = transactionsOnMainnet
      .filter(ev => isSablierTransactionTag(ev.tag) && ev.extra.streamId === stream.id);

    const relatedSablierEvents = sablierEvents
      .filter(ev => ev.streamId === stream.id);

    const combinedHistory = [
      ...relatedHistory,
      ...relatedSablierEvents,
    ];

    const now = getTimestamp();
    const hasStreamStarted = +stream.startTime < now;

    return (
      <ContainerWithHeader
        inset={{ bottom: 'never' }}
        headerProps={{ centerItems: [{ title: t('sablierContent.title.incomingStream') }] }}
        putContentInScrollView
      >
        <SelectorWrapper>
          <Selector
            disabled
            selectedOption={sender}
            customOptions={[]}
          />
          <Spacing h={20} />
          <ArrowIcon />
        </SelectorWrapper>
        <SablierStreamCircles
          stream={stream}
        />
        <Spacing h={27} />
        <WithdrawCardWrapper>
          <MediumText big>{t('sablierContent.label.streamed')}</MediumText>
          <Spacing h={6} />
          <ShadowedCard
            contentWrapperStyle={{ padding: 16 }}
          >
            <Row>
              <TokenIcon source={{ uri: assetIcon }} />
              <Spacing w={12} />
              <Column>
                <MediumText fontSize={20} lineHeight={20}>{formattedStreamedAmount}{' '}
                  <MediumText regular secondary>
                    {assetData.symbol} {t('ofValue', { value: formattedDeposit })}
                  </MediumText>
                </MediumText>
                <BaseText regular>{formattedWithdrawnAmount}
                  <BaseText secondary> {assetData.symbol} {t('sablierContent.label.withdrawn')}</BaseText>
                </BaseText>
              </Column>
            </Row>
            <Spacing h={14} />
            <Button
              title={t('button.withdraw')}
              onPress={this.goToWithdrawScreen}
              disabled={!hasStreamStarted}
            />
          </ShadowedCard>
        </WithdrawCardWrapper>
        <Spacing h={16} />
        <ActivityFeed
          navigation={navigation}
          feedData={combinedHistory}
          card
          cardHeaderTitle={t('sablierContent.title.streamingActivityFeed')}
        />
      </ContainerWithHeader>
    );
  }
}

const mapStateToProps = ({
  ensRegistry: { data: ensRegistry },
  accounts: { data: accounts },
  assets: { supportedAssets },
}: RootReducerState): $Shape<Props> => ({
  ensRegistry,
  accounts,
  supportedAssets,
});

const structuredSelector = createStructuredSelector({
  history: accountHistorySelector,
  sablierEvents: sablierEventsSelector,
  assets: accountAssetsSelector,
});

const combinedMapStateToProps = (state: RootReducerState): $Shape<Props> => ({
  ...structuredSelector(state),
  ...mapStateToProps(state),
});

export default connect(combinedMapStateToProps)(IncomingStream);
