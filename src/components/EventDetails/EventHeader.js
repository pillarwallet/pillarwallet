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
import { Platform } from 'react-native';
import { BoldText, BaseText } from 'components/Typography';
import { fontTrackings, baseColors, fontSizes, spacing } from 'utils/variables';
import styled from 'styled-components/native';
import { CachedImage } from 'react-native-cached-image';
import IconButton from 'components/IconButton';
import Icon from 'components/Icon';

import { TRANSACTION_EVENT, TX_CONFIRMED_STATUS, TX_FAILED_STATUS } from 'constants/historyConstants';
import { COLLECTIBLE_TRANSACTION, COLLECTIBLE_SENT } from 'constants/collectiblesConstants';
import {
  TYPE_RECEIVED,
  TYPE_ACCEPTED,
} from 'constants/invitationsConstants';

const genericToken = require('assets/images/tokens/genericToken.png');

type Props = {
  onClose: Function,
  eventType?: string,
  eventStatus: string,
  eventTime: string,
  iconUrl?: string,
  onIconPress?: Function,
  imageKey?: string,
  touchDisabled?: boolean,
}

const getEventInfo = (eventType, eventStatus) => {
  if (eventType === TRANSACTION_EVENT) {
    const isConfirmed = eventStatus === TX_CONFIRMED_STATUS;
    const isFailed = eventStatus === TX_FAILED_STATUS;

    if (isConfirmed) {
      return {
        title: 'Success',
        background: baseColors.freshEucalyptus,
        iconName: 'tick-circle',
      };
    }
    if (isFailed) {
      return {
        title: 'Failed',
        background: baseColors.burningFire,
        iconName: 'warning-circle',
      };
    }
    return {
      title: 'Pending',
      background: baseColors.burningFire,
      iconName: 'pending-circle',
    };
  }
  if (eventStatus === TYPE_RECEIVED) {
    return {
      title: 'Incoming connection',
      background: baseColors.rose,
      iconName: 'connection-circle',
    };
  }
  if (eventStatus === TYPE_ACCEPTED) {
    return {
      title: 'Connection established',
      background: baseColors.cerulean,
      iconName: 'connection-circle',
    };
  }
  if (eventType === COLLECTIBLE_TRANSACTION) {
    return {
      title: eventStatus === COLLECTIBLE_SENT ? 'Collectible sent' : 'Collectible received',
      background: baseColors.shark,
      iconName: null,
    };
  }

  return {
    title: 'Requested',
    background: baseColors.electricBlue,
    iconName: 'connection-circle',
  };
};

const Wrapper = styled.View`
  width: 100%;
  border-top-left-radius: 30px;
  border-top-right-radius: 30px;
  overflow: hidden;
  padding: ${spacing.mediumLarge}px 50px;
  background-color: ${props => props.background};
  align-items: center;
  justify-content: center;
`;

const CloseIcon = styled(IconButton)`
  position: absolute;
  height: 24px;
  width: 24px;
  top: ${Platform.select({
    ios: '20px',
    android: '19px',
  })}
  right: 12px;
  opacity: 0.7;
`;

const EventTitle = styled(BoldText)`
  font-size: ${fontSizes.mediumLarge}px;
  letter-spacing: ${fontTrackings.tiny}px;
  color: ${baseColors.white};
  margin: 2px 0;
  text-align: center;
`;

const EventSubtitle = styled(BaseText)`
  font-size: ${fontSizes.tiny}px;
  letter-spacing: ${fontTrackings.mediumLarge}px;
  color: ${baseColors.white};
  margin: 2px 0;
  text-align: center;
`;

const EventIcon = styled(Icon)`
  opacity: 0.7;
  margin-top: ${spacing.medium}px;
`;

const EventImage = styled(CachedImage)`
  width: 58px;
  height: 58px;
`;

const ImageTouchable = styled.TouchableOpacity`
  width: 58px;
  height: 58px;
  border-radius: 29px;
  overflow: hidden;
  margin-top: 12px;
  justify-content: center;
  align-items: center;
  background-color: ${baseColors.lightGray};
`;

const EventHeader = (props: Props) => {
  const {
    onClose,
    eventType,
    eventStatus,
    eventTime,
    iconUrl,
    onIconPress,
    imageKey,
    touchDisabled,
  } = props;

  const thisEvent = getEventInfo(eventType, eventStatus);
  // in case iconUrl is an empty string, but it's an COLLECTIBLE TRX event
  const showImage = iconUrl || eventType === COLLECTIBLE_TRANSACTION;

  return (
    <Wrapper background={thisEvent.background}>
      <CloseIcon
        icon="close"
        color={baseColors.white}
        onPress={onClose}
        fontSize={fontSizes.small}
      />
      <EventTitle>{thisEvent.title}</EventTitle>
      <EventSubtitle>{eventTime}</EventSubtitle>
      {!showImage && !!thisEvent.iconName &&
      <EventIcon
        name={thisEvent.iconName}
        style={{
          color: baseColors.white,
          fontSize: 58,
        }}
      />}
      {!!showImage &&
        <ImageTouchable onPress={onIconPress} disabled={touchDisabled}>
          <EventImage
            key={imageKey}
            source={{ uri: iconUrl }}
            fallbackSource={genericToken}
            resizeMode="contain"
          />
        </ImageTouchable>}
    </Wrapper>
  );
};

export default EventHeader;
