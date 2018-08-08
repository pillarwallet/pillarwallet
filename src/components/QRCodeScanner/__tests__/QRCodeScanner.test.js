// @flow
import * as React from 'react';
import { shallow } from 'enzyme';
import QRCodeScanner from '../QRCodeScanner';

describe('QR code scanner', () => {
  xit('should ask for permissions on component mount', () => {
    const wrapper = shallow(<QRCodeScanner isActive onRead={(() => { })} onDismiss={(() => { })} />);
    const spy = jest.spyOn(wrapper.instance(), 'askPermissions');
    expect(spy).toBeCalled();
  });
});
