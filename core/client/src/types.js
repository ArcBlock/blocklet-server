/**
 * List all query method names
 *
 * @name ABTNodeClient#getQueries
 * @function
 * @memberof ABTNodeClient
 * @returns {Array<string>} method name list
 * @example
 * const methods = client.getQueries();
 * // list of query methods
 * // [
 * //   getBlocklet,
 * //   getBlockletMetaFromUrl,
 * //   getBlockletDiff,
 * //   getBlocklets,
 * //   getBlockletRuntimeHistory,
 * //   getBlockletsFromBackup,
 * //   getDynamicComponents,
 * //   getNodeInfo,
 * //   resetNodeStatus,
 * //   getNodeEnv,
 * //   checkNodeVersion,
 * //   getDelegationState,
 * //   getNodeRuntimeHistory,
 * //   getBlockletMeta,
 * //   getNotifications,
 * //   makeAllNotificationsAsRead,
 * //   getNotificationSendLog,
 * //   getReceivers,
 * //   getNotificationComponents,
 * //   resendNotification,
 * //   getRoutingSites,
 * //   getRoutingProviders,
 * //   isDidDomain,
 * //   getCertificates,
 * //   checkDomains,
 * //   findCertificateByDomain,
 * //   getAccessKeys,
 * //   getAccessKey,
 * //   getWebHooks,
 * //   getWebhookSenders,
 * //   sendTestMessage,
 * //   getSession,
 * //   getRoles,
 * //   getRole,
 * //   getPermissions,
 * //   getInvitations,
 * //   getUsers,
 * //   getUser,
 * //   getUserSessions,
 * //   getUserSessionsCount,
 * //   getUsersCount,
 * //   getUsersCountPerRole,
 * //   getOwner,
 * //   getPermissionsByRole,
 * //   getPassportIssuances,
 * //   logoutUser,
 * //   destroySelf,
 * //   getUserFollowers,
 * //   getUserFollowing,
 * //   getUserFollowStats,
 * //   checkFollowing,
 * //   followUser,
 * //   unfollowUser,
 * //   getUserInvites,
 * //   getTags,
 * //   getAuditLogs,
 * //   getLauncherSession,
 * //   getBlockletBackups,
 * //   getBlockletBackupSummary,
 * //   getBlockletSpaceGateways,
 * //   getTrafficInsights,
 * //   getProjects,
 * //   getProject,
 * //   getReleases,
 * //   getRelease,
 * //   getSelectedResources,
 * //   getBlockletSecurityRule,
 * //   getBlockletSecurityRules,
 * //   getBlockletResponseHeaderPolicy,
 * //   getBlockletResponseHeaderPolicies,
 * //   getBlockletAccessPolicy,
 * //   getBlockletAccessPolicies,
 * //   getWebhookEndpoints,
 * //   getWebhookEndpoint,
 * //   getWebhookAttempts,
 * //   getPassportRoleCounts,
 * //   getPassportsByRole,
 * //   getPassportLogs,
 * //   getRelatedPassports,
 * //   getBlockletBaseInfo,
 * //   getDomainDNS,
 * //   getOAuthClients,
 * //   createOAuthClient,
 * //   updateOAuthClient,
 * //   deleteOAuthClient,
 * //   getOrgs,
 * //   getOrg,
 * //   getOrgMembers,
 * //   getOrgInvitableUsers,
 * //   getOrgResource,
 * // ]
 */

/**
 * List all mutation method names
 *
 * @name ABTNodeClient#getMutations
 * @function
 * @memberof ABTNodeClient
 * @returns {Array<string>} method name list
 * @example
 * const methods = client.getMutations();
 * // list of mutation methods
 * // [
 * //   installBlocklet,
 * //   installComponent,
 * //   startBlocklet,
 * //   stopBlocklet,
 * //   reloadBlocklet,
 * //   restartBlocklet,
 * //   deleteBlocklet,
 * //   deleteComponent,
 * //   cancelDownloadBlocklet,
 * //   checkComponentsForUpdates,
 * //   upgradeComponents,
 * //   configBlocklet,
 * //   configPublicToStore,
 * //   configNavigations,
 * //   configAuthentication,
 * //   configDidConnect,
 * //   configDidConnectActions,
 * //   configNotification,
 * //   configVault,
 * //   sendEmail,
 * //   sendPush,
 * //   joinFederatedLogin,
 * //   quitFederatedLogin,
 * //   disbandFederatedLogin,
 * //   syncMasterAuthorization,
 * //   syncFederatedConfig,
 * //   auditFederatedLogin,
 * //   updateAppSessionConfig,
 * //   updateComponentTitle,
 * //   updateComponentMountPoint,
 * //   backupBlocklet,
 * //   abortBlockletBackup,
 * //   restoreBlocklet,
 * //   migrateApplicationToStructV2,
 * //   launchBlockletByLauncher,
 * //   launchBlockletWithoutWallet,
 * //   addBlockletSpaceGateway,
 * //   deleteBlockletSpaceGateway,
 * //   updateBlockletSpaceGateway,
 * //   updateAutoBackup,
 * //   updateAutoCheckUpdate,
 * //   updateBlockletSettings,
 * //   updateNodeInfo,
 * //   upgradeNodeVersion,
 * //   restartServer,
 * //   resetNode,
 * //   rotateSessionKey,
 * //   updateGateway,
 * //   clearCache,
 * //   createMemberInvitation,
 * //   createTransferInvitation,
 * //   deleteInvitation,
 * //   createPassportIssuance,
 * //   deletePassportIssuance,
 * //   configTrustedPassports,
 * //   configTrustedFactories,
 * //   configPassportIssuance,
 * //   removeUser,
 * //   updateUserTags,
 * //   updateUserExtra,
 * //   updateUserApproval,
 * //   issuePassportToUser,
 * //   revokeUserPassport,
 * //   enableUserPassport,
 * //   removeUserPassport,
 * //   switchProfile,
 * //   updateUserAddress,
 * //   updateUserInfo,
 * //   createRole,
 * //   updateRole,
 * //   deleteRole,
 * //   createPermission,
 * //   updatePermission,
 * //   deletePermission,
 * //   grantPermissionForRole,
 * //   revokePermissionFromRole,
 * //   updatePermissionsForRole,
 * //   hasPermission,
 * //   addBlockletStore,
 * //   deleteBlockletStore,
 * //   getTag,
 * //   createTag,
 * //   updateTag,
 * //   deleteTag,
 * //   createTagging,
 * //   deleteTagging,
 * //   readNotifications,
 * //   unreadNotifications,
 * //   addRoutingSite,
 * //   addDomainAlias,
 * //   deleteDomainAlias,
 * //   deleteRoutingSite,
 * //   updateRoutingSite,
 * //   addRoutingRule,
 * //   updateRoutingRule,
 * //   deleteRoutingRule,
 * //   updateCertificate,
 * //   addCertificate,
 * //   deleteCertificate,
 * //   issueLetsEncryptCert,
 * //   createAccessKey,
 * //   updateAccessKey,
 * //   deleteAccessKey,
 * //   verifyAccessKey,
 * //   createWebHook,
 * //   deleteWebHook,
 * //   updateWebHookState,
 * //   createProject,
 * //   updateProject,
 * //   deleteProject,
 * //   createRelease,
 * //   deleteRelease,
 * //   updateSelectedResources,
 * //   connectToStore,
 * //   disconnectFromStore,
 * //   publishToStore,
 * //   connectByStudio,
 * //   addBlockletSecurityRule,
 * //   updateBlockletSecurityRule,
 * //   deleteBlockletSecurityRule,
 * //   addBlockletResponseHeaderPolicy,
 * //   updateBlockletResponseHeaderPolicy,
 * //   deleteBlockletResponseHeaderPolicy,
 * //   addBlockletAccessPolicy,
 * //   updateBlockletAccessPolicy,
 * //   deleteBlockletAccessPolicy,
 * //   restartAllContainers,
 * //   createWebhookEndpoint,
 * //   updateWebhookEndpoint,
 * //   deleteWebhookEndpoint,
 * //   retryWebhookAttempt,
 * //   regenerateWebhookEndpointSecret,
 * //   addUploadEndpoint,
 * //   deleteUploadEndpoint,
 * //   connectToEndpoint,
 * //   disconnectFromEndpoint,
 * //   publishToEndpoint,
 * //   connectToAigne,
 * //   disconnectToAigne,
 * //   verifyAigneConnection,
 * //   createOrg,
 * //   updateOrg,
 * //   deleteOrg,
 * //   addOrgMember,
 * //   removeOrgMember,
 * //   inviteMembersToOrg,
 * //   addOrgResource,
 * //   migrateOrgResource,
 * // ]
 */

/**
 * List all subscription method names
 *
 * @name ABTNodeClient#getSubscription
 * @function
 * @memberof ABTNodeClient
 * @returns {Array<string>} method name list
 * @example
 * const methods = client.getSubscriptions();
 * // list of subscription methods
 * // [

 * // ]
 */

/**
 * Send raw graphql query to token swap service
 *
 * @name ABTNodeClient#doRawQuery
 * @function
 * @memberof ABTNodeClient
 * @param {string} query - graphql query string
 * @returns {Promise} usually axios response data
 * @example
 * const res = await client.doRawQuery('
 *   getChainInfo {
 *     code
 *     info {
 *       address
 *       blockHeight
 *     }
 *   }
 * ');
 *
 * // Then
 * // res.getChainInfo.code
 * // res.getChainInfo.info
 */

/**
 * Send raw graphql subscription to forge graphql endpoint
 *
 * @name ABTNodeClient#doRawSubscription
 * @function
 * @memberof ABTNodeClient
 * @param {string} query - graphql query string
 * @returns {Promise} usually axios response data
 */

/**
 * Structure of ABTNodeClient.TxEncodeOutput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.TxEncodeOutput
 * @property {object} object - the transaction object, human readable
 * @property {buffer} buffer - the transaction binary presentation, can be used to signing, encoding to other formats
 */

/**
 * Structure of ABTNodeClient.AigneConfigInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.AigneConfigInput
 * @property {string} provider
 * @property {string} model
 * @property {string} key
 * @property {string} url
 * @property {string} accessKeyId
 * @property {string} secretAccessKey
 * @property {string} validationResult
 */

/**
 * Structure of ABTNodeClient.AutoBackupInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.AutoBackupInput
 * @property {boolean} enabled
 */

/**
 * Structure of ABTNodeClient.AutoBlockPolicyInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.AutoBlockPolicyInput
 * @property {boolean} enabled
 * @property {number} windowSize
 * @property {number} windowQuota
 * @property {number} blockDuration
 * @property {Array<...ABTNodeClient.null>} statusCodes
 */

/**
 * Structure of ABTNodeClient.AutoCheckUpdateInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.AutoCheckUpdateInput
 * @property {boolean} enabled
 */

/**
 * Structure of ABTNodeClient.BaseUserInfoInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.BaseUserInfoInput
 * @property {string} did
 * @property {string} pk
 * @property {string} role
 * @property {string} avatar
 * @property {string} fullName
 * @property {string} email
 * @property {boolean} approved
 * @property {number} createdAt
 * @property {number} updatedAt
 * @property {string} locale
 */

/**
 * Structure of ABTNodeClient.BlockPolicyInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.BlockPolicyInput
 * @property {boolean} enabled
 * @property {Array<...ABTNodeClient.null>} blacklist
 * @property {...ABTNodeClient.AutoBlockPolicyInput} autoBlocking
 */

/**
 * Structure of ABTNodeClient.BlockletAccessPolicyInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.BlockletAccessPolicyInput
 * @property {string} id
 * @property {string} name
 * @property {string} description
 * @property {any} roles
 * @property {boolean} reverse
 * @property {boolean} isProtected
 */

/**
 * Structure of ABTNodeClient.BlockletAccessPolicyQueryInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.BlockletAccessPolicyQueryInput
 * @property {string} search
 */

/**
 * Structure of ABTNodeClient.BlockletDistInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.BlockletDistInput
 * @property {string} tarball
 * @property {string} integrity
 */

/**
 * Structure of ABTNodeClient.BlockletDockerInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.BlockletDockerInput
 * @property {string} dockerImage
 * @property {Array<...ABTNodeClient.null>} dockerArgs
 * @property {Array<...ABTNodeClient.null>} dockerEnvs
 * @property {string} dockerCommand
 */

/**
 * Structure of ABTNodeClient.BlockletGatewayInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.BlockletGatewayInput
 * @property {...ABTNodeClient.RequestLimitInput} requestLimit
 * @property {...ABTNodeClient.BlockPolicyInput} blockPolicy
 * @property {...ABTNodeClient.ProxyPolicyInput} proxyPolicy
 * @property {boolean} cacheEnabled
 * @property {...ABTNodeClient.WAFPolicyInput} wafPolicy
 * @property {string} teamDid
 */

/**
 * Structure of ABTNodeClient.BlockletResponseHeaderPolicyInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.BlockletResponseHeaderPolicyInput
 * @property {string} id
 * @property {string} name
 * @property {string} description
 * @property {string} securityHeader
 * @property {string} cors
 * @property {string} customHeader
 * @property {string} removeHeader
 * @property {boolean} isProtected
 */

/**
 * Structure of ABTNodeClient.BlockletResponseHeaderPolicyQueryInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.BlockletResponseHeaderPolicyQueryInput
 * @property {string} search
 */

/**
 * Structure of ABTNodeClient.BlockletSecurityRuleInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.BlockletSecurityRuleInput
 * @property {string} id
 * @property {string} pathPattern
 * @property {string} componentDid
 * @property {number} priority
 * @property {string} responseHeaderPolicyId
 * @property {string} accessPolicyId
 * @property {boolean} enabled
 * @property {string} remark
 * @property {...ABTNodeClient.BlockletAccessPolicyInput} accessPolicy
 * @property {...ABTNodeClient.BlockletResponseHeaderPolicyInput} responseHeaderPolicy
 */

/**
 * Structure of ABTNodeClient.BlockletSecurityRuleQueryInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.BlockletSecurityRuleQueryInput
 * @property {string} search
 */

/**
 * Structure of ABTNodeClient.BlockletStoreInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.BlockletStoreInput
 * @property {string} name
 * @property {string} description
 * @property {string} url
 * @property {string} logoUrl
 * @property {string} maintainer
 * @property {string} cdnUrl
 * @property {boolean} protected
 * @property {string} id
 * @property {string} scope
 */

/**
 * Structure of ABTNodeClient.ConfigEntryInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.ConfigEntryInput
 * @property {string} key
 * @property {string} value
 * @property {boolean} required
 * @property {string} description
 * @property {string} validation
 * @property {boolean} secure
 * @property {boolean} custom
 * @property {boolean} shared
 */

/**
 * Structure of ABTNodeClient.ConfigNavigationInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.ConfigNavigationInput
 * @property {string} id
 * @property {string} title
 * @property {string} link
 * @property {string} icon
 * @property {string} section
 * @property {string} component
 * @property {string} parent
 * @property {string} role
 * @property {boolean} visible
 * @property {string} from
 * @property {string} activeIcon
 * @property {string} color
 * @property {string} activeColor
 * @property {string} description
 * @property {boolean} private
 */

/**
 * Structure of ABTNodeClient.ConnectedAccountInfoInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.ConnectedAccountInfoInput
 * @property {string} name
 * @property {string} picture
 * @property {string} email
 * @property {boolean} emailVerified
 * @property {string} sub
 * @property {any} extraData
 */

/**
 * Structure of ABTNodeClient.ConnectedAccountInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.ConnectedAccountInput
 * @property {string} provider
 * @property {string} did
 * @property {string} pk
 * @property {string} id
 * @property {number} lastLoginAt
 * @property {...ABTNodeClient.ConnectedAccountInfoInput} userInfo
 * @property {any} extra
 */

/**
 * Structure of ABTNodeClient.DockerEnvKeyValuePairInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.DockerEnvKeyValuePairInput
 * @property {string} key
 * @property {string} value
 * @property {string} description
 * @property {boolean} secure
 * @property {boolean} shared
 * @property {boolean} required
 * @property {string} custom
 */

/**
 * Structure of ABTNodeClient.DockerRunKeyValuePairInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.DockerRunKeyValuePairInput
 * @property {string} key
 * @property {string} value
 * @property {string} path
 * @property {string} type
 * @property {string} name
 * @property {string} prefix
 * @property {string} protocol
 * @property {string} proxyBehavior
 */

/**
 * Structure of ABTNodeClient.DownloadTokenInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.DownloadTokenInput
 * @property {string} did
 * @property {string} token
 */

/**
 * Structure of ABTNodeClient.EnableEventInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.EnableEventInput
 * @property {string} type
 * @property {string} source
 */

/**
 * Structure of ABTNodeClient.GatewayInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.GatewayInput
 * @property {...ABTNodeClient.RequestLimitInput} requestLimit
 * @property {...ABTNodeClient.BlockPolicyInput} blockPolicy
 * @property {...ABTNodeClient.ProxyPolicyInput} proxyPolicy
 * @property {boolean} cacheEnabled
 * @property {...ABTNodeClient.WAFPolicyInput} wafPolicy
 */

/**
 * Structure of ABTNodeClient.HashFileInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.HashFileInput
 * @property {string} file
 * @property {string} hash
 */

/**
 * Structure of ABTNodeClient.InviteSettingsInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.InviteSettingsInput
 * @property {boolean} enabled
 */

/**
 * Structure of ABTNodeClient.IssuerInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.IssuerInput
 * @property {string} id
 * @property {string} name
 * @property {string} pk
 */

/**
 * Structure of ABTNodeClient.LoginEmailSettingsInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.LoginEmailSettingsInput
 * @property {boolean} enabled
 * @property {boolean} requireVerified
 * @property {boolean} requireUnique
 * @property {boolean} trustOauthProviders
 * @property {boolean} enableDomainBlackList
 * @property {Array<...ABTNodeClient.null>} domainBlackList
 * @property {boolean} enableDomainWhiteList
 * @property {Array<...ABTNodeClient.null>} domainWhiteList
 * @property {Array<...ABTNodeClient.null>} trustedIssuers
 */

/**
 * Structure of ABTNodeClient.LoginPhoneSettingsInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.LoginPhoneSettingsInput
 * @property {boolean} enabled
 * @property {boolean} requireVerified
 * @property {boolean} requireUnique
 * @property {Array<...ABTNodeClient.null>} trustedIssuers
 * @property {boolean} enableRegionBlackList
 * @property {Array<...ABTNodeClient.null>} regionBlackList
 * @property {boolean} enableRegionWhiteList
 * @property {Array<...ABTNodeClient.null>} regionWhiteList
 */

/**
 * Structure of ABTNodeClient.NodeInfoInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.NodeInfoInput
 * @property {string} name
 * @property {string} description
 * @property {boolean} autoUpgrade
 * @property {boolean} enableWelcomePage
 * @property {string} registerUrl
 * @property {string} webWalletUrl
 * @property {Array<...ABTNodeClient.null>} blockletRegistryList
 * @property {number} diskAlertThreshold
 * @property {boolean} enableBetaRelease
 * @property {string} nftDomainUrl
 * @property {boolean} enableFileSystemIsolation
 * @property {boolean} enableDocker
 * @property {boolean} isDockerInstalled
 * @property {boolean} enableDockerNetwork
 * @property {boolean} enableSessionHardening
 */

/**
 * Structure of ABTNodeClient.OauthClientInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.OauthClientInput
 * @property {Array<...ABTNodeClient.null>} redirectUris
 * @property {string} tokenEndpointAuthMethod
 * @property {Array<...ABTNodeClient.null>} grantTypes
 * @property {Array<...ABTNodeClient.null>} responseTypes
 * @property {string} clientName
 * @property {string} clientUri
 * @property {string} logoUri
 * @property {string} scope
 * @property {Array<...ABTNodeClient.null>} contacts
 * @property {string} tosUri
 * @property {string} policyUri
 * @property {string} jwksUri
 * @property {string} jwks
 * @property {string} softwareId
 * @property {string} softwareVersion
 * @property {string} clientId
 * @property {number} clientIdIssuedAt
 * @property {string} clientSecret
 * @property {number} clientSecretExpiresAt
 * @property {number} updatedAt
 * @property {string} createdBy
 * @property {...ABTNodeClient.UserInfoInput} createUser
 */

/**
 * Structure of ABTNodeClient.OrgInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.OrgInput
 * @property {string} id
 * @property {string} name
 * @property {string} description
 * @property {string} ownerDid
 * @property {number} createdAt
 * @property {number} updatedAt
 * @property {Array<...ABTNodeClient.null>} members
 * @property {...ABTNodeClient.UserInfoInput} owner
 * @property {number} membersCount
 * @property {Array<...ABTNodeClient.null>} passports
 * @property {any} metadata
 * @property {string} avatar
 */

/**
 * Structure of ABTNodeClient.OrgSettingsInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.OrgSettingsInput
 * @property {boolean} enabled
 * @property {number} maxMemberPerOrg
 * @property {number} maxOrgPerUser
 */

/**
 * Structure of ABTNodeClient.PagingInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.PagingInput
 * @property {number} total
 * @property {number} pageSize
 * @property {number} pageCount
 * @property {number} page
 */

/**
 * Structure of ABTNodeClient.PassportDisplayInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.PassportDisplayInput
 * @property {string} type
 * @property {string} content
 */

/**
 * Structure of ABTNodeClient.PassportInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.PassportInput
 * @property {string} id
 * @property {string} name
 * @property {string} title
 * @property {...ABTNodeClient.IssuerInput} issuer
 * @property {Array<...ABTNodeClient.null>} type
 * @property {number} issuanceDate
 * @property {number} expirationDate
 * @property {string} status
 * @property {string} role
 * @property {number} lastLoginAt
 * @property {string} scope
 * @property {...ABTNodeClient.PassportDisplayInput} display
 * @property {string} source
 * @property {string} parentDid
 * @property {string} userDid
 * @property {...ABTNodeClient.BaseUserInfoInput} user
 */

/**
 * Structure of ABTNodeClient.PassportLogQueryInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.PassportLogQueryInput
 * @property {string} passportId
 */

/**
 * Structure of ABTNodeClient.PassportQueryInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.PassportQueryInput
 * @property {string} role
 * @property {string} search
 * @property {string} status
 */

/**
 * Structure of ABTNodeClient.PermissionInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.PermissionInput
 * @property {string} name
 * @property {string} description
 * @property {boolean} isProtected
 */

/**
 * Structure of ABTNodeClient.ProxyPolicyInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.ProxyPolicyInput
 * @property {boolean} enabled
 * @property {boolean} trustRecursive
 * @property {Array<...ABTNodeClient.null>} trustedProxies
 * @property {string} realIpHeader
 */

/**
 * Structure of ABTNodeClient.QueryUserFollowOptionsInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.QueryUserFollowOptionsInput
 * @property {boolean} includeUserInfo
 * @property {boolean} includeFollowStatus
 */

/**
 * Structure of ABTNodeClient.QueryUserFollowStateOptionsInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.QueryUserFollowStateOptionsInput
 * @property {boolean} includeFollowing
 * @property {boolean} includeFollowers
 * @property {boolean} includeInvitees
 */

/**
 * Structure of ABTNodeClient.RequestAbortBlockletBackupInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestAbortBlockletBackupInput
 * @property {string} appPid
 */

/**
 * Structure of ABTNodeClient.RequestAccessKeyInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestAccessKeyInput
 * @property {string} teamDid
 * @property {string} accessKeyId
 */

/**
 * Structure of ABTNodeClient.RequestAccessKeysInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestAccessKeysInput
 * @property {string} teamDid
 * @property {...ABTNodeClient.PagingInput} paging
 * @property {string} remark
 * @property {string} componentDid
 * @property {string} resourceType
 * @property {string} resourceId
 */

/**
 * Structure of ABTNodeClient.RequestAddBlockletAccessPolicyInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestAddBlockletAccessPolicyInput
 * @property {string} did
 * @property {...ABTNodeClient.BlockletAccessPolicyInput} data
 */

/**
 * Structure of ABTNodeClient.RequestAddBlockletResponseHeaderPolicyInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestAddBlockletResponseHeaderPolicyInput
 * @property {string} did
 * @property {...ABTNodeClient.BlockletResponseHeaderPolicyInput} data
 */

/**
 * Structure of ABTNodeClient.RequestAddBlockletSecurityRuleInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestAddBlockletSecurityRuleInput
 * @property {string} did
 * @property {...ABTNodeClient.BlockletSecurityRuleInput} data
 */

/**
 * Structure of ABTNodeClient.RequestAddBlockletSpaceGatewayInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestAddBlockletSpaceGatewayInput
 * @property {string} did
 * @property {...ABTNodeClient.SpaceGatewayInput} spaceGateway
 */

/**
 * Structure of ABTNodeClient.RequestAddBlockletStoreInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestAddBlockletStoreInput
 * @property {string} teamDid
 * @property {string} url
 * @property {string} scope
 */

/**
 * Structure of ABTNodeClient.RequestAddDomainAliasInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestAddDomainAliasInput
 * @property {string} id
 * @property {string} domainAlias
 * @property {boolean} force
 * @property {string} teamDid
 * @property {string} type
 * @property {string} nftDid
 * @property {string} chainHost
 * @property {boolean} inBlockletSetup
 * @property {string} metadata
 */

/**
 * Structure of ABTNodeClient.RequestAddLetsEncryptCertInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestAddLetsEncryptCertInput
 * @property {string} domain
 * @property {string} did
 * @property {string} siteId
 * @property {boolean} inBlockletSetup
 */

/**
 * Structure of ABTNodeClient.RequestAddNginxHttpsCertInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestAddNginxHttpsCertInput
 * @property {string} name
 * @property {string} privateKey
 * @property {string} certificate
 */

/**
 * Structure of ABTNodeClient.RequestAddOrgResourceInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestAddOrgResourceInput
 * @property {string} teamDid
 * @property {string} orgId
 * @property {Array<...ABTNodeClient.null>} resourceIds
 * @property {string} type
 * @property {any} metadata
 */

/**
 * Structure of ABTNodeClient.RequestAddRoutingRuleInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestAddRoutingRuleInput
 * @property {string} id
 * @property {...ABTNodeClient.RoutingRuleInput} rule
 * @property {string} teamDid
 */

/**
 * Structure of ABTNodeClient.RequestAddRoutingSiteInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestAddRoutingSiteInput
 * @property {string} domain
 * @property {string} type
 * @property {Array<...ABTNodeClient.null>} rules
 */

/**
 * Structure of ABTNodeClient.RequestAddUploadEndpointInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestAddUploadEndpointInput
 * @property {string} teamDid
 * @property {string} url
 * @property {string} scope
 */

/**
 * Structure of ABTNodeClient.RequestAttemptIdInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestAttemptIdInput
 * @property {string} eventId
 * @property {string} webhookId
 */

/**
 * Structure of ABTNodeClient.RequestAttemptInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestAttemptInput
 * @property {string} eventId
 * @property {string} webhookId
 * @property {string} attemptId
 * @property {string} teamDid
 */

/**
 * Structure of ABTNodeClient.RequestAuditFederatedLoginInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestAuditFederatedLoginInput
 * @property {string} did
 * @property {string} memberPid
 * @property {string} status
 */

/**
 * Structure of ABTNodeClient.RequestBackupBlockletInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestBackupBlockletInput
 * @property {string} appDid
 * @property {...ABTNodeClient.BackupTo} to
 */

/**
 * Structure of ABTNodeClient.RequestBlockletDetailInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestBlockletDetailInput
 * @property {string} did
 * @property {boolean} attachDiskInfo
 * @property {boolean} attachRuntimeInfo
 * @property {boolean} getOptionalComponents
 * @property {string} domain
 * @property {boolean} useCache
 */

/**
 * Structure of ABTNodeClient.RequestBlockletDiffInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestBlockletDiffInput
 * @property {string} did
 * @property {Array<...ABTNodeClient.null>} hashFiles
 * @property {string} rootDid
 */

/**
 * Structure of ABTNodeClient.RequestBlockletInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestBlockletInput
 * @property {string} did
 */

/**
 * Structure of ABTNodeClient.RequestBlockletMetaFromUrlInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestBlockletMetaFromUrlInput
 * @property {string} url
 * @property {boolean} checkPrice
 */

/**
 * Structure of ABTNodeClient.RequestBlockletMetaInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestBlockletMetaInput
 * @property {string} did
 * @property {string} storeUrl
 */

/**
 * Structure of ABTNodeClient.RequestBlockletRuntimeHistoryInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestBlockletRuntimeHistoryInput
 * @property {string} did
 * @property {number} hours
 */

/**
 * Structure of ABTNodeClient.RequestBlockletSettingsInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestBlockletSettingsInput
 * @property {string} did
 * @property {boolean} enableSessionHardening
 * @property {...ABTNodeClient.InviteSettingsInput} invite
 * @property {...ABTNodeClient.BlockletGatewayInput} gateway
 * @property {...ABTNodeClient.AigneConfigInput} aigne
 * @property {...ABTNodeClient.OrgSettingsInput} org
 * @property {...ABTNodeClient.SubServiceConfigInput} subService
 */

/**
 * Structure of ABTNodeClient.RequestCheckDomainsInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestCheckDomainsInput
 * @property {Array<...ABTNodeClient.null>} domains
 * @property {string} did
 */

/**
 * Structure of ABTNodeClient.RequestCheckFollowingInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestCheckFollowingInput
 * @property {string} teamDid
 * @property {Array<...ABTNodeClient.null>} userDids
 * @property {string} followerDid
 */

/**
 * Structure of ABTNodeClient.RequestClearCacheInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestClearCacheInput
 * @property {string} teamDid
 * @property {string} pattern
 */

/**
 * Structure of ABTNodeClient.RequestComponentsInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestComponentsInput
 * @property {string} did
 * @property {Array<...ABTNodeClient.null>} componentDids
 */

/**
 * Structure of ABTNodeClient.RequestConfigAuthenticationInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestConfigAuthenticationInput
 * @property {string} did
 * @property {string} authentication
 * @property {string} oauth
 */

/**
 * Structure of ABTNodeClient.RequestConfigBlockletInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestConfigBlockletInput
 * @property {Array<...ABTNodeClient.null>} did
 * @property {Array<...ABTNodeClient.null>} configs
 */

/**
 * Structure of ABTNodeClient.RequestConfigDidConnectActionsInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestConfigDidConnectActionsInput
 * @property {string} did
 * @property {string} actionConfig
 */

/**
 * Structure of ABTNodeClient.RequestConfigDidConnectInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestConfigDidConnectInput
 * @property {string} did
 * @property {string} didConnect
 */

/**
 * Structure of ABTNodeClient.RequestConfigNavigationsInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestConfigNavigationsInput
 * @property {string} did
 * @property {Array<...ABTNodeClient.null>} navigations
 */

/**
 * Structure of ABTNodeClient.RequestConfigNotificationInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestConfigNotificationInput
 * @property {string} did
 * @property {string} notification
 */

/**
 * Structure of ABTNodeClient.RequestConfigPassportIssuanceInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestConfigPassportIssuanceInput
 * @property {string} teamDid
 * @property {boolean} enable
 */

/**
 * Structure of ABTNodeClient.RequestConfigPublicToStoreInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestConfigPublicToStoreInput
 * @property {string} did
 * @property {boolean} publicToStore
 */

/**
 * Structure of ABTNodeClient.RequestConfigTrustedFactoriesInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestConfigTrustedFactoriesInput
 * @property {string} teamDid
 * @property {Array<...ABTNodeClient.null>} trustedFactories
 */

/**
 * Structure of ABTNodeClient.RequestConfigTrustedPassportsInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestConfigTrustedPassportsInput
 * @property {string} teamDid
 * @property {Array<...ABTNodeClient.null>} trustedPassports
 */

/**
 * Structure of ABTNodeClient.RequestConfigVaultInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestConfigVaultInput
 * @property {string} teamDid
 * @property {string} vaultDid
 * @property {string} sessionId
 */

/**
 * Structure of ABTNodeClient.RequestConnectByStudioInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestConnectByStudioInput
 * @property {string} did
 * @property {string} storeId
 * @property {string} storeUrl
 * @property {string} storeName
 * @property {string} blockletTitle
 * @property {string} type
 * @property {string} tenantScope
 * @property {string} componentDid
 * @property {string} messageId
 */

/**
 * Structure of ABTNodeClient.RequestConnectToAigneInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestConnectToAigneInput
 * @property {string} did
 * @property {string} baseUrl
 * @property {string} provider
 * @property {string} model
 */

/**
 * Structure of ABTNodeClient.RequestConnectToEndpointInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestConnectToEndpointInput
 * @property {string} did
 * @property {string} endpointId
 * @property {string} projectId
 */

/**
 * Structure of ABTNodeClient.RequestConnectToStoreInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestConnectToStoreInput
 * @property {string} did
 * @property {string} storeId
 * @property {string} storeUrl
 * @property {string} storeName
 * @property {string} projectId
 */

/**
 * Structure of ABTNodeClient.RequestCreateAccessKeyInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestCreateAccessKeyInput
 * @property {string} teamDid
 * @property {string} remark
 * @property {string} passport
 * @property {string} authType
 * @property {string} componentDid
 * @property {string} resourceType
 * @property {string} resourceId
 * @property {string} createdVia
 * @property {number} expireAt
 */

/**
 * Structure of ABTNodeClient.RequestCreateInvitationInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestCreateInvitationInput
 * @property {string} teamDid
 * @property {string} role
 * @property {string} remark
 * @property {string} sourceAppPid
 * @property {...ABTNodeClient.PassportDisplayInput} display
 * @property {string} passportExpireTime
 */

/**
 * Structure of ABTNodeClient.RequestCreateOrgInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestCreateOrgInput
 * @property {string} teamDid
 * @property {string} name
 * @property {string} description
 * @property {string} ownerDid
 * @property {boolean} deferPassport
 */

/**
 * Structure of ABTNodeClient.RequestCreatePassportIssuanceInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestCreatePassportIssuanceInput
 * @property {string} teamDid
 * @property {string} ownerDid
 * @property {string} name
 * @property {...ABTNodeClient.PassportDisplayInput} display
 * @property {string} passportExpireTime
 */

/**
 * Structure of ABTNodeClient.RequestCreatePermissionInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestCreatePermissionInput
 * @property {string} teamDid
 * @property {string} name
 * @property {string} description
 */

/**
 * Structure of ABTNodeClient.RequestCreateProjectInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestCreateProjectInput
 * @property {string} did
 * @property {...ABTNodeClient.PublishType} type
 * @property {string} blockletDid
 * @property {string} blockletTitle
 * @property {string} componentDid
 * @property {string} tenantScope
 */

/**
 * Structure of ABTNodeClient.RequestCreateReleaseInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestCreateReleaseInput
 * @property {string} did
 * @property {string} projectId
 * @property {string} releaseId
 * @property {string} blockletDid
 * @property {string} blockletVersion
 * @property {string} blockletTitle
 * @property {string} blockletDescription
 * @property {string} blockletLogo
 * @property {string} blockletIntroduction
 * @property {Array<...ABTNodeClient.null>} blockletScreenshots
 * @property {string} note
 * @property {string} status
 * @property {Array<...ABTNodeClient.null>} blockletComponents
 * @property {string} uploadedResource
 * @property {string} blockletResourceType
 * @property {string} blockletSupport
 * @property {string} blockletCommunity
 * @property {string} blockletHomepage
 * @property {Array<...ABTNodeClient.null>} blockletVideos
 * @property {string} blockletRepository
 * @property {string} contentType
 * @property {...ABTNodeClient.BlockletDockerInput} blockletDocker
 * @property {boolean} blockletSingleton
 */

/**
 * Structure of ABTNodeClient.RequestCreateRoleInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestCreateRoleInput
 * @property {string} teamDid
 * @property {string} name
 * @property {string} title
 * @property {string} description
 * @property {string} childName
 * @property {Array<...ABTNodeClient.null>} permissions
 * @property {string} extra
 * @property {string} orgId
 */

/**
 * Structure of ABTNodeClient.RequestCreateTransferNodeInvitationInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestCreateTransferNodeInvitationInput
 * @property {string} teamDid
 * @property {string} remark
 */

/**
 * Structure of ABTNodeClient.RequestCreateWebHookInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestCreateWebHookInput
 * @property {...ABTNodeClient.SenderType} type
 * @property {string} title
 * @property {string} description
 * @property {Array<...ABTNodeClient.null>} params
 */

/**
 * Structure of ABTNodeClient.RequestCreateWebhookEndpointInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestCreateWebhookEndpointInput
 * @property {string} teamDid
 * @property {...ABTNodeClient.WebhookEndpointStateInput} input
 */

/**
 * Structure of ABTNodeClient.RequestDeleteAccessKeyInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestDeleteAccessKeyInput
 * @property {string} teamDid
 * @property {string} accessKeyId
 */

/**
 * Structure of ABTNodeClient.RequestDeleteBlockletAccessPolicyInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestDeleteBlockletAccessPolicyInput
 * @property {string} did
 * @property {string} id
 */

/**
 * Structure of ABTNodeClient.RequestDeleteBlockletInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestDeleteBlockletInput
 * @property {string} did
 * @property {boolean} keepData
 * @property {string} sessionId
 */

/**
 * Structure of ABTNodeClient.RequestDeleteBlockletResponseHeaderPolicyInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestDeleteBlockletResponseHeaderPolicyInput
 * @property {string} did
 * @property {string} id
 */

/**
 * Structure of ABTNodeClient.RequestDeleteBlockletSecurityRuleInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestDeleteBlockletSecurityRuleInput
 * @property {string} did
 * @property {string} id
 */

/**
 * Structure of ABTNodeClient.RequestDeleteBlockletSpaceGatewayInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestDeleteBlockletSpaceGatewayInput
 * @property {string} did
 * @property {string} spaceGatewayDid
 */

/**
 * Structure of ABTNodeClient.RequestDeleteBlockletStoreInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestDeleteBlockletStoreInput
 * @property {string} teamDid
 * @property {string} url
 * @property {string} projectId
 * @property {string} scope
 */

/**
 * Structure of ABTNodeClient.RequestDeleteComponentInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestDeleteComponentInput
 * @property {string} did
 * @property {string} rootDid
 * @property {boolean} keepData
 * @property {string} sessionId
 */

/**
 * Structure of ABTNodeClient.RequestDeleteDomainAliasInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestDeleteDomainAliasInput
 * @property {string} id
 * @property {string} domainAlias
 * @property {string} teamDid
 */

/**
 * Structure of ABTNodeClient.RequestDeleteInvitationInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestDeleteInvitationInput
 * @property {string} teamDid
 * @property {string} inviteId
 */

/**
 * Structure of ABTNodeClient.RequestDeleteNginxHttpsCertInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestDeleteNginxHttpsCertInput
 * @property {string} id
 */

/**
 * Structure of ABTNodeClient.RequestDeleteOAuthClientInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestDeleteOAuthClientInput
 * @property {string} teamDid
 * @property {string} clientId
 */

/**
 * Structure of ABTNodeClient.RequestDeletePermissionInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestDeletePermissionInput
 * @property {string} teamDid
 * @property {string} name
 */

/**
 * Structure of ABTNodeClient.RequestDeleteRoleInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestDeleteRoleInput
 * @property {string} teamDid
 * @property {string} name
 */

/**
 * Structure of ABTNodeClient.RequestDeleteRoutingRuleInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestDeleteRoutingRuleInput
 * @property {string} id
 * @property {string} ruleId
 * @property {string} teamDid
 */

/**
 * Structure of ABTNodeClient.RequestDeleteRoutingSiteInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestDeleteRoutingSiteInput
 * @property {string} id
 */

