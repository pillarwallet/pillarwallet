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
import { CachedImage } from 'react-native-cached-image';
import styled from 'styled-components/native';
import { connect } from 'react-redux';
import ShadowedCard from 'components/ShadowedCard';
import { BaseText } from 'components/Typography';
import Button from 'components/Button';
import { Spacing } from 'components/Layout';
import Icon from 'components/Icon';
import { spacing, fontSizes } from 'utils/variables';
import { themedColors } from 'utils/themes';
import { toggleWCPromoCardAction } from 'actions/walletConnectActions';
import { DARK_THEME } from 'constants/appSettingsConstants';
import type { RootReducerState, Dispatch } from 'reducers/rootReducer';


type Props = {
  promoCardCollapsed: boolean,
  toggleWCPromoCard: (collapsed: boolean) => void,
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
  margin: 20px ${spacing.layoutSides}px;
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
  font-size: ${fontSizes.large};
  color: ${({ theme }) => theme.current === DARK_THEME ? theme.colors.tertiary : theme.colors.text};
`;

const PromoCard = ({ promoCardCollapsed, toggleWCPromoCard }: Props) => {
  if (promoCardCollapsed) {
    return (
      <CollapsedWrapper onPress={() => toggleWCPromoCard(false)}>
        <CollapsedPromoText small secondary>A collection of dapps to use with Pillar</CollapsedPromoText>
        <Spacing w={70} />
        <Button small positive title="Explore" leftIconName="search" />
      </CollapsedWrapper>
    );
  }
  return (
    <CardWrapper>
      <ShadowedCard borderRadius={30}>
        <CachedImage
          source={promoImage}
          resizeMode="cover"
          style={{ width: '100%', aspectRatio: promoImageAspectRatio }}
        />
        <ContentContainer>
          <BaseText center regular secondary>
            Swap tokens on decentralized exchanges, lend &amp; borrow crypto, play games and more
          </BaseText>
          <ButtonsContainer>
            <Button small secondary title="Learn more" />
            <Spacing w={15} />
            <Button small positive title="Explore" leftIconName="search" />
          </ButtonsContainer>
        </ContentContainer>
        <CloseIconContainer onPress={() => toggleWCPromoCard(true)}>
          <CloseIcon name="rounded-close" />
        </CloseIconContainer>
      </ShadowedCard>
    </CardWrapper>
  );
};

const mapStateToProps = ({
  walletConnect: { promoCardCollapsed },
}: RootReducerState): $Shape<Props> => ({
  promoCardCollapsed,
});

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  toggleWCPromoCard: (collapsed) => dispatch(toggleWCPromoCardAction(collapsed)),
});

export default connect(mapStateToProps, mapDispatchToProps)(PromoCard);
