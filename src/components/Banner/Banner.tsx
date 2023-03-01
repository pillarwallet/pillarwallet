/* eslint-disable camelcase */
/* eslint-disable i18next/no-literal-string */
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
import React, { FC } from 'react';
import styled, { withTheme } from 'styled-components/native';
import { useNavigation } from 'react-navigation-hooks';

// Components
import Icon from 'components/core/Icon';
import Image from 'components/Image';
import Text from 'components/core/Text';

// Types
import type { Theme } from 'models/Theme';

// Utils
import { appFont, fontStyles, spacing } from 'utils/variables';
import { getThemeColors } from 'utils/themes';
import { openUrl } from 'utils/inAppBrowser';
import { isValidURL } from 'utils/validators';
import { reportOrWarn } from 'utils/common';

// Constants
import * as RoutePath from 'constants/navigationConstants';

// Selectors
import { useRootSelector, bannerDataSelector } from 'selectors';

interface IBanner {
  screenName: string;
  theme: Theme;
  bottomPosition?: boolean;
}

const Banner: FC<IBanner> = (props) => {
  const { screenName, theme, bottomPosition = true } = props;
  const bannerDataResponse = useRootSelector(bannerDataSelector);

  if (!bannerDataResponse && !Array.isArray(bannerDataResponse?.results)) return null;

  const response = bannerDataResponse?.results.filter((result) => {
    const bannerPosition = result?.data?.position || 'Bottom';
    const position = bottomPosition ? 'Bottom' : 'Top';
    return result?.data?.screen === screenName && bannerPosition === position;
  });

  if (!response) return null;

  return response
    .slice(0, 3)
    .map((bannerData, index) => <MultiBannerContainer bannerData={bannerData} index={index} theme={theme} />);
};

export default withTheme(Banner);

const MultiBannerContainer = ({ bannerData, index, theme }) => {
  const colors = getThemeColors(theme);
  const navigation = useNavigation();
  const [isVisible, setIsVisible] = React.useState(true);
  const bannerDataResponse = bannerData?.data;
  const bannerTitle = bannerDataResponse?.title[0]?.text || '';
  const bannerSubtitle = bannerDataResponse?.subtitle[0]?.text || '';
  const bannerIcon = bannerDataResponse?.icon?.url || '';
  const bannerBackgroundColor = bannerDataResponse?.background_color;
  const bannerForgroundColor = bannerDataResponse?.foreground_color;
  const bannerLinkUrl = bannerDataResponse?.link?.url;
  const background_image = bannerDataResponse?.background_image?.url;

  const onClose = () => setIsVisible(false);

  const openLink = (url: string) => {
    const pathName = url ? url.split('://').pop() : '';
    if (Object.keys(RoutePath).includes(pathName)) {
      navigation.navigate(pathName);
    } else if (isValidURL(url)) {
      openUrl(url);
    } else {
      reportOrWarn(`Banner: navigation failed to open: ${url}`);
    }
  };

  if (!isVisible) return null;
  return (
    <TouchableContainer key={index} onPress={() => openLink(bannerLinkUrl)}>
      <ImageContainer
        source={{ uri: background_image }}
        resizeMode="stretch"
        style={{ backgroundColor: bannerBackgroundColor }}
        imageStyle={{ borderRadius: 20 }}
      >
        <Summary>
          <Title color={bannerForgroundColor || colors.bannerTextColor}>{bannerTitle}</Title>
          <SubTitle color={bannerForgroundColor || colors.bannerTextColor}>{bannerSubtitle}</SubTitle>
        </Summary>
        <BannerImage source={{ uri: bannerIcon }} />
        <CloseContainer onPress={onClose}>
          <Icon name={'close'} width={24} height={24} color={bannerForgroundColor} />
        </CloseContainer>
      </ImageContainer>
    </TouchableContainer>
  );
};

const TouchableContainer = styled.TouchableOpacity`
  margin-horizontal: ${spacing.mediumLarge}px;
  margin-top: ${spacing.mediumLarge}px;
`;

const ImageContainer = styled.ImageBackground`
  flex-direction: row;
  padding-top: ${spacing.medium}px;
  padding-bottom: ${spacing.mediumLarge}px;
  padding-horizontal: ${spacing.largePlus}px;
  border-radius: 20px;
  align-items: center;
`;

const Summary = styled.View`
  flex: 1;
`;

const BannerImage = styled(Image)`
  width: 36px;
  height: 36px;
  margin-right: ${spacing.medium}px;
`;

const Title = styled(Text)`
  font-family: '${appFont.medium}';
  ${fontStyles.medium};
`;

const SubTitle = styled(Text)`
  ${fontStyles.small};
`;

const CloseContainer = styled.TouchableOpacity`
  padding: 8px 8px 10px 10px;
  position: absolute;
  top: 0px;
  right: 0px;
`;
