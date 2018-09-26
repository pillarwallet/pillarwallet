// @flow
import * as React from 'react';
import Modal from 'react-native-modal';
import styled from 'styled-components/native';
import Header from 'components/Header';
import Root from 'components/Root';
import Toast from 'components/Toast';
import Button from 'components/Button';
import ListItemUnderlined from 'components/ListItem';
import ProfileImage from 'components/ProfileImage';
import { Container } from 'components/Layout';
import { spacing, baseColors, fontSizes, fontWeights } from 'utils/variables';
import { SubTitle, BoldText, BaseText } from 'components/Typography';
import { Keyboard } from 'react-native';

// constants
import {
  TRANSACTION_SENT,
  TRANSACTION_SENT_PENDING,
  TRANSACTION_RECEIVED,
  TRANSACTION_RECEIVED_PENDING,
  CONNECTION_INCOMING,
  CONNECTION_SENT,
  CONNECTION_MADE,
} from 'constants/eventsConstants';


import EventHeader from './EventHeader';


type Props = {
  title?: string,
  children?: React.Node,
  subtitle?: string,
  fullScreenComponent?: ?React.Node,
  onModalHide?: Function,
  onModalHidden?: Function,
  fullScreen?: boolean,
  isVisible: boolean,
  showHeader?: boolean,
  centerTitle?: boolean,
  backgroundColor?: string,
  avoidKeyboard?: boolean,
  eventDetail?: boolean,
  eventType?: string,
  eventData?: ?Object,
};

const themes = {
  default: {
    padding: `0 ${spacing.rhythm}px`,
    borderRadius: '30px',
    background: baseColors.white,
  },
  fullScreen: {
    padding: 0,
    borderRadius: 0,
    background: baseColors.white,
  },
  eventDetail: {
    padding: 0,
    borderRadius: '30px',
    background: 'transparent',
  },
};

const getTheme = (props: Props) => {
  if (props.fullScreen) {
    return themes.fullScreen;
  }
  if (props.eventDetail) {
    return themes.eventDetail;
  }
  return themes.default;
};


const ModalWrapper = styled.View`
  width: 100%;
  height: 100%;
`;

const HeaderWrapper = styled.View`
`;

const ModalBackground = styled.View`
  border-top-left-radius: ${props => props.theme.borderRadius};
  border-top-right-radius:  ${props => props.theme.borderRadius};
  padding: ${props => props.theme.padding};
  box-shadow: 0px 2px 7px rgba(0,0,0,.1);
  elevation: 1;
  margin-top: auto;
  background-color: ${props => props.theme.background};
`;

const ModalSubtitle = styled(SubTitle)`
  padding: 10px 0;
`;

const getModalContentPadding = (showHeader: boolean) => {
  if (showHeader) {
    return '0';
  }
  return `${spacing.rhythm}px 0 0`;
};

const ModalContent = styled.View`
  flex-direction: column;
  ${({ fullScreen, showHeader }) => fullScreen && showHeader && `
    padding: ${getModalContentPadding(showHeader)};
  `}
  ${({ fullScreen }) => fullScreen && `
    flex: 1;
  `}
`;

const ModalOverflow = styled.View`
  width: 100%;
  height: 100px;
  margin-bottom: -100px;
  background-color: ${baseColors.white};
`;

const EventBody = styled.View`
  padding: 0 ${spacing.mediumLarge}px 70px;
  background-color: ${baseColors.snowWhite};
`;

const EventProfileImage = styled(ProfileImage)`
  margin-right: 10px;
`;

const ButtonsWrapper = styled.View`
  margin-top: 6px;
`;

const EventButton = styled(Button)`
  margin-top: 14px;
`;

const Confirmations = styled(BoldText)`
  font-size: ${fontSizes.large}px;
  font-weight: ${fontWeights.bold};
  margin-bottom: ${spacing.medium}px;
  margin-right: 4px;
  color: ${baseColors.burningFire};
`;

const EventRow = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: center;
  margin-top: 32px;
  margin-bottom: 8px;
  flex-wrap: wrap;
`;

const EventBodyTitle = styled(BaseText)`
  font-size: ${fontSizes.large}px;
  font-weight: ${fontWeights.medium};
  color: ${props => props.color ? props.color : baseColors.slateBlack};
  margin: 0 2px 2px;
