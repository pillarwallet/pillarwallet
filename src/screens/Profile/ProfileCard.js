// @flow
import * as React from 'react';
import styled from 'styled-components/native';

type Props = {
  name: string,
  email: string,
}

const ProfileCardWrapper = styled.View`
  background-color: #ffffff;
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.26);
  width: 100%;
  padding: 20px;
  align-items: center;
`;

const ProfileCardAvatar = styled.View`
  width: 60px;
  height: 60px;
  background-color: #d8d8d8;
  border: 1px solid #c0c0c0;
  border-radius: 30px;
  margin-bottom: 10px;
`;

const ProfileCardName = styled.Text`
  font-size: 22px;
  color: #4a4a4a;
  margin-bottom: 10px;
`;

const ProfileCardEmail = styled.Text`
  font-size: 16px;
  color: #4a4a4a;
`;

const ProfileCard = (props: Props) => {
  return (
    <ProfileCardWrapper>
      <ProfileCardAvatar />
      <ProfileCardName>{props.name}</ProfileCardName>
      <ProfileCardEmail>{props.email}</ProfileCardEmail>
    </ProfileCardWrapper>
  );
};

export default ProfileCard;
