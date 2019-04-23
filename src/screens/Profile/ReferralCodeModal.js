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
  font-size: ${fontSizes.medium}
  padding: 14px
`;

const shareOnSocialMedia = (sharerUrl: string, closeModal) => () => {
  const options = {
    message: 'Get your 25 PLR',
    url: sharerUrl,
  };
  Share.open(options)
    .then(closeModal)
    .catch((() => {}));
};

const ReferralCodeModal = ({ username, closeModal }: Object) => {
  return (
    <View>
      <Label>Share your code with friends!</Label>
      <LabeledRow>
        <TouchableOpacity onPress={shareOnSocialMedia(username, closeModal)}>
          <Value>{username}</Value>
        </TouchableOpacity>
      </LabeledRow>
    </View>
  );
};

export default ReferralCodeModal;
