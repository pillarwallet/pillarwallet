// @flow
import * as React from 'react';
import styled from 'styled-components/native';
import type { NavigationScreenProp } from 'react-navigation';
import { connect } from 'react-redux';
import { baseColors, fontSizes } from 'utils/variables';
import { Container, Wrapper } from 'components/Layout';
import { BoldText } from 'components/Typography';
import Button from 'components/Button';
import { CHAT } from 'constants/navigationConstants';
import SlideModal from 'components/Modals/SlideModal';
import Header from 'components/Header';
import ProfileImage from 'components/ProfileImage';
import type { ApiUser } from 'models/Contacts';
import CircleButton from 'components/CircleButton';

const ContactWrapper = styled.View`
  height: 218px;
  position: relative;
  justify-content: flex-end;
  margin-top: 30px;
  margin-bottom: 20px;
`;

const ContactHeader = styled.View`
  height: 200px;
  background: ${baseColors.cyan};
  shadow-color: ${baseColors.black};
  shadow-offset: 0 0;
  shadow-radius: 2px;
  shadow-opacity: 0.1;
  border-radius: 12px;
  align-items: center;
  position: relative;
  z-index: -1;
  padding-top: 46px;
`;

const ContactHeaderBody = styled.View`
  height: 200px;
  margin-top: -48px;
  justify-content: center;
`;

const ContactHeaderName = styled(BoldText)`
  font-size: ${fontSizes.extraExtraLarge};
  color: ${baseColors.white};
`;

const ContactHeaderAvatarWrapper = styled.View`
  height: 64px;
  width: 64px;
  border: 2px solid ${baseColors.white};
  background: ${baseColors.cyan};
  border-radius: 32px;
  margin-right: 14px;
  shadow-color: ${baseColors.black};
  shadow-offset: 0 0;
  shadow-radius: 2px     ;
  shadow-opacity: 0.1;
  position: absolute;
  top: 0;
  left: 50%;
  margin-left: -32px;
`;

type Props = {
  name: string,
  navigation: NavigationScreenProp<*>,
  contacts: ApiUser[],
}

type State = {
  isOptionsModalActive: boolean,
}

class Contact extends React.Component<Props, State> {
  state = {
    isOptionsModalActive: false,
  }

  openOptionsModal = () => {
    this.setState({
      isOptionsModalActive: true,
    });
  }

  closeOptionsModal = () => {
    this.setState({
      isOptionsModalActive: false,
    });
  }

  render() {
    const { navigation, contacts } = this.props;
    const { isOptionsModalActive } = this.state;
    const contact = navigation.getParam('contact', {});
    const isAccepted = !!contacts.find(({ username }) => username === contact.username);
    return (
      <Container>
        <Header
          title="contact"
          onBack={() => navigation.goBack(null)}
          // onNextPress={this.openOptionsModal}
          // nextIcon="more"
        />
        <Wrapper regularPadding>
          <ContactWrapper>
            <ContactHeader>
              <ContactHeaderBody>
                <ContactHeaderName>
                  {contact.username}
                </ContactHeaderName>
              </ContactHeaderBody>
            </ContactHeader>
            <ContactHeaderAvatarWrapper >
              <ProfileImage
                uri={contact.profileImage}
                userName={contact.username}
                diameter={60}
                textStyle={{ fontSize: 32 }}
              />
            </ContactHeaderAvatarWrapper>
          </ContactWrapper>
          {isAccepted &&
          <CircleButton label="Chat" icon="send" onPress={() => navigation.navigate(CHAT, { contact })} />
          }
        </Wrapper>
        <SlideModal
          title="manage"
          isVisible={isOptionsModalActive}
          onModalHide={this.closeOptionsModal}
        >
          <Button secondary block marginBottom="10px" onPress={() => { }} title="Mute" />
          <Button secondary block marginBottom="10px" onPress={() => { }} title="Remove connection" />
          <Button secondary danger block marginBottom="10px" onPress={() => { }} title="Report / Block" />
        </SlideModal>
      </Container>
    );
  }
}

const mapStateToProps = ({
  contacts: { data: contacts },
}) => ({
  contacts,
});

export default connect(mapStateToProps)(Contact);
