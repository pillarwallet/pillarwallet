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
import {
  View,
  TouchableNativeFeedback,
  TouchableOpacity,
  Platform,
  Linking,
} from 'react-native';
import styled from 'styled-components/native';
import type { NavigationScreenProp } from 'react-navigation';
import { baseColors, fontSizes, spacing, fontTrackings, fontStyles } from 'utils/variables';
import { BaseText } from 'components/Typography';
import Icon from 'components/Icon';
import Header from 'components/Header';
import { Container, Wrapper } from 'components/Layout';

type Props = {
  navigation: NavigationScreenProp<*>,
}

const StyledFlatList = styled.FlatList`
  margin-bottom: ${spacing.rhythm}px;
  border-top-width: 1px;
  border-bottom-width: 1px;
  border-color: ${baseColors.lightGray};
`;

const ListRow = styled(View)`
  width: 100%;
  padding: 22px ${spacing.rhythm}px;
  flex-direction: row;
  background-color: ${baseColors.white};
  align-items: center;
  justify-content: space-between;
`;

const ListRowItem = styled(BaseText)`
  ${fontStyles.medium};
  width: 50%;
  padding-right: ${spacing.rhythm}px;
  letter-spacing: ${fontTrackings.tiny}px;
  color: ${props => props.label ? baseColors.slateBlack : baseColors.darkGray};
`;

const SeparatorWrapper = styled(View)`
  width: 100%;
  padding-left: ${props => props.horizonalPadding ? spacing.rhythm : 0}px;
  padding-right: ${props => props.horizonalPadding ? spacing.rhythm : 0}px;
  flex-direction: row;
`;

const Separator = styled(View)`
  width: 100%;
  height: 1px;
  background-color: ${baseColors.lightGray}
`;

class ICOLinks extends React.Component<Props, {}> {
  navigateBack = () => {
    this.props.navigation.goBack();
  };

  openLink = (address: string) => {
    Linking.openURL(address).catch(() => {});
  };

  renderExternalLinksItem = ({ item: link }: Object) => {
    if (Platform.OS === 'android') {
      return (
        <TouchableNativeFeedback
          onPress={() => this.openLink(link.url)}
          background={TouchableNativeFeedback.Ripple()}
        >
          <ListRow>
            <ListRowItem label>
              {link.name}
            </ListRowItem>
            <Icon
              name="chevron-right"
              style={{
                fontSize: fontSizes.tiny,
                color: baseColors.coolGrey,
              }}
            />
          </ListRow>
        </TouchableNativeFeedback>
      );
    }
    return (
      <TouchableOpacity
        onPress={() => this.openLink(link.url)}
        underlayColor={baseColors.lightGray}
      >
        <ListRow>
          <ListRowItem label>
            {link.name}
          </ListRowItem>
          <Icon
            name="chevron-right"
            style={{
              fontSize: fontSizes.tiny,
              color: baseColors.coolGrey,
            }}
          />
        </ListRow>
      </TouchableOpacity>
    );
  };

  renderSeparator = () => {
    return (
      <SeparatorWrapper>
        <Separator />
      </SeparatorWrapper>
    );
  };

  render() {
    const { links } = this.props.navigation.state.params;

    return (
      <Container>
        <Header onBack={this.navigateBack} title="links" />
        <Wrapper>
          <StyledFlatList
            keyExtractor={item => item.url}
            data={links}
            renderItem={this.renderExternalLinksItem}
            ItemSeparatorComponent={() => this.renderSeparator()}
            contentContainerStyle={{
              flexGrow: 1,
              backgroundColor: baseColors.white,
            }}
            refreshing={false}
          />
        </Wrapper>
      </Container>
    );
  }
}

export default ICOLinks;
