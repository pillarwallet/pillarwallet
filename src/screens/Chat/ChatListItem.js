// @flow
import * as React from 'react';
import { Platform, TouchableOpacity, TouchableNativeFeedback } from 'react-native';
import styled from 'styled-components/native/index';
import { baseColors, fontSizes } from 'utils/variables';
import { BaseText, BoldText } from 'components/Typography';
import ProfileImage from 'components/ProfileImage';

type Props = {
  userName: string,
  avatar: string,
  message: string,
  timeSent: string,
  unreadCount: number,
  onPress: Function,
}

const ItemRow = styled.View`
  flex-direction: row;
  align-items: flex-start;
  padding: 6px 18px 10px 18px;
`;

const AvatarWrapper = styled.View`
  width: 48px;
  height: 48px;
  border-radius: 24px;
  border: 2px solid #ffffff;
  shadow-color: black;
  shadow-opacity: 0.2;
  shadow-radius: 2px;
  elevation: 5;
  margin-top: 4px;
`;

const UserWrapper = styled.View`
  flex-direction: column;
  padding-left: 10px;
  padding-right: 10px;
  flex: 4;
`;

const UserName = styled(BoldText)`
  color: ${baseColors.slateBlack};
  font-size: ${fontSizes.medium};
  letter-spacing: 0.2px;
`;

const Message = styled(BaseText)`
  color: ${baseColors.darkGray};
  font-size: ${fontSizes.small};
  line-height: ${fontSizes.medium};
  letter-spacing: 0.1px;
`;

const DetailsWrapper = styled.View`
  flex-direction: column;
  width: 40px;
  align-items: flex-end;
`;

const TimeSent = styled(BaseText)`
  color: ${baseColors.darkGray}
  font-size: ${fontSizes.small};
`;

const UnreadCounter = styled.View`
  height: 20px;
  width: 20px;
  border-radius: 10px;
  background-color: ${baseColors.darkGray}
  align-self: flex-end;
  padding: 3px 0;
  margin-top: 6px;
  margin-right: 1px;
`;

const UnreadNumber = styled(BaseText)`
  color: #ffffff;
  font-size: 10px;
  align-self: center;
  width: 20px;
  text-align: center;
`;

export default class ChatListItem extends React.Component<Props> {
  _onPress = () => {
    this.props.onPress(this.props.userName, this.props.avatar);
  };

  render() {
    const {
      userName,
      avatar,
      message,
      timeSent,
      unreadCount,
    } = this.props;

    let customUnreadCount;
    if (unreadCount > 9) {
      customUnreadCount = '..';
    } else {
      customUnreadCount = unreadCount;
    }

    const item = (
      <ItemRow>
        <AvatarWrapper style={{ shadowOffset: { width: 1, height: 1 } }}>
          <ProfileImage
            uri={avatar}
            userName={userName}
            diameter={44}
          />
        </AvatarWrapper>
        <UserWrapper>
          <UserName>
            {userName}
          </UserName>
          <Message numberOfLines={2}>
            {message}
          </Message>
        </UserWrapper>
        <DetailsWrapper>
          <TimeSent>
            {timeSent}
          </TimeSent>
          {!!unreadCount &&
          <UnreadCounter>
            <UnreadNumber>
              {customUnreadCount}
            </UnreadNumber>
          </UnreadCounter>}
        </DetailsWrapper>
      </ItemRow>
    );

    if (Platform.OS === 'ios') {
      return <TouchableOpacity onPress={this._onPress}>{item}</TouchableOpacity>;
    }

    return (
      <TouchableNativeFeedback
        onPress={this._onPress}
        background={TouchableNativeFeedback.SelectableBackground()}
      >
        {item}
      </TouchableNativeFeedback>
    );
  }
}
