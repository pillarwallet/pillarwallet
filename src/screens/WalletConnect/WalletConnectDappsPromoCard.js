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
import { useNavigation } from 'react-navigation-hooks';
import styled from 'styled-components/native';
import { connect } from 'react-redux';
import t from 'translations/translate';

// components
import ShadowedCard from 'components/ShadowedCard';
import { BaseText } from 'components/Typography';
import Button from 'components/Button';
import { Spacing } from 'components/Layout';
import Icon from 'components/Icon';
import Image from 'components/Image';

// utils
import { spacing, fontSizes } from 'utils/variables';
import { themedColors } from 'utils/themes';

// constants
import { DARK_THEME } from 'constants/appSettingsConstants';
import { EXPLORE_APPS } from 'constants/navigationConstants';

// types
import type { RootReducerState, Dispatch } from 'reducers/rootReducer';
import { hideWalletConnectPromoCardAction } from 'actions/appSettingsActions';


type Props = {
  isPromoCardHidden?: boolean,
  hidePromoCard: () => void,
};

const promoImage = require('assets/images/logo_pattern.png');

const promoImageAspectRatio = 335 / 195;

const ButtonsContainer = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: center;
  margin-top: 30px;
`;

const ContentContainer = styled.View`
  padding: 25px 60px 30px;
`;

const CardWrapper = styled.View`
  margin: 0 ${spacing.layoutSides}px;
`;

const CollapsedWrapper = styled.TouchableOpacity`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 24px 20px;
  border-bottom-width: 1px;
  border-bottom-color: ${themedColors.tertiary};
`;

const CollapsedPromoText = styled(BaseText)`
  flex: 1;
`;

const CloseIconContainer = styled.TouchableOpacity`
  position: absolute;
  top: ${spacing.layoutSides}px;
  right: ${spacing.layoutSides}px;
`;

const CloseIcon = styled(Icon)`
  font-size: ${fontSizes.large}px;
  color: ${({ theme }) => theme.current === DARK_THEME ? theme.colors.tertiary : theme.colors.text};
`;

const WalletConnectDappsPromoCard = ({ isPromoCardHidden, hidePromoCard }: Props) => {
  const navigation = useNavigation();

  const handleExplorePress = () => {
    navigation.navigate(EXPLORE_APPS);
  };

  const renderExploreButton = () => (
    <Button
      small
      primarySecond
      title={t('button.explore')}
      leftIconName="search"
      onPress={handleExplorePress}
      block={false}
    />
  );

  if (isPromoCardHidden) {
    return (
      <CollapsedWrapper>
        <CollapsedPromoText small secondary>{t('walletConnectContent.banner.promo.paragraph')}</CollapsedPromoText>
        <Spacing w={70} />
        {renderExploreButton()}
      </CollapsedWrapper>
    );
  }
  return (
    <CardWrapper>
      <ShadowedCard borderRadius={30}>
        <Image
          source={promoImage}
          resizeMode="cover"
          style={{ width: '100%', aspectRatio: promoImageAspectRatio }}
        />
        <ContentContainer>
          <BaseText center regular secondary>
            {t('walletConnectContent.banner.promoExtended.paragraph')}
          </BaseText>
          <ButtonsContainer>
            {/* <Button small secondary title="Learn more" />
            <Spacing w={15} /> */}
            {renderExploreButton()}
          </ButtonsContainer>
        </ContentContainer>
        <CloseIconContainer onPress={hidePromoCard}>
          <CloseIcon name="rounded-close" />
        </CloseIconContainer>
      </ShadowedCard>
    </CardWrapper>
  );
};

const mapStateToProps = ({
  appSettings: { data: { hideWalletConnectPromoCard: isPromoCardHidden } },
}: RootReducerState): $Shape<Props> => ({
  isPromoCardHidden,
});

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  hidePromoCard: () => dispatch(hideWalletConnectPromoCardAction()),
});

export default connect(mapStateToProps, mapDispatchToProps)(WalletConnectDappsPromoCard);
