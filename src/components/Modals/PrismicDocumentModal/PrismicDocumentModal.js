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
import styled from 'styled-components/native';
import { ScrollView } from 'react-native';
import HTML from 'react-native-render-html';
import get from 'lodash.get';

// Components
import Spinner from 'components/Spinner';
import Modal from 'components/Modal';
import HeaderBlock from 'components/HeaderBlock';
import { Container } from 'components/modern/Layout';

// Types
import type { ScrollToProps } from 'components/Modals/SlideModal';

// Utils
import { spacing } from 'utils/variables';

// Services
import { fetchPrivacyDocument } from 'services/cms/FetchPrivacyTermsDocument';

import {
  renderHTMLfromPrimisic,
} from './RenderHTMLfromPrimisic';


type Props = {|
  primisicDocumentId: string,
|};


const PrismicDocumentModal = ({ primisicDocumentId }: Props) => {
  const scrollViewRef = React.useRef(null);
  const modalRef = React.useRef();
  const [isPrimisicDocumentFetched, setIsPrimisicDocumentFetched] = React.useState(false);
  const [documentHTMLData, setDocumentHTMLData] = React.useState('');
  const [scrollOffset, setScrollOffset] = React.useState(0);
  const [containerHeight, setContainerHeight] = React.useState(0);
  const [contentContainerHeight, setContentContainerHeight] = React.useState(0);

  React.useEffect(() => {
    async function fetchPrimisicData() {
      const fetchPrimisicDocumentResponse = await fetchPrivacyDocument(primisicDocumentId);
      const document = fetchPrimisicDocumentResponse.data;
      const prismicHTMLContent = [];
      document?.title?.map((documentData) => {
        if (!documentData.text) return null;
        return prismicHTMLContent.push(renderHTMLfromPrimisic(documentData.type, documentData.text));
      });
      document?.subtitle?.map((documentData) => {
        if (!documentData.text) return null;
        return prismicHTMLContent.push(renderHTMLfromPrimisic(documentData.type, documentData.text));
      });
      document?.content?.map((documentData) => {
        if (!documentData.text) return null;
        return prismicHTMLContent.push(renderHTMLfromPrimisic(documentData.type, documentData.text));
      });
      const prismicConvertedHTMLData = prismicHTMLContent.join('');
      setDocumentHTMLData(prismicConvertedHTMLData);
      setIsPrimisicDocumentFetched(true);
    }
    fetchPrimisicData();
  }, [primisicDocumentId]);

  const handleModalClose = () => {
    if (modalRef.current) modalRef.current.close();
  };

  const handleModalScrollTo = (p: ScrollToProps) => scrollViewRef?.current?.scrollTo(p);

  const handleContentOnScroll = (event: Object) => {
    const contentOffsetY = get(event, 'nativeEvent.contentOffset.y');
    setScrollOffset(contentOffsetY);
  };

  const handleContentOnLayout = (event: Object) => {
    const { height } = event.nativeEvent.layout;
    if (!containerHeight || containerHeight !== height) {
      setContainerHeight(height);
    }
  };

  const handleOnContentSizeChange = (width: number, height: number) => {
    setContentContainerHeight(height);
  };
  const animationInTiming = 400;
  const animationOutTiming = 400;

  const scrollOffsetMax = contentContainerHeight > 0 && containerHeight
    ? contentContainerHeight - containerHeight
    : undefined;

  return (
    <Modal
      ref={modalRef}
      animationInTiming={animationInTiming}
      animationOutTiming={animationOutTiming}
      scrollOffset={scrollOffset}
      scrollOffsetMax={scrollOffsetMax}
      scrollTo={handleModalScrollTo}
      style={{ margin: 0, justifyContent: 'flex-start' }}
    >
      <Container>
        <HeaderBlock noBack rightItems={[{ close: true }]} onClose={handleModalClose} noPaddingTop />
        {!isPrimisicDocumentFetched && (
          <ActivityIndicatorWrapper>
            <Spinner />
          </ActivityIndicatorWrapper>
        )}
        {!!isPrimisicDocumentFetched && (
          // $FlowFixMe: react-native types
          <ScrollView
            paddingHorizontal={spacing.rhythm}
            ref={scrollViewRef}
            onScroll={handleContentOnScroll}
            scrollEventThrottle={16} // inherited from ScrollWrapper component
            onLayout={handleContentOnLayout}
            onContentSizeChange={handleOnContentSizeChange}
          >
            <HTML source={{ html: documentHTMLData }} />
          </ScrollView>
        )}
      </Container>
    </Modal>
  );
};

export default PrismicDocumentModal;

const ActivityIndicatorWrapper = styled.View`
  flex: 1;
  align-items: center;
  justify-content: center;
`;
