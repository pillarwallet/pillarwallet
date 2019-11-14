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
import Modal from 'react-native-modal';
import styled from 'styled-components/native';
import { StyleSheet, ScrollView } from 'react-native';
import HTMLView from 'react-native-htmlview';
import get from 'lodash.get';

// components
import { Container } from 'components/Layout';
import Header from 'components/Header';
import Spinner from 'components/Spinner';

// utils
import { fontSizes, lineHeights, baseColors, appFont, spacing } from 'utils/variables';

// types
import type { ScrollToProps } from 'components/Modals/SlideModal';

type Props = {
  htmlEndpoint: string,
  onModalHide?: Function,
  isVisible: boolean,
  modalHide: Function,
};

type State = {
  isHtmlFetched: boolean,
  htmlData: string,
  scrollOffset: ?number,
  contentContainerHeight: ?number,
  containerHeight: ?number,
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
  fontFamily: appFont.regular,
};

const boldStyle = { fontFamily: appFont.medium };

const baseStyles = StyleSheet.create({
  b: boldStyle,
  strong: boldStyle,
  a: {
    ...boldStyle,
    color: baseColors.electricBlue,
    fontSize: fontSizes.regular,
    lineHeight: lineHeights.regular,
  },
  li: { fontSize: fontSizes.regular, lineHeight: lineHeights.regular },
  p: { fontSize: fontSizes.regular, lineHeight: lineHeights.regular },
  h1: { ...boldStyle, fontSize: fontSizes.giant, lineHeight: lineHeights.giant },
  h2: { ...boldStyle, fontSize: fontSizes.large, lineHeight: lineHeights.large },
  h3: { ...boldStyle, fontSize: fontSizes.big, lineHeight: lineHeights.big },
  h4: { ...boldStyle, fontSize: fontSizes.medium, lineHeight: lineHeights.medium },
  h5: { ...boldStyle, fontSize: fontSizes.regular, lineHeight: lineHeights.regular },
  h6: { ...boldStyle, fontSize: fontSizes.regular, lineHeight: lineHeights.regular },
});

export default class HTMLContentModal extends React.Component<Props, State> {
  scrollViewRef: React.ElementRef<ScrollView>;

  constructor(props: Props) {
    super(props);
    this.scrollViewRef = React.createRef();
    this.state = {
      isHtmlFetched: false,
      htmlData: '',
      scrollOffset: 0,
      containerHeight: 0,
      contentContainerHeight: 0,
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

  renderNode = (node: CustomNode) => {
    if (node.name === 'iframe' || node.name === 'script') {
      return null;
    }
    // If the function returns undefined (not null), the default renderer will be used for that node.
    return undefined;
  };

  handleModalScrollTo = (p: ScrollToProps) => {
    if (!p || !this.scrollViewRef.current) return;
    this.scrollViewRef.current.scrollTo(p);
  };

  handleContentOnScroll = (event: Object) => {
    const contentOffsetY = get(event, 'nativeEvent.contentOffset.y');
    this.setState({ scrollOffset: contentOffsetY });
  };

  handleContentOnLayout = (event: Object) => {
    const { containerHeight } = this.state;
    const { height } = event.nativeEvent.layout;
    if (!containerHeight || containerHeight !== height) {
      this.setState({ containerHeight: height });
    }
  };

  handleOnContentSizeChange = (width: number, height: number) => {
    this.setState({ contentContainerHeight: height });
  };

  render() {
    const {
      isVisible,
      modalHide,
    } = this.props;
    const {
      htmlData,
      isHtmlFetched,
      scrollOffset,
      contentContainerHeight,
      containerHeight,
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
        scrollOffset={scrollOffset}
        onSwipeComplete={modalHide}
        scrollOffsetMax={contentContainerHeight && containerHeight ? contentContainerHeight - containerHeight : null}
        swipeDirection="down"
        scrollTo={this.handleModalScrollTo}
        propagateSwipe
        style={{ margin: 0, justifyContent: 'flex-start' }}
      >
        <Container>
          <Header onClose={modalHide} />
          {!isHtmlFetched &&
            <ActivityIndicatorWrapper>
              <Spinner />
            </ActivityIndicatorWrapper>
          }
          {!!isHtmlFetched &&
            // do not put ScrollView as styled component or ref.scrollTo will fail
            <ScrollView
              paddingHorizontal={spacing.rhythm}
              ref={this.scrollViewRef}
              onScroll={this.handleContentOnScroll}
              scrollEventThrottle={16} // inherited from ScrollWrapper component
              onLayout={this.handleContentOnLayout}
              onContentSizeChange={this.handleOnContentSizeChange}
            >
              <HTMLView
                value={htmlData}
                textComponentProps={{ style: commonTextStyle }}
                stylesheet={baseStyles}
                renderNode={this.renderNode}
                style={{ marginBottom: 10 }}
                paragraphBreak={null}
              />
            </ScrollView>
          }
        </Container>
      </Modal>
    );
  }
}
