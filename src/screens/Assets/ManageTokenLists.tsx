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
import { Keyboard } from 'react-native';
import { useNavigation } from 'react-navigation-hooks';
import { useTranslation } from 'translations/translate';
import styled from 'styled-components/native';
import Clipboard from '@react-native-community/clipboard';
import { useDispatch } from 'react-redux';
import { isEmpty } from 'lodash';
import { useDebounce } from 'use-debounce';

// Components
import { Container } from 'components/layout/Layout';
import HeaderBlock from 'components/HeaderBlock';
import ChainSelectorContent from 'components/ChainSelector/ChainSelectorContent';
import SearchBar from 'components/SearchBar';
import Icon from 'components/core/Icon';
import Checkbox from 'components/legacy/Checkbox';
import Button from 'components/core/Button';
import { Spacing } from 'components/legacy/Layout';
import AddTokenListItem from 'components/lists/AddTokenListItem';
import Spinner from 'components/Spinner';
import EmptyStateParagraph from 'components/EmptyState/EmptyStateParagraph';

// Hooks
import { useAssetsToAddress } from 'hooks/assets';

// Utils
import { fontStyles } from 'utils/variables';
import { useThemeColors } from 'utils/themes';
import { addressesEqual } from 'utils/assets';
import { isValidAddress } from 'utils/validators';

// Selector
import { useSupportedChains } from 'selectors/chains';
import { useRootSelector, activeAccountAddressSelector } from 'selectors';

// Actions
import { manageCustomTokens } from 'actions/assetsActions';
import { fetchAssetsBalancesAction } from 'actions/assetsActions';

export default function () {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const colors = useThemeColors();
  const dispatch = useDispatch();

  const chains = useSupportedChains();
  const activeAccountAddress = useRootSelector(activeAccountAddressSelector);

  const [selectedChain, setSelectedChain] = React.useState(null);
  const [query, setQuery] = React.useState('');
  const [hasAgreedToTerms, setHasAgreedToTerms] = React.useState(false);
  const [debouncedSearchAddress] = useDebounce(query, 500);

  const {
    data: tokensList,
    isLoading,
    isSuccess,
  } = useAssetsToAddress(selectedChain ? [selectedChain] : chains, debouncedSearchAddress);

  const getValidationError = () => {
    if ((query && !isValidAddress(query)) || addressesEqual(query, activeAccountAddress)) {
      return t('contactSelector.error.incorrectAddress');
    }

    return null;
  };
  const errorMessage = getValidationError();

  React.useEffect(() => {
    setHasAgreedToTerms(false);
  }, [query]);

  const renderItem = (token: any) => {
    if (!token) return;
    return <AddTokenListItem listType="searchList" {...token} />;
  };

  const handlePaste = async () => {
    Keyboard.dismiss();
    const value = await Clipboard.getString();
    setQuery(value);
  };

  const isDisabled =
    (isEmpty(tokensList) && query) || (!hasAgreedToTerms && !isEmpty(tokensList)) || isLoading || errorMessage;

  const buttonTitle = isEmpty(query)
    ? t('button.paste')
    : tokensList?.length > 1
    ? t('label.importNumberOfCustomToken', { tokens: tokensList?.length })
    : t('label.importCustomToken');

  const importToken = () => {
    tokensList?.forEach((token) => {
      dispatch(manageCustomTokens(token, true));
    });
    dispatch(fetchAssetsBalancesAction());
    navigation.goBack();
  };

  return (
    <Container>
      <HeaderBlock navigation={navigation} centerItems={[{ title: t('label.manageTokenLists') }]} noPaddingTop />
      <ChainSelectorContent selectedAssetChain={selectedChain} onSelectChain={setSelectedChain} />
      <SearchBar
        style={{ width: '90%', alignSelf: 'center' }}
        query={query}
        onQueryChange={setQuery}
        error={!!errorMessage}
        placeholder={t('label.contractAddress')}
      />
      {isLoading && <Spinner size={30} />}
      {!isLoading && tokensList?.map(renderItem)}

      {isSuccess && isEmpty(tokensList) && !errorMessage && (
        <EmptyStateParagraph wide title={t('label.nothingFound')} />
      )}

      {isEmpty(tokensList) && <Spacing h={46} />}
      <FooterContainer>
        {!isEmpty(tokensList) && !isLoading && (
          <>
            <WarningContainer>
              <Icon name="small-warning" color={colors.helpIcon} />
              <WarningText>{t('paragraph.tokenNotListedWarning')}</WarningText>
            </WarningContainer>

            <Checkbox
              onPress={() => {
                setHasAgreedToTerms(!hasAgreedToTerms);
              }}
              small
              lightText
              checked={hasAgreedToTerms}
              wrapperStyle={{ marginVertical: 16 }}
            >
              {t('paragraph.importTokenPermission')}
            </Checkbox>
          </>
        )}

        <Button
          title={errorMessage ? errorMessage : buttonTitle}
          onPress={() => {
            isEmpty(query) ? handlePaste() : importToken();
          }}
          disabled={isDisabled}
        />
      </FooterContainer>
    </Container>
  );
}

const WarningContainer = styled.View`
  margin: 24px 0px 18px;
  padding: 12px 62px 12px 16px;
  border-radius: 16px;
  flex-direction: row;
  align-items: center;
  border: ${({ theme }) => theme.colors.helpIcon};
`;

const WarningText = styled.Text`
  ${fontStyles.small}
  margin: 0 0 0 20px;
  color: ${({ theme }) => theme.colors.helpIcon};
`;

const FooterContainer = styled.View`
  margin-horizontal: 20px;
`;
