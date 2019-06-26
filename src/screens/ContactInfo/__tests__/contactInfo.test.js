// @flow
import * as React from 'react';
import renderer from 'react-test-renderer';
import { shallow } from 'enzyme';
import { ContactInfo } from '../ContactInfo';

const user = {
  firstName: 'test',
  lastName: 'test',
  username: 'testUser',
  email: 'test@test.com',
  city: 'testCity',
  country: 'testCountry',
};

const navigation: any = {};

const Component = <ContactInfo user={user} navigation={navigation} />;

describe('Contact info', () => {
  it('should render Contact info correctly', () => {
    const component = renderer.create(Component).toJSON();
    expect(component).toMatchSnapshot();
  });

  it('should create mecard string for qr code with email and name', () => {
    const wrapper = shallow(Component);
    const instance = wrapper.instance();
    const data = instance.getDataQR();
    expect(data).toBe('MECARD:N:test,test;NICKNAME:;EMAIL:test@test.com;ADR:;');
  });

  it('should create mecard string for qr code with more user info', () => {
    const wrapper = shallow(Component);
    const instance = wrapper.instance();
    wrapper.setState({
      name: true,
      username: true,
      city: true,
      country: true,
    });
    instance.forceUpdate();
    const data = instance.getDataQR();
    expect(data).toBe('MECARD:N:test,test;NICKNAME:testUser;EMAIL:test@test.com;ADR:testCity,testCountry;');
  });
});
