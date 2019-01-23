// @flow
import * as React from 'react';
import Modal from 'react-native-modal';
import styled from 'styled-components/native';
import Header from 'components/Header';
import Root from 'components/Root';
import Toast from 'components/Toast';
import { Wrapper } from 'components/Layout';
import { spacing, baseColors, UIColors } from 'utils/variables';
import { SubTitle } from 'components/Typography';
import { Keyboard } from 'react-native';

type Props = {
  title?: string,
  fullWidthTitle?: boolean,
  noBlueDotOnTitle?: boolean,
  dotColor?: string,
  children?: React.Node,
  subtitle?: string,
  fullScreenComponent?: ?React.Node,
  onModalHide?: Function,
  onModalHidden?: Function,
  noClose?: boolean,
  fullScreen?: boolean,
  isVisible: boolean,
  showHeader?: boolean,
  centerTitle?: boolean,
  noWrapTitle?: boolean,
  backgroundColor?: string,
  avoidKeyboard?: boolean,
  eventDetail?: boolean,
  eventType?: string,
  eventData?: ?Object,
  scrollOffset?: any,
  subtitleStyles?: ?Object,
  titleStyles?: ?Object,
};

const themes = {
  default: {
    padding: `0 ${spacing.rhythm}px`,
    borderRadius: '30px',
    background: UIColors.defaultBackgroundColor,
  },
  fullScreen: {
    padding: 0,
    borderRadius: 0,
    background: UIColors.defaultBackgroundColor,
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

const HeaderWrapper = styled.View`
  width: 100%;
`;

const ContentWrapper = styled.View`
  width: 100%;
  height: 100%;
  ${props => props.fullScreen ? 'padding-top: 20px;' : ''}
  ${props => props.bgColor && props.fullScreen ? `background-color: ${props.bgColor};` : ''}  
`;

const Backdrop = styled.TouchableWithoutFeedback`
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
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
  color: ${UIColors.primary};
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

export default class SlideModal extends React.Component<Props, *> {
  static defaultProps = {
    fullScreenComponent: null,
    subtitleStyles: {},
    titleStyles: {},
    backgroundColor: baseColors.lightGray,
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
  };

  handleScroll = () => {
    if (Toast.isVisible()) {
      Toast.close();
    }
  };

  render() {
    const {
      children,
      title,
      fullWidthTitle,
      noBlueDotOnTitle,
      dotColor,
      fullScreenComponent,
      onModalHidden,
      noClose,
      fullScreen,
      subtitle,
      isVisible,
      showHeader,
      centerTitle,
      noWrapTitle,
      backgroundColor,
      avoidKeyboard,
      eventDetail,
      scrollOffset,
      subtitleStyles,
      titleStyles,
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
              noWrapTitle={noWrapTitle}
              noPadding={!fullScreen}
              title={title}
              titleStyles={titleStyles}
              fullWidthTitle={fullWidthTitle}
              noBlueDotOnTitle={noBlueDotOnTitle || !title}
              dotColor={dotColor}
              onClose={!noClose ? this.hideModal : () => {}}
              noClose={noClose}
            />
          </HeaderWrapper>
        }
        {subtitle &&
          <ModalSubtitle
            style={subtitleStyles}
          >
            {subtitle}
          </ModalSubtitle>
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
          <Wrapper fullScreen>
            {modalInner}
          </Wrapper>
        );
      }

      if (eventDetail) {
        return (
          <ModalBackground theme={theme}>
            { children }
          </ModalBackground>
        );
      }

      return (
        <ModalBackground theme={theme}>
          { modalInner }
        </ModalBackground>
      );
    };

    const animationTiming = 400;
    return (
      <Modal
        isVisible={isVisible}
        scrollTo={this.handleScroll}
        onSwipe={this.hideModal}
        onModalHide={onModalHidden}
        onBackdropPress={this.hideModal}
        backdropOpacity={fullScreen ? 1 : 0.7}
        backdropColor={fullScreen ? backgroundColor : baseColors.black}
        onBackButtonPress={this.hideModal}
        animationInTiming={animationTiming}
        animationOutTiming={animationTiming}
        scrollOffset={scrollOffset}
        animationIn="slideInUp"
        animationOut="slideOutDown"
        swipeDirection="down"
        avoidKeyboard={avoidKeyboard}
        style={{
          margin: 0,
          position: 'relative',
          zIndex: 10,
        }}
      >
        <Root>
          <ContentWrapper fullScreen={fullScreen} bgColor={backgroundColor}>
            {!fullScreen &&
              <Backdrop onPress={this.hideModal}>
                <ContentWrapper />
              </Backdrop>
            }
            {modalContent()}
          </ContentWrapper>
        </Root>
        {isVisible && fullScreenComponent}
      </Modal>
    );
  }
}
