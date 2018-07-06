// @flow
import * as React from 'react';
import { baseColors, UIColors, fontSizes, fontWeights } from 'utils/variables';
import NotificationCircle from 'components/NotificationCircle';
import ButtonIcon from 'components/ButtonIcon';
import styled from 'styled-components/native';

type Props = {
  onPress: Function,
  name: string,
  notificationCount?: number,
  showActions?: boolean,
  status?: string,
}

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

const ActionButton = styled(ButtonIcon)`
  height: 40px;
  width: 40px;
  border-radius: 20px;
  padding: 0;
  margin: 0 0 0 16px;
  justify-content: center;
  align-items: center;
  background: ${props => props.accept ? baseColors.electricBlue : 'rgba(0,0,0,0)'};
`;
const ButtonIconWrapper = styled.View`
  margin-left: auto;
  flex-direction: row;
`;

export default class ContactCard extends React.Component<Props> {
  getActionsOrStatus = (status: string) => {
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
          <ActionButton
            color={baseColors.darkGray}
            margin={0}
            icon="close"
            fontSize={40}
          />
          <ActionButton
            color={baseColors.white}
            margin={0}
            accept
            icon="ios-checkmark"
            fontSize={40}
          />
        </ButtonIconWrapper>
      );
    }
  }

  render() {
    const {
      notificationCount,
      name,
      showActions,
      status,
    } = this.props;
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
            <ContactCardNotificationCircle>2</ContactCardNotificationCircle>
          }
          {!!showActions && !!status &&
            this.getActionsOrStatus(status)
          }
        </ContactCardInner>
      </ContactCardWrapper>
    );
  }
}

