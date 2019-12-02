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
import { FlatList, View } from 'react-native';
import styled from 'styled-components/native';

// components
import { MediumText } from 'components/Typography';
import SettingsListItem from 'components/ListItem/SettingsItem';
import ShadowedCard from 'components/ShadowedCard';

// utils
import { baseColors, UIColors, fontStyles, spacing } from 'utils/variables';
import { ListCard } from 'components/ListItem/ListCard';

const SectionHeader = styled(MediumText)`
  color: ${baseColors.blueYonder};
  ${fontStyles.regular};
  margin-top: ${spacing.large}px;
  margin-bottom: 9px;
  margin-horizontal: ${spacing.large}px;
`;

const Separator = styled.View`
  width: 100%;
  height: 1px;
  background-color: ${UIColors.listDivider};
`;

type Props = {
  sectionTitle: string,
  sectionItems: Object[],
  isCardsList?: boolean,
}

const Section = (props: Props) => {
  const { sectionItems, isCardsList } = props;
  if (isCardsList) {
    return (
      <FlatList
        keyExtractor={item => item.key}
        data={sectionItems}
        style={{ marginTop: -spacing.medium }}
        contentContainerStyle={{ width: '100%', paddingHorizontal: spacing.large, paddingTop: spacing.medium }}
        renderItem={({ item }) => {
          const {
            title,
            onPress,
            hidden,
            body,
            label,
            titleStyle,
            disabled,
            minHeight,
          } = item;
          if (hidden) return null;
          return (
            <ListCard
              title={title}
              titleStyle={titleStyle}
              subtitle={body}
              action={onPress}
              label={label}
              contentWrapperStyle={{ minHeight, padding: 16 }}
              disabled={disabled}
            />
          );
        }
        }
      />
    );
  }

  return (
    <View style={{ paddingHorizontal: spacing.large }}>
      <ShadowedCard wrapperStyle={{ marginBottom: 10, width: '100%' }}>
        <FlatList
          keyExtractor={item => item.key}
          data={sectionItems}
          contentContainerStyle={{ borderRadius: 6, overflow: 'hidden' }}
          renderItem={({ item }) => {
            const {
              title,
              value,
              toggle,
              onPress,
              notificationsCount,
              hidden,
            } = item;
            if (hidden) return null;
            return (
              <SettingsListItem
                label={title}
                value={value}
                toggle={toggle}
                onPress={onPress}
                notificationsCount={notificationsCount}
              />
            );
          }}
          ItemSeparatorComponent={() => (<Separator />)}
        />
      </ShadowedCard>
    </View>
  );
};

export const SettingsSection = (props: Props) => {
  const { sectionTitle } = props;
  return (
    <React.Fragment>
      <SectionHeader>{sectionTitle}</SectionHeader>
      <Section {...props} />
    </React.Fragment>
  );
};
