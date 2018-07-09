// @flow
import * as React from 'react';
import { Platform, TouchableOpacity, TouchableNativeFeedback } from 'react-native';
import styled from 'styled-components/native/index';
import { baseColors, fontSizes, fontWeights } from 'utils/variables';

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
  padding-top: 6px;
  padding-bottom: 6px;
  padding-left: 6px;
`;

const AvatarWrapper = styled.View`
  width: 48px;
  height: 48px;
  border-radius: 24px;
  border: 2px solid #ffffff;
  shadowColor: black;
  shadowOpacity: 0.2;
  shadowRadius: 2px;
  elevation: 5;
  margin-top: 4px;
`;

const Avatar = styled.Image`
  width: 44px;
  height: 44px;
  border-radius: 22px;
`;

const UserWrapper = styled.View`
  flex-direction: column;
  padding-left: 10px;
  padding-right: 10px;
  flex: 4
`;

const UserName = styled.Text`
  color: ${baseColors.slateBlack}
  font-size: ${fontSizes.medium}
  font-weight: ${fontWeights.bold}
`;

const Message = styled.Text`
  color: ${baseColors.darkGray}
  font-size: ${fontSizes.small}
  line-height: ${fontSizes.medium}
`;

const DetailsWrapper = styled.View`
  flex-direction: column;
  width: 40px;
  align-items: flex-end;
`;

const TimeSent = styled.Text`
  color: ${baseColors.darkGray}
  font-size: ${fontSizes.small}
`;

const UnreadCounter = styled.View`
  height: 20px;
  width: 20px;
  borderRadius: 10px;
  background-color: ${baseColors.darkGray}
  align-self: flex-end;
  padding: 3px 0;
  margin-top: 6px;
  margin-right: 1px;
`;

const UnreadNumber = styled.Text`
  color: #ffffff;
  font-size: 10px;
  align-self: center;
  width: 20px;
  text-align: center;
`;

type State = {}

export default class ChatListItem extends React.Component<Props, State> {
  _onPress = () => {
    this.props.onPress(this.props.userName);
  };

  render() {
    const {
      userName,
      avatar,
      message,
      timeSent,
      unreadCount,
    } = this.props

    const item = (
      <ItemRow>
        <AvatarWrapper style={{ shadowOffset: { width: 1, height: 1 } }}>
          <Avatar source={{ uri: avatar }} />
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
              {unreadCount}
            </UnreadNumber>
          </UnreadCounter>}
        </DetailsWrapper>
      </ItemRow>
    );

    return (
      Platform.OS === 'ios' ?
        <TouchableOpacity onPress={this._onPress}>
          {item}
        </TouchableOpacity>
        :
        <TouchableNativeFeedback
          onPress={this._onPress}
          background={TouchableNativeFeedback.SelectableBackground()}>
          {item}
        </TouchableNativeFeedback>
    );
  }
}
