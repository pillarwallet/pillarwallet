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
import { FlatList } from 'react-native';
import styled, { withTheme } from 'styled-components/native';
import { CachedImage } from 'react-native-cached-image';
import { MediumText, BaseText } from 'components/Typography';
import IconButton from 'components/IconButton';
import ShadowedCard from 'components/ShadowedCard';
import { Spacing } from 'components/Layout';
import { spacing, fontSizes } from 'utils/variables';
import { getThemeColors } from 'utils/themes';
import type { CallRequest } from 'models/WalletConnect';
import type { Theme } from 'models/Theme';
import withWCRequests from './withWCRequests';


type Props = {
  requests: CallRequest[],
  rejectWCRequest: (request: CallRequest) => void,
  acceptWCRequest: (request: CallRequest) => void,
  theme: Theme,
  showLastOneOnly?: boolean,
};

const ActionCircleButton = styled(IconButton)`
  height: 24px;
  width: 24px;
  border-radius: 12px;
  margin: 0 0 0 10px;
  justify-content: center;
  align-items: center;
  background: ${({ accept, theme }) => accept ? theme.colors.primary : 'transparent'};
`;

const ItemContainer = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
`;

const CardWrapper = styled.View`
  padding: 0 ${spacing.layoutSides}px 8px;
  width: 100%
  margin-bottom: ${spacing.small}px; 
`;

const Header = styled(MediumText)`
  padding: 18px ${spacing.layoutSides}px 8px;
`;

class Requests extends React.Component<Props> {
  renderRequest = ({ item }) => {
    const { theme, acceptWCRequest, rejectWCRequest } = this.props;
    const { name, icon } = item;
    const colors = getThemeColors(theme);

    return (
      <CardWrapper>
        <ShadowedCard borderRadius={30}>
          <ItemContainer>
            <CachedImage
              style={{
                height: 50,
                width: 50,
                borderRadius: 7,
              }}
              source={{ uri: icon }}
            />
            <Spacing w={15} />
            <BaseText regular style={{ flex: 1 }}>Request from {name}</BaseText>
            <ActionCircleButton
              color={colors.secondaryText}
              margin={0}
              icon="close"
              fontSize={fontSizes.regular}
              onPress={() => rejectWCRequest(item)}
            />
            <ActionCircleButton
              color={colors.control}
              margin={0}
              accept
              icon="check"
              fontSize={fontSizes.small}
              onPress={() => acceptWCRequest(item)}
            />
          </ItemContainer>
        </ShadowedCard>
      </CardWrapper>
    );
  };

  render() {
    const { requests, showLastOneOnly } = this.props;
    if (!requests.length) return null;
    if (showLastOneOnly) {
      return this.renderRequest({ item: requests[requests.length - 1] });
    }

    return (
      <React.Fragment>
        <Header regular accent>Requests</Header>
        <FlatList
          data={requests}
          renderItem={this.renderRequest}
          keyExtractor={({ callId }) => callId.toString()}
          contentContainerStyle={{ paddingTop: 10 }}
        />
      </React.Fragment>
    );
  }
}

export default withWCRequests(withTheme(Requests));
