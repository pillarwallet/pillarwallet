// @flow
import * as React from 'react';
import { Text } from 'react-native';
import renderer from 'react-test-renderer';
import ButtonIcon from '../ButtonIcon';

describe('Button Icon', () => {
  it('should render SlideModal correctly', () => {
    const component = renderer.create(<ButtonIcon icon="barcode" />).toJSON();
    expect(component).toMatchSnapshot();
  });

});