/**
 * Structure of ABTNodeClient.RequestDeleteTeamSessionInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestDeleteTeamSessionInput
 * @property {string} teamDid
 * @property {string} sessionId
 */

/**
 * Structure of ABTNodeClient.RequestDeleteUploadEndpointInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestDeleteUploadEndpointInput
 * @property {string} teamDid
 * @property {string} did
 * @property {string} scope
 * @property {string} projectId
 */

/**
 * Structure of ABTNodeClient.RequestDeleteWebHookInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestDeleteWebHookInput
 * @property {string} id
 */

/**
 * Structure of ABTNodeClient.RequestDeleteWebhookEndpointInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestDeleteWebhookEndpointInput
 * @property {string} teamDid
 * @property {string} id
 */

/**
 * Structure of ABTNodeClient.RequestDisbandFederatedLoginInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestDisbandFederatedLoginInput
 * @property {string} did
 */

/**
 * Structure of ABTNodeClient.RequestDisconnectFromEndpointInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestDisconnectFromEndpointInput
 * @property {string} did
 * @property {string} endpointId
 * @property {string} projectId
 */

/**
 * Structure of ABTNodeClient.RequestDisconnectFromStoreInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestDisconnectFromStoreInput
 * @property {string} did
 * @property {string} storeId
 * @property {string} projectId
 * @property {string} storeScope
 */

/**
 * Structure of ABTNodeClient.RequestDisconnectToAigneInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestDisconnectToAigneInput
 * @property {string} did
 * @property {string} url
 * @property {string} key
 */

/**
 * Structure of ABTNodeClient.RequestDomainDNSInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestDomainDNSInput
 * @property {string} teamDid
 * @property {string} domain
 */

/**
 * Structure of ABTNodeClient.RequestFindCertificateByDomainInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestFindCertificateByDomainInput
 * @property {string} domain
 * @property {string} did
 */

/**
 * Structure of ABTNodeClient.RequestFollowUserActionInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestFollowUserActionInput
 * @property {string} teamDid
 * @property {string} userDid
 * @property {string} followerDid
 * @property {...ABTNodeClient.UserFollowOptionsInput} options
 */

/**
 * Structure of ABTNodeClient.RequestGetAuditLogsInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestGetAuditLogsInput
 * @property {...ABTNodeClient.PagingInput} paging
 * @property {string} scope
 * @property {string} category
 * @property {string} actionOrContent
 */

/**
 * Structure of ABTNodeClient.RequestGetBlockletAccessPoliciesInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestGetBlockletAccessPoliciesInput
 * @property {string} did
 * @property {...ABTNodeClient.PagingInput} paging
 * @property {...ABTNodeClient.BlockletAccessPolicyQueryInput} query
 */

/**
 * Structure of ABTNodeClient.RequestGetBlockletAccessPolicyInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestGetBlockletAccessPolicyInput
 * @property {string} did
 * @property {string} id
 */

/**
 * Structure of ABTNodeClient.RequestGetBlockletBackupSummaryInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestGetBlockletBackupSummaryInput
 * @property {string} did
 * @property {string} startTime
 * @property {string} endTime
 */

/**
 * Structure of ABTNodeClient.RequestGetBlockletBackupsInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestGetBlockletBackupsInput
 * @property {string} did
 * @property {string} startTime
 * @property {string} endTime
 */

/**
 * Structure of ABTNodeClient.RequestGetBlockletResponseHeaderPoliciesInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestGetBlockletResponseHeaderPoliciesInput
 * @property {string} did
 * @property {...ABTNodeClient.PagingInput} paging
 * @property {...ABTNodeClient.BlockletResponseHeaderPolicyQueryInput} query
 */

/**
 * Structure of ABTNodeClient.RequestGetBlockletResponseHeaderPolicyInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestGetBlockletResponseHeaderPolicyInput
 * @property {string} did
 * @property {string} id
 */

/**
 * Structure of ABTNodeClient.RequestGetBlockletSecurityRuleInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestGetBlockletSecurityRuleInput
 * @property {string} did
 * @property {string} id
 */

/**
 * Structure of ABTNodeClient.RequestGetBlockletSecurityRulesInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestGetBlockletSecurityRulesInput
 * @property {string} did
 * @property {...ABTNodeClient.PagingInput} paging
 * @property {...ABTNodeClient.BlockletSecurityRuleQueryInput} query
 * @property {boolean} includeDisabled
 */

/**
 * Structure of ABTNodeClient.RequestGetBlockletsInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestGetBlockletsInput
 * @property {boolean} useCache
 * @property {boolean} includeRuntimeInfo
 * @property {...ABTNodeClient.PagingInput} paging
 * @property {string} search
 * @property {boolean} external
 * @property {...ABTNodeClient.SortInput} sort
 */

/**
 * Structure of ABTNodeClient.RequestGetDynamicComponentsInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestGetDynamicComponentsInput
 * @property {string} url
 */

/**
 * Structure of ABTNodeClient.RequestGetLauncherSessionInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestGetLauncherSessionInput
 * @property {string} launcherSessionId
 * @property {string} launcherUrl
 */

/**
 * Structure of ABTNodeClient.RequestGetNotificationsInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestGetNotificationsInput
 * @property {string} receiver
 * @property {string} sender
 * @property {boolean} read
 * @property {...ABTNodeClient.PagingInput} paging
 * @property {string} teamDid
 * @property {Array<...ABTNodeClient.null>} severity
 * @property {Array<...ABTNodeClient.null>} componentDid
 * @property {Array<...ABTNodeClient.null>} entityId
 * @property {Array<...ABTNodeClient.null>} source
 */

/**
 * Structure of ABTNodeClient.RequestGetOrgDataInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestGetOrgDataInput
 * @property {string} teamDid
 * @property {string} orgId
 * @property {...ABTNodeClient.PagingInput} paging
 */

/**
 * Structure of ABTNodeClient.RequestGetOrgInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestGetOrgInput
 * @property {string} teamDid
 * @property {string} id
 */

/**
 * Structure of ABTNodeClient.RequestGetOrgMemberInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestGetOrgMemberInput
 * @property {string} teamDid
 * @property {string} orgId
 * @property {string} userDid
 */

/**
 * Structure of ABTNodeClient.RequestGetOrgResourceInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestGetOrgResourceInput
 * @property {string} teamDid
 * @property {string} orgId
 * @property {string} resourceId
 */

/**
 * Structure of ABTNodeClient.RequestGetOrgsInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestGetOrgsInput
 * @property {string} teamDid
 * @property {...ABTNodeClient.OrgInput} org
 * @property {...ABTNodeClient.PagingInput} paging
 * @property {...ABTNodeClient.OrgQueryType} type
 * @property {string} userDid
 * @property {...ABTNodeClient.RequestGetOrgsOptionsInput} options
 */

/**
 * Structure of ABTNodeClient.RequestGetOrgsOptionsInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestGetOrgsOptionsInput
 * @property {boolean} includeMembers
 * @property {boolean} includePassports
 */

/**
 * Structure of ABTNodeClient.RequestGetPassportIssuancesInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestGetPassportIssuancesInput
 * @property {string} teamDid
 * @property {string} ownerDid
 */

/**
 * Structure of ABTNodeClient.RequestGetProjectsInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestGetProjectsInput
 * @property {string} did
 * @property {...ABTNodeClient.PagingInput} paging
 * @property {string} componentDid
 * @property {string} tenantScope
 */

/**
 * Structure of ABTNodeClient.RequestGetReleasesInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestGetReleasesInput
 * @property {string} did
 * @property {string} projectId
 * @property {...ABTNodeClient.PagingInput} paging
 */

/**
 * Structure of ABTNodeClient.RequestGetRoutingSitesInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestGetRoutingSitesInput
 * @property {string} snapshotHash
 */

/**
 * Structure of ABTNodeClient.RequestGetSelectedResourcesInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestGetSelectedResourcesInput
 * @property {string} did
 * @property {string} projectId
 * @property {string} releaseId
 * @property {string} componentDid
 */

/**
 * Structure of ABTNodeClient.RequestGetSessionInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestGetSessionInput
 * @property {string} id
 */

/**
 * Structure of ABTNodeClient.RequestGetTrafficInsightsInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestGetTrafficInsightsInput
 * @property {string} did
 * @property {string} startDate
 * @property {string} endDate
 * @property {...ABTNodeClient.PagingInput} paging
 */

/**
 * Structure of ABTNodeClient.RequestGetWebhookAttemptsInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestGetWebhookAttemptsInput
 * @property {string} teamDid
 * @property {...ABTNodeClient.RequestAttemptIdInput} input
 * @property {...ABTNodeClient.PagingInput} paging
 */

/**
 * Structure of ABTNodeClient.RequestGetWebhookEndpointInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestGetWebhookEndpointInput
 * @property {string} teamDid
 * @property {string} id
 */

/**
 * Structure of ABTNodeClient.RequestGetWebhookEndpointsInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestGetWebhookEndpointsInput
 * @property {string} teamDid
 * @property {...ABTNodeClient.PagingInput} paging
 */

/**
 * Structure of ABTNodeClient.RequestGrantPermissionForRoleInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestGrantPermissionForRoleInput
 * @property {string} teamDid
 * @property {string} roleName
 * @property {string} grantName
 */

/**
 * Structure of ABTNodeClient.RequestHasPermissionInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestHasPermissionInput
 * @property {string} teamDid
 * @property {string} role
 * @property {string} permission
 */

/**
 * Structure of ABTNodeClient.RequestInstallBlockletInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestInstallBlockletInput
 * @property {string} type
 * @property {string} did
 * @property {string} storeUrl
 * @property {string} url
 * @property {undefined} file
 * @property {string} diffVersion
 * @property {Array<...ABTNodeClient.null>} deleteSet
 * @property {string} title
 * @property {string} description
 * @property {boolean} startImmediately
 * @property {string} appSk
 * @property {Array<...ABTNodeClient.null>} downloadTokenList
 */

/**
 * Structure of ABTNodeClient.RequestInstallComponentInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestInstallComponentInput
 * @property {string} rootDid
 * @property {string} mountPoint
 * @property {string} url
 * @property {undefined} file
 * @property {string} did
 * @property {string} diffVersion
 * @property {Array<...ABTNodeClient.null>} deleteSet
 * @property {string} name
 * @property {string} title
 * @property {Array<...ABTNodeClient.null>} configs
 * @property {Array<...ABTNodeClient.null>} downloadTokenList
 * @property {boolean} skipNavigation
 * @property {boolean} onlyRequired
 * @property {...ABTNodeClient.BlockletDistInput} dist
 */

/**
 * Structure of ABTNodeClient.RequestInvitableUsersInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestInvitableUsersInput
 * @property {string} teamDid
 * @property {string} id
 * @property {...ABTNodeClient.UserQueryInput} query
 */

/**
 * Structure of ABTNodeClient.RequestInviteMembersToOrgInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestInviteMembersToOrgInput
 * @property {string} teamDid
 * @property {string} orgId
 * @property {Array<...ABTNodeClient.null>} userDids
 * @property {string} role
 * @property {string} inviteType
 * @property {string} email
 */

/**
 * Structure of ABTNodeClient.RequestIsDidDomainInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestIsDidDomainInput
 * @property {string} domain
 */

/**
 * Structure of ABTNodeClient.RequestIssuePassportToUserInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestIssuePassportToUserInput
 * @property {string} teamDid
 * @property {string} userDid
 * @property {string} role
 * @property {...ABTNodeClient.PassportDisplayInput} display
 * @property {boolean} notify
 * @property {string} notification
 */

/**
 * Structure of ABTNodeClient.RequestJoinFederatedLoginInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestJoinFederatedLoginInput
 * @property {string} did
 * @property {string} appUrl
 */

/**
 * Structure of ABTNodeClient.RequestLaunchBlockletByLauncherInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestLaunchBlockletByLauncherInput
 * @property {string} blockletMetaUrl
 * @property {string} title
 * @property {string} description
 * @property {string} chainHost
 * @property {string} launcherSessionId
 * @property {string} launcherUrl
 * @property {boolean} onlyRequired
 * @property {string} type
 * @property {string} storeUrl
 * @property {boolean} autoStart
 * @property {string} bindDomainCap
 * @property {string} domainNftDid
 */

/**
 * Structure of ABTNodeClient.RequestLaunchBlockletWithoutWalletInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestLaunchBlockletWithoutWalletInput
 * @property {string} blockletMetaUrl
 * @property {string} title
 * @property {string} description
 * @property {boolean} onlyRequired
 * @property {string} type
 * @property {string} storeUrl
 */

/**
 * Structure of ABTNodeClient.RequestLimitInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestLimitInput
 * @property {boolean} enabled
 * @property {number} global
 * @property {number} burstFactor
 * @property {number} burstDelay
 * @property {number} rate
 * @property {Array<...ABTNodeClient.null>} methods
 */

/**
 * Structure of ABTNodeClient.RequestLogoutUserInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestLogoutUserInput
 * @property {string} teamDid
 * @property {string} appPid
 * @property {string} userDid
 * @property {string} visitorId
 * @property {boolean} remove
 */

/**
 * Structure of ABTNodeClient.RequestMakeAllNotificationsAsReadInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestMakeAllNotificationsAsReadInput
 * @property {string} receiver
 * @property {string} teamDid
 * @property {string} severity
 * @property {string} componentDid
 * @property {string} entityId
 * @property {string} source
 */

/**
 * Structure of ABTNodeClient.RequestMigrateApplicationToStructV2Input
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestMigrateApplicationToStructV2Input
 * @property {string} did
 * @property {string} appSk
 */

/**
 * Structure of ABTNodeClient.RequestMigrateOrgResourceInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestMigrateOrgResourceInput
 * @property {string} teamDid
 * @property {string} from
 * @property {string} to
 * @property {Array<...ABTNodeClient.null>} resourceIds
 */

/**
 * Structure of ABTNodeClient.RequestNodeRuntimeHistoryInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestNodeRuntimeHistoryInput
 * @property {number} hours
 */

/**
 * Structure of ABTNodeClient.RequestNotificationComponentsInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestNotificationComponentsInput
 * @property {string} teamDid
 * @property {string} receiver
 */

/**
 * Structure of ABTNodeClient.RequestNotificationSendLogInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestNotificationSendLogInput
 * @property {string} teamDid
 * @property {Array<...ABTNodeClient.null>} dateRange
 * @property {...ABTNodeClient.PagingInput} paging
 * @property {string} source
 * @property {Array<...ABTNodeClient.null>} componentDids
 * @property {Array<...ABTNodeClient.null>} severities
 */

/**
 * Structure of ABTNodeClient.RequestOAuthClientInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestOAuthClientInput
 * @property {string} teamDid
 * @property {...ABTNodeClient.OauthClientInput} input
 */

/**
 * Structure of ABTNodeClient.RequestPassportInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestPassportInput
 * @property {string} teamDid
 * @property {...ABTNodeClient.PassportQueryInput} query
 * @property {...ABTNodeClient.PagingInput} paging
 */

/**
 * Structure of ABTNodeClient.RequestPassportLogInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestPassportLogInput
 * @property {string} teamDid
 * @property {...ABTNodeClient.PassportLogQueryInput} query
 * @property {...ABTNodeClient.PagingInput} paging
 */

/**
 * Structure of ABTNodeClient.RequestProjectInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestProjectInput
 * @property {string} did
 * @property {string} projectId
 * @property {string} messageId
 */

/**
 * Structure of ABTNodeClient.RequestPublishToEndpointInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestPublishToEndpointInput
 * @property {string} did
 * @property {string} endpointId
 * @property {string} projectId
 * @property {string} releaseId
 */

/**
 * Structure of ABTNodeClient.RequestPublishToStoreInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestPublishToStoreInput
 * @property {string} did
 * @property {string} projectId
 * @property {string} releaseId
 * @property {string} type
 * @property {string} storeId
 */

/**
 * Structure of ABTNodeClient.RequestQuitFederatedLoginInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestQuitFederatedLoginInput
 * @property {string} did
 * @property {string} targetDid
 */

/**
 * Structure of ABTNodeClient.RequestReadNotificationsInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestReadNotificationsInput
 * @property {Array<...ABTNodeClient.null>} notificationIds
 * @property {string} teamDid
 * @property {string} receiver
 */

/**
 * Structure of ABTNodeClient.RequestReceiversInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestReceiversInput
 * @property {string} teamDid
 * @property {string} userName
 * @property {string} userDid
 * @property {Array<...ABTNodeClient.null>} walletSendStatus
 * @property {Array<...ABTNodeClient.null>} pushKitSendStatus
 * @property {Array<...ABTNodeClient.null>} emailSendStatus
 * @property {Array<...ABTNodeClient.null>} dateRange
 * @property {...ABTNodeClient.PagingInput} paging
 * @property {string} notificationId
 */

/**
 * Structure of ABTNodeClient.RequestRegenerateWebhookEndpointSecretInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestRegenerateWebhookEndpointSecretInput
 * @property {string} teamDid
 * @property {string} id
 */

/**
 * Structure of ABTNodeClient.RequestRelatedPassportsInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestRelatedPassportsInput
 * @property {string} teamDid
 * @property {string} passportId
 * @property {...ABTNodeClient.PagingInput} paging
 */

/**
 * Structure of ABTNodeClient.RequestReleaseInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestReleaseInput
 * @property {string} did
 * @property {string} projectId
 * @property {string} releaseId
 */

/**
 * Structure of ABTNodeClient.RequestResendNotificationInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestResendNotificationInput
 * @property {string} teamDid
 * @property {string} notificationId
 * @property {Array<...ABTNodeClient.null>} receivers
 * @property {Array<...ABTNodeClient.null>} channels
 * @property {Array<...ABTNodeClient.null>} webhookUrls
 * @property {boolean} resendFailedOnly
 */

/**
 * Structure of ABTNodeClient.RequestResetNodeInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestResetNodeInput
 * @property {boolean} owner
 * @property {boolean} blocklets
 * @property {boolean} webhooks
 * @property {boolean} certificates
 * @property {boolean} accessKeys
 * @property {boolean} blockletExtras
 * @property {boolean} routingRules
 * @property {boolean} users
 * @property {boolean} invitations
 */

/**
 * Structure of ABTNodeClient.RequestRestoreBlockletInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestRestoreBlockletInput
 * @property {string} endpoint
 * @property {string} appDid
 * @property {string} delegation
 * @property {undefined} password
 * @property {any} wallet
 * @property {...ABTNodeClient.BackupTo} from
 * @property {string} appPid
 */

/**
 * Structure of ABTNodeClient.RequestRevokePermissionFromRoleInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestRevokePermissionFromRoleInput
 * @property {string} teamDid
 * @property {string} roleName
 * @property {string} grantName
 */

/**
 * Structure of ABTNodeClient.RequestRevokeUserPassportInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestRevokeUserPassportInput
 * @property {string} teamDid
 * @property {string} userDid
 * @property {string} passportId
 */

/**
 * Structure of ABTNodeClient.RequestRotateSessionKeyInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestRotateSessionKeyInput
 * @property {string} teamDid
 * @property {string} sessionId
 */

/**
 * Structure of ABTNodeClient.RequestSendEmailInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestSendEmailInput
 * @property {string} did
 * @property {string} receiver
 * @property {string} email
 */

/**
 * Structure of ABTNodeClient.RequestSendMsgInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestSendMsgInput
 * @property {string} webhookId
 * @property {string} message
 */

/**
 * Structure of ABTNodeClient.RequestSendPushInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestSendPushInput
 * @property {string} did
 * @property {string} receiver
 * @property {string} notification
 */

/**
 * Structure of ABTNodeClient.RequestSwitchProfileInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestSwitchProfileInput
 * @property {string} teamDid
 * @property {string} userDid
 * @property {...ABTNodeClient.UserProfileInput} profile
 */

/**
 * Structure of ABTNodeClient.RequestSyncFederatedInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestSyncFederatedInput
 * @property {string} did
 */

/**
 * Structure of ABTNodeClient.RequestSyncMasterAuthorizationInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestSyncMasterAuthorizationInput
 * @property {string} did
 */

/**
 * Structure of ABTNodeClient.RequestTagInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestTagInput
 * @property {string} teamDid
 * @property {...ABTNodeClient.TagInput} tag
 * @property {number} moveTo
 */

/**
 * Structure of ABTNodeClient.RequestTaggingInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestTaggingInput
 * @property {string} teamDid
 * @property {...ABTNodeClient.TaggingInput} tagging
 */

/**
 * Structure of ABTNodeClient.RequestTagsInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestTagsInput
 * @property {string} teamDid
 * @property {...ABTNodeClient.PagingInput} paging
 */

/**
 * Structure of ABTNodeClient.RequestTeamPermissionInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestTeamPermissionInput
 * @property {string} teamDid
 * @property {...ABTNodeClient.PermissionInput} permission
 */

/**
 * Structure of ABTNodeClient.RequestTeamRoleInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestTeamRoleInput
 * @property {string} teamDid
 * @property {...ABTNodeClient.RoleUpdateInput} role
 * @property {string} orgId
 */

/**
 * Structure of ABTNodeClient.RequestTeamUserInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestTeamUserInput
 * @property {string} teamDid
 * @property {...ABTNodeClient.UserInfoInput} user
 * @property {...ABTNodeClient.RequestTeamUserOptionsInput} options
 * @property {string} sessionId
 */

/**
 * Structure of ABTNodeClient.RequestTeamUserOptionsInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestTeamUserOptionsInput
 * @property {boolean} enableConnectedAccount
 * @property {boolean} includeTags
 * @property {boolean} includeFederated
 */

/**
 * Structure of ABTNodeClient.RequestUpdateAccessKeyInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestUpdateAccessKeyInput
 * @property {string} teamDid
 * @property {string} accessKeyId
 * @property {string} remark
 * @property {string} passport
 * @property {number} expireAt
 */

/**
 * Structure of ABTNodeClient.RequestUpdateAppSessionConfigInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestUpdateAppSessionConfigInput
 * @property {string} did
 * @property {...ABTNodeClient.SessionConfigInput} config
 */

/**
 * Structure of ABTNodeClient.RequestUpdateAutoBackupInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestUpdateAutoBackupInput
 * @property {string} did
 * @property {...ABTNodeClient.AutoBackupInput} autoBackup
 */

/**
 * Structure of ABTNodeClient.RequestUpdateAutoCheckUpdateInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestUpdateAutoCheckUpdateInput
 * @property {string} did
 * @property {...ABTNodeClient.AutoCheckUpdateInput} autoCheckUpdate
 */

/**
 * Structure of ABTNodeClient.RequestUpdateBlockletAccessPolicyInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestUpdateBlockletAccessPolicyInput
 * @property {string} did
 * @property {...ABTNodeClient.BlockletAccessPolicyInput} data
 */

/**
 * Structure of ABTNodeClient.RequestUpdateBlockletResponseHeaderPolicyInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestUpdateBlockletResponseHeaderPolicyInput
 * @property {string} did
 * @property {...ABTNodeClient.BlockletResponseHeaderPolicyInput} data
 */

/**
 * Structure of ABTNodeClient.RequestUpdateBlockletSecurityRuleInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestUpdateBlockletSecurityRuleInput
 * @property {string} did
 * @property {...ABTNodeClient.BlockletSecurityRuleInput} data
 */

/**
 * Structure of ABTNodeClient.RequestUpdateBlockletSpaceGatewayInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestUpdateBlockletSpaceGatewayInput
 * @property {string} did
 * @property {...ABTNodeClient.SpaceGatewayInput} where
 * @property {...ABTNodeClient.SpaceGatewayInput} spaceGateway
 */

/**
 * Structure of ABTNodeClient.RequestUpdateComponentMountPointInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestUpdateComponentMountPointInput
 * @property {string} did
 * @property {string} rootDid
 * @property {string} mountPoint
 */

/**
 * Structure of ABTNodeClient.RequestUpdateComponentTitleInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestUpdateComponentTitleInput
 * @property {string} did
 * @property {string} rootDid
 * @property {string} title
 */

/**
 * Structure of ABTNodeClient.RequestUpdateComponentsInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestUpdateComponentsInput
 * @property {string} updateId
 * @property {string} rootDid
 * @property {Array<...ABTNodeClient.null>} selectedComponents
 */

/**
 * Structure of ABTNodeClient.RequestUpdateNginxHttpsCertInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestUpdateNginxHttpsCertInput
 * @property {string} id
 * @property {string} name
 * @property {string} certificate
 * @property {string} privateKey
 */

/**
 * Structure of ABTNodeClient.RequestUpdateOrgInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestUpdateOrgInput
 * @property {string} teamDid
 * @property {...ABTNodeClient.OrgInput} org
 */

/**
 * Structure of ABTNodeClient.RequestUpdatePermissionsForRoleInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestUpdatePermissionsForRoleInput
 * @property {string} teamDid
 * @property {string} roleName
 * @property {Array<...ABTNodeClient.null>} grantNames
 */

/**
 * Structure of ABTNodeClient.RequestUpdateProjectInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestUpdateProjectInput
 * @property {string} did
 * @property {string} projectId
 * @property {string} blockletTitle
 * @property {string} blockletDescription
 * @property {string} blockletIntroduction
 * @property {boolean} autoUpload
 * @property {boolean} possibleSameStore
 * @property {string} blockletSupport
 * @property {string} blockletCommunity
 * @property {string} blockletHomepage
 */

/**
 * Structure of ABTNodeClient.RequestUpdateRoutingRuleInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestUpdateRoutingRuleInput
 * @property {string} id
 * @property {...ABTNodeClient.RoutingRuleInput} rule
 * @property {string} teamDid
 */

/**
 * Structure of ABTNodeClient.RequestUpdateRoutingSiteInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestUpdateRoutingSiteInput
 * @property {string} id
 * @property {Array<...ABTNodeClient.null>} corsAllowedOrigins
 * @property {string} domain
 * @property {string} teamDid
 */

/**
 * Structure of ABTNodeClient.RequestUpdateSelectedResourcesInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestUpdateSelectedResourcesInput
 * @property {string} did
 * @property {string} projectId
 * @property {string} releaseId
 * @property {string} componentDid
 * @property {Array<...ABTNodeClient.null>} resources
 */

/**
 * Structure of ABTNodeClient.RequestUpdateUserAddressInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestUpdateUserAddressInput
 * @property {string} teamDid
 * @property {string} did
 * @property {...ABTNodeClient.UserAddressInput} address
 */

/**
 * Structure of ABTNodeClient.RequestUpdateUserExtraInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestUpdateUserExtraInput
 * @property {string} teamDid
 * @property {string} did
 * @property {string} remark
 * @property {string} extra
 */

/**
 * Structure of ABTNodeClient.RequestUpdateUserInfoInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestUpdateUserInfoInput
 * @property {string} teamDid
 * @property {...ABTNodeClient.UserInfoInput} user
 */

/**
 * Structure of ABTNodeClient.RequestUpdateUserTagsInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestUpdateUserTagsInput
 * @property {string} teamDid
 * @property {string} did
 * @property {Array<...ABTNodeClient.null>} tags
 */

/**
 * Structure of ABTNodeClient.RequestUpdateWebHookStateInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestUpdateWebHookStateInput
 * @property {string} id
 * @property {string} url
 * @property {boolean} enabled
 * @property {number} consecutiveFailures
 */

/**
 * Structure of ABTNodeClient.RequestUpdateWebhookEndpointInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestUpdateWebhookEndpointInput
 * @property {string} teamDid
 * @property {string} id
 * @property {...ABTNodeClient.WebhookEndpointStateInput} data
 */

/**
 * Structure of ABTNodeClient.RequestUpgradeNodeVersionInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestUpgradeNodeVersionInput
 * @property {string} sessionId
 */

/**
 * Structure of ABTNodeClient.RequestUserRelationCountInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestUserRelationCountInput
 * @property {string} teamDid
 * @property {Array<...ABTNodeClient.null>} userDids
 * @property {...ABTNodeClient.QueryUserFollowStateOptionsInput} options
 */

/**
 * Structure of ABTNodeClient.RequestUserRelationQueryInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestUserRelationQueryInput
 * @property {string} teamDid
 * @property {string} userDid
 * @property {...ABTNodeClient.PagingInput} paging
 * @property {...ABTNodeClient.UserSortInput} sort
 * @property {...ABTNodeClient.QueryUserFollowOptionsInput} options
 */

/**
 * Structure of ABTNodeClient.RequestUserSessionsCountInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestUserSessionsCountInput
 * @property {string} teamDid
 * @property {...ABTNodeClient.UserSessionQueryInput} query
 */

/**
 * Structure of ABTNodeClient.RequestUserSessionsInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestUserSessionsInput
 * @property {string} teamDid
 * @property {...ABTNodeClient.UserSessionQueryInput} query
 * @property {...ABTNodeClient.UserSessionSortInput} sort
 * @property {...ABTNodeClient.PagingInput} paging
 */

/**
 * Structure of ABTNodeClient.RequestUsersInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestUsersInput
 * @property {string} teamDid
 * @property {...ABTNodeClient.UserQueryInput} query
 * @property {...ABTNodeClient.UserSortInput} sort
 * @property {...ABTNodeClient.PagingInput} paging
 * @property {Array<...ABTNodeClient.null>} dids
 */

/**
 * Structure of ABTNodeClient.RequestVerifyAccessKeyInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestVerifyAccessKeyInput
 * @property {string} teamDid
 * @property {string} accessKeyId
 * @property {string} resourceType
 * @property {string} resourceId
 * @property {string} componentDid
 */

/**
 * Structure of ABTNodeClient.RequestVerifyAigneConnectionInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestVerifyAigneConnectionInput
 * @property {string} did
 */

/**
 * Structure of ABTNodeClient.RoleUpdateInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RoleUpdateInput
 * @property {string} name
 * @property {string} title
 * @property {string} description
 * @property {string} extra
 */

/**
 * Structure of ABTNodeClient.RoutingRuleFromInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RoutingRuleFromInput
 * @property {string} pathPrefix
 * @property {Array<...ABTNodeClient.null>} header
 */

/**
 * Structure of ABTNodeClient.RoutingRuleHeaderInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RoutingRuleHeaderInput
 * @property {string} key
 * @property {string} value
 * @property {...ABTNodeClient.HeaderMatchType} type
 */

/**
 * Structure of ABTNodeClient.RoutingRuleInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RoutingRuleInput
 * @property {string} id
 * @property {...ABTNodeClient.RoutingRuleFromInput} from
 * @property {...ABTNodeClient.RoutingRuleToInput} to
 * @property {boolean} isProtected
 */

/**
 * Structure of ABTNodeClient.RoutingRuleResponseInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RoutingRuleResponseInput
 * @property {number} status
 * @property {string} contentType
 * @property {string} body
 */

/**
 * Structure of ABTNodeClient.RoutingRuleToInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RoutingRuleToInput
 * @property {number} port
 * @property {...ABTNodeClient.BackendServiceType} type
 * @property {string} did
 * @property {string} url
 * @property {number} redirectCode
 * @property {string} interfaceName
 * @property {string} componentId
 * @property {string} pageGroup
 * @property {...ABTNodeClient.RoutingRuleResponseInput} response
 */

/**
 * Structure of ABTNodeClient.SessionConfigInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.SessionConfigInput
 * @property {number} cacheTtl
 * @property {number} ttl
 * @property {...ABTNodeClient.LoginEmailSettingsInput} email
 * @property {...ABTNodeClient.LoginPhoneSettingsInput} phone
 * @property {string} salt
 * @property {boolean} enableBlacklist
 */

/**
 * Structure of ABTNodeClient.SortInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.SortInput
 * @property {string} field
 * @property {string} direction
 */

/**
 * Structure of ABTNodeClient.SpaceGatewayInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.SpaceGatewayInput
 * @property {string} name
 * @property {string} url
 * @property {string} protected
 * @property {string} endpoint
 * @property {string} did
 */

/**
 * Structure of ABTNodeClient.SubServiceConfigInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.SubServiceConfigInput
 * @property {boolean} enabled
 * @property {string} domain
 * @property {string} staticRoot
 */

/**
 * Structure of ABTNodeClient.TagInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.TagInput
 * @property {number} id
 * @property {string} title
 * @property {string} description
 * @property {string} color
 * @property {number} createdAt
 * @property {number} updatedAt
 * @property {string} slug
 * @property {string} type
 * @property {string} componentDid
 * @property {number} parentId
 * @property {string} createdBy
 * @property {string} updatedBy
 */

/**
 * Structure of ABTNodeClient.TaggingInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.TaggingInput
 * @property {number} tagId
 * @property {string} taggableType
 * @property {Array<...ABTNodeClient.null>} taggableIds
 */

/**
 * Structure of ABTNodeClient.TeamInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.TeamInput
 * @property {string} teamDid
 * @property {...ABTNodeClient.PagingInput} paging
 */

/**
 * Structure of ABTNodeClient.TrustedFactoryInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.TrustedFactoryInput
 * @property {string} holderDid
 * @property {string} issuerDid
 * @property {string} factoryAddress
 * @property {string} remark
 * @property {...ABTNodeClient.TrustedPassportMappingToInput} passport
 */

/**
 * Structure of ABTNodeClient.TrustedPassportInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.TrustedPassportInput
 * @property {string} issuerDid
 * @property {string} remark
 * @property {Array<...ABTNodeClient.null>} mappings
 */

/**
 * Structure of ABTNodeClient.TrustedPassportMappingFromInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.TrustedPassportMappingFromInput
 * @property {string} passport
 */

/**
 * Structure of ABTNodeClient.TrustedPassportMappingInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.TrustedPassportMappingInput
 * @property {...ABTNodeClient.TrustedPassportMappingFromInput} from
 * @property {...ABTNodeClient.TrustedPassportMappingToInput} to
 */

/**
 * Structure of ABTNodeClient.TrustedPassportMappingToInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.TrustedPassportMappingToInput
 * @property {string} role
 * @property {string} ttl
 * @property {string} ttlPolicy
 */

/**
 * Structure of ABTNodeClient.UserAddressInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.UserAddressInput
 * @property {string} country
 * @property {string} province
 * @property {string} city
 * @property {string} postalCode
 * @property {string} line1
 * @property {string} line2
 */

/**
 * Structure of ABTNodeClient.UserFollowOptionsInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.UserFollowOptionsInput
 * @property {boolean} skipNotification
 */

/**
 * Structure of ABTNodeClient.UserInfoInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.UserInfoInput
 * @property {string} did
 * @property {string} pk
 * @property {string} role
 * @property {string} avatar
 * @property {string} fullName
 * @property {string} email
 * @property {boolean} approved
 * @property {number} createdAt
 * @property {number} updatedAt
 * @property {string} locale
 * @property {Array<...ABTNodeClient.null>} passports
 * @property {number} firstLoginAt
 * @property {number} lastLoginAt
 * @property {string} remark
 * @property {string} lastLoginIp
 * @property {string} sourceProvider
 * @property {string} sourceAppPid
 * @property {Array<...ABTNodeClient.null>} connectedAccounts
 * @property {any} extra
 * @property {Array<...ABTNodeClient.null>} tags
 * @property {any} didSpace
 * @property {Array<...ABTNodeClient.null>} userSessions
 * @property {string} url
 * @property {string} phone
 * @property {string} inviter
 * @property {number} generation
 * @property {boolean} emailVerified
 * @property {boolean} phoneVerified
 * @property {...ABTNodeClient.UserMetadataInput} metadata
 * @property {...ABTNodeClient.UserAddressInput} address
 * @property {number} userSessionsCount
 * @property {boolean} isFollowing
 * @property {string} name
 * @property {string} createdByAppPid
 */

/**
 * Structure of ABTNodeClient.UserMetadataInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.UserMetadataInput
 * @property {string} bio
 * @property {string} location
 * @property {string} timezone
 * @property {string} cover
 * @property {Array<...ABTNodeClient.null>} links
 * @property {...ABTNodeClient.UserMetadataStatusInput} status
 * @property {...ABTNodeClient.UserPhoneInfoInput} phone
 */

/**
 * Structure of ABTNodeClient.UserMetadataLinkInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.UserMetadataLinkInput
 * @property {string} url
 * @property {string} favicon
 */

/**
 * Structure of ABTNodeClient.UserMetadataStatusInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.UserMetadataStatusInput
 * @property {string} label
 * @property {string} icon
 * @property {string} duration
 * @property {Array<...ABTNodeClient.null>} dateRange
 */

/**
 * Structure of ABTNodeClient.UserOrgInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.UserOrgInput
 * @property {string} id
 * @property {string} orgId
 * @property {string} userDid
 * @property {...ABTNodeClient.OrgUserStatus} status
 * @property {number} createdAt
 * @property {number} updatedAt
 * @property {...ABTNodeClient.UserInfoInput} user
 * @property {any} metadata
 */

/**
 * Structure of ABTNodeClient.UserPhoneInfoInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.UserPhoneInfoInput
 * @property {string} country
 * @property {string} phoneNumber
 */

/**
 * Structure of ABTNodeClient.UserProfileInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.UserProfileInput
 * @property {string} did
 * @property {string} avatar
 * @property {string} fullName
 * @property {string} email
 */

/**
 * Structure of ABTNodeClient.UserQueryInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.UserQueryInput
 * @property {string} role
 * @property {boolean} approved
 * @property {string} search
 * @property {string} connectedDid
 * @property {Array<...ABTNodeClient.null>} tags
 * @property {string} inviter
 * @property {string} invitee
 * @property {number} generation
 * @property {boolean} includeTags
 * @property {boolean} includeUserSessions
 * @property {boolean} includePassports
 * @property {boolean} includeConnectedAccounts
 * @property {boolean} includeFollowStatus
 * @property {string} createdByAppPid
 */

/**
 * Structure of ABTNodeClient.UserSessionInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.UserSessionInput
 * @property {string} id
 * @property {string} visitorId
 * @property {string} appPid
 * @property {string} userDid
 * @property {string} ua
 * @property {string} passportId
 * @property {string} status
 * @property {string} lastLoginIp
 * @property {any} extra
 * @property {number} createdAt
 * @property {number} updatedAt
 * @property {string} createdByAppPid
 */

/**
 * Structure of ABTNodeClient.UserSessionQueryInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.UserSessionQueryInput
 * @property {string} userDid
 * @property {string} visitorId
 * @property {string} appPid
 * @property {string} status
 * @property {boolean} includeUser
 * @property {string} createdByAppPid
 */

/**
 * Structure of ABTNodeClient.UserSessionSortInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.UserSessionSortInput
 * @property {number} updatedAt
 * @property {number} createdAt
 */

/**
 * Structure of ABTNodeClient.UserSortInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.UserSortInput
 * @property {number} updatedAt
 * @property {number} createdAt
 * @property {number} lastLoginAt
 */

/**
 * Structure of ABTNodeClient.WAFPolicyInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.WAFPolicyInput
 * @property {boolean} enabled
 * @property {string} mode
 * @property {number} inboundAnomalyScoreThreshold
 * @property {number} outboundAnomalyScoreThreshold
 * @property {number} logLevel
 */

/**
 * Structure of ABTNodeClient.WebHookParamInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.WebHookParamInput
 * @property {string} name
 * @property {string} description
 * @property {boolean} required
 * @property {string} defaultValue
 * @property {string} value
 * @property {string} type
 * @property {boolean} enabled
 * @property {number} consecutiveFailures
 */

