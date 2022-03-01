import React, { FC, useState, useEffect, useRef } from 'react';
import HTML from 'react-native-render-html';
import { useTranslationWithPrefix } from 'translations/translate';
import styled from 'styled-components/native';
import { useNavigation } from 'react-navigation-hooks';

// Components
import { Container, Content } from 'components/layout/Layout';
import HeaderBlock from 'components/HeaderBlock';
import Text from 'components/core/Text';
import Spinner from 'components/Spinner';
import SlideModal from 'components/Modals/SlideModal';

// Services
import * as Prismic from 'services/prismic';

// Utils
import { useThemeColors } from 'utils/themes';
import { mapFromDocumentDataToString } from 'utils/prismic';
import { logBreadcrumb } from 'utils/common';
import { spacing } from 'utils/variables';

const TYPE_UNSUPPORTED_EXCHANGES = 'unsupported_exchanges';

const UnsupportedExchangesModal: FC = () => {
  const navigation = useNavigation();
  const colors = useThemeColors();
  const { t } = useTranslationWithPrefix('unsupportedExchanges');

  const [documentHTMLData, setDocumentHTMLData] = useState('');
  const [isPrismicHTMLFetched, setIsPrismicHTMLFetched] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const modalRef = useRef(null);

  const close = () => {
    modalRef.current?.close();
  };

  useEffect(() => {
    const fetchPrismicData = async () => {
      try {
        const prismicDocument = await Prismic.queryDocumentsByType(TYPE_UNSUPPORTED_EXCHANGES);
        const prismicContent = [];
        if (!prismicDocument.results) throw new Error('failed to load documents from prismic');

        prismicDocument.results.forEach((doc, i) => {
          if (!doc?.data?.unsupported_exchange_name) return;
          mapFromDocumentDataToString(doc.data.unsupported_exchange_name, prismicContent, true);
        });
        const prismicHTMLResponse = prismicContent.join('');
        setDocumentHTMLData(prismicHTMLResponse);
        setIsPrismicHTMLFetched(true);
        setIsLoading(false);
      } catch (error) {
        logBreadcrumb('Prismic content', 'fetch failed', { error, documentId: TYPE_UNSUPPORTED_EXCHANGES });
        setErrorMessage(t('error.prismicDataFetchFailed', { prismicDocument: t('title') }));
      }
    };

    fetchPrismicData();
  }, []);

  return (
    <SlideModal ref={modalRef} fullScreen noSwipeToDismiss noClose noTopPadding avoidKeyboard={false}>
      <Container>
        <HeaderBlock
          centerItems={[{ title: t('title') }]}
          leftItems={[{ close: true }]}
          navigation={navigation}
          onClose={close}
          noPaddingTop
        />
        {!isPrismicHTMLFetched && <ErrorMessage>{errorMessage}</ErrorMessage>}
        <Content>
          {isLoading && <Spinner size={30} />}
          {!!isPrismicHTMLFetched && !isLoading && (
            <HTML source={{ html: documentHTMLData }} baseFontStyle={{ color: colors.text }} />
          )}
        </Content>
      </Container>
    </SlideModal>
  );
};

export default UnsupportedExchangesModal;

const ErrorMessage = styled(Text)`
  margin: ${spacing.large}px;
  text-align: center;
  color: ${({ theme }) => theme.colors.negative};
`;
