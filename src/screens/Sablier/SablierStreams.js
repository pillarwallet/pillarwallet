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
import { RefreshControl, FlatList } from 'react-native';
import { connect } from 'react-redux';
import styled from 'styled-components/native';
import { CachedImage } from 'react-native-cached-image';

import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import Insight from 'components/Insight/Insight';
import { MediumText } from 'components/Typography';
import Button from 'components/Button';
import { Spacing, ScrollWrapper } from 'components/Layout';
import Tabs from 'components/Tabs';
import SablierStream from 'components/SablierStream';

import { SABLIER_NEW_STREAM } from 'constants/navigationConstants';

import { fetchUserStreamsAction } from 'actions/sablierActions';

import { fontStyles } from 'utils/variables';

import type { Stream } from 'models/Sablier';
import type { RootReducerState, Dispatch } from 'reducers/rootReducer';
import type { NavigationScreenProp } from 'react-navigation';


type Props = {
  navigation: NavigationScreenProp<*>,
  outgoingStreams: Stream[],
  incomingStreams: Stream[],
  isFetchingStreams: boolean,
  fetchUserStreams: () => void,
};

type State = {
  activeTab: string,
};

const EmptyStateContainer = styled.View`
  padding: 0 20px;
`;

const SablierLogo = styled(CachedImage)`
  width: 64px;
  height: 64px;
  align-self: center;
`;

const INSIGHT_ITEMS = [
  {
    title: 'As a worker, you see your earnings increasing in real-time in the Sablier wallet.',
  },
  {
    title: 'As an organisation, our technology helps you get rid of the hassle of payroll admin. ',
  },
];

const sablierLogo = require('assets/icons/sablier.png');

const OUTGOING = 'OUTGOING';
const INCOMING = 'INCOMING';


class SablierStreams extends React.Component<Props, State> {
  state = {
    activeTab: OUTGOING,
  }

  componentDidMount() {
    const { fetchUserStreams } = this.props;
    fetchUserStreams();
  }

  goToNewStreamFlow = () => {
    const { navigation } = this.props;
    navigation.navigate(SABLIER_NEW_STREAM);
  }

  renderEmptyState = () => {
    return (
      <EmptyStateContainer>
        <MediumText center large>Start your first stream</MediumText>
        <Spacing h={40} />
        <Insight
          isVisible
          title="Stream your money or receive streams with Sablier"
          insightChecklist={INSIGHT_ITEMS}
          titleStyle={{
            ...fontStyles.big,
            textAlign: 'center',
          }}
        />
        <Spacing h={64} />
        <Button
          title="New stream"
          onPress={this.goToNewStreamFlow}
        />
        <Spacing h={20} />
      </EmptyStateContainer>
    );
  }

  renderStream = ({ item: stream }) => {
    return (
      <SablierStream stream={stream} />
    );
  }

  renderStreams = () => {
    const { incomingStreams, outgoingStreams } = this.props;
    const { activeTab } = this.state;

    const tabs = [
      {
        id: OUTGOING,
        name: 'Outgoing',
        onPress: () => this.setState({ activeTab: OUTGOING }),
      },
      {
        id: INCOMING,
        name: 'Incoming',
        onPress: () => this.setState({ activeTab: INCOMING }),
      },
    ];

    return (
      <>
        <Tabs
          tabs={tabs}
          activeTab={activeTab}
        />
        <FlatList
          data={activeTab === OUTGOING ? outgoingStreams : incomingStreams}
          renderItem={this.renderStream}
          keyExtractor={stream => stream.id}
        />
      </>
    );
  }

  render() {
    const {
      outgoingStreams, incomingStreams, isFetchingStreams, fetchUserStreams,
    } = this.props;

    const headerProps = { centerItems: [{ title: 'Your streams' }], rightItems: [], sideFlex: 1 };
    const isEmpty = outgoingStreams.length > 0 || incomingStreams.length > 0;
    if (isEmpty) {
      headerProps.rightItems = [{ link: 'New stream', onPress: this.goToNewStreamFlow }];
      headerProps.sideFlex = 4;
    }

    return (
      <ContainerWithHeader
        inset={{ bottom: 'never' }}
        headerProps={headerProps}
      >
        <ScrollWrapper
          refreshControl={
            <RefreshControl
              refreshing={isFetchingStreams}
              onRefresh={() => fetchUserStreams()}
            />
          }
        >
          <Spacing h={24} />
          <SablierLogo source={sablierLogo} />
          <Spacing h={24} />
          {isEmpty ? this.renderStreams() : this.renderEmptyState()}
        </ScrollWrapper>
      </ContainerWithHeader>
    );
  }
}

const mapStateToProps = ({
  sablier: { incomingStreams, outgoingStreams, isFetchingStreams },
}: RootReducerState): $Shape<Props> => ({
  incomingStreams,
  outgoingStreams,
  isFetchingStreams,
});

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  fetchUserStreams: () => dispatch(fetchUserStreamsAction()),
});

export default connect(mapStateToProps, mapDispatchToProps)(SablierStreams);