/**
 * Structure of ABTNodeClient.WebhookEndpointStateInput
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.WebhookEndpointStateInput
 * @property {string} id
 * @property {string} apiVersion
 * @property {string} url
 * @property {string} description
 * @property {Array<...ABTNodeClient.null>} enabledEvents
 * @property {any} metadata
 * @property {string} status
 * @property {number} createdAt
 * @property {number} updatedAt
 * @property {string} secret
 */

/**
 * Structure of ABTNodeClient.AccessKey
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.AccessKey
 * @property {string} accessKeyId
 * @property {string} accessKeyPublic
 * @property {string} remark
 * @property {string} passport
 * @property {number} createdAt
 * @property {number} updatedAt
 * @property {number} lastUsedAt
 * @property {string} createdBy
 * @property {string} updatedBy
 * @property {string} authType
 * @property {string} componentDid
 * @property {string} resourceType
 * @property {string} resourceId
 * @property {string} createdVia
 * @property {number} expireAt
 */

/**
 * Structure of ABTNodeClient.AigneConfig
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.AigneConfig
 * @property {string} provider
 * @property {string} model
 * @property {string} key
 * @property {string} url
 * @property {string} accessKeyId
 * @property {string} secretAccessKey
 * @property {string} validationResult
 */

/**
 * Structure of ABTNodeClient.AuditLog
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.AuditLog
 * @property {string} id
 * @property {string} scope
 * @property {string} category
 * @property {string} action
 * @property {string} content
 * @property {...ABTNodeClient.AuditLogActor} actor
 * @property {...ABTNodeClient.AuditLogEnv} env
 * @property {number} createdAt
 * @property {string} ip
 * @property {string} ua
 * @property {string} componentDid
 */

/**
 * Structure of ABTNodeClient.AuditLogActor
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.AuditLogActor
 * @property {string} did
 * @property {string} role
 * @property {string} fullName
 * @property {string} avatar
 * @property {string} source
 */

/**
 * Structure of ABTNodeClient.AuditLogEnv
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.AuditLogEnv
 * @property {...ABTNodeClient.AuditLogEnvItem} browser
 * @property {...ABTNodeClient.AuditLogEnvItem} os
 */

/**
 * Structure of ABTNodeClient.AuditLogEnvItem
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.AuditLogEnvItem
 * @property {string} name
 * @property {string} version
 */

/**
 * Structure of ABTNodeClient.AutoBackup
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.AutoBackup
 * @property {boolean} enabled
 */

/**
 * Structure of ABTNodeClient.AutoBlockPolicy
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.AutoBlockPolicy
 * @property {boolean} enabled
 * @property {number} windowSize
 * @property {number} windowQuota
 * @property {number} blockDuration
 * @property {Array<...ABTNodeClient.null>} statusCodes
 */

/**
 * Structure of ABTNodeClient.AutoCheckUpdate
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.AutoCheckUpdate
 * @property {boolean} enabled
 */

/**
 * Structure of ABTNodeClient.Backup
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.Backup
 * @property {string} appPid
 * @property {string} userDid
 * @property {number} strategy
 * @property {string} sourceUrl
 * @property {string} target
 * @property {string} targetName
 * @property {string} targetUrl
 * @property {number} createdAt
 * @property {number} updatedAt
 * @property {number} status
 * @property {string} message
 * @property {number} progress
 * @property {any} metadata
 */

/**
 * Structure of ABTNodeClient.BackupSummaryItem
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.BackupSummaryItem
 * @property {string} date
 * @property {number} successCount
 * @property {number} errorCount
 */

/**
 * Structure of ABTNodeClient.BaseUserInfo
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.BaseUserInfo
 * @property {string} did
 * @property {string} pk
 * @property {string} role
 * @property {string} avatar
 * @property {string} fullName
 * @property {string} email
 * @property {boolean} approved
 * @property {number} createdAt
 * @property {number} updatedAt
 * @property {string} locale
 */

/**
 * Structure of ABTNodeClient.BlockPolicy
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.BlockPolicy
 * @property {boolean} enabled
 * @property {Array<...ABTNodeClient.null>} blacklist
 * @property {...ABTNodeClient.AutoBlockPolicy} autoBlocking
 */

/**
 * Structure of ABTNodeClient.BlockletAccessPolicy
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.BlockletAccessPolicy
 * @property {string} id
 * @property {string} name
 * @property {string} description
 * @property {any} roles
 * @property {boolean} reverse
 * @property {boolean} isProtected
 */

/**
 * Structure of ABTNodeClient.BlockletBackupState
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.BlockletBackupState
 * @property {string} appDid
 * @property {string} appPid
 * @property {string} name
 * @property {number} createdAt
 */

/**
 * Structure of ABTNodeClient.BlockletCapabilities
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.BlockletCapabilities
 * @property {boolean} clusterMode
 * @property {boolean} component
 * @property {boolean} navigation
 * @property {string} didSpace
 * @property {string} resourceExportApi
 */

/**
 * Structure of ABTNodeClient.BlockletController
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.BlockletController
 * @property {string} id
 * @property {string} nftId
 * @property {string} nftOwner
 * @property {string} chainHost
 * @property {number} expireDate
 * @property {string} consumedAt
 * @property {string} launcherUrl
 * @property {string} launcherSessionId
 * @property {string} ownerDid
 * @property {...ABTNodeClient.BlockletControllerStatus} status
 */

/**
 * Structure of ABTNodeClient.BlockletControllerStatus
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.BlockletControllerStatus
 * @property {number} value
 * @property {string} reason
 */

/**
 * Structure of ABTNodeClient.BlockletDiff
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.BlockletDiff
 * @property {boolean} hasBlocklet
 * @property {string} version
 * @property {Array<...ABTNodeClient.null>} addSet
 * @property {Array<...ABTNodeClient.null>} changeSet
 * @property {Array<...ABTNodeClient.null>} deleteSet
 */

/**
 * Structure of ABTNodeClient.BlockletDist
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.BlockletDist
 * @property {string} tarball
 * @property {string} integrity
 */

/**
 * Structure of ABTNodeClient.BlockletDocker
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.BlockletDocker
 * @property {string} dockerImage
 * @property {Array<...ABTNodeClient.null>} dockerArgs
 * @property {Array<...ABTNodeClient.null>} dockerEnvs
 * @property {string} dockerCommand
 */

/**
 * Structure of ABTNodeClient.BlockletDockerMeta
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.BlockletDockerMeta
 * @property {string} image
 * @property {string} shell
 * @property {boolean} runBaseScript
 * @property {boolean} installNodeModules
 */

/**
 * Structure of ABTNodeClient.BlockletEngine
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.BlockletEngine
 * @property {string} name
 * @property {string} displayName
 * @property {string} description
 * @property {string} version
 * @property {boolean} available
 * @property {boolean} visible
 * @property {string} logo
 */

/**
 * Structure of ABTNodeClient.BlockletEvent
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.BlockletEvent
 * @property {string} type
 * @property {string} description
 */

/**
 * Structure of ABTNodeClient.BlockletHistoryItem
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.BlockletHistoryItem
 * @property {number} date
 * @property {number} cpu
 * @property {number} mem
 */

/**
 * Structure of ABTNodeClient.BlockletHistoryItemList
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.BlockletHistoryItemList
 * @property {string} key
 * @property {Array<...ABTNodeClient.null>} value
 */

/**
 * Structure of ABTNodeClient.BlockletIntegrations
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.BlockletIntegrations
 * @property {number} webhooks
 * @property {number} accessKeys
 * @property {number} oauthApps
 */

/**
 * Structure of ABTNodeClient.BlockletMeta
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.BlockletMeta
 * @property {string} did
 * @property {string} name
 * @property {string} version
 * @property {string} description
 * @property {Array<...ABTNodeClient.null>} interfaces
 * @property {...ABTNodeClient.BlockletMetaPerson} author
 * @property {string} main
 * @property {...ABTNodeClient.BlockletStats} stats
 * @property {string} homepage
 * @property {string} path
 * @property {string} community
 * @property {string} documentation
 * @property {string} support
 * @property {Array<...ABTNodeClient.null>} screenshots
 * @property {Array<...ABTNodeClient.null>} keywords
 * @property {string} group
 * @property {string} logo
 * @property {string} title
 * @property {...ABTNodeClient.BlockletDist} dist
 * @property {Array<...ABTNodeClient.null>} maintainers
 * @property {Array<...ABTNodeClient.null>} contributors
 * @property {...ABTNodeClient.BlockletRepository} repository
 * @property {...ABTNodeClient.BlockletPayment} payment
 * @property {string} nftFactory
 * @property {number} lastPublishedAt
 * @property {...ABTNodeClient.BlockletCapabilities} capabilities
 * @property {Array<...ABTNodeClient.null>} components
 * @property {Array<...ABTNodeClient.null>} environments
 * @property {...ABTNodeClient.Requirement} requirements
 * @property {string} bundleDid
 * @property {string} bundleName
 * @property {Array<...ABTNodeClient.null>} navigation
 * @property {Array<...ABTNodeClient.null>} resources
 * @property {...ABTNodeClient.BlockletResource} resource
 * @property {any} engine
 * @property {...ABTNodeClient.BlockletMetaOwner} owner
 * @property {...ABTNodeClient.BlockletDockerMeta} docker
 * @property {Array<...ABTNodeClient.null>} events
 */

/**
 * Structure of ABTNodeClient.BlockletMetaInterface
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.BlockletMetaInterface
 * @property {string} type
 * @property {string} name
 * @property {string} path
 * @property {string} prefix
 * @property {string} protocol
 * @property {any} port
 * @property {Array<...ABTNodeClient.null>} services
 * @property {Array<...ABTNodeClient.null>} cacheable
 * @property {Array<...ABTNodeClient.null>} pageGroups
 */

/**
 * Structure of ABTNodeClient.BlockletMetaOwner
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.BlockletMetaOwner
 * @property {string} avatar
 * @property {string} did
 * @property {string} email
 * @property {string} fullName
 */

/**
 * Structure of ABTNodeClient.BlockletMetaPerson
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.BlockletMetaPerson
 * @property {string} name
 * @property {string} email
 * @property {string} url
 */

/**
 * Structure of ABTNodeClient.BlockletMetaService
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.BlockletMetaService
 * @property {string} name
 * @property {any} config
 */

/**
 * Structure of ABTNodeClient.BlockletMigrateRecord
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.BlockletMigrateRecord
 * @property {string} appSk
 * @property {string} appDid
 * @property {string} at
 */

/**
 * Structure of ABTNodeClient.BlockletPassport
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.BlockletPassport
 * @property {number} passports
 * @property {number} activePassports
 */

/**
 * Structure of ABTNodeClient.BlockletPayment
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.BlockletPayment
 * @property {Array<...ABTNodeClient.null>} price
 * @property {Array<...ABTNodeClient.null>} share
 */

/**
 * Structure of ABTNodeClient.BlockletPaymentPrice
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.BlockletPaymentPrice
 * @property {string} address
 * @property {string} value
 * @property {string} symbol
 */

/**
 * Structure of ABTNodeClient.BlockletPaymentShare
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.BlockletPaymentShare
 * @property {string} address
 * @property {string} name
 * @property {string} value
 */

/**
 * Structure of ABTNodeClient.BlockletPreUpdateInfo
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.BlockletPreUpdateInfo
 * @property {string} updateId
 * @property {Array<...ABTNodeClient.null>} updateList
 */

/**
 * Structure of ABTNodeClient.BlockletRepository
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.BlockletRepository
 * @property {string} type
 * @property {string} url
 */

/**
 * Structure of ABTNodeClient.BlockletResource
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.BlockletResource
 * @property {string} exportApi
 * @property {Array<...ABTNodeClient.null>} types
 * @property {Array<...ABTNodeClient.null>} bundles
 */

/**
 * Structure of ABTNodeClient.BlockletResourceBundle
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.BlockletResourceBundle
 * @property {string} did
 * @property {string} type
 * @property {boolean} public
 */

/**
 * Structure of ABTNodeClient.BlockletResourceType
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.BlockletResourceType
 * @property {string} type
 * @property {string} description
 */

/**
 * Structure of ABTNodeClient.BlockletResponseHeaderPolicy
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.BlockletResponseHeaderPolicy
 * @property {string} id
 * @property {string} name
 * @property {string} description
 * @property {string} securityHeader
 * @property {string} cors
 * @property {string} customHeader
 * @property {string} removeHeader
 * @property {boolean} isProtected
 */

/**
 * Structure of ABTNodeClient.BlockletSecurityRule
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.BlockletSecurityRule
 * @property {string} id
 * @property {string} pathPattern
 * @property {string} componentDid
 * @property {number} priority
 * @property {string} responseHeaderPolicyId
 * @property {string} accessPolicyId
 * @property {boolean} enabled
 * @property {string} remark
 * @property {...ABTNodeClient.BlockletAccessPolicy} accessPolicy
 * @property {...ABTNodeClient.BlockletResponseHeaderPolicy} responseHeaderPolicy
 */

/**
 * Structure of ABTNodeClient.BlockletSettings
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.BlockletSettings
 * @property {boolean} initialized
 * @property {boolean} enablePassportIssuance
 * @property {Array<...ABTNodeClient.null>} trustedPassports
 * @property {string} whoCanAccess
 * @property {...ABTNodeClient.WalletInfo} owner
 * @property {Array<...ABTNodeClient.null>} children
 * @property {boolean} publicToStore
 * @property {Array<...ABTNodeClient.null>} storeList
 * @property {Array<...ABTNodeClient.null>} navigations
 * @property {any} authentication
 * @property {Array<...ABTNodeClient.null>} trustedFactories
 * @property {any} notification
 * @property {...ABTNodeClient.SessionConfig} session
 * @property {...ABTNodeClient.FederatedConfig} federated
 * @property {...ABTNodeClient.AutoCheckUpdate} autoCheckUpdate
 * @property {...ABTNodeClient.AutoBackup} autoBackup
 * @property {...ABTNodeClient.InviteSettings} invite
 * @property {any} theme
 * @property {Array<...ABTNodeClient.null>} endpointList
 * @property {...ABTNodeClient.Gateway} gateway
 * @property {boolean} enableSessionHardening
 * @property {...ABTNodeClient.AigneConfig} aigne
 * @property {...ABTNodeClient.OrgSettings} org
 * @property {any} didConnect
 * @property {any} oauth
 * @property {any} actionConfig
 * @property {...ABTNodeClient.SubServiceConfig} subService
 */

/**
 * Structure of ABTNodeClient.BlockletState
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.BlockletState
 * @property {...ABTNodeClient.BlockletMeta} meta
 * @property {...ABTNodeClient.BlockletStatus} status
 * @property {number} createdAt
 * @property {number} installedAt
 * @property {number} startedAt
 * @property {number} pausedAt
 * @property {number} stoppedAt
 * @property {number} updatedAt
 * @property {Array<...ABTNodeClient.null>} environments
 * @property {Array<...ABTNodeClient.null>} configs
 * @property {...ABTNodeClient.DiskInfo} diskInfo
 * @property {...ABTNodeClient.RuntimeInfo} runtimeInfo
 * @property {...ABTNodeClient.RuntimeInfo} appRuntimeInfo
 * @property {...ABTNodeClient.BlockletSource} source
 * @property {string} deployedFrom
 * @property {any} bundleSource
 * @property {number} port
 * @property {...ABTNodeClient.BlockletEngine} engine
 * @property {string} mode
 * @property {any} ports
 * @property {Array<...ABTNodeClient.null>} children
 * @property {Array<...ABTNodeClient.null>} optionalComponents
 * @property {Array<...ABTNodeClient.null>} trustedPassports
 * @property {Array<...ABTNodeClient.null>} trustedFactories
 * @property {boolean} enablePassportIssuance
 * @property {boolean} dynamic
 * @property {string} mountPoint
 * @property {...ABTNodeClient.BlockletSettings} settings
 * @property {string} appDid
 * @property {...ABTNodeClient.RoutingSite} site
 * @property {...ABTNodeClient.BlockletController} controller
 * @property {Array<...ABTNodeClient.null>} migratedFrom
 * @property {string} appPid
 * @property {boolean} externalSk
 * @property {string} externalSkSource
 * @property {string} structVersion
 * @property {boolean} enableDocker
 * @property {boolean} enableDockerNetwork
 * @property {Array<...ABTNodeClient.null>} vaults
 */

/**
 * Structure of ABTNodeClient.BlockletStats
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.BlockletStats
 * @property {number} downloads
 * @property {number} star
 * @property {number} purchases
 */

/**
 * Structure of ABTNodeClient.BlockletStore
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.BlockletStore
 * @property {string} name
 * @property {string} description
 * @property {string} url
 * @property {string} logoUrl
 * @property {string} maintainer
 * @property {string} cdnUrl
 * @property {boolean} protected
 * @property {string} id
 * @property {string} scope
 */

/**
 * Structure of ABTNodeClient.BlockletStudio
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.BlockletStudio
 * @property {number} blocklets
 * @property {number} releases
 */

/**
 * Structure of ABTNodeClient.BlockletTraffic
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.BlockletTraffic
 * @property {number} totalRequests
 * @property {number} failedRequests
 */

/**
 * Structure of ABTNodeClient.BlockletUsers
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.BlockletUsers
 * @property {number} users
 * @property {number} approvedUsers
 */

/**
 * Structure of ABTNodeClient.BlockletVaultRecord
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.BlockletVaultRecord
 * @property {string} pk
 * @property {string} did
 * @property {number} at
 * @property {string} sig
 * @property {string} approverSig
 * @property {string} approverDid
 * @property {string} approverPk
 */

/**
 * Structure of ABTNodeClient.BooleanResponse
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.BooleanResponse
 * @property {...ABTNodeClient.StatusCode} code
 * @property {boolean} result
 */

/**
 * Structure of ABTNodeClient.Certificate
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.Certificate
 * @property {string} name
 * @property {string} domain
 * @property {string} id
 * @property {...ABTNodeClient.CertificateMeta} meta
 * @property {Array<...ABTNodeClient.null>} matchedSites
 * @property {number} createdAt
 * @property {number} updatedAt
 * @property {boolean} isProtected
 * @property {string} source
 * @property {string} status
 */

/**
 * Structure of ABTNodeClient.CertificateIssuer
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.CertificateIssuer
 * @property {string} countryName
 * @property {string} organizationName
 * @property {string} commonName
 */

/**
 * Structure of ABTNodeClient.CertificateMeta
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.CertificateMeta
 * @property {...ABTNodeClient.CertificateIssuer} issuer
 * @property {Array<...ABTNodeClient.null>} sans
 * @property {number} validFrom
 * @property {number} validTo
 * @property {string} fingerprintAlg
 * @property {string} fingerprint
 * @property {number} validityPeriod
 */

/**
 * Structure of ABTNodeClient.ChildConfig
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.ChildConfig
 * @property {string} name
 * @property {string} mountPoint
 * @property {boolean} required
 */

/**
 * Structure of ABTNodeClient.ComponentState
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.ComponentState
 * @property {...ABTNodeClient.BlockletMeta} meta
 * @property {...ABTNodeClient.BlockletStatus} status
 * @property {number} createdAt
 * @property {number} installedAt
 * @property {number} startedAt
 * @property {number} pausedAt
 * @property {number} stoppedAt
 * @property {Array<...ABTNodeClient.null>} environments
 * @property {Array<...ABTNodeClient.null>} configs
 * @property {...ABTNodeClient.DiskInfo} diskInfo
 * @property {...ABTNodeClient.RuntimeInfo} runtimeInfo
 * @property {...ABTNodeClient.BlockletSource} source
 * @property {string} deployedFrom
 * @property {any} bundleSource
 * @property {number} port
 * @property {...ABTNodeClient.BlockletEngine} engine
 * @property {string} mode
 * @property {any} ports
 * @property {Array<...ABTNodeClient.null>} children
 * @property {boolean} dynamic
 * @property {string} mountPoint
 * @property {Array<...ABTNodeClient.null>} dependents
 * @property {boolean} required
 * @property {...ABTNodeClient.RuntimeInfo} appRuntimeInfo
 * @property {...ABTNodeClient.BlockletStatus} greenStatus
 */

/**
 * Structure of ABTNodeClient.ConfigEntry
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.ConfigEntry
 * @property {string} key
 * @property {string} value
 * @property {boolean} required
 * @property {string} description
 * @property {string} validation
 * @property {boolean} secure
 * @property {boolean} custom
 * @property {boolean} shared
 */

/**
 * Structure of ABTNodeClient.ConfigNavigation
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.ConfigNavigation
 * @property {string} id
 * @property {string} title
 * @property {string} link
 * @property {string} icon
 * @property {string} section
 * @property {string} component
 * @property {string} parent
 * @property {string} role
 * @property {boolean} visible
 * @property {string} from
 * @property {string} activeIcon
 * @property {string} color
 * @property {string} activeColor
 * @property {string} description
 * @property {boolean} private
 */

/**
 * Structure of ABTNodeClient.ConnectEndpoint
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.ConnectEndpoint
 * @property {string} id
 * @property {string} scope
 * @property {string} url
 * @property {string} endpoint
 * @property {boolean} protected
 * @property {string} appName
 * @property {string} appDescription
 */

/**
 * Structure of ABTNodeClient.ConnectedAccount
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.ConnectedAccount
 * @property {string} provider
 * @property {string} did
 * @property {string} pk
 * @property {string} id
 * @property {number} lastLoginAt
 * @property {...ABTNodeClient.ConnectedAccountInfo} userInfo
 * @property {any} extra
 */

/**
 * Structure of ABTNodeClient.ConnectedAccountInfo
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.ConnectedAccountInfo
 * @property {string} name
 * @property {string} picture
 * @property {string} email
 * @property {boolean} emailVerified
 * @property {string} sub
 * @property {any} extraData
 */

/**
 * Structure of ABTNodeClient.ConnectedEndpoint
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.ConnectedEndpoint
 * @property {string} endpointId
 * @property {string} accessKeyId
 * @property {string} accessKeySecret
 * @property {string} expireId
 * @property {string} developerDid
 * @property {string} developerName
 * @property {string} developerEmail
 * @property {string} createdBy
 */

/**
 * Structure of ABTNodeClient.ConnectedStore
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.ConnectedStore
 * @property {string} storeId
 * @property {string} storeName
 * @property {string} storeUrl
 * @property {string} accessToken
 * @property {string} developerDid
 * @property {string} developerEmail
 * @property {string} developerName
 * @property {string} scope
 */

/**
 * Structure of ABTNodeClient.CreateAccessKey
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.CreateAccessKey
 * @property {string} accessKeyId
 * @property {string} accessKeyPublic
 * @property {string} accessKeySecret
 * @property {string} remark
 * @property {string} passport
 * @property {number} createdAt
 * @property {number} lastUsedAt
 * @property {string} authType
 * @property {string} componentDid
 * @property {string} resourceType
 * @property {string} resourceId
 * @property {string} createdVia
 * @property {number} expireAt
 */

/**
 * Structure of ABTNodeClient.DelegationState
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.DelegationState
 * @property {boolean} delegated
 */

/**
 * Structure of ABTNodeClient.Dependent
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.Dependent
 * @property {string} id
 * @property {boolean} required
 */

/**
 * Structure of ABTNodeClient.DiskInfo
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.DiskInfo
 * @property {number} app
 * @property {number} data
 * @property {number} log
 * @property {number} cache
 * @property {number} blocklets
 */

/**
 * Structure of ABTNodeClient.DockerEnvKeyValuePair
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.DockerEnvKeyValuePair
 * @property {string} key
 * @property {string} value
 * @property {string} description
 * @property {boolean} secure
 * @property {boolean} shared
 * @property {boolean} required
 * @property {string} custom
 */

/**
 * Structure of ABTNodeClient.DockerRunKeyValuePair
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.DockerRunKeyValuePair
 * @property {string} key
 * @property {string} value
 * @property {string} path
 * @property {string} type
 * @property {string} name
 * @property {string} prefix
 * @property {string} protocol
 * @property {string} proxyBehavior
 */

/**
 * Structure of ABTNodeClient.EnableEvent
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.EnableEvent
 * @property {string} type
 * @property {string} source
 */

/**
 * Structure of ABTNodeClient.Environment
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.Environment
 * @property {string} name
 * @property {string} description
 * @property {string} default
 * @property {boolean} required
 * @property {boolean} secure
 * @property {string} validation
 * @property {boolean} shared
 */

/**
 * Structure of ABTNodeClient.FederatedConfig
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.FederatedConfig
 * @property {...ABTNodeClient.FederatedConfigDetail} config
 * @property {Array<...ABTNodeClient.null>} sites
 */

/**
 * Structure of ABTNodeClient.FederatedConfigDetail
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.FederatedConfigDetail
 * @property {string} appId
 * @property {string} appPid
 * @property {string} delegation
 * @property {boolean} isMaster
 * @property {boolean} autoLogin
 */

/**
 * Structure of ABTNodeClient.FederatedConfigSite
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.FederatedConfigSite
 * @property {string} appId
 * @property {string} appPid
 * @property {Array<...ABTNodeClient.null>} aliasDid
 * @property {string} appName
 * @property {string} appDescription
 * @property {string} appUrl
 * @property {Array<...ABTNodeClient.null>} aliasDomain
 * @property {string} appLogo
 * @property {string} appLogoRect
 * @property {string} did
 * @property {string} pk
 * @property {string} version
 * @property {string} serverId
 * @property {string} serverVersion
 * @property {number} appliedAt
 * @property {string} status
 * @property {boolean} isMaster
 */

/**
 * Structure of ABTNodeClient.Fuel
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.Fuel
 * @property {string} endpoint
 * @property {string} address
 * @property {string} value
 * @property {string} reason
 */

/**
 * Structure of ABTNodeClient.Gateway
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.Gateway
 * @property {...ABTNodeClient.RequestLimit} requestLimit
 * @property {...ABTNodeClient.BlockPolicy} blockPolicy
 * @property {...ABTNodeClient.ProxyPolicy} proxyPolicy
 * @property {boolean} cacheEnabled
 * @property {...ABTNodeClient.WAFPolicy} wafPolicy
 */

/**
 * Structure of ABTNodeClient.GeneralResponse
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.GeneralResponse
 * @property {...ABTNodeClient.StatusCode} code
 */

/**
 * Structure of ABTNodeClient.IPInfo
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.IPInfo
 * @property {string} internalV4
 * @property {string} externalV4
 * @property {string} internalV6
 * @property {string} externalV6
 */

/**
 * Structure of ABTNodeClient.InviteInfo
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.InviteInfo
 * @property {string} inviteId
 * @property {string} role
 * @property {string} remark
 * @property {string} expireDate
 * @property {...ABTNodeClient.UserInfo} inviter
 * @property {string} teamDid
 * @property {string} interfaceName
 * @property {...ABTNodeClient.PassportDisplay} display
 * @property {string} orgId
 * @property {Array<...ABTNodeClient.null>} inviteUserDids
 */

/**
 * Structure of ABTNodeClient.InviteResult
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.InviteResult
 * @property {Array<...ABTNodeClient.null>} successDids
 * @property {Array<...ABTNodeClient.null>} failedDids
 * @property {string} inviteLink
 */

/**
 * Structure of ABTNodeClient.InviteSettings
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.InviteSettings
 * @property {boolean} enabled
 */

/**
 * Structure of ABTNodeClient.Issuer
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.Issuer
 * @property {string} id
 * @property {string} name
 * @property {string} pk
 */

/**
 * Structure of ABTNodeClient.KeyValue
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.KeyValue
 * @property {string} key
 * @property {any} value
 */

/**
 * Structure of ABTNodeClient.LauncherInfo
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.LauncherInfo
 * @property {string} did
 * @property {string} type
 * @property {string} provider
 * @property {string} url
 * @property {string} tag
 * @property {string} chainHost
 */

/**
 * Structure of ABTNodeClient.LoginEmailSettings
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.LoginEmailSettings
 * @property {boolean} enabled
 * @property {boolean} requireVerified
 * @property {boolean} requireUnique
 * @property {boolean} trustOauthProviders
 * @property {boolean} enableDomainBlackList
 * @property {Array<...ABTNodeClient.null>} domainBlackList
 * @property {boolean} enableDomainWhiteList
 * @property {Array<...ABTNodeClient.null>} domainWhiteList
 * @property {Array<...ABTNodeClient.null>} trustedIssuers
 */

/**
 * Structure of ABTNodeClient.LoginPhoneSettings
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.LoginPhoneSettings
 * @property {boolean} enabled
 * @property {boolean} requireVerified
 * @property {boolean} requireUnique
 * @property {Array<...ABTNodeClient.null>} trustedIssuers
 * @property {boolean} enableRegionBlackList
 * @property {Array<...ABTNodeClient.null>} regionBlackList
 * @property {boolean} enableRegionWhiteList
 * @property {Array<...ABTNodeClient.null>} regionWhiteList
 */

/**
 * Structure of ABTNodeClient.MatchedSites
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.MatchedSites
 * @property {string} id
 * @property {string} domain
 */

/**
 * Structure of ABTNodeClient.Mutation
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.Mutation
 * @property {...ABTNodeClient.ResponseBlocklet} installBlocklet
 * @property {...ABTNodeClient.ResponseBlocklet} installComponent
 * @property {...ABTNodeClient.ResponseBlocklet} startBlocklet
 * @property {...ABTNodeClient.ResponseBlocklet} stopBlocklet
 * @property {...ABTNodeClient.ResponseBlocklet} reloadBlocklet
 * @property {...ABTNodeClient.ResponseBlocklet} restartBlocklet
 * @property {...ABTNodeClient.ResponseBlocklet} deleteBlocklet
 * @property {...ABTNodeClient.ResponseBlocklet} deleteComponent
 * @property {...ABTNodeClient.ResponseBlocklet} cancelDownloadBlocklet
 * @property {...ABTNodeClient.ResponseCheckComponentsForUpdates} checkComponentsForUpdates
 * @property {...ABTNodeClient.ResponseBlocklet} upgradeComponents
 * @property {...ABTNodeClient.ResponseBlocklet} configBlocklet
 * @property {...ABTNodeClient.ResponseBlocklet} configPublicToStore
 * @property {...ABTNodeClient.ResponseBlocklet} configNavigations
 * @property {...ABTNodeClient.ResponseBlocklet} configAuthentication
 * @property {...ABTNodeClient.ResponseBlocklet} configDidConnect
 * @property {...ABTNodeClient.ResponseBlocklet} configDidConnectActions
 * @property {...ABTNodeClient.ResponseBlocklet} configNotification
 * @property {...ABTNodeClient.ResponseConfigVault} configVault
 * @property {...ABTNodeClient.GeneralResponse} sendEmail
 * @property {...ABTNodeClient.GeneralResponse} sendPush
 * @property {...ABTNodeClient.ResponseBlocklet} joinFederatedLogin
 * @property {...ABTNodeClient.ResponseBlocklet} quitFederatedLogin
 * @property {...ABTNodeClient.ResponseBlocklet} disbandFederatedLogin
 * @property {...ABTNodeClient.ResponseBlocklet} syncMasterAuthorization
 * @property {...ABTNodeClient.ResponseBlocklet} syncFederatedConfig
 * @property {...ABTNodeClient.ResponseBlocklet} auditFederatedLogin
 * @property {...ABTNodeClient.ResponseBlocklet} updateAppSessionConfig
 * @property {...ABTNodeClient.ResponseBlocklet} updateComponentTitle
 * @property {...ABTNodeClient.ResponseBlocklet} updateComponentMountPoint
 * @property {...ABTNodeClient.GeneralResponse} backupBlocklet
 * @property {...ABTNodeClient.GeneralResponse} abortBlockletBackup
 * @property {...ABTNodeClient.GeneralResponse} restoreBlocklet
 * @property {...ABTNodeClient.GeneralResponse} migrateApplicationToStructV2
 * @property {...ABTNodeClient.ResponseLaunchBlockletByLauncher} launchBlockletByLauncher
 * @property {...ABTNodeClient.ResponseLaunchBlockletWithoutWallet} launchBlockletWithoutWallet
 * @property {...ABTNodeClient.GeneralResponse} addBlockletSpaceGateway
 * @property {...ABTNodeClient.GeneralResponse} deleteBlockletSpaceGateway
 * @property {...ABTNodeClient.GeneralResponse} updateBlockletSpaceGateway
 * @property {...ABTNodeClient.GeneralResponse} updateAutoBackup
 * @property {...ABTNodeClient.GeneralResponse} updateAutoCheckUpdate
 * @property {...ABTNodeClient.GeneralResponse} updateBlockletSettings
 * @property {...ABTNodeClient.ResponseGetNodeInfo} updateNodeInfo
 * @property {...ABTNodeClient.ResponseUpgradeNodeVersion} upgradeNodeVersion
 * @property {...ABTNodeClient.ResponseRestartServer} restartServer
 * @property {...ABTNodeClient.ResponseResetNode} resetNode
 * @property {...ABTNodeClient.GeneralResponse} rotateSessionKey
 * @property {...ABTNodeClient.ResponseGateway} updateGateway
 * @property {...ABTNodeClient.ResponseClearCache} clearCache
 * @property {...ABTNodeClient.ResponseCreateInvitation} createMemberInvitation
 * @property {...ABTNodeClient.ResponseCreateTransferNodeInvitation} createTransferInvitation
 * @property {...ABTNodeClient.GeneralResponse} deleteInvitation
 * @property {...ABTNodeClient.ResponseCreatePassportIssuance} createPassportIssuance
 * @property {...ABTNodeClient.GeneralResponse} deletePassportIssuance
 * @property {...ABTNodeClient.GeneralResponse} configTrustedPassports
 * @property {...ABTNodeClient.GeneralResponse} configTrustedFactories
 * @property {...ABTNodeClient.GeneralResponse} configPassportIssuance
 * @property {...ABTNodeClient.ResponseUser} removeUser
 * @property {...ABTNodeClient.ResponseUser} updateUserTags
 * @property {...ABTNodeClient.ResponseUser} updateUserExtra
 * @property {...ABTNodeClient.ResponseUser} updateUserApproval
 * @property {...ABTNodeClient.ResponseUser} issuePassportToUser
 * @property {...ABTNodeClient.ResponseUser} revokeUserPassport
 * @property {...ABTNodeClient.ResponseUser} enableUserPassport
 * @property {...ABTNodeClient.GeneralResponse} removeUserPassport
 * @property {...ABTNodeClient.ResponseUser} switchProfile
 * @property {...ABTNodeClient.ResponseUser} updateUserAddress
 * @property {...ABTNodeClient.ResponseUser} updateUserInfo
 * @property {...ABTNodeClient.ResponseRole} createRole
 * @property {...ABTNodeClient.ResponseRole} updateRole
 * @property {...ABTNodeClient.GeneralResponse} deleteRole
 * @property {...ABTNodeClient.ResponsePermission} createPermission
 * @property {...ABTNodeClient.ResponsePermission} updatePermission
 * @property {...ABTNodeClient.GeneralResponse} deletePermission
 * @property {...ABTNodeClient.GeneralResponse} grantPermissionForRole
 * @property {...ABTNodeClient.GeneralResponse} revokePermissionFromRole
 * @property {...ABTNodeClient.ResponseRole} updatePermissionsForRole
 * @property {...ABTNodeClient.BooleanResponse} hasPermission
 * @property {...ABTNodeClient.GeneralResponse} addBlockletStore
 * @property {...ABTNodeClient.GeneralResponse} deleteBlockletStore
 * @property {...ABTNodeClient.ResponseTag} getTag
 * @property {...ABTNodeClient.ResponseTag} createTag
 * @property {...ABTNodeClient.ResponseTag} updateTag
 * @property {...ABTNodeClient.ResponseTag} deleteTag
 * @property {...ABTNodeClient.ResponseTagging} createTagging
 * @property {...ABTNodeClient.ResponseTagging} deleteTagging
 * @property {...ABTNodeClient.ResponseReadNotifications} readNotifications
 * @property {...ABTNodeClient.ResponseReadNotifications} unreadNotifications
 * @property {...ABTNodeClient.ResponseRoutingSite} addRoutingSite
 * @property {...ABTNodeClient.ResponseRoutingSite} addDomainAlias
 * @property {...ABTNodeClient.ResponseRoutingSite} deleteDomainAlias
 * @property {...ABTNodeClient.GeneralResponse} deleteRoutingSite
 * @property {...ABTNodeClient.ResponseRoutingSite} updateRoutingSite
 * @property {...ABTNodeClient.ResponseRoutingSite} addRoutingRule
 * @property {...ABTNodeClient.ResponseRoutingSite} updateRoutingRule
 * @property {...ABTNodeClient.ResponseRoutingSite} deleteRoutingRule
 * @property {...ABTNodeClient.ResponseUpdateNginxHttpsCert} updateCertificate
 * @property {...ABTNodeClient.ResponseAddNginxHttpsCert} addCertificate
 * @property {...ABTNodeClient.ResponseDeleteNginxHttpsCert} deleteCertificate
 * @property {...ABTNodeClient.ResponseAddLetsEncryptCert} issueLetsEncryptCert
 * @property {...ABTNodeClient.ResponseCreateAccessKey} createAccessKey
 * @property {...ABTNodeClient.ResponseUpdateAccessKey} updateAccessKey
 * @property {...ABTNodeClient.ResponseDeleteAccessKey} deleteAccessKey
 * @property {...ABTNodeClient.ResponseAccessKey} verifyAccessKey
 * @property {...ABTNodeClient.ResponseCreateWebHook} createWebHook
 * @property {...ABTNodeClient.ResponseDeleteWebHook} deleteWebHook
 * @property {...ABTNodeClient.ResponseCreateWebhookEndpoint} updateWebHookState
 * @property {...ABTNodeClient.ResponseProject} createProject
 * @property {...ABTNodeClient.ResponseProject} updateProject
 * @property {...ABTNodeClient.GeneralResponse} deleteProject
 * @property {...ABTNodeClient.ResponseRelease} createRelease
 * @property {...ABTNodeClient.GeneralResponse} deleteRelease
 * @property {...ABTNodeClient.GeneralResponse} updateSelectedResources
 * @property {...ABTNodeClient.ResponseConnectToStore} connectToStore
 * @property {...ABTNodeClient.ResponseDisconnectFromStore} disconnectFromStore
 * @property {...ABTNodeClient.ResponsePublishToStore} publishToStore
 * @property {...ABTNodeClient.ResponseConnectByStudio} connectByStudio
 * @property {...ABTNodeClient.ResponseBlockletSecurityRule} addBlockletSecurityRule
 * @property {...ABTNodeClient.ResponseBlockletSecurityRule} updateBlockletSecurityRule
 * @property {...ABTNodeClient.GeneralResponse} deleteBlockletSecurityRule
 * @property {...ABTNodeClient.ResponseBlockletResponseHeaderPolicy} addBlockletResponseHeaderPolicy
 * @property {...ABTNodeClient.ResponseBlockletResponseHeaderPolicy} updateBlockletResponseHeaderPolicy
 * @property {...ABTNodeClient.GeneralResponse} deleteBlockletResponseHeaderPolicy
 * @property {...ABTNodeClient.ResponseBlockletAccessPolicy} addBlockletAccessPolicy
 * @property {...ABTNodeClient.ResponseBlockletAccessPolicy} updateBlockletAccessPolicy
 * @property {...ABTNodeClient.GeneralResponse} deleteBlockletAccessPolicy
 * @property {...ABTNodeClient.ResponseRestartAllContainers} restartAllContainers
 * @property {...ABTNodeClient.ResponseCreateWebhookEndpoint} createWebhookEndpoint
 * @property {...ABTNodeClient.ResponseUpdateWebhookEndpoint} updateWebhookEndpoint
 * @property {...ABTNodeClient.ResponseDeleteWebhookEndpoint} deleteWebhookEndpoint
 * @property {...ABTNodeClient.ResponseGetWebhookAttempt} retryWebhookAttempt
 * @property {...ABTNodeClient.ResponseRegenerateWebhookEndpointSecret} regenerateWebhookEndpointSecret
 * @property {...ABTNodeClient.GeneralResponse} addUploadEndpoint
 * @property {...ABTNodeClient.GeneralResponse} deleteUploadEndpoint
 * @property {...ABTNodeClient.ResponseConnectToEndpoint} connectToEndpoint
 * @property {...ABTNodeClient.GeneralResponse} disconnectFromEndpoint
 * @property {...ABTNodeClient.ResponsePublishToEndpoint} publishToEndpoint
 * @property {...ABTNodeClient.ResponseConnectToEndpoint} connectToAigne
 * @property {...ABTNodeClient.GeneralResponse} disconnectToAigne
 * @property {...ABTNodeClient.GeneralResponse} verifyAigneConnection
 * @property {...ABTNodeClient.ResponseGetOrg} createOrg
 * @property {...ABTNodeClient.ResponseGetOrg} updateOrg
 * @property {...ABTNodeClient.GeneralResponse} deleteOrg
 * @property {...ABTNodeClient.ResponseGetOrg} addOrgMember
 * @property {...ABTNodeClient.GeneralResponse} removeOrgMember
 * @property {...ABTNodeClient.ResponseInviteMembersToOrg} inviteMembersToOrg
 * @property {...ABTNodeClient.ResponseOrgResourceOperation} addOrgResource
 * @property {...ABTNodeClient.ResponseOrgResourceOperation} migrateOrgResource
 */

