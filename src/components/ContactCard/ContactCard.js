// @flow
import * as React from 'react';
import { baseColors, UIColors, fontSizes, fontWeights } from 'utils/variables';
import NotificationCircle from 'components/NotificationCircle';
import ButtonIcon from 'components/ButtonIcon';
import styled from 'styled-components/native';

const ContactCardWrapper = styled.TouchableHighlight`
  background: ${baseColors.white};
  border: 1px solid ${UIColors.defaultBorderColor};
  margin-bottom: -4px;
  height: 75px;
  padding: 14px;
  border-radius: 4px;
  shadow-color: ${baseColors.black};
  shadow-offset: 0 0;
  shadow-radius: 2px     ;
  shadow-opacity: 0.1;
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
  margin: 0 0 0 10px;
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
  height: 34px;
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
  onPress: Function,
  name: string,
  notificationCount?: number,
  showActions?: boolean,
  status?: string,
  onAcceptInvitationPress?: Function,
  onRejectInvitationPress?: Function,
  onCancelInvitationPress?: Function,
  onSendInvitationPress?: Function,
  onReceiveInvitationPress?: Function,
};

// TODO: convert into dumb component
export default class ContactCard extends React.Component<Props> {
  getActionsOrStatus = (status: string, onPressActions: Object) => {
    const {
      onAcceptInvitationPress,
      onRejectInvitationPress,
      onCancelInvitationPress,
      onSendInvitationPress,
      onReceiveInvitationPress,
    } = onPressActions;

    if (status === 'ACCEPTED') {
      return (
        <StatusText>ACCEPTED</StatusText>
      );
    } else if (status === 'DECLINED') {
      return (
        <StatusText>DECLINED</StatusText>
      );
    } else if (status === 'RECEIVED') {
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
    } else if (status === 'SENT') {
      return (
        <ActionTextWrapper onPress={onCancelInvitationPress}>
          <CancelActionText>
            Cancel
          </CancelActionText>
        </ActionTextWrapper>
      );
    } else if (status === 'INVITE') {
      return (
        <ActionTextWrapper onPress={onSendInvitationPress}>
          <ActionButton>
            <ActionButtonText>
              CONNECT
            </ActionButtonText>
          </ActionButton>
        </ActionTextWrapper>
      );
    } else if (status === 'RECEIVE') {
      return (
        <ActionTextWrapper onPress={onReceiveInvitationPress}>
          <ActionButton>
            <ActionButtonText>
              RECEIVE INVITE
            </ActionButtonText>
          </ActionButton>
        </ActionTextWrapper>
      );
    }
    return null;
  };

  render() {
    const {
      notificationCount,
      name,
      showActions,
      status,
      onAcceptInvitationPress,
      onRejectInvitationPress,
      onCancelInvitationPress,
      onSendInvitationPress,
      onReceiveInvitationPress,
    } = this.props;

    const onPressActions = {
      onAcceptInvitationPress,
      onRejectInvitationPress,
      onCancelInvitationPress,
      onSendInvitationPress,
      onReceiveInvitationPress,
    };
    return (
      <ContactCardWrapper
        onPress={this.props.onPress}
        underlayColor={baseColors.lightGray}
      >
        <ContactCardInner>
          <ContactCardAvatarWrapper>
            <ContactCardAvatar />
          </ContactCardAvatarWrapper>
          <ContactCardName>{name}</ContactCardName>
          {!!notificationCount && notificationCount > 0 &&
            <ContactCardNotificationCircle gray>2</ContactCardNotificationCircle>
          }
          {!!showActions && !!status &&
            this.getActionsOrStatus(status, onPressActions)
          }
        </ContactCardInner>
      </ContactCardWrapper>
    );
  }
}

