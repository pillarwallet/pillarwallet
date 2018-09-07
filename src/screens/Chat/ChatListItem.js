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
  message?: string,
  timeSent?: string,
  unreadCount?: any,
  onPress: Function,
  centerVertical?: boolean,
}

const ItemRow = styled.View`
  flex-direction: row;
  align-items: ${props => props.centerVertical ? 'center' : 'flex-start'};
  padding: 6px 16px 10px 16px;
`;

const InnerRow = styled.View`
  flex-direction: row;
  align-items: flex-start;
  justify-content: space-between;
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
  margin-top: 5px;
  margin-right: 10px;
`;

const InnerColumn = styled.View`
  flex-direction: column;
  flex: 4;
`;

const UserName = styled(BoldText)`
  color: ${baseColors.slateBlack};
  font-size: ${fontSizes.medium};
  letter-spacing: 0.2px;
  flex: 1;
`;

const Message = styled(BaseText)`
  color: ${baseColors.darkGray};
  font-size: ${fontSizes.small};
  line-height: ${fontSizes.medium + 2};
  letter-spacing: 0.1px;
  margin-top: 2px;
  flex: 1;
`;

const TimeWrapper = styled.View`
  align-items: flex-start;
  margin-top: ${Platform.OS === 'ios' ? 6 : 4}px;
`;

const TimeSent = styled(BaseText)`
  color: ${baseColors.darkGray}
  font-size: ${fontSizes.extraSmall};
  line-height: ${fontSizes.small};
  text-align-vertical: bottom;
`;

const CounterPlaceHolder = styled.View`
  flex: 0 0 50px;
  height: 100%;
`;

const UnreadCounter = styled.View`
  height: 20px;
  width: 20px;
  border-radius: 10px;
  background-color: ${baseColors.darkGray}
  align-self: flex-end;
  padding: 3px 0;
  margin-top: 2px;
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
      centerVertical,
    } = this.props;

    let customUnreadCount;
    if (!!unreadCount && unreadCount > 9) {
      customUnreadCount = '..';
    } else {
      customUnreadCount = unreadCount;
    }

    const item = (
      <ItemRow centerVertical={centerVertical}>
        <AvatarWrapper style={{ shadowOffset: { width: 1, height: 1 } }}>
          <ProfileImage
            uri={avatar}
            userName={userName}
            diameter={44}
          />
        </AvatarWrapper>
        <InnerColumn>
          <InnerRow>
            <UserName>
              {userName}
            </UserName>
            <TimeWrapper>
              {!!timeSent &&
              <TimeSent>
                {timeSent}
              </TimeSent>}
            </TimeWrapper>
          </InnerRow>
          <InnerRow>
            <Message numberOfLines={2}>
              {message}
            </Message>
            <CounterPlaceHolder>
              {!!unreadCount &&
              <UnreadCounter>
                <UnreadNumber>
                  {customUnreadCount}
                </UnreadNumber>
              </UnreadCounter>}
            </CounterPlaceHolder>
          </InnerRow>
        </InnerColumn>
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
