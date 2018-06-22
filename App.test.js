// @flow
import renderer from 'react-test-renderer';
import React from 'react';
import App from './App';

it('renders without crashing', (done) => {
  const rendered = renderer.create(<App />);
  setTimeout(() => {
    expect(rendered.toJSON()).toBeTruthy();
    done();
  }, 150);
});
