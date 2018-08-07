// @flow
import * as React from 'react';
import Permissions from 'react-native-permissions';
import renderer from 'react-test-renderer';
import QRCodeScanner from '../QRCodeScanner';

describe('QR code scanner', () => {
  it('should ask for permissions on component mount', () => {
    renderer.create(<QRCodeScanner isActive onRead={(() => { })} onDismiss={(() => { })} />);
    expect(Permissions.request('camera')).toHaveBeenCalledWith('camera');
  });
});
