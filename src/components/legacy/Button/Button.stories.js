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
import { View } from 'react-native';
import { storiesOf } from '@storybook/react-native';
import Button from 'components/legacy/Button';
import WithThemeDecorator from '../../../../storybook/WithThemeDecorator';

const Decorator = (story) => (
  <View style={{
    padding: 20,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
  }}
  >
    {story()}
  </View>
);

const commonProps = {
  title: 'Button title',
  onPress: () => {},
};

storiesOf('Button', module)
  .addDecorator(Decorator)
  .addDecorator(WithThemeDecorator)
  .add('all variants', () => (
    <>
      <Button {...commonProps} />
      <Button {...commonProps} title="Long long long long long long title that takes up two lines" disabled />
      <Button {...commonProps} primarySecond />
      <Button {...commonProps} primarySecond disabled />
      <Button {...commonProps} danger />
      <Button {...commonProps} danger disabled />
      <Button {...commonProps} secondary />
      <Button {...commonProps} secondary disabled />
    </>
  ))
  .add('loading buttons', () => (
    <>
      <Button {...commonProps} isLoading />
      <Button {...commonProps} disabled isLoading />
      <Button {...commonProps} primarySecond isLoading />
      <Button {...commonProps} primarySecond disabled isLoading />
      <Button {...commonProps} danger isLoading />
      <Button {...commonProps} danger disabled isLoading />
      <Button {...commonProps} secondary isLoading />
      <Button {...commonProps} secondary disabled isLoading />
    </>
  ))
  .add('buttons auto width', () => (
    <>
      <Button {...commonProps} block={false} />
      <Button {...commonProps} disabled block={false} />
      <Button {...commonProps} primarySecond block={false} />
      <Button {...commonProps} primarySecond disabled block={false} />
      <Button {...commonProps} danger block={false} />
      <Button {...commonProps} danger disabled block={false} />
      <Button {...commonProps} secondary block={false} />
      <Button {...commonProps} secondary disabled block={false} />
    </>
  ))
  .add('buttons with icons', () => (
    <>
      <Button {...commonProps} block={false} rightIconName="search" />
      <Button {...commonProps} disabled block={false} leftIconName="back" />
      <Button {...commonProps} primarySecond block={false} rightIconName="search" />
      <Button {...commonProps} primarySecond disabled block={false} leftIconName="back" />
      <Button {...commonProps} danger block={false} rightIconName="search" />
      <Button {...commonProps} danger disabled block={false} leftIconName="back" />
      <Button {...commonProps} secondary block={false} rightIconName="search" />
      <Button {...commonProps} secondary disabled block={false} leftIconName="back" />
    </>
  ))
  .add('small buttons', () => (
    <>
      <Button {...commonProps} small />
      <Button title="Long long long long long long title that takes up two lines" onPress={() => {}} disabled small />
      <Button {...commonProps} primarySecond small />
      <Button {...commonProps} primarySecond disabled small />
      <Button {...commonProps} danger small />
      <Button {...commonProps} danger disabled small />
      <Button {...commonProps} secondary small />
      <Button {...commonProps} secondary disabled small />
    </>
  ))
  .add('small buttons auto width', () => (
    <>
      <Button {...commonProps} small block={false} />
      <Button {...commonProps} disabled small block={false} />
      <Button {...commonProps} primarySecond small block={false} />
      <Button {...commonProps} primarySecond disabled small block={false} />
      <Button {...commonProps} danger small block={false} />
      <Button {...commonProps} danger disabled small block={false} />
      <Button {...commonProps} secondary small block={false} />
      <Button {...commonProps} secondary disabled small block={false} />
    </>
  ))
  .add('small buttons auto width loading', () => (
    <>
      <Button {...commonProps} small block={false} isLoading />
      <Button {...commonProps} disabled small block={false} isLoading />
      <Button {...commonProps} primarySecond small block={false} isLoading />
      <Button {...commonProps} primarySecond disabled small block={false} isLoading />
      <Button {...commonProps} danger small block={false} isLoading />
      <Button {...commonProps} danger disabled small block={false} isLoading />
      <Button {...commonProps} secondary small block={false} isLoading />
      <Button {...commonProps} secondary disabled small block={false} isLoading />
    </>
  ))
  .add('transparent buttons', () => (
    <>
      <Button {...commonProps} transparent />
      <Button {...commonProps} transparent disabled />
      <Button {...commonProps} transparent small />
      <Button {...commonProps} transparent disabled small />
      <Button {...commonProps} transparent danger />
      <Button {...commonProps} transparent danger disabled />
      <Button {...commonProps} transparent danger small />
      <Button {...commonProps} transparent danger disabled small />
    </>
  ));
