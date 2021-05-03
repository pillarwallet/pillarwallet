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
import { SectionList } from 'react-native';

// Types
import type { SectionBase, SectionListProps } from 'utils/types/react-native';

type Section<Item> = {
  key: string,
  subsections: Subsection<Item>[],
};

type Subsection<Item> = {
  key: string,
  data: Item[],
};

type Props<Item> = {|
  ...SectionListProps<SectionBase<NativeItem<Item>>>,
  sections: Section<Item>[],
  renderSectionHeader: (section: SectionBase<NativeItem<Item>>) => React.Element<any> | null,
  renderSubsectionHeader: (subsection: Subsection<Item>) => React.Element<any> | null,
  renderItem: (item: Item) => React.Element<any> | null,
|};

function ThreeLevelList<Item>({
  sections,
  renderSectionHeader,
  renderSubsectionHeader,
  renderItem,
  ...rest
}: Props<Item>) {
  const nativeSections: SectionBase<NativeItem<Item>>[] = sections.map(flattenSection);

  const renderNativeItem = (item: any) => {
    return item.type === 'subsection' ? renderSubsectionHeader(item.subsection) : renderItem(item.item);
  };

  return (
    <SectionList
      sections={nativeSections}
      renderSectionHeader={({ section }) => renderSectionHeader(section)}
      renderItem={({ item }) => renderNativeItem(item)}
      {...rest}
    />
  );
}

export default ThreeLevelList;

type NativeItem<Item> =
  | {|
      type: 'subsection',
      subsection: Subsection<Item>,
    |}
  | {|
      type: 'item',
      item: Item,
    |};


const flattenSection = <Item>({ subsections, ...rest }: Section<Item>): SectionBase<NativeItem<Item>> => {
  return {
    ...rest,
    data: subsections.flatMap(flattenSubsection),
  };
};

const flattenSubsection = <Item>(subsection: Subsection<Item>): NativeItem<Item>[] => {
  const subsectionItem = { type: 'subsection', subsection };
  const items = subsection.data.map(item => ({ type: 'item', item }));
  return [subsectionItem, ...items];
};
