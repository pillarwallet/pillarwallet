// @flow

import React from 'react';
import { Dimensions, FlatList, Alert } from 'react-native';
import capitalize from 'lodash.capitalize';
import Header from 'components/Header';
import ProfileImage from 'components/ProfileImage/ProfileImage';
import SettingsListItem from 'components/ListItem/SettingsItem';
import CircleButton from 'components/CircleButton';
import { Container, ScrollWrapper } from 'components/Layout';
import { BaseText } from 'components/Typography';
import { Shadow } from 'components/Shadow';
import { baseColors } from 'utils/variables';
import * as styled from './styles';

const iconReceive = require('assets/icons/icon_receive.png');

type Props = {
  profile: Object,
  onNewSession: Function,
  onManageDetails: Function,
  onSetupRecovery: Function,
  onPermissions: Function,
  onChangePersona: Function,
};

const meSettingsItems = (props) => {
  const {
    onManageDetails,
    onSetupRecovery,
    onPermissions,
    onChangePersona,
  } = props;

  return [
    {
      key: 'manageDetailsSessions',
      title: 'Manage details / Sessions',
      onPress: onManageDetails,
    },
    {
      key: 'setupRecovery',
      title: 'Setup Recovery',
      onPress: onSetupRecovery,
    },
    {
      key: 'permissions',
      title: 'Permissions',
      onPress: onPermissions,
    },
  ];
};

const MeScene = (props: Props) => {
  const {
    onNewSession,
    onManageDetails,
    onSetupRecovery,
    onPermissions,
    onChangePersona,
    profile,
  } = props;
  const height = 330;
  const { width } = Dimensions.get('window');

  const giftBoxHeight = 70;

  const { username, profileUri, activePersona } = profile;

  return (
    <Container>
      <Header
        hasSeparator
        headerRightFlex="2"
        title="me"
        nextText="Switch persona"
        nextIcon="down-arrow"
        nextIconColor={baseColors.mediumGray}
        nextIconSize={12}
        onNextPress={onChangePersona}
      />

      <ScrollWrapper>
        <styled.CardContainer>
          <styled.Card>
            <Shadow
              heightAndroid={height}
              heightIOS={height}
              widthIOS={width - 40}
              shadowRadius={6}
              shadowDistance={0}
              shadowSpread={10}
              shadowOffsetX={0}
              shadowOffsetY={1}
              shadowColorOS={baseColors.mediumLightGray}
              shadowBorder={8}
            >
              <styled.CardBoard
                height={height}
              >
                <styled.PersonaLabel>
                  <styled.CurrentPersona>
                    {capitalize(activePersona)} Persona
                  </styled.CurrentPersona>
                  <styled.PersonaSquare>
                    <styled.PersonaTrademark>
                      {activePersona.substring(0,1).toUpperCase()}
                    </styled.PersonaTrademark>
                  </styled.PersonaSquare>
                </styled.PersonaLabel>

                <ProfileImage
                  noShadow
                  uri={profileUri}
                  userName={username}
                  initialsSize={60}
                  diameter={128}
                />

                <styled.NewSession>
                  <CircleButton
                    label="New Session"
                    icon={iconReceive}
                    onPress={onNewSession}
                  />
                </styled.NewSession>
              </styled.CardBoard>
            </Shadow>
          </styled.Card>

          <styled.Card
            style={{ marginTop: 20 }}
          >
            <Shadow
              heightAndroid={giftBoxHeight}
              heightIOS={giftBoxHeight}
              widthIOS={width - 80}
              shadowRadius={6}
              shadowDistance={0}
              shadowSpread={10}
              shadowOffsetX={0}
              shadowOffsetY={1}
              shadowColorOS={baseColors.mediumLightGray}
              shadowBorder={8}
            >
              <styled.GiftCard>
                <styled.GiftLabel>
                  Invite your friends to Pillar and you both will earn 100 PLR
                </styled.GiftLabel>
              </styled.GiftCard>
            </Shadow>
          </styled.Card>
        </styled.CardContainer>

        <FlatList
          data={meSettingsItems(props)}
          renderItem={({ item: { key, title, onPress } }) => (
            <SettingsListItem
              key={key}
              label={title}
              onPress={onPress}
            />
          )}
          keyboardShouldPersistTaps="handled"
        />
      </ScrollWrapper>
    </Container>
  );
};

export default MeScene;
