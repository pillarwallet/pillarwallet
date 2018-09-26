// @flow
import * as React from 'react';
import { Platform } from 'react-native';
import { BoldText, BaseText } from 'components/Typography';
import { fontTrackings, baseColors, fontSizes, spacing } from 'utils/variables';
import styled from 'styled-components/native';
import IconButton from 'components/IconButton';
import Icon from 'components/Icon';
import {
  TRANSACTION_SENT,
  TRANSACTION_SENT_PENDING,
  TRANSACTION_RECEIVED,
  TRANSACTION_RECEIVED_PENDING,
  CONNECTION_INCOMING,
  CONNECTION_SENT,
  CONNECTION_MADE,
} from 'constants/eventsConstants';

type Props = {
  onBack?: Function,
  onClose?: Function,
  onCloseText?: string,
  onNextPress?: Function,
  nextText?: string,
  nextIcon?: string,
  title?: string,
  centerTitle?: boolean,
  noPadding?: boolean,
  noMargin?: boolean,
  flexStart?: boolean,
  light?: boolean,
  style?: Object,
  headerRightFlex?: string,
  overlay?: boolean,
  eventType?: string,
}

const getEventInfo = (eventType) => {
  switch (eventType) {
    case TRANSACTION_SENT:
      return {
        title: 'Success',
        background: baseColors.freshEucalyptus,
        subtitle: 'OCTOBER 31, 2017 21:14',
        iconName: 'tick-circle',
      };
    case TRANSACTION_RECEIVED:
      return {
        title: 'Success',
        background: baseColors.freshEucalyptus,
        subtitle: 'OCTOBER 31, 2017 21:14',
        iconName: 'tick-circle',
      };
    case TRANSACTION_SENT_PENDING:
      return {
        title: 'Pending',
        background: baseColors.burningFire,
        subtitle: '4 MIN 19 SEC AGO',
        iconName: 'pending-circle',
      };
    case TRANSACTION_RECEIVED_PENDING:
      return {
        title: 'Pending',
        background: baseColors.burningFire,
        subtitle: '4 MIN 19 SEC AGO',
        iconName: 'pending-circle',
      };
    case CONNECTION_INCOMING:
      return {
        title: 'Incoming connection',
        background: baseColors.rose,
        subtitle: '20 APRIL, 16:30',
        iconName: 'connection-circle',
      };
    case CONNECTION_SENT:
      return {
        title: 'Request sent',
        background: baseColors.electricBlue,
        subtitle: '25 APRIL, 18:05',
        iconName: 'connection-circle',
      };
    case CONNECTION_MADE:
      return {
        title: 'Connection established',
        background: baseColors.cerulean,
        subtitle: '20 APRIL, 16:31',
        iconName: 'connection-circle',
      };
    default:
      return {
        title: 'Event',
        background: baseColors.darkGray,
        subtitle: '20 APRIL, 16:31',
        iconName: 'info-circle',
      };
  }
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
  } = props;

  const thisEvent = getEventInfo(eventType);

  return (
    <Wrapper background={thisEvent.background}>
      <CloseIcon
        icon="close"
        color={baseColors.white}
        onPress={onClose}
        fontSize={fontSizes.small}
      />
      <EventTitle>{thisEvent.title}</EventTitle>
      <EventSubtitle>{thisEvent.subtitle}</EventSubtitle>
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
