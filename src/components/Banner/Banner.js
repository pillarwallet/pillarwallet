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
import * as React from 'react';
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


type Props = {
  screenName: string,
  theme: Theme,
  bottomPosition?: boolean,
};

const Banner = (props: Props) => {
  const { screenName, theme, bottomPosition = true } = props;
  const bannerDataResponse = useRootSelector(bannerDataSelector);

  const response = bannerDataResponse?.results.filter((result) => {
    const bannerPosition = result?.data?.position || 'Bottom';
    const position = bottomPosition ? 'Bottom' : 'Top';
    return result?.data?.screen === screenName && bannerPosition === position;
  });

  if (!response) return null;

  return response.slice(0, 3).map((bannerData, index) =>
    <Content bannerData={bannerData} index={index} theme={theme} />);
};

export default withTheme(Banner);

const Content = ({ bannerData, index, theme }) => {
  const colors = getThemeColors(theme);
  const navigation = useNavigation();
  const [isVisible, setIsVisible] = React.useState(true);
  const bannerTitle = bannerData?.data?.title[0]?.text || '';
  const bannerSubtitle = bannerData?.data?.subtitle[0]?.text || '';
  const bannerIcon = bannerData?.data?.icon?.url || '';
  const bannerBackgroundColor = bannerData?.data?.background_color;
  const bannerLinkUrl = bannerData?.data?.link?.url;
  const bannerLinkType = bannerData?.data?.link?.link_type;

  const onClose = () => setIsVisible(false);

  const openLink = (url: string, urlType: string) => {
    if (urlType === 'Web' && isValidURL(url)) {
      openUrl(url);
    } else if (Object.keys(RoutePath).includes(url)) {
      navigation.navigate(url);
    } else {
      reportOrWarn(`Banner: navigation failed to open: ${url}`);
    }
  };

  if (!isVisible) return null;
  return (
    <TouchableContainer
      key={index}
      onPress={() => openLink(bannerLinkUrl, bannerLinkType)}
      style={{ backgroundColor: bannerBackgroundColor }}
    >
      <Summary>
        <Title color={colors.bannerTextColor}>{bannerTitle}</Title>
        <SubTitle color={colors.bannerTextColor}>{bannerSubtitle}</SubTitle>
      </Summary>
      <BannerImage source={{ uri: bannerIcon }} />
      <Close name="close" color={colors.white} onPress={onClose} horizontalAlign="flex-end" />
    </TouchableContainer>
  );
};

const TouchableContainer = styled.TouchableOpacity`
  flex-direction: row;
  margin-horizontal: ${spacing.mediumLarge}px;
  margin-top: ${spacing.mediumLarge}px;
  padding: ${spacing.medium}px ${spacing.largePlus}px;
  border-radius: 30px;
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
  margin-bottom: ${spacing.extraSmall}px;
`;

const SubTitle = styled(Text)`
`;

const Close = styled(Icon)`
  height: 16px;
  width: 16px;
  position: absolute;
  top: 8px;
  right: 14px;
`;

