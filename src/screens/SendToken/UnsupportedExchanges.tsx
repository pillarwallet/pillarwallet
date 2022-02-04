import React, { FC, useState, useEffect } from 'react';
import HTML from 'react-native-render-html';
import { useTranslationWithPrefix } from 'translations/translate';
import styled from 'styled-components/native';
import { useNavigation } from 'react-navigation-hooks';
import { orderBy } from 'lodash';

// Components
import { Container, Content, Footer } from 'components/layout/Layout';
import HeaderBlock from 'components/HeaderBlock';
import Text from 'components/core/Text';
import Spinner from 'components/Spinner';

// Services
import * as Prismic from 'services/prismic';

// Utils
import { useThemeColors } from 'utils/themes';
import { mapFromDocumentDataToString } from 'utils/prismic';
import { reportErrorLog } from 'utils/common';
import { spacing } from 'utils/variables';
import { firebaseRemoteConfig } from 'services/firebase';
import { REMOTE_CONFIG } from 'constants/remoteConfigConstants';
import * as parse from 'utils/parse';

const TYPE = 'unsupported_exchanges';

type CategoryDto = {
  name?: [{ text: string | null } | null];
  order?: number;
};

function parseCategory(item: Prismic.Document<CategoryDto>) {
  if (!item) return null;

  const id = parse.stringOrNull(item.id);
  const title = parse.stringOrNull(item.data?.name?.[0]?.text);
  const order = parse.numberOrNull(item.data?.order) ?? Infinity;
  if (!id || !title) return null;

  return { id, title, order };
}

async function fetchWalletConnectCategoriesApiCall() {
  const data = await Prismic.queryDocumentsByType<CategoryDto>(TYPE, { pageSize: 100 });
  const parseData = parse.mapArrayOrEmpty(data.results, parseCategory);
  return orderBy(parseData, ['order']);
}

const UnsupportedExchanges: FC = () => {
  const navigation = useNavigation();
  const colors = useThemeColors();
  const { t } = useTranslationWithPrefix('unsupportedExchanges');

  const [documentHTMLData, setDocumentHTMLData] = useState('');
  const [isPrismicHTMLFetched, setIsPrismicHTMLFetched] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const fetchPrismicData = async () => {
      try {
        const prismicDocuments = await fetchWalletConnectCategoriesApiCall();
        const prismicContent = [];
        prismicDocuments.forEach((prismicDocument, i) => {
          mapFromDocumentDataToString(prismicDocument?.subtitle, prismicContent, true);
          mapFromDocumentDataToString(prismicDocument?.content, prismicContent, true);
        });
        const prismicHTMLResponse = prismicContent.join('');
        setDocumentHTMLData(prismicHTMLResponse);
        setIsPrismicHTMLFetched(true);
        setIsLoading(false);
      } catch (error) {
        reportErrorLog('Prismic content fetch failed', { error, documentId: TYPE });
        setErrorMessage(t('error.prismicDataFetchFailed', { prismicDocument: t('title') }));
      }
    };

    fetchPrismicData();
  }, []);

  return (
    <Container>
      <HeaderBlock
        centerItems={[{ title: t('title') }]}
        leftItems={[{ close: true }]}
        navigation={navigation}
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
  );
};

export default UnsupportedExchanges;

const ErrorMessage = styled(Text)`
  margin: ${spacing.large}px;
  text-align: center;
  color: ${({ theme }) => theme.colors.negative};
`;
