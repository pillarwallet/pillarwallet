// @flow
import * as React from 'react';
import renderer from 'react-test-renderer';
import Header from '../Header';

describe('Header', () => {
  it('should render Header correctly', () => {
    const component = renderer.create(<Header onBack={() => {}} />).toJSON();
    expect(component).toMatchSnapshot();
  });
});
