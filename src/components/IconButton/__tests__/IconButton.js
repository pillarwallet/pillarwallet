// @flow
import * as React from 'react';
import renderer from 'react-test-renderer';
import IconButton from '../IconButton';

describe('IconButton', () => {
  it('should render IconButton correctly', () => {
    const component = renderer.create(<IconButton icon="settings" />).toJSON();
    expect(component).toMatchSnapshot();
  });
});
