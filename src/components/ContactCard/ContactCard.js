// @flow
import * as React from 'react';
import { baseColors, UIColors, fontSizes, fontWeights } from 'utils/variables';
import NotificationCircle from 'components/NotificationCircle';
import styled from 'styled-components/native';

type Props = {
  onPress: Function,
  name: string,
  notificationCount?: number,
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

export default class ContactCard extends React.Component<Props> {
  render() {
    const {
      notificationCount,
      name,
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
        </ContactCardInner>
      </ContactCardWrapper>
    );
  }
}

