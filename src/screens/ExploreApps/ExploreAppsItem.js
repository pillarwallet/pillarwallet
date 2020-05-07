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
import { Image, Linking } from 'react-native';
import styled from 'styled-components/native';
import { MediumText, BaseText } from 'components/Typography';
import { fontStyles } from 'utils/variables';
import type { AppItem } from 'utils/exploreApps';
import Button from 'components/Button';
import { themedColors } from 'utils/themes';

type Props = {
  item: AppItem,
};

const AppItemWrapper = styled.View`
  padding: 20px 0px;
`;

const AppItemRowWrapper = styled.View`
  flex-direction: row;
  align-items: center;
  margin-bottom: 4px;
`;

const AppName = styled(MediumText)`
  ${fontStyles.big};
`;

const AppText = styled(BaseText)`
  ${fontStyles.medium};
  margin-left: 63px;
  color: ${themedColors.secondaryText};
`;

const ButtonWrapper = styled.View`
  position: absolute;
  right: 0;
`;

const ExploreAppsItem = (props: Props) => {
  const { item } = props;

  const handleAppUrl = () => { Linking.openURL(`https://${item.url}`); };

  return (
    <AppItemWrapper >
      <AppItemRowWrapper>
        <Image source={item.logo} style={{ height: 48, width: 48, marginRight: 15 }} />
        <AppName>{item.name}</AppName>
        <ButtonWrapper>
          <Button title="View" onPress={handleAppUrl} small height={32} horizontalPaddings={9} />
        </ButtonWrapper>
      </AppItemRowWrapper>
      <AppText>{item.text}</AppText>
    </AppItemWrapper>
  );
};


export default ExploreAppsItem;
