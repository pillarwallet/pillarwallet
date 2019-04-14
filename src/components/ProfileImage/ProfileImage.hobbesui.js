import React from 'react';
import { Styleguide } from 'StyleguideSystem';
import { Container } from 'components/Layout';
import ProfileImage from './ProfileImage';

Styleguide.add({
  parent: 'COMPONENT',
  group: 'Profile Image',
  id: 'PROFILE_IMAGE_DEFAULT',
  title: 'Default',
  component: (
    <Container>
      <ProfileImage
        userName="foo Bar"
        initialsSize={60}
        diameter={100}
      />
    </Container>
  ),
});

Styleguide.add({
  parent: 'COMPONENT',
  group: 'Profile Image',
  id: 'PROFILE_IMAGE_WITHOUT_SHADOW',
  title: 'Without shadow',
  component: (
    <Container>
      <ProfileImage
        noShadow
        userName="foo Bar"
        initialsSize={60}
        diameter={100}
      />
    </Container>
  ),
});
