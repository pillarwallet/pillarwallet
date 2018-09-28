// @flow
import * as React from 'react';
import { Platform } from 'react-native';
import { BoldText, BaseText } from 'components/Typography';
import { fontTrackings, baseColors, fontSizes, spacing } from 'utils/variables';
import styled from 'styled-components/native';
import IconButton from 'components/IconButton';
import Icon from 'components/Icon';

import { TRANSACTION_EVENT } from 'constants/historyConstants';
import {
  TYPE_RECEIVED,
  TYPE_ACCEPTED,
} from 'constants/invitationsConstants';

type Props = {
  onClose: Function,
  eventType?: string,
  eventStatus: string,
  eventTime: string,
}

const getEventInfo = (eventType, eventStatus) => {
  if (eventType === TRANSACTION_EVENT) {
    const isPending = eventStatus === 'pending';
    return {
      title: isPending ? 'Pending' : 'Success',
      background: isPending ? baseColors.burningFire : baseColors.freshEucalyptus,
      iconName: isPending ? 'pending-circle' : 'tick-circle',
    };
  }

  if (eventStatus === TYPE_RECEIVED) {
    return {
      title: 'Incoming connection',
      background: baseColors.rose,
      iconName: 'connection-circle',
    };
  } else if (eventStatus === TYPE_ACCEPTED) {
    return {
      title: 'Connection established',
      background: baseColors.cerulean,
      iconName: 'connection-circle',
    };
  }

  return {
    title: 'Request sent',
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

const EventHeader = (props: Props) => {
  const {
    onClose,
    eventType,
    eventStatus,
    eventTime,
  } = props;

  const thisEvent = getEventInfo(eventType, eventStatus);

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
      <EventIcon
        name={thisEvent.iconName}
        style={{
          color: baseColors.white,
          fontSize: 58,
        }}
      />
    </Wrapper>
  );
};

export default EventHeader;
