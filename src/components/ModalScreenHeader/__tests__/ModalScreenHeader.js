// @flow
import * as React from 'react';
import renderer from 'react-test-renderer';
import ModalHeader from '../ModalScreenHeader';

describe('Header', () => {
  it('should render ModalScreenHeader correctly', () => {
    const component = renderer.create(<ModalHeader onClose={() => {}} />).toJSON();
    expect(component).toMatchSnapshot();
  });
});
