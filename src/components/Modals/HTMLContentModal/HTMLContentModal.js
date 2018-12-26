// @flow
import * as React from 'react';
import Modal from 'react-native-modal';
import styled from 'styled-components/native';
import HTMLView from 'react-native-htmlview';
import { Container, ScrollWrapper } from 'components/Layout';
import Header from 'components/Header';
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

type CustomNode = {
  name: string,
}

const LEGAL_HTML_ENDPOINT = 'https://s3.eu-west-2.amazonaws.com/pillar-prod-core-profile-images/legal/';

const ActivityIndicatorWrapper = styled.View`
  flex: 1;
  align-items: center;
  justify-content: center;
`;

const commonTextStyle = {
  color: 'black',
  fontFamily: 'Aktiv Grotesk App',
};

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

  componentDidUpdate(prevProps: Props) {
    const { isVisible, htmlEndpoint } = this.props;
    const htmlEndpointFull = `${LEGAL_HTML_ENDPOINT}${htmlEndpoint}.html`;

    if (prevProps.isVisible !== isVisible && !!isVisible) {
      fetch(htmlEndpointFull)
        .then((resp) => { return resp.text(); })
        .then((text) => {
          this.setState({
            isHtmlFetched: true,
            htmlData: text.replace(/(\r\n\t|\n|\r\t)/gm, ''),
          });
        })
        .catch((() => {}));
    }
  }

  handleModalClose = () => {
    this.setState({ isHtmlFetched: false });
  };

  renderNode(node: CustomNode) {
    if (node.name === 'iframe' || node.name === 'script') {
      return null;
    }
    // If the function returns undefined (not null), the default renderer will be used for that node.
    return undefined;
  }

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
              textComponentProps={{ style: commonTextStyle }}
              renderNode={this.renderNode}
              style={{ marginBottom: 10 }}
              paragraphBreak={null}
            />
          </ScrollWrapper>
          }
        </Container>
      </Modal>
    );
  }
}

