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
import { SafeAreaView, withNavigation } from 'react-navigation';
import { SDK_PROVIDER } from 'react-native-dotenv';
import { connect } from 'react-redux';
import styled from 'styled-components';
import { createStructuredSelector } from 'reselect';
import type { NavigationScreenProp } from 'react-navigation';

// components
import { Spacing } from 'components/Layout';
import { BaseText, MediumText } from 'components/Typography';
import SlideModal from 'components/Modals/SlideModal';
import Button from 'components/Button';

// constants
import { PLR } from 'constants/assetsConstants';

// utils
import { spacing } from 'utils/variables';

// selectors
import { accountAssetsSelector } from 'selectors/assets';

// types
import type { Theme } from 'models/Theme';
import type { Assets } from 'models/Asset';


type Props = {
  isVisible: boolean,
  onModalHide: (callback: () => void) => void,
  accountAssets: Assets,
  navigation: NavigationScreenProp<*>,
  theme: Theme,
};

const ModalContainer = styled.View`
  padding: 20px ${spacing.layoutSides}px 80px;
`;

const RelayerMigrationModal = (props: Props) => {
  const { isVisible, onModalHide, accountAssets } = props;
  const { iconUrl } = accountAssets[PLR] || {};
  return (
    <SlideModal
      isVisible={isVisible}
      onModalHide={onModalHide}
      hideHeader
    >
      <SafeAreaView>
        <ModalContainer>
          <MediumText center medium>Pay fees with PLR</MediumText>
          <Spacing h={18} />
          {iconUrl &&
            <CachedImage
              style={{ width: 64, height: 64, alignSelf: 'center' }}
              source={{ uri: `${SDK_PROVIDER}/${iconUrl}?size=2` }}
              resizeMode="contain"
            />
          }
          <Spacing h={20} />
          <BaseText medium>
            Bye-bye ETH! After switch you will be able to pay transaction fees with PLR token.
            Never insufficient gas again.
          </BaseText>
          <Spacing h={30} />
          <Button
            title="Switch"
            onPress={() => {}}
          />
          <Spacing h={30} />
          <BaseText regular center secondary>
            Switching is free{'\n'}This is irreversible.
          </BaseText>
        </ModalContainer>
      </SafeAreaView>
    </SlideModal>
  );
};

const structuredSelector = createStructuredSelector({
  accountAssets: accountAssetsSelector,
});

export default withNavigation(connect(structuredSelector)(RelayerMigrationModal));
