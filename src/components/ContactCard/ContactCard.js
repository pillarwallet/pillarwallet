// @flow
import * as React from 'react';
import { baseColors, UIColors, fontSizes, fontWeights } from 'utils/variables';
import { TYPE_RECEIVED, TYPE_SENT, TYPE_INVITE, TYPE_ACCEPTED } from 'constants/invitationsConstants';
import NotificationCircle from 'components/NotificationCircle';
import ButtonIcon from 'components/ButtonIcon';
import { noop } from 'utils/common';
import styled from 'styled-components/native';

const ContactCardWrapper = styled.TouchableHighlight`
  background: ${baseColors.white};
  border: 1px solid ${UIColors.defaultBorderColor};
  margin-bottom: -4px;
  height: 75px;
  padding: 14px;
  border-radius: 4px;
`;

const ContactCardInner = styled.View`
  flex-direction: row;
  align-items: center;
`;

const ContactCardAvatar = styled.Image`

`;

const ContactCardAvatarWrapper = styled.View`
  height: 44px;
  width: 44px;
  border: 2px solid ${baseColors.white};
  background: ${baseColors.mediumGray};
  border-radius: 22px;
  margin-right: 14px;
  shadow-color: ${baseColors.black};
  shadow-offset: 0 0;
  shadow-radius: 2px     ;
  shadow-opacity: 0.1;
`;

const ContactCardName = styled.Text`
  font-size: ${fontSizes.medium};
  font-weight: ${fontWeights.bold};
`;

const ContactCardNotificationCircle = styled(NotificationCircle)`
  margin-left: auto;
`;

const StatusText = styled.Text`
  font-size: ${fontSizes.extraSmall};
  color: ${baseColors.darkGray};
  margin-left: auto;
`;

const ActionCircleButton = styled(ButtonIcon)`
  height: 34px;
  width: 34px;
  border-radius: 17px;
  padding: 0;
  margin: 0 5px 0 0;
  justify-content: center;
  align-items: center;
  background: ${props => props.accept ? baseColors.electricBlue : 'rgba(0,0,0,0)'};
`;
const ButtonIconWrapper = styled.View`
  margin-left: auto;
  flex-direction: row;
`;

const ActionTextWrapper = styled.TouchableOpacity`
  margin-left: auto;
`;

const CancelActionText = styled.Text`
  color: ${baseColors.fireEngineRed};
  font-size: ${fontSizes.small};
`;

const ActionButton = styled.View`
  background: ${baseColors.clearBlue};
  padding: 0 20px;
  height: 33px;
  border-radius: 17px;
  justify-content: center;
  align-items: center;
`;

const ActionButtonText = styled.Text`
  font-size: ${fontSizes.small};
  font-weight: ${fontWeights.bold};
  color: ${baseColors.white};
`;


type Props = {
  onPress?: Function,
  name: string,
  notificationCount?: number,
  showActions?: boolean,
  status?: string,
  onAcceptInvitationPress?: Function,
  onRejectInvitationPress?: Function,
  onCancelInvitationPress?: Function,
  onSendInvitationPress?: Function,
};

// TODO: convert into dumb component
export default class ContactCard extends React.Component<Props> {
  static defaultProps = {
    onPress: noop,
  }

  renderActions = () => {
    const {
      onAcceptInvitationPress,
      onRejectInvitationPress,
      onCancelInvitationPress,
      onSendInvitationPress,
      status,
    } = this.props;

    if (status === TYPE_ACCEPTED) {
      return (
        <StatusText>ACCEPTED</StatusText>
      );
    } else if (status === 'DECLINED') {
      return (
        <StatusText>DECLINED</StatusText>
      );
    } else if (status === TYPE_RECEIVED) {
      return (
        <ButtonIconWrapper>
          <ActionCircleButton
            color={baseColors.darkGray}
            margin={0}
            icon="close"
            fontSize={32}
            onPress={onRejectInvitationPress}
          />
          <ActionCircleButton
            color={baseColors.white}
            margin={0}
            accept
            icon="ios-checkmark"
            fontSize={32}
            onPress={onAcceptInvitationPress}
          />
        </ButtonIconWrapper>
      );
    } else if (status === TYPE_SENT) {
      return (
        <ActionTextWrapper onPress={onCancelInvitationPress}>
          <CancelActionText>
            Cancel
          </CancelActionText>
        </ActionTextWrapper>
      );
    } else if (status === TYPE_INVITE) {
      return (
        <ActionTextWrapper onPress={onSendInvitationPress}>
          <ActionButton>
            <ActionButtonText>
              CONNECT
            </ActionButtonText>
          </ActionButton>
        </ActionTextWrapper>
      );
    }
    return null;
  };

  render() {
    const {
      notificationCount = 0,
      name,
      onPress,
    } = this.props;

    return (
      <ContactCardWrapper
        onPress={onPress}
        underlayColor={baseColors.lightGray}
      >
        <ContactCardInner>
          <ContactCardAvatarWrapper>
            <ContactCardAvatar />
          </ContactCardAvatarWrapper>
          <ContactCardName>{name}</ContactCardName>
          {notificationCount > 0 &&
            <ContactCardNotificationCircle gray>{notificationCount}</ContactCardNotificationCircle>
          }
          {this.renderActions()}
        </ContactCardInner>
      </ContactCardWrapper>
    );
  }
}