/**
 * Structure of ABTNodeClient.NodeEnvInfo
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.NodeEnvInfo
 * @property {...ABTNodeClient.IPInfo} ip
 * @property {string} os
 * @property {string} location
 * @property {boolean} docker
 * @property {boolean} image
 * @property {Array<...ABTNodeClient.null>} blockletEngines
 * @property {boolean} gitpod
 * @property {...ABTNodeClient.DiskInfo} disk
 * @property {string} dbProvider
 * @property {string} routerProvider
 */

/**
 * Structure of ABTNodeClient.NodeHistoryItem
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.NodeHistoryItem
 * @property {number} date
 * @property {number} cpu
 * @property {number} mem
 * @property {number} daemonMem
 * @property {number} serviceMem
 * @property {number} hubMem
 */

/**
 * Structure of ABTNodeClient.NodeRouting
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.NodeRouting
 * @property {string} provider
 * @property {string} snapshotHash
 * @property {string} adminPath
 * @property {...ABTNodeClient.RequestLimit} requestLimit
 * @property {boolean} cacheEnabled
 * @property {...ABTNodeClient.BlockPolicy} blockPolicy
 * @property {...ABTNodeClient.ProxyPolicy} proxyPolicy
 * @property {...ABTNodeClient.WAFPolicy} wafPolicy
 */

/**
 * Structure of ABTNodeClient.NodeRuntimeConfig
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.NodeRuntimeConfig
 * @property {number} blockletMaxMemoryLimit
 * @property {number} daemonMaxMemoryLimit
 */

/**
 * Structure of ABTNodeClient.NodeState
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.NodeState
 * @property {string} did
 * @property {string} pk
 * @property {string} version
 * @property {string} name
 * @property {string} description
 * @property {string} port
 * @property {boolean} initialized
 * @property {...ABTNodeClient.WalletInfo} nodeOwner
 * @property {number} createdAt
 * @property {number} startedAt
 * @property {number} initializedAt
 * @property {string} mode
 * @property {...ABTNodeClient.NodeRouting} routing
 * @property {Array<...ABTNodeClient.null>} environments
 * @property {number} uptime
 * @property {boolean} autoUpgrade
 * @property {string} nextVersion
 * @property {string} upgradeSessionId
 * @property {string} registerUrl
 * @property {boolean} enableWelcomePage
 * @property {string} webWalletUrl
 * @property {Array<...ABTNodeClient.null>} blockletRegistryList
 * @property {...ABTNodeClient.OwnerNft} ownerNft
 * @property {number} diskAlertThreshold
 * @property {Array<...ABTNodeClient.null>} trustedPassports
 * @property {...ABTNodeClient.LauncherInfo} launcher
 * @property {boolean} enablePassportIssuance
 * @property {string} didRegistry
 * @property {string} didDomain
 * @property {number} status
 * @property {Array<...ABTNodeClient.null>} trustedFactories
 * @property {boolean} enableBetaRelease
 * @property {...ABTNodeClient.NodeRuntimeConfig} runtimeConfig
 * @property {string} nftDomainUrl
 * @property {boolean} enableFileSystemIsolation
 * @property {boolean} enableDocker
 * @property {boolean} isDockerInstalled
 * @property {boolean} enableDockerNetwork
 * @property {boolean} enableSessionHardening
 * @property {string} sessionSalt
 */

/**
 * Structure of ABTNodeClient.Notification
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.Notification
 * @property {string} sender
 * @property {string} receiver
 * @property {string} title
 * @property {string} description
 * @property {string} action
 * @property {string} entityType
 * @property {string} entityId
 * @property {boolean} read
 * @property {number} createdAt
 * @property {string} id
 * @property {...ABTNodeClient.Notification_NotificationSeverity} severity
 * @property {...ABTNodeClient.Notification_NotificationSource} source
 * @property {Array<...ABTNodeClient.null>} attachments
 * @property {Array<...ABTNodeClient.null>} blocks
 * @property {Array<...ABTNodeClient.null>} actions
 * @property {string} componentDid
 * @property {...ABTNodeClient.Notification_NotificationType} type
 * @property {Array<...ABTNodeClient.null>} receivers
 * @property {any} data
 * @property {string} feedType
 * @property {...ABTNodeClient.NotificationStatistics} statistics
 * @property {...ABTNodeClient.NotificationActivity} activity
 * @property {...ABTNodeClient.UserInfo} actorInfo
 * @property {any} options
 * @property {...ABTNodeClient.TUTM} utm
 */

/**
 * Structure of ABTNodeClient.NotificationAction
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.NotificationAction
 * @property {string} bgColor
 * @property {string} color
 * @property {string} link
 * @property {string} name
 * @property {string} title
 * @property {...ABTNodeClient.TUTM} utm
 */

/**
 * Structure of ABTNodeClient.NotificationActivity
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.NotificationActivity
 * @property {...ABTNodeClient.NotificationActivity_ActivityTypeEnum} type
 * @property {string} actor
 * @property {any} target
 * @property {any} meta
 */

/**
 * Structure of ABTNodeClient.NotificationAttachment
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.NotificationAttachment
 * @property {any} data
 * @property {any} fields
 * @property {...ABTNodeClient.NotificationAttachmentType} type
 */

/**
 * Structure of ABTNodeClient.NotificationReceiver
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.NotificationReceiver
 * @property {string} id
 * @property {string} notificationId
 * @property {string} receiver
 * @property {boolean} read
 * @property {number} readAt
 * @property {number} walletSendStatus
 * @property {number} walletSendAt
 * @property {number} pushKitSendStatus
 * @property {number} pushKitSendAt
 * @property {number} emailSendStatus
 * @property {number} emailSendAt
 * @property {number} createdAt
 * @property {...ABTNodeClient.UserInfo} receiverUser
 * @property {string} walletSendFailedReason
 * @property {Array<...ABTNodeClient.null>} walletSendRecord
 * @property {string} pushKitSendFailedReason
 * @property {Array<...ABTNodeClient.null>} pushKitSendRecord
 * @property {string} emailSendFailedReason
 * @property {Array<...ABTNodeClient.null>} emailSendRecord
 * @property {any} webhook
 * @property {string} email
 * @property {string} webhookUrls
 * @property {string} deviceId
 */

/**
 * Structure of ABTNodeClient.NotificationSendRecord
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.NotificationSendRecord
 * @property {number} sendStatus
 * @property {number} sendAt
 * @property {string} failedReason
 */

/**
 * Structure of ABTNodeClient.NotificationStatistics
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.NotificationStatistics
 * @property {number} total
 * @property {...ABTNodeClient.Statistics} wallet
 * @property {...ABTNodeClient.Statistics} push
 * @property {...ABTNodeClient.Statistics} email
 * @property {...ABTNodeClient.WebhookStatistics} webhook
 */

/**
 * Structure of ABTNodeClient.OauthClient
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.OauthClient
 * @property {Array<...ABTNodeClient.null>} redirectUris
 * @property {string} tokenEndpointAuthMethod
 * @property {Array<...ABTNodeClient.null>} grantTypes
 * @property {Array<...ABTNodeClient.null>} responseTypes
 * @property {string} clientName
 * @property {string} clientUri
 * @property {string} logoUri
 * @property {string} scope
 * @property {Array<...ABTNodeClient.null>} contacts
 * @property {string} tosUri
 * @property {string} policyUri
 * @property {string} jwksUri
 * @property {string} jwks
 * @property {string} softwareId
 * @property {string} softwareVersion
 * @property {string} clientId
 * @property {number} clientIdIssuedAt
 * @property {string} clientSecret
 * @property {number} clientSecretExpiresAt
 * @property {number} updatedAt
 * @property {string} createdBy
 * @property {...ABTNodeClient.UserInfo} createUser
 */

/**
 * Structure of ABTNodeClient.OptionalComponentState
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.OptionalComponentState
 * @property {string} logoUrl
 * @property {Array<...ABTNodeClient.null>} dependencies
 * @property {...ABTNodeClient.BlockletMeta} meta
 * @property {any} bundleSource
 */

/**
 * Structure of ABTNodeClient.OptionalDependencies
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.OptionalDependencies
 * @property {string} parentDid
 * @property {string} parentName
 * @property {string} parentTitle
 * @property {string} mountPoint
 * @property {boolean} required
 */

/**
 * Structure of ABTNodeClient.Org
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.Org
 * @property {string} id
 * @property {string} name
 * @property {string} description
 * @property {string} ownerDid
 * @property {number} createdAt
 * @property {number} updatedAt
 * @property {Array<...ABTNodeClient.null>} members
 * @property {...ABTNodeClient.UserInfo} owner
 * @property {number} membersCount
 * @property {Array<...ABTNodeClient.null>} passports
 * @property {any} metadata
 * @property {string} avatar
 */

/**
 * Structure of ABTNodeClient.OrgResourceResult
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.OrgResourceResult
 * @property {Array<...ABTNodeClient.null>} success
 * @property {Array<...ABTNodeClient.null>} failed
 */

/**
 * Structure of ABTNodeClient.OrgResources
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.OrgResources
 * @property {string} id
 * @property {string} orgId
 * @property {string} resourceId
 * @property {string} type
 * @property {any} metadata
 * @property {number} createdAt
 * @property {number} updatedAt
 */

/**
 * Structure of ABTNodeClient.OrgSettings
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.OrgSettings
 * @property {boolean} enabled
 * @property {number} maxMemberPerOrg
 * @property {number} maxOrgPerUser
 */

/**
 * Structure of ABTNodeClient.OwnerNft
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.OwnerNft
 * @property {string} did
 * @property {string} holder
 * @property {string} issuer
 * @property {string} launcherSessionId
 */

/**
 * Structure of ABTNodeClient.Paging
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.Paging
 * @property {number} total
 * @property {number} pageSize
 * @property {number} pageCount
 * @property {number} page
 */

/**
 * Structure of ABTNodeClient.Passport
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.Passport
 * @property {string} id
 * @property {string} name
 * @property {string} title
 * @property {...ABTNodeClient.Issuer} issuer
 * @property {Array<...ABTNodeClient.null>} type
 * @property {number} issuanceDate
 * @property {number} expirationDate
 * @property {string} status
 * @property {string} role
 * @property {number} lastLoginAt
 * @property {string} scope
 * @property {...ABTNodeClient.PassportDisplay} display
 * @property {string} source
 * @property {string} parentDid
 * @property {string} userDid
 * @property {...ABTNodeClient.BaseUserInfo} user
 */

/**
 * Structure of ABTNodeClient.PassportDisplay
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.PassportDisplay
 * @property {string} type
 * @property {string} content
 */

/**
 * Structure of ABTNodeClient.PassportIssuanceInfo
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.PassportIssuanceInfo
 * @property {string} id
 * @property {string} name
 * @property {string} title
 * @property {string} expireDate
 * @property {string} teamDid
 * @property {string} ownerDid
 * @property {...ABTNodeClient.PassportDisplay} display
 */

/**
 * Structure of ABTNodeClient.PassportLogState
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.PassportLogState
 * @property {number} id
 * @property {string} passportId
 * @property {string} action
 * @property {string} operatorIp
 * @property {string} operatorUa
 * @property {string} operatorDid
 * @property {any} metadata
 * @property {number} createdAt
 */

/**
 * Structure of ABTNodeClient.Permission
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.Permission
 * @property {string} name
 * @property {string} description
 * @property {boolean} isProtected
 */

/**
 * Structure of ABTNodeClient.Project
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.Project
 * @property {string} id
 * @property {...ABTNodeClient.PublishType} type
 * @property {string} blockletDid
 * @property {string} blockletVersion
 * @property {string} blockletTitle
 * @property {string} blockletDescription
 * @property {string} blockletLogo
 * @property {string} blockletIntroduction
 * @property {Array<...ABTNodeClient.null>} blockletScreenshots
 * @property {string} createdAt
 * @property {string} updatedAt
 * @property {string} componentDid
 * @property {string} lastReleaseId
 * @property {Array<...ABTNodeClient.null>} lastReleaseFiles
 * @property {Array<...ABTNodeClient.null>} connectedStores
 * @property {string} tenantScope
 * @property {string} createdBy
 * @property {boolean} autoUpload
 * @property {boolean} possibleSameStore
 * @property {Array<...ABTNodeClient.null>} connectedEndpoints
 */

/**
 * Structure of ABTNodeClient.ProxyPolicy
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.ProxyPolicy
 * @property {boolean} enabled
 * @property {boolean} trustRecursive
 * @property {Array<...ABTNodeClient.null>} trustedProxies
 * @property {string} realIpHeader
 */

/**
 * Structure of ABTNodeClient.Query
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.Query
 * @property {...ABTNodeClient.ResponseBlocklet} getBlocklet
 * @property {...ABTNodeClient.ResponseBlockletMetaFromUrl} getBlockletMetaFromUrl
 * @property {...ABTNodeClient.ResponseBlockletDiff} getBlockletDiff
 * @property {...ABTNodeClient.ResponseGetBlocklets} getBlocklets
 * @property {...ABTNodeClient.ResponseBlockletRuntimeHistory} getBlockletRuntimeHistory
 * @property {...ABTNodeClient.ResponseBlockletsFromBackup} getBlockletsFromBackup
 * @property {...ABTNodeClient.ResponseGetDynamicComponents} getDynamicComponents
 * @property {...ABTNodeClient.ResponseGetNodeInfo} getNodeInfo
 * @property {...ABTNodeClient.ResponseGetNodeInfo} resetNodeStatus
 * @property {...ABTNodeClient.ResponseGetNodeEnv} getNodeEnv
 * @property {...ABTNodeClient.ResponseCheckNodeVersion} checkNodeVersion
 * @property {...ABTNodeClient.ResponseDelegationState} getDelegationState
 * @property {...ABTNodeClient.ResponseNodeRuntimeHistory} getNodeRuntimeHistory
 * @property {...ABTNodeClient.ResponseBlockletMeta} getBlockletMeta
 * @property {...ABTNodeClient.ResponseGetNotifications} getNotifications
 * @property {...ABTNodeClient.ResponseMakeAllNotificationsAsRead} makeAllNotificationsAsRead
 * @property {...ABTNodeClient.ResponseNotificationSendLog} getNotificationSendLog
 * @property {...ABTNodeClient.ResponseReceivers} getReceivers
 * @property {...ABTNodeClient.ResponseNotificationComponents} getNotificationComponents
 * @property {...ABTNodeClient.ResponseResendNotification} resendNotification
 * @property {...ABTNodeClient.ResponseGetRoutingSites} getRoutingSites
 * @property {...ABTNodeClient.ResponseGetRoutingProviders} getRoutingProviders
 * @property {...ABTNodeClient.ResponseIsDidDomain} isDidDomain
 * @property {...ABTNodeClient.ResponseGetCertificates} getCertificates
 * @property {...ABTNodeClient.ResponseCheckDomains} checkDomains
 * @property {...ABTNodeClient.ResponseFindCertificateByDomain} findCertificateByDomain
 * @property {...ABTNodeClient.ResponseAccessKeys} getAccessKeys
 * @property {...ABTNodeClient.ResponseAccessKey} getAccessKey
 * @property {...ABTNodeClient.ResponseWebHooks} getWebHooks
 * @property {...ABTNodeClient.ResponseSenderList} getWebhookSenders
 * @property {...ABTNodeClient.ResponseSendMsg} sendTestMessage
 * @property {...ABTNodeClient.ResponseGetSession} getSession
 * @property {...ABTNodeClient.ResponseRoles} getRoles
 * @property {...ABTNodeClient.ResponseRole} getRole
 * @property {...ABTNodeClient.ResponsePermissions} getPermissions
 * @property {...ABTNodeClient.ResponseGetInvitations} getInvitations
 * @property {...ABTNodeClient.ResponseUsers} getUsers
 * @property {...ABTNodeClient.ResponseUser} getUser
 * @property {...ABTNodeClient.ResponseUserSessions} getUserSessions
 * @property {...ABTNodeClient.ResponseUserSessionsCount} getUserSessionsCount
 * @property {...ABTNodeClient.ResponseGetUsersCount} getUsersCount
 * @property {...ABTNodeClient.ResponseGetUsersCountPerRole} getUsersCountPerRole
 * @property {...ABTNodeClient.ResponseUser} getOwner
 * @property {...ABTNodeClient.ResponsePermissions} getPermissionsByRole
 * @property {...ABTNodeClient.ResponseGetPassportIssuances} getPassportIssuances
 * @property {...ABTNodeClient.GeneralResponse} logoutUser
 * @property {...ABTNodeClient.ResponseUser} destroySelf
 * @property {...ABTNodeClient.ResponseUserFollows} getUserFollowers
 * @property {...ABTNodeClient.ResponseUserFollows} getUserFollowing
 * @property {...ABTNodeClient.ResponseUserRelationCount} getUserFollowStats
 * @property {...ABTNodeClient.ResponseCheckFollowing} checkFollowing
 * @property {...ABTNodeClient.GeneralResponse} followUser
 * @property {...ABTNodeClient.GeneralResponse} unfollowUser
 * @property {...ABTNodeClient.ResponseUsers} getUserInvites
 * @property {...ABTNodeClient.ResponseTags} getTags
 * @property {...ABTNodeClient.ResponseGetAuditLogs} getAuditLogs
 * @property {...ABTNodeClient.ResponseGetLauncherSession} getLauncherSession
 * @property {...ABTNodeClient.ResponseGetBlockletBackups} getBlockletBackups
 * @property {...ABTNodeClient.ResponseGetBlockletBackupSummary} getBlockletBackupSummary
 * @property {...ABTNodeClient.ResponseGetBlockletSpaceGateways} getBlockletSpaceGateways
 * @property {...ABTNodeClient.ResponseGetTrafficInsights} getTrafficInsights
 * @property {...ABTNodeClient.ResponseGetProjects} getProjects
 * @property {...ABTNodeClient.ResponseGetProject} getProject
 * @property {...ABTNodeClient.ResponseGetReleases} getReleases
 * @property {...ABTNodeClient.ResponseGetRelease} getRelease
 * @property {...ABTNodeClient.ResponseGetSelectedResources} getSelectedResources
 * @property {...ABTNodeClient.ResponseBlockletSecurityRule} getBlockletSecurityRule
 * @property {...ABTNodeClient.ResponseBlockletSecurityRules} getBlockletSecurityRules
 * @property {...ABTNodeClient.ResponseBlockletAccessPolicy} getBlockletResponseHeaderPolicy
 * @property {...ABTNodeClient.ResponseBlockletResponseHeaderPolicies} getBlockletResponseHeaderPolicies
 * @property {...ABTNodeClient.ResponseBlockletAccessPolicy} getBlockletAccessPolicy
 * @property {...ABTNodeClient.ResponseBlockletAccessPolicies} getBlockletAccessPolicies
 * @property {...ABTNodeClient.ResponseGetWebhookEndpoints} getWebhookEndpoints
 * @property {...ABTNodeClient.ResponseGetWebhookEndpoint} getWebhookEndpoint
 * @property {...ABTNodeClient.ResponseGetWebhookAttempts} getWebhookAttempts
 * @property {...ABTNodeClient.ResponseGetPassportCountPerRole} getPassportRoleCounts
 * @property {...ABTNodeClient.ResponsePassport} getPassportsByRole
 * @property {...ABTNodeClient.ResponsePassportLog} getPassportLogs
 * @property {...ABTNodeClient.ResponsePassport} getRelatedPassports
 * @property {...ABTNodeClient.ResponseBlockletInfo} getBlockletBaseInfo
 * @property {...ABTNodeClient.ResponseDomainDNS} getDomainDNS
 * @property {...ABTNodeClient.ResponseOAuthClients} getOAuthClients
 * @property {...ABTNodeClient.ResponseOAuthClient} createOAuthClient
 * @property {...ABTNodeClient.ResponseOAuthClient} updateOAuthClient
 * @property {...ABTNodeClient.GeneralResponse} deleteOAuthClient
 * @property {...ABTNodeClient.ResponseGetOrgs} getOrgs
 * @property {...ABTNodeClient.ResponseGetOrg} getOrg
 * @property {...ABTNodeClient.ResponseOrgUsers} getOrgMembers
 * @property {...ABTNodeClient.ResponseUsers} getOrgInvitableUsers
 * @property {...ABTNodeClient.ResponseGetOrgResource} getOrgResource
 */

/**
 * Structure of ABTNodeClient.ReadUpdateAffected
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.ReadUpdateAffected
 * @property {number} numAffected
 * @property {Array<...ABTNodeClient.null>} notificationIds
 */

/**
 * Structure of ABTNodeClient.Release
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.Release
 * @property {string} id
 * @property {string} projectId
 * @property {string} blockletDid
 * @property {string} blockletVersion
 * @property {string} blockletTitle
 * @property {string} blockletDescription
 * @property {string} blockletLogo
 * @property {string} blockletIntroduction
 * @property {Array<...ABTNodeClient.null>} blockletScreenshots
 * @property {string} note
 * @property {Array<...ABTNodeClient.null>} files
 * @property {...ABTNodeClient.ReleaseStatus} status
 * @property {string} createdAt
 * @property {string} updatedAt
 * @property {Array<...ABTNodeClient.null>} blockletComponents
 * @property {Array<...ABTNodeClient.null>} publishedStoreIds
 * @property {string} uploadedResource
 * @property {string} blockletResourceType
 * @property {string} blockletSupport
 * @property {string} blockletCommunity
 * @property {string} blockletHomepage
 * @property {Array<...ABTNodeClient.null>} blockletVideos
 * @property {string} blockletRepository
 * @property {string} contentType
 * @property {...ABTNodeClient.BlockletDocker} blockletDocker
 * @property {boolean} blockletSingleton
 */

/**
 * Structure of ABTNodeClient.ReleaseComponent
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.ReleaseComponent
 * @property {string} did
 * @property {boolean} required
 */

/**
 * Structure of ABTNodeClient.RequestLimit
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RequestLimit
 * @property {boolean} enabled
 * @property {number} global
 * @property {number} burstFactor
 * @property {number} burstDelay
 * @property {number} rate
 * @property {Array<...ABTNodeClient.null>} methods
 */

/**
 * Structure of ABTNodeClient.Requirement
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.Requirement
 * @property {string} server
 * @property {any} os
 * @property {any} cpu
 * @property {Array<...ABTNodeClient.null>} fuels
 * @property {boolean} aigne
 */

/**
 * Structure of ABTNodeClient.ResponseAccessKey 
 *
 * Checkout the following snippet for the format of ResponseAccessKey:
 * ```json
{
  "code": "ok",
  "data": {
    "accessKeyId": "abc",
    "accessKeyPublic": "abc",
    "remark": "abc",
    "passport": "abc",
    "createdBy": "abc",
    "updatedBy": "abc",
    "authType": "abc",
    "componentDid": "abc",
    "resourceType": "abc",
    "resourceId": "abc",
    "createdVia": "abc"
  }
}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.ResponseAccessKey
 * @property {...ABTNodeClient.StatusCode} code
 * @property {...ABTNodeClient.AccessKey} data
 */

/**
 * Structure of ABTNodeClient.ResponseAccessKeys
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.ResponseAccessKeys
 * @property {...ABTNodeClient.StatusCode} code
 * @property {Array<...ABTNodeClient.null>} list
 * @property {...ABTNodeClient.Paging} paging
 */

/**
 * Structure of ABTNodeClient.ResponseAddLetsEncryptCert 
 *
 * Checkout the following snippet for the format of ResponseAddLetsEncryptCert:
 * ```json
{
  "code": "ok"
}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.ResponseAddLetsEncryptCert
 * @property {...ABTNodeClient.StatusCode} code
 */

/**
 * Structure of ABTNodeClient.ResponseAddNginxHttpsCert 
 *
 * Checkout the following snippet for the format of ResponseAddNginxHttpsCert:
 * ```json
{
  "code": "ok"
}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.ResponseAddNginxHttpsCert
 * @property {...ABTNodeClient.StatusCode} code
 */

/**
 * Structure of ABTNodeClient.ResponseBlocklet
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.ResponseBlocklet
 * @property {...ABTNodeClient.StatusCode} code
 * @property {...ABTNodeClient.BlockletState} blocklet
 */

/**
 * Structure of ABTNodeClient.ResponseBlockletAccessPolicies
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.ResponseBlockletAccessPolicies
 * @property {...ABTNodeClient.StatusCode} code
 * @property {Array<...ABTNodeClient.null>} accessPolicies
 * @property {...ABTNodeClient.Paging} paging
 */

/**
 * Structure of ABTNodeClient.ResponseBlockletAccessPolicy 
 *
 * Checkout the following snippet for the format of ResponseBlockletAccessPolicy:
 * ```json
{
  "code": "ok",
  "accessPolicy": {
    "id": "abc",
    "name": "abc",
    "description": "abc",
    "reverse": true,
    "isProtected": true
  }
}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.ResponseBlockletAccessPolicy
 * @property {...ABTNodeClient.StatusCode} code
 * @property {...ABTNodeClient.BlockletAccessPolicy} accessPolicy
 */

/**
 * Structure of ABTNodeClient.ResponseBlockletDiff
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.ResponseBlockletDiff
 * @property {...ABTNodeClient.StatusCode} code
 * @property {...ABTNodeClient.BlockletDiff} blockletDiff
 */

/**
 * Structure of ABTNodeClient.ResponseBlockletInfo 
 *
 * Checkout the following snippet for the format of ResponseBlockletInfo:
 * ```json
{
  "user": {},
  "passport": {},
  "backup": {
    "appPid": "abc",
    "userDid": "abc",
    "sourceUrl": "abc",
    "target": "abc",
    "targetName": "abc",
    "targetUrl": "abc",
    "message": "abc"
  },
  "appRuntimeInfo": {
    "pid": "abc",
    "port": "abc",
    "uptime": "abc",
    "runningDocker": true
  },
  "traffic": {},
  "integrations": {},
  "studio": {}
}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.ResponseBlockletInfo
 * @property {...ABTNodeClient.BlockletUsers} user
 * @property {...ABTNodeClient.BlockletPassport} passport
 * @property {...ABTNodeClient.Backup} backup
 * @property {...ABTNodeClient.RuntimeInfo} appRuntimeInfo
 * @property {...ABTNodeClient.BlockletTraffic} traffic
 * @property {...ABTNodeClient.BlockletIntegrations} integrations
 * @property {...ABTNodeClient.BlockletStudio} studio
 */

/**
 * Structure of ABTNodeClient.ResponseBlockletMeta 
 *
 * Checkout the following snippet for the format of ResponseBlockletMeta:
 * ```json
{
  "code": "ok"
}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.ResponseBlockletMeta
 * @property {...ABTNodeClient.StatusCode} code
 * @property {any} meta
 */

/**
 * Structure of ABTNodeClient.ResponseBlockletMetaFromUrl
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.ResponseBlockletMetaFromUrl
 * @property {...ABTNodeClient.StatusCode} code
 * @property {...ABTNodeClient.BlockletMeta} meta
 * @property {boolean} isFree
 * @property {boolean} inStore
 * @property {string} registryUrl
 */

/**
 * Structure of ABTNodeClient.ResponseBlockletResponseHeaderPolicies
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.ResponseBlockletResponseHeaderPolicies
 * @property {...ABTNodeClient.StatusCode} code
 * @property {Array<...ABTNodeClient.null>} responseHeaderPolicies
 * @property {...ABTNodeClient.Paging} paging
 */

/**
 * Structure of ABTNodeClient.ResponseBlockletResponseHeaderPolicy 
 *
 * Checkout the following snippet for the format of ResponseBlockletResponseHeaderPolicy:
 * ```json
{
  "code": "ok",
  "responseHeaderPolicy": {
    "id": "abc",
    "name": "abc",
    "description": "abc",
    "securityHeader": "abc",
    "cors": "abc",
    "customHeader": "abc",
    "removeHeader": "abc",
    "isProtected": true
  }
}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.ResponseBlockletResponseHeaderPolicy
 * @property {...ABTNodeClient.StatusCode} code
 * @property {...ABTNodeClient.BlockletResponseHeaderPolicy} responseHeaderPolicy
 */

/**
 * Structure of ABTNodeClient.ResponseBlockletRuntimeHistory
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.ResponseBlockletRuntimeHistory
 * @property {...ABTNodeClient.StatusCode} code
 * @property {Array<...ABTNodeClient.null>} historyList
 */

/**
 * Structure of ABTNodeClient.ResponseBlockletSecurityRule 
 *
 * Checkout the following snippet for the format of ResponseBlockletSecurityRule:
 * ```json
{
  "code": "ok",
  "securityRule": {
    "id": "abc",
    "pathPattern": "abc",
    "componentDid": "abc",
    "responseHeaderPolicyId": "abc",
    "accessPolicyId": "abc",
    "enabled": true,
    "remark": "abc",
    "accessPolicy": {
      "id": "abc",
      "name": "abc",
      "description": "abc",
      "reverse": true,
      "isProtected": true
    },
    "responseHeaderPolicy": {
      "id": "abc",
      "name": "abc",
      "description": "abc",
      "securityHeader": "abc",
      "cors": "abc",
      "customHeader": "abc",
      "removeHeader": "abc",
      "isProtected": true
    }
  }
}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.ResponseBlockletSecurityRule
 * @property {...ABTNodeClient.StatusCode} code
 * @property {...ABTNodeClient.BlockletSecurityRule} securityRule
 */

/**
 * Structure of ABTNodeClient.ResponseBlockletSecurityRules
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.ResponseBlockletSecurityRules
 * @property {...ABTNodeClient.StatusCode} code
 * @property {Array<...ABTNodeClient.null>} securityRules
 * @property {...ABTNodeClient.Paging} paging
 */

/**
 * Structure of ABTNodeClient.ResponseBlockletsFromBackup
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.ResponseBlockletsFromBackup
 * @property {...ABTNodeClient.StatusCode} code
 * @property {Array<...ABTNodeClient.null>} backups
 */

/**
 * Structure of ABTNodeClient.ResponseCheckComponentsForUpdates
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.ResponseCheckComponentsForUpdates
 * @property {...ABTNodeClient.StatusCode} code
 * @property {...ABTNodeClient.BlockletPreUpdateInfo} preUpdateInfo
 */

/**
 * Structure of ABTNodeClient.ResponseCheckDomains 
 *
 * Checkout the following snippet for the format of ResponseCheckDomains:
 * ```json
{
  "code": "ok"
}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.ResponseCheckDomains
 * @property {...ABTNodeClient.StatusCode} code
 */

/**
 * Structure of ABTNodeClient.ResponseCheckFollowing 
 *
 * Checkout the following snippet for the format of ResponseCheckFollowing:
 * ```json
{
  "code": "ok"
}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.ResponseCheckFollowing
 * @property {...ABTNodeClient.StatusCode} code
 * @property {any} data
 */

/**
 * Structure of ABTNodeClient.ResponseCheckNodeVersion 
 *
 * Checkout the following snippet for the format of ResponseCheckNodeVersion:
 * ```json
{
  "code": "ok",
  "version": "abc"
}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.ResponseCheckNodeVersion
 * @property {...ABTNodeClient.StatusCode} code
 * @property {string} version
 */

/**
 * Structure of ABTNodeClient.ResponseClearCache
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.ResponseClearCache
 * @property {...ABTNodeClient.StatusCode} code
 * @property {Array<...ABTNodeClient.null>} removed
 */

/**
 * Structure of ABTNodeClient.ResponseConfigVault 
 *
 * Checkout the following snippet for the format of ResponseConfigVault:
 * ```json
{
  "code": "ok",
  "sessionId": "abc"
}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.ResponseConfigVault
 * @property {...ABTNodeClient.StatusCode} code
 * @property {string} sessionId
 */

/**
 * Structure of ABTNodeClient.ResponseConnectByStudio 
 *
 * Checkout the following snippet for the format of ResponseConnectByStudio:
 * ```json
{
  "code": "ok",
  "url": "abc"
}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.ResponseConnectByStudio
 * @property {...ABTNodeClient.StatusCode} code
 * @property {string} url
 */

/**
 * Structure of ABTNodeClient.ResponseConnectToEndpoint 
 *
 * Checkout the following snippet for the format of ResponseConnectToEndpoint:
 * ```json
{
  "code": "ok",
  "url": "abc"
}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.ResponseConnectToEndpoint
 * @property {...ABTNodeClient.StatusCode} code
 * @property {string} url
 */

/**
 * Structure of ABTNodeClient.ResponseConnectToStore 
 *
 * Checkout the following snippet for the format of ResponseConnectToStore:
 * ```json
{
  "code": "ok",
  "url": "abc"
}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.ResponseConnectToStore
 * @property {...ABTNodeClient.StatusCode} code
 * @property {string} url
 */

/**
 * Structure of ABTNodeClient.ResponseCreateAccessKey 
 *
 * Checkout the following snippet for the format of ResponseCreateAccessKey:
 * ```json
{
  "code": "ok",
  "data": {
    "accessKeyId": "abc",
    "accessKeyPublic": "abc",
    "accessKeySecret": "abc",
    "remark": "abc",
    "passport": "abc",
    "authType": "abc",
    "componentDid": "abc",
    "resourceType": "abc",
    "resourceId": "abc",
    "createdVia": "abc"
  }
}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.ResponseCreateAccessKey
 * @property {...ABTNodeClient.StatusCode} code
 * @property {...ABTNodeClient.CreateAccessKey} data
 */

/**
 * Structure of ABTNodeClient.ResponseCreateInvitation
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.ResponseCreateInvitation
 * @property {...ABTNodeClient.StatusCode} code
 * @property {...ABTNodeClient.InviteInfo} inviteInfo
 */

/**
 * Structure of ABTNodeClient.ResponseCreatePassportIssuance 
 *
 * Checkout the following snippet for the format of ResponseCreatePassportIssuance:
 * ```json
{
  "code": "ok",
  "info": {
    "id": "abc",
    "name": "abc",
    "title": "abc",
    "expireDate": "abc",
    "teamDid": "abc",
    "ownerDid": "abc",
    "display": {
      "type": "abc",
      "content": "abc"
    }
  }
}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.ResponseCreatePassportIssuance
 * @property {...ABTNodeClient.StatusCode} code
 * @property {...ABTNodeClient.PassportIssuanceInfo} info
 */

/**
 * Structure of ABTNodeClient.ResponseCreateTransferNodeInvitation
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.ResponseCreateTransferNodeInvitation
 * @property {...ABTNodeClient.StatusCode} code
 * @property {...ABTNodeClient.InviteInfo} inviteInfo
 */

/**
 * Structure of ABTNodeClient.ResponseCreateWebHook
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.ResponseCreateWebHook
 * @property {...ABTNodeClient.StatusCode} code
 * @property {...ABTNodeClient.WebHookSender} webhook
 */

/**
 * Structure of ABTNodeClient.ResponseCreateWebhookEndpoint
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.ResponseCreateWebhookEndpoint
 * @property {...ABTNodeClient.WebhookEndpointState} data
 */

/**
 * Structure of ABTNodeClient.ResponseDelegationState 
 *
 * Checkout the following snippet for the format of ResponseDelegationState:
 * ```json
{
  "code": "ok",
  "state": {
    "delegated": true
  }
}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.ResponseDelegationState
 * @property {...ABTNodeClient.StatusCode} code
 * @property {...ABTNodeClient.DelegationState} state
 */

/**
 * Structure of ABTNodeClient.ResponseDeleteAccessKey 
 *
 * Checkout the following snippet for the format of ResponseDeleteAccessKey:
 * ```json
{
  "code": "ok"
}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.ResponseDeleteAccessKey
 * @property {...ABTNodeClient.StatusCode} code
 */

/**
 * Structure of ABTNodeClient.ResponseDeleteNginxHttpsCert 
 *
 * Checkout the following snippet for the format of ResponseDeleteNginxHttpsCert:
 * ```json
{
  "code": "ok"
}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.ResponseDeleteNginxHttpsCert
 * @property {...ABTNodeClient.StatusCode} code
 */

/**
 * Structure of ABTNodeClient.ResponseDeleteWebHook 
 *
 * Checkout the following snippet for the format of ResponseDeleteWebHook:
 * ```json
{
  "code": "ok"
}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.ResponseDeleteWebHook
 * @property {...ABTNodeClient.StatusCode} code
 */

/**
 * Structure of ABTNodeClient.ResponseDeleteWebhookEndpoint
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.ResponseDeleteWebhookEndpoint
 * @property {...ABTNodeClient.WebhookEndpointState} data
 */

/**
 * Structure of ABTNodeClient.ResponseDisconnectFromStore 
 *
 * Checkout the following snippet for the format of ResponseDisconnectFromStore:
 * ```json
{
  "code": "ok"
}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.ResponseDisconnectFromStore
 * @property {...ABTNodeClient.StatusCode} code
 */

/**
 * Structure of ABTNodeClient.ResponseDomainDNS 
 *
 * Checkout the following snippet for the format of ResponseDomainDNS:
 * ```json
{
  "isDnsResolved": true,
  "hasCname": true,
  "isCnameMatch": true,
  "error": "abc"
}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.ResponseDomainDNS
 * @property {boolean} isDnsResolved
 * @property {boolean} hasCname
 * @property {boolean} isCnameMatch
 * @property {string} error
 */

/**
 * Structure of ABTNodeClient.ResponseFindCertificateByDomain
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.ResponseFindCertificateByDomain
 * @property {...ABTNodeClient.StatusCode} code
 * @property {...ABTNodeClient.Certificate} cert
 */

/**
 * Structure of ABTNodeClient.ResponseGateway
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.ResponseGateway
 * @property {...ABTNodeClient.StatusCode} code
 * @property {...ABTNodeClient.Gateway} gateway
 */

/**
 * Structure of ABTNodeClient.ResponseGetAuditLogs
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.ResponseGetAuditLogs
 * @property {...ABTNodeClient.StatusCode} code
 * @property {Array<...ABTNodeClient.null>} list
 * @property {...ABTNodeClient.Paging} paging
 */

/**
 * Structure of ABTNodeClient.ResponseGetBlockletBackupSummary
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.ResponseGetBlockletBackupSummary
 * @property {...ABTNodeClient.StatusCode} code
 * @property {Array<...ABTNodeClient.null>} summary
 */

/**
 * Structure of ABTNodeClient.ResponseGetBlockletBackups
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.ResponseGetBlockletBackups
 * @property {...ABTNodeClient.StatusCode} code
 * @property {Array<...ABTNodeClient.null>} backups
 */

/**
 * Structure of ABTNodeClient.ResponseGetBlockletSpaceGateways
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.ResponseGetBlockletSpaceGateways
 * @property {...ABTNodeClient.StatusCode} code
 * @property {Array<...ABTNodeClient.null>} spaceGateways
 */

