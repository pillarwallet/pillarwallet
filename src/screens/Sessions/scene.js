// @flow

import React from 'react';
import map from 'lodash.map';
import Header from 'components/Header';
import { Container, ScrollWrapper } from 'components/Layout';
import ButtonText from 'components/ButtonText';
import { baseColors } from 'utils/variables';
import * as styled from './styles';

type Props = {
  sessionTitle: string,
  openSessions?: Array,
  sessionsHistory?: Array,
  onBack: Function,
  onTerminateSessions: Function,
  onRevokeAccessFor: Function,
};

type SessionProps = {
  noRevoke?: ?boolean,
  id: string,
  name: string,
  date: string,
  onRevokeAccessFor: Function,
};

const SessionDetail = (props: SessionProps) => {
  const { noRevoke, id, name, date, onRevokeAccessFor } = props;
  return (
    <styled.SessionDetail>
      <styled.SessionDevice>
        {name}
      </styled.SessionDevice>
      <styled.SessionDate>
        {date}
      </styled.SessionDate>
      {!noRevoke &&
        <ButtonText
          buttonText="Revoke access"
          onPress={() => onRevokeAccessFor(id)}
        />
      }
    </styled.SessionDetail>
  );
};

const PersonasScene = (props: Props) => {
  const {
    onBack,
    onTerminateSessions,
    onRevokeAccessFor,
    sessionTitle,
    openSessions = [],
    sessionsHistory = [],
  } = props;

  return (
    <Container>
      <Header
        centerTitle
        title={sessionTitle}
        onBack={onBack}
        style={{ marginTop: 28 }}
      />

      <styled.MainContainer>
        <ScrollWrapper
          color={baseColors.lightGray}
          style={{
            height: '100%',
          }}
        >
          <styled.OpenSessions>
            <styled.SessionsInfo>
              <styled.SessionsTitle>
                OPEN SESSIONS
              </styled.SessionsTitle>

              {map(openSessions, ({ id, name, lastActiveDate }) => (
                <SessionDetail
                  key={`session-detail-${id}`}
                  id={id}
                  name={name}
                  date={lastActiveDate}
                  onRevokeAccessFor={onRevokeAccessFor}
                />
              ))}
            </styled.SessionsInfo>
            <styled.TerminateSessions>
              <ButtonText
                buttonText="Terminate all sessions"
                color={baseColors.burningFire}
                onPress={onTerminateSessions}
              />
            </styled.TerminateSessions>
          </styled.OpenSessions>

          <styled.HistorySession>
            <styled.SessionsTitle>
              SESSION HISTORY
            </styled.SessionsTitle>
            {map(sessionsHistory, ({
              id,
              name,
              fromActiveDate,
              lastActiveDate,
            }) => (
              <SessionDetail
                noRevoke
                key={`session-history-${id}`}
                id={id}
                name={name}
                date={`${fromActiveDate} - ${lastActiveDate}`}
              />
            ))}
          </styled.HistorySession>
        </ScrollWrapper>
      </styled.MainContainer>
    </Container>
  );
};

export default PersonasScene;
