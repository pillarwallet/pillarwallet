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
import { MediumText, BaseText } from 'components/legacy/Typography';
import t from 'translations/translate';
import styled, { withTheme } from 'styled-components/native';

import IconButton from 'components/IconButton';
import Icon from 'components/legacy/Icon';
import Image from 'components/Image';

import { TRANSACTION_EVENT, TX_CONFIRMED_STATUS, TX_FAILED_STATUS } from 'constants/historyConstants';
import { COLLECTIBLE_TRANSACTION, COLLECTIBLE_SENT } from 'constants/collectiblesConstants';

import { fontTrackings, fontSizes, spacing, fontStyles } from 'utils/variables';
import { getThemeColors, themedColors } from 'utils/themes';
import { images } from 'utils/images';

import type { Theme } from 'models/Theme';


type Props = {
  onClose: Function,
  eventType?: string,
  eventStatus?: string,
  eventTime: string,
  iconUrl?: string,
  onIconPress?: Function,
  imageKey?: string,
  touchDisabled?: boolean,
  imageDiameter?: number,
  imageWrapperStyle?: Object,
  theme: Theme,
};


const getEventInfo = (eventType, eventStatus, colors) => {
  if (eventType === TRANSACTION_EVENT) {
    const isConfirmed = eventStatus === TX_CONFIRMED_STATUS;
    const isFailed = eventStatus === TX_FAILED_STATUS;

    if (isConfirmed) {
      return {
        title: t('title.success'),
        iconName: 'tick-circle',
        iconColor: colors.positive,
      };
    }
    if (isFailed) {
      return {
        title: t('title.failed'),
        iconName: 'warning-circle',
        iconColor: colors.negative,
      };
    }
    return {
      title: t('title.pending'),
      iconName: 'pending-circle',
    };
  }
  if (eventType === COLLECTIBLE_TRANSACTION) {
    return {
      title: eventStatus === COLLECTIBLE_SENT ? t('title.collectibleSent') : t('title.collectibleReceive'),
      iconName: null,
    };
  }

  return {
    title: t('title.connectionRequested'),
    iconName: 'connection-circle',
  };
};

const Wrapper = styled.View`
  width: 100%;
  border-top-left-radius: 30px;
  border-top-right-radius: 30px;
  overflow: hidden;
  padding: ${spacing.mediumLarge}px 50px;
  align-items: center;
  justify-content: center;
  border-bottom-width: 1px;
  border-bottom-color: ${themedColors.border};
`;

const CloseIcon = styled(IconButton)`
  position: absolute;
  height: 24px;
  width: 48px;
  top: ${Platform.select({
    ios: '20px',
    android: '19px',
  })}
  right: 0;
  opacity: 0.7;
`;

const EventTitle = styled(MediumText)`
  ${fontStyles.large};
  letter-spacing: ${fontTrackings.tiny}px;
  margin: 2px 0;
  text-align: center;
`;

const EventSubtitle = styled(BaseText)`
  ${fontStyles.tiny};
  letter-spacing: ${fontTrackings.mediumLarge}px;
  margin: 2px 0;
  text-align: center;
`;

const EventIcon = styled(Icon)`
  opacity: 0.7;
  margin-top: ${spacing.medium}px;
`;

const EventImage = styled(Image)`
  width: ${props => props.imageDiameter || 58}px;
  height: ${props => props.imageDiameter || 58}px;
`;

const ImageTouchable = styled.TouchableOpacity`
  width: ${props => props.imageDiameter || 58}px;
  height: ${props => props.imageDiameter || 58}px;
  border-radius: ${props => props.imageDiameter / 2 || 29}px;
  overflow: hidden;
  margin-top: 12px;
  justify-content: center;
  align-items: center;
  background-color: ${themedColors.secondaryAccent};
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
    imageDiameter,
    imageWrapperStyle,
    theme,
  } = props;

  const colors = getThemeColors(theme);
  const thisEvent = getEventInfo(eventType, eventStatus, colors);
  // in case iconUrl is an empty string, but it's an COLLECTIBLE TRX event
  const showImage = iconUrl || eventType === COLLECTIBLE_TRANSACTION;
  const { genericToken } = images(theme);

  return (
    <Wrapper>
      <CloseIcon
        icon="close"
        color={colors.text}
        onPress={onClose}
        fontSize={fontSizes.medium}
      />
      <EventTitle>{thisEvent.title}</EventTitle>
      <EventSubtitle>{eventTime}</EventSubtitle>
      {!showImage && !!thisEvent.iconName &&
      <EventIcon
        name={thisEvent.iconName}
        style={{
          color: thisEvent.iconColor || colors.primary,
          fontSize: 58,
        }}
      />}
      {!!showImage &&
        <ImageTouchable
          onPress={onIconPress}
          disabled={touchDisabled}
          imageDiameter={imageDiameter}
          style={imageWrapperStyle}
        >
          <EventImage
            key={imageKey}
            source={{ uri: iconUrl }}
            fallbackSource={genericToken}
            resizeMode="contain"
            imageDiameter={imageDiameter}
          />
        </ImageTouchable>}
    </Wrapper>
  );
};

export default withTheme(EventHeader);
