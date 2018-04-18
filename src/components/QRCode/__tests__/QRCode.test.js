// @flow
import * as React from 'react';
import QRCode from '../QRCode';
import renderer from 'react-test-renderer';

describe('QR code scanner', () => {
  it('should render QR code with a provided value', (done) => {
    const component = renderer.create(<QRCode value="address" />)
    setTimeout(() => {      
      expect(component.toJSON()).toMatchSnapshot();
      done();
    }, 1000)
  });
});