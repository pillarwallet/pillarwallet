// @flow
import * as React from 'react';
import { View as mockView } from 'react-native';
import { Permissions } from 'expo';
import QRCodeScanner from '../QRCodeScanner';
import renderer from 'react-test-renderer';
import 'jest-styled-components';

jest.mock('expo', () => {
  const mockCamera = () => <mockView />;
  const constants = { 
    Aspect: {},
    BarCodeType: {},
    Type: {},
    CaptureMode: {},
    CaptureTarget: {},
    CaptureQuality: {},
    Orientation: {},
    FlashMode: {},
    TorchMode: {},
  };
  mockCamera.Constants = constants;
  return {
    Camera: mockCamera,
    Permissions: {
      askAsync: jest.fn(() => Promise.resolve({ status: 'GRANTED' })),
      CAMERA: 'camera',
    }
  }
});

describe('QR code scanner', () => {
  it('should ask for permissions on component mount', () => {
    const component = renderer.create(<QRCodeScanner onRead={(() => { })} />);
    expect(Permissions.askAsync).toHaveBeenCalledWith('camera');
  });
});
