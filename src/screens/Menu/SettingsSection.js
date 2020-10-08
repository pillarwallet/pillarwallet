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
import { FlatList } from 'react-native';
import styled from 'styled-components/native';

// components
import { MediumText } from 'components/Typography';
import SettingsListItem from 'components/ListItem/SettingsItem';
import ShadowedCard from 'components/ShadowedCard';

// utils
import { fontStyles, spacing } from 'utils/variables';
import { themedColors } from 'utils/themes';

const SectionHeader = styled(MediumText)`
  color: ${themedColors.accent};
  ${fontStyles.regular};
  margin-top: ${spacing.large}px;
  margin-bottom: 9px;
  margin-horizontal: ${spacing.layoutSides}px;
`;

type Props = {
  sectionTitle?: string,
  sectionItems: Object[],
};

const Section = (props: Props) => {
  const { sectionItems } = props;

  return (
    <FlatList
      keyExtractor={item => item.key}
      data={sectionItems}
      contentContainerStyle={{
        borderRadius: 6,
        overflow: 'hidden',
        paddingHorizontal: spacing.layoutSides,
        paddingVertical: spacing.medium,
      }}
      renderItem={({ item }) => {
        const {
          title,
          subtitle,
          value,
          toggle,
          onPress,
          notificationsCount,
          hidden,
          label,
          labelBadge,
          disabled,
          bulletedLabel,
        } = item;
        if (hidden) return null;
        return (
          <ShadowedCard wrapperStyle={{ marginBottom: 10, width: '100%' }} disabled={disabled}>
            <SettingsListItem
              label={title}
              description={subtitle}
              value={value}
              toggle={toggle}
              onPress={onPress}
              notificationsCount={notificationsCount}
              rightLabel={label}
              labelBadge={labelBadge}
              bulletedLabel={bulletedLabel}
            />
          </ShadowedCard>
        );
      }}
    />
  );
};

export const SettingsSection = (props: Props) => {
  const { sectionTitle } = props;
  return (
    <React.Fragment>
      {sectionTitle && <SectionHeader>{sectionTitle}</SectionHeader>}
      <Section {...props} />
    </React.Fragment>
  );
};