/**
 * Structure of ABTNodeClient.ResponseGetBlocklets
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.ResponseGetBlocklets
 * @property {...ABTNodeClient.StatusCode} code
 * @property {Array<...ABTNodeClient.null>} blocklets
 * @property {...ABTNodeClient.Paging} paging
 */

/**
 * Structure of ABTNodeClient.ResponseGetCertificates
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.ResponseGetCertificates
 * @property {...ABTNodeClient.StatusCode} code
 * @property {Array<...ABTNodeClient.null>} certificates
 */

/**
 * Structure of ABTNodeClient.ResponseGetDynamicComponents
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.ResponseGetDynamicComponents
 * @property {...ABTNodeClient.StatusCode} code
 * @property {Array<...ABTNodeClient.null>} components
 */

/**
 * Structure of ABTNodeClient.ResponseGetInvitations
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.ResponseGetInvitations
 * @property {...ABTNodeClient.StatusCode} code
 * @property {Array<...ABTNodeClient.null>} invitations
 */

/**
 * Structure of ABTNodeClient.ResponseGetLauncherSession 
 *
 * Checkout the following snippet for the format of ResponseGetLauncherSession:
 * ```json
{
  "code": "ok",
  "error": "abc"
}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.ResponseGetLauncherSession
 * @property {...ABTNodeClient.StatusCode} code
 * @property {string} error
 * @property {any} launcherSession
 */

/**
 * Structure of ABTNodeClient.ResponseGetNodeEnv
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.ResponseGetNodeEnv
 * @property {...ABTNodeClient.StatusCode} code
 * @property {...ABTNodeClient.NodeEnvInfo} info
 */

/**
 * Structure of ABTNodeClient.ResponseGetNodeInfo
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.ResponseGetNodeInfo
 * @property {...ABTNodeClient.StatusCode} code
 * @property {...ABTNodeClient.NodeState} info
 */

/**
 * Structure of ABTNodeClient.ResponseGetNotifications
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.ResponseGetNotifications
 * @property {...ABTNodeClient.StatusCode} code
 * @property {Array<...ABTNodeClient.null>} list
 * @property {...ABTNodeClient.Paging} paging
 * @property {number} unreadCount
 */

/**
 * Structure of ABTNodeClient.ResponseGetOrg
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.ResponseGetOrg
 * @property {...ABTNodeClient.StatusCode} code
 * @property {...ABTNodeClient.Org} org
 */

/**
 * Structure of ABTNodeClient.ResponseGetOrgResource
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.ResponseGetOrgResource
 * @property {...ABTNodeClient.StatusCode} code
 * @property {Array<...ABTNodeClient.null>} data
 */

/**
 * Structure of ABTNodeClient.ResponseGetOrgs
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.ResponseGetOrgs
 * @property {...ABTNodeClient.StatusCode} code
 * @property {Array<...ABTNodeClient.null>} orgs
 * @property {...ABTNodeClient.Paging} paging
 */

/**
 * Structure of ABTNodeClient.ResponseGetPassportCountPerRole
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.ResponseGetPassportCountPerRole
 * @property {...ABTNodeClient.StatusCode} code
 * @property {Array<...ABTNodeClient.null>} counts
 */

/**
 * Structure of ABTNodeClient.ResponseGetPassportIssuances
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.ResponseGetPassportIssuances
 * @property {...ABTNodeClient.StatusCode} code
 * @property {Array<...ABTNodeClient.null>} list
 */

/**
 * Structure of ABTNodeClient.ResponseGetProject
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.ResponseGetProject
 * @property {...ABTNodeClient.StatusCode} code
 * @property {...ABTNodeClient.Project} project
 */

/**
 * Structure of ABTNodeClient.ResponseGetProjects
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.ResponseGetProjects
 * @property {...ABTNodeClient.StatusCode} code
 * @property {Array<...ABTNodeClient.null>} projects
 * @property {...ABTNodeClient.Paging} paging
 */

/**
 * Structure of ABTNodeClient.ResponseGetRelease
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.ResponseGetRelease
 * @property {...ABTNodeClient.StatusCode} code
 * @property {...ABTNodeClient.Release} release
 */

/**
 * Structure of ABTNodeClient.ResponseGetReleases
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.ResponseGetReleases
 * @property {...ABTNodeClient.StatusCode} code
 * @property {Array<...ABTNodeClient.null>} releases
 * @property {...ABTNodeClient.Paging} paging
 */

/**
 * Structure of ABTNodeClient.ResponseGetRoutingProviders
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.ResponseGetRoutingProviders
 * @property {...ABTNodeClient.StatusCode} code
 * @property {Array<...ABTNodeClient.null>} providers
 */

/**
 * Structure of ABTNodeClient.ResponseGetRoutingSites
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.ResponseGetRoutingSites
 * @property {...ABTNodeClient.StatusCode} code
 * @property {Array<...ABTNodeClient.null>} sites
 */

/**
 * Structure of ABTNodeClient.ResponseGetSelectedResources
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.ResponseGetSelectedResources
 * @property {...ABTNodeClient.StatusCode} code
 * @property {Array<...ABTNodeClient.null>} resources
 */

/**
 * Structure of ABTNodeClient.ResponseGetSession 
 *
 * Checkout the following snippet for the format of ResponseGetSession:
 * ```json
{
  "code": "ok"
}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.ResponseGetSession
 * @property {...ABTNodeClient.StatusCode} code
 * @property {any} session
 */

/**
 * Structure of ABTNodeClient.ResponseGetTrafficInsights
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.ResponseGetTrafficInsights
 * @property {...ABTNodeClient.StatusCode} code
 * @property {Array<...ABTNodeClient.null>} list
 * @property {...ABTNodeClient.Paging} paging
 */

/**
 * Structure of ABTNodeClient.ResponseGetUsersCount 
 *
 * Checkout the following snippet for the format of ResponseGetUsersCount:
 * ```json
{
  "code": "ok"
}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.ResponseGetUsersCount
 * @property {...ABTNodeClient.StatusCode} code
 * @property {number} count
 */

/**
 * Structure of ABTNodeClient.ResponseGetUsersCountPerRole
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.ResponseGetUsersCountPerRole
 * @property {...ABTNodeClient.StatusCode} code
 * @property {Array<...ABTNodeClient.null>} counts
 */

/**
 * Structure of ABTNodeClient.ResponseGetWebhookAttempt 
 *
 * Checkout the following snippet for the format of ResponseGetWebhookAttempt:
 * ```json
{
  "data": {
    "id": "abc",
    "eventId": "abc",
    "webhookId": "abc",
    "status": "abc",
    "triggeredBy": "abc",
    "triggeredFrom": "abc"
  }
}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.ResponseGetWebhookAttempt
 * @property {...ABTNodeClient.WebhookAttemptState} data
 */

/**
 * Structure of ABTNodeClient.ResponseGetWebhookAttempts
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.ResponseGetWebhookAttempts
 * @property {Array<...ABTNodeClient.null>} list
 * @property {...ABTNodeClient.Paging} paging
 */

/**
 * Structure of ABTNodeClient.ResponseGetWebhookEndpoint
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.ResponseGetWebhookEndpoint
 * @property {...ABTNodeClient.WebhookEndpointWithUserInfo} data
 */

/**
 * Structure of ABTNodeClient.ResponseGetWebhookEndpoints
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.ResponseGetWebhookEndpoints
 * @property {Array<...ABTNodeClient.null>} list
 * @property {...ABTNodeClient.Paging} paging
 */

/**
 * Structure of ABTNodeClient.ResponseInviteMembersToOrg
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.ResponseInviteMembersToOrg
 * @property {...ABTNodeClient.StatusCode} code
 * @property {...ABTNodeClient.InviteResult} data
 */

/**
 * Structure of ABTNodeClient.ResponseIsDidDomain 
 *
 * Checkout the following snippet for the format of ResponseIsDidDomain:
 * ```json
{
  "code": "ok",
  "value": true
}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.ResponseIsDidDomain
 * @property {...ABTNodeClient.StatusCode} code
 * @property {boolean} value
 */

/**
 * Structure of ABTNodeClient.ResponseLaunchBlockletByLauncher 
 *
 * Checkout the following snippet for the format of ResponseLaunchBlockletByLauncher:
 * ```json
{
  "code": "ok"
}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.ResponseLaunchBlockletByLauncher
 * @property {...ABTNodeClient.StatusCode} code
 * @property {any} data
 */

/**
 * Structure of ABTNodeClient.ResponseLaunchBlockletWithoutWallet 
 *
 * Checkout the following snippet for the format of ResponseLaunchBlockletWithoutWallet:
 * ```json
{
  "code": "ok"
}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.ResponseLaunchBlockletWithoutWallet
 * @property {...ABTNodeClient.StatusCode} code
 * @property {any} data
 */

/**
 * Structure of ABTNodeClient.ResponseMakeAllNotificationsAsRead
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.ResponseMakeAllNotificationsAsRead
 * @property {...ABTNodeClient.StatusCode} code
 * @property {...ABTNodeClient.ReadUpdateAffected} data
 */

/**
 * Structure of ABTNodeClient.ResponseNodeRuntimeHistory
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.ResponseNodeRuntimeHistory
 * @property {...ABTNodeClient.StatusCode} code
 * @property {Array<...ABTNodeClient.null>} history
 */

/**
 * Structure of ABTNodeClient.ResponseNotificationComponents
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.ResponseNotificationComponents
 * @property {...ABTNodeClient.StatusCode} code
 * @property {Array<...ABTNodeClient.null>} componentDids
 */

/**
 * Structure of ABTNodeClient.ResponseNotificationSendLog
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.ResponseNotificationSendLog
 * @property {...ABTNodeClient.StatusCode} code
 * @property {Array<...ABTNodeClient.null>} list
 * @property {...ABTNodeClient.Paging} paging
 */

/**
 * Structure of ABTNodeClient.ResponseOAuthClient
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.ResponseOAuthClient
 * @property {...ABTNodeClient.OauthClient} data
 */

/**
 * Structure of ABTNodeClient.ResponseOAuthClients
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.ResponseOAuthClients
 * @property {Array<...ABTNodeClient.null>} list
 */

/**
 * Structure of ABTNodeClient.ResponseOrgResourceOperation
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.ResponseOrgResourceOperation
 * @property {...ABTNodeClient.StatusCode} code
 * @property {...ABTNodeClient.OrgResourceResult} data
 */

/**
 * Structure of ABTNodeClient.ResponseOrgUsers
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.ResponseOrgUsers
 * @property {...ABTNodeClient.StatusCode} code
 * @property {Array<...ABTNodeClient.null>} users
 * @property {...ABTNodeClient.Paging} paging
 */

/**
 * Structure of ABTNodeClient.ResponsePassport
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.ResponsePassport
 * @property {...ABTNodeClient.StatusCode} code
 * @property {Array<...ABTNodeClient.null>} passports
 * @property {...ABTNodeClient.Paging} paging
 */

/**
 * Structure of ABTNodeClient.ResponsePassportLog
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.ResponsePassportLog
 * @property {Array<...ABTNodeClient.null>} passportLogs
 * @property {...ABTNodeClient.Paging} paging
 */

/**
 * Structure of ABTNodeClient.ResponsePermission 
 *
 * Checkout the following snippet for the format of ResponsePermission:
 * ```json
{
  "code": "ok",
  "permission": {
    "name": "abc",
    "description": "abc",
    "isProtected": true
  }
}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.ResponsePermission
 * @property {...ABTNodeClient.StatusCode} code
 * @property {...ABTNodeClient.Permission} permission
 */

/**
 * Structure of ABTNodeClient.ResponsePermissions
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.ResponsePermissions
 * @property {...ABTNodeClient.StatusCode} code
 * @property {Array<...ABTNodeClient.null>} permissions
 */

/**
 * Structure of ABTNodeClient.ResponseProject
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.ResponseProject
 * @property {...ABTNodeClient.StatusCode} code
 * @property {...ABTNodeClient.Project} project
 */

/**
 * Structure of ABTNodeClient.ResponsePublishToEndpoint 
 *
 * Checkout the following snippet for the format of ResponsePublishToEndpoint:
 * ```json
{
  "code": "ok",
  "url": "abc"
}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.ResponsePublishToEndpoint
 * @property {...ABTNodeClient.StatusCode} code
 * @property {string} url
 */

/**
 * Structure of ABTNodeClient.ResponsePublishToStore 
 *
 * Checkout the following snippet for the format of ResponsePublishToStore:
 * ```json
{
  "code": "ok",
  "url": "abc"
}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.ResponsePublishToStore
 * @property {...ABTNodeClient.StatusCode} code
 * @property {string} url
 */

/**
 * Structure of ABTNodeClient.ResponseReadNotifications 
 *
 * Checkout the following snippet for the format of ResponseReadNotifications:
 * ```json
{
  "code": "ok"
}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.ResponseReadNotifications
 * @property {...ABTNodeClient.StatusCode} code
 * @property {number} numAffected
 */

/**
 * Structure of ABTNodeClient.ResponseReceivers
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.ResponseReceivers
 * @property {...ABTNodeClient.StatusCode} code
 * @property {Array<...ABTNodeClient.null>} list
 * @property {...ABTNodeClient.Paging} paging
 */

/**
 * Structure of ABTNodeClient.ResponseRegenerateWebhookEndpointSecret 
 *
 * Checkout the following snippet for the format of ResponseRegenerateWebhookEndpointSecret:
 * ```json
{
  "secret": "abc"
}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.ResponseRegenerateWebhookEndpointSecret
 * @property {string} secret
 */

/**
 * Structure of ABTNodeClient.ResponseRelease
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.ResponseRelease
 * @property {...ABTNodeClient.StatusCode} code
 * @property {...ABTNodeClient.Release} release
 */

/**
 * Structure of ABTNodeClient.ResponseResendNotification 
 *
 * Checkout the following snippet for the format of ResponseResendNotification:
 * ```json
{
  "code": "ok"
}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.ResponseResendNotification
 * @property {...ABTNodeClient.StatusCode} code
 * @property {any} data
 */

/**
 * Structure of ABTNodeClient.ResponseResetNode 
 *
 * Checkout the following snippet for the format of ResponseResetNode:
 * ```json
{
  "code": "ok"
}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.ResponseResetNode
 * @property {...ABTNodeClient.StatusCode} code
 */

/**
 * Structure of ABTNodeClient.ResponseRestartAllContainers 
 *
 * Checkout the following snippet for the format of ResponseRestartAllContainers:
 * ```json
{
  "code": "ok",
  "sessionId": "abc"
}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.ResponseRestartAllContainers
 * @property {...ABTNodeClient.StatusCode} code
 * @property {string} sessionId
 */

/**
 * Structure of ABTNodeClient.ResponseRestartServer 
 *
 * Checkout the following snippet for the format of ResponseRestartServer:
 * ```json
{
  "code": "ok",
  "sessionId": "abc"
}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.ResponseRestartServer
 * @property {...ABTNodeClient.StatusCode} code
 * @property {string} sessionId
 */

/**
 * Structure of ABTNodeClient.ResponseRole
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.ResponseRole
 * @property {...ABTNodeClient.StatusCode} code
 * @property {...ABTNodeClient.Role} role
 */

/**
 * Structure of ABTNodeClient.ResponseRoles
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.ResponseRoles
 * @property {...ABTNodeClient.StatusCode} code
 * @property {Array<...ABTNodeClient.null>} roles
 */

/**
 * Structure of ABTNodeClient.ResponseRoutingSite
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.ResponseRoutingSite
 * @property {...ABTNodeClient.StatusCode} code
 * @property {...ABTNodeClient.RoutingSite} site
 */

/**
 * Structure of ABTNodeClient.ResponseSendMsg 
 *
 * Checkout the following snippet for the format of ResponseSendMsg:
 * ```json
{
  "code": "ok"
}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.ResponseSendMsg
 * @property {...ABTNodeClient.StatusCode} code
 */

/**
 * Structure of ABTNodeClient.ResponseSenderList
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.ResponseSenderList
 * @property {...ABTNodeClient.StatusCode} code
 * @property {Array<...ABTNodeClient.null>} senders
 */

/**
 * Structure of ABTNodeClient.ResponseTag 
 *
 * Checkout the following snippet for the format of ResponseTag:
 * ```json
{
  "code": "ok",
  "tag": {
    "title": "abc",
    "description": "abc",
    "color": "abc",
    "slug": "abc",
    "type": "abc",
    "componentDid": "abc",
    "createdBy": "abc",
    "updatedBy": "abc"
  }
}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.ResponseTag
 * @property {...ABTNodeClient.StatusCode} code
 * @property {...ABTNodeClient.Tag} tag
 */

/**
 * Structure of ABTNodeClient.ResponseTagging
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.ResponseTagging
 * @property {...ABTNodeClient.StatusCode} code
 * @property {Array<...ABTNodeClient.null>} tagging
 */

/**
 * Structure of ABTNodeClient.ResponseTags
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.ResponseTags
 * @property {...ABTNodeClient.StatusCode} code
 * @property {Array<...ABTNodeClient.null>} tags
 * @property {...ABTNodeClient.Paging} paging
 */

/**
 * Structure of ABTNodeClient.ResponseUpdateAccessKey 
 *
 * Checkout the following snippet for the format of ResponseUpdateAccessKey:
 * ```json
{
  "code": "ok",
  "data": {
    "accessKeyId": "abc",
    "accessKeyPublic": "abc",
    "remark": "abc",
    "passport": "abc",
    "createdBy": "abc",
    "updatedBy": "abc",
    "authType": "abc",
    "componentDid": "abc",
    "resourceType": "abc",
    "resourceId": "abc",
    "createdVia": "abc"
  }
}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.ResponseUpdateAccessKey
 * @property {...ABTNodeClient.StatusCode} code
 * @property {...ABTNodeClient.AccessKey} data
 */

/**
 * Structure of ABTNodeClient.ResponseUpdateNginxHttpsCert 
 *
 * Checkout the following snippet for the format of ResponseUpdateNginxHttpsCert:
 * ```json
{
  "code": "ok"
}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.ResponseUpdateNginxHttpsCert
 * @property {...ABTNodeClient.StatusCode} code
 */

/**
 * Structure of ABTNodeClient.ResponseUpdateWebhookEndpoint
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.ResponseUpdateWebhookEndpoint
 * @property {...ABTNodeClient.WebhookEndpointState} data
 */

/**
 * Structure of ABTNodeClient.ResponseUpgradeNodeVersion 
 *
 * Checkout the following snippet for the format of ResponseUpgradeNodeVersion:
 * ```json
{
  "code": "ok",
  "sessionId": "abc"
}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.ResponseUpgradeNodeVersion
 * @property {...ABTNodeClient.StatusCode} code
 * @property {string} sessionId
 */

/**
 * Structure of ABTNodeClient.ResponseUser
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.ResponseUser
 * @property {...ABTNodeClient.StatusCode} code
 * @property {...ABTNodeClient.UserInfo} user
 */

/**
 * Structure of ABTNodeClient.ResponseUserFollows
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.ResponseUserFollows
 * @property {...ABTNodeClient.StatusCode} code
 * @property {Array<...ABTNodeClient.null>} data
 * @property {...ABTNodeClient.Paging} paging
 */

/**
 * Structure of ABTNodeClient.ResponseUserRelationCount 
 *
 * Checkout the following snippet for the format of ResponseUserRelationCount:
 * ```json
{
  "code": "ok"
}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.ResponseUserRelationCount
 * @property {...ABTNodeClient.StatusCode} code
 * @property {any} data
 */

/**
 * Structure of ABTNodeClient.ResponseUserSessions
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.ResponseUserSessions
 * @property {...ABTNodeClient.StatusCode} code
 * @property {Array<...ABTNodeClient.null>} list
 * @property {...ABTNodeClient.Paging} paging
 */

/**
 * Structure of ABTNodeClient.ResponseUserSessionsCount 
 *
 * Checkout the following snippet for the format of ResponseUserSessionsCount:
 * ```json
{
  "code": "ok"
}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.ResponseUserSessionsCount
 * @property {...ABTNodeClient.StatusCode} code
 * @property {number} count
 */

/**
 * Structure of ABTNodeClient.ResponseUsers
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.ResponseUsers
 * @property {...ABTNodeClient.StatusCode} code
 * @property {Array<...ABTNodeClient.null>} users
 * @property {...ABTNodeClient.Paging} paging
 */

/**
 * Structure of ABTNodeClient.ResponseWebHooks
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.ResponseWebHooks
 * @property {...ABTNodeClient.StatusCode} code
 * @property {Array<...ABTNodeClient.null>} webhooks
 */

/**
 * Structure of ABTNodeClient.Role
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.Role
 * @property {string} name
 * @property {string} description
 * @property {Array<...ABTNodeClient.null>} grants
 * @property {string} title
 * @property {boolean} isProtected
 * @property {any} extra
 * @property {string} orgId
 */

/**
 * Structure of ABTNodeClient.RoutingProvider
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RoutingProvider
 * @property {string} name
 * @property {string} description
 * @property {boolean} running
 * @property {boolean} available
 * @property {string} error
 */

/**
 * Structure of ABTNodeClient.RoutingRule
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RoutingRule
 * @property {string} id
 * @property {...ABTNodeClient.RoutingRuleFrom} from
 * @property {...ABTNodeClient.RoutingRuleTo} to
 * @property {boolean} isProtected
 */

/**
 * Structure of ABTNodeClient.RoutingRuleFrom
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RoutingRuleFrom
 * @property {string} pathPrefix
 * @property {Array<...ABTNodeClient.null>} header
 */

/**
 * Structure of ABTNodeClient.RoutingRuleHeader
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RoutingRuleHeader
 * @property {string} key
 * @property {string} value
 * @property {...ABTNodeClient.HeaderMatchType} type
 */

/**
 * Structure of ABTNodeClient.RoutingRuleResponse
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RoutingRuleResponse
 * @property {number} status
 * @property {string} contentType
 * @property {string} body
 */

/**
 * Structure of ABTNodeClient.RoutingRuleTo
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RoutingRuleTo
 * @property {number} port
 * @property {...ABTNodeClient.BackendServiceType} type
 * @property {string} did
 * @property {string} url
 * @property {number} redirectCode
 * @property {string} interfaceName
 * @property {string} componentId
 * @property {string} pageGroup
 * @property {...ABTNodeClient.RoutingRuleResponse} response
 */

/**
 * Structure of ABTNodeClient.RoutingSite
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RoutingSite
 * @property {string} id
 * @property {string} domain
 * @property {Array<...ABTNodeClient.null>} domainAliases
 * @property {Array<...ABTNodeClient.null>} rules
 * @property {boolean} isProtected
 * @property {Array<...ABTNodeClient.null>} corsAllowedOrigins
 */

/**
 * Structure of ABTNodeClient.RuntimeInfo
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RuntimeInfo
 * @property {string} pid
 * @property {string} port
 * @property {string} uptime
 * @property {number} memoryUsage
 * @property {number} cpuUsage
 * @property {boolean} runningDocker
 * @property {any} cpus
 */

/**
 * Structure of ABTNodeClient.SessionConfig
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.SessionConfig
 * @property {number} cacheTtl
 * @property {number} ttl
 * @property {...ABTNodeClient.LoginEmailSettings} email
 * @property {...ABTNodeClient.LoginPhoneSettings} phone
 * @property {string} salt
 * @property {boolean} enableBlacklist
 */

/**
 * Structure of ABTNodeClient.SimpleBlockletMeta
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.SimpleBlockletMeta
 * @property {string} did
 * @property {string} name
 * @property {string} version
 * @property {string} description
 * @property {string} title
 * @property {string} bundleDid
 * @property {string} bundleName
 */

/**
 * Structure of ABTNodeClient.SimpleBlockletState
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.SimpleBlockletState
 * @property {...ABTNodeClient.SimpleBlockletMeta} meta
 * @property {...ABTNodeClient.BlockletStatus} status
 * @property {string} deployedFrom
 * @property {string} mountPoint
 * @property {number} deletedAt
 */

/**
 * Structure of ABTNodeClient.SpaceGateway
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.SpaceGateway
 * @property {string} name
 * @property {string} url
 * @property {string} protected
 * @property {string} endpoint
 * @property {string} did
 */

/**
 * Structure of ABTNodeClient.Statistics
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.Statistics
 * @property {number} total
 * @property {number} pending
 * @property {number} success
 * @property {number} failed
 */

/**
 * Structure of ABTNodeClient.SubServiceConfig
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.SubServiceConfig
 * @property {boolean} enabled
 * @property {string} domain
 * @property {string} staticRoot
 */

/**
 * Structure of ABTNodeClient.TUTM
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.TUTM
 * @property {string} source
 * @property {string} medium
 * @property {string} campaign
 * @property {string} content
 */

/**
 * Structure of ABTNodeClient.Tag
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.Tag
 * @property {number} id
 * @property {string} title
 * @property {string} description
 * @property {string} color
 * @property {number} createdAt
 * @property {number} updatedAt
 * @property {string} slug
 * @property {string} type
 * @property {string} componentDid
 * @property {number} parentId
 * @property {string} createdBy
 * @property {string} updatedBy
 */

/**
 * Structure of ABTNodeClient.Tagging
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.Tagging
 * @property {number} tagId
 * @property {string} taggableType
 * @property {Array<...ABTNodeClient.null>} taggableIds
 */

/**
 * Structure of ABTNodeClient.TrafficInsight
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.TrafficInsight
 * @property {string} did
 * @property {string} date
 * @property {number} totalRequests
 * @property {number} validRequests
 * @property {number} failedRequests
 * @property {number} generationTime
 * @property {number} uniqueVisitors
 * @property {number} uniqueFiles
 * @property {number} excludedHits
 * @property {number} uniqueReferrers
 * @property {number} uniqueNotFound
 * @property {number} uniqueStaticFiles
 * @property {number} logSize
 * @property {number} bandwidth
 */

/**
 * Structure of ABTNodeClient.TrustedFactory
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.TrustedFactory
 * @property {string} holderDid
 * @property {string} issuerDid
 * @property {string} factoryAddress
 * @property {string} remark
 * @property {...ABTNodeClient.TrustedPassportMappingTo} passport
 */

/**
 * Structure of ABTNodeClient.TrustedPassport
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.TrustedPassport
 * @property {string} issuerDid
 * @property {string} remark
 * @property {Array<...ABTNodeClient.null>} mappings
 */

/**
 * Structure of ABTNodeClient.TrustedPassportMapping
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.TrustedPassportMapping
 * @property {...ABTNodeClient.TrustedPassportMappingFrom} from
 * @property {...ABTNodeClient.TrustedPassportMappingTo} to
 */

/**
 * Structure of ABTNodeClient.TrustedPassportMappingFrom
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.TrustedPassportMappingFrom
 * @property {string} passport
 */

/**
 * Structure of ABTNodeClient.TrustedPassportMappingTo
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.TrustedPassportMappingTo
 * @property {string} role
 * @property {string} ttl
 * @property {string} ttlPolicy
 */

/**
 * Structure of ABTNodeClient.UpdateList
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.UpdateList
 * @property {string} id
 * @property {...ABTNodeClient.BlockletMeta} meta
 */

/**
 * Structure of ABTNodeClient.UserAddress
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.UserAddress
 * @property {string} country
 * @property {string} province
 * @property {string} city
 * @property {string} postalCode
 * @property {string} line1
 * @property {string} line2
 */

/**
 * Structure of ABTNodeClient.UserFollows
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.UserFollows
 * @property {string} userDid
 * @property {string} followerDid
 * @property {number} createdAt
 * @property {...ABTNodeClient.UserInfo} user
 * @property {boolean} isFollowing
 */

/**
 * Structure of ABTNodeClient.UserInfo
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.UserInfo
 * @property {string} did
 * @property {string} pk
 * @property {string} role
 * @property {string} avatar
 * @property {string} fullName
 * @property {string} email
 * @property {boolean} approved
 * @property {number} createdAt
 * @property {number} updatedAt
 * @property {string} locale
 * @property {Array<...ABTNodeClient.null>} passports
 * @property {number} firstLoginAt
 * @property {number} lastLoginAt
 * @property {string} remark
 * @property {string} lastLoginIp
 * @property {string} sourceProvider
 * @property {string} sourceAppPid
 * @property {Array<...ABTNodeClient.null>} connectedAccounts
 * @property {any} extra
 * @property {Array<...ABTNodeClient.null>} tags
 * @property {any} didSpace
 * @property {Array<...ABTNodeClient.null>} userSessions
 * @property {string} url
 * @property {string} phone
 * @property {string} inviter
 * @property {number} generation
 * @property {boolean} emailVerified
 * @property {boolean} phoneVerified
 * @property {...ABTNodeClient.UserMetadata} metadata
 * @property {...ABTNodeClient.UserAddress} address
 * @property {number} userSessionsCount
 * @property {boolean} isFollowing
 * @property {string} name
 * @property {string} createdByAppPid
 */

/**
 * Structure of ABTNodeClient.UserMetadata
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.UserMetadata
 * @property {string} bio
 * @property {string} location
 * @property {string} timezone
 * @property {string} cover
 * @property {Array<...ABTNodeClient.null>} links
 * @property {...ABTNodeClient.UserMetadataStatus} status
 * @property {...ABTNodeClient.UserPhoneInfo} phone
 */

/**
 * Structure of ABTNodeClient.UserMetadataLink
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.UserMetadataLink
 * @property {string} url
 * @property {string} favicon
 */

/**
 * Structure of ABTNodeClient.UserMetadataStatus
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.UserMetadataStatus
 * @property {string} label
 * @property {string} icon
 * @property {string} duration
 * @property {Array<...ABTNodeClient.null>} dateRange
 */

/**
 * Structure of ABTNodeClient.UserOrg
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.UserOrg
 * @property {string} id
 * @property {string} orgId
 * @property {string} userDid
 * @property {...ABTNodeClient.OrgUserStatus} status
 * @property {number} createdAt
 * @property {number} updatedAt
 * @property {...ABTNodeClient.UserInfo} user
 * @property {any} metadata
 */

/**
 * Structure of ABTNodeClient.UserPhoneInfo
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.UserPhoneInfo
 * @property {string} country
 * @property {string} phoneNumber
 */

/**
 * Structure of ABTNodeClient.UserSession
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.UserSession
 * @property {string} id
 * @property {string} visitorId
 * @property {string} appPid
 * @property {string} userDid
 * @property {string} ua
 * @property {string} passportId
 * @property {string} status
 * @property {string} lastLoginIp
 * @property {any} extra
 * @property {number} createdAt
 * @property {number} updatedAt
 * @property {string} createdByAppPid
 */

/**
 * Structure of ABTNodeClient.WAFPolicy
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.WAFPolicy
 * @property {boolean} enabled
 * @property {string} mode
 * @property {number} inboundAnomalyScoreThreshold
 * @property {number} outboundAnomalyScoreThreshold
 * @property {number} logLevel
 */

/**
 * Structure of ABTNodeClient.WalletInfo
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.WalletInfo
 * @property {string} did
 * @property {string} pk
 */

/**
 * Structure of ABTNodeClient.WebHook
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.WebHook
 * @property {...ABTNodeClient.SenderType} type
 * @property {string} id
 * @property {Array<...ABTNodeClient.null>} params
 * @property {number} createdAt
 * @property {number} updatedAt
 */

/**
 * Structure of ABTNodeClient.WebHookParam
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.WebHookParam
 * @property {string} name
 * @property {string} description
 * @property {boolean} required
 * @property {string} defaultValue
 * @property {string} value
 * @property {string} type
 * @property {boolean} enabled
 * @property {number} consecutiveFailures
 */

/**
 * Structure of ABTNodeClient.WebHookSender
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.WebHookSender
 * @property {...ABTNodeClient.SenderType} type
 * @property {string} title
 * @property {string} description
 * @property {Array<...ABTNodeClient.null>} params
 */

/**
 * Structure of ABTNodeClient.WebhookAttemptState
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.WebhookAttemptState
 * @property {string} id
 * @property {string} eventId
 * @property {string} webhookId
 * @property {string} status
 * @property {number} responseStatus
 * @property {any} responseBody
 * @property {number} retryCount
 * @property {number} createdAt
 * @property {number} updatedAt
 * @property {string} triggeredBy
 * @property {string} triggeredFrom
 */

/**
 * Structure of ABTNodeClient.WebhookAttemptWithEndpointEventState
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.WebhookAttemptWithEndpointEventState
 * @property {string} id
 * @property {string} eventId
 * @property {string} webhookId
 * @property {string} status
 * @property {number} responseStatus
 * @property {any} responseBody
 * @property {number} retryCount
 * @property {number} createdAt
 * @property {number} updatedAt
 * @property {...ABTNodeClient.WebhookEndpointState} endpoint
 * @property {...ABTNodeClient.WebhookEventState} event
 * @property {string} triggeredBy
 * @property {string} triggeredFrom
 */

/**
 * Structure of ABTNodeClient.WebhookEndpointState
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.WebhookEndpointState
 * @property {string} id
 * @property {string} apiVersion
 * @property {string} url
 * @property {string} description
 * @property {Array<...ABTNodeClient.null>} enabledEvents
 * @property {any} metadata
 * @property {string} status
 * @property {number} createdAt
 * @property {number} updatedAt
 * @property {string} secret
 */

/**
 * Structure of ABTNodeClient.WebhookEndpointWithUserInfo
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.WebhookEndpointWithUserInfo
 * @property {string} id
 * @property {string} apiVersion
 * @property {string} url
 * @property {string} description
 * @property {Array<...ABTNodeClient.null>} enabledEvents
 * @property {any} metadata
 * @property {string} status
 * @property {number} createdAt
 * @property {number} updatedAt
 * @property {...ABTNodeClient.UserInfo} createUser
 * @property {...ABTNodeClient.UserInfo} updateUser
 * @property {string} secret
 */

/**
 * Structure of ABTNodeClient.WebhookEventState
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.WebhookEventState
 * @property {string} id
 * @property {string} type
 * @property {string} apiVersion
 * @property {any} data
 * @property {string} objectType
 * @property {string} objectId
 * @property {any} request
 * @property {number} pendingWebhooks
 * @property {any} metadata
 * @property {number} createdAt
 * @property {number} updatedAt
 * @property {string} source
 */

/**
 * Structure of ABTNodeClient.WebhookStatistics
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.WebhookStatistics
 * @property {number} total
 * @property {Array<...ABTNodeClient.null>} pending
 * @property {Array<...ABTNodeClient.null>} success
 * @property {Array<...ABTNodeClient.null>} failed
 */

/**
 * Structure of ABTNodeClient.GetBlockletParams 
 *
 * Checkout the following snippet for the format of GetBlockletParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.GetBlockletParams
 * @property {...ABTNodeClient.RequestBlockletDetailInput} input
 */

/**
 * Structure of ABTNodeClient.GetBlockletMetaFromUrlParams 
 *
 * Checkout the following snippet for the format of GetBlockletMetaFromUrlParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.GetBlockletMetaFromUrlParams
 * @property {...ABTNodeClient.RequestBlockletMetaFromUrlInput} input
 */

/**
 * Structure of ABTNodeClient.GetBlockletDiffParams 
 *
 * Checkout the following snippet for the format of GetBlockletDiffParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.GetBlockletDiffParams
 * @property {...ABTNodeClient.RequestBlockletDiffInput} input
 */

/**
 * Structure of ABTNodeClient.GetBlockletsParams 
 *
 * Checkout the following snippet for the format of GetBlockletsParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.GetBlockletsParams
 * @property {...ABTNodeClient.RequestGetBlockletsInput} input
 */

/**
 * Structure of ABTNodeClient.GetBlockletRuntimeHistoryParams 
 *
 * Checkout the following snippet for the format of GetBlockletRuntimeHistoryParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.GetBlockletRuntimeHistoryParams
 * @property {...ABTNodeClient.RequestBlockletRuntimeHistoryInput} input
 */

/**
 * Structure of ABTNodeClient.GetDynamicComponentsParams 
 *
 * Checkout the following snippet for the format of GetDynamicComponentsParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.GetDynamicComponentsParams
 * @property {...ABTNodeClient.RequestGetDynamicComponentsInput} input
 */

/**
 * Structure of ABTNodeClient.GetNodeRuntimeHistoryParams 
 *
 * Checkout the following snippet for the format of GetNodeRuntimeHistoryParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.GetNodeRuntimeHistoryParams
 * @property {...ABTNodeClient.RequestNodeRuntimeHistoryInput} input
 */

/**
 * Structure of ABTNodeClient.GetBlockletMetaParams 
 *
 * Checkout the following snippet for the format of GetBlockletMetaParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.GetBlockletMetaParams
 * @property {...ABTNodeClient.RequestBlockletMetaInput} input
 */

/**
 * Structure of ABTNodeClient.GetNotificationsParams 
 *
 * Checkout the following snippet for the format of GetNotificationsParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.GetNotificationsParams
 * @property {...ABTNodeClient.RequestGetNotificationsInput} input
 */

/**
 * Structure of ABTNodeClient.MakeAllNotificationsAsReadParams 
 *
 * Checkout the following snippet for the format of MakeAllNotificationsAsReadParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.MakeAllNotificationsAsReadParams
 * @property {...ABTNodeClient.RequestMakeAllNotificationsAsReadInput} input
 */

/**
 * Structure of ABTNodeClient.GetNotificationSendLogParams 
 *
 * Checkout the following snippet for the format of GetNotificationSendLogParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.GetNotificationSendLogParams
 * @property {...ABTNodeClient.RequestNotificationSendLogInput} input
 */

/**
 * Structure of ABTNodeClient.GetReceiversParams 
 *
 * Checkout the following snippet for the format of GetReceiversParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.GetReceiversParams
 * @property {...ABTNodeClient.RequestReceiversInput} input
 */

/**
 * Structure of ABTNodeClient.GetNotificationComponentsParams 
 *
 * Checkout the following snippet for the format of GetNotificationComponentsParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.GetNotificationComponentsParams
 * @property {...ABTNodeClient.RequestNotificationComponentsInput} input
 */

/**
 * Structure of ABTNodeClient.ResendNotificationParams 
 *
 * Checkout the following snippet for the format of ResendNotificationParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.ResendNotificationParams
 * @property {...ABTNodeClient.RequestResendNotificationInput} input
 */

/**
 * Structure of ABTNodeClient.GetRoutingSitesParams 
 *
 * Checkout the following snippet for the format of GetRoutingSitesParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.GetRoutingSitesParams
 * @property {...ABTNodeClient.RequestGetRoutingSitesInput} input
 */

/**
 * Structure of ABTNodeClient.IsDidDomainParams 
 *
 * Checkout the following snippet for the format of IsDidDomainParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.IsDidDomainParams
 * @property {...ABTNodeClient.RequestIsDidDomainInput} input
 */

/**
 * Structure of ABTNodeClient.CheckDomainsParams 
 *
 * Checkout the following snippet for the format of CheckDomainsParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.CheckDomainsParams
 * @property {...ABTNodeClient.RequestCheckDomainsInput} input
 */

/**
 * Structure of ABTNodeClient.FindCertificateByDomainParams 
 *
 * Checkout the following snippet for the format of FindCertificateByDomainParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.FindCertificateByDomainParams
 * @property {...ABTNodeClient.RequestFindCertificateByDomainInput} input
 */

/**
 * Structure of ABTNodeClient.GetAccessKeysParams 
 *
 * Checkout the following snippet for the format of GetAccessKeysParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.GetAccessKeysParams
 * @property {...ABTNodeClient.RequestAccessKeysInput} input
 */

/**
 * Structure of ABTNodeClient.GetAccessKeyParams 
 *
 * Checkout the following snippet for the format of GetAccessKeyParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.GetAccessKeyParams
 * @property {...ABTNodeClient.RequestAccessKeyInput} input
 */

