/**
 * Lists 2fa devices + password change form
 */
import {Box, Flex} from 'grid-emotion';
import React from 'react';
import styled from 'react-emotion';
import PropTypes from 'prop-types';

import {addErrorMessage} from 'app/actionCreators/indicator';
import {t} from 'app/locale';
import AsyncView from 'app/views/asyncView';
import Button from 'app/components/buttons/button';
import CircleIndicator from 'app/components/circleIndicator';
import EmptyMessage from 'app/views/settings/components/emptyMessage';
import {Panel, PanelBody, PanelHeader, PanelItem} from 'app/components/panels';
import SettingsPageHeader from 'app/views/settings/components/settingsPageHeader';
import TextBlock from 'app/views/settings/components/text/textBlock';
import TwoFactorRequired from 'app/views/settings/account/accountSecurity/components/twoFactorRequired';
import RemoveConfirm from 'app/views/settings/account/accountSecurity/components/removeConfirm';
import PasswordForm from 'app/views/settings/account/passwordForm';

const ENDPOINT = '/users/me/authenticators/';

const AuthenticatorName = styled.span`
  font-size: 1.2em;
`;

class AccountSecurity extends AsyncView {
  static PropTypes = {
    authenticators: PropTypes.arrayOf(PropTypes.object).isRequired,
    orgsRequire2fa: PropTypes.arrayOf(PropTypes.string).isRequired,
    countEnrolled: PropTypes.number.isRequired,
    deleteDisabled: PropTypes.bool.isRequired,
  };
  getTitle() {
    return t('Security');
  }

  handleDisable = auth => {
    if (!auth || !auth.authId) return;

    this.setState(
      {
        loading: true,
      },
      () =>
        this.api
          .requestPromise(`${ENDPOINT}${auth.authId}/`, {
            method: 'DELETE',
          })
          .then(this.props.remountParent, () => {
            this.setState({loading: false});
            addErrorMessage(t('Error disabling', auth.name));
          })
    );
  };

  renderBody() {
    let {authenticators, orgsRequire2fa, countEnrolled, deleteDisabled} = this.props;
    let isEmpty = !authenticators.length;

    return (
      <div>
        <SettingsPageHeader title="Security" />

        {!isEmpty &&
          countEnrolled == 0 && <TwoFactorRequired orgsRequire2fa={orgsRequire2fa} />}

        <PasswordForm />

        <Panel>
          <PanelHeader>
            <Box>{t('Two-Factor Authentication')}</Box>
          </PanelHeader>

          {isEmpty && (
            <EmptyMessage>{t('No available authenticators to add')}</EmptyMessage>
          )}

          <PanelBody>
            {!isEmpty &&
              authenticators.map(auth => {
                let {
                  id,
                  authId,
                  description,
                  isBackupInterface,
                  isEnrolled,
                  configureButton,
                  name,
                } = auth;
                return (
                  <PanelItem key={id} p={0} direction="column">
                    <Flex flex="1" p={2} align="center">
                      <Box flex="1">
                        <CircleIndicator css={{marginRight: 6}} enabled={isEnrolled} />
                        <AuthenticatorName>{name}</AuthenticatorName>
                      </Box>

                      {!isBackupInterface &&
                        !isEnrolled && (
                          <Button
                            to={`/settings/account/security/${id}/enroll/`}
                            size="small"
                            priority="primary"
                          >
                            {t('Add')}
                          </Button>
                        )}

                      {isEnrolled &&
                        authId && (
                          <Button
                            to={`/settings/account/security/${authId}/`}
                            size="small"
                          >
                            {configureButton}
                          </Button>
                        )}

                      {!isBackupInterface &&
                        isEnrolled && (
                          <RemoveConfirm
                            onConfirm={() => this.handleDisable(auth)}
                            disabled={deleteDisabled}
                          >
                            <Button css={{marginLeft: 6}} size="small">
                              <span className="icon icon-trash" />
                            </Button>
                          </RemoveConfirm>
                        )}

                      {isBackupInterface && !isEnrolled ? t('requires 2FA') : null}
                    </Flex>

                    <Box p={2} pt={0}>
                      <TextBlock css={{marginBottom: 0}}>{description}</TextBlock>
                    </Box>
                  </PanelItem>
                );
              })}
          </PanelBody>
        </Panel>
      </div>
    );
  }
}

export default AccountSecurity;
