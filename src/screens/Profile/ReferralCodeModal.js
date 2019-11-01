// @flow
import * as React from 'react';
import { TouchableOpacity, View } from 'react-native';
import styled from 'styled-components/native';
import { fontSizes } from 'utils/variables';
import { BoldText, Label } from 'components/Typography';
import Share from 'react-native-share';

const LabeledRow = styled.View`
  margin: 20px 0 50px;
  justify-content: center
  flexDirection: row
`;

const Value = styled(BoldText)`
  font-size: ${fontSizes.large}px;
  padding: 14px
`;

const shareOnSocialMedia = (username: string, onModalClose) => () => {
  const options = {
    message: 'Get your 25 PLR',
    url: `pillarwallet://referral/${username}`,
  };
  Share.open(options)
    .then(onModalClose)
    .catch(() => {});
};

const ReferralCodeModal = ({ username, onModalClose }: Object) => {
  return (
    <View>
      <Label>Share your code with friends!</Label>
      <LabeledRow>
        <TouchableOpacity onPress={shareOnSocialMedia(username, onModalClose)}>
          <Value>{username}</Value>
        </TouchableOpacity>
      </LabeledRow>
    </View>
  );
};

export default ReferralCodeModal;
