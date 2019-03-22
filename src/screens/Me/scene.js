// @flow

import React from 'react';
import { Dimensions, FlatList, Alert } from 'react-native';
import capitalize from 'lodash.capitalize';
import Header from 'components/Header';
import ProfileImage from 'components/ProfileImage/ProfileImage';
import SettingsListItem from 'components/SettingsListItem';
import CircleButton from 'components/CircleButton';
import { Container, ScrollWrapper } from 'components/Layout';
import { BaseText } from 'components/Typography';
import { Shadow } from 'components/Shadow';
import { baseColors } from 'utils/variables';
import * as styled from './styles';

const iconReceive = require('assets/icons/icon_receive.png');

type Props = {
  onSwitchPersona: Function,
};

const MeSettingsItems = (isPremium) => {
  const premiumItem = isPremium ? {
      key: 'manageSmartContract',
      title: 'Manage smart contract',
      onPress: () => Alert.alert('manage smart contract'),
  } : {
      key: 'activatePremium',
      title: 'Upgrade to Premium',
      onPress: () => Alert.alert('activate premium'),
  };

  return [
    premiumItem,
    {
      key: 'manageDetailsSessions',
      title: 'Manage details / sessions',
      onPress: () => Alert.alert('manage details'),
    },
    {
      key: 'associatedDIDs',
      title: 'Associated DIDs',
      onPress: () => Alert.alert('associated DIDs'),
    },
    {
      key: 'permissions',
      title: 'Permissions',
      onPress: () => Alert.alert('permissions'),
    },
  ];
};

const MeScene = (props: Props) => {
  const { onSwitchPersona, onNewSession, profile } = props;
  const height = 330;
  const { width } = Dimensions.get('window');

  const { username, profileUri, activePersona, isPremium } = profile;

  return (
    <Container>
      <Header
        headerRightFlex="2"
        title="me"
        nextText="Switch persona"
        onNextPress={onSwitchPersona}
        style={{
          borderBottomWidth: 1,
          borderBottomColor: baseColors.mediumLightGray,
        }}
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
        </styled.CardContainer>

        <FlatList
          data={MeSettingsItems(isPremium)}
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
