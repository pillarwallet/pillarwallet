// @flow
import * as React from 'react';
import renderer from 'react-test-renderer';
import ButtonIcon from '../ButtonIcon';

describe('Button Icon', () => {
  it('should render Button Icon correctly', () => {
    const component = renderer.create(<ButtonIcon icon="settings" />).toJSON();
    expect(component).toMatchSnapshot();
  });
});
