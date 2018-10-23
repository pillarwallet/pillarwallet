// @flow
import * as React from 'react';
import { Platform, Dimensions } from 'react-native';
import { baseColors, fontSizes, itemSizes, spacing, UIColors } from 'utils/variables';
import { TYPE_RECEIVED, TYPE_SENT, TYPE_INVITE, TYPE_ACCEPTED } from 'constants/invitationsConstants';
import NotificationCircle from 'components/NotificationCircle';
import Button from 'components/Button';
import IconButton from 'components/IconButton';
import ProfileImage from 'components/ProfileImage';
import { noop } from 'utils/common';
import styled from 'styled-components/native';
import { BoldText, BaseText } from 'components/Typography';

type Props = {
  onPress?: Function,
  name: string,
  avatar?: string,
  notificationCount?: number,
  showActions?: boolean,
  status?: string,
  noMargin?: boolean,
  onAcceptInvitationPress?: Function,
  onRejectInvitationPress?: Function,
  onCancelInvitationPress?: Function,
  onSendInvitationPress?: Function,
  noBorder?: boolean,
  disabled?: boolean,
  customButton?: React.Node,
};

const ContactCardWrapper = styled.TouchableHighlight`
  background: ${UIColors.defaultBackgroundColor};
  border: ${props => (props.noBorder ? 0 : '1px solid')};
  border-color: ${baseColors.lightGray};
  height: 70px;
  padding: ${props => (props.noBorder ? '8px 0' : '8px')};
  border-radius: 4px;
  margin: ${props => props.noMargin ? 0 : `0 ${spacing.rhythm}px ${spacing.rhythm / 2}px`};
`;

const ContactCardInner = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  flex: 1;
`;

const ContactCardAvatarWrapper = styled.View`
  margin-right: 14px;
  shadow-color: ${baseColors.black};
  shadow-offset: 0 0;
  shadow-radius: 2px;
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

const ActionCircleButton = styled(IconButton)`
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
            fontSize={fontSizes.extraSmall}
            onPress={onRejectInvitationPress}
          />
          <ActionCircleButton
            color={baseColors.white}
            margin={0}
            accept
            icon="check"
            fontSize={fontSizes.extraSmall}
            onPress={onAcceptInvitationPress}
          />
        </ButtonIconWrapper>
      );
    } else if (status === TYPE_SENT) {
      return (
        <Button
          title="Request Sent"
          onPress={onCancelInvitationPress}
          small
          secondary
        />
      );
    } else if (status === TYPE_INVITE) {
      return (
        <Button
          title="Connect"
          onPress={onSendInvitationPress}
          small
        />
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
      noMargin,
      disabled,
    } = this.props;

    return (
      <ContactCardWrapper
        onPress={onPress}
        underlayColor={baseColors.lightGray}
        noBorder={noBorder}
        noMargin={noMargin}
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