/**
 * Structure of ABTNodeClient.SendTestMessageParams 
 *
 * Checkout the following snippet for the format of SendTestMessageParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.SendTestMessageParams
 * @property {...ABTNodeClient.RequestSendMsgInput} input
 */

/**
 * Structure of ABTNodeClient.GetSessionParams 
 *
 * Checkout the following snippet for the format of GetSessionParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.GetSessionParams
 * @property {...ABTNodeClient.RequestGetSessionInput} input
 */

/**
 * Structure of ABTNodeClient.GetRolesParams 
 *
 * Checkout the following snippet for the format of GetRolesParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.GetRolesParams
 * @property {...ABTNodeClient.RequestGetOrgDataInput} input
 */

/**
 * Structure of ABTNodeClient.GetRoleParams 
 *
 * Checkout the following snippet for the format of GetRoleParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.GetRoleParams
 * @property {...ABTNodeClient.RequestTeamRoleInput} input
 */

/**
 * Structure of ABTNodeClient.GetPermissionsParams 
 *
 * Checkout the following snippet for the format of GetPermissionsParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.GetPermissionsParams
 * @property {...ABTNodeClient.TeamInput} input
 */

/**
 * Structure of ABTNodeClient.GetInvitationsParams 
 *
 * Checkout the following snippet for the format of GetInvitationsParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.GetInvitationsParams
 * @property {...ABTNodeClient.RequestGetOrgDataInput} input
 */

/**
 * Structure of ABTNodeClient.GetUsersParams 
 *
 * Checkout the following snippet for the format of GetUsersParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.GetUsersParams
 * @property {...ABTNodeClient.RequestUsersInput} input
 */

/**
 * Structure of ABTNodeClient.GetUserParams 
 *
 * Checkout the following snippet for the format of GetUserParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.GetUserParams
 * @property {...ABTNodeClient.RequestTeamUserInput} input
 */

/**
 * Structure of ABTNodeClient.GetUserSessionsParams 
 *
 * Checkout the following snippet for the format of GetUserSessionsParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.GetUserSessionsParams
 * @property {...ABTNodeClient.RequestUserSessionsInput} input
 */

/**
 * Structure of ABTNodeClient.GetUserSessionsCountParams 
 *
 * Checkout the following snippet for the format of GetUserSessionsCountParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.GetUserSessionsCountParams
 * @property {...ABTNodeClient.RequestUserSessionsCountInput} input
 */

/**
 * Structure of ABTNodeClient.GetUsersCountParams 
 *
 * Checkout the following snippet for the format of GetUsersCountParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.GetUsersCountParams
 * @property {...ABTNodeClient.TeamInput} input
 */

/**
 * Structure of ABTNodeClient.GetUsersCountPerRoleParams 
 *
 * Checkout the following snippet for the format of GetUsersCountPerRoleParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.GetUsersCountPerRoleParams
 * @property {...ABTNodeClient.TeamInput} input
 */

/**
 * Structure of ABTNodeClient.GetOwnerParams 
 *
 * Checkout the following snippet for the format of GetOwnerParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.GetOwnerParams
 * @property {...ABTNodeClient.TeamInput} input
 */

/**
 * Structure of ABTNodeClient.GetPermissionsByRoleParams 
 *
 * Checkout the following snippet for the format of GetPermissionsByRoleParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.GetPermissionsByRoleParams
 * @property {...ABTNodeClient.RequestTeamRoleInput} input
 */

/**
 * Structure of ABTNodeClient.GetPassportIssuancesParams 
 *
 * Checkout the following snippet for the format of GetPassportIssuancesParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.GetPassportIssuancesParams
 * @property {...ABTNodeClient.RequestGetPassportIssuancesInput} input
 */

/**
 * Structure of ABTNodeClient.LogoutUserParams 
 *
 * Checkout the following snippet for the format of LogoutUserParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.LogoutUserParams
 * @property {...ABTNodeClient.RequestLogoutUserInput} input
 */

/**
 * Structure of ABTNodeClient.DestroySelfParams 
 *
 * Checkout the following snippet for the format of DestroySelfParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.DestroySelfParams
 * @property {...ABTNodeClient.RequestTeamUserInput} input
 */

/**
 * Structure of ABTNodeClient.GetUserFollowersParams 
 *
 * Checkout the following snippet for the format of GetUserFollowersParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.GetUserFollowersParams
 * @property {...ABTNodeClient.RequestUserRelationQueryInput} input
 */

/**
 * Structure of ABTNodeClient.GetUserFollowingParams 
 *
 * Checkout the following snippet for the format of GetUserFollowingParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.GetUserFollowingParams
 * @property {...ABTNodeClient.RequestUserRelationQueryInput} input
 */

/**
 * Structure of ABTNodeClient.GetUserFollowStatsParams 
 *
 * Checkout the following snippet for the format of GetUserFollowStatsParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.GetUserFollowStatsParams
 * @property {...ABTNodeClient.RequestUserRelationCountInput} input
 */

/**
 * Structure of ABTNodeClient.CheckFollowingParams 
 *
 * Checkout the following snippet for the format of CheckFollowingParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.CheckFollowingParams
 * @property {...ABTNodeClient.RequestCheckFollowingInput} input
 */

/**
 * Structure of ABTNodeClient.FollowUserParams 
 *
 * Checkout the following snippet for the format of FollowUserParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.FollowUserParams
 * @property {...ABTNodeClient.RequestFollowUserActionInput} input
 */

/**
 * Structure of ABTNodeClient.UnfollowUserParams 
 *
 * Checkout the following snippet for the format of UnfollowUserParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.UnfollowUserParams
 * @property {...ABTNodeClient.RequestFollowUserActionInput} input
 */

/**
 * Structure of ABTNodeClient.GetUserInvitesParams 
 *
 * Checkout the following snippet for the format of GetUserInvitesParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.GetUserInvitesParams
 * @property {...ABTNodeClient.RequestUserRelationQueryInput} input
 */

/**
 * Structure of ABTNodeClient.GetTagsParams 
 *
 * Checkout the following snippet for the format of GetTagsParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.GetTagsParams
 * @property {...ABTNodeClient.RequestTagsInput} input
 */

/**
 * Structure of ABTNodeClient.GetAuditLogsParams 
 *
 * Checkout the following snippet for the format of GetAuditLogsParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.GetAuditLogsParams
 * @property {...ABTNodeClient.RequestGetAuditLogsInput} input
 */

/**
 * Structure of ABTNodeClient.GetLauncherSessionParams 
 *
 * Checkout the following snippet for the format of GetLauncherSessionParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.GetLauncherSessionParams
 * @property {...ABTNodeClient.RequestGetLauncherSessionInput} input
 */

/**
 * Structure of ABTNodeClient.GetBlockletBackupsParams 
 *
 * Checkout the following snippet for the format of GetBlockletBackupsParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.GetBlockletBackupsParams
 * @property {...ABTNodeClient.RequestGetBlockletBackupsInput} input
 */

/**
 * Structure of ABTNodeClient.GetBlockletBackupSummaryParams 
 *
 * Checkout the following snippet for the format of GetBlockletBackupSummaryParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.GetBlockletBackupSummaryParams
 * @property {...ABTNodeClient.RequestGetBlockletBackupSummaryInput} input
 */

/**
 * Structure of ABTNodeClient.GetBlockletSpaceGatewaysParams 
 *
 * Checkout the following snippet for the format of GetBlockletSpaceGatewaysParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.GetBlockletSpaceGatewaysParams
 * @property {...ABTNodeClient.RequestBlockletInput} input
 */

/**
 * Structure of ABTNodeClient.GetTrafficInsightsParams 
 *
 * Checkout the following snippet for the format of GetTrafficInsightsParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.GetTrafficInsightsParams
 * @property {...ABTNodeClient.RequestGetTrafficInsightsInput} input
 */

/**
 * Structure of ABTNodeClient.GetProjectsParams 
 *
 * Checkout the following snippet for the format of GetProjectsParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.GetProjectsParams
 * @property {...ABTNodeClient.RequestGetProjectsInput} input
 */

/**
 * Structure of ABTNodeClient.GetProjectParams 
 *
 * Checkout the following snippet for the format of GetProjectParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.GetProjectParams
 * @property {...ABTNodeClient.RequestProjectInput} input
 */

/**
 * Structure of ABTNodeClient.GetReleasesParams 
 *
 * Checkout the following snippet for the format of GetReleasesParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.GetReleasesParams
 * @property {...ABTNodeClient.RequestGetReleasesInput} input
 */

/**
 * Structure of ABTNodeClient.GetReleaseParams 
 *
 * Checkout the following snippet for the format of GetReleaseParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.GetReleaseParams
 * @property {...ABTNodeClient.RequestReleaseInput} input
 */

/**
 * Structure of ABTNodeClient.GetSelectedResourcesParams 
 *
 * Checkout the following snippet for the format of GetSelectedResourcesParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.GetSelectedResourcesParams
 * @property {...ABTNodeClient.RequestGetSelectedResourcesInput} input
 */

/**
 * Structure of ABTNodeClient.GetBlockletSecurityRuleParams 
 *
 * Checkout the following snippet for the format of GetBlockletSecurityRuleParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.GetBlockletSecurityRuleParams
 * @property {...ABTNodeClient.RequestGetBlockletSecurityRuleInput} input
 */

/**
 * Structure of ABTNodeClient.GetBlockletSecurityRulesParams 
 *
 * Checkout the following snippet for the format of GetBlockletSecurityRulesParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.GetBlockletSecurityRulesParams
 * @property {...ABTNodeClient.RequestGetBlockletSecurityRulesInput} input
 */

/**
 * Structure of ABTNodeClient.GetBlockletResponseHeaderPolicyParams 
 *
 * Checkout the following snippet for the format of GetBlockletResponseHeaderPolicyParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.GetBlockletResponseHeaderPolicyParams
 * @property {...ABTNodeClient.RequestGetBlockletResponseHeaderPolicyInput} input
 */

/**
 * Structure of ABTNodeClient.GetBlockletResponseHeaderPoliciesParams 
 *
 * Checkout the following snippet for the format of GetBlockletResponseHeaderPoliciesParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.GetBlockletResponseHeaderPoliciesParams
 * @property {...ABTNodeClient.RequestGetBlockletResponseHeaderPoliciesInput} input
 */

/**
 * Structure of ABTNodeClient.GetBlockletAccessPolicyParams 
 *
 * Checkout the following snippet for the format of GetBlockletAccessPolicyParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.GetBlockletAccessPolicyParams
 * @property {...ABTNodeClient.RequestGetBlockletAccessPolicyInput} input
 */

/**
 * Structure of ABTNodeClient.GetBlockletAccessPoliciesParams 
 *
 * Checkout the following snippet for the format of GetBlockletAccessPoliciesParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.GetBlockletAccessPoliciesParams
 * @property {...ABTNodeClient.RequestGetBlockletAccessPoliciesInput} input
 */

/**
 * Structure of ABTNodeClient.GetWebhookEndpointsParams 
 *
 * Checkout the following snippet for the format of GetWebhookEndpointsParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.GetWebhookEndpointsParams
 * @property {...ABTNodeClient.RequestGetWebhookEndpointsInput} input
 */

/**
 * Structure of ABTNodeClient.GetWebhookEndpointParams 
 *
 * Checkout the following snippet for the format of GetWebhookEndpointParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.GetWebhookEndpointParams
 * @property {...ABTNodeClient.RequestGetWebhookEndpointInput} input
 */

/**
 * Structure of ABTNodeClient.GetWebhookAttemptsParams 
 *
 * Checkout the following snippet for the format of GetWebhookAttemptsParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.GetWebhookAttemptsParams
 * @property {...ABTNodeClient.RequestGetWebhookAttemptsInput} input
 */

/**
 * Structure of ABTNodeClient.GetPassportRoleCountsParams 
 *
 * Checkout the following snippet for the format of GetPassportRoleCountsParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.GetPassportRoleCountsParams
 * @property {...ABTNodeClient.TeamInput} input
 */

/**
 * Structure of ABTNodeClient.GetPassportsByRoleParams 
 *
 * Checkout the following snippet for the format of GetPassportsByRoleParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.GetPassportsByRoleParams
 * @property {...ABTNodeClient.RequestPassportInput} input
 */

/**
 * Structure of ABTNodeClient.GetPassportLogsParams 
 *
 * Checkout the following snippet for the format of GetPassportLogsParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.GetPassportLogsParams
 * @property {...ABTNodeClient.RequestPassportLogInput} input
 */

/**
 * Structure of ABTNodeClient.GetRelatedPassportsParams 
 *
 * Checkout the following snippet for the format of GetRelatedPassportsParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.GetRelatedPassportsParams
 * @property {...ABTNodeClient.RequestRelatedPassportsInput} input
 */

/**
 * Structure of ABTNodeClient.GetBlockletBaseInfoParams 
 *
 * Checkout the following snippet for the format of GetBlockletBaseInfoParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.GetBlockletBaseInfoParams
 * @property {...ABTNodeClient.TeamInput} input
 */

/**
 * Structure of ABTNodeClient.GetDomainDnsParams 
 *
 * Checkout the following snippet for the format of GetDomainDnsParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.GetDomainDnsParams
 * @property {...ABTNodeClient.RequestDomainDNSInput} input
 */

/**
 * Structure of ABTNodeClient.GetOAuthClientsParams 
 *
 * Checkout the following snippet for the format of GetOAuthClientsParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.GetOAuthClientsParams
 * @property {...ABTNodeClient.TeamInput} input
 */

/**
 * Structure of ABTNodeClient.CreateOAuthClientParams 
 *
 * Checkout the following snippet for the format of CreateOAuthClientParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.CreateOAuthClientParams
 * @property {...ABTNodeClient.RequestOAuthClientInput} input
 */

/**
 * Structure of ABTNodeClient.UpdateOAuthClientParams 
 *
 * Checkout the following snippet for the format of UpdateOAuthClientParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.UpdateOAuthClientParams
 * @property {...ABTNodeClient.RequestOAuthClientInput} input
 */

/**
 * Structure of ABTNodeClient.DeleteOAuthClientParams 
 *
 * Checkout the following snippet for the format of DeleteOAuthClientParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.DeleteOAuthClientParams
 * @property {...ABTNodeClient.RequestDeleteOAuthClientInput} input
 */

/**
 * Structure of ABTNodeClient.GetOrgsParams 
 *
 * Checkout the following snippet for the format of GetOrgsParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.GetOrgsParams
 * @property {...ABTNodeClient.RequestGetOrgsInput} input
 */

/**
 * Structure of ABTNodeClient.GetOrgParams 
 *
 * Checkout the following snippet for the format of GetOrgParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.GetOrgParams
 * @property {...ABTNodeClient.RequestGetOrgInput} input
 */

/**
 * Structure of ABTNodeClient.GetOrgMembersParams 
 *
 * Checkout the following snippet for the format of GetOrgMembersParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.GetOrgMembersParams
 * @property {...ABTNodeClient.RequestGetOrgDataInput} input
 */

/**
 * Structure of ABTNodeClient.GetOrgInvitableUsersParams 
 *
 * Checkout the following snippet for the format of GetOrgInvitableUsersParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.GetOrgInvitableUsersParams
 * @property {...ABTNodeClient.RequestInvitableUsersInput} input
 */

/**
 * Structure of ABTNodeClient.GetOrgResourceParams 
 *
 * Checkout the following snippet for the format of GetOrgResourceParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.GetOrgResourceParams
 * @property {...ABTNodeClient.RequestGetOrgResourceInput} input
 */

/**
 * Structure of ABTNodeClient.InstallBlockletParams 
 *
 * Checkout the following snippet for the format of InstallBlockletParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.InstallBlockletParams
 * @property {...ABTNodeClient.RequestInstallBlockletInput} input
 */

/**
 * Structure of ABTNodeClient.InstallComponentParams 
 *
 * Checkout the following snippet for the format of InstallComponentParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.InstallComponentParams
 * @property {...ABTNodeClient.RequestInstallComponentInput} input
 */

/**
 * Structure of ABTNodeClient.StartBlockletParams 
 *
 * Checkout the following snippet for the format of StartBlockletParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.StartBlockletParams
 * @property {...ABTNodeClient.RequestComponentsInput} input
 */

/**
 * Structure of ABTNodeClient.StopBlockletParams 
 *
 * Checkout the following snippet for the format of StopBlockletParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.StopBlockletParams
 * @property {...ABTNodeClient.RequestComponentsInput} input
 */

/**
 * Structure of ABTNodeClient.ReloadBlockletParams 
 *
 * Checkout the following snippet for the format of ReloadBlockletParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.ReloadBlockletParams
 * @property {...ABTNodeClient.RequestComponentsInput} input
 */

/**
 * Structure of ABTNodeClient.RestartBlockletParams 
 *
 * Checkout the following snippet for the format of RestartBlockletParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RestartBlockletParams
 * @property {...ABTNodeClient.RequestComponentsInput} input
 */

/**
 * Structure of ABTNodeClient.DeleteBlockletParams 
 *
 * Checkout the following snippet for the format of DeleteBlockletParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.DeleteBlockletParams
 * @property {...ABTNodeClient.RequestDeleteBlockletInput} input
 */

/**
 * Structure of ABTNodeClient.DeleteComponentParams 
 *
 * Checkout the following snippet for the format of DeleteComponentParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.DeleteComponentParams
 * @property {...ABTNodeClient.RequestDeleteComponentInput} input
 */

/**
 * Structure of ABTNodeClient.CancelDownloadBlockletParams 
 *
 * Checkout the following snippet for the format of CancelDownloadBlockletParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.CancelDownloadBlockletParams
 * @property {...ABTNodeClient.RequestBlockletInput} input
 */

/**
 * Structure of ABTNodeClient.CheckComponentsForUpdatesParams 
 *
 * Checkout the following snippet for the format of CheckComponentsForUpdatesParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.CheckComponentsForUpdatesParams
 * @property {...ABTNodeClient.RequestBlockletInput} input
 */

/**
 * Structure of ABTNodeClient.UpgradeComponentsParams 
 *
 * Checkout the following snippet for the format of UpgradeComponentsParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.UpgradeComponentsParams
 * @property {...ABTNodeClient.RequestUpdateComponentsInput} input
 */

/**
 * Structure of ABTNodeClient.ConfigBlockletParams 
 *
 * Checkout the following snippet for the format of ConfigBlockletParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.ConfigBlockletParams
 * @property {...ABTNodeClient.RequestConfigBlockletInput} input
 */

/**
 * Structure of ABTNodeClient.ConfigPublicToStoreParams 
 *
 * Checkout the following snippet for the format of ConfigPublicToStoreParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.ConfigPublicToStoreParams
 * @property {...ABTNodeClient.RequestConfigPublicToStoreInput} input
 */

/**
 * Structure of ABTNodeClient.ConfigNavigationsParams 
 *
 * Checkout the following snippet for the format of ConfigNavigationsParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.ConfigNavigationsParams
 * @property {...ABTNodeClient.RequestConfigNavigationsInput} input
 */

/**
 * Structure of ABTNodeClient.ConfigAuthenticationParams 
 *
 * Checkout the following snippet for the format of ConfigAuthenticationParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.ConfigAuthenticationParams
 * @property {...ABTNodeClient.RequestConfigAuthenticationInput} input
 */

/**
 * Structure of ABTNodeClient.ConfigDidConnectParams 
 *
 * Checkout the following snippet for the format of ConfigDidConnectParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.ConfigDidConnectParams
 * @property {...ABTNodeClient.RequestConfigDidConnectInput} input
 */

/**
 * Structure of ABTNodeClient.ConfigDidConnectActionsParams 
 *
 * Checkout the following snippet for the format of ConfigDidConnectActionsParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.ConfigDidConnectActionsParams
 * @property {...ABTNodeClient.RequestConfigDidConnectActionsInput} input
 */

/**
 * Structure of ABTNodeClient.ConfigNotificationParams 
 *
 * Checkout the following snippet for the format of ConfigNotificationParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.ConfigNotificationParams
 * @property {...ABTNodeClient.RequestConfigNotificationInput} input
 */

/**
 * Structure of ABTNodeClient.ConfigVaultParams 
 *
 * Checkout the following snippet for the format of ConfigVaultParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.ConfigVaultParams
 * @property {...ABTNodeClient.RequestConfigVaultInput} input
 */

/**
 * Structure of ABTNodeClient.SendEmailParams 
 *
 * Checkout the following snippet for the format of SendEmailParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.SendEmailParams
 * @property {...ABTNodeClient.RequestSendEmailInput} input
 */

/**
 * Structure of ABTNodeClient.SendPushParams 
 *
 * Checkout the following snippet for the format of SendPushParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.SendPushParams
 * @property {...ABTNodeClient.RequestSendPushInput} input
 */

/**
 * Structure of ABTNodeClient.JoinFederatedLoginParams 
 *
 * Checkout the following snippet for the format of JoinFederatedLoginParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.JoinFederatedLoginParams
 * @property {...ABTNodeClient.RequestJoinFederatedLoginInput} input
 */

/**
 * Structure of ABTNodeClient.QuitFederatedLoginParams 
 *
 * Checkout the following snippet for the format of QuitFederatedLoginParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.QuitFederatedLoginParams
 * @property {...ABTNodeClient.RequestQuitFederatedLoginInput} input
 */

/**
 * Structure of ABTNodeClient.DisbandFederatedLoginParams 
 *
 * Checkout the following snippet for the format of DisbandFederatedLoginParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.DisbandFederatedLoginParams
 * @property {...ABTNodeClient.RequestDisbandFederatedLoginInput} input
 */

/**
 * Structure of ABTNodeClient.SyncMasterAuthorizationParams 
 *
 * Checkout the following snippet for the format of SyncMasterAuthorizationParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.SyncMasterAuthorizationParams
 * @property {...ABTNodeClient.RequestSyncMasterAuthorizationInput} input
 */

/**
 * Structure of ABTNodeClient.SyncFederatedConfigParams 
 *
 * Checkout the following snippet for the format of SyncFederatedConfigParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.SyncFederatedConfigParams
 * @property {...ABTNodeClient.RequestSyncFederatedInput} input
 */

/**
 * Structure of ABTNodeClient.AuditFederatedLoginParams 
 *
 * Checkout the following snippet for the format of AuditFederatedLoginParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.AuditFederatedLoginParams
 * @property {...ABTNodeClient.RequestAuditFederatedLoginInput} input
 */

/**
 * Structure of ABTNodeClient.UpdateAppSessionConfigParams 
 *
 * Checkout the following snippet for the format of UpdateAppSessionConfigParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.UpdateAppSessionConfigParams
 * @property {...ABTNodeClient.RequestUpdateAppSessionConfigInput} input
 */

/**
 * Structure of ABTNodeClient.UpdateComponentTitleParams 
 *
 * Checkout the following snippet for the format of UpdateComponentTitleParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.UpdateComponentTitleParams
 * @property {...ABTNodeClient.RequestUpdateComponentTitleInput} input
 */

/**
 * Structure of ABTNodeClient.UpdateComponentMountPointParams 
 *
 * Checkout the following snippet for the format of UpdateComponentMountPointParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.UpdateComponentMountPointParams
 * @property {...ABTNodeClient.RequestUpdateComponentMountPointInput} input
 */

/**
 * Structure of ABTNodeClient.BackupBlockletParams 
 *
 * Checkout the following snippet for the format of BackupBlockletParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.BackupBlockletParams
 * @property {...ABTNodeClient.RequestBackupBlockletInput} input
 */

/**
 * Structure of ABTNodeClient.AbortBlockletBackupParams 
 *
 * Checkout the following snippet for the format of AbortBlockletBackupParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.AbortBlockletBackupParams
 * @property {...ABTNodeClient.RequestAbortBlockletBackupInput} input
 */

/**
 * Structure of ABTNodeClient.RestoreBlockletParams 
 *
 * Checkout the following snippet for the format of RestoreBlockletParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RestoreBlockletParams
 * @property {...ABTNodeClient.RequestRestoreBlockletInput} input
 */

/**
 * Structure of ABTNodeClient.MigrateApplicationToStructV2Params 
 *
 * Checkout the following snippet for the format of MigrateApplicationToStructV2Params:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.MigrateApplicationToStructV2Params
 * @property {...ABTNodeClient.RequestMigrateApplicationToStructV2Input} input
 */

/**
 * Structure of ABTNodeClient.LaunchBlockletByLauncherParams 
 *
 * Checkout the following snippet for the format of LaunchBlockletByLauncherParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.LaunchBlockletByLauncherParams
 * @property {...ABTNodeClient.RequestLaunchBlockletByLauncherInput} input
 */

/**
 * Structure of ABTNodeClient.LaunchBlockletWithoutWalletParams 
 *
 * Checkout the following snippet for the format of LaunchBlockletWithoutWalletParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.LaunchBlockletWithoutWalletParams
 * @property {...ABTNodeClient.RequestLaunchBlockletWithoutWalletInput} input
 */

/**
 * Structure of ABTNodeClient.AddBlockletSpaceGatewayParams 
 *
 * Checkout the following snippet for the format of AddBlockletSpaceGatewayParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.AddBlockletSpaceGatewayParams
 * @property {...ABTNodeClient.RequestAddBlockletSpaceGatewayInput} input
 */

/**
 * Structure of ABTNodeClient.DeleteBlockletSpaceGatewayParams 
 *
 * Checkout the following snippet for the format of DeleteBlockletSpaceGatewayParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.DeleteBlockletSpaceGatewayParams
 * @property {...ABTNodeClient.RequestDeleteBlockletSpaceGatewayInput} input
 */

/**
 * Structure of ABTNodeClient.UpdateBlockletSpaceGatewayParams 
 *
 * Checkout the following snippet for the format of UpdateBlockletSpaceGatewayParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.UpdateBlockletSpaceGatewayParams
 * @property {...ABTNodeClient.RequestUpdateBlockletSpaceGatewayInput} input
 */

/**
 * Structure of ABTNodeClient.UpdateAutoBackupParams 
 *
 * Checkout the following snippet for the format of UpdateAutoBackupParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.UpdateAutoBackupParams
 * @property {...ABTNodeClient.RequestUpdateAutoBackupInput} input
 */

/**
 * Structure of ABTNodeClient.UpdateAutoCheckUpdateParams 
 *
 * Checkout the following snippet for the format of UpdateAutoCheckUpdateParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.UpdateAutoCheckUpdateParams
 * @property {...ABTNodeClient.RequestUpdateAutoCheckUpdateInput} input
 */

/**
 * Structure of ABTNodeClient.UpdateBlockletSettingsParams 
 *
 * Checkout the following snippet for the format of UpdateBlockletSettingsParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.UpdateBlockletSettingsParams
 * @property {...ABTNodeClient.RequestBlockletSettingsInput} input
 */

/**
 * Structure of ABTNodeClient.UpdateNodeInfoParams 
 *
 * Checkout the following snippet for the format of UpdateNodeInfoParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.UpdateNodeInfoParams
 * @property {...ABTNodeClient.NodeInfoInput} input
 */

/**
 * Structure of ABTNodeClient.UpgradeNodeVersionParams 
 *
 * Checkout the following snippet for the format of UpgradeNodeVersionParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.UpgradeNodeVersionParams
 * @property {...ABTNodeClient.RequestUpgradeNodeVersionInput} input
 */

/**
 * Structure of ABTNodeClient.ResetNodeParams 
 *
 * Checkout the following snippet for the format of ResetNodeParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.ResetNodeParams
 * @property {...ABTNodeClient.RequestResetNodeInput} input
 */

/**
 * Structure of ABTNodeClient.RotateSessionKeyParams 
 *
 * Checkout the following snippet for the format of RotateSessionKeyParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RotateSessionKeyParams
 * @property {...ABTNodeClient.RequestRotateSessionKeyInput} input
 */

/**
 * Structure of ABTNodeClient.UpdateGatewayParams 
 *
 * Checkout the following snippet for the format of UpdateGatewayParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.UpdateGatewayParams
 * @property {...ABTNodeClient.GatewayInput} input
 */

/**
 * Structure of ABTNodeClient.ClearCacheParams 
 *
 * Checkout the following snippet for the format of ClearCacheParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.ClearCacheParams
 * @property {...ABTNodeClient.RequestClearCacheInput} input
 */

/**
 * Structure of ABTNodeClient.CreateMemberInvitationParams 
 *
 * Checkout the following snippet for the format of CreateMemberInvitationParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.CreateMemberInvitationParams
 * @property {...ABTNodeClient.RequestCreateInvitationInput} input
 */

/**
 * Structure of ABTNodeClient.CreateTransferInvitationParams 
 *
 * Checkout the following snippet for the format of CreateTransferInvitationParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.CreateTransferInvitationParams
 * @property {...ABTNodeClient.RequestCreateTransferNodeInvitationInput} input
 */

/**
 * Structure of ABTNodeClient.DeleteInvitationParams 
 *
 * Checkout the following snippet for the format of DeleteInvitationParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.DeleteInvitationParams
 * @property {...ABTNodeClient.RequestDeleteInvitationInput} input
 */

/**
 * Structure of ABTNodeClient.CreatePassportIssuanceParams 
 *
 * Checkout the following snippet for the format of CreatePassportIssuanceParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.CreatePassportIssuanceParams
 * @property {...ABTNodeClient.RequestCreatePassportIssuanceInput} input
 */

/**
 * Structure of ABTNodeClient.DeletePassportIssuanceParams 
 *
 * Checkout the following snippet for the format of DeletePassportIssuanceParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.DeletePassportIssuanceParams
 * @property {...ABTNodeClient.RequestDeleteTeamSessionInput} input
 */

/**
 * Structure of ABTNodeClient.ConfigTrustedPassportsParams 
 *
 * Checkout the following snippet for the format of ConfigTrustedPassportsParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.ConfigTrustedPassportsParams
 * @property {...ABTNodeClient.RequestConfigTrustedPassportsInput} input
 */

/**
 * Structure of ABTNodeClient.ConfigTrustedFactoriesParams 
 *
 * Checkout the following snippet for the format of ConfigTrustedFactoriesParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.ConfigTrustedFactoriesParams
 * @property {...ABTNodeClient.RequestConfigTrustedFactoriesInput} input
 */

/**
 * Structure of ABTNodeClient.ConfigPassportIssuanceParams 
 *
 * Checkout the following snippet for the format of ConfigPassportIssuanceParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.ConfigPassportIssuanceParams
 * @property {...ABTNodeClient.RequestConfigPassportIssuanceInput} input
 */

/**
 * Structure of ABTNodeClient.RemoveUserParams 
 *
 * Checkout the following snippet for the format of RemoveUserParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RemoveUserParams
 * @property {...ABTNodeClient.RequestTeamUserInput} input
 */

/**
 * Structure of ABTNodeClient.UpdateUserTagsParams 
 *
 * Checkout the following snippet for the format of UpdateUserTagsParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.UpdateUserTagsParams
 * @property {...ABTNodeClient.RequestUpdateUserTagsInput} input
 */

/**
 * Structure of ABTNodeClient.UpdateUserExtraParams 
 *
 * Checkout the following snippet for the format of UpdateUserExtraParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.UpdateUserExtraParams
 * @property {...ABTNodeClient.RequestUpdateUserExtraInput} input
 */

/**
 * Structure of ABTNodeClient.UpdateUserApprovalParams 
 *
 * Checkout the following snippet for the format of UpdateUserApprovalParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.UpdateUserApprovalParams
 * @property {...ABTNodeClient.RequestTeamUserInput} input
 */

/**
 * Structure of ABTNodeClient.IssuePassportToUserParams 
 *
 * Checkout the following snippet for the format of IssuePassportToUserParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.IssuePassportToUserParams
 * @property {...ABTNodeClient.RequestIssuePassportToUserInput} input
 */

/**
 * Structure of ABTNodeClient.RevokeUserPassportParams 
 *
 * Checkout the following snippet for the format of RevokeUserPassportParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RevokeUserPassportParams
 * @property {...ABTNodeClient.RequestRevokeUserPassportInput} input
 */

/**
 * Structure of ABTNodeClient.EnableUserPassportParams 
 *
 * Checkout the following snippet for the format of EnableUserPassportParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.EnableUserPassportParams
 * @property {...ABTNodeClient.RequestRevokeUserPassportInput} input
 */

/**
 * Structure of ABTNodeClient.RemoveUserPassportParams 
 *
 * Checkout the following snippet for the format of RemoveUserPassportParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RemoveUserPassportParams
 * @property {...ABTNodeClient.RequestRevokeUserPassportInput} input
 */

/**
 * Structure of ABTNodeClient.SwitchProfileParams 
 *
 * Checkout the following snippet for the format of SwitchProfileParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.SwitchProfileParams
 * @property {...ABTNodeClient.RequestSwitchProfileInput} input
 */

/**
 * Structure of ABTNodeClient.UpdateUserAddressParams 
 *
 * Checkout the following snippet for the format of UpdateUserAddressParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.UpdateUserAddressParams
 * @property {...ABTNodeClient.RequestUpdateUserAddressInput} input
 */

/**
 * Structure of ABTNodeClient.UpdateUserInfoParams 
 *
 * Checkout the following snippet for the format of UpdateUserInfoParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.UpdateUserInfoParams
 * @property {...ABTNodeClient.RequestUpdateUserInfoInput} input
 */

/**
 * Structure of ABTNodeClient.CreateRoleParams 
 *
 * Checkout the following snippet for the format of CreateRoleParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.CreateRoleParams
 * @property {...ABTNodeClient.RequestCreateRoleInput} input
 */

/**
 * Structure of ABTNodeClient.UpdateRoleParams 
 *
 * Checkout the following snippet for the format of UpdateRoleParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.UpdateRoleParams
 * @property {...ABTNodeClient.RequestTeamRoleInput} input
 */

/**
 * Structure of ABTNodeClient.DeleteRoleParams 
 *
 * Checkout the following snippet for the format of DeleteRoleParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.DeleteRoleParams
 * @property {...ABTNodeClient.RequestDeleteRoleInput} input
 */

/**
 * Structure of ABTNodeClient.CreatePermissionParams 
 *
 * Checkout the following snippet for the format of CreatePermissionParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.CreatePermissionParams
 * @property {...ABTNodeClient.RequestCreatePermissionInput} input
 */

/**
 * Structure of ABTNodeClient.UpdatePermissionParams 
 *
 * Checkout the following snippet for the format of UpdatePermissionParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.UpdatePermissionParams
 * @property {...ABTNodeClient.RequestTeamPermissionInput} input
 */

/**
 * Structure of ABTNodeClient.DeletePermissionParams 
 *
 * Checkout the following snippet for the format of DeletePermissionParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.DeletePermissionParams
 * @property {...ABTNodeClient.RequestDeletePermissionInput} input
 */

/**
 * Structure of ABTNodeClient.GrantPermissionForRoleParams 
 *
 * Checkout the following snippet for the format of GrantPermissionForRoleParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.GrantPermissionForRoleParams
 * @property {...ABTNodeClient.RequestGrantPermissionForRoleInput} input
 */

/**
 * Structure of ABTNodeClient.RevokePermissionFromRoleParams 
 *
 * Checkout the following snippet for the format of RevokePermissionFromRoleParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RevokePermissionFromRoleParams
 * @property {...ABTNodeClient.RequestRevokePermissionFromRoleInput} input
 */

/**
 * Structure of ABTNodeClient.UpdatePermissionsForRoleParams 
 *
 * Checkout the following snippet for the format of UpdatePermissionsForRoleParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.UpdatePermissionsForRoleParams
 * @property {...ABTNodeClient.RequestUpdatePermissionsForRoleInput} input
 */

/**
 * Structure of ABTNodeClient.HasPermissionParams 
 *
 * Checkout the following snippet for the format of HasPermissionParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.HasPermissionParams
 * @property {...ABTNodeClient.RequestHasPermissionInput} input
 */

/**
 * Structure of ABTNodeClient.AddBlockletStoreParams 
 *
 * Checkout the following snippet for the format of AddBlockletStoreParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.AddBlockletStoreParams
 * @property {...ABTNodeClient.RequestAddBlockletStoreInput} input
 */

/**
 * Structure of ABTNodeClient.DeleteBlockletStoreParams 
 *
 * Checkout the following snippet for the format of DeleteBlockletStoreParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.DeleteBlockletStoreParams
 * @property {...ABTNodeClient.RequestDeleteBlockletStoreInput} input
 */

/**
 * Structure of ABTNodeClient.GetTagParams 
 *
 * Checkout the following snippet for the format of GetTagParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.GetTagParams
 * @property {...ABTNodeClient.RequestTagInput} input
 */

/**
 * Structure of ABTNodeClient.CreateTagParams 
 *
 * Checkout the following snippet for the format of CreateTagParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.CreateTagParams
 * @property {...ABTNodeClient.RequestTagInput} input
 */

/**
 * Structure of ABTNodeClient.UpdateTagParams 
 *
 * Checkout the following snippet for the format of UpdateTagParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.UpdateTagParams
 * @property {...ABTNodeClient.RequestTagInput} input
 */

/**
 * Structure of ABTNodeClient.DeleteTagParams 
 *
 * Checkout the following snippet for the format of DeleteTagParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.DeleteTagParams
 * @property {...ABTNodeClient.RequestTagInput} input
 */

/**
 * Structure of ABTNodeClient.CreateTaggingParams 
 *
 * Checkout the following snippet for the format of CreateTaggingParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.CreateTaggingParams
 * @property {...ABTNodeClient.RequestTaggingInput} input
 */

/**
 * Structure of ABTNodeClient.DeleteTaggingParams 
 *
 * Checkout the following snippet for the format of DeleteTaggingParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.DeleteTaggingParams
 * @property {...ABTNodeClient.RequestTaggingInput} input
 */

/**
 * Structure of ABTNodeClient.ReadNotificationsParams 
 *
 * Checkout the following snippet for the format of ReadNotificationsParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.ReadNotificationsParams
 * @property {...ABTNodeClient.RequestReadNotificationsInput} input
 */

/**
 * Structure of ABTNodeClient.UnreadNotificationsParams 
 *
 * Checkout the following snippet for the format of UnreadNotificationsParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.UnreadNotificationsParams
 * @property {...ABTNodeClient.RequestReadNotificationsInput} input
 */

/**
 * Structure of ABTNodeClient.AddRoutingSiteParams 
 *
 * Checkout the following snippet for the format of AddRoutingSiteParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.AddRoutingSiteParams
 * @property {...ABTNodeClient.RequestAddRoutingSiteInput} input
 */

/**
 * Structure of ABTNodeClient.AddDomainAliasParams 
 *
 * Checkout the following snippet for the format of AddDomainAliasParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.AddDomainAliasParams
 * @property {...ABTNodeClient.RequestAddDomainAliasInput} input
 */

/**
 * Structure of ABTNodeClient.DeleteDomainAliasParams 
 *
 * Checkout the following snippet for the format of DeleteDomainAliasParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.DeleteDomainAliasParams
 * @property {...ABTNodeClient.RequestDeleteDomainAliasInput} input
 */

/**
 * Structure of ABTNodeClient.DeleteRoutingSiteParams 
 *
 * Checkout the following snippet for the format of DeleteRoutingSiteParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.DeleteRoutingSiteParams
 * @property {...ABTNodeClient.RequestDeleteRoutingSiteInput} input
 */

/**
 * Structure of ABTNodeClient.UpdateRoutingSiteParams 
 *
 * Checkout the following snippet for the format of UpdateRoutingSiteParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.UpdateRoutingSiteParams
 * @property {...ABTNodeClient.RequestUpdateRoutingSiteInput} input
 */

