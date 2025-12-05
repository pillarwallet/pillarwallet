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
import { View, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import styled from 'styled-components/native';
import { useTranslationWithPrefix } from 'translations/translate';

// Components
import { Container, Content, Spacing } from 'components/layout/Layout';
import HeaderBlock from 'components/HeaderBlock';
import Text from 'components/core/Text';
import TextInput from 'components/inputs/TextInput';
import Button from 'components/core/Button';

// Utils
import { appFont, fontStyles, spacing } from 'utils/variables';
import { getHomeScreenUrlOverride, setHomeScreenUrlOverride, PRESET_URLS } from 'utils/homeScreenUrl';

// Assets
const pillarXLogo = require('assets/images/pillarx-logo.png');

function HomeScreenUrlSettings() {
  const { t } = useTranslationWithPrefix('menu.settings');
  const navigation = useNavigation();
  const [url, setUrl] = React.useState('');
  const [selectedPreset, setSelectedPreset] = React.useState<?string>(null);
  const inputRef = React.useRef(null);

  React.useEffect(() => {
    const loadSavedUrl = async () => {
      const savedUrl = await getHomeScreenUrlOverride();
      if (savedUrl) {
        setUrl(savedUrl);
        // Check if it matches a preset
        if (savedUrl === PRESET_URLS.PRODUCTION) {
          setSelectedPreset('production');
        } else if (savedUrl === PRESET_URLS.STAGING) {
          setSelectedPreset('staging');
        } else {
          setSelectedPreset('custom');
        }
      } else {
        setSelectedPreset('default');
        setUrl('');
      }
    };
    loadSavedUrl();
  }, []);

  const handlePresetSelect = (preset: string) => {
    setSelectedPreset(preset);
    if (preset === 'production') {
      setUrl(PRESET_URLS.PRODUCTION);
    } else if (preset === 'staging') {
      setUrl(PRESET_URLS.STAGING);
    } else if (preset === 'default') {
      setUrl('');
    } else if (preset === 'custom') {
      // Keep current URL if it exists, otherwise clear
      if (!url || url === PRESET_URLS.PRODUCTION || url === PRESET_URLS.STAGING) {
        setUrl('');
      }
    }
  };

  const handleSave = async () => {
    if (selectedPreset === 'default') {
      await setHomeScreenUrlOverride(null);
    } else if (selectedPreset === 'production') {
      await setHomeScreenUrlOverride(PRESET_URLS.PRODUCTION);
    } else if (selectedPreset === 'staging') {
      await setHomeScreenUrlOverride(PRESET_URLS.STAGING);
    } else if (selectedPreset === 'custom' && url && url.trim()) {
      // Ensure URL has protocol
      let finalUrl = url.trim();
      if (!/^https?:\/\//i.test(finalUrl)) {
        finalUrl = `https://${finalUrl}`;
      }
      await setHomeScreenUrlOverride(finalUrl);
    } else if (selectedPreset === 'custom') {
      // Custom selected but no URL - clear the override
      await setHomeScreenUrlOverride(null);
    }
    navigation.goBack();
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  return (
    <Container>
      <HeaderBlock
        centerItems={[
          {
            custom: <Logo source={pillarXLogo} resizeMode="contain" />,
          },
        ]}
        navigation={navigation}
        noPaddingTop
      />

      <Content paddingHorizontal={spacing.large}>
        <Title>{t('homeScreenUrl.title')}</Title>
        <Description>{t('homeScreenUrl.description')}</Description>

        <Spacing h={spacing.large} />

        <PresetContainer>
          <PresetButton
            $selected={selectedPreset === 'production'}
            onPress={() => handlePresetSelect('production')}
          >
            <PresetText $selected={selectedPreset === 'production'}>
              {t('homeScreenUrl.presets.production')}
            </PresetText>
          </PresetButton>

          <PresetButton
            $selected={selectedPreset === 'staging'}
            onPress={() => handlePresetSelect('staging')}
          >
            <PresetText $selected={selectedPreset === 'staging'}>
              {t('homeScreenUrl.presets.staging')}
            </PresetText>
          </PresetButton>

          <PresetButton
            $selected={selectedPreset === 'default'}
            onPress={() => handlePresetSelect('default')}
          >
            <PresetText $selected={selectedPreset === 'default'}>
              {t('homeScreenUrl.presets.default')}
            </PresetText>
          </PresetButton>

          <PresetButton
            $selected={selectedPreset === 'custom'}
            onPress={() => handlePresetSelect('custom')}
          >
            <PresetText $selected={selectedPreset === 'custom'}>
              {t('homeScreenUrl.presets.custom')}
            </PresetText>
          </PresetButton>
        </PresetContainer>

        <Spacing h={spacing.large} />

        <InputLabel>{t('homeScreenUrl.urlInput')}</InputLabel>
        <InputContainer>
          <TextInput
            ref={inputRef}
            value={url}
            onChangeText={setUrl}
            placeholder={t('homeScreenUrl.urlPlaceholder')}
            editable={selectedPreset === 'custom' || selectedPreset === 'production' || selectedPreset === 'staging'}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
          />
        </InputContainer>

        <Spacing h={spacing.large} />

        <ButtonContainer>
          <Button
            title={t('homeScreenUrl.cancel')}
            variant="secondary"
            onPress={handleCancel}
            style={{ flex: 1, marginRight: spacing.small }}
          />
          <Button
            title={t('homeScreenUrl.save')}
            variant="primary"
            onPress={handleSave}
            style={{ flex: 1, marginLeft: spacing.small }}
          />
        </ButtonContainer>
      </Content>
    </Container>
  );
}

export default HomeScreenUrlSettings;

const Title = styled(Text)`
  margin-top: ${spacing.medium}px;
  margin-bottom: ${spacing.small}px;
  font-family: ${appFont.medium};
  ${fontStyles.big};
`;

const Description = styled(Text)`
  margin-bottom: ${spacing.medium}px;
  ${fontStyles.regular};
  color: ${({ theme }) => theme.colors.secondaryText};
`;

const PresetContainer = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
  margin-bottom: ${spacing.medium}px;
`;

const PresetButton = styled.TouchableOpacity`
  padding: ${spacing.small}px ${spacing.medium}px;
  margin: ${spacing.small / 2}px;
  border-radius: 8px;
  background-color: ${({ theme, $selected }) =>
    $selected ? theme.colors.buttonPrimaryBackground : theme.colors.basic090};
  border-width: 1px;
  border-color: ${({ theme, $selected }) =>
    $selected ? theme.colors.buttonPrimaryBackground : theme.colors.basic080};
`;

const PresetText = styled(Text)`
  ${fontStyles.medium};
  color: ${({ theme, $selected }) =>
    $selected ? theme.colors.buttonPrimaryText : theme.colors.text};
`;

const InputLabel = styled(Text)`
  margin-bottom: ${spacing.small}px;
  ${fontStyles.medium};
`;

const InputContainer = styled.View`
  border-width: 1px;
  border-color: ${({ theme }) => theme.colors.basic080};
  border-radius: 8px;
  padding: ${spacing.medium}px;
  background-color: ${({ theme }) => theme.colors.basic100};
`;

const ButtonContainer = styled.View`
  flex-direction: row;
  margin-top: ${spacing.large}px;
`;

const Logo = styled(Image)`
  height: 24px;
  width: 120px;
`;

