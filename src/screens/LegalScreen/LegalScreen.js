// @flow
/*
    Pillar Wallet: the personal data locker
    Copyright (C) 2021 Stiftung Pillar Project

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

import React from 'react';
import HTML from 'react-native-render-html';
import t from 'translations/translate';
import styled from 'styled-components/native';
import { useNavigation } from 'react-navigation-hooks';

// Components
import { Container, Content, Footer } from 'components/layout/Layout';
import HeaderBlock from 'components/HeaderBlock';
import Text from 'components/core/Text';
import Button from 'components/core/Button';
import Spinner from 'components/Spinner';

// Services
import * as Prismic from 'services/prismic';

// Utils
import { useThemeColors } from 'utils/themes';
import { mapFromDocumentDataToString } from 'utils/prismic';
import { reportErrorLog } from 'utils/common';
import { spacing } from 'utils/variables';

const LegalScreen = () => {
  const navigation = useNavigation();
  const colors = useThemeColors();
  const prismicDocumentId = navigation.getParam('prismicDocumentId');
  const prismicDocumentName = navigation.getParam('prismicDocumentName');
  const onBoardingFlow = navigation.getParam('onBoardingFlow', false);
  const [documentHTMLData, setDocumentHTMLData] = React.useState('');
  const [isPrismicHTMLFetched, setIsPrismicHTMLFetched] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [errorMessage, setErrorMessage] = React.useState('');

  React.useEffect(() => {
    async function fetchPrismicData() {
      try {
        const prismicDocument = await Prismic.queryDocumentsByID(prismicDocumentId);
        const prismicContent = [];
        mapFromDocumentDataToString(prismicDocument?.subtitle, prismicContent, true);
        mapFromDocumentDataToString(prismicDocument?.content, prismicContent, true);
        const prismicHTMLResponse = prismicContent.join('');
        setDocumentHTMLData(prismicHTMLResponse);
        setIsPrismicHTMLFetched(true);
        setIsLoading(false);
      } catch (error) {
        reportErrorLog('Prismic content fetch failed', { error, documentId: prismicDocumentId });
        setErrorMessage(t('error.prismicDataFetchFailed', { prismicDocument: prismicDocumentName }));
      }
    }
    fetchPrismicData();
  }, [prismicDocumentId, prismicDocumentName]);

  return (
    <Container>
      <HeaderBlock
        centerItems={[{ title: prismicDocumentName }]}
        leftItems={[{ close: true }]}
        navigation={navigation}
        noPaddingTop
      />
      {!isPrismicHTMLFetched && (
        // eslint-disable-next-line i18next/no-literal-string
        <ErrorMessage testID={`${TAG}-error-no_prismic_html`} accessibilityLabel={`${TAG}-error-no_prismic_html`}>
          {errorMessage}
        </ErrorMessage>
      )}
      <Content>
        {isLoading && <Spinner size={30} />}
        {!!isPrismicHTMLFetched && !isLoading && (
          <HTML source={{ html: documentHTMLData }} baseFontStyle={{ color: colors.text }} />
        )}
      </Content>
      {!!onBoardingFlow && (
        <Footer>
          <Button
            title={t('auth:button.accept')}
            size="large"
            style={styles.buttonStyle}
            testID={`${TAG}-button-accept`}
            // eslint-disable-next-line i18next/no-literal-string
            accessibilityLabel={`${TAG}-button-accept`}
          />
          <Button
            title={t('auth:button.reject')}
            size="large"
            variant="text"
            testID={`${TAG}-button-reject`}
            // eslint-disable-next-line i18next/no-literal-string
            accessibilityLabel={`${TAG}-button-reject`}
          />
        </Footer>
      )}
    </Container>
  );
};

export default LegalScreen;

const styles = {
  buttonStyle: {
    marginBottom: spacing.small,
  },
};

const ErrorMessage = styled(Text)`
  margin: ${spacing.large}px;
  text-align: center;
  color: ${({ theme }) => theme.colors.negative};
`;

const TAG = 'LegalScreen';