/**
 * Structure of ABTNodeClient.AddRoutingRuleParams 
 *
 * Checkout the following snippet for the format of AddRoutingRuleParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.AddRoutingRuleParams
 * @property {...ABTNodeClient.RequestAddRoutingRuleInput} input
 */

/**
 * Structure of ABTNodeClient.UpdateRoutingRuleParams 
 *
 * Checkout the following snippet for the format of UpdateRoutingRuleParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.UpdateRoutingRuleParams
 * @property {...ABTNodeClient.RequestUpdateRoutingRuleInput} input
 */

/**
 * Structure of ABTNodeClient.DeleteRoutingRuleParams 
 *
 * Checkout the following snippet for the format of DeleteRoutingRuleParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.DeleteRoutingRuleParams
 * @property {...ABTNodeClient.RequestDeleteRoutingRuleInput} input
 */

/**
 * Structure of ABTNodeClient.UpdateCertificateParams 
 *
 * Checkout the following snippet for the format of UpdateCertificateParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.UpdateCertificateParams
 * @property {...ABTNodeClient.RequestUpdateNginxHttpsCertInput} input
 */

/**
 * Structure of ABTNodeClient.AddCertificateParams 
 *
 * Checkout the following snippet for the format of AddCertificateParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.AddCertificateParams
 * @property {...ABTNodeClient.RequestAddNginxHttpsCertInput} input
 */

/**
 * Structure of ABTNodeClient.DeleteCertificateParams 
 *
 * Checkout the following snippet for the format of DeleteCertificateParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.DeleteCertificateParams
 * @property {...ABTNodeClient.RequestDeleteNginxHttpsCertInput} input
 */

/**
 * Structure of ABTNodeClient.IssueLetsEncryptCertParams 
 *
 * Checkout the following snippet for the format of IssueLetsEncryptCertParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.IssueLetsEncryptCertParams
 * @property {...ABTNodeClient.RequestAddLetsEncryptCertInput} input
 */

/**
 * Structure of ABTNodeClient.CreateAccessKeyParams 
 *
 * Checkout the following snippet for the format of CreateAccessKeyParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.CreateAccessKeyParams
 * @property {...ABTNodeClient.RequestCreateAccessKeyInput} input
 */

/**
 * Structure of ABTNodeClient.UpdateAccessKeyParams 
 *
 * Checkout the following snippet for the format of UpdateAccessKeyParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.UpdateAccessKeyParams
 * @property {...ABTNodeClient.RequestUpdateAccessKeyInput} input
 */

/**
 * Structure of ABTNodeClient.DeleteAccessKeyParams 
 *
 * Checkout the following snippet for the format of DeleteAccessKeyParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.DeleteAccessKeyParams
 * @property {...ABTNodeClient.RequestDeleteAccessKeyInput} input
 */

/**
 * Structure of ABTNodeClient.VerifyAccessKeyParams 
 *
 * Checkout the following snippet for the format of VerifyAccessKeyParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.VerifyAccessKeyParams
 * @property {...ABTNodeClient.RequestVerifyAccessKeyInput} input
 */

/**
 * Structure of ABTNodeClient.CreateWebHookParams 
 *
 * Checkout the following snippet for the format of CreateWebHookParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.CreateWebHookParams
 * @property {...ABTNodeClient.RequestCreateWebHookInput} input
 */

/**
 * Structure of ABTNodeClient.DeleteWebHookParams 
 *
 * Checkout the following snippet for the format of DeleteWebHookParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.DeleteWebHookParams
 * @property {...ABTNodeClient.RequestDeleteWebHookInput} input
 */

/**
 * Structure of ABTNodeClient.UpdateWebHookStateParams 
 *
 * Checkout the following snippet for the format of UpdateWebHookStateParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.UpdateWebHookStateParams
 * @property {...ABTNodeClient.RequestUpdateWebHookStateInput} input
 */

/**
 * Structure of ABTNodeClient.CreateProjectParams 
 *
 * Checkout the following snippet for the format of CreateProjectParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.CreateProjectParams
 * @property {...ABTNodeClient.RequestCreateProjectInput} input
 */

/**
 * Structure of ABTNodeClient.UpdateProjectParams 
 *
 * Checkout the following snippet for the format of UpdateProjectParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.UpdateProjectParams
 * @property {...ABTNodeClient.RequestUpdateProjectInput} input
 */

/**
 * Structure of ABTNodeClient.DeleteProjectParams 
 *
 * Checkout the following snippet for the format of DeleteProjectParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.DeleteProjectParams
 * @property {...ABTNodeClient.RequestProjectInput} input
 */

/**
 * Structure of ABTNodeClient.CreateReleaseParams 
 *
 * Checkout the following snippet for the format of CreateReleaseParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.CreateReleaseParams
 * @property {...ABTNodeClient.RequestCreateReleaseInput} input
 */

/**
 * Structure of ABTNodeClient.DeleteReleaseParams 
 *
 * Checkout the following snippet for the format of DeleteReleaseParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.DeleteReleaseParams
 * @property {...ABTNodeClient.RequestReleaseInput} input
 */

/**
 * Structure of ABTNodeClient.UpdateSelectedResourcesParams 
 *
 * Checkout the following snippet for the format of UpdateSelectedResourcesParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.UpdateSelectedResourcesParams
 * @property {...ABTNodeClient.RequestUpdateSelectedResourcesInput} input
 */

/**
 * Structure of ABTNodeClient.ConnectToStoreParams 
 *
 * Checkout the following snippet for the format of ConnectToStoreParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.ConnectToStoreParams
 * @property {...ABTNodeClient.RequestConnectToStoreInput} input
 */

/**
 * Structure of ABTNodeClient.DisconnectFromStoreParams 
 *
 * Checkout the following snippet for the format of DisconnectFromStoreParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.DisconnectFromStoreParams
 * @property {...ABTNodeClient.RequestDisconnectFromStoreInput} input
 */

/**
 * Structure of ABTNodeClient.PublishToStoreParams 
 *
 * Checkout the following snippet for the format of PublishToStoreParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.PublishToStoreParams
 * @property {...ABTNodeClient.RequestPublishToStoreInput} input
 */

/**
 * Structure of ABTNodeClient.ConnectByStudioParams 
 *
 * Checkout the following snippet for the format of ConnectByStudioParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.ConnectByStudioParams
 * @property {...ABTNodeClient.RequestConnectByStudioInput} input
 */

/**
 * Structure of ABTNodeClient.AddBlockletSecurityRuleParams 
 *
 * Checkout the following snippet for the format of AddBlockletSecurityRuleParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.AddBlockletSecurityRuleParams
 * @property {...ABTNodeClient.RequestAddBlockletSecurityRuleInput} input
 */

/**
 * Structure of ABTNodeClient.UpdateBlockletSecurityRuleParams 
 *
 * Checkout the following snippet for the format of UpdateBlockletSecurityRuleParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.UpdateBlockletSecurityRuleParams
 * @property {...ABTNodeClient.RequestUpdateBlockletSecurityRuleInput} input
 */

/**
 * Structure of ABTNodeClient.DeleteBlockletSecurityRuleParams 
 *
 * Checkout the following snippet for the format of DeleteBlockletSecurityRuleParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.DeleteBlockletSecurityRuleParams
 * @property {...ABTNodeClient.RequestDeleteBlockletSecurityRuleInput} input
 */

/**
 * Structure of ABTNodeClient.AddBlockletResponseHeaderPolicyParams 
 *
 * Checkout the following snippet for the format of AddBlockletResponseHeaderPolicyParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.AddBlockletResponseHeaderPolicyParams
 * @property {...ABTNodeClient.RequestAddBlockletResponseHeaderPolicyInput} input
 */

/**
 * Structure of ABTNodeClient.UpdateBlockletResponseHeaderPolicyParams 
 *
 * Checkout the following snippet for the format of UpdateBlockletResponseHeaderPolicyParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.UpdateBlockletResponseHeaderPolicyParams
 * @property {...ABTNodeClient.RequestUpdateBlockletResponseHeaderPolicyInput} input
 */

/**
 * Structure of ABTNodeClient.DeleteBlockletResponseHeaderPolicyParams 
 *
 * Checkout the following snippet for the format of DeleteBlockletResponseHeaderPolicyParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.DeleteBlockletResponseHeaderPolicyParams
 * @property {...ABTNodeClient.RequestDeleteBlockletResponseHeaderPolicyInput} input
 */

/**
 * Structure of ABTNodeClient.AddBlockletAccessPolicyParams 
 *
 * Checkout the following snippet for the format of AddBlockletAccessPolicyParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.AddBlockletAccessPolicyParams
 * @property {...ABTNodeClient.RequestAddBlockletAccessPolicyInput} input
 */

/**
 * Structure of ABTNodeClient.UpdateBlockletAccessPolicyParams 
 *
 * Checkout the following snippet for the format of UpdateBlockletAccessPolicyParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.UpdateBlockletAccessPolicyParams
 * @property {...ABTNodeClient.RequestUpdateBlockletAccessPolicyInput} input
 */

/**
 * Structure of ABTNodeClient.DeleteBlockletAccessPolicyParams 
 *
 * Checkout the following snippet for the format of DeleteBlockletAccessPolicyParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.DeleteBlockletAccessPolicyParams
 * @property {...ABTNodeClient.RequestDeleteBlockletAccessPolicyInput} input
 */

/**
 * Structure of ABTNodeClient.CreateWebhookEndpointParams 
 *
 * Checkout the following snippet for the format of CreateWebhookEndpointParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.CreateWebhookEndpointParams
 * @property {...ABTNodeClient.RequestCreateWebhookEndpointInput} input
 */

/**
 * Structure of ABTNodeClient.UpdateWebhookEndpointParams 
 *
 * Checkout the following snippet for the format of UpdateWebhookEndpointParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.UpdateWebhookEndpointParams
 * @property {...ABTNodeClient.RequestUpdateWebhookEndpointInput} input
 */

/**
 * Structure of ABTNodeClient.DeleteWebhookEndpointParams 
 *
 * Checkout the following snippet for the format of DeleteWebhookEndpointParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.DeleteWebhookEndpointParams
 * @property {...ABTNodeClient.RequestDeleteWebhookEndpointInput} input
 */

/**
 * Structure of ABTNodeClient.RetryWebhookAttemptParams 
 *
 * Checkout the following snippet for the format of RetryWebhookAttemptParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RetryWebhookAttemptParams
 * @property {...ABTNodeClient.RequestAttemptInput} input
 */

/**
 * Structure of ABTNodeClient.RegenerateWebhookEndpointSecretParams 
 *
 * Checkout the following snippet for the format of RegenerateWebhookEndpointSecretParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RegenerateWebhookEndpointSecretParams
 * @property {...ABTNodeClient.RequestRegenerateWebhookEndpointSecretInput} input
 */

/**
 * Structure of ABTNodeClient.AddUploadEndpointParams 
 *
 * Checkout the following snippet for the format of AddUploadEndpointParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.AddUploadEndpointParams
 * @property {...ABTNodeClient.RequestAddUploadEndpointInput} input
 */

/**
 * Structure of ABTNodeClient.DeleteUploadEndpointParams 
 *
 * Checkout the following snippet for the format of DeleteUploadEndpointParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.DeleteUploadEndpointParams
 * @property {...ABTNodeClient.RequestDeleteUploadEndpointInput} input
 */

/**
 * Structure of ABTNodeClient.ConnectToEndpointParams 
 *
 * Checkout the following snippet for the format of ConnectToEndpointParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.ConnectToEndpointParams
 * @property {...ABTNodeClient.RequestConnectToEndpointInput} input
 */

/**
 * Structure of ABTNodeClient.DisconnectFromEndpointParams 
 *
 * Checkout the following snippet for the format of DisconnectFromEndpointParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.DisconnectFromEndpointParams
 * @property {...ABTNodeClient.RequestDisconnectFromEndpointInput} input
 */

/**
 * Structure of ABTNodeClient.PublishToEndpointParams 
 *
 * Checkout the following snippet for the format of PublishToEndpointParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.PublishToEndpointParams
 * @property {...ABTNodeClient.RequestPublishToEndpointInput} input
 */

/**
 * Structure of ABTNodeClient.ConnectToAigneParams 
 *
 * Checkout the following snippet for the format of ConnectToAigneParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.ConnectToAigneParams
 * @property {...ABTNodeClient.RequestConnectToAigneInput} input
 */

/**
 * Structure of ABTNodeClient.DisconnectToAigneParams 
 *
 * Checkout the following snippet for the format of DisconnectToAigneParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.DisconnectToAigneParams
 * @property {...ABTNodeClient.RequestDisconnectToAigneInput} input
 */

/**
 * Structure of ABTNodeClient.VerifyAigneConnectionParams 
 *
 * Checkout the following snippet for the format of VerifyAigneConnectionParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.VerifyAigneConnectionParams
 * @property {...ABTNodeClient.RequestVerifyAigneConnectionInput} input
 */

/**
 * Structure of ABTNodeClient.CreateOrgParams 
 *
 * Checkout the following snippet for the format of CreateOrgParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.CreateOrgParams
 * @property {...ABTNodeClient.RequestCreateOrgInput} input
 */

/**
 * Structure of ABTNodeClient.UpdateOrgParams 
 *
 * Checkout the following snippet for the format of UpdateOrgParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.UpdateOrgParams
 * @property {...ABTNodeClient.RequestUpdateOrgInput} input
 */

/**
 * Structure of ABTNodeClient.DeleteOrgParams 
 *
 * Checkout the following snippet for the format of DeleteOrgParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.DeleteOrgParams
 * @property {...ABTNodeClient.RequestGetOrgInput} input
 */

/**
 * Structure of ABTNodeClient.AddOrgMemberParams 
 *
 * Checkout the following snippet for the format of AddOrgMemberParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.AddOrgMemberParams
 * @property {...ABTNodeClient.RequestGetOrgMemberInput} input
 */

/**
 * Structure of ABTNodeClient.RemoveOrgMemberParams 
 *
 * Checkout the following snippet for the format of RemoveOrgMemberParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.RemoveOrgMemberParams
 * @property {...ABTNodeClient.RequestGetOrgMemberInput} input
 */

/**
 * Structure of ABTNodeClient.InviteMembersToOrgParams 
 *
 * Checkout the following snippet for the format of InviteMembersToOrgParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.InviteMembersToOrgParams
 * @property {...ABTNodeClient.RequestInviteMembersToOrgInput} input
 */

/**
 * Structure of ABTNodeClient.AddOrgResourceParams 
 *
 * Checkout the following snippet for the format of AddOrgResourceParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.AddOrgResourceParams
 * @property {...ABTNodeClient.RequestAddOrgResourceInput} input
 */

/**
 * Structure of ABTNodeClient.MigrateOrgResourceParams 
 *
 * Checkout the following snippet for the format of MigrateOrgResourceParams:
 * ```json
{}
 * ```
 *
 * @memberof ABTNodeClient
 * @typedef {object} ABTNodeClient.MigrateOrgResourceParams
 * @property {...ABTNodeClient.RequestMigrateOrgResourceInput} input
 */

/**
 * getBlocklet
 *
 * @name ABTNodeClient#getBlocklet
 * @param {ABTNodeClient.GetBlockletParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponseBlocklet>} Checkout {@link ABTNodeClient.ResponseBlocklet} for resolved data format
 */

/**
 * getBlockletMetaFromUrl
 *
 * @name ABTNodeClient#getBlockletMetaFromUrl
 * @param {ABTNodeClient.GetBlockletMetaFromUrlParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponseBlockletMetaFromUrl>} Checkout {@link ABTNodeClient.ResponseBlockletMetaFromUrl} for resolved data format
 */

/**
 * getBlockletDiff
 *
 * @name ABTNodeClient#getBlockletDiff
 * @param {ABTNodeClient.GetBlockletDiffParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponseBlockletDiff>} Checkout {@link ABTNodeClient.ResponseBlockletDiff} for resolved data format
 */

/**
 * getBlocklets
 *
 * @name ABTNodeClient#getBlocklets
 * @param {ABTNodeClient.GetBlockletsParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponseGetBlocklets>} Checkout {@link ABTNodeClient.ResponseGetBlocklets} for resolved data format
 */

/**
 * getBlockletRuntimeHistory
 *
 * @name ABTNodeClient#getBlockletRuntimeHistory
 * @param {ABTNodeClient.GetBlockletRuntimeHistoryParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponseBlockletRuntimeHistory>} Checkout {@link ABTNodeClient.ResponseBlockletRuntimeHistory} for resolved data format
 */

/**
 * getBlockletsFromBackup
 *
 * @name ABTNodeClient#getBlockletsFromBackup
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponseBlockletsFromBackup>} Checkout {@link ABTNodeClient.ResponseBlockletsFromBackup} for resolved data format
 */

/**
 * getDynamicComponents
 *
 * @name ABTNodeClient#getDynamicComponents
 * @param {ABTNodeClient.GetDynamicComponentsParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponseGetDynamicComponents>} Checkout {@link ABTNodeClient.ResponseGetDynamicComponents} for resolved data format
 */

/**
 * getNodeInfo
 *
 * @name ABTNodeClient#getNodeInfo
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponseGetNodeInfo>} Checkout {@link ABTNodeClient.ResponseGetNodeInfo} for resolved data format
 */

/**
 * resetNodeStatus
 *
 * @name ABTNodeClient#resetNodeStatus
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponseGetNodeInfo>} Checkout {@link ABTNodeClient.ResponseGetNodeInfo} for resolved data format
 */

/**
 * getNodeEnv
 *
 * @name ABTNodeClient#getNodeEnv
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponseGetNodeEnv>} Checkout {@link ABTNodeClient.ResponseGetNodeEnv} for resolved data format
 */

/**
 * checkNodeVersion
 *
 * @name ABTNodeClient#checkNodeVersion
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponseCheckNodeVersion>} Checkout {@link ABTNodeClient.ResponseCheckNodeVersion} for resolved data format
 */

/**
 * getDelegationState
 *
 * @name ABTNodeClient#getDelegationState
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponseDelegationState>} Checkout {@link ABTNodeClient.ResponseDelegationState} for resolved data format
 */

/**
 * getNodeRuntimeHistory
 *
 * @name ABTNodeClient#getNodeRuntimeHistory
 * @param {ABTNodeClient.GetNodeRuntimeHistoryParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponseNodeRuntimeHistory>} Checkout {@link ABTNodeClient.ResponseNodeRuntimeHistory} for resolved data format
 */

/**
 * getBlockletMeta
 *
 * @name ABTNodeClient#getBlockletMeta
 * @param {ABTNodeClient.GetBlockletMetaParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponseBlockletMeta>} Checkout {@link ABTNodeClient.ResponseBlockletMeta} for resolved data format
 */

/**
 * getNotifications
 *
 * @name ABTNodeClient#getNotifications
 * @param {ABTNodeClient.GetNotificationsParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponseGetNotifications>} Checkout {@link ABTNodeClient.ResponseGetNotifications} for resolved data format
 */

/**
 * makeAllNotificationsAsRead
 *
 * @name ABTNodeClient#makeAllNotificationsAsRead
 * @param {ABTNodeClient.MakeAllNotificationsAsReadParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponseMakeAllNotificationsAsRead>} Checkout {@link ABTNodeClient.ResponseMakeAllNotificationsAsRead} for resolved data format
 */

/**
 * getNotificationSendLog
 *
 * @name ABTNodeClient#getNotificationSendLog
 * @param {ABTNodeClient.GetNotificationSendLogParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponseNotificationSendLog>} Checkout {@link ABTNodeClient.ResponseNotificationSendLog} for resolved data format
 */

/**
 * getReceivers
 *
 * @name ABTNodeClient#getReceivers
 * @param {ABTNodeClient.GetReceiversParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponseReceivers>} Checkout {@link ABTNodeClient.ResponseReceivers} for resolved data format
 */

/**
 * getNotificationComponents
 *
 * @name ABTNodeClient#getNotificationComponents
 * @param {ABTNodeClient.GetNotificationComponentsParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponseNotificationComponents>} Checkout {@link ABTNodeClient.ResponseNotificationComponents} for resolved data format
 */

/**
 * resendNotification
 *
 * @name ABTNodeClient#resendNotification
 * @param {ABTNodeClient.ResendNotificationParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponseResendNotification>} Checkout {@link ABTNodeClient.ResponseResendNotification} for resolved data format
 */

/**
 * getRoutingSites
 *
 * @name ABTNodeClient#getRoutingSites
 * @param {ABTNodeClient.GetRoutingSitesParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponseGetRoutingSites>} Checkout {@link ABTNodeClient.ResponseGetRoutingSites} for resolved data format
 */

/**
 * getRoutingProviders
 *
 * @name ABTNodeClient#getRoutingProviders
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponseGetRoutingProviders>} Checkout {@link ABTNodeClient.ResponseGetRoutingProviders} for resolved data format
 */

/**
 * isDidDomain
 *
 * @name ABTNodeClient#isDidDomain
 * @param {ABTNodeClient.IsDidDomainParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponseIsDidDomain>} Checkout {@link ABTNodeClient.ResponseIsDidDomain} for resolved data format
 */

/**
 * getCertificates
 *
 * @name ABTNodeClient#getCertificates
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponseGetCertificates>} Checkout {@link ABTNodeClient.ResponseGetCertificates} for resolved data format
 */

/**
 * checkDomains
 *
 * @name ABTNodeClient#checkDomains
 * @param {ABTNodeClient.CheckDomainsParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponseCheckDomains>} Checkout {@link ABTNodeClient.ResponseCheckDomains} for resolved data format
 */

/**
 * findCertificateByDomain
 *
 * @name ABTNodeClient#findCertificateByDomain
 * @param {ABTNodeClient.FindCertificateByDomainParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponseFindCertificateByDomain>} Checkout {@link ABTNodeClient.ResponseFindCertificateByDomain} for resolved data format
 */

/**
 * getAccessKeys
 *
 * @name ABTNodeClient#getAccessKeys
 * @param {ABTNodeClient.GetAccessKeysParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponseAccessKeys>} Checkout {@link ABTNodeClient.ResponseAccessKeys} for resolved data format
 */

/**
 * getAccessKey
 *
 * @name ABTNodeClient#getAccessKey
 * @param {ABTNodeClient.GetAccessKeyParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponseAccessKey>} Checkout {@link ABTNodeClient.ResponseAccessKey} for resolved data format
 */

/**
 * getWebHooks
 *
 * @name ABTNodeClient#getWebHooks
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponseWebHooks>} Checkout {@link ABTNodeClient.ResponseWebHooks} for resolved data format
 */

/**
 * getWebhookSenders
 *
 * @name ABTNodeClient#getWebhookSenders
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponseSenderList>} Checkout {@link ABTNodeClient.ResponseSenderList} for resolved data format
 */

/**
 * sendTestMessage
 *
 * @name ABTNodeClient#sendTestMessage
 * @param {ABTNodeClient.SendTestMessageParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponseSendMsg>} Checkout {@link ABTNodeClient.ResponseSendMsg} for resolved data format
 */

/**
 * getSession
 *
 * @name ABTNodeClient#getSession
 * @param {ABTNodeClient.GetSessionParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponseGetSession>} Checkout {@link ABTNodeClient.ResponseGetSession} for resolved data format
 */

/**
 * getRoles
 *
 * @name ABTNodeClient#getRoles
 * @param {ABTNodeClient.GetRolesParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponseRoles>} Checkout {@link ABTNodeClient.ResponseRoles} for resolved data format
 */

/**
 * getRole
 *
 * @name ABTNodeClient#getRole
 * @param {ABTNodeClient.GetRoleParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponseRole>} Checkout {@link ABTNodeClient.ResponseRole} for resolved data format
 */

/**
 * getPermissions
 *
 * @name ABTNodeClient#getPermissions
 * @param {ABTNodeClient.GetPermissionsParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponsePermissions>} Checkout {@link ABTNodeClient.ResponsePermissions} for resolved data format
 */

/**
 * getInvitations
 *
 * @name ABTNodeClient#getInvitations
 * @param {ABTNodeClient.GetInvitationsParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponseGetInvitations>} Checkout {@link ABTNodeClient.ResponseGetInvitations} for resolved data format
 */

/**
 * getUsers
 *
 * @name ABTNodeClient#getUsers
 * @param {ABTNodeClient.GetUsersParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponseUsers>} Checkout {@link ABTNodeClient.ResponseUsers} for resolved data format
 */

/**
 * getUser
 *
 * @name ABTNodeClient#getUser
 * @param {ABTNodeClient.GetUserParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponseUser>} Checkout {@link ABTNodeClient.ResponseUser} for resolved data format
 */

/**
 * getUserSessions
 *
 * @name ABTNodeClient#getUserSessions
 * @param {ABTNodeClient.GetUserSessionsParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponseUserSessions>} Checkout {@link ABTNodeClient.ResponseUserSessions} for resolved data format
 */

/**
 * getUserSessionsCount
 *
 * @name ABTNodeClient#getUserSessionsCount
 * @param {ABTNodeClient.GetUserSessionsCountParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponseUserSessionsCount>} Checkout {@link ABTNodeClient.ResponseUserSessionsCount} for resolved data format
 */

/**
 * getUsersCount
 *
 * @name ABTNodeClient#getUsersCount
 * @param {ABTNodeClient.GetUsersCountParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponseGetUsersCount>} Checkout {@link ABTNodeClient.ResponseGetUsersCount} for resolved data format
 */

/**
 * getUsersCountPerRole
 *
 * @name ABTNodeClient#getUsersCountPerRole
 * @param {ABTNodeClient.GetUsersCountPerRoleParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponseGetUsersCountPerRole>} Checkout {@link ABTNodeClient.ResponseGetUsersCountPerRole} for resolved data format
 */

/**
 * getOwner
 *
 * @name ABTNodeClient#getOwner
 * @param {ABTNodeClient.GetOwnerParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponseUser>} Checkout {@link ABTNodeClient.ResponseUser} for resolved data format
 */

/**
 * getPermissionsByRole
 *
 * @name ABTNodeClient#getPermissionsByRole
 * @param {ABTNodeClient.GetPermissionsByRoleParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponsePermissions>} Checkout {@link ABTNodeClient.ResponsePermissions} for resolved data format
 */

/**
 * getPassportIssuances
 *
 * @name ABTNodeClient#getPassportIssuances
 * @param {ABTNodeClient.GetPassportIssuancesParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponseGetPassportIssuances>} Checkout {@link ABTNodeClient.ResponseGetPassportIssuances} for resolved data format
 */

/**
 * logoutUser
 *
 * @name ABTNodeClient#logoutUser
 * @param {ABTNodeClient.LogoutUserParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.GeneralResponse>} Checkout {@link ABTNodeClient.GeneralResponse} for resolved data format
 */

/**
 * destroySelf
 *
 * @name ABTNodeClient#destroySelf
 * @param {ABTNodeClient.DestroySelfParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponseUser>} Checkout {@link ABTNodeClient.ResponseUser} for resolved data format
 */

/**
 * getUserFollowers
 *
 * @name ABTNodeClient#getUserFollowers
 * @param {ABTNodeClient.GetUserFollowersParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponseUserFollows>} Checkout {@link ABTNodeClient.ResponseUserFollows} for resolved data format
 */

/**
 * getUserFollowing
 *
 * @name ABTNodeClient#getUserFollowing
 * @param {ABTNodeClient.GetUserFollowingParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponseUserFollows>} Checkout {@link ABTNodeClient.ResponseUserFollows} for resolved data format
 */

/**
 * getUserFollowStats
 *
 * @name ABTNodeClient#getUserFollowStats
 * @param {ABTNodeClient.GetUserFollowStatsParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponseUserRelationCount>} Checkout {@link ABTNodeClient.ResponseUserRelationCount} for resolved data format
 */

/**
 * checkFollowing
 *
 * @name ABTNodeClient#checkFollowing
 * @param {ABTNodeClient.CheckFollowingParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponseCheckFollowing>} Checkout {@link ABTNodeClient.ResponseCheckFollowing} for resolved data format
 */

/**
 * followUser
 *
 * @name ABTNodeClient#followUser
 * @param {ABTNodeClient.FollowUserParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.GeneralResponse>} Checkout {@link ABTNodeClient.GeneralResponse} for resolved data format
 */

/**
 * unfollowUser
 *
 * @name ABTNodeClient#unfollowUser
 * @param {ABTNodeClient.UnfollowUserParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.GeneralResponse>} Checkout {@link ABTNodeClient.GeneralResponse} for resolved data format
 */

/**
 * getUserInvites
 *
 * @name ABTNodeClient#getUserInvites
 * @param {ABTNodeClient.GetUserInvitesParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponseUsers>} Checkout {@link ABTNodeClient.ResponseUsers} for resolved data format
 */

/**
 * getTags
 *
 * @name ABTNodeClient#getTags
 * @param {ABTNodeClient.GetTagsParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponseTags>} Checkout {@link ABTNodeClient.ResponseTags} for resolved data format
 */

/**
 * getAuditLogs
 *
 * @name ABTNodeClient#getAuditLogs
 * @param {ABTNodeClient.GetAuditLogsParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponseGetAuditLogs>} Checkout {@link ABTNodeClient.ResponseGetAuditLogs} for resolved data format
 */

/**
 * getLauncherSession
 *
 * @name ABTNodeClient#getLauncherSession
 * @param {ABTNodeClient.GetLauncherSessionParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponseGetLauncherSession>} Checkout {@link ABTNodeClient.ResponseGetLauncherSession} for resolved data format
 */

/**
 * getBlockletBackups
 *
 * @name ABTNodeClient#getBlockletBackups
 * @param {ABTNodeClient.GetBlockletBackupsParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponseGetBlockletBackups>} Checkout {@link ABTNodeClient.ResponseGetBlockletBackups} for resolved data format
 */

/**
 * getBlockletBackupSummary
 *
 * @name ABTNodeClient#getBlockletBackupSummary
 * @param {ABTNodeClient.GetBlockletBackupSummaryParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponseGetBlockletBackupSummary>} Checkout {@link ABTNodeClient.ResponseGetBlockletBackupSummary} for resolved data format
 */

/**
 * getBlockletSpaceGateways
 *
 * @name ABTNodeClient#getBlockletSpaceGateways
 * @param {ABTNodeClient.GetBlockletSpaceGatewaysParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponseGetBlockletSpaceGateways>} Checkout {@link ABTNodeClient.ResponseGetBlockletSpaceGateways} for resolved data format
 */

/**
 * getTrafficInsights
 *
 * @name ABTNodeClient#getTrafficInsights
 * @param {ABTNodeClient.GetTrafficInsightsParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponseGetTrafficInsights>} Checkout {@link ABTNodeClient.ResponseGetTrafficInsights} for resolved data format
 */

/**
 * getProjects
 *
 * @name ABTNodeClient#getProjects
 * @param {ABTNodeClient.GetProjectsParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponseGetProjects>} Checkout {@link ABTNodeClient.ResponseGetProjects} for resolved data format
 */

/**
 * getProject
 *
 * @name ABTNodeClient#getProject
 * @param {ABTNodeClient.GetProjectParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponseGetProject>} Checkout {@link ABTNodeClient.ResponseGetProject} for resolved data format
 */

/**
 * getReleases
 *
 * @name ABTNodeClient#getReleases
 * @param {ABTNodeClient.GetReleasesParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponseGetReleases>} Checkout {@link ABTNodeClient.ResponseGetReleases} for resolved data format
 */

/**
 * getRelease
 *
 * @name ABTNodeClient#getRelease
 * @param {ABTNodeClient.GetReleaseParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponseGetRelease>} Checkout {@link ABTNodeClient.ResponseGetRelease} for resolved data format
 */

/**
 * getSelectedResources
 *
 * @name ABTNodeClient#getSelectedResources
 * @param {ABTNodeClient.GetSelectedResourcesParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponseGetSelectedResources>} Checkout {@link ABTNodeClient.ResponseGetSelectedResources} for resolved data format
 */

/**
 * getBlockletSecurityRule
 *
 * @name ABTNodeClient#getBlockletSecurityRule
 * @param {ABTNodeClient.GetBlockletSecurityRuleParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponseBlockletSecurityRule>} Checkout {@link ABTNodeClient.ResponseBlockletSecurityRule} for resolved data format
 */

/**
 * getBlockletSecurityRules
 *
 * @name ABTNodeClient#getBlockletSecurityRules
 * @param {ABTNodeClient.GetBlockletSecurityRulesParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponseBlockletSecurityRules>} Checkout {@link ABTNodeClient.ResponseBlockletSecurityRules} for resolved data format
 */

/**
 * getBlockletResponseHeaderPolicy
 *
 * @name ABTNodeClient#getBlockletResponseHeaderPolicy
 * @param {ABTNodeClient.GetBlockletResponseHeaderPolicyParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponseBlockletAccessPolicy>} Checkout {@link ABTNodeClient.ResponseBlockletAccessPolicy} for resolved data format
 */

/**
 * getBlockletResponseHeaderPolicies
 *
 * @name ABTNodeClient#getBlockletResponseHeaderPolicies
 * @param {ABTNodeClient.GetBlockletResponseHeaderPoliciesParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponseBlockletResponseHeaderPolicies>} Checkout {@link ABTNodeClient.ResponseBlockletResponseHeaderPolicies} for resolved data format
 */

/**
 * getBlockletAccessPolicy
 *
 * @name ABTNodeClient#getBlockletAccessPolicy
 * @param {ABTNodeClient.GetBlockletAccessPolicyParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponseBlockletAccessPolicy>} Checkout {@link ABTNodeClient.ResponseBlockletAccessPolicy} for resolved data format
 */

/**
 * getBlockletAccessPolicies
 *
 * @name ABTNodeClient#getBlockletAccessPolicies
 * @param {ABTNodeClient.GetBlockletAccessPoliciesParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponseBlockletAccessPolicies>} Checkout {@link ABTNodeClient.ResponseBlockletAccessPolicies} for resolved data format
 */

/**
 * getWebhookEndpoints
 *
 * @name ABTNodeClient#getWebhookEndpoints
 * @param {ABTNodeClient.GetWebhookEndpointsParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponseGetWebhookEndpoints>} Checkout {@link ABTNodeClient.ResponseGetWebhookEndpoints} for resolved data format
 */

/**
 * getWebhookEndpoint
 *
 * @name ABTNodeClient#getWebhookEndpoint
 * @param {ABTNodeClient.GetWebhookEndpointParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponseGetWebhookEndpoint>} Checkout {@link ABTNodeClient.ResponseGetWebhookEndpoint} for resolved data format
 */

/**
 * getWebhookAttempts
 *
 * @name ABTNodeClient#getWebhookAttempts
 * @param {ABTNodeClient.GetWebhookAttemptsParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponseGetWebhookAttempts>} Checkout {@link ABTNodeClient.ResponseGetWebhookAttempts} for resolved data format
 */

/**
 * getPassportRoleCounts
 *
 * @name ABTNodeClient#getPassportRoleCounts
 * @param {ABTNodeClient.GetPassportRoleCountsParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponseGetPassportCountPerRole>} Checkout {@link ABTNodeClient.ResponseGetPassportCountPerRole} for resolved data format
 */

/**
 * getPassportsByRole
 *
 * @name ABTNodeClient#getPassportsByRole
 * @param {ABTNodeClient.GetPassportsByRoleParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponsePassport>} Checkout {@link ABTNodeClient.ResponsePassport} for resolved data format
 */

/**
 * getPassportLogs
 *
 * @name ABTNodeClient#getPassportLogs
 * @param {ABTNodeClient.GetPassportLogsParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponsePassportLog>} Checkout {@link ABTNodeClient.ResponsePassportLog} for resolved data format
 */

/**
 * getRelatedPassports
 *
 * @name ABTNodeClient#getRelatedPassports
 * @param {ABTNodeClient.GetRelatedPassportsParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponsePassport>} Checkout {@link ABTNodeClient.ResponsePassport} for resolved data format
 */

/**
 * getBlockletBaseInfo
 *
 * @name ABTNodeClient#getBlockletBaseInfo
 * @param {ABTNodeClient.GetBlockletBaseInfoParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponseBlockletInfo>} Checkout {@link ABTNodeClient.ResponseBlockletInfo} for resolved data format
 */

/**
 * getDomainDNS
 *
 * @name ABTNodeClient#getDomainDNS
 * @param {ABTNodeClient.GetDomainDnsParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponseDomainDNS>} Checkout {@link ABTNodeClient.ResponseDomainDNS} for resolved data format
 */

/**
 * getOAuthClients
 *
 * @name ABTNodeClient#getOAuthClients
 * @param {ABTNodeClient.GetOAuthClientsParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponseOAuthClients>} Checkout {@link ABTNodeClient.ResponseOAuthClients} for resolved data format
 */

/**
 * createOAuthClient
 *
 * @name ABTNodeClient#createOAuthClient
 * @param {ABTNodeClient.CreateOAuthClientParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponseOAuthClient>} Checkout {@link ABTNodeClient.ResponseOAuthClient} for resolved data format
 */

/**
 * updateOAuthClient
 *
 * @name ABTNodeClient#updateOAuthClient
 * @param {ABTNodeClient.UpdateOAuthClientParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponseOAuthClient>} Checkout {@link ABTNodeClient.ResponseOAuthClient} for resolved data format
 */

/**
 * deleteOAuthClient
 *
 * @name ABTNodeClient#deleteOAuthClient
 * @param {ABTNodeClient.DeleteOAuthClientParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.GeneralResponse>} Checkout {@link ABTNodeClient.GeneralResponse} for resolved data format
 */

/**
 * getOrgs
 *
 * @name ABTNodeClient#getOrgs
 * @param {ABTNodeClient.GetOrgsParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponseGetOrgs>} Checkout {@link ABTNodeClient.ResponseGetOrgs} for resolved data format
 */

/**
 * getOrg
 *
 * @name ABTNodeClient#getOrg
 * @param {ABTNodeClient.GetOrgParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponseGetOrg>} Checkout {@link ABTNodeClient.ResponseGetOrg} for resolved data format
 */

/**
 * getOrgMembers
 *
 * @name ABTNodeClient#getOrgMembers
 * @param {ABTNodeClient.GetOrgMembersParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponseOrgUsers>} Checkout {@link ABTNodeClient.ResponseOrgUsers} for resolved data format
 */

/**
 * getOrgInvitableUsers
 *
 * @name ABTNodeClient#getOrgInvitableUsers
 * @param {ABTNodeClient.GetOrgInvitableUsersParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponseUsers>} Checkout {@link ABTNodeClient.ResponseUsers} for resolved data format
 */

/**
 * getOrgResource
 *
 * @name ABTNodeClient#getOrgResource
 * @param {ABTNodeClient.GetOrgResourceParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponseGetOrgResource>} Checkout {@link ABTNodeClient.ResponseGetOrgResource} for resolved data format
 */

/**
 * installBlocklet
 *
 * @name ABTNodeClient#installBlocklet
 * @param {ABTNodeClient.InstallBlockletParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponseBlocklet>} Checkout {@link ABTNodeClient.ResponseBlocklet} for resolved data format
 */

/**
 * installComponent
 *
 * @name ABTNodeClient#installComponent
 * @param {ABTNodeClient.InstallComponentParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponseBlocklet>} Checkout {@link ABTNodeClient.ResponseBlocklet} for resolved data format
 */

