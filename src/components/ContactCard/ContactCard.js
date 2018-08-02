// @flow
import * as React from 'react';
import { Platform, Dimensions } from 'react-native';
import { baseColors, UIColors, fontSizes, itemSizes } from 'utils/variables';
import { TYPE_RECEIVED, TYPE_SENT, TYPE_INVITE, TYPE_ACCEPTED } from 'constants/invitationsConstants';
import NotificationCircle from 'components/NotificationCircle';
import ButtonIcon from 'components/ButtonIcon';
import ProfileImage from 'components/ProfileImage';
import { noop } from 'utils/common';
import styled from 'styled-components/native';
import { BoldText, BaseText } from 'components/Typography';

const ContactCardWrapper = styled.TouchableHighlight`
  background: ${baseColors.white};
  border: ${props => (props.noBorder ? 0 : '1px solid')};
  border-color: ${UIColors.defaultBorderColor};
  height: 75px;
  padding: ${props => (props.noBorder ? '14px 0' : '14px')};
  border-radius: 4px;
`;

const ContactCardInner = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  flex: 1;
`;

const ContactCardAvatarWrapper = styled.View`
  height: 44px;
  width: 44px;
  border: 2px solid ${baseColors.white};
  background: ${baseColors.cyan};
  border-radius: 22px;
  margin-right: 14px;
  shadow-color: ${baseColors.black};
  shadow-offset: 0 0;
  shadow-radius: 2px     ;
  shadow-opacity: 0.1;
`;

const ContactCardName = styled(BoldText)`
  font-size: ${fontSizes.medium};
  flex-wrap: wrap;
`;

const ContactCardNotificationCircle = styled(NotificationCircle)`
  margin-left: auto;
`;

const StatusText = styled(BaseText)`
  font-size: ${fontSizes.extraSmall};
  color: ${baseColors.darkGray};
  margin-left: auto;
`;

const ActionCircleButton = styled(ButtonIcon)`
  height: 34px;
  width: 34px;
  border-radius: 17px;
  padding: ${Platform.OS === 'ios' ? 0 : 8}px;
  margin: 0 0 0 10px;
  justify-content: center;
  align-items: center;
  background: ${props => props.accept ? baseColors.electricBlue : 'rgba(0,0,0,0)'};
`;
const ContactCardSide = styled.View`
  display: flex;
  flex-direction: row;
  align-items: center;
`;
const ButtonIconWrapper = styled.View`
  margin-left: auto;
  flex-direction: row;
`;

const ActionTextWrapper = styled.TouchableOpacity`
  // margin-left: auto;
`;

const CancelActionText = styled(BaseText)`
  color: ${baseColors.fireEngineRed};
  font-size: ${fontSizes.small};
`;

const ActionButton = styled.View`
  background: ${baseColors.electricBlue};
  padding: 0 20px;
  height: 34px;
  border-radius: 17px;
  justify-content: center;
  align-items: center;
`;

const ActionButtonText = styled(BoldText)`
  font-size: ${fontSizes.small};
  color: ${baseColors.white};
`;

type Props = {
  onPress?: Function,
  name: string,
  avatar?: string,
  notificationCount?: number,
  showActions?: boolean,
  status?: string,
  onAcceptInvitationPress?: Function,
  onRejectInvitationPress?: Function,
  onCancelInvitationPress?: Function,
  onSendInvitationPress?: Function,
  noBorder?: boolean,
  disabled?: boolean,
  customButton?: React.Node,
};

const maxContactInfoWidth = Dimensions.get('window').width - 220;

// TODO: convert into dumb component
export default class ContactCard extends React.Component<Props> {
  static defaultProps = {
    onPress: noop,
  };

  renderActions = () => {
    const {
      onAcceptInvitationPress,
      onRejectInvitationPress,
      onCancelInvitationPress,
      onSendInvitationPress,
      status,
      customButton,
    } = this.props;

    if (customButton) {
      return customButton;
    } else if (status === TYPE_ACCEPTED) {
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
            fontSize={fontSizes.small}
            onPress={onRejectInvitationPress}
          />
          <ActionCircleButton
            color={baseColors.white}
            margin={0}
            accept
            icon="check"
            fontSize={fontSizes.small}
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
      avatar,
      onPress,
      noBorder,
      disabled,
    } = this.props;

    return (
      <ContactCardWrapper
        onPress={onPress}
        underlayColor={baseColors.lightGray}
        noBorder={noBorder}
        disabled={disabled}
      >
        <ContactCardInner>
          <ContactCardSide>
            <ContactCardAvatarWrapper>
              <ProfileImage
                uri={avatar}
                userName={name}
                diameter={itemSizes.avaratCircleSmall}
                textStyle={{ fontSize: fontSizes.medium }}
              />
            </ContactCardAvatarWrapper>
            <ContactCardName style={{ maxWidth: maxContactInfoWidth }}>{name}</ContactCardName>
          </ContactCardSide>
          <ContactCardSide>
            {notificationCount > 0 &&
            <ContactCardNotificationCircle gray>{notificationCount}</ContactCardNotificationCircle>
            }
            {this.renderActions()}
          </ContactCardSide>
        </ContactCardInner>
      </ContactCardWrapper>
    );
  }
}

