// @flow
import renderer from 'react-test-renderer';
import React from 'react';
import App from './App';

it('renders without crashing', () => {
  const rendered = renderer.create(<App isFetched />);
  expect(rendered.toJSON()).toBeTruthy();
});