/**
 * startBlocklet
 *
 * @name ABTNodeClient#startBlocklet
 * @param {ABTNodeClient.StartBlockletParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponseBlocklet>} Checkout {@link ABTNodeClient.ResponseBlocklet} for resolved data format
 */

/**
 * stopBlocklet
 *
 * @name ABTNodeClient#stopBlocklet
 * @param {ABTNodeClient.StopBlockletParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponseBlocklet>} Checkout {@link ABTNodeClient.ResponseBlocklet} for resolved data format
 */

/**
 * reloadBlocklet
 *
 * @name ABTNodeClient#reloadBlocklet
 * @param {ABTNodeClient.ReloadBlockletParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponseBlocklet>} Checkout {@link ABTNodeClient.ResponseBlocklet} for resolved data format
 */

/**
 * restartBlocklet
 *
 * @name ABTNodeClient#restartBlocklet
 * @param {ABTNodeClient.RestartBlockletParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponseBlocklet>} Checkout {@link ABTNodeClient.ResponseBlocklet} for resolved data format
 */

/**
 * deleteBlocklet
 *
 * @name ABTNodeClient#deleteBlocklet
 * @param {ABTNodeClient.DeleteBlockletParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponseBlocklet>} Checkout {@link ABTNodeClient.ResponseBlocklet} for resolved data format
 */

/**
 * deleteComponent
 *
 * @name ABTNodeClient#deleteComponent
 * @param {ABTNodeClient.DeleteComponentParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponseBlocklet>} Checkout {@link ABTNodeClient.ResponseBlocklet} for resolved data format
 */

/**
 * cancelDownloadBlocklet
 *
 * @name ABTNodeClient#cancelDownloadBlocklet
 * @param {ABTNodeClient.CancelDownloadBlockletParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponseBlocklet>} Checkout {@link ABTNodeClient.ResponseBlocklet} for resolved data format
 */

/**
 * checkComponentsForUpdates
 *
 * @name ABTNodeClient#checkComponentsForUpdates
 * @param {ABTNodeClient.CheckComponentsForUpdatesParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponseCheckComponentsForUpdates>} Checkout {@link ABTNodeClient.ResponseCheckComponentsForUpdates} for resolved data format
 */

/**
 * upgradeComponents
 *
 * @name ABTNodeClient#upgradeComponents
 * @param {ABTNodeClient.UpgradeComponentsParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponseBlocklet>} Checkout {@link ABTNodeClient.ResponseBlocklet} for resolved data format
 */

/**
 * configBlocklet
 *
 * @name ABTNodeClient#configBlocklet
 * @param {ABTNodeClient.ConfigBlockletParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponseBlocklet>} Checkout {@link ABTNodeClient.ResponseBlocklet} for resolved data format
 */

/**
 * configPublicToStore
 *
 * @name ABTNodeClient#configPublicToStore
 * @param {ABTNodeClient.ConfigPublicToStoreParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponseBlocklet>} Checkout {@link ABTNodeClient.ResponseBlocklet} for resolved data format
 */

/**
 * configNavigations
 *
 * @name ABTNodeClient#configNavigations
 * @param {ABTNodeClient.ConfigNavigationsParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponseBlocklet>} Checkout {@link ABTNodeClient.ResponseBlocklet} for resolved data format
 */

/**
 * configAuthentication
 *
 * @name ABTNodeClient#configAuthentication
 * @param {ABTNodeClient.ConfigAuthenticationParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponseBlocklet>} Checkout {@link ABTNodeClient.ResponseBlocklet} for resolved data format
 */

/**
 * configDidConnect
 *
 * @name ABTNodeClient#configDidConnect
 * @param {ABTNodeClient.ConfigDidConnectParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponseBlocklet>} Checkout {@link ABTNodeClient.ResponseBlocklet} for resolved data format
 */

/**
 * configDidConnectActions
 *
 * @name ABTNodeClient#configDidConnectActions
 * @param {ABTNodeClient.ConfigDidConnectActionsParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponseBlocklet>} Checkout {@link ABTNodeClient.ResponseBlocklet} for resolved data format
 */

/**
 * configNotification
 *
 * @name ABTNodeClient#configNotification
 * @param {ABTNodeClient.ConfigNotificationParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponseBlocklet>} Checkout {@link ABTNodeClient.ResponseBlocklet} for resolved data format
 */

/**
 * configVault
 *
 * @name ABTNodeClient#configVault
 * @param {ABTNodeClient.ConfigVaultParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponseConfigVault>} Checkout {@link ABTNodeClient.ResponseConfigVault} for resolved data format
 */

/**
 * sendEmail
 *
 * @name ABTNodeClient#sendEmail
 * @param {ABTNodeClient.SendEmailParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.GeneralResponse>} Checkout {@link ABTNodeClient.GeneralResponse} for resolved data format
 */

/**
 * sendPush
 *
 * @name ABTNodeClient#sendPush
 * @param {ABTNodeClient.SendPushParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.GeneralResponse>} Checkout {@link ABTNodeClient.GeneralResponse} for resolved data format
 */

/**
 * joinFederatedLogin
 *
 * @name ABTNodeClient#joinFederatedLogin
 * @param {ABTNodeClient.JoinFederatedLoginParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponseBlocklet>} Checkout {@link ABTNodeClient.ResponseBlocklet} for resolved data format
 */

/**
 * quitFederatedLogin
 *
 * @name ABTNodeClient#quitFederatedLogin
 * @param {ABTNodeClient.QuitFederatedLoginParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponseBlocklet>} Checkout {@link ABTNodeClient.ResponseBlocklet} for resolved data format
 */

/**
 * disbandFederatedLogin
 *
 * @name ABTNodeClient#disbandFederatedLogin
 * @param {ABTNodeClient.DisbandFederatedLoginParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponseBlocklet>} Checkout {@link ABTNodeClient.ResponseBlocklet} for resolved data format
 */

/**
 * syncMasterAuthorization
 *
 * @name ABTNodeClient#syncMasterAuthorization
 * @param {ABTNodeClient.SyncMasterAuthorizationParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponseBlocklet>} Checkout {@link ABTNodeClient.ResponseBlocklet} for resolved data format
 */

/**
 * syncFederatedConfig
 *
 * @name ABTNodeClient#syncFederatedConfig
 * @param {ABTNodeClient.SyncFederatedConfigParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponseBlocklet>} Checkout {@link ABTNodeClient.ResponseBlocklet} for resolved data format
 */

/**
 * auditFederatedLogin
 *
 * @name ABTNodeClient#auditFederatedLogin
 * @param {ABTNodeClient.AuditFederatedLoginParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponseBlocklet>} Checkout {@link ABTNodeClient.ResponseBlocklet} for resolved data format
 */

/**
 * updateAppSessionConfig
 *
 * @name ABTNodeClient#updateAppSessionConfig
 * @param {ABTNodeClient.UpdateAppSessionConfigParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponseBlocklet>} Checkout {@link ABTNodeClient.ResponseBlocklet} for resolved data format
 */

/**
 * updateComponentTitle
 *
 * @name ABTNodeClient#updateComponentTitle
 * @param {ABTNodeClient.UpdateComponentTitleParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponseBlocklet>} Checkout {@link ABTNodeClient.ResponseBlocklet} for resolved data format
 */

/**
 * updateComponentMountPoint
 *
 * @name ABTNodeClient#updateComponentMountPoint
 * @param {ABTNodeClient.UpdateComponentMountPointParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponseBlocklet>} Checkout {@link ABTNodeClient.ResponseBlocklet} for resolved data format
 */

/**
 * backupBlocklet
 *
 * @name ABTNodeClient#backupBlocklet
 * @param {ABTNodeClient.BackupBlockletParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.GeneralResponse>} Checkout {@link ABTNodeClient.GeneralResponse} for resolved data format
 */

/**
 * abortBlockletBackup
 *
 * @name ABTNodeClient#abortBlockletBackup
 * @param {ABTNodeClient.AbortBlockletBackupParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.GeneralResponse>} Checkout {@link ABTNodeClient.GeneralResponse} for resolved data format
 */

/**
 * restoreBlocklet
 *
 * @name ABTNodeClient#restoreBlocklet
 * @param {ABTNodeClient.RestoreBlockletParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.GeneralResponse>} Checkout {@link ABTNodeClient.GeneralResponse} for resolved data format
 */

/**
 * migrateApplicationToStructV2
 *
 * @name ABTNodeClient#migrateApplicationToStructV2
 * @param {ABTNodeClient.MigrateApplicationToStructV2Params} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.GeneralResponse>} Checkout {@link ABTNodeClient.GeneralResponse} for resolved data format
 */

/**
 * launchBlockletByLauncher
 *
 * @name ABTNodeClient#launchBlockletByLauncher
 * @param {ABTNodeClient.LaunchBlockletByLauncherParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponseLaunchBlockletByLauncher>} Checkout {@link ABTNodeClient.ResponseLaunchBlockletByLauncher} for resolved data format
 */

/**
 * launchBlockletWithoutWallet
 *
 * @name ABTNodeClient#launchBlockletWithoutWallet
 * @param {ABTNodeClient.LaunchBlockletWithoutWalletParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponseLaunchBlockletWithoutWallet>} Checkout {@link ABTNodeClient.ResponseLaunchBlockletWithoutWallet} for resolved data format
 */

/**
 * addBlockletSpaceGateway
 *
 * @name ABTNodeClient#addBlockletSpaceGateway
 * @param {ABTNodeClient.AddBlockletSpaceGatewayParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.GeneralResponse>} Checkout {@link ABTNodeClient.GeneralResponse} for resolved data format
 */

/**
 * deleteBlockletSpaceGateway
 *
 * @name ABTNodeClient#deleteBlockletSpaceGateway
 * @param {ABTNodeClient.DeleteBlockletSpaceGatewayParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.GeneralResponse>} Checkout {@link ABTNodeClient.GeneralResponse} for resolved data format
 */

/**
 * updateBlockletSpaceGateway
 *
 * @name ABTNodeClient#updateBlockletSpaceGateway
 * @param {ABTNodeClient.UpdateBlockletSpaceGatewayParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.GeneralResponse>} Checkout {@link ABTNodeClient.GeneralResponse} for resolved data format
 */

/**
 * updateAutoBackup
 *
 * @name ABTNodeClient#updateAutoBackup
 * @param {ABTNodeClient.UpdateAutoBackupParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.GeneralResponse>} Checkout {@link ABTNodeClient.GeneralResponse} for resolved data format
 */

/**
 * updateAutoCheckUpdate
 *
 * @name ABTNodeClient#updateAutoCheckUpdate
 * @param {ABTNodeClient.UpdateAutoCheckUpdateParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.GeneralResponse>} Checkout {@link ABTNodeClient.GeneralResponse} for resolved data format
 */

/**
 * updateBlockletSettings
 *
 * @name ABTNodeClient#updateBlockletSettings
 * @param {ABTNodeClient.UpdateBlockletSettingsParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.GeneralResponse>} Checkout {@link ABTNodeClient.GeneralResponse} for resolved data format
 */

/**
 * updateNodeInfo
 *
 * @name ABTNodeClient#updateNodeInfo
 * @param {ABTNodeClient.UpdateNodeInfoParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponseGetNodeInfo>} Checkout {@link ABTNodeClient.ResponseGetNodeInfo} for resolved data format
 */

/**
 * upgradeNodeVersion
 *
 * @name ABTNodeClient#upgradeNodeVersion
 * @param {ABTNodeClient.UpgradeNodeVersionParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponseUpgradeNodeVersion>} Checkout {@link ABTNodeClient.ResponseUpgradeNodeVersion} for resolved data format
 */

/**
 * restartServer
 *
 * @name ABTNodeClient#restartServer
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponseRestartServer>} Checkout {@link ABTNodeClient.ResponseRestartServer} for resolved data format
 */

/**
 * resetNode
 *
 * @name ABTNodeClient#resetNode
 * @param {ABTNodeClient.ResetNodeParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponseResetNode>} Checkout {@link ABTNodeClient.ResponseResetNode} for resolved data format
 */

/**
 * rotateSessionKey
 *
 * @name ABTNodeClient#rotateSessionKey
 * @param {ABTNodeClient.RotateSessionKeyParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.GeneralResponse>} Checkout {@link ABTNodeClient.GeneralResponse} for resolved data format
 */

/**
 * updateGateway
 *
 * @name ABTNodeClient#updateGateway
 * @param {ABTNodeClient.UpdateGatewayParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponseGateway>} Checkout {@link ABTNodeClient.ResponseGateway} for resolved data format
 */

/**
 * clearCache
 *
 * @name ABTNodeClient#clearCache
 * @param {ABTNodeClient.ClearCacheParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponseClearCache>} Checkout {@link ABTNodeClient.ResponseClearCache} for resolved data format
 */

/**
 * createMemberInvitation
 *
 * @name ABTNodeClient#createMemberInvitation
 * @param {ABTNodeClient.CreateMemberInvitationParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponseCreateInvitation>} Checkout {@link ABTNodeClient.ResponseCreateInvitation} for resolved data format
 */

/**
 * createTransferInvitation
 *
 * @name ABTNodeClient#createTransferInvitation
 * @param {ABTNodeClient.CreateTransferInvitationParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponseCreateTransferNodeInvitation>} Checkout {@link ABTNodeClient.ResponseCreateTransferNodeInvitation} for resolved data format
 */

/**
 * deleteInvitation
 *
 * @name ABTNodeClient#deleteInvitation
 * @param {ABTNodeClient.DeleteInvitationParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.GeneralResponse>} Checkout {@link ABTNodeClient.GeneralResponse} for resolved data format
 */

/**
 * createPassportIssuance
 *
 * @name ABTNodeClient#createPassportIssuance
 * @param {ABTNodeClient.CreatePassportIssuanceParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponseCreatePassportIssuance>} Checkout {@link ABTNodeClient.ResponseCreatePassportIssuance} for resolved data format
 */

/**
 * deletePassportIssuance
 *
 * @name ABTNodeClient#deletePassportIssuance
 * @param {ABTNodeClient.DeletePassportIssuanceParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.GeneralResponse>} Checkout {@link ABTNodeClient.GeneralResponse} for resolved data format
 */

/**
 * configTrustedPassports
 *
 * @name ABTNodeClient#configTrustedPassports
 * @param {ABTNodeClient.ConfigTrustedPassportsParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.GeneralResponse>} Checkout {@link ABTNodeClient.GeneralResponse} for resolved data format
 */

/**
 * configTrustedFactories
 *
 * @name ABTNodeClient#configTrustedFactories
 * @param {ABTNodeClient.ConfigTrustedFactoriesParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.GeneralResponse>} Checkout {@link ABTNodeClient.GeneralResponse} for resolved data format
 */

/**
 * configPassportIssuance
 *
 * @name ABTNodeClient#configPassportIssuance
 * @param {ABTNodeClient.ConfigPassportIssuanceParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.GeneralResponse>} Checkout {@link ABTNodeClient.GeneralResponse} for resolved data format
 */

/**
 * removeUser
 *
 * @name ABTNodeClient#removeUser
 * @param {ABTNodeClient.RemoveUserParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponseUser>} Checkout {@link ABTNodeClient.ResponseUser} for resolved data format
 */

/**
 * updateUserTags
 *
 * @name ABTNodeClient#updateUserTags
 * @param {ABTNodeClient.UpdateUserTagsParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponseUser>} Checkout {@link ABTNodeClient.ResponseUser} for resolved data format
 */

/**
 * updateUserExtra
 *
 * @name ABTNodeClient#updateUserExtra
 * @param {ABTNodeClient.UpdateUserExtraParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponseUser>} Checkout {@link ABTNodeClient.ResponseUser} for resolved data format
 */

/**
 * updateUserApproval
 *
 * @name ABTNodeClient#updateUserApproval
 * @param {ABTNodeClient.UpdateUserApprovalParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponseUser>} Checkout {@link ABTNodeClient.ResponseUser} for resolved data format
 */

/**
 * issuePassportToUser
 *
 * @name ABTNodeClient#issuePassportToUser
 * @param {ABTNodeClient.IssuePassportToUserParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponseUser>} Checkout {@link ABTNodeClient.ResponseUser} for resolved data format
 */

/**
 * revokeUserPassport
 *
 * @name ABTNodeClient#revokeUserPassport
 * @param {ABTNodeClient.RevokeUserPassportParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponseUser>} Checkout {@link ABTNodeClient.ResponseUser} for resolved data format
 */

/**
 * enableUserPassport
 *
 * @name ABTNodeClient#enableUserPassport
 * @param {ABTNodeClient.EnableUserPassportParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponseUser>} Checkout {@link ABTNodeClient.ResponseUser} for resolved data format
 */

/**
 * removeUserPassport
 *
 * @name ABTNodeClient#removeUserPassport
 * @param {ABTNodeClient.RemoveUserPassportParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.GeneralResponse>} Checkout {@link ABTNodeClient.GeneralResponse} for resolved data format
 */

/**
 * switchProfile
 *
 * @name ABTNodeClient#switchProfile
 * @param {ABTNodeClient.SwitchProfileParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponseUser>} Checkout {@link ABTNodeClient.ResponseUser} for resolved data format
 */

/**
 * updateUserAddress
 *
 * @name ABTNodeClient#updateUserAddress
 * @param {ABTNodeClient.UpdateUserAddressParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponseUser>} Checkout {@link ABTNodeClient.ResponseUser} for resolved data format
 */

/**
 * updateUserInfo
 *
 * @name ABTNodeClient#updateUserInfo
 * @param {ABTNodeClient.UpdateUserInfoParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponseUser>} Checkout {@link ABTNodeClient.ResponseUser} for resolved data format
 */

/**
 * createRole
 *
 * @name ABTNodeClient#createRole
 * @param {ABTNodeClient.CreateRoleParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponseRole>} Checkout {@link ABTNodeClient.ResponseRole} for resolved data format
 */

/**
 * updateRole
 *
 * @name ABTNodeClient#updateRole
 * @param {ABTNodeClient.UpdateRoleParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponseRole>} Checkout {@link ABTNodeClient.ResponseRole} for resolved data format
 */

/**
 * deleteRole
 *
 * @name ABTNodeClient#deleteRole
 * @param {ABTNodeClient.DeleteRoleParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.GeneralResponse>} Checkout {@link ABTNodeClient.GeneralResponse} for resolved data format
 */

/**
 * createPermission
 *
 * @name ABTNodeClient#createPermission
 * @param {ABTNodeClient.CreatePermissionParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponsePermission>} Checkout {@link ABTNodeClient.ResponsePermission} for resolved data format
 */

/**
 * updatePermission
 *
 * @name ABTNodeClient#updatePermission
 * @param {ABTNodeClient.UpdatePermissionParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponsePermission>} Checkout {@link ABTNodeClient.ResponsePermission} for resolved data format
 */

/**
 * deletePermission
 *
 * @name ABTNodeClient#deletePermission
 * @param {ABTNodeClient.DeletePermissionParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.GeneralResponse>} Checkout {@link ABTNodeClient.GeneralResponse} for resolved data format
 */

/**
 * grantPermissionForRole
 *
 * @name ABTNodeClient#grantPermissionForRole
 * @param {ABTNodeClient.GrantPermissionForRoleParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.GeneralResponse>} Checkout {@link ABTNodeClient.GeneralResponse} for resolved data format
 */

/**
 * revokePermissionFromRole
 *
 * @name ABTNodeClient#revokePermissionFromRole
 * @param {ABTNodeClient.RevokePermissionFromRoleParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.GeneralResponse>} Checkout {@link ABTNodeClient.GeneralResponse} for resolved data format
 */

/**
 * updatePermissionsForRole
 *
 * @name ABTNodeClient#updatePermissionsForRole
 * @param {ABTNodeClient.UpdatePermissionsForRoleParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponseRole>} Checkout {@link ABTNodeClient.ResponseRole} for resolved data format
 */

/**
 * hasPermission
 *
 * @name ABTNodeClient#hasPermission
 * @param {ABTNodeClient.HasPermissionParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.BooleanResponse>} Checkout {@link ABTNodeClient.BooleanResponse} for resolved data format
 */

/**
 * addBlockletStore
 *
 * @name ABTNodeClient#addBlockletStore
 * @param {ABTNodeClient.AddBlockletStoreParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.GeneralResponse>} Checkout {@link ABTNodeClient.GeneralResponse} for resolved data format
 */

/**
 * deleteBlockletStore
 *
 * @name ABTNodeClient#deleteBlockletStore
 * @param {ABTNodeClient.DeleteBlockletStoreParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.GeneralResponse>} Checkout {@link ABTNodeClient.GeneralResponse} for resolved data format
 */

/**
 * getTag
 *
 * @name ABTNodeClient#getTag
 * @param {ABTNodeClient.GetTagParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponseTag>} Checkout {@link ABTNodeClient.ResponseTag} for resolved data format
 */

/**
 * createTag
 *
 * @name ABTNodeClient#createTag
 * @param {ABTNodeClient.CreateTagParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponseTag>} Checkout {@link ABTNodeClient.ResponseTag} for resolved data format
 */

/**
 * updateTag
 *
 * @name ABTNodeClient#updateTag
 * @param {ABTNodeClient.UpdateTagParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponseTag>} Checkout {@link ABTNodeClient.ResponseTag} for resolved data format
 */

/**
 * deleteTag
 *
 * @name ABTNodeClient#deleteTag
 * @param {ABTNodeClient.DeleteTagParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponseTag>} Checkout {@link ABTNodeClient.ResponseTag} for resolved data format
 */

/**
 * createTagging
 *
 * @name ABTNodeClient#createTagging
 * @param {ABTNodeClient.CreateTaggingParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponseTagging>} Checkout {@link ABTNodeClient.ResponseTagging} for resolved data format
 */

/**
 * deleteTagging
 *
 * @name ABTNodeClient#deleteTagging
 * @param {ABTNodeClient.DeleteTaggingParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponseTagging>} Checkout {@link ABTNodeClient.ResponseTagging} for resolved data format
 */

/**
 * readNotifications
 *
 * @name ABTNodeClient#readNotifications
 * @param {ABTNodeClient.ReadNotificationsParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponseReadNotifications>} Checkout {@link ABTNodeClient.ResponseReadNotifications} for resolved data format
 */

/**
 * unreadNotifications
 *
 * @name ABTNodeClient#unreadNotifications
 * @param {ABTNodeClient.UnreadNotificationsParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponseReadNotifications>} Checkout {@link ABTNodeClient.ResponseReadNotifications} for resolved data format
 */

/**
 * addRoutingSite
 *
 * @name ABTNodeClient#addRoutingSite
 * @param {ABTNodeClient.AddRoutingSiteParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponseRoutingSite>} Checkout {@link ABTNodeClient.ResponseRoutingSite} for resolved data format
 */

/**
 * addDomainAlias
 *
 * @name ABTNodeClient#addDomainAlias
 * @param {ABTNodeClient.AddDomainAliasParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponseRoutingSite>} Checkout {@link ABTNodeClient.ResponseRoutingSite} for resolved data format
 */

/**
 * deleteDomainAlias
 *
 * @name ABTNodeClient#deleteDomainAlias
 * @param {ABTNodeClient.DeleteDomainAliasParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponseRoutingSite>} Checkout {@link ABTNodeClient.ResponseRoutingSite} for resolved data format
 */

/**
 * deleteRoutingSite
 *
 * @name ABTNodeClient#deleteRoutingSite
 * @param {ABTNodeClient.DeleteRoutingSiteParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.GeneralResponse>} Checkout {@link ABTNodeClient.GeneralResponse} for resolved data format
 */

/**
 * updateRoutingSite
 *
 * @name ABTNodeClient#updateRoutingSite
 * @param {ABTNodeClient.UpdateRoutingSiteParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponseRoutingSite>} Checkout {@link ABTNodeClient.ResponseRoutingSite} for resolved data format
 */

/**
 * addRoutingRule
 *
 * @name ABTNodeClient#addRoutingRule
 * @param {ABTNodeClient.AddRoutingRuleParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponseRoutingSite>} Checkout {@link ABTNodeClient.ResponseRoutingSite} for resolved data format
 */

/**
 * updateRoutingRule
 *
 * @name ABTNodeClient#updateRoutingRule
 * @param {ABTNodeClient.UpdateRoutingRuleParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponseRoutingSite>} Checkout {@link ABTNodeClient.ResponseRoutingSite} for resolved data format
 */

/**
 * deleteRoutingRule
 *
 * @name ABTNodeClient#deleteRoutingRule
 * @param {ABTNodeClient.DeleteRoutingRuleParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponseRoutingSite>} Checkout {@link ABTNodeClient.ResponseRoutingSite} for resolved data format
 */

/**
 * updateCertificate
 *
 * @name ABTNodeClient#updateCertificate
 * @param {ABTNodeClient.UpdateCertificateParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponseUpdateNginxHttpsCert>} Checkout {@link ABTNodeClient.ResponseUpdateNginxHttpsCert} for resolved data format
 */

/**
 * addCertificate
 *
 * @name ABTNodeClient#addCertificate
 * @param {ABTNodeClient.AddCertificateParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponseAddNginxHttpsCert>} Checkout {@link ABTNodeClient.ResponseAddNginxHttpsCert} for resolved data format
 */

/**
 * deleteCertificate
 *
 * @name ABTNodeClient#deleteCertificate
 * @param {ABTNodeClient.DeleteCertificateParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponseDeleteNginxHttpsCert>} Checkout {@link ABTNodeClient.ResponseDeleteNginxHttpsCert} for resolved data format
 */

/**
 * issueLetsEncryptCert
 *
 * @name ABTNodeClient#issueLetsEncryptCert
 * @param {ABTNodeClient.IssueLetsEncryptCertParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponseAddLetsEncryptCert>} Checkout {@link ABTNodeClient.ResponseAddLetsEncryptCert} for resolved data format
 */

/**
 * createAccessKey
 *
 * @name ABTNodeClient#createAccessKey
 * @param {ABTNodeClient.CreateAccessKeyParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponseCreateAccessKey>} Checkout {@link ABTNodeClient.ResponseCreateAccessKey} for resolved data format
 */

/**
 * updateAccessKey
 *
 * @name ABTNodeClient#updateAccessKey
 * @param {ABTNodeClient.UpdateAccessKeyParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponseUpdateAccessKey>} Checkout {@link ABTNodeClient.ResponseUpdateAccessKey} for resolved data format
 */

/**
 * deleteAccessKey
 *
 * @name ABTNodeClient#deleteAccessKey
 * @param {ABTNodeClient.DeleteAccessKeyParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponseDeleteAccessKey>} Checkout {@link ABTNodeClient.ResponseDeleteAccessKey} for resolved data format
 */

/**
 * verifyAccessKey
 *
 * @name ABTNodeClient#verifyAccessKey
 * @param {ABTNodeClient.VerifyAccessKeyParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponseAccessKey>} Checkout {@link ABTNodeClient.ResponseAccessKey} for resolved data format
 */

/**
 * createWebHook
 *
 * @name ABTNodeClient#createWebHook
 * @param {ABTNodeClient.CreateWebHookParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponseCreateWebHook>} Checkout {@link ABTNodeClient.ResponseCreateWebHook} for resolved data format
 */

/**
 * deleteWebHook
 *
 * @name ABTNodeClient#deleteWebHook
 * @param {ABTNodeClient.DeleteWebHookParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponseDeleteWebHook>} Checkout {@link ABTNodeClient.ResponseDeleteWebHook} for resolved data format
 */

/**
 * updateWebHookState
 *
 * @name ABTNodeClient#updateWebHookState
 * @param {ABTNodeClient.UpdateWebHookStateParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponseCreateWebhookEndpoint>} Checkout {@link ABTNodeClient.ResponseCreateWebhookEndpoint} for resolved data format
 */

/**
 * createProject
 *
 * @name ABTNodeClient#createProject
 * @param {ABTNodeClient.CreateProjectParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponseProject>} Checkout {@link ABTNodeClient.ResponseProject} for resolved data format
 */

/**
 * updateProject
 *
 * @name ABTNodeClient#updateProject
 * @param {ABTNodeClient.UpdateProjectParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponseProject>} Checkout {@link ABTNodeClient.ResponseProject} for resolved data format
 */

/**
 * deleteProject
 *
 * @name ABTNodeClient#deleteProject
 * @param {ABTNodeClient.DeleteProjectParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.GeneralResponse>} Checkout {@link ABTNodeClient.GeneralResponse} for resolved data format
 */

/**
 * createRelease
 *
 * @name ABTNodeClient#createRelease
 * @param {ABTNodeClient.CreateReleaseParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponseRelease>} Checkout {@link ABTNodeClient.ResponseRelease} for resolved data format
 */

/**
 * deleteRelease
 *
 * @name ABTNodeClient#deleteRelease
 * @param {ABTNodeClient.DeleteReleaseParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.GeneralResponse>} Checkout {@link ABTNodeClient.GeneralResponse} for resolved data format
 */

/**
 * updateSelectedResources
 *
 * @name ABTNodeClient#updateSelectedResources
 * @param {ABTNodeClient.UpdateSelectedResourcesParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.GeneralResponse>} Checkout {@link ABTNodeClient.GeneralResponse} for resolved data format
 */

/**
 * connectToStore
 *
 * @name ABTNodeClient#connectToStore
 * @param {ABTNodeClient.ConnectToStoreParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponseConnectToStore>} Checkout {@link ABTNodeClient.ResponseConnectToStore} for resolved data format
 */

/**
 * disconnectFromStore
 *
 * @name ABTNodeClient#disconnectFromStore
 * @param {ABTNodeClient.DisconnectFromStoreParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponseDisconnectFromStore>} Checkout {@link ABTNodeClient.ResponseDisconnectFromStore} for resolved data format
 */

/**
 * publishToStore
 *
 * @name ABTNodeClient#publishToStore
 * @param {ABTNodeClient.PublishToStoreParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponsePublishToStore>} Checkout {@link ABTNodeClient.ResponsePublishToStore} for resolved data format
 */

/**
 * connectByStudio
 *
 * @name ABTNodeClient#connectByStudio
 * @param {ABTNodeClient.ConnectByStudioParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponseConnectByStudio>} Checkout {@link ABTNodeClient.ResponseConnectByStudio} for resolved data format
 */

/**
 * addBlockletSecurityRule
 *
 * @name ABTNodeClient#addBlockletSecurityRule
 * @param {ABTNodeClient.AddBlockletSecurityRuleParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponseBlockletSecurityRule>} Checkout {@link ABTNodeClient.ResponseBlockletSecurityRule} for resolved data format
 */

/**
 * updateBlockletSecurityRule
 *
 * @name ABTNodeClient#updateBlockletSecurityRule
 * @param {ABTNodeClient.UpdateBlockletSecurityRuleParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponseBlockletSecurityRule>} Checkout {@link ABTNodeClient.ResponseBlockletSecurityRule} for resolved data format
 */

/**
 * deleteBlockletSecurityRule
 *
 * @name ABTNodeClient#deleteBlockletSecurityRule
 * @param {ABTNodeClient.DeleteBlockletSecurityRuleParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.GeneralResponse>} Checkout {@link ABTNodeClient.GeneralResponse} for resolved data format
 */

/**
 * addBlockletResponseHeaderPolicy
 *
 * @name ABTNodeClient#addBlockletResponseHeaderPolicy
 * @param {ABTNodeClient.AddBlockletResponseHeaderPolicyParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponseBlockletResponseHeaderPolicy>} Checkout {@link ABTNodeClient.ResponseBlockletResponseHeaderPolicy} for resolved data format
 */

/**
 * updateBlockletResponseHeaderPolicy
 *
 * @name ABTNodeClient#updateBlockletResponseHeaderPolicy
 * @param {ABTNodeClient.UpdateBlockletResponseHeaderPolicyParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponseBlockletResponseHeaderPolicy>} Checkout {@link ABTNodeClient.ResponseBlockletResponseHeaderPolicy} for resolved data format
 */

/**
 * deleteBlockletResponseHeaderPolicy
 *
 * @name ABTNodeClient#deleteBlockletResponseHeaderPolicy
 * @param {ABTNodeClient.DeleteBlockletResponseHeaderPolicyParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.GeneralResponse>} Checkout {@link ABTNodeClient.GeneralResponse} for resolved data format
 */

/**
 * addBlockletAccessPolicy
 *
 * @name ABTNodeClient#addBlockletAccessPolicy
 * @param {ABTNodeClient.AddBlockletAccessPolicyParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponseBlockletAccessPolicy>} Checkout {@link ABTNodeClient.ResponseBlockletAccessPolicy} for resolved data format
 */

/**
 * updateBlockletAccessPolicy
 *
 * @name ABTNodeClient#updateBlockletAccessPolicy
 * @param {ABTNodeClient.UpdateBlockletAccessPolicyParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponseBlockletAccessPolicy>} Checkout {@link ABTNodeClient.ResponseBlockletAccessPolicy} for resolved data format
 */

/**
 * deleteBlockletAccessPolicy
 *
 * @name ABTNodeClient#deleteBlockletAccessPolicy
 * @param {ABTNodeClient.DeleteBlockletAccessPolicyParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.GeneralResponse>} Checkout {@link ABTNodeClient.GeneralResponse} for resolved data format
 */

/**
 * restartAllContainers
 *
 * @name ABTNodeClient#restartAllContainers
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponseRestartAllContainers>} Checkout {@link ABTNodeClient.ResponseRestartAllContainers} for resolved data format
 */

/**
 * createWebhookEndpoint
 *
 * @name ABTNodeClient#createWebhookEndpoint
 * @param {ABTNodeClient.CreateWebhookEndpointParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponseCreateWebhookEndpoint>} Checkout {@link ABTNodeClient.ResponseCreateWebhookEndpoint} for resolved data format
 */

/**
 * updateWebhookEndpoint
 *
 * @name ABTNodeClient#updateWebhookEndpoint
 * @param {ABTNodeClient.UpdateWebhookEndpointParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponseUpdateWebhookEndpoint>} Checkout {@link ABTNodeClient.ResponseUpdateWebhookEndpoint} for resolved data format
 */

/**
 * deleteWebhookEndpoint
 *
 * @name ABTNodeClient#deleteWebhookEndpoint
 * @param {ABTNodeClient.DeleteWebhookEndpointParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponseDeleteWebhookEndpoint>} Checkout {@link ABTNodeClient.ResponseDeleteWebhookEndpoint} for resolved data format
 */

/**
 * retryWebhookAttempt
 *
 * @name ABTNodeClient#retryWebhookAttempt
 * @param {ABTNodeClient.RetryWebhookAttemptParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponseGetWebhookAttempt>} Checkout {@link ABTNodeClient.ResponseGetWebhookAttempt} for resolved data format
 */

/**
 * regenerateWebhookEndpointSecret
 *
 * @name ABTNodeClient#regenerateWebhookEndpointSecret
 * @param {ABTNodeClient.RegenerateWebhookEndpointSecretParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponseRegenerateWebhookEndpointSecret>} Checkout {@link ABTNodeClient.ResponseRegenerateWebhookEndpointSecret} for resolved data format
 */

/**
 * addUploadEndpoint
 *
 * @name ABTNodeClient#addUploadEndpoint
 * @param {ABTNodeClient.AddUploadEndpointParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.GeneralResponse>} Checkout {@link ABTNodeClient.GeneralResponse} for resolved data format
 */

/**
 * deleteUploadEndpoint
 *
 * @name ABTNodeClient#deleteUploadEndpoint
 * @param {ABTNodeClient.DeleteUploadEndpointParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.GeneralResponse>} Checkout {@link ABTNodeClient.GeneralResponse} for resolved data format
 */

/**
 * connectToEndpoint
 *
 * @name ABTNodeClient#connectToEndpoint
 * @param {ABTNodeClient.ConnectToEndpointParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponseConnectToEndpoint>} Checkout {@link ABTNodeClient.ResponseConnectToEndpoint} for resolved data format
 */

/**
 * disconnectFromEndpoint
 *
 * @name ABTNodeClient#disconnectFromEndpoint
 * @param {ABTNodeClient.DisconnectFromEndpointParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.GeneralResponse>} Checkout {@link ABTNodeClient.GeneralResponse} for resolved data format
 */

/**
 * publishToEndpoint
 *
 * @name ABTNodeClient#publishToEndpoint
 * @param {ABTNodeClient.PublishToEndpointParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponsePublishToEndpoint>} Checkout {@link ABTNodeClient.ResponsePublishToEndpoint} for resolved data format
 */

/**
 * connectToAigne
 *
 * @name ABTNodeClient#connectToAigne
 * @param {ABTNodeClient.ConnectToAigneParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponseConnectToEndpoint>} Checkout {@link ABTNodeClient.ResponseConnectToEndpoint} for resolved data format
 */

/**
 * disconnectToAigne
 *
 * @name ABTNodeClient#disconnectToAigne
 * @param {ABTNodeClient.DisconnectToAigneParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.GeneralResponse>} Checkout {@link ABTNodeClient.GeneralResponse} for resolved data format
 */

/**
 * verifyAigneConnection
 *
 * @name ABTNodeClient#verifyAigneConnection
 * @param {ABTNodeClient.VerifyAigneConnectionParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.GeneralResponse>} Checkout {@link ABTNodeClient.GeneralResponse} for resolved data format
 */

/**
 * createOrg
 *
 * @name ABTNodeClient#createOrg
 * @param {ABTNodeClient.CreateOrgParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponseGetOrg>} Checkout {@link ABTNodeClient.ResponseGetOrg} for resolved data format
 */

/**
 * updateOrg
 *
 * @name ABTNodeClient#updateOrg
 * @param {ABTNodeClient.UpdateOrgParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponseGetOrg>} Checkout {@link ABTNodeClient.ResponseGetOrg} for resolved data format
 */

/**
 * deleteOrg
 *
 * @name ABTNodeClient#deleteOrg
 * @param {ABTNodeClient.DeleteOrgParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.GeneralResponse>} Checkout {@link ABTNodeClient.GeneralResponse} for resolved data format
 */

/**
 * addOrgMember
 *
 * @name ABTNodeClient#addOrgMember
 * @param {ABTNodeClient.AddOrgMemberParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponseGetOrg>} Checkout {@link ABTNodeClient.ResponseGetOrg} for resolved data format
 */

/**
 * removeOrgMember
 *
 * @name ABTNodeClient#removeOrgMember
 * @param {ABTNodeClient.RemoveOrgMemberParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.GeneralResponse>} Checkout {@link ABTNodeClient.GeneralResponse} for resolved data format
 */

/**
 * inviteMembersToOrg
 *
 * @name ABTNodeClient#inviteMembersToOrg
 * @param {ABTNodeClient.InviteMembersToOrgParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponseInviteMembersToOrg>} Checkout {@link ABTNodeClient.ResponseInviteMembersToOrg} for resolved data format
 */

/**
 * addOrgResource
 *
 * @name ABTNodeClient#addOrgResource
 * @param {ABTNodeClient.AddOrgResourceParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponseOrgResourceOperation>} Checkout {@link ABTNodeClient.ResponseOrgResourceOperation} for resolved data format
 */

/**
 * migrateOrgResource
 *
 * @name ABTNodeClient#migrateOrgResource
 * @param {ABTNodeClient.MigrateOrgResourceParams} params
 * @function
 * @memberof ABTNodeClient
 * @returns {Promise<ABTNodeClient.ResponseOrgResourceOperation>} Checkout {@link ABTNodeClient.ResponseOrgResourceOperation} for resolved data format
 */