`;

export default class SlideModal extends React.Component<Props, *> {
  static defaultProps = {
    fullScreenComponent: null,
  };

  hideModal = () => {
    Keyboard.dismiss();
    const TIMEOUT = Toast.isVisible() ? 150 : 0;
    if (Toast.isVisible()) {
      Toast.close();
    }
    const timer = setTimeout(() => {
      if (this.props.onModalHide) {
        this.props.onModalHide();
      }
      clearTimeout(timer);
    }, TIMEOUT);
  }

  handleScroll = () => {
    if (Toast.isVisible()) {
      Toast.close();
    }
  }

  renderEventBody = (eventType?: string) => {
    if (eventType === TRANSACTION_SENT || eventType === TRANSACTION_SENT_PENDING) {
      return (
        <EventBody>
          <ListItemUnderlined label="AMOUNT SENT" value="1,640.58 PLR" />
          <ListItemUnderlined
            label="RECIPIENT"
            value="Areya"
            valueAddon={(<EventProfileImage
              userName="Areya"
              diameter={40}
              style={{ marginBottom: 6 }}
            />)}
          />
          {eventType === TRANSACTION_SENT &&
          <ListItemUnderlined label="TRANSACTION FEE" value="0.004 ETH" />
          }
          {eventType === TRANSACTION_SENT_PENDING &&
          <ListItemUnderlined
            label="CONFIRMATIONS"
            valueAddon={(<Confirmations>2</Confirmations>)}
            value="of 6"
          />
          }
          <ButtonsWrapper>
            <EventButton block title="View on the blockchain" primaryInverted />
          </ButtonsWrapper>
        </EventBody>
      );
    } else if (eventType === TRANSACTION_RECEIVED || eventType === TRANSACTION_RECEIVED_PENDING) {
      return (
        <EventBody>
          <ListItemUnderlined label="AMOUNT RECEIVED" value="1,640.58 PLR" />
          <ListItemUnderlined
            label="SENDER"
            value="Areya"
            valueAddon={(<EventProfileImage
              userName="Areya"
              diameter={40}
              style={{ marginBottom: 6 }}
            />)}
          />
          {eventType === TRANSACTION_RECEIVED_PENDING &&
          <ListItemUnderlined
            label="CONFIRMATIONS"
            valueAddon={(<Confirmations>2</Confirmations>)}
            value="of 6"
          />
          }
          <ButtonsWrapper>
            <EventButton block title="View on the blockchain" primaryInverted />
          </ButtonsWrapper>
        </EventBody>
      );
    } else if (eventType === CONNECTION_INCOMING ||
      eventType === CONNECTION_SENT ||
      eventType === CONNECTION_MADE) {
      return (
        <EventBody>
          <EventRow>
            <EventProfileImage
              userName="Areya"
              diameter={40}
            />
            <EventBodyTitle>
              @areya
            </EventBodyTitle>
            <EventBodyTitle color={baseColors.coolGrey}>
              (Areya Juntasa)
            </EventBodyTitle>
          </EventRow>
          {eventType === CONNECTION_INCOMING &&
          <ButtonsWrapper>
            <EventButton block title="Accept request" primaryInverted />
            <EventButton block title="Decline" dangerInverted />
          </ButtonsWrapper>
          }
          {eventType === CONNECTION_SENT &&
          <ButtonsWrapper>
            <EventButton block title="Cancel request" dangerInverted />
          </ButtonsWrapper>
          }
          {eventType === CONNECTION_MADE &&
          <ButtonsWrapper>
            <EventButton block title="Send tokens" primaryInverted />
            <EventButton block title="Send message" primaryInverted />
          </ButtonsWrapper>
          }
        </EventBody>
      );
    }
    return (
      <EventBody />
    );
  }

  render() {
    const {
      children,
      title,
      fullScreenComponent,
      onModalHidden,
      fullScreen,
      subtitle,
      isVisible,
      showHeader,
      centerTitle,
      backgroundColor,
      avoidKeyboard,
      eventDetail,
      eventType,
      // eventData,
    } = this.props;

    const theme = getTheme(this.props);

    const showModalHeader = !fullScreen || showHeader;

    const modalInner = (
      <React.Fragment>
        {showModalHeader &&
          <HeaderWrapper fullScreen={fullScreen}>
            <Header
              noMargin={!fullScreen}
              centerTitle={centerTitle}
              noPadding={!fullScreen}
              title={title}
              onClose={this.hideModal}
            />
          </HeaderWrapper>
        }
        {subtitle &&
          <ModalSubtitle>{subtitle}</ModalSubtitle>
        }
        <ModalContent
          fullScreen={fullScreen}
          showHeader={showHeader}
        >
          {children}
        </ModalContent>
        <ModalOverflow />
      </React.Fragment>
    );


    const modalContent = () => {
      if (fullScreen) {
        return (
          <Container color={backgroundColor}>
            {modalInner}
          </Container>
        );
      }

      if (eventDetail) {
        return (
          <React.Fragment>
            <EventHeader eventType={eventType} onClose={this.hideModal} />
            {this.renderEventBody(eventType)}
          </React.Fragment>
        );
      }
      return modalInner;
    };

    const animationTiming = 400;
    return (
      <Modal
        isVisible={isVisible}
        scrollTo={this.handleScroll}
        onSwipe={this.hideModal}
        onModalHide={onModalHidden}
        onBackdropPress={this.hideModal}
        animationInTiming={animationTiming}
        animationOutTiming={animationTiming}
        animationIn="slideInUp"
        animationOut="slideOutDown"
        swipeDirection="down"
        avoidKeyboard={avoidKeyboard}
        style={{
          margin: 0,
        }}
      >
        <ModalWrapper>
          <Root>
            <ModalBackground theme={theme}>
              {modalContent()}
            </ModalBackground>
          </Root>
        </ModalWrapper>
        {isVisible && fullScreenComponent}
      </Modal>
    );
  }
}
