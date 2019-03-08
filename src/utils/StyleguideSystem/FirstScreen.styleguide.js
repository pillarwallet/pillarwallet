import React from 'react';
import Styleguide from './styleguide';

import FirstScreen from './FirstScreen';

Styleguide.add({
  group: 'Screens',
  id: 'TEST',
  title: 'Test',
  component: (
    <FirstScreen text="hell yeah" />
  ),
});
