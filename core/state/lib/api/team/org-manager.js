/**
 * Org Manager - Orchestrates organization management operations
 *
 * This module re-exports functionality from specialized sub-modules:
 * - org-query-manager.js: Organization query operations
 * - org-crud-manager.js: Organization CRUD operations
 * - org-member-manager.js: Organization member management operations
 * - org-resource-manager.js: Organization resource and notification operations
 */

const { getOrgs, getOrg, getOrgMembers, getOrgInvitableUsers } = require('./org-query-manager');
const {
  issueOrgOwnerPassport,
  createOrg,
  createDefaultOrgForUser,
  updateOrg,
  deleteOrg,
} = require('./org-crud-manager');
const {
  addOrgMember,
  updateOrgMember,
  sendInvitationNotification,
  getFederatedMasterBlockletInfo,
  inviteMembersToOrg,
  removeOrgMember,
} = require('./org-member-manager');
const {
  getOrgResource,
  addOrgResource,
  removeOrgResource,
  migrateOrgResource,
  getNotificationStats,
} = require('./org-resource-manager');

module.exports = {
  getOrgs,
  getOrg,
  createDefaultOrgForUser,
  issueOrgOwnerPassport,
  createOrg,
  updateOrg,
  deleteOrg,
  addOrgMember,
  updateOrgMember,
  sendInvitationNotification,
  getFederatedMasterBlockletInfo,
  inviteMembersToOrg,
  removeOrgMember,
  getOrgMembers,
  getOrgInvitableUsers,
  getOrgResource,
  addOrgResource,
  removeOrgResource,
  migrateOrgResource,
  getNotificationStats,
};
