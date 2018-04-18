// @flow
import * as React from 'react';
import renderer from 'react-test-renderer';
import QRCode from '../QRCode';

describe('QR code scanner', () => {
  it('should render QR code with a provided value', (done) => {
    const component = renderer.create(<QRCode value="address" />);
    const timeout = setTimeout(() => {
      clearTimeout(timeout);
      expect(component.toJSON()).toMatchSnapshot();
      done();
    }, 1000);
  });
});
