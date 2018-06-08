// @flow
import * as React from 'react';
import renderer from 'react-test-renderer';
import ModalHeader from '../ModalHeader';

describe('Header', () => {
  it('should render ModalHeader correctly', () => {
    const component = renderer.create(<ModalHeader onClose={() => {}} />).toJSON();
    expect(component).toMatchSnapshot();
  });
});
