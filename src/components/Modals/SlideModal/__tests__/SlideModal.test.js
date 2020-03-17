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
import renderer from 'react-test-renderer';
import { Provider } from 'react-redux';
import { BaseText } from 'components/Typography';
import { shallow } from 'enzyme';
import { ThemeProvider } from 'styled-components';
import { defaultTheme } from 'utils/themes';
import { fontSizes } from 'utils/variables';
import { delay } from 'utils/common';
import configureStore from '../../../../configureStore';
import SlideModal from '../SlideModal';

const { store } = configureStore();

describe('Slide Modal', () => {
  it('should render SlideModal correctly', () => {
    const component = renderer.create(
      <Provider store={store}>
        <ThemeProvider theme={defaultTheme}>
          <SlideModal title="title" isVisible />
        </ThemeProvider>
      </Provider>).toJSON();
    expect(component).toMatchSnapshot();
  });

  it('should render SlideModal with content', () => {
    const ChildContent = () => <BaseText>Test</BaseText>;
    const wrapper = shallow(
      <ThemeProvider theme={defaultTheme}>
        <SlideModal title="title" isVisible>
          <ChildContent />
        </SlideModal>
      </ThemeProvider>);
    expect(wrapper.find(ChildContent)).toHaveLength(1);
  });

  it('should close modal on dismiss', async () => {
    const onModalHide = jest.fn();
    const component = renderer.create(
      <Provider store={store}>
        <ThemeProvider theme={defaultTheme}>
          <SlideModal title="title" isVisible onModalHide={onModalHide} />
        </ThemeProvider>
      </Provider>);
    const instance = component.root;
    const button = instance.findByProps({ icon: 'close', fontSize: fontSizes.regular });
    button.props.onPress();
    await delay(400);
    expect(onModalHide).toHaveBeenCalled();
  });
});
