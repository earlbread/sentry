from __future__ import absolute_import

from sentry.models import Group, GroupStatus, Integration, GroupLink, ExternalIssue
from sentry.testutils import TestCase


class IssueSyncIntegration(TestCase):
    def test_status_sync_inbound_resolve(self):
        group = self.group
        assert group.status == GroupStatus.UNRESOLVED

        integration = Integration.objects.create(
            provider='example',
            external_id='123456',
        )
        integration.add_organization(group.organization.id)

        external_issue = ExternalIssue.objects.create(
            organization_id=group.organization.id,
            integration_id=integration.id,
            key='APP-123',
        )

        GroupLink.objects.create(
            group_id=group.id,
            project_id=group.project_id,
            linked_type=GroupLink.LinkedType.issue,
            linked_id=external_issue.id,
            relationship=GroupLink.Relationship.references,
        )

        installation = integration.get_installation(group.organization.id)

        installation.sync_status_inbound(external_issue.key, {
            'project_id': 'APP',
            'status': {
                'id': '12345',
                'category': 'done',
            },
        })

        assert Group.objects.get(id=group.id).status == GroupStatus.RESOLVED

    def test_status_sync_inbound_unresolve(self):
        group = self.group
        group.status = GroupStatus.RESOLVED
        group.save()
        assert group.status == GroupStatus.RESOLVED

        integration = Integration.objects.create(
            provider='example',
            external_id='123456',
        )
        integration.add_organization(group.organization.id)

        external_issue = ExternalIssue.objects.create(
            organization_id=group.organization.id,
            integration_id=integration.id,
            key='APP-123',
        )

        GroupLink.objects.create(
            group_id=group.id,
            project_id=group.project_id,
            linked_type=GroupLink.LinkedType.issue,
            linked_id=external_issue.id,
            relationship=GroupLink.Relationship.references,
        )

        installation = integration.get_installation(group.organization.id)

        installation.sync_status_inbound(external_issue.key, {
            'project_id': 'APP',
            'status': {
                'id': '12345',
                'category': 'in_progress',
            },
        })

        assert Group.objects.get(id=group.id).status == GroupStatus.UNRESOLVED
