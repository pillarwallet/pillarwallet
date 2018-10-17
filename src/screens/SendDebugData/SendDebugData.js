// @flow
import * as React from 'react';
import { connect } from 'react-redux';
import type { NavigationScreenProp } from 'react-navigation';
import { Container, Footer, Wrapper } from 'components/Layout';
import Header from 'components/Header';
import { Paragraph } from 'components/Typography';
import Button from 'components/Button';
import { DEBUG_DATA_LOGGER } from 'react-native-dotenv';
import Storage from 'services/storage';

const storage = Storage.getInstance('db');

type Props = {
  user: Object,
  navigation: NavigationScreenProp<*>,
};

type State = {
  uploadStarted: boolean,
  uploadFinished: boolean,
  uploadError: boolean,
};

class SendDebugDataScreen extends React.Component<Props, State> {
  state = {
    uploadStarted: false,
    uploadFinished: false,
    uploadError: false,
  };

  handleScreenDismissal = () => {
    this.props.navigation.goBack(null);
  };

  send = () => {
    const { user: { username } } = this.props;
    this.setState({
      uploadStarted: true,
      uploadFinished: false,
      uploadError: false,
    }, async () => {
      const dbData = await storage.getAllDocs();
      fetch(DEBUG_DATA_LOGGER, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          log: dbData,
        }),
      })
        .then(() => {
          this.setState({
            uploadStarted: false,
            uploadFinished: true,
          });
        })
        .catch(() => {
          this.setState({
            uploadStarted: false,
            uploadFinished: true,
            uploadError: true,
          });
        });
    });
  };

  render() {
    const { uploadStarted, uploadFinished, uploadError } = this.state;
    return (
      <Container>
        <Header title="Send debug data" onClose={this.handleScreenDismissal} />
        <Wrapper regularPadding>
          <Paragraph>This will send the debug data to our servers</Paragraph>
          {!!uploadStarted && <Paragraph light>Uploading...</Paragraph>}
          {!!uploadFinished && <Paragraph light>Done!</Paragraph>}
          {!!uploadError && <Paragraph light>Error occurred, please try again later</Paragraph>}
        </Wrapper>
        <Footer>
          <Button block marginBottom="20px" onPress={this.send} title="Send" disabled={uploadStarted} />
        </Footer>
      </Container>
    );
  }
}

const mapStateToProps = ({ user: { data: user } }) => ({
  user,
});

export default connect(mapStateToProps)(SendDebugDataScreen);
