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
import t from 'translations/translate';

// Components
import Modal from 'components/Modal';
import HeaderBlock from 'components/HeaderBlock';
import { Container } from 'components/layout/Layout';
import Text from 'components/core/Text';

// Types
import type { ScrollToProps } from 'components/Modals/SlideModal';
import type { ScrollEvent, LayoutEvent } from 'utils/types/react-native';

// Utils
import { spacing } from 'utils/variables';
import { mapFromDocumentDataToString } from 'utils/prismic';
import { reportErrorLog } from 'utils/common';
import { useThemeColors } from 'utils/themes';

// Services
import * as Prismic from 'services/prismic';

type Props = {|
  prismicDocumentId: string,
  prismicDocumentName: string
|};


const PrismicDocumentModal = ({ prismicDocumentId, prismicDocumentName }: Props) => {
  const scrollViewRef = React.useRef(null);
  const modalRef = React.useRef();
  const colors = useThemeColors();
  const [isPrismicHTMLFetched, setIsPrismicHTMLFetched] = React.useState(false);
  const [documentHTMLData, setDocumentHTMLData] = React.useState('');
  const [errorMessage, setErrorMessage] = React.useState('');
  const [scrollOffset, setScrollOffset] = React.useState(0);
  const [containerHeight, setContainerHeight] = React.useState(0);
  const [contentContainerHeight, setContentContainerHeight] = React.useState(0);

  React.useEffect(() => {
    async function fetchPrismicData() {
      try {
        const prismicDocument = await Prismic.queryDocumentsByID(prismicDocumentId);
        const prismicContent = [];
        mapFromDocumentDataToString(prismicDocument?.title, prismicContent, true);
        mapFromDocumentDataToString(prismicDocument?.subtitle, prismicContent, true);
        mapFromDocumentDataToString(prismicDocument?.content, prismicContent, true);
        const prismicHTMLResponse = prismicContent.join('');
        setDocumentHTMLData(prismicHTMLResponse);
        setIsPrismicHTMLFetched(true);
      } catch (error) {
        reportErrorLog('Prismic content fetch failed', { error, documentId: prismicDocumentId });
        setErrorMessage(t('error.prismicDataFetchFailed', { prismicDocument: prismicDocumentName }));
      }
    }
    fetchPrismicData();
  }, [prismicDocumentId, prismicDocumentName]);

  const handleModalClose = () => {
    if (modalRef.current) modalRef.current.close();
  };

  const handleModalScrollTo = (p: ScrollToProps) => scrollViewRef?.current?.scrollTo(p);

  const handleContentOnScroll = (event: ScrollEvent) => {
    const contentOffsetY = event.nativeEvent?.contentOffset?.y;
    setScrollOffset(contentOffsetY);
  };

  const handleContentOnLayout = (event: LayoutEvent) => {
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
        {!isPrismicHTMLFetched && <ErrorMessage>{errorMessage}</ErrorMessage>}
        {!!isPrismicHTMLFetched && (
          <ScrollView
            style={styles.scrollView}
            ref={scrollViewRef}
            onScroll={handleContentOnScroll}
            scrollEventThrottle={16} // inherited from ScrollWrapper component
            onLayout={handleContentOnLayout}
            onContentSizeChange={handleOnContentSizeChange}
          >
            <HTML source={{ html: documentHTMLData }} baseFontStyle={{ color: colors.text }} />
          </ScrollView>
        )}
      </Container>
    </Modal>
  );
};

export default PrismicDocumentModal;

const styles = {
  scrollView: {
    paddingHorizontal: spacing.rhythm,
  },
};

const ErrorMessage = styled(Text)`
  margin: ${spacing.large}px;
  text-align: center;
  color: ${({ theme }) => theme.colors.negative};
`;
