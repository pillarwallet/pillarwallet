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
import styled from 'styled-components/native';
import LinearGradient from 'react-native-linear-gradient';
import { useTranslationWithPrefix } from 'translations/translate';

import { Spacing } from 'components/Layout';
import Text from 'components/modern/Text';

import { spacing } from 'utils/variables';

const logo = require('assets/images/no_logo.png');

function MigrateWalletBanner() {
  const { t } = useTranslationWithPrefix('smartWalletContent.banner');

  return (
    <Container colors={['#008606', '#000100']} locations={[0.05, 0.65]} useAngle angle={171}>
      <Logo source={logo} />

      <Summary>
        <Text variant="big" font="medium" color="#fcfdff">
          {t('title')}
        </Text>

        <Spacing h={spacing.small} />

        <Text color="#fcfdff">{t('body')}</Text>
      </Summary>
    </Container>
  );
}

const Container = styled(LinearGradient)`
  flex-direction: row;
  margin-bottom: ${spacing.large}px;
  padding: ${spacing.mediumLarge}px ${spacing.mediumLarge}px ${spacing.large}px;
  background-color: green;
  border-radius: 20px;
`;

const Logo = styled.Image`
  width: 45px;
  height: 45px;
`;

const Summary = styled.View`
  flex: 1;
  margin-left: ${spacing.mediumLarge}px;
`;

export default MigrateWalletBanner;
