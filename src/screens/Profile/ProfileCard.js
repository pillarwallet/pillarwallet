// @flow
import * as React from 'react';
import styled from 'styled-components/native';

type Props = {
  name: string,
  email: string,
}

const ProfileCardWrapper = styled.View`
  background-color: #ffffff;
  width: 100%;
  padding: 20px;
`;

const ProfileCardName = styled.Text`
  font-size: 22px;
  color: #4a4a4a;
`;

const ProfileCardEmail = styled.Text`
  font-size: 16px;
  color: #4a4a4a;
`;

const ProfileCard = (props: Props) => {
  return (
    <ProfileCardWrapper>
      <ProfileCardName>{props.name}</ProfileCardName>
      <ProfileCardEmail>{props.email}</ProfileCardEmail>
    </ProfileCardWrapper>
  );
};

export default ProfileCard;
