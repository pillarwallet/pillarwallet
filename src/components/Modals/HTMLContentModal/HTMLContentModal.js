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
import styled, { withTheme } from 'styled-components/native';
import { StyleSheet, ScrollView } from 'react-native';
import HTMLView from 'react-native-htmlview';
import get from 'lodash.get';

// components
import Spinner from 'components/Spinner';
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import Modal from 'components/Modal';

// utils
import { fontSizes, lineHeights, appFont, spacing } from 'utils/variables';
import { getThemeColors } from 'utils/themes';

// types
import type { ScrollToProps } from 'components/Modals/SlideModal';
import type { Theme } from 'models/Theme';

const LEGAL_HTML_ENDPOINT_PREFIX = 'https://s3.eu-west-2.amazonaws.com/pillar-prod-core-profile-images/legal/';
export const ENDPOINTS = {
  TERMS_OF_SERVICE: 'terms_of_service',
  PRIVACY_POLICY: 'privacy_policy',
};

type OwnProps = {|
  htmlEndpoint: string,
|};

type Props = {|
  ...OwnProps,
  theme: Theme,
|};

type State = {|
  isHtmlFetched: boolean,
  htmlData: string,
  scrollOffset: number,
  contentContainerHeight: number,
  containerHeight: number,
|};

type CustomNode = {
  name: string,
}

const ActivityIndicatorWrapper = styled.View`
  flex: 1;
  align-items: center;
  justify-content: center;
`;

const boldStyle = { fontFamily: appFont.medium };

const baseStyles = (colors) => {
  return (
    StyleSheet.create({
      b: boldStyle,
      strong: boldStyle,
      a: {
        ...boldStyle,
        color: colors.primary,
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
    })
  );
};

class HTMLContentModal extends React.Component<Props, State> {
  scrollViewRef: React.ElementRef<ScrollView>;
  modalRef = React.createRef();

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

  componentDidMount() {
    const { htmlEndpoint } = this.props;
    // eslint-disable-next-line i18next/no-literal-string
    const htmlEndpointFull = `${LEGAL_HTML_ENDPOINT_PREFIX}${htmlEndpoint}.html`;

    fetch(htmlEndpointFull)
      .then((resp) => resp.text())
      .then((text) => {
        this.setState({
          isHtmlFetched: true,
          htmlData: text.replace(/(\r\n\t|\n|\r\t)/gm, ''),
        });
      })
      .catch((() => {}));
  }

  handleModalClose = () => {
    if (this.modalRef.current) this.modalRef.current.close();
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
    const { theme } = this.props;
    const {
      htmlData,
      isHtmlFetched,
      scrollOffset,
      contentContainerHeight,
      containerHeight,
    } = this.state;

    const animationInTiming = 400;
    const animationOutTiming = 400;

    const colors = getThemeColors(theme);

    const commonTextStyle = {
      color: colors.text,
      fontFamily: appFont.regular,
    };

    const scrollOffsetMax = contentContainerHeight > 0 &&
      containerHeight ? contentContainerHeight - containerHeight : undefined;

    return (
      <Modal
        ref={this.modalRef}
        animationInTiming={animationInTiming}
        animationOutTiming={animationOutTiming}
        scrollOffset={scrollOffset}
        scrollOffsetMax={scrollOffsetMax}
        scrollTo={this.handleModalScrollTo}
        style={{ margin: 0, justifyContent: 'flex-start' }}
      >
        <ContainerWithHeader
          headerProps={{
            rightItems: [{ close: true }],
            noBack: true,
            noPaddingTop: true,
            noBottomBorder: true,
            floating: true,
            onClose: this.handleModalClose,
          }}
        >
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
                stylesheet={baseStyles(colors)}
                renderNode={this.renderNode}
                style={{ marginBottom: 10 }}
                paragraphBreak={null}
              />
            </ScrollView>
          }
        </ContainerWithHeader>
      </Modal>
    );
  }
}

export default (withTheme(HTMLContentModal): React.AbstractComponent<OwnProps>);
