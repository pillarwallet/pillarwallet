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
import styled, { withTheme } from 'styled-components/native';
import IconButton from 'components/IconButton';
import ShadowedCard from 'components/ShadowedCard';
import { MediumText, BaseText } from 'components/Typography';
import { spacing, fontSizes } from 'utils/variables';
import { getThemeColors } from 'utils/themes';
import {
  acceptInvitationAction,
  rejectInvitationAction,
} from 'actions/invitationsActions';
import { TYPE_RECEIVED } from 'constants/invitationsConstants';
import type { Dispatch, RootReducerState } from 'reducers/rootReducer';
import type { Theme } from 'models/Theme';


type Props = {
  invitations: Object[],
  acceptInvitation: (invitation: Object) => void,
  rejectInvitation: (invitation: Object) => void,
  theme: Theme,
};

const RequestsList = styled.FlatList`
  margin-bottom: 16px;
`;

const ActionCircleButton = styled(IconButton)`
  height: 24px;
  width: 24px;
  border-radius: 12px;
  margin: 0 0 0 13px;
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
`;

const TitleContainer = styled.View``;

const ButtonsContainer = styled.View`
  flex-direction: row;
  justify-content: flex-end;
`;

class ConnectionRequests extends React.Component<Props> {
  renderRequest = ({ item }) => {
    const { acceptInvitation, rejectInvitation, theme } = this.props;
    const colors = getThemeColors(theme);

    return (
      <CardWrapper>
        <ShadowedCard borderRadius={30} >
          <ItemContainer>
            <TitleContainer>
              <MediumText big>{item.username}</MediumText>
              <BaseText regular secondary>Connection request</BaseText>
            </TitleContainer>
            <ButtonsContainer>
              <ActionCircleButton
                color={colors.secondaryText}
                margin={0}
                icon="close"
                fontSize={fontSizes.regular}
                onPress={() => rejectInvitation(item)}
              />
              <ActionCircleButton
                color={colors.control}
                margin={0}
                accept
                icon="check"
                fontSize={fontSizes.small}
                onPress={() => acceptInvitation(item)}
              />
            </ButtonsContainer>
          </ItemContainer>
        </ShadowedCard>
      </CardWrapper>
    );
  };

  render() {
    const { invitations } = this.props;
    const filteredInvitations = invitations.filter(({ type }) => type === TYPE_RECEIVED);
    if (!filteredInvitations.length) return null;
    return (
      <RequestsList
        data={filteredInvitations}
        renderItem={this.renderRequest}
        keyExtractor={(item) => item.id}
      />
    );
  }
}

const mapStateTopProps = ({
  invitations: { data: invitations },
}: RootReducerState): $Shape<Props> => ({
  invitations,
});

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  acceptInvitation: (invitation) => dispatch(acceptInvitationAction(invitation)),
  rejectInvitation: (invitation) => dispatch(rejectInvitationAction(invitation)),
});


export default withTheme(connect(mapStateTopProps, mapDispatchToProps)(ConnectionRequests));
