// @flow
import renderer from 'react-test-renderer';
import React from 'react';
import App from './App';

jest.useFakeTimers();

const OLD_ENV = process.env;

describe('App', () => {
  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV };
    delete process.env.NODE_ENV;
  });

  afterEach(() => {
    process.env = OLD_ENV;
  });

  it('renders without crashing', () => {
    const rendered = renderer.create(<App isFetched />);
    expect(rendered.toJSON()).toBeTruthy();
  });
});
