// @flow
import * as React from 'react';
import { View } from 'react-native';
import styled from 'styled-components/native';
import { Paragraph } from 'components/Typography';
import QRCodeWithTheme from 'components/QRCode';
import Share from 'react-native-share';

type Props = {
  data: string,
  onCloseModal: () => void,
}

const LabeledRow = styled.View`
  margin: 20px 0 50px;
`;

const Value = styled.TouchableOpacity`
  alignItems: center;
  paddingVertical: 14px;
`;

const ContainerButton = styled.View`
  marginTop: 40px;
`;

class ModalQRCode extends React.Component<Props> {
  svg: any

  constructor(props: Props) {
    super(props);
    this.svg = null;
  }

  shareQROnSocialMedia = () => {
    const { onCloseModal } = this.props;
    requestAnimationFrame(() => {
      this.svg.toDataURL((dataURL) => {
        const shareImageBase64 = {
          title: 'Pillar Profile',
          url: `data:image/png;base64,${dataURL}`,
          subject: 'Share Link',
        };
        Share.open(shareImageBase64)
          .then(onCloseModal)
          .catch(() => {});
      });
    });
  };

  render() {
    const { data } = this.props;
    return (
      <View>
        <Paragraph light small center>
          Allow someone to scan this QR Code to share your contact information with them
        </Paragraph>
        <LabeledRow>
          <Value onPress={this.shareQROnSocialMedia}>
            <QRCodeWithTheme
              value={data}
              size={180}
              getRef={ref => {
                this.svg = ref;
              }}
            />
            <ContainerButton>
              <Paragraph light small center>Or press to share</Paragraph>
            </ContainerButton>
          </Value>
        </LabeledRow>
      </View>
    );
  }
}

export default ModalQRCode;
