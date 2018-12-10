// @flow
import * as React from 'react';
import { StyleSheet, Platform } from 'react-native';
import Modal from 'react-native-modal';
import styled from 'styled-components/native';
import HTMLView from 'react-native-htmlview';
import { Container, ScrollWrapper } from 'components/Layout';
import Header from 'components/Header';
import { baseColors, fontSizes, UIColors } from 'utils/variables';
import Spinner from 'components/Spinner';

type Props = {
  htmlEndpoint: string,
  fullScreenComponent?: ?React.Node,
  onModalHide?: Function,
  isVisible: boolean,
  modalHide: Function,
};

type State = {
  isHtmlFetched: boolean,
  htmlData: string,
};

const ActivityIndicatorWrapper = styled.View`
  flex: 1;
  align-items: center;
  justify-content: center;
`;

const titleStyle = {
  margin: 0,
  fontWeight: '700',
  color: UIColors.defaultTextColor,
};

const commonFontFamily = {
  fontFamily: Platform.OS === 'android' ? 'AktivGrotesk-Regular' : 'Aktiv Grotesk App',
};

const commonTextStyle = {
  ...commonFontFamily,
  margin: 0,
  color: UIColors.defaultTextColor,
  fontSize: fontSizes.extraSmall,
};

const styles = StyleSheet.create({
  h1: {
    ...titleStyle,
    ...commonFontFamily,
    fontSize: fontSizes.extraLarge,
  },
  h2: {
    ...titleStyle,
    ...commonFontFamily,
    fontSize: fontSizes.medium,
    marginBottom: 60,
  },
  p: {
    ...commonTextStyle,
  },
  ul: {
    ...commonTextStyle,
  },
  li: {
    ...commonTextStyle,
  },
  a: {
    ...commonTextStyle,
    color: baseColors.electricBlue,
  },
});

export default class HTMLContentModal extends React.Component<Props, State> {
  static defaultProps = {
    fullScreenComponent: null,
  };

  constructor(props: Props) {
    super(props);
    this.state = {
      isHtmlFetched: false,
      htmlData: '',
    };
  }

  componentDidMount() {
    const { htmlEndpoint } = this.props;
    fetch(htmlEndpoint)
      .then((resp) => { return resp.text(); })
      .then((text) => {
        this.setState({
          isHtmlFetched: true,
          htmlData: text.replace(/(\r\n\t|\n|\r\t)/gm, ''),
        });
      })
      .catch((() => {}));
  }

  handleModalClose = () => {
    this.setState({ isHtmlFetched: false });
  };

  render() {
    const {
      isVisible,
      modalHide,
    } = this.props;
    const {
      htmlData,
      isHtmlFetched,
    } = this.state;

    const animationInTiming = 400;
    const animationOutTiming = 400;
    return (
      <Modal
        isVisible={isVisible}
        animationInTiming={animationInTiming}
        animationOutTiming={animationOutTiming}
        animationIn="slideInUp"
        animationOut="slideOutDown"
        onBackButtonPress={modalHide}
        onModalHide={this.handleModalClose}
        style={{
          margin: 0,
          justifyContent: 'flex-start',
        }}
      >
        <Container>
          <Header onClose={modalHide} />
          {!isHtmlFetched &&
            <ActivityIndicatorWrapper>
              <Spinner />
            </ActivityIndicatorWrapper>
          }
          {!!isHtmlFetched &&
          <ScrollWrapper regularPadding>
            <HTMLView
              value={htmlData}
              stylesheet={styles}
            />
          </ScrollWrapper>
          }
        </Container>
      </Modal>
    );
  }
}
