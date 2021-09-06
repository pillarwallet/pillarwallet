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


import React from 'react';
import { storiesOf } from '@storybook/react-native';
import styled from 'styled-components/native';

import { BaseText } from 'components/legacy/Typography';
import Icon from 'components/legacy/Icon';
import Image from 'components/Image';

import { themedColors, defaultTheme } from 'utils/themes';
import { fontStyles } from 'utils/variables';
import { images } from 'utils/images';

import DetailModal, { DetailRow, DetailParagraph, FEE_PENDING } from './DetailModal';
import WithThemeDecorator from '../../../storybook/WithThemeDecorator';

const iconImage = (
  <Icon
    borderRadius={64}
    name="scan"
    style={{ fontSize: 64 }}
  />
);

const stories = storiesOf('DetailModal', module);

stories.addDecorator(WithThemeDecorator);


stories.add('Layout S', () => (
  <DetailModal
    date={new Date(2020, 8, 20, 15, 24)}
    title="Subject"
    image={iconImage}
    buttons={[{
      title: 'Label',
    }, {
      title: 'Label',
      secondary: true,
    }]}
  >
    <DetailRow>5,206.78 PLR</DetailRow>
  </DetailModal>
));

stories.add('Layout M', () => (
  <DetailModal
    date={new Date(2020, 8, 20, 15, 24)}
    title="Subject"
    subtitle="from Areya Juntasa"
    image={iconImage}
    fee="Fee $0.16"
    buttons={[{
      title: 'Label',
    }, {
      title: 'Label',
      secondary: true,
    }]}
  >
    <DetailRow>- 0.218 ETH</DetailRow>
    <DetailRow color={themedColors.positive}>+ 2,500 PLR</DetailRow>
  </DetailModal>
));

const LText = styled(BaseText)`
  ${fontStyles.medium};
  text-align: center;
`;

const SourceImage = ({ source }) => (
  <Image
    source={source}
    style={{
      width: 64,
      height: 64,
      borderRadius: 64,
    }}
  />
);

stories.add('Layout L', () => (
  <DetailModal
    title="Actvate Smart Wallet"
    image={<SourceImage source={images(defaultTheme).smartWalletIcon} />}
    fee="Fee $0.16"
    buttons={[{
      title: 'Label',
      secondary: true,
    }, {
      title: 'Label',
      secondary: true,
    }, {
      title: 'Label',
      secondary: true,
    }]}
  >
    <LText>
      Enable better security and free instant transactions via Pillar Network.
      You will get a new badge too.
    </LText>
  </DetailModal>
));

stories.add('Plain Text Child', () => (
  <DetailModal
    date={new Date(2020, 4, 21, 15, 24)}
    title="Subject"
    image={iconImage}
    buttons={[{ title: 'Label' }]}
  >
    Text child
  </DetailModal>
));

stories.add('Paragraph Child', () => (
  <DetailModal
    date={new Date(2020, 4, 21, 15, 24)}
    title="Pillar Pay"
    subtitle="Withdraw"
    image={<SourceImage source={images(defaultTheme).PPNIcon} />}
    buttons={[{
      title: 'Withdraw again',
      secondary: true,
    }]}
    fee="Fee $1.6"
  >
    <DetailRow>+ 1,500 ETH</DetailRow>
    <DetailParagraph>Transaction failed</DetailParagraph>
  </DetailModal>
));

stories.add('Pending Fee', () => (
  <DetailModal
    date={new Date(2020, 4, 21, 15, 24)}
    title="Subject"
    image={iconImage}
    buttons={[{ title: 'Label' }]}
    fee={FEE_PENDING}
  >
    Text
  </DetailModal>
));
