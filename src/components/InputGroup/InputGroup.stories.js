// @flow
import React from 'react';
import { storiesOf } from '@storybook/react-native';
import InputGroup from 'components/InputGroup';
import Input from 'components/Input';
import {Label} from 'components/Typography';


storiesOf('InputGroup', module)
  .add('Default', () => (
    <InputGroup>
      <Label>First Name</Label>
      <Input />
      <Label>Comment</Label>
      <Input multiline height={80} />
    </InputGroup>
  ));
