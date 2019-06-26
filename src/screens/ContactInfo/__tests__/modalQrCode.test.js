// @flow
import * as React from 'react';
import renderer from 'react-test-renderer';
import ModalQRCode from '../modalQRCode';

const data = 'MECARD:N:test,test;NICKNAME:testUser;EMAIL:test@test.com;ADR:testCity,testCountry;';

const onCloseModal = jest.fn();

const Component = <ModalQRCode data={data} onCloseModal={onCloseModal} />;

describe('Modal contact info', () => {
  it('should render modal correctly', () => {
    const component = renderer.create(Component).toJSON();
    expect(component).toMatchSnapshot();
  });
});
