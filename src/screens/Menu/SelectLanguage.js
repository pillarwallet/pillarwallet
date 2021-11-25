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

import * as React from 'react';
import { FlatList } from 'react-native';
import { useNavigation } from 'react-navigation-hooks';
import { useDispatch } from 'react-redux';
import styled from 'styled-components/native';
import { useTranslationWithPrefix } from 'translations/translate';

// Configs
import localeConfig from 'configs/localeConfig';

// Components
import { Container } from 'components/layout/Layout';
import HeaderBlock from 'components/HeaderBlock';
import Icon from 'components/core/Icon';
import Text from 'components/core/Text';

// Selectors
import { useLanguageCode } from 'selectors/appSettings';

// Actions
import { changeLanguageAction } from 'actions/localisationActions';

// Utils
import type { SvgImage } from 'utils/types/svg-stub';
import { fontStyles, spacing } from 'utils/variables';

// Assets
import IconEn from 'assets/icons/svg/icon-48-lang-en.svg';
import IconAm from 'assets/icons/svg/icon-48-lang-am.svg';
import IconBs from 'assets/icons/svg/icon-48-lang-bs.svg';
import IconCn from 'assets/icons/svg/icon-48-lang-cn.svg';


const SelectLanguage = () => {
  const { t } = useTranslationWithPrefix('menu.selectLanguage');
  const navigation = useNavigation();
  const dispatch = useDispatch();

  const selectedValue = useLanguageCode();
  const items = useLanguageItems();

  const renderItem = (item: Item) => {
    const handePress = () => {
      navigation.goBack(null);
      dispatch(changeLanguageAction(item.value));
    };

    return (
      <ItemContainer onPress={handePress}>
        <ItemIconWrapper>{item.Icon && <item.Icon />}</ItemIconWrapper>
        <ItemTitle>{item.title}</ItemTitle>

        {item.value === selectedValue && <Icon name="checkmark" />}
      </ItemContainer>
    );
  };

  return (
    <Container>
      <HeaderBlock centerItems={[{ title: t('title') }]} navigation={navigation} />

      <FlatList
        data={items}
        renderItem={({ item }) => renderItem(item)}
        keyExtractor={(item) => item.value}
        contentContainerStyle={styles.contentContainerStyle}
        contentInsetAdjustmentBehavior="scrollableAxes"
      />
    </Container>
  );
};

type Item = {
  title: string,
  value: string,
  Icon: ?SvgImage,
};

const iconComponentForLanguageCode = {
  en: IconEn,
  am: IconAm,
  bs: IconBs,
  cn: IconCn,
};

function useLanguageItems() {
  return Object.keys(localeConfig.supportedLanguages).map((code) => ({
    title: localeConfig.supportedLanguages[code],
    value: code,
    Icon: iconComponentForLanguageCode[code],
  }));
}

export default SelectLanguage;

const styles = {
  contentContainerStyle: {
    paddingTop: spacing.large,
  },
};

const ItemContainer = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
  padding: ${spacing.large}px;
`;

const ItemIconWrapper = styled.View`
  width: 48px;
  height: 37px;
  margin-right: ${spacing.medium}px;
`;

const ItemTitle = styled(Text)`
  flex: 1;
  ${fontStyles.medium};
`;
