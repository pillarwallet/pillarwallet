// @flow
import React from 'react';
import { Text } from 'react-native';
import { mount } from 'enzyme';
import Button from './index';

describe('Button', () => {
  it('renders witout crashing', () => {
    const component = (
      <Button />
    );
    mount(component);
  });
  it('clicks', () => {
    const onPressCallback = jest.fn();
    const component = (
      <Button onPress={onPressCallback} />
    );
    const button = mount(component);
    // yeah, I know it doesn't make any sense but enzyme for RN doesn't support .simulate('press')
    button.props().onPress();
    expect(onPressCallback).toBeCalled();
  });
  it('shows the buton title', () => {
    const text = 'Hello';
    const component = (
      <Button>
        <Text>{text}</Text>
      </Button>
    );
    const button = mount(component);
    expect(button.text()).toEqual(text);
  });
});
