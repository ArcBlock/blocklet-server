## 1.17.12 (April 22, 2026)

- feat(core): make auto-backup interval configurable via `ABT_NODE_AUTO_BACKUP_INTERVAL`
- feat(core): add analytics data cleanup cron with 90-day retention
- fix(core): fix wildcard certificate matching for non-domain CN certs (e.g. CloudFlare Origin)
- fix(security): upgrade graphql to 16.8.1 to fix uncontrolled resource consumption
- fix(security): block multicast IPs in ssrf-protector to fix private-ip bypass
- fix(security): upgrade path-to-regexp to 0.1.13 to fix ReDoS vulnerability
- fix(security): remove unused express-xss-sanitizer dependency from webapp
- fix(deps): move graphql to dependencies and pin @arcblock/sdk-util to 0.36.3 in @blocklet/server-js
- chore(deps): upgrade @arcblock/* and @ocap/* to 1.29.27, @blocklet/did-space-* to 1.2.23
- fix(webapp): guard against null blocklet when accessing environmentObj

## 1.17.11 (February 11, 2026)

- feat(cli): support export/import for cross-server blocklet migration (#13444)
- feat(cli): add `blocklet delete` command for production blocklets
- feat(core): audit log data retention & index optimization
- feat(core): persist BLOCKLET_APP_EK so it survives cross-server migration
- feat(webhook): add HMAC-SHA256 signing, exponential backoff retry, and fix listener leak
- fix(core): exclude revoked passports from admin notification receivers
- fix(blocklet-services): guard against null blocklet in helmet/cors middleware
- fix(export): fix blocklet export/import for CLI-uploaded apps and controller field
- fix(export): preserve appPid for migrated blocklets during export
- fix(did-document): add DNS CNAME records for migrated alsoKnownAs DIDs

## 1.17.10 (February 09, 2026)

- feat(ux): add toast alert toggle in blocklet notification settings (#13433)
- fix: filter out root path and deduplicate disallow entries in robots.txt
- refactor: remove @mui/material dependency from backend email service
- chore: move @mui/material and @emotion to devDependencies

## 1.17.9 (February 06, 2026)

- fix(ci): publish workflow

## 1.17.8 (January 04, 2026)

- feat(core): support custom domains for blocklets to serve static sites (#13319)
- feat(core): add user & user-session createdByAppPid field (#13330)
- feat(service): support custom user account name (#13327)
- feat(service): remove org switch and support avatar (#13308)
- feat(service): support aigne hub connection status in health api (#13257)
- feat(service): enhance DID connect settings with action config (#13268)
- feat(dx): migrate @abtnode/constant to esm & optimize @blocklet/js-sdk esm result (#13322)
- feat(dx): add agent skills for project setup and pr creation (#13278)
- feat(refactor): split large files for AINE (#13276)
- feat: reduce the size of the packaged product (#13305)
- feat: use bun workspace replace yarn workspace (#13292)
- fix(security): skip permission management for trusted blocklets (#13329)
- fix(router): fix certificate matching logic with exact match priority
- fix(core): sitemap merge error due to cheerio version (#13317)
- fix(core): missing blocklet events and add code split verify skill (#13313)
- fix(core): import eventHub error in db-cache (#13334)
- fix(core): handle ulimit unlimited value when starting nginx
- fix(core): improve migration safety and did document error handling (#13296)
- fix(core): bust blocklet cache when run in cluster mode (#13280)
- fix(core): avoid including index.html in nginx root directive
- fix(core): exception in team manager under race conditions
- fix(ux): tune duplicate owner handling after app transfer (#13315)
- fix(ux): user login email grammer and typo
- fix(sdk): ensureWallet work with eth sender and favicon.ico proxy (#13301)
- fix(cli): incorrect appUrl printed for blocklet dev on static webapps (#13285)
- fix(cli): should exclude certain hidden folders when bundle blocklet
- fix(cli): read dotfiles bug in blocklet dev mode (#13259)
- fix(api): add context parameter to notification and access key methods (#13300)
- fix(dx): set blocklet owner from server owner in development mode
- fix(deps): update react-email to latest and remove aigne hub (#13312)
- fix(test): support coverage merge and report (#13320)
- fix(test): broken router unit test (#13303)
- chore(service): support custom authorize page wording (#13332)

## 1.17.7 (December 22, 2025)

- fix(core): none blocklet routing rules are broken
- feat: enhance backup status display and refactor settings logic (#13154)
- fix(test): ensure broken unit and e2e test work (#13155)
- fix(auth): update domain retrieval to support x-real-hostname header (#13144)
- fix(core): more reliable blocklet upgrade and mount point update (#13149)
- feat(core): support app level updatedAt and stoppedAt updating (#13150)
- fix(service): use default oauth prompt settings for all providers (#13148)
- fix(test): router help tests failure caused by last fix
- fix(dx): routing rules are ignored for dev components
- fix(service): show oauth login successful message (#13140)
- feat(cli): support routing all/full for server start
- fix(service): do not count blocklet routing rule count in health
- feat(core): support running thousands of blocklet without becoming slow (#13129)
- fix(core): failure when launch blocklet with wallet (#13135)
- feat(core): add trusted sources and iframe embedding env vars (#13132)
- feat(service): support custom login methods and styling (#13128)
- fix(ux): enforce account binding for walletless blocklet launch (#13133)
- fix(core): handle missing owner info when publishing DID document (#13123)
- feat(perf): tune cache for blocklet info with memory and LRU (#13125)
- fix(core): automatic backup broken after app deployment v2 (#13126)
- fix(core): automatic backup broken after app deployment (#13124)
- fix(perf): faster blocklet.js and avoid less event handling in sdk (#13111)
- fix(core): add jobs entityId migration in certificate manager (#13119)
- feat(docker): support tmpfs mount and runtime env for blocklet
- feat(ux): support stop errored blocklets (#13117)
- feat(core): replace fixed renewal offset with dynamic ratio-based certificate renewal logic (#13113)
- feat(core): skip common large folders during backup (#13110)
- fix(sdk): should attach correct visitorId when refresh session (#13108)
- feat(service): add pending notification stats and enhance teamDid tracking (#13075)

## 1.17.6 (December 20, 2025)

- fix(core): avoid rmdir ENOTEMPTY in blocklet install and update (#13100)
- fix(core): add null safety for blocklet.site.domainAliases access (#13096)
- fix(ux): enforce maxUploadFileSize and disable html upload sanitize (#13094)
- fix(ux): correct app path for service page (#13093)
- fix(core): prevent duplicate router updates when blue-green upgrade (#13090)
- fix(core): incorrect blocklet status and avatar in did document (#13091)
- chore(tests): cover core blocklets with e2e test flow (#12897)
- fix(perf): prefer blocklet info from cache for faster blocklet service (#13088)
- feat(ux): use app shell component from arcblock ux (#13082)
- feat(core): extend DID document with blocklet capabilities and metadata (#13078)
- fix(core): routing rule conflicts and DID DNS UDP interface issues (#13085)
- fix(ux): verify access broken for batch ops and tune blocklet notification (#13080)
- fix(deps): lock transliteration@2.3.5 (#13081)
- feat(service): filter notifications base on session user role (#13049)
- fix(core): ensure deployedForm for blocklet components (#13072)
- feat(sdk): support update blocklet preferences from sdk (#13074)
- fix(ux): blocklet manager i18n wording and waf badge display (#13069)
- fix(perf): disable global service worker prefetch (#13067)

## 1.17.5 (December 15, 2025)

- feat(ux): organize blocklet dashboard and tune page headers (#13048)
- fix(core): invalid time value for blocklet children table (#13063)
- fix(security): encrypt and mask sensitive notification config in db and audit-log (#13056)
- fix(core): resolve race conditions in child status updates and improve concurrent operation safety (#13061)
- chore: update webhook UI and improve health check fallback (#13060)
- fix(service): expired user session list is empty (#13058)
- fix(service): failed to redirect to login page after dashboard logout (#13054)
- fix(service): tune service worker policy to avoid unexpected cache (#13053)
- refactor(core): move blocklet children to new table for reliability (#13052)
- fix(ux): tune responsiveness and access-key create dialog (#13051)
- fix(core): failed to get alsoKnownAs across site group members (#13050)
- fix(service): simplify blocklet-service sw cache logic (#13045)
- feat(core): improve serverless cert and enable test store by default (#13038)
- fix(ux): remove app name validation from blocklet branding (#13043)
- fix(ux): tune blocklet list table styling and action order (#13042)
- fix(ux): position all toast at top center for usability (#13040)
- fix(router): disable more rules caused service api error
- fix(core): duplicated 5xx alert in cluster mode (#13039)

## 1.17.4 (December 6, 2025)

- feat(core): serverless mode auto download slp certificate (#13029)
- fix(ux): backup calendar not rendering as expected due to data type (#13030)
- chore: update diagrams in docs generated with smith (#13018)
- fix(core): tue retry and check interval for ensure running flow (#13023)
- fix(sdk): tune compatibility for component sign and verify (#13019)
- fix(ux): add page header to built-in services pages (#13017)
- feat(core): optimize ensure running performance (#13014)
- feat(ux): view logs directly from blocklet list (#13012)
- fix(ux): tune blocklet domain status check (#13016)
- feat(cli): support custom data dir with ABT_NODE_CUSTOM_DATA_DIR (#13013)
- fix(ux): show warning if appUrl not in blocklet domain list (#13010)
- fix(core): skip csrf token generation for non-service envs (#13009)
- fix(core): passkey auth failure on server dashboard (#13004)
- fix(service): disable webhooks automatically that failed too much (#12911)
- fix(service): tune the performance of notification queue (#12916)
- feat(cli): support create random blocklet did without wallet
- fix(service): passport mapping verify failed for migrated sites (#12907)
- fix(core): remove db cache lock for sqlite adapter #12913
- fix(security): allow some official blocklets to use workers (#12910)

## 1.17.3 (November 28, 2025)

- feat(cli): support reset stuck component status with cleanup
- fix(core): tune webhook validation for user and server (#12900)
- fix(core): ensure csrf token is correctly set for all login workflow (#12901)
- fix(service): destroy verify failed when using passport mapping (#12888)
- fix(core): unexpected sequelize logger config overwritten (#12894)
- fix(security): make csrf token generate and refresh more reliable (#12889)
- fix(core): resource packs not found on web-smith launch (#12887)
- feat(sdk): support routing rule related methods from sdk (#12892)
- fix(core): ensure no port assign conflict in cluster mode (#12883)
- feat(core): support updating ssl certificate content (#12881)
- fix(service): polish notification related logging and errors (#12870)
- fix(core): rollback only failed blocklets in blue-green upgrade (#12879)
- fix(core): tune blocklet start reliability and concurrency (#12875)
- fix(core): include domain hash in download folder to avoid conflict (#12873)
- fix(core): launcher info not fetched on server init (#12869)
- fix: unexpected csrf token refresh on get requests (#12867)
- feat: add notification health api for service and daemon (#12861)
- fix(core): sqlite/redis lock not working as expected for cluster mode (#12860)
- feat(service): support connect wallet without staking for gas
- feat(core): support unsafe mode for legacy blocklets
- fix(ci): test error in github and deprecate WITH_SK (#12856)
- fix(service): correctly retrieve ASK in service middleware (#12854)
- fix(sdk): make component call verify more robust (#12852)
- chore(docs): push doc smith cache [skip ci]
- fix(ux): logo is broken for removed components (#12847)
- feat(sdk): add log to troubleshoot csrf token errors (#12850)
- fix(service): remove legacy request signature support (#12849)

## 1.17.2 (November 14, 2025)

- fix(sdk): always fetch blocklet json from did domain
- fix(test): flaky process tests using worker wrappers (#12840)
- fix(service): avoid timeout in get user-session api (#12839)
- feat(ci): allow manual doc publish workflow trigger (#12838)
- fix(core): avoid duplicate notification send and emit (#12837)
- fix(core): make blocklet start process more robust (#12832)
- fix(api): the default route of oauth server should return 404 (#12833)
- fix(sdk): ensure socket auth token are refresh on rejoin (#12831)
- fix(ux): reconnect socket when user info changes (#12830)
- fix(cli): blocklet server init --mode parameter validation (#12828)
- fix(ux): tune some did connect error messages (#12825)
- fix(core): truncate service messages to avoid channel join error
- fix(core): ensure boolean type for user approved filter (#12823)
- feat(cli): use launcher.arcblock.io as default launcher url on init (#12822)
- fix(service): improve oauth error handling with detailed conflict info (#12817)
- fix(sdk): support safe disconnect for notification sockets (#12820)
- feat(dx): support verbose mode when running unit tests (#12815)

## 1.17.1 (November 06, 2025)

- fix(sdk): did-connect broken for migrated blocklets (#12810)
- fix(service): incorrect csrf token generated during login (#12809)
- fix(service): org user invitation breaks for federated sites and oauth (#12802)
- fix(cli): enable daemonMaxMemoryLimit check on server start (#12807)

## 1.17.0 (October 31, 2025)

- fix(core): resource blocklet not started on launcher (#12800)
- fix(ux): disable default text display for CodeBlock components (#12799)
- fix(dx): cannot invite users for blocklets in dev mode (#12798)
- fix(sdk): avoid blocklet crash when subscribe to events
- fix(service): support green ports for openembed api (#12796)
- fix(core): wipe sensitive data not handling nested data
- fix(sdk): tune component call error and log message
- fix(blocklet): bump static server to next version
- fix(ux): component info dialog not recognizing green status (#12794)
- fix(core): disable persistent cache for system messages (#12795)
- fix(core): enforce fault tolerance when check multiple interfaces (#12792)
- fix(core): ensure user profile sync fields are consistent (#12783)
- fix(sdk): try load components info from disk files to keep up-to-date (#12790)
- fix(sdk): socket should reconnect with fresh token on error (#12789)
- fix(core): avoid router cache for incorrect asset proxy response (#12788)
- fix(studio): show proper tip for singleton blocklets (#12727)
- fix(api): incorrect total count when paginating users with includes (#12787)
- fix(core): incorrect csrf token generated on refresh login token (#12784)
- feat(service): add param validation for remote sign api (#12782)
- fix(ux): i18n for notification page title (#12725)
- fix(ux): running blocklet status change during app start (#12723)
- fix(core): reload router when restart blocklet with multiple interfaces (#12714)
- fix(dx): deprecate per-package test and coverage commands (#12720)
- feat(core): support disable blue and green start with environment (#12719)
- fix(sdk): always use arcblock type for access wallet (#12717)
- fix(core): ensure publicKey environments for entire blocklet lifecycle (#12713)
- fix(core): consistent blocklet access key wallet derive and verify (#12710)
- fix(core): broken restart and unexpected update to installedAt (#12709)
- feat(core): add serverless heartbeat to report node status to launcher (#12707)
- fix(sdk): blocklet config not updating on runtime events (#12704)
- fix(apps): static server blocklet sdk import syntax (#12703)
- fix(dx): reduce ci cypress use and repair e2e (#12698)
- fix(sdk): always use appPid as accessKeyId #12700
- fix(service): invalid ethereum signature from remote sign (#12696)
- fix(dx): update timeout and support retry for unit tests (#12694)
- fix(core): passkey login is broken for server dashboard (#12695)
- feat(dx): migrate test framework from jest to bun test (#12686)
- fix(core): generate access secret key from blocklet permanent did (#12689)
- fix(core): enhance websocket authentication for backward compatibility (#12688)
- feat(service): enhance remote signing with permanent wallet (#12684)
- feat(service): support sync ban user in federated (#12682)
- fix(service): should support greenStatus in blocklet info api (#12683)
- feat(service): support remote sign from blocklet service (#12678)
- fix(service): validate passport failed when create access key (#12665)
- feat(cli): support orphan process detection and cleanup (#12663)
- fix(router): disable more rules caused websmith publish failure
- feat(core): separate audit logs for server and blocklets (#12662)

## 1.16.53 (October 14, 2025)

- fix(ux): add proper navigation fallback for unsupported locale (#12657)
- fix(api): enforce did validation for query and path params (#12658)
- fix(api): skip referrer check when run behind cloud front
- feat(core): support singleton instance and tune daemon job concurrency
- fix(services): add URL verification to prevent SSRF attacks (#12654)
- fix(core): use json instead of sqlite as i18n database (#12655)
- feat(ux): show blocklet sdk calls from component in audit-log (#12652)
- feat(core): add component did column for audit log (#12650)
- fix(core): syntax error for raw query when using PostgreSQL (#12647)
- fix(service): enforce https in csp/cors domain list (#12648)
- feat(core): set appUrl when binding custom domain from launcher (#12646)
- fix(core): enforce min interval for ensure running (#12645)
- fix(service): ensure all trusted domains are allowed in service pages (#12640)
- fix(core): correct SQL syntax for userDid in org queries (#12643)
- feat(api): add paging validation and tune wallet connect prompt (#12638)
- fix(core): SQL syntax error for User.getOwnerDids
- fix(core): component calls routed to incorrect docker instance (#12634)
- fix(docs): update doc set title/desc/logo (#12632)
- fix(security): improve GraphQL query validation and error handling (#12630)
- feat(core): use start instead of restart when ensure running (#12628)
- fix(ux): tune tag related locale and validation rules (#12627)
- fix(sdk): incorrect teamDid arg format for configNavigations
- fix(sdk): should include blocklet navigation for getBlocklet
- feat(core): support deferred passport issuance on org creation (#12623)
- feat(api): allow configBlocklet in serverless from launcher (#12624)
- fix(api): allow configBlocklet and confgNavigations from component
- fix(core): improve port check accuracy (#12621)
- chore: bump static server version and cleanup yarn lock

## 1.16.52 (October 08, 2025)

- fix(service): font/manifest can not load from cdn host
- fix(service): script can not load from cdn host
- feat(sdk): make cdn works both for blocklet and service (#12604)
- feat(core): embed and parse orgId in login token (#12612)
- fix(core): tune port assign for blue/green deployment (#12611)
- feat(sdk): allow config envs and navigations from component
- fix(router): disable more rules caused csrf token failure
- fix(service): access key auth page crash when not logged in #12608
- fix(sdk): incorrect component call port during blue/green deployment (#12606)
- feat(service): organization support for users and resources (#12513)
- feat(core): support zero downtime blocklet restart and upgrade (#12537)
- fix(service): migration not working when removing labels (#12599)
- fix(service): ensure session sync sequence within federated sites (#12597)
- feat(sdk): add cdn middleware for faster blocklet asset loading (#12596)
- feat(service): support required roles on access-key auth (#12532)
- feat(service): support locking theme settings (#12533)
- fix(core): allow install external blocklets for serverless mode
- chore(ux): tune wording and phrases in locale files (#12528)
- fix(core): fallback when owner missing from blocklet settings
- fix(service): tune user label management ux and wording (#12527)
- feat(service): support user tagging management from dashboard (#12524)
- feat(service): section level navigation reset and access-key search (#12521)
- fix(ux): better route handling and responsiveness tuning (#12522)
- feat(core): support mutating serverless blocklets with env (#12519)
- feat(core): support custom domain binding and enhance blocklet cleanup
- feat(service): support login by launcher token for arcsphere (#12510)
- chore: and docs publish pipeline and translations (#12507)
- chore: update server and blocklet docs by doc-smith (#12503)
- feat(core): share cluster size env between daemon and service (#12505)
- feat(sdk): skips csrf token verification for mcp routes (#12501)
- feat(cli): support setup nginx as routing engine (#12497)
- fix(dx): event hub is broken for dev mode (#12500)
- feat(service): support mcp tool manager and call proxy (#12496)
- fix(test): update blocklet status assertions for blocklet tests (#12494)
- feat(core): support cluster mode for server daemon (#12486)
- fix(service): failed to query notification via connected user (#12492)
- feat(service): make invite tab only visible to user self (#12489)
- feat(service): sensible utm_campaign default for notification emails (#12487)
- fix(router): disable more rules caused csrf token failure
- fix(api): verify destroy failed when using custom passport (#12482)
- feat(service): support utm for links in email notifications (#12481)
- feat: add missing audit logs for user APIs (#12478)
- feat(docker): support cluster mode for node.js blocklet (#12475)
- fix: improve IP address display and json_extract in postgres (#12474)
- feat(api): support user invites listing (#12473)
- feat(cli): restart PM2 cluster when instance count changes (#12472)
- feat(security): add CSRF token handling during login and passport switch (#12468)
- fix(cli): copy config.env to process.env on server start (#12470)
- fix(core): enable inviting for users with normal passports (#12469)

## 1.16.51 (September 05, 2025)

- feat(service): attach $sender info when trigger webhooks (#12464)
- feat(api): add privacy protection for user following (#12460)
- fix(security): ensure crsf token match between requests and components (#12462)
- fix(security): disable inviting for users with tmp passports (#12458)
- feat(api): support useCache for getBlocklet from sdk (#12461)
- fix(service): proper error handling and logging on notification sending (#12457)
- fix(router): add waf exclusion rule that breaks did names (#12456)
- fix(core): ensure standard return value on resource blocklet start (#12454)
- feat(core): support start/stop events for serverless blocklets (#12452)
- fix(doc): update logo for doc collections on docsmith (#12441)

## 1.16.50 (September 03, 2025)

- fix(ux): theming preview page has been blocked (#12396)
- feat(sdk): add service type definitions for node-sdk (#12394)
- fix(core): permission flag compatibility for all node.js versions (#12391)
- feat(service): consistent notification send options for retry (#12393)
- fix(core): sql syntax error in postgres for getUsers (#12393)

## 1.16.49 (September 02, 2025)

- feat(sdk): implement CSRF protection with timing attack prevention (#12380)
- feat(ux): optimize user follower list component and mobile layout (#12389)
- fix(service): disable sw cache for ga relates js & xhr (#12387)
- feat(router): add multi-origin attack protection for HTTPS requests (#12388)
- fix(router): blocklet preference load failed from server dashbaord (#12385)
- feat(cli): include docker info for blocklet server status (#12383)
- chore: update docs for blocklet cli and server sdk (#12382)
- feat(security): enhance CSP policy with frame-src support and cleaner domain management (#12378)
- fix(test): health endpoint data format change
- chore: bump deps and disable waf for asset proxy
- fix(service): simplify blocklet cache in blocklet service (#12376)
- refactor(security): centralize CSP sources into constants (#12374)
- fix(core): simplify resource blocklet start workflow to avoid stucking (#12370)
- feat(service): add fallback route handler for unmatched paths (#12372)
- feat(service): support google analytics for did-connect actions (#12368)
- fix(router): add security headers for server daemon
- feat(service): always send email when unsubscribe disabled (#12369)
- chore: update codesmith review rules
- feat(api): support bath user follow status query (#12355)
- fix(core): ensure-running stuck in stopping and update stuck in starting (#12364)
- fix(core): increase passport field length in postgres (#12362）
- fix(router): favicon.ico load error when root path redirected (#12360)
- feat(ux): include app did in aigne-hub transactions link (#12357)
- fix(core): remove graceful restart online check (#12358)
- chore: add docs for blocklet sdk node.js (#12351)
- feat(service): support standard user follow/unfollow logic (#12344)
- fix(core): deprecate max memory limit for event-hub (#12348)
- chore: add docs for blocklet sdk for browsers (#12345)
- feat(service): support show user sessions from member sites on master site (#12343)
- chore: add docs for blocklet server node.js sdk (#12339)
- chore: add docs for blocklet and server cli (#12335)
- fix(core): force use blocklet mem limit in event hub process (#12340)
- feat(core): allow admin to upgrade blocklet for serverless apps (#12341)
- fix(ux): blocklet disk info empty and backup calendar styling (#12338)
- fix(ux): theming and wording for traffic api (#12333)
- chore: add docs for blocklet spec and blocklet meta (#12331)
- chore(cli): deprecate blocklet server rescue command (#12337)
- chore: add docs for eventbus and server environments
- fix(core): blocklet start failed when server run in dev mode (#12330)
- fix: bump deps to make log viewer work
- fix(core): blocklet service crash on start during load test
- fix(ux): make blocklet status filter and start page responsive (#12328)
- fix(core): environments maybe empty for preInstall hooks (#12329)
- chore: ensure all deps are latest
- fix(router): try start nginx when reload errored (#12324)
- chore: bump ux and aigne deps to latest (#12326)
- fix(ci): make unit test for blocklet resolver more stable (#12322)
- fix(cli): incorrect target and mount point for blocklet deploy (#12325)
- fix(service): incorrect walletOS for oauth login (#12323)
- feat(core): support graceful reload server daemon and service (#12313)
- fix(core): skip access verify for aigne-hub connection ops (#12320)
- chore: enable codesmith detail review
- chore: use aigne codesmith as reviewer
- feat(ux): tune credit display for self-hosted aigne connection (#12310)
- feat(sdk): support private navigation in blocklet.yml (#12309)
- feat(cli): rename migrate command and make it more stable (#12306)
- fix(cli): unable to login with owner for e2e tests (#12314)
- fix(webapp): fix base value (#12311)
- feat(ux): add spinner when waiting for page loading (#12303)
- fix(ux): permission and DID Space integration for blocklet onboarding (#12305)
- chore: update aigne hub authorization copy (#12300)
- fix(service): avoid federated-enabled site auto open login (#12292)
- feat(ux): only show wallet connect tip when owner only has email (#12298)
- fix(ux): app logo display and passport expire time tip (#12299)
- fix(ux): ucenter sidebar and aigne hub connection component (#12296)
- feat(service): support customisable unsubscribe button for emails (#12297)
- fix(ci): make unit tests more stable (#12291)
- feat(ux): tune styling and wording for onboarding wizard (#12293)
- feat(ux): support onboarding workflow for new blocklets (#12277)
- fix(api): ucenter nft query param and error message on invalid gql (#12276)

## 1.16.48 (August 08, 2025)

- fix(sdk): blacklist check breaks unauthenticated visits (#12272)

## 1.16.47 (August 07, 2025)

- fix(core): enhance did document update retry logic (#12268)
- fix(core): resolve blocklet start failures during server restart (#12265)
- fix(core): do not throw when create notifications with empty receiver
- chore: ignore invalid referer error log (#12264)
- feat(core): show aigne config on component add (#12257)
- fix(core): can not start server on node.js v21.6 (#12251)
- fix(security): ensure ssrf protection for user input urls (#12262)
- chore: rename @arcblock/did-auth to @arcblock/did-connect-js (#12259)
- fix(auth): polish bind-wallet check logic (#12258)
- feat(cli): support bun trusted deps for compact bundle (#12256)
- feat(service): show success tip and use user role for access key auth (#12254)
- feat(test): run e2e tests on build for reliability (#12187)
- fix(ux): blocklet studio page crashed (#12252)
- fix(core): incorrect scope validation when adding stores
- fix(blocklet): first visit throws in static server (#12248)
- fix(router): disable more rules caused discussions add failure #12184
- feat(ux): tune aigne hub connection layout and wording (#12192)
- fix(router): disable more rules caused aigne hub api failure #12189
- feat(api): support database and router providers in server info (#12185)
- fix(service): token blacklist ttl and passport expiration setting (#12186)
- fix(ux): incorrect time axis for blocklet runtime info chart (#12183)
- fix: enforce guest permission check when deleting access key (#12182)
- feat(service): tune blocklet service page title and 503 status page (#12169)
- fix(core): add backoff retry to workaround sqlite busy errors (#12180)
- fix(core): app does not exist after restore succeed (#12179)
- feat(service): more secure proxy and aigne hub connection display (#12160)
- fix(core): strip componentDid field from default security rule updates (#12178)
- fix(service): should throw error on invalid oauth userinfo (#12173)
- fix(core): file system isolation mode is broken in v22.4.0 (#12172)
- feat(sdk): node-sdk get-blocklet use cache (#12170)
- fix(core): bigint time change to number, postgres get users use nulls last (#12171)
- feat(service): support oauth twitter login (#12166)
- fix(service): ensure correct role for various access key workflows (#12156)
- fix(ux): should lint to store for self-host aigne-hub tip (#12155)
- feat(service): tune aigne hub connection ux and locales (#12147)
- fix(core): dns match check by blocklet is not working (#12152)
- chore(ux): tune user center and federated login settings (#12153)
- fix(core): should not clean blocklet bundle from local disk once uploaded (#12151)
- fix(security): ensure access key permission limited to creator (#12149)
- fix(api): add integer validation for pagination params (#12137)
- feat(service): support account switch on access key auth (#12146)
- fix(ci): e2e use docker and nodejs runtime (#12120)
- fix(core): use blocklet json when check domain resolution (#12133)
- feat(ux): tune aigne config page and NFT mobile display (#12132)
- fix(security): ensure access key permission limited to creator (#12149)
- fix(api): add integer validation for pagination params (#12137)
- feat(service): support account switch on access key auth (#12146)
- fix(ci): e2e use docker and nodejs runtime (#12120)
- fix(core): use blocklet json when check domain resolution (#12133)
- feat(ux): tune aigne config page and NFT mobile display (#12132)
- fix(service): ensure restful naming for simple access key endpoints
- fix(core): incorrect snapshot hash used when reload on install (#12127)
- fix(core): use both A and CNAME record when check domain resolution (#12128)
- feat(service): support config aigne for AI integration (#12095)
- fix(core): better lost-passport & blocklet sdk performance (#12125)
- fix(core): use both A and CNAME record when check domain resolution (#12126)
- fix(service): throw 400 instead of 500 when image corrupted
- fix(core): increase pg max conns and decrease sequelize pool size (#12124)
- chore(deps): upgrade pm2 and related module to 6.x (#12121)
- fix(ux): incorrect notification text color in dark mode (#12122)
- fix(core): only use docker install deps when docker enabled (#12118)
- fix(service): launcher auto login sometimes not working
- fix(cli): ignore too long field values when migrate to postgres (#12112)
- chore: deprecate lodash.get by using chained operator
- fix(service): add logger statement to debug launcher login issue
- fix(router): disable more rules caused launcher failure
- fix(core): postgres migration failure caused by field length (#12110)
- fix(router): consistent port use in nginx server blocks (#12107)
- feat(core): add retry and logging for bun install, e2e support docker (#12097)
- fix(cli): blocklet deploy broken when delete access key (#12106)
- fix(core): should not access server cache database from blocklet (#12085)
- fix(webapp): fix navigation parse section array (#12100)
- fix(core): use retry as workaround for sqlite database busy (#12091)
- feat(core): support backup and restore blocklet in postgres (#12088)
- fix(deps): move jwt-decode to dependencies (#12082)
- fix(api): access key page error in server dashboard (#12080)
- fix(cli): deploy error with bun node_module lock (#12078)
- fix(security): support revoke of login and refresh token (#12079)
- feat(service): support access key and mcp server for all users (#12071)
- fix(core): only use bun install for blocklet bundled in compact mode (#12069)
- fix(core): blocklet start and upgrade error in docker environment (#12066) (#12068)
- fix(core): should log process not found error on blocklet runtime
- fix(service): image service should return 400 on invalid image
- feat(core): use bun to manage blocklet deps on bundle/install/upgrade (#12060)

## 1.16.46 (July 10, 2025)

- chore(deps): update all deps to latest (#12053)
- fix(core): did connect crash due to sqlite path is missing (#12049)
- fix(service): image service should handle legacy urls properly
- fix(service): image service should return 400 on invalid params
- fix(security): ensure rate-limit works with concurrency requests (#12048)
- feat(api): do not allow update avatar through user info api (#12047)
- chore: bump deps and theme editor to latest (#12044)
- fix(core): server.upgradeSessionId too short for postgres (#12043)
- feat(security): enforce mfa when delete personal account (#12042)
- fix(api): user search should be case insensitive (#12041)
- fix(sdk): should emit envUpdate when theme changed #12035
- fix(router): ensure dockerfile js request does not trigger waf
- chore(deps): upgrade react/mui/vite and deps (#12037)
- fix(core): change webhook_attempt status field to string (#12034)
- fix(cli): sqlite to postgres migration compatibility issues (#12036)
- chore(deps): update coreruleset for modsecurity to v4.16.0
- feat(core): support use postgres as database engine (#11888)
- fix(service): cors error when request user session api (#12030)

## 1.16.45 (July 03, 2025)

- chore: improve error message when no blocklet process info
- feat(perf): make user update api async within site group (#11999)
- fix(service): cors and wallet bind issues for user login apis (#11945)
- feat(core): support disable did document update by env
- fix(service): ensure uniq rate limiter prefix for different email api (#11943)
- fix(service): can not create webhook when openevent.json can not load
- fix(core): enhance dark mode support and upgraded theme editor (#11932)
- fix(core): should not disable autocheckpoint for sqlite wal (#11929)
- fix(core): redirect to launcher when launch session already consumed
- feat(service): add rate limit for email login api (#11925)
- fix(core): database locked error for sqlite cache db (#11923)
- fix(sdk): do not crash when log undefined data #11889
- fix(core): catch validation error when insert runtime data #11921
- fix(dx): incorrect blocklet runtime metrics in docker mode (#11920)
- fix(cli): support h1~h4 headings in changelog when bundle blocklet (#11922)
- fix(sdk): improve IP extraction from request for rate limit (#11918)
- feat(core): support instant install/start from blocklet launcher (#11914)
- feat(service): support rate limit for email sending api (#11913)
- feat(service): adapt to new theme editor (#11912)
- feat(core): disable navigation for uploaded blocklets (#11910)
- fix(router): default server routing is broken (#11909)
- feat(router): add ip whitelist support for gateway (#11907)
- feat(router): support domain blacklist and conditional whitelist (#11893)
- feat(core): remove store restriction when install blocklet on serverless (#11905)
- feat(core): support add component by uploading (#11892)
- fix(router): more strict size limit for upload and post body
- fix(ux): incorrect access key demo code in server dashboard (#11898)
- feat(router): disable default server & ip server and support switch with config (#11890)
- fix(ux): prefer blocklet appUrl when generate invite links (#11883)
- fix(service): throw 400 instead of 500 when proxy resource fail
- fix(core): add blocklet backup and rollback on blocklet upgrade (#11886)
- fix(ux): should use shell for access key usage code block (#11885)
- feat(api): force fake disk info for serverless servers
- fix(service): should check socket writable before write on timeout #11881
- feat(core): support both wallet and passkey for blocklet launch (#11855)
- feat(perf): support fake server level disk info
- feat(core): support clear db cache when clear server level cache (#11879)
- feat(api): allow mutate internal blocklets in serverless mode
- fix(core): enhance dark mode support and reduce theme payload (#11869)
- fix(service): federated login failed for invite-only sites (#11876)
- fix(core): blocklet level waf switch is not working (#11877)
- feat(core): send alert when user ip is blocked
- fix(api): use running for healthy to ensure consistency
- feat(api): include routing status in health api #11872
- fix(service): disable db cache for email sending transports (#11871)
- fix(core): disable cache for dns check results (#11870)
- fix(core): should ignore shared for blocklet preferences
- fix(core): always redirect to setup page on blocklet launch (#11863)
- feat(service): support blocklet level session hardening (#11851)
- fix(core): use longer ttl for disk info cache
- chore(deps): bump deps for better web performance (#11860)
- fix(ux): update branding logo title and description text (#11850)
- fix(ux): page crash when trusted issuer has did prefix (#11859)
- fix(cli): try clean docker more times when force stop server (#11857)
- feat(core): send alert when user ip is blocked
- fix(api): use running for healthy to ensure consistency
- feat(api): include routing status in health api #11872
- fix(service): disable db cache for email sending transports (#11871)
- fix(core): disable cache for dns check results (#11870)
- fix(core): should ignore shared for blocklet preferences
- fix(core): always redirect to setup page on blocklet launch (#11863)
- feat(service): support blocklet level session hardening (#11851)
- fix(core): use longer ttl for disk info cache
- chore(deps): bump deps for better web performance (#11860)
- fix(ux): update branding logo title and description text (#11850)
- fix(ux): page crash when trusted issuer has did prefix (#11859)
- fix(cli): try clean docker more times when force stop server (#11857)
- fix(ui): update subscription resume alert styling (#11853)
- fix(cli): tune sqlite db-cache path and db-cache usage (#11854)
- fix(cli): server and blocklet command broken by db-cache
- fix(ux): support dark mode for server setup page (#11848)
- fix(cli): db cache breaks blocklet dev and deploy (#11847)
- fix(ux): incorrect text for blocklet restart dialog (#11846)
- fix(core): change cache db path to avoid conflict with legacy files (#11845)
- feat(core): use db cache replace memory cache (#11827)
- refactor(core): move cert issuance to async to avoid blocking (#11843)
- fix(ux): add skeleton for overview metrics before data loaded (#11838)

## 1.16.44 (May 10, 2025)

- feat(studio): include branding and navigation images for pack blocklets (#11825)
- fix(service): access key connect broken for federated sites (#11826)
- fix(core): webhook attempt broken due to none null fields (#11823)
- feat(service): show usage instructions for simple access key (#11822)
- feat(service): better did spaces auth & did names auth flow (#11782)
- feat(service): support retry webhook attempt for debuggability (#11819)
- fix(api): can not authenticate with server level access key (#11820)
- fix(service): ensure user inputs are sanitized and escaped (#11779)
- fix(studio): incorrect release download and create link (#11785)
- fix(service): disable og.html in production for security
- feat(sdk): support customize signedToken key for session middleware
- feat(core): use valid custom domain when possible on launch (#11771)
- fix(ux): prevent white flash on first load caused by theming (#11767)
- fix(studio): resource upload broken when creating blocklet (#11775)
- fix(ux): tabbar preview are blocked on unofficial domains (#11770)
- fix(ux): show owner for webhook/oauth/accessKey list (#11766)
- fix(sdk): prevent white flash on first load caused by theming (#11758)
- fix(api): should skip mfa when auth with access key
- fix(service): support customize oauth client secret expiration (#11762)
- fix(api): verify access not working when session hardening disabled (#11754)
- fix(api): should auth blocklet service gql with access key
- feat(core): support blocklet level switch for web application firewall (#11750)
- feat(docker): disable swap for blocklet running with docker (#11756)
- fix(docker): cleanup docker network on blocklet remove (#11751)
- feat(service): skip kyc check when auth with access key (#11747)
- fix(ux): tune dark styling and consistent tabbar navigation (#11745)
- fix(core): deprecate docker volume validation in blocklet.yml (#11742)
- fix(core): running check not working when too many blocklets (#11739)
- fix(ux): add doc link for mcp client integration (#11734)
- feat(ux): tune payment and status handling for serverless blocklets (#11737)
- fix(docker): handle errors properly when access lock files (#11735)
- fix(ux): tune dark mode for launch workflow and app logo (#11730)
- feat(docker): support copy volumes from docker container (#11726)
- fix(core): ensure running no work as expected (#11733)
- fix(service): inconsistent unread notification count (#11728)
- chore(deps): remove useless deps rewire (#11732)
- fix(service): better new login notification & better protectGQL logic (#11731)
- fix(service): display proper error when oauth client not found (#11729)
- feat(ux): unify ux for runtime and traffic charts (#11727)
- fix(service): i18n not working for default dashboard navigation (#11724)
- fix(cli): wait for at most 5 minutes when starting server
- fix(router): disable more rules caused preference failure #11718
- fix(core): domain configure not working for launch workflow (#11722)
- feat(service): support dedicated mcp servers page (#11709)
- feat(service): update theme builder to latest (#11719)
- feat(core): support attach existing domain to blocklet (#11713)
- fix(ux): tune launcher redirect and animation (#11715)
- fix(ux): launcher url lost during launch workflow (#11711)
- feat(studio): polish ux for docker and static blocklets (#11710)
- fix(ux): tune server dark mode and service responsiveness (#11698)
- feat(ux): add apps link when launch from launcher service (#11708)
- feat(core): support offline status for user-sessions (#11704)
- fix(ux): ensure consistent locale for doc links (#11707)
- fix(router): disable more rules caused aikit api failure
- feat(ux): add i18n for domain details tooltip (#11705)
- feat(service): support passthrough message for push kit (#11703)
- feat: tune launcher redirect and notification passport (#11688)
- fix(api): bust blockletJs cache when request from sdk #11694
- feat(ci): more user friendly blocklet component error handling (#11700)
- fix(sdk): add timeout for component call options #11690
- fix(docker): blocklet start failed after docker desktop closed (#11696)
- fix(ux): only check domain status after socket connected (#11692)
- feat(api): add strict validation for theme object (#11697)
- fix(cli): update target param description for server cleanup command
- fix(service): can not update theme using access key
- feat(perf): disable diff by default for blocklet deploy (#11691)
- feat(ux): webhooks/accessKeys/oauth add the simple instructions (#11685)
- fix(service): crash when get trusted domains
- feat(ux): support dark mode for server dashboard (#11680)
- fix(core): launch by oauth session is broken
- chore(service): shared-bridge page support in dev mode (#11672)
- fix(service): should use appUrl when create links in notification (#11670)
- feat(dx): respect environment when handling SLP domains (#11671)
- feat(ux): polish time display for all detail pages (#11669)
- chore: update pull request check list for theming and security

## 1.16.43 (April 30, 2025)

- fix(ux): unify the table action ux for oauth and access keys (#11666)
- feat(service): support custom signature for email notifications (#11663)
- feat(service): light and dark theme should share none color config (#11664)
- feat(service): support manage oauth apps from dashboard (#11658)
- fix(service): unread-count api should always sign response (#11662)
- fix(studio): ensure web interface for docker blocklets by default (#11659)
- fix(ux): store ux and date error in safari (#11656)
- feat(service): rendering activity in notification email (#11649)
- fix(service): skip visitorId check for requests from aistro (#11653)
- fix(perf): use raw sql to make notification pagination faster (#11651)
- fix(ux): tabbar navigation config page crashes when editing (#11650)
- fix(ux): always show all tabs when blocklet in progress status (#11648)
- feat(core): isolate blocklet source code from different sources (#11635)
- fix(service): throw 400 instead of 500 during referrer checking (#11646)
- fix(api): backup record query breaks in different timezones (#11645)
- fix(core): auto login is broken during launch workflow (#11639)
- fix(core): should not block public/private ip from self
- fix(core): error log parser when check for old entries
- chore(service): polish oauth authorize style (#11631)
- feat(cli): support cleanup server blacklist from cli
- fix(router): disable security rule caused local redirect failure
- fix(router): disable more rules caused oauth login failure
- fix(router): disable more rules caused pages-kit preload failure
- chore: tune activity notification and support dark mode
- fix(docker): wrap dockerfile change uid and gid need ignore existed
- fix(service): ensure correct passport title from trusted issuers
- fix(router): rate limit disable not work as expected
- feat(cli): support force stop blocklet as devops fallback
- feat(cli): support `blocklet component` for pages-kit studio
- fix(docker): non-root docker uid and more reliable health check
- fix(ux): only cache service/admin pages in service-worker
- fix(api): tune user-session and get-notifications performance
- fix(ux): polish blocklet service pages for dark mode
- fix: show passport title on passport page
- fix(ux): tune ellipses and progress display for launch workflow
- fix(service): bridge page for federated login should be public
- feat(cli): support adding store to blocklet from cli
- fix(router): disable more rules caused discuss-kit bookmark failure
- fix(router): disable more rules caused disk usage explosion
- feat(service): support dark mode for blocklet theming
- feat(ux): make kyc email responsive on mobile devices
- fix(router): disable security rule caused disk usage explosion
- feat(ux): better waiting progress during blocklet launch
- fix(router): disable security rule caused payment webhook failure
- feat(router): support dynamic blocking for rate limiting voilation
- fix(router): disable security rule caused pages-kit data source failure
- feat(service): support unassign and target author for notification
- feat(service): add shared-bridge for better federated login
- fix(core): Safe access for cert status and disable cron runOnInit
- fix(ux): tune padding for header/blocklet setup and save button
- feat(router): add nginx status api in internal server
- fix(service): unrecorded and undefined values in audit log
- feat(router): support global and ip+method rate limiting
- feat(service): support openid endpoints for oauth service
- fix(core): check dns before cert generation when adding domain
- fix(sdk): should include req.path in fallback cache key
- fix(sdk): should include req.path in fallback cache key
- fix(router): listen http2 deprecated warning in newer nginx
- fix(ux): polish domain purchase and binding during launch workflow
- fix(service): better description for different access key auth types
- fix(perf): ensure cache for blocklet and server data query
- fix(sdk): support verify access key in session middleware
- fix(ux): tune blocklet launcher and domain manage ux
- fix(api): passport claim failure with passkey
- fix(studio): can not create release with uploaded zip file
- fix(ux): access-key detail crash and more detail info
- fix(service): tune oauth and mcp permission for database ready
- feat(core): support authenticate by simple access key
- fix(service): refresh token broken for oauth server
- feat(service): support streamable stateless mcp server
- fix(service): notification pagination error and more log
- fix(node-sdk): refreshSession should pass refreshToken in headers
- fix(ux): tabbar sorting not working
- fix(service): omit undefined value when create device data
- feat(studio): support connect and deploy to blocklets
- fix(core): correct role type when request with blocklet access key
- fix(core): ensure no mount point conflict on install component
- fix(service): skip visitorId check with BlockletSDK call
- feat(service): add link for disk usage alert notification
- feat(launcher): support direct payment for pass due applications
- fix(router): disable security rule caused oauth confirm failure
- fix(router): disable security rule caused did-profile share failure
- feat(core): unify blocklet theme configuration
- feat(auth): support member login with master passkey
- fix(service): request failure on redirect for notification pages
- fix(service): purse master user-session when logout from member
- fix(core): skip blocklet healthy check when server is busy
- fix(ux): tune wording and uploader param for blocklet branding
- feat(ux): use user-card component and reduce user profile redundancy
- fix(service): new user-session should send email by default
- fix(ux): better responsiveness when adding or removing domain
- feat(service): send notification when user login with new device
- feat(service): support all blocklet passports for access key
- chore: remove fake error endpoints from service
- feat(ux): show blocklet title and status on dashboard header
- fix(core): make server start more stable with timeout and job tuning
- fix(router): disable security rule caused didnames connect failure

## 1.16.42 (April 15, 2025)

- fix(api): always insert latest blocklet service navigation #11487
- feat(ux): support access-key detail and tune access-key list (#11490)
- feat(ux): tune table styling and user card in notification list (#11488)
- fix(ux): theme builder using service themes (#11491)
- fix(service): oauth login broken with guest passport (#11489)
- fix(ux): use predefined immutable theme for blocklet service (#11486)
- feat(service): support blocklet level and expirable access keys (#11311)
- fix(core): tune running check for false positive (#11485)
- fix(ci): ensure server start job fails on pnpm v9 (#11483)
- fix(service): oauth service breaks when waf is enabled
- fix(api): failed to get theme for migrated blocklets (#11481)
- fix(ux): optimize the pagination behavior in notification list (#11480)
- fix(studio): disable image editor by default and set correct language (#11478)
- fix(core): monitor notification sending and server unread count (#11475)
- fix(router): reduce proxy buffer settings for memory usage
- feat: support oauth and database mcp service (#11465)
- fix(router): disable proxy_request_buffering to reduce memory/disk usage
- fix(ux): update notification via socket instead of pooling (#11472)
- fix(ux): blank service page caused by service worker policy (#11474)
- feat(service): support pagination for user sessions (#11469)
- fix(ux): navigation tabbar editing experience issues (#11466)
- fix(core): team state should be responsive in blocklet service (#11470)
- fix(service): allow loading font from data schema
- fix(ux): pagination state not persistent for members page (#11468)
- fix(sdk): ignore blocklet theming field for compatibility
- fix(deps): @blocklet/payment-react should be devDeps
- fix(sdk): disable cache for fallback middleware
- feat(ux): tune settings ux for blocklet service pages (#11437)
- feat: add get unread notification count api (#11461)
- fix(sdk): resolve the bug of getResources missing item (#11463)
- fix(studio): change log display exception in store (#11456)
- chore(service): add debug in login process (#11457)
- fix: incorrect incremental data in backup statistics (#11453)
- fix(core): user updates from sdk should also be synced (#11450)
- feat(service): support destroy user by himself (#11445)
- feat(ux): only toast for system notifications (#11438)
- feat(perf): tune cache for blocklet.js and user session (#11417)
- chore: bump deps and tune blocklet sdk
- fix(api): error during passport recover workflow (#11431)
- fix(core): delete blocklet failed on permission check
- fix: tune overview link url (#11427)
- fix(ux): tune overview link url and format number (#11426)
- chore: bump deps to latest
- feat(service): support preview for tabbar navigation (#11423)
- fix(ux): tune blocklet overview and preference dialog (#11422)
- fix(ux): pagination issue for notification list (#11419)
- chore: update reviewer config [skip ci]
- chore: update reviewer config
- fix(cli): support any entry path and deps depth for compact bundle (#11416)
- chore: tune blocklet service navigation items
- chore: tune aigne reviewer rules
- chore(service): add device-client-name in user.extra (#11413)
- feat(service): support auto cleanup for expired notifications (#11411)
- feat(service): refactor and reorganize service pages (#11402)
- feat(perf): only load blocklet runtime info when needed (#11410)
- feat(cli): support forceIntranet mode for blocklet server status #10926
- fix(ux): user query failure caused notification crash (#11406)
- fix(core): tune memory consumption for deep clone (#11405)
- fix(ux): add loading when wait for theme builder (#11403)
- fix(service): support accept invite with just email (#11370)
- fix(core): incorrect version used when filter migration scripts (#11366)
- feat(service): polish notification ui and permission check (#11359)
- fix(perf): migration takes too long when upgrading components (#11363)
- fix(perf): use cache to speed up blocklet update checking (#11361)

## 1.16.41 (March 16, 2025)

- fix(dx): unit test error for runtime monitor
- fix(service): do not allow new email login for invited only sites
- feat(service): support user login with email
- fix(perf): add cache for fallback blocklet middleware
- fix(ux): notification filter display and popup layout
- fix(service): font setting issue in theme builder
- feat(dx): improve user experience for blocklet dev
- fix(dx): api test failure for server dashboard
- fix(core): launch docker check and base docker image
- fix(service): paw policy caused unexpected page refresh
- fix(ux): tune wording and avatar for passport pages
- fix(core): theme builder not working in blocklet service production
- fix(core): server daemon can not start with theme builder
- fix(dx): use github action as author for aigne review
- feat(service): support passport list/detail/logs
- fix(ux): should open link upon notification click
- chore: tune wording for the launcher workflow
- feat(service): support sync user profile for group sites
- feat(service): aggregate mcp servers for capable blocklets
- fix(router): disable security rule caused discuss-kit asset failure
- feat(service): support app level theming config and apply
- feat(sdk): support update user info via sdk
- feat(ux): tune ux for embed blocklet store
- feat(service): enhance message filtering and add activity field
- fix(core): start lock should include version and group
- fix(ux): polish pwa policy for blocklet service
- fix(api): sitemap.xml for public and pageGroup components
- feat(ux): rebranding did domain to did names
- fix(service): remove useless security-rule in url check
- feat(ux): highlight backup heatmap in yellow after failure
- fix(dx): blocklet exec error and release note parsing
- feat(ux): use heatmap to display backup history
- fix(sdk): autoConnect can use "false" or false
- feat(ux): support connect domain with passkey and social accounts
- feat(core): send warring when fake running detected
- fix(node-sdk): push status change message to sourceToken channel
- fix(ux): page crash when navigate from runtime charts
- chore: use self hosted version of coderabbitai
- feat(service): support email sending with launcher api
- feat(sdk): support update use address with blocklet sdk
- feat(service): support banner template in open graph
- fix(service): links to blocklet server broken in notifications
- feat(service): tune arcsphere tabbar navigation config ux
- feat(dx): support mock did domains for testing purpose
- fix(core): blocklet stuck in starting after transfer ownership
- feat(dx): support runtime charts for components
- feat(core): support launch blocklet without wallet from launcher
- fix(docker): ignore permission mode in docker node
- fix(sdk): should throw error on invalid getFederatedMasterAppInfo
- feat(service): support address field for user profile
- fix(docker): cleanup chmod related on start and lifecycle
- fix(core): vault verify not working for migrated blocklets
- fix(service): should sync within federated for revoked members
- fix(core): vault config not working for migrated blocklets
- fix(core): config vault breaks due to permission in production
- fix(service): nft display from domains.didlabs.org is broken
- fix(service): support hide did-wallet in connect page
- fix(service): quick login switch failure by cors

## 1.16.40 (February 25, 2025)

- feat(security): use multisig to secure vault change (#11228)
- fix(cli): should not abort on SIGINT when dev and start #11226
- fix(service): video embeding breaks blocklet studio #11195
- feat(ux): auto start new components and validate branding images (#11180)
- fix(router): disable security rule caused did-space backup failure
- feat(docker): only chown for docker blocklets data dir (#11219)
- feat(profile): provide profile embed page (#11216)
- fix(docker): always rm container before docker run (#11218)
- fix(ui): unify the blocklet service header style (#11215)
- fix(docker): reduce startup failures (#11194)
- feat: add unread background and support countryIso2 (#11200)
- fix(locale): update all did-connect title & description (#11197)
- feat(ux): add agent log button to webhook detail (#11199)
- feat(core): support description for navigation items (#11186)
- fix(UI): show load more button for webhook logs (#11196)
- feat(core): support bypass reverse proxy by blocklet service (#11184)
- fix(core): backup retry not working as expected
- fix(ux): runtime page crash in blocklet service
- feat(service): support user metadata and ocap api proxy (#11169)
- feat(ux): more visually appealing runtime chart (#11174)
- fix(docker): ignore throw when same network (#11176)
- fix(ux): action icon alignment in domain sections (#11178)
- chore(ux): tune domain wording and component start prompt (#11165)
- fix(api): should not enable session hardenening for studio ops
- fix(service): csp policy breaks nft object display
- feat(core): do not start dev mode blocklets during recover (#11164)
- fix(core): skip consecutive check when ensure running (#11157)
- fix(ux): text wrap and overflow for overview and domain (#11159)
- fix(ux): use drawer to display webhook detail
- fix(dx): prefs builder and discuss-kit prefs form broken
- chore: better space connect/disconnect ux and consistent backup records (#11158)
- fix(dx): remove verbose log for get rbac
- fix(ux): can not create webhook from blocklet service
- fix(ux): incorrect teamDid used for webhook related apis
- fix(dx): possible studio crash on empty screenshots
- fix(core): ensure blocklet running not starting in server daemon (#11146)
- fix(service): include server config and blocklet domain in csp
- fix(ux): some ui issues during blocklet launch workflow (#11138)
- feat(core): support webhooks for blocklet events (#11131)
- feat(core): auto format top level domain with www prefix (#11133)
- feat(service): use new did connect page (#11142)
- fix(core): only set waiting for components with start engine (#11140)
- fix(perf): remove unnecessary db update and test notification (#11139)
- feat(perf): add indexes for notification service tables (#11136)
- fix(router): disable security rule caused ocap-gql failure
- fix(cli): make appPid required for blocklet exec (#11077)
- feat(core): ensure blocklet running during daemon start and alive (#11080)
- fix(studio): wait longer when creating resource from blocklets (#11130)
- fix(service): notification link and push channel broken (#11124)
- fix(router): disable security rule caused did-space failure
- fix(service): make notification more reliable and performant (#11058)
- fix(service): should allow iframe for official sites
- feat(sdk): support get passports when query users #11074
- fix(service): csp overlap check caused crash
- fix(docker): pnpm install allow require deep dependencies (#11075)
- fix(service): tune default csp policy for blocklet dashboard (#11069)
- feat(ux): show start tip when adding component (#11062)
- fix(core): remove memory limit on upgrade server from dashboard
- fix(service): launcher and uploader broken by csp policy #11065
- fix(service): federated login redirect broken by csp policy
- fix(service): federated login is broken by csp policy
- feat(service): ensure csp and cookie work in embed mode (#11060)
- fix(docker): blocklet path for same docker image (#11057)
- fix(router): disable security rule for wallet profile failure
- fix: cancel retrieval of passport chinese message (#11054)
- feat(service): support config and verify blocklet vaults (#11049)
- fix(ux): reset confirmation dialog after blocklet restart (#11050)
- feat(ux): add confirmation dialog for mount point changes (#11044)
- feat(ux): improve component installation flow with finish handling(#8320) (#11048)
- feat(ux): add confirm dialog for app did rotating (#11047)
- fix(studio): unexpected escape for blocklet release note (#11042)

## 1.16.39 (February 07, 2025)

- feat(ux): update unread message count via socket
- feat(ux): tune tab order for blocklet detail page
- feat(ux): show domain warning and tune domain wording
- fix(cli): include bufferutil as dependency when bundle blocklets
- fix(ux): url mapping adding dialog does not open
- feat(service): oauth apple support multi bundle-id
- feat(service): support eventbus for blocklet components
- fix(core): disable auto backup when server is starting
- fix(docker): make backup faster by tune chown scope
- fix(cli): incorrect logger param when check deps on dev
- chore: bump deps to reduce verbose logs
- fix(ux): unify header addons styling on all pages
- fix(cli): unexpected nginx config error when stop server
- fix(sdk): incorrect port when docker network isolation enabled
- fix(cli): tune start router check and skip force stop
- feat(ux): add time range selector for runtime history
- fix(service): should not crash on notification exception
- chore: update domain demo suggest
- feat(studio): support copy latest blocklet URL for latest version
- fix(ux): error when backup when auto-backup not enabled
- feat(studio): support copy latest blocklet URL for latest version
- feat(ui): tune domain description and remove did domain icon
- feat(service): auth websocket with login_token from cookie
- feat(util): allow dot in blocklet.yml#title
- fix(service): should validate jwt token before verify
- chore: update deps to fix did-space backup caused crash
- feat(ui): new domain and base info UI
- fix(router): nginx proxy cache is broken
- feat(service): grouping notification records using notification_id
- feat(docker): docker support cmd and optimize chmod dir logic
- chore(deps): bump ux to latest version
- fix(cli): support timeout when run blocklet server stop
- fix(core): enforce protection for more destructive operations
- fix(core): did connect auto open is broken
- feat(core): support interrupt blocklet backup to did-spaces
- fix(service): navigation config should enforce session hardening
- fix(core): ensure files are deleted completely
- fix(cli): rectify the problem where the real port was missed during connection creation
- feat(core): use queue for message notifications
- feat(cli): add blocklet dev install support
- fix(core): extend endpoint health with http checks
- fix(ui): optimize audit log avatar and reload
- fix(ux): error when config trusted passport issuer
- feat(service): support embed user center pages as iframe
- chore: polish studio dx and support did-space api service
- fix(service): notify arcsphere after login succeed
- fix(dx): skip passport check for new user in tests
- fix(docker): tune error handling and existence check
- fix(dx): skip local passport check for test blocklets
- fix(service): always update user profile when kyc enabled
- fix(router): disable security rule caused did profile failure
- feat(ux): support copy and redirect for error notification
- fix(studio): better resource loading and blocklet update time
- fix(ux): image render failed for notifications
- fix(cli): compact bundle error for nested dirs in file list
- fix(cli): should keep blocklet.yml#files for compact bundles
- fix(cli): blocklet.yml#files not included in compact bundle
- fix(router): disable security rule caused blocklet upload failure
- fix(ux): i18n for notification records
- feat(router): support rule based smart request block/unblock
- feat(ux): better audit log list and search support

## 1.16.38 (January 08, 2025)

- feat(core): deprecate blocklet start success notification
- fix(ux): notification popup and list issue in server dashboard
- fix(core): bugs in update domain alias
- feat(sdk): support customize logger for blocklet/sdk
- chore: deprecate declare tx when connect wallet to social
- fix(ux): remove extra notification filter option
- feat(app): integrate blocklet logger with static server
- feat(ux): polish notification history list and detail
- fix(api): should skip access verify for notification ops
- fix(logger): incorrect access log response time
- fix(router): disable security audit log when log level is 0
- fix(router): disable security rule causing did-space upload failure
- feat(router): refresh gateway blacklist automatically
- fix(router): disable security rule causing oauth callback failure
- fix(api): better audit log for updateGateway calls
- fix(router): disable security rule for app records failure
- fix(core): handle alias and slp domain on blocklet backup/restore
- fix(ux): undefined in uploader dialog for blocklet dashboard
- fix(router): disable security rule for remote deploy failure
- fix(router): should rotate security logs daily
- fix(api): use much longer timeout when downloading logs
- fix(ci): should inspect beta version after publish beta
- fix(router): disable security rule causing blocklet restore failure
- fix(router): disable security rule causing discuss-kit asset failure
- fix(api): lost passport not working due to i18n
- fix(api): should skip access verify for studio operations
- fix(api): better logging for service proxy errors
- fix(router): disable security rule caused federated login error
- chore(deps): upgrade deps
- fix(router): disable security rule caused did resolver error
- feat(core): support backup and restore migrated blocklets
- fix(router): disable security rule caused wallet backup failure
- feat(service): support notification sending record for admins
- fix(docker): permission issue when deploy with human readable name
- fix(router): disable security rule caused did-space connect failure
- feat(service): use dedicated path for server worker scripts
- fix(router): disable security rule caused launch failure
- feat(notification): skip access verify for notification
- fix(router): ensure size limit are integers for modsecurity
- feat(service): add notification unread state and count
- fix(docker): allow docker blocklet without web interface
- fix(router): tune modsecurity for broken team uploading
- chore(service): ignore ip when check session for wallet/arcsphere
- feat(cli): compressed bundle file with `--create-archive` and show the docker icon
- fix(router): use global body size limit for modsecurity
- fix(studio): should skip access verify for studio ops
- fix(router): modsecurity detection on linux not working
- feat(docker): auto generated passwords and launch support
- fix(sdk):fallback middleware should not cache index.html
- fix(router): tune modsecurity config and rules
- fix(core): repair docker file permission denied
- fix(cli): e2e test broken due to passport validation
- feat(security): support web application firewall in router
- fix(ci): nginx install failed for github actions
- fix(security): skip 5xx reports for websocket error with login token
- feat: make passkey work with safari and did-spaces
- fix(core): blocklet dev and configuration ux issues
- fix(service): notification socket channel and user link render
- feat: allow null value for lastPublishedAt
- feat(cli): support config environments for debug purpose
- fix(api): enforce passport check for removed user
- feat(service): support cache shared component in sw
- fix(service): add security check when login as new user
- fix(core): docker blocklet allow launch
- feat(service): tune default open graph image text styling
- fix(api): commit missing default og background image
- fix(ci): upgrade actions/upload-artifact@v4
- feat(service): support customize default open graph background
- fix(core): disable cache for session token when proxy to daemon
- fix(core): store signature verify should be async
- fix(core): should check docker image exist before exec owner
- feat(service): sw work with dynamic mountPoints
- feat(core): studio support create based docker blocklet
- fix(ui): broken notification action link for server dashboard
- fix(api): robots.txt should not throw 500

## 1.16.37 (December 21, 2024)

- fix(cli): blocklet dev fails when subcomponent name is did (#10693)
- fix(ux): notification sending to did-wallet broken (#10691)
- feat(api): persist passkey name in userInfo
- fix(core): use disk file lock when init team database (#10687)
- fix(security): disallow passkey register for protected teams (#10685)
- feat(ux): add label for notification component selector
- fix(service): switch passport broken for oauth
- feat: support using passkey for authentication (#10594)
- feat(ux): optimize the layout of mobile devices (#10682)
- fix(cli): blocklet dev fails when mountPoint is empty (#10681)
- fix(ux): blocklet dev and configuration ux issues (#10655)
- feat: polish notification ui and skip passthrough messages (#10674)
- fix(api): ensure blocklet cli terminates on SIGINT (#10665)
- fix(deps): @blocklet/env should be dependency for service
- fix(core): notification sent status not updated as expected (#10662)
- fix(api): ensure user locale valid for user session #10660
- feat(service): suport global service worker handling (#10657)
- fix(service): should not reuse socket connection across endpoints (#10659)
- feat(service): exclude components that do not send notifications (#10617)
- feat(sdk): add timing for blocklet component call
- chore: refactor and unify notification related apis (#10606)
- fix(service): fix cacheTtl error default value in common setting page (#10610)
- feat(ux): better notification preview and filter (#10593)
- fix(core): inviter link broken on base64 user avatar
- fix(navigation): resolve redirection failure issue (#10589)
- fix(service): fix service-worker register (#10585)
- fix(sdk): incorrect baseURL for getMyLoginSessions (#10580)
- chore(service): polish security and performance for notifications (#10577)
- feat(service): unified notification service for blocklets (#10391)

## 1.16.36 (December 21, 2024)

- fix(ci): blocklet cli readme update error

## 1.16.35 (December 19, 2024)

- feat(ux): support search by component did on blocklet list
- feat(ux): support search by partial did on blocklet list
- feat(ux): support search by partial did on member list
- feat(ux): support select/unselect all on upgrade dialog
- feat(ux): persist and restore server log viewer state
- fix(core): blocklet sdk broken when session salt rotated
- feat(ux): polish default 4xx/5xx pages
- feat(ux): polish page refresh on did-space connect/disconnect
- feat(studio): support pagination and search for blocklet list
- fix(studio): video missing when create pack blocklets

## 1.16.34 (November 13, 2024)

- fix(core): try speedup server daemon start time
- fix(api): should return owner for legacy apps #10558
- fix(webapp): upgrade server from dashboard breaks due to sudo #10551
- fix(service): fix oauth apple login missing state params (#10548)
- feat(sdk): set default retry to 3 for component call
- feat(sdk): support retry for component call (#10540)
- fix(core): polish dx for blocklet list and log viewer (#10532)
- feat(studio): send resources params to all component requests (#10537)
- refactor: extract video utils to shared module (#10531)
- chore: polish text for no passport and destroy verification (#10534)
- feat(studio): support input repository link in blocklet studio (#10533)
- feat(cli): support did only mode when create blocklet (#10529)
- chore(deps): bump lru-cache to latest version (#10527)
- fix(webapp): unable to register blocklet server on launcher (#10523)
- chore: add test case for the navigation item role inheritance (#10524)
- feat(security): support session hardening for graphql mutations (#10504)
- fix(meta): sub nav item does not inherit parent roles (#10518)
- feat(cli): support videos as blocklet branding in dev studio (#10509)
- fix(service): call arcSetToken after login in arcsphere (#10516)
- feat(service): support videos as blocklet branding in studio (#10512)
- fix(ux): tweak redirect-url check in "Dashboard" button (#10513)
- fix(core): docker-exec log to blocklet output or error files (#10494)
- feat(service): support seamless mode in login & connect page (#10508)
- feat(service): support config and serve bottom navigation (#10505)
- feat(cli): server stop -f stop docker container (#10501)
- fix(blocklet-service): correct DID Spaces link for suspended Blocklet action (#10499)
- fix(service): block unsafe url redirect (#10491)
- feat(ui): show icon for docker network isolation (#10495)
- feat(security): use signed response for session related api (#10487)
- feat(cli): prefer local server when create blocklet did (#10478)
- fix: parse-docker-endpoint compatible endpoint is empty (#10476)
- fix(service): error when login with oauth account (#10475)
- fix: repair pnpm store in custom docker image (#10473)
- fix(service): improve redirect security for kyc page (#10463)
- fix(security): ensure location.href & window.open use safe url (#10467)
- fix(core): permission issue by pnpm-stores for docker (#10464)
- fix(service): should throw 400 when open-graph param invalid
- fix(core): correct remote_addr and x_forwarded_for logging (#10460)
- feat(core): support global pnpm cache for docker (#10459)
- fix(core): federated approve is broken (#10457)
- feat(service): enhanced quick-login & better federated control (#10398)
- fix(core): should keep component-did when sort docker name (#10454)
- feat(studio): add type info for blocklet branding images (#10447)
- feat(core): use shorter container name and support restart all containers (#10439)
- fix(service): properly handle large images when generate open graph (#10440)
- feat(core): optimize the process for binding a DID Domain (#10435)
- feat(cli): unify blocklet title/description validation on init/create/launch (#10431)
- fix(core): polish error response code for daemon and service (#10436)
- feat(studio): blocklet studio add homepage support community (#10433)
- feat(router): support block requests by dynamic ip blacklist (#10432)
- feat(service): support config and server blocklet splash images (#10395)
- fix(core): add lock when create network and prune network (#10387)
- feat(core): support network isolation when run blocklets in docker (#10382)
- chore(deps): lock sharp to 0.32.4 for backward compatibility
- feat(sdk): support get trusted domains for blocklet (#10376)
- fix(service): disable quick login for security reasons (#10373)
- fix(service): security config crash and oauth login error (#10370)
- fix(core): file lock should not crash when lock dir not exist (#10372)
- fix(core): skip health api for 5xx monitor
- fix(core): duplicate container and permission issue when use docker (#10365)
- fix(core): backup error with docker (#10359)
- fix(core): make docker upgrade faster and cleanup docker-exec (#10353)
- fix(cli): server unable to start when managed by systemctl (#10350)
- fix(core): make 5xx monitor more reliable
- feat(cli): deprecate @abtnode/cli for @blocklet/cli (#10342)
- feat(core): support restore custom domain and URL mapping from did-space (#10338)
- fix(core): possible file descriptor leaks when handling streams (#10336)
- feat(router): monitor and alert 5xx requests in access log (#10337)
- fix(core): support custom docker cpu and memory for non-serverless (#10339)
- fix(core): respect timeout in blocklet.yml for docker operations (#10332)
- fix(core): blocklet dashboard support for did spaces top-level configuration (#10326)
- fix(service): helmet error should not crash service (#10329)
- feat(app): add screenshot for static server
- feat(security): enhance file isolation security for docker (#10325)
- feat(ux): enabled dashboard (#10318)
- fix(core): should parse docker name for docker exec chown (#10315)

## 1.16.33 (September 27, 2024)

- feat(ux): supports global did-spaces connection for app level storage (#10274)
- fix(service): incorrect logger call when verify-sig (#10280)
- fix(core): support ABT_NODE_ENABLE_IPV6 to avoid global override
- feat(ux): use dot instead of tag for blocklet status on runtime page (#10279)
- fix(sdk): component call sig verify breaks in session middleware (#10275)
- fix(cli): incorrect screenshot order in blocklet bundle (#10276)
- fix(ux): use 16:9 instead of 16:10 for blocklet studio (#10272)
- fix(cli): handle mismatch between image extension and actual file type (#10256)
- feat(core): add github code spaces support and docker image fix (#10257)
- fix(core): check endpoint should add port in check-url (#10254)
- fix(cli): tune validation rules for logo and screenshot validation (#10249)
- fix(api): only redirect to kyc page for get requests
- fix(core): set proper max cpu and memory for docker (#10245)
- fix(core): mount point already exist error on add component (#10241)
- chore(dx): add hot module reload support for arcblock/ux (#10240)
- fix(ci): test case failure for logo validation (#10244)
- fix(ux): disable crop button in branding image editor
- feat(cli): validate logo and screenshots for blocklet bundle (#10232)
- fix(core): failure to cancel automatic backup when subscription expires (#10238)
- fix(core): getIp cron work in service and always return valid value (#10234)
- fix(ux): error handling for developer studio
- feat(cli): support cleanup blocklet cache and backup config (#10237)
- fix(service): skip notification when sync user across site group (#10236)
- feat(ui): show docker or nodejs in runtime analytics (#10233) (5 days ago)
- fix(security): enforce origin whitelist for post-message on login (#10230)
- feat(ux): set correct blocklet installation sources (#10228)
- feat(sdk): unify logger timestamp for server and blocklets (#10225)
- fix(core): resolve some null object errors for docker (#10224)
- fix(cli): developer studio should be opened in https #10182
- feat(security): add audit-log for security module (#10222)
- fix(core): use blocklet access config when component config not defined (#10217)
- fix(ux): integrating DID Space Connect Components (#10180)
- fix(router): should always allow cors for redirect response (#10214)
- fix(sdk): component call sig should merge query params from url (#10208)
- fix(cli): bundle failure by race condition of logo and screenshot (#10207)
- feat(core): support runtime info for blocklets run in docker (#10205)
- fix(core): set correct permission for backup data in docker (#10184)
- feat(ux): ensure stable steps during component add (#10181)
- fix(api): sitemap.xml and robots.txt broken (#10176)
- fix(service): custom passport types should not be used for login (#10175)
- feat(service): support inviter for loginByWallet (#10171)
- fix(service): recover blockUnauthenticated relate logic (#10170)
- fix(sdk): owner email optional because not required by default (#10168)
- fix(service): inviter loss when doing kyc in wallet during login (#10167)
- fix(core): should update docker resource path dynamically (#10151)
- fix(sdk): component call break on query string sign/verify (#10154)
- fix(ci): service and daemon build fail on bundle size
- chore(deps): rename @did-space/client to @blocklet/did-space-js (#10159)
- feat(service): support remove user for test purpose (#10153)
- feat(ux): tune blocklet filter for log viewer and runtime display (#10135)
- feat(service): support update did space connection from profile (#10125)
- feat(service): support custom receive passport email (#10136)
- fix(core): more robust docker spawn handling with timeout and cleanup (#10142)
- fix(ux): branding page ux for blocklet developer studio (#10138)
- (origin/next, next) feat(ci): try exclude devDependencies from published packages
- feat(service): support check kyc status for signed request (#10132)
- feat(core): support start/stop blocklets in serverless (#10124)
- fix(core): goaccess log analyzer is broken for new log format (#10129)
- feat(service): add constraint for blocklet logo and screenshots (#10127)
- fix(service): typo and security cache key (#10122)
- fix(service): polish security access logic (#10119)
- fix(service): polish ui and ux for kyc workflow (#10120)
- feat(ux): show issuance date for passport (#10118)
- fix(ux): incorrect redirection url (#10112)
- feat(service): more granular security config for blocklets (#10058)
- feat(ux): enhance the accessibility of the input control (#10098)
- fix(core): certificate manager start failed due to ipv6 (#10096)
- fix(ux): using did-space-react component (#10095)
- feat(studio): add dom purify for markdown preview (#10092)
- fix(core): docker fail on upgrade and config sometimes (#10085)
- fix(ux): update blocklet/list to fix description truncate (#10060)
- fix(cli): should pretty print store url on blocklet connect #10053
- fix(core): permission when update resources in docker (#10063)
- feat(ux): make configuration inputs editable on click (#10054)
- fix(core): should not forceConnected when add domain (#10068)
- fix(core): secure config should not exist in blocklet.js (#10067)
- fix: login email throw error (#10057)
- feat(ux): add status filters and reduce rendering times (#10052)
- fix(core): change skip docker run error and mac-os can't find docker PATH (#10048)
- fix(service): incorrect loginFederated for master site (#10043)
- fix(core): docker chown ignore read-only files and repair delete blocklet EACCESS error (#10026)
- fix: install-external which pre-install and chown docker create files (#10024)
- fix(sdk): fault tolerance when getSharedConfigObj
- feat(ux): record the lasted URL entered when launch blocklet (#10008)
- fix(core): use the new space gateway address and display detailed space connection errors (#10018)
- fix(service): possible user email mismatch when do kyc during login
- fix(core): broadcast shared component config through app channel (#10007)
- fix(ux): the right-click on the terminal has no option to copy (#10006)
- fix(cli): check circular dependency on blocklet bundle/add (#10005)
- fix(service): should include provider when check email uniqueness (#10002)
- fix(core): error caused by migration script in docker logic (#10004)
- feat(core): support request id, upstream timing and user tracking in access log (#10001)
- fix(ux): update blocklet list dependency and ui (#9991)
- fix(core): skip docker exec for static and none running blocklets (#9996)
- chore: bump deps and fix federated logo display (#9992)
- feat(core): support run blocklet hooks in docker (#9959)
- fix(core): turn off auto backup when subscription expires (#9986)
- feat(ux): polish theme and support text selection (#9990)
- fix(service): switch passport failure caused by trustedIssues (#9988)
- chore(core): optimize certificate-related features (#9987)
- fix(ux): remove extra line breaks in log viewer (#9983)
- feat(ux): colorize logs for better readability (#9980)
- fix(service): better kyc sync/redirect/retry support (#9981)
- fix(core): update email kyc status base on social login info (#9977)
- fix(ux): kyc input cursor color and border mismatch (#9968)
- fix(core): "no such file or directory" error during backup (#9965)
- feat(cli): support externals for all bundle mode (#9964)
- fix(core): support proxy from environments for docker build
- fix(sdk): do not print debug log from config module
- feat(core): change default docker-image from alpine to debian (#9921)
- fix(service): sourceAppPid missing when add user during kyc (#9917)
- fix(core): remove syncFederated in audit log (#9910)
- fix(cli): ignore ncc cache for blocklet bundle (#9908)
- feat(core): support blocklet custom dockerfile (#9869)

## 1.16.32 (September 27, 2024)

- chore(deps): bump nodemailer to latest
- fix(api): ensure custom display to be valid image url #9877
- fix(ux): custom passport display render issue caused by cors #9874
- fix(ux): incorrect length check when enable/disable verify button #9875
- fix(ux): tune wording for project delete confirm tip
- feat(service): support custom passport display (#9863)
- fix(core): skip audit log backup for smaller memory footprint (#9864)
- fix(studio): can't create resource due to csrf and docker mode (#9861)
- fix(core): interrupted backups cannot resume (#9860)
- fix(core): make docker support more robust (#9854)
- feat(ux): support session manage on kyc page when connected (#9852)
- feat(sdk): support strict mode for session middleware (#9851)
- fix(service): incorrect email kyc status for google login (#9847)
- feat(service): support blocked user listing on team (#9849)
- fix(core): blocklet start failure caused by share dirs (#9848)
- fix(sdk): connect crash when sourceAppPid exist without federated (#9846)
- fix(api): output error message when collect did-space with nft (#9845)
- feat(ux): show unsupported blocklets from store with proper tip
- fix(service): disable cache for redirect to avoid cloudfront issues (#9836)
- feat: the beta version number follows the semver specification (#9835)
- fix(core): legacy static blocklet start error in docker (#9833)
- fix(service): should ignore case when check same email (#9829)
- feat(sdk): export getCSRFToken from js-sdk (#9827)
- fix(core): make shared directories readable in docker mode (#9825)
- fix(sdk): type and builder error caused by user.method
- feat(service): polish email kyc ux and security (#9820)
- feat(sdk): support auth by component call and signed tokens (#9821)
- fix(sdk): should always verify login token for blocklets (#9819)
- fix(sdk): do not overwrite baseURL when no componentDid specified (#9807)
- fix(service): crash on uncaught error when receiving blocklet (#9806)
- feat(sdk): add csrf middleware to enhance security (#9766)
- fix(service): login failure caused by kyc uniq and match check (#9803)
- fix(ui): disable store deleting on serverless mode (#9784)
- fix(core): skip some docker feature that caused staging failure (#9797)
- fix(service): user not found when do kyc on social account
- fix(ux): should always use wallet did when force connect
- feat(security): support email kyc in blocklet service (#9761)
- fix(service): ensure deterministic open-api-id across blocklets (#9794)
- fix(core): blocklet transfer ux and workflow (#9789)
- feat(dx): use tmux to run processes in separate windows for dev (#9788)
- feat(cli): blocklet cli add start and info docker status (#9787)
- fix(core): socket hang up error when install from pnpm or yarn (#9778)
- feat(core): support running blocklets in dock containers (#9764)
- fix(core): search-kit cannot start in isolation mode (#9753)

## 1.16.31 (August 24, 2024)

- fix(security): remove sensitive info from debug logging #9688
- fix(core): blocklet can not start after enabling the isolation mode with pnpm (#9706)
- feat(perf): add indexes for faster server/blocklet database access (#9703)
- feat(ux): add locale param when query launch session data (#9700)
- feat(service): prevent circular when save user referral (#9699)
- chore: disable blocklet routing editing on server dashboard (#9698)
- feat(core): support referral based growth service (#9693)
- fix(ux): did space NFT logo broken (#9689)
- fix(core): prevent sql injection by using sequelize replacements (#9685)
- fix(core): blocklet server break in node v22 lts version (#9684)
- feat(ci): add deps update check for each pr (#9680)
- fix(studio): loading ux for slow network conditions (#9673)
- chore(deps): update ux to latest to fix login issue (#9675)
- feat(core): keep blocklet and server audit log for 365 days

## 1.16.30 (August 03, 2024)

- fix(core): better security for (federated) login (#9664)
- fix(core): skip cleanup serverless apps protected with whitelist (#9670)
- fix(core): broken sitemap.xml and launcher layout (#9661)
- feat(cli): support print file system isolation info (#9659)
- fix(core): memory surge issue during backup (#9650)
- fix(core): validating routing rule failed when using non-80/443 ports (#9649)
- fix(core): add xss and helmet for server dashboard (#9648)
- fix(core): ignore removed optional components on upgrade (#9646)
- feat(service): support render logo as rounded for open-graph (#9637)
- fix(ux): use same validation schema for creating blocklet (#9633)
- fix(ux): space and blocklet name overflow (#9605)
- feat(ui): separating the responsibilities of server and service (#9593)
- fix(api): deprecate blocklet.js cache for consistency (#9599)
- fix(core): ensure valid ip format in getIp (#9598)
- feat(api): support session refresh token for blocklet server (#9597)
- fix(core): components list not synced on blocklet dev (#9594)
- feat(studio): consistent install and copy ux for each blocklet release (#9592)
- fix(service): ensure sender in test push-kit (#9585)
- fix(cli): duplicate default command args printed #9587
- fix(cli): webapp bundle should not result multiple chunks (#9590)
- fix(ux): fallback to did domain before accessibility check done (#9584)
- feat(cli): support start server in intranet only mode (ignore public ip) (#9583)
- fix(core): mkcert generated certificates can not be uploaded (#9578)
- fix(ux): allow member to switch store on builder playground #9577
- fix(core): incorrect reminder messages after serverless terminated (#9559)
- fix(ux): connected space overflow and duplicate error message (#9560)
- fix(core): user.phone is not persisted in database (#9564)
- feat(cli): suport --nosources-source-map for compact bundle mode (#9563)
- fix(studio): can not update project setting without title/description (#9561)
- fix(service): ensure consistent fullName in user session token (#9555)
- feat(ui): show passport description when create invitation or issue passport (#9553)
- feat(ui): support open user profile page from member detail (#9552)
- fix(dev): should auto expand tidle when use server data dir (#9548)
- fix(perf): lazy-load and cache blocklet disk info results (#9549)
- feat(service): support aggregate open embed specs (#9545)
- feat(cli): support update blocklet did document (#9546)
- feat(cli): print more server info for `blocklet server info` (#9544)
- fix(core): support custom cluster size with app environments (#9540)
- feat(cli): ensure only h2 headings are allowed in changelog.md (#9543)
- fix(core): cleaning terminated applications that exceed the reserved duration (#9523)

## 1.16.29 (June 22, 2024)

- fix(service): get correct clientIP while blocklet is behind CDN (#9479)
- fix(cli): use cli-table3 to print table (#9476)
- fix(cli): blocklet dev failed to install engine components
- feat(core): support customize blocklet hook/migration script timeout (#9473)
- feat(cli): ensure main field is directory for static blocklets (#9471)
- fix(ux): error thrown when auto check update (#9470)
- fix: replace window.open with a link for better navigation ux (#9460)
- fix(core): usage alarms not sending when there are multiple disks
- feat(cli): support add blocklet did in `blocklet add` (#9451)
- fix(studio): update uploaded use optimistic locking (#9443)
- feat(studio): support publish with components resolving to same store (#9439)
- fix(core): incorrect claimUrl when switch passport for server #9389
- fix(studio): resource relate components robust parse (#9429)
- fix(cli): better blocklet config and blocklet connect command (#9428)
- fix(cli): bundle failed when when links contain CJK characters in blocklet.md (#9424)
- fix(service): return 400 when request static assets that do not exist #9183
- fix(core): blocklet status should not be stopped after install #9196
- fix(router): rule matching not working for urls with query params #9426
- fix(router): too many redirect when open blocklet mount point #9401
- feat(studio): support resource relate components when init (#9419)
- chore: cleanup blocklet reload and component updated events (#9420)
- feat(core): support build docker image for developing blocklet (#9418)
- feat(core): docker related ci and dx issue (#9384)
- feat(studio): creating by upload should always be available (#9410)
- fix(studio): prevent download old release when creating release (#9409)
- fix(core): should not set blocklet to stopped in hooks (#9402)
- feat(service): support manual refresh profile from did spaces (#9383)
- fix(core): broken launch flow in the wallet browser (#9397)
- chore(perf): enable sqlite WAL mode for better performance (#9393)
- fix(ux): add component crash on evaluate step.body #9391
- fix(ux): ensure consistent storage page when connection absent (#9388)
- feat(service): make user createdAt info public (#9375)
- feat(ux): support copying domains on the domain list page (#9370)
- fix(core): ensure blocklet initialized when create from input #9347
- fix(core): ensure validation before save BLOCKLET_APP_URl #9371
- fix(core): can not launch pack and gateway blocklets #9369
- fix(core): set max cluster size to 1 by default #9344
- fix(ux): add hover effect for blocklet cell row #9366
- fix(dx): remove unhandled rejection warning log in daemon
- fix(core): error when add store mounted on relative path
- fix(queue): do not throw when cancel/restore non-exist job
- fix(dev): do not swallow error when validate vc presentation
- fix(studio): retain blocklet data on store reconnection after page reload in studio (#9355)
- fix(service): add x-did, x-path, x-method in openapi operation (#9357)
- feat(service): support openapi & opencomponent protocol (#9350)
- feat(ui): optimization studio upload toast (#9343)
- feat(cli): support test blocklet init/start/delete/reset (#9339)
- feat(service): support did profile with did wallet and did spaces (#9341)
- feat(studio): auto uploading to connected stores on release created (#9337)
- feat(cli): support `blocklet server rescue` to start blocklets in serverless pool (#9332)
- feat(cli): make blocklet environment update on server start optional for faster starting (#9333)
- fix(core): should check expiration before start required components (#9331)
- fix(studio): handle async window.open for iOS applications (#9328)
- fix(deps): bump uploader to fix zip recognize issue on windows
- fix(ux): app logo broken from store on relative path
- feat(studio): better developer info display and connection ux (#9325)
- fix(ux): crash caused by trustedFactory with did prefix
- feat(service): support auth with signature when update user settings (#9277)
- fix(dev): unable to open debugging mode in vscode (#9275)
- chore(core): refactor to obtain cloud platform runtime information (#9274)
- fix(ux): better tip display for isolation mode switch (#9236)
- feat(core): support get ip addresses in google cloud platform (#9266)
- fix(service): member invitation breaks for server and blocklet (#9263)
- fix(studio): original screenshots settings and test cases (#9261) (5 weeks ago)
- fix(cli): non standard ports not respected in studio and dev (#9260)
- fix(cli): blocklet dev not streaming logs to console (#9259)
- fix(core): ensure project dir exist for blocklet studio before start
- chore(service): enable user push notification by default (#9256) (5 weeks ago)
- fix(ux): launch button for gateway and pack blocklets
- fix(cli): can not connect to store mounted on relative path
- fix(cli): profile not respected in blocklet config list
- feat(studio): isolated store list in serverless and multi-tenant mode (#9248)
- feat(studio): set correct source when create/upload from studio (#9243)
- fix(ux): broken blocklet logo when store mounted on non-root path (#9249)
- fix(core): ensure no error thrown when create audit log #9244
- feat(core): support add store that are mounted on non-root path (#9237)
- fix(ux): remove wording of free blocklet usage on launch workflow (#9240)
- feat(core): allow guest create release in multiple tenant mode (#9239)
- fix(studio): optimize error display for uploaded resource (#9235)
- feat(service): support select app for invitation under federated login (#9233)
- feat(studio): support disconnect from connected stores (#9230)
- fix(core): should not sync status for blocklets with engine (#9229)
- feat(studio): support add/remove store when create blocklet (#9227)
- fix(ux): better studio and blocklet launch ux (#9225)
- fix(ui): repair custom dashboard navigation not working (#9210)
- fix(studio): should use static server from production store
- fix(app): better error message when visit static server directly

## 1.16.28 (June 12, 2024)

- fix(api): make sure appPk is set in blocklet.js (#9206)
- fix(core): ensure mount point exist when upgrade blocklets (#9205)
- feat(studio): support publish blocklet by uploading static resources (#9193)
- fix(studio): repair studio render issue when did is missing (#9200)
- fix(ui): clean up old navigation data from history items (#9191)
- fix(cli): ensure bundle dir exist when retry without clean (#9192)
- feat(api): add appPk and updatedAt in blocklet.js (#9190)
- feat(ux): always keep blocklet-service section on top of navigation (#9181)
- feat(ux): better navigation and component list in blocklet service (#9175)
- fix(security): file system isolation breaks cross-component read
- fix(studio): exporting resource failed because no permission
- fix(core): punycode warning and dev failure in isolation mode (#9176)
- fix(studio): should not encode params for withQuery (#9174)
- feat(studio): only keep latest resources when new releases (#9171)
- fix(security): file system isolation breaks blocklets with engine
- feat(service): support change locale and toggle push notification from ucenter (#9168)
- feat(security): ensure file system are isolated for blocklets (#9153)
- fix(core): stuck in starting state when adding blocklets (#9167)
- chore(cli): update auto-i18n with custom model support (#9166)
- fix(core): can not launch blocklets with engine from built-in store (#9163)
- fix(ui): broken logo when create resource from blocklet (#9152)
- feat(sdk): support sending to selected notification channel (#9150)
- fix(studio): reset blocklet group when export with engine (#9147)
- feat(ui): optimization blocklets and blocklet info dialog (#9144)
- feat(core): basic support for dynamic blocklet engine (#9139)
- feat(service): support send notification with push-kit (#9140)
- fix(ux): polish studio on mobile and notification actions (#9136)
- fix(service): ensure correct socket chanel for did connect events (#9134)
- chore: bump version to v1.16.27

## 1.16.27 (April 27, 2024)

- fix(ux): gracefully throw error messages from did spaces (#9130)
- fix(sdk): should set correct memberAppInfo for federated login (#9122)
- chore(deps): migrate webpack to vite for webapp (#9121)
- feat(ux): better project and release list for blocklet studio (#9119)
- fix(studio): should create blocklet did before update logo (#9116)
- fix(core): setting domain in launch blocklet workflow (#9115)
- fix(ui): broken help url in launch layout header (#9111)
- feat(studio): use stepper style assembly studio create form (#9110)
- fix(core): do not throw error on config blocklet with unknown env (#9108)
- fix(ux): use correct app name in blocklet notification (#9107)
- chore(ux): polish install blocklet style in dialog (mobile view) (#9105)
- fix(ux): display latest logo when launch blocklet (#9104)
- fix(ux): incorrect logo cached when add blocklet (#9103)
- fix(cli): incorrect x-powered-by header set on upgrade (#9102)
- fix(ux): better error message for revoked user on login (#9099)
- fix(studio): should isolate blocklet projects in single-tenant mode (#9098)
- fix(ux): better error message for revoked user on login
- fix(webapp): add-domain page crashed (#9091)
- chore(ux): polish blocklet studio in multi-tenant support (#9028)
- feat(ux): better did-domain input and nft filter workflow (#9025)
- fix(core): blocklet title should be updated on upgrade (#9029)
- chore(deps): bump glob to latest
- feat(service): support add-component without select step (#9023)
- chore(deps): bump fastq to latest
- fix(core): stuck in starting state when adding components (#9022)
- feat(ux): better blocklet studio integration outside dashboard (#9021)
- fix(ux): polish blocklet studio ux when integrated outside dashboard (#9016)
- fix(service): incorrect sourceAppPid on login page (#9008)
- feat(core): support multiple tenant mode in blocklet studio (#9000)
- chore(ux): polish install blocklet component ux (#9005)
- chore(service): unify user-sessions for quick-login and session-manager (#8995)
- feat(ux): use blocklet instead of component for consistency (#8990)
- chore: deprecate dependency on blocklets.json api from store
- fix(ux): ensure no overflow for member list table (#8989)
- fix(ux): use replace on login redirect for better back ux (#8980)
- feat(core): support switch tenant mode for blocklets (#8987)
- fix(core): runtime events not broadcast in serverless mode (#8972)
- chore(ui): optimize the display of dedicated server invoice information (#8971)
- fix(ui): deprecate reload action for blocklet and component list (#8958)
- fix(ui): polish stopped component styling in blocklet studio (#8956)
- feat(security): show version details for upgrade actions (#8897)
- fix(ui): should disable deletion for default store (#8896)
- fix(service): duplicate request of did-space authorization (#8894)
- chore: bump version to v1.16.27

## 1.16.26 (March 30, 2024)

- fix(ux): show next version on upgrade confirm #8833
- feat(ui): components and mobile ux optimization (#8882)
- feat(sdk): better error handling for js-sdk api (#8881)
- fix(service): oauth dialog can't close after success (#8871)
- fix(service): broken image when serve logo from remote url (#8875)
- fix(sdk): ensure tracker script not block page loading (#8877)
- feat(api): support base32 decode for debugging purpose (#8874)
- feat(service): better suspend and stop warning for serverless apps (#8870)
- fix(cli): server can not start when installed with pnpm (#8873)
- feat(ui): show resource blocklets conditionally on launch or mount (#8865)
- feat(js-sdk): add createFetch & createAxios (#8858)
- feat: support custom oauth login (github, google, apple) (#8849)
- fix(core): blocklet studio connect data structure storage related to project (#8841)
- fix(ui): member table overflow on small screens (#8846)
- feat(ui): send feedback to community instead of github (#8847)
- feat(sdk): notification type add passthrough (#8836)
- fix(service): increase the interval of connect queries (#8838)
- fix(dx): blocklet dashboard crash in development (#8837)
- feat: adapted to the latest @did-space/client (#8832)
- feat(security): check blocklet owner before delete project from studio (#8829)
- fix(core): allow users to start app asap on subscription recover (#8830)
- fix(core): do not throw error when call launcher update api (#8828)
- fix(sdk): make sure jest-setup have ABT_NODE_X set
- feat(core): notify launcher after blocklet update (#8822)
- fix(core): serverless crons not started after upgrading server from dashboard (#8819)
- feat(studio): better store connect/reconnect/delete ux (#8818)
- feat(ux): support open blocklet dashboard from server dashboard (#8810)
- feat(service): support notify wallet through dsbridge after login (#8809)
- feat(ux): search blocklet and user by did with prefix
- feat(ui): rebrand publish tab to blocklet studio (#8808)
- fix(cli): blocklet deploy failed when appId is not set
- fix(ci): scoped packages should always set publishConfig
- fix(core): sql exception when adding lets encrypt certificate (#8801)
- fix(ux): blocklet publish broken in iframe (#8794)
- feat(core): support did with or without did:abt: prefix (#8792)
- feat(core): connect and publish blocklet to store from dashboard (#8744)
- fix(ux): use base2 when format filesize
- chore(ci): use node.js v20 for github actions
- chore(deps): bump babel related to latest
- chore(deps): bump ux and vite related to latest
- chore(deps): bump joi version and refactor lodash import
- chore(deps): bump minimatch from 3.x to 9.x
- chore(deps): bump make-dir from 3.1.0 to 4.0.0 (#8754)
- chore(deps): bump archiver from 5.3.2 to 7.0.1 (#8761)
- chore(deps): bump @types/node from 17.0.45 to 20.12.2 (#8766)

## 1.16.25 (March 08, 2024)

- feat(core): support run on amazon linux 2023
- feat(core): support new launcher and payment-kit (#8737)
- chore(deps): bump ux deps to latest
- fix(ui): broken layout on blocklet component launch page
- fix(ui): polish icon for cancel button when manage blocklet (#8731)
- fix(core): ensure external dependencies installed on every start (#8730)
- feat(ux): show qrcode and add prefix for did component (#8726)
- feat(ux): polish resource and pack blocklet create/release workflow (#8704)
- fix: the componentDid was obtained incorrectly (#8719)
- feat(core): support block expired user-session (#8712)
- feat: support i18n text when can not import (#8710)
- feat: support authorize for import (#8703)
- feat(router): support configure direct response with url mapping (#8699)
- (next) fix(api): ensure no duplicate team items in navigation data (#8697)
- feat(service): resize when valid dimensions specified and use png as app logo (#8698)
- fix(api): ensure no duplicate team items in navigation data (#8695)
- fix(router): preference page 404 in default routing engine (#8694)
- feat(core): add user-session management (#8690)
- feat(ui): validate blocklet title and description when add by creating (#8686)
- fix: hidden frontend reload action (#8685)
- feat: better lightweight serverless (#8675)
- fix(ux): optional components is missing from blocklet dashboard (#8677)
- fix(ux): component & url mapping alignment (#8672)
- fix(ux): ensure no error on optional component install and remove (#8670)
- feat(schema): deprecate list support for components.source.store
- fix(core): add lock when init blocklet database to avoid race conditions (#8668)
- fix: npm add --ignore-scripts (#8661)
- fix(auth): quick switch-account should keep walletOS (#8656)
- fix(email): email logo convert to png (#8649)
- feat(core): respect dependency hierarchy when start components (#8645)
- fix: dashboard log ws topic error (#8644)
- fix: render with SVG when image loading fails (#8641)
- feat(service): support auto-login after lost-passport (#8638)
- feat: optimize dev and start commands (#8640)
- feat(core): only parse optional components when required (#8639)
- feat(service): allow image filter on default svg logo file

## 1.16.24 (February 07, 2024)

- fix(core): tune concurrency limit for blocklet restart calls
- fix(auth): parse user avatar to bn-url on login (#8631)
- fix(core): config change notifications should only send to wallet (#8630)
- fix(ux): external blocklets not included in dashboard stats #8518
- feat(cli): support customize minify and builtin external deps in compact mode (#8629)
- fix(core): ensure external dependencies after blocklet download (#8572)
- fix(core): event broadcast in server dashboard and missing notification title (#8571)
- feat(core): modify the installed notification sent to the wallet (#8565)
- feat(core): support external dependencies in compact bundle format (#8566)
- feat(cli): output app name and url for server status
- fix(ux): component require status display during launch workflow (#8557)
- fix(cli): ensure extra files are bundled by ncc (#8539)
- fix(core): server-to-wallet notification should work (#8547)
- feat(auth): support terminate specified userSession by user-self (#8540)
- fix(cli): ensure default mount-point on dev/deploy is lower-case (#8538)
- fix(cli): ensure default mount-point on add component is lower-case (#8538)
- feat(service): support svg to png when apply convert image filter
- fix(core): revoke did domain is not working (#8531)
- feat(cli): support compact bundle format for faster download and extract (#8520)
- fix(core): should not include config for excluded components in pack (#8513)
- chore: bump version to v1.16.24

## 1.16.23 (January 15, 2024)

- fix(login): ensure write cookie after login (#8509)
- chore(test): polish unit test for blocklet schema validator (#8507)
- fix(ci): sync update-cache cache-version (#8508)
- chore(login): polish switch-did custom message (#8505)
- feat: support selecting component when exporting pack (#8500)
- fix: repair install related components detail (#8504)
- fix(ux): keep extracting status when reload browser (#8502)
- fix(navigation): userCenter menu should level up as flatten structure
- feat(ui): new issue-passport page layout (#8492)
- fix(reliability): temporary files are not deleted after backup (#8498)
- fix(core): ensure ports are number in blocklet state (#8497)
- fix(core): url path should be case-sensitive (#8491)
- fix(sdk): correct export esm module for js sdk (#8494)
- fix(reliability): unexpected end of form error during backup (#8485)
- chore(ci): use node v18 for release workflow
- fix(ci): beta release not including build files
- fix(did-connect): fix mfa-code style error (#8489)
- fix: make sure redirects to the accessed domain after started blocklet (#8487)
- chore: do not verify launcher if the launcher mode is development (#8488)
- fix(ci): repair coverage and dep cache (#8483)
- (fix-ci) feat(blocklet-service): login page will stay while origin is `switch-did` (#8472)
- fix(dx): reuse blocklet port when re-developing a blocklet (#8470)
- fix(core): duplicate notification on blocklet management events (#8468)
- feat(resource): support install blocklet release directly for preview (#8467)
- fix(ci): turbo cache no working in different branch (#8471)
- fix: should get resource component env when initializing app (#8391)
- chore(schema): remove staticComponents in blocklet.yml (#8388)
- feat(dx): use turbo to boost unit test run (#8368)
- fix(perf): use cache when parse-optional-components (#8376
- feat(service): support did-space requirement on user login (#8187)
- fix(core): pack release broken caused by deps update (#8375) (12 days ago)
- fix(core): do not throw when parse optional component failed (#8365)
- fix(build): service worker broken and manifest 404 #8318
- fix(cli): should cleanup server start lock on exit #8356
- feat(cli): better mountPoint handling for blocklet deploy
- chore(ci): use larger runners for github actions (#8359)
- fix(core:security): did document security issues (#8360)
- fix(deps): bump sqlite3 and deprecate npm.taobao.org (#8357)
- fix(ux): add version in blocklet logo url to bust cache (#8354)
- feat(sdk): broadcast user related events to app components (#8355)
- chore: deprecate updateUserRole from team api
- feat(core): support optional component and reusable installer (#8338)
- feat(schema): make sitemap support explicit in blocklet.yml (#8351)
- feat(service): support @blocklet/js-sdk & composable user-center (#8331)
- chore(deps): bump browserify-sign from 4.2.1 to 4.2.2 (#7835)
- chore(deps): bump crypto-js from 4.1.1 to 4.2.0 (#7828)
- chore(deps): bump sharp from 0.32.4 to 0.32.6 (#7983)
- fix(core): add backup restart backoff delay on blocklet crash (#8348)
- chore(deps-dev): bump vite from 5.0.10 to 5.0.12 (#8334)
- fix(config): config with placeholders does not work (#8329)
- feat(core): beta support create pack blocklet from dashboard (#8327)
- fix: do not exclude typescript from bundle (#8328
- fix(ui): lost mountPoint tag in component config dialog
- feat(sdk): support config and share env/pref to resources (#8326)

## 1.16.22 (January 15, 2024)

- fix(core): update did domain dns failed (#8303)
- fix(service): open graph service should use customized logo (#8300)
- feat(core): enable did domain by default (#8299)
- fix(api): return component version in blocklet.js (#8297)
- feat(cli): use hash as screenshot name when bundling (#8294)
- chore(spec): remove deprecated props from blocklet.yml (#8291)
- feat(service): include host in access log format
- fix(ci): resolve constant package deployment block (#8280)
- feat: add lazy load locale files, update:deps (#8273)
- fix(config): failed to clear secure env in component (#8261)
- fix(core): updater should check lock state before exit (#8259)

## 1.16.21 (December 18, 2023)

- fix(service): return 401 if request has no auth to dev mode component (#8252)
- feat: update auto-i18n, add error detail message (#8251)
- fix(core): server stuck in maintenance mode when op from dashboard (#8247)
- feat(ux): supported more languages for server and blocklet dashboard (#8244)
- chore(service): polish new did-connect ux (#8242)
- fix(webapp): ensure router is ready before redirect on launch workflow (#8241)
- fix(core): exclude nested secure preferences from blocklet.js (#8243)
- feat(sdk): support multiple types for getResources (#8224)
- (master) feat(service): use new did-connect (#8216)
- fix: wallet check-update URL error (#8218)
- feat(core): support auto component update check and notify (#8204)
- fix(dev): early resolve of schema update workflow (#8209)
- fix(sdk): better logging api and rotation support (#8208)
- feat(dev): add script to automate schema update workflow (#8206)
- fix(api): rollback removed field in gql api for compatibility (#8201)
- fix: failed to inject pack config (#8199)
- fix(router): default routing engine breaks blocklet and image service (#8198)
- feat(cli): add util to cleanup cache and reset maintenance status (#8194)
- feat: add blocklet components status downloading progress (#8192)
- feat: support blocklet pack (#8189)
- fix: in serverless env, only block notification to server (#8186)
- fix(core): checking whether a domain is accessible (#8184)
- fix: remove deprecated deps (#8181)
- fix: language selector adds richer prompts and list content (#8180)
- fix(webapp): setup domain ui bug on blocklet setup page (#8175)
- feat(sdk): add jest setup/teardown script
- feat(dev): do not prefix output when run script in tty
- feat(sdk): disable connection and requests in test env
- feat(service): support notifications on blocklet dashboard (#8166)
- feat(core): check if the custom domain is did domain before save it (#8169)
- feat(core): support all iso-639-1 language for blocklets (#8163)
- feat(core): support pre-flight hook before migrate/start (#8160)
- chore(service): polish userInfo in email footer (#8151)
- fix: failed to dev blocklet in dev server (#8149)
- fix(service): send test email should use current wallet (#8147)

## 1.16.20 (December 15, 2023)

- fix(cli): dev and exec load env in blocklet.yml defined (#8140)
- fix(core): tune error handling of HTTPS certificate generation (#8144)
- fix(core): remove dns detection during backup (#8142)
- fix(ui): better default language control when edit navigation
- fix(cli): support BLOCKLET_DEPLOY_APP_ID from env (#8138)
- feat(service): email unsubscribe workflow support (#8134)
- fix: always restart app when server starts from crash (#8133)
- fix: reduce memory footprint during blocklet backup (#8123)
- fix(service): should return component status when not running (#8128)
- feat: support test email config && unsubscribe email notification (#8124)
- fix: improve i18n support for the builtin passports (#8125)
- doc(webapp): update README.md in core/webapp
- fix(core): ensure backup queue on start and single backup source (#8118)
- fix: require error in vite bundle (#8115)
- fix(ci): blocklet service publish script is broken
- fix(deps): move react-hook-form to devDependencies in service
- feat(sdk): support waitForComponentRunning for hooks (#8110)
- fix(core): send owner passport on blocklet key-pair generated (#8108)
- feat(sdk): support batch mail sending with blocklet service (#8107)
- feat: migrate blocklet-service to vite (#8105)
- chore(dev): output colored logs on development mode #8102
- refactor(core): optimize tls certificate generation (#8080)
- feat(cli): sent did and version in headers when uploading to store (#8094)
- feat(sdk): support dynamic blocklet embed in fallback middleware
- chore: support manually create blocklet did (#8091)
- fix: auto-login support oauth account (#8092)
- feat(connect): support memberAppInfo (#8082)
- fix: omit unnecessary error log (#8077)

## 1.16.19 (November 11, 2023)

- fix(cli): blocklet init failed because .gitignore was not found (#8067)
- fix(service): ui issues on blocklet setup workflow (#8064)
- feat(service): keep login when redirecting to different domain (#8060)
- fix(ui): display component version in component list page (#8055)
- fix: polish err message for "blocklet deploy" (#8043)
- feat: add checkUser api in blocklet-service (#8053)
- fix(webapp): polish domain setup page for launch workflow (#7859)
- fix(ux): should manually upgrade existing component (#8052)
- chore(ci): polish tip of how to deploy application to server (#8051)
- fix(cli): init blocklet failed if did is not specified (#8050)
- fix(ui): show error message when config environment failed (#8049)
- feat: better setup workflow layout (#8039)
- feat(sdk): allow custom headers for component call (#8038)
- fix: dialog in embed section should not have backdrop (#8035)
- chore: polish workflow of resource blocklet (#8028)
- fix(webapp): blank page after refresh on app install confirm (#8016)
- fix: failure to launch app after connected to DID Space (#8017)
- chore: polish ux of using resource blocklet (#8007)
- fix(service): crash caused by headers already sent #7994
- fix(ui): disable sort on navigation items #7933
- chore: polish auto-login in wallet app (#8008)
- fix(service): authorization ui bug on blocklet setup pages (#8006)
- feat: publish @abtnode/connect-storage and cleanup migration scripts (#7985)
- chore: add eslint rule "no-use-before-define" (#7982)
- fix exception thrown when exiting a startup process (#7980)
- chore(test): fix and add more test for core state (#7976)
- feat: member should pull user from master in first login (#7972)
- fix(cli): incorrect url when checking ip on start
- fix(core): use sqlite as connect session store to avoid crash (#7968)
- fix(webapp): unable to upload certificate (#7966)
- fix(core): app backup failure and log simplify (#7963)
- fix(service): larger timeout and param when processing gifs #7964
- fix(service): polish webhook editing ux on user settings
- fix(core): running blocklets should be stopped on expiration (#7962)
- fix(core): client crashed when using ipv6 (#7961)
- feat(core): streaming service error log to server dashboard #7959
- fix: remove pixels limitation of input file (#7957)
- fix(service): 404 and blank page issue on connect page (#7956)
- feat(ux): better default app name on launch #7937
- feat(ops): return server mode in did.json #7939
- fix: blocklet server start failed due to migration failed (#7950)
- fix: backup progress not update in blocklet dashboard (#7929)
- feat(ops): include server did in daemon crash alert
- fix(webapp): serverless subscription info incorrect

## 1.16.18 (October 29, 2023)

- feat: auto backup interval change to 2 hour
- fix: disable user modify sourceAppPid field (#7914)
- fix(ui): add arcblock branding on welcome page #4621
- fix(ui): check new version should be more obvious #5893
- feat(security): disallow blocklet upgrading on serverless #7651
- feat(dev): show component port on analytics/runtime page #7906
- fix(service): broken image when using svg as logo #7911
- chore(service): federated site have high priority in create-connect process (#7905)
- fix(router): routing rule bugs (#7904)
- fix(service): paywall page text
- fix(service): align branding footer on error pages for mobile
- chore: polish blocklet cli and deprecate webpack bundle (#7902)
- feat: support random name and logo upload on launch (#7899)
- feat: support access denied page (#7898)
- fix: check for resource component updates failed (#7897)
- chore: polish service based user profile page (#7890)
- feat(api): support service info in server/blocklet did.json (#7891)
- fix(ui): should display loading when deleting|reloading app (#7888)
- fix: rotated app does not receive notification form service (#7887)
- feat(service): simple user profile and settings page (#7885)
- fix(core): send alert on server crash and backup error (#7881)
- feat(blocklet-service): show server subscription info on blocklet dashboard (#7882)
- feat: polish auth0 login and support wallet login api (#7871)
- feat: resource add and publish page for component embedding (#7865)
- fix(core): secure preferences not encrypted and empty #7874
- feat(service): deterministic order of blocklet dashboard nav #7760
- fix(launch): do not throw empty url because it eventually works #7553
- fix(service): return 503 instead of 500 for blocklet maintenance #7824
- fix(core): exclude sensitive data in backup jobs (#7852)
- fix: should not auto remove routing rule in "/" (#7844)
- fix: receive invite broken in blocklet-server (#7845)
- fix(sdk): should validate blocklet.js when update it (#7843)

## 1.16.17 (September 26, 2023)

- feat: support login with sourceAppPid params in blocklet/sdk (#7837)
- fix(service): should follow redirects when generate open graph
- fix(webapp): blocklet dashboard ui bugs on mobile (#7836)
- fix: router update failed after resource blocklet installed (#7826)
- fix: quick-login pass necessary user params (#7833)
- fix: quick-login error in cross blocklet-server blocklet (#7831)
- fix(core): only show accessible tip when blocklet inaccesible #7789
- fix(core): should use app name on passport recover #7819
- fix(core): enforce same post size limit for daemon/service/router (#7825)
- fix: use component title as default mount point (#7816)
- chore: cleanup aggressive log in core/queue
- feat: support emoji in open graph service (#7800)
- feat: paywall service based on payment-kit part1 (#7790)
- fix: unable to upgrade components (#7795)
- fix: return visitorId in fix login on blocklet (#7794)
- feat: refactor did-connect login process & support new federated login (#7770)
- fix(core): authorize nft domain for migrated blocklet and ui issues on blocklet setup (#7791)
- feat(core): support add nft domain (#7782)
- chore(ui): show tip of adjusting order for languages (#7779)
- feat: more stable automatic backup (#7771)
- feat(cli): add --start-all-components option for blocklet dev (#7772)
- feat: config app logo by uploading image (#7761)
- feat: support auto backup blocklet (#7758)
- fix(core): blocklet launch bad public key error (#7751)
- fix: add resource component failed
- feat: blocklet resource exporting protocol v2 (#7749)
- feat: more efficient and stable incremental backup (#7746)
- fix: should not install resource blocklet as an application (#7740)
- fix: app owner should not be revoked (#7739)
- fix: polish ux of blocklet release (#7736)
- feat: directly filter specific space (#7732)
- fix(core): generate slp domain bug (#7734)
- fix: update slp domain bug after changed component mount point (#7731)
- fix(ux): blocklet list should be responsive (#7730)
- chore: remove capabilities.component in blocklet.yml (#7696)
- chore: add time log for handle routing (#7695)
- fix(core): blocklet.js cache not purged on mountpoint change (#7697)
- fix(sdk): do not use cache when fetch blocklet.js (#7687)
- feat: support create resource blocklet in dashboard (#7619)

## 1.16.16 (September 03, 2023)

- chore: update copyright to ArcBlock (#7672)
- chore: update @did-space/client dep (#7570)
- fix: some messages not send to component channel (#7671)
- fix: federate site detail should use logo with imageFilter (#7664)
- fix: should send event to component in dev mode (#7663)
- fix: should ignore /?a=b if ignoreUrl is "/" (#7661)
- feat: support config copyright (#7658)
- chore(core): read store list from server settings (#7647)
- chore: update deps to fix login issues (#7645)
- fix(sdk): should not fallback to html when request resources (#7642)
- fix(service): login is broken on app without federated login #7638
- fix(dev): service crash on empty wallet-os header
- feat: keep login walletOS in token (#7631)
- feat(sdk): support custom timeout on component call
- fix: emit retry queue (#7630)
- feat(service): increase json body limit to 8mb
- fix: getUserAvatarUrl should not throw on remote url (#7617)
- fix: blocklet dev not working (#7603)
- chore(service): polish injected session manager menu item
- feat: support auth0 login with federated mode (#7598)
- feat: env can be shared between components (#7585)
- fix(router): avoid zombie worker process for nginx
- fix(core): throttle blocklet bundle download progress events
- fix(core): blocklet reload not working
- fix(logging): service and daemon log should go into different files
- feat(core): do incremental validation when change routing rule
- feat(core): tune blocklet start/reload concurrency limit
- feat(router): disable cache when validate nginx config
- feat(monitor): enable to load monitor data within 24h
- feat(webapp): support search blocklet by appDid/appPid
- fix(router): blocklet.js should not be cached (#7581)
- fix(sdk): should skip previous blocklet internal event (#7576)
- chore: tweak bearer-token middleware (#7574)
- fix(webapp): notification ui bug that not aligned (#7569)
- fix(core): secure preferences should not exist in blocklet.js (#7568)
- chore: support paramsFirst in blocklet-service did-connect api (#7564)
- chore(core): prefer cname to did domain when add domain (#7565)
- fix: auth0 account support switch to guest (none passport) (#7558)

## 1.16.15 (August 03, 2023)

- fix(webapp): registering to the launcher (#7548)
- feat(service): basic user tagging and extra support (#7546)
- feat: support federated mater disband (#7542)
- fix(core): incorrect latest beta detect result (#7544)
- fix(cli): include migration script deps in bundles (#7543)
- feat(sdk): support clear cache with blocklet sdk
- feat(sdk): support getUserCount in auth service
- feat(core): more performant routing cache clear (#7539)
- fix(core): subscription page can not load for old blocklet (#7537)
- feat(service): use app name as sender signature (#7535)
- feat(ux): optimize the UI for adding domain name (#7528)
- feat(sdk): support page data customize in fallback middleware (#7531)
- feat(core): support bust cache for router and service (#7529)
- fix(service): image service should ignore svg files (#7527)
- fix: show notification in blocklet dashboard and polish log for migration (#7522)
- fix: some backup issues (#7496)
- chore(ui): display runtime config in settings page (#7506)
- fix(service): should not require image extension in path (#7505)
- fix(service): open graph should support any format of external images (#7509)
- fix(core): do not sync blocklet status from pm2 (#7503)
- chore: add audit log for download-logs (#7504)
- fix(sdk): should server version initialized from config in disk (#7493)
- chore(sdk): polish type of Config.env (#7492)
- feat: better backup and restore workflow (#7475)
- fix: avoid return webp to non-compatible client (#7485)
- feat: support reactive component env & preference (#7483)
- fix(service): svg logo should not be handled by image filter (#7484)
- feat(service): support image service on blocklet logo (#7478)
- fix(service): server.sendToAppComponents is not a function (#7477)
- fix: add providerMode in getLoginProvider (#7476)
- feat(sdk): add componentDid in BlockletSDK - env (#7470)
- feat: better backup retry mechanism and connection experience (#7469)
- feat(cli): mask secure env on blocklet dev (#7467)
- fix(dev): cannot dev dapp blocklet (#7468)
- fix(service): delete output image if pipeline failed (#7461)
- feat: support resource blocklets (#7439)
- feat(sdk): support multiple args in component.getUrl (#7465)
- chore: polish seo related features (#7462)
- fix(router): duplicate extension in mime.types
- feat: basic template support for open graph images (#7458)
- fix(webapp): incorrect error message when add domain for blocklet (#7450)
- feat(service): support standard open graph images (#7445)
- chore(blocklet-service): optimize loading subscription page (#7452)
- fix: should include index.d.ts in @blocklet/constant (#7449)
- feat: sdk login can skip update userInfo (#7451)
- feat(service): support robots.txt and sitemap.xml (#7444)
- feat: support switch-profile in @blocklet/sdk (#7443)
- chore: bump to v1.16.15

## 1.16.14 (July 03, 2023)

- fix: error showing backup progress of other apps (#7431)
- feat: always show the correct backup progress (#7426)
- fix(deps): lock umzug to 3.2.1
- fix: move getLoginProvider to @blocklet/sdk (#7423)
- feat: better restore blocklet workflow v2 (#7421)
- feat: use non-blocking async js for tracking requests (#7417)
- fix(core): ui issues in the launch workflow (#7422)
- feat: better restore blocklet workflow (#7416)
- fix: passport not properly displayed in safari (#7415)
- fix(cli): deploy blocklet failed due to strong-axios (#7414)
- chore: polish text when connecting wallet and auth0 (#7412)
- chore(dev): highlight output appDid and mountPoint (#7404)
- feat(service): support animated webp and gif images (#7408)
- feat: improve blocklet install and restore ux (#7369)
- fix: provider should always be `wallet` while id is `null` (#7399)
- fix: update libs to use es module instead of cjs module (#7397)
- fix: image service cache key should include query param
- fix: image service should ignore svg/gif files (#7395)
- chore(webapp): prefer slp domain when setup custom domain during launch (#7392)
- chore: tweak api for image service (#7393)
- fix: show component name in audit log of updateWhoCanAccess (#7391)
- feat: deprecate strong axios in blocklet sdk
- feat: migrate image service from router to blocklet-service (#7388)
- fix: simplify cache key for webp (#7384)
- fix(cli): check only in serverless mode if the slp is changed (#7385)
- fix: accept _/_ and image/\* is also webp (#7383)
- feat(core): add slp domain for serverless blocklet (#7363)
- feat: more performance related tweaks (#7379)
- fix(cache): add webp variable to cache key (#7367)
- chore: increase static asset cache from 30d to 365d
- fix: connectAccount should always use currentDid (#7362)
- feat: offload brotli/gzip compression to nginx (#7357)
- chore: update deps and support brotli (#7353)
- fix: open auth0 config to blocklet.settings.oauth in `__blocklet__.js`
- fix(dev): should reset config and polish dev studio (#7351)
- fix: failed to run core/cli/tools/dev.js
- chore(deps): bump word-wrap from 1.2.3 to 1.2.4 (#7324)
- fix: polish federated login and service cron (#7347)
- feat: support resize/crop image with query params (#7346)
- feat(dashboard): support config env & preference for app container (#7331)
- chore(dev): support install gateway blocklet by "blocklet dev" (#7333)
- feat(router): support image resize/crop and cache on the fly (#7328)
- feat(dev): support custom whoCanAccess of component in .env (#7327)
- fix: delegation use memberSite.appId as agentDid (#7325)
- fix(dev): should use env in .env.development first (#7326)
- fix: component should always upgrade successfully if restart failed (#7318)
- chore: enable gateway cache for debug mode server (#7320)
- feat(perf): better performance for blocklet.js and user session (#7316)
- feat(dev): improve development for composite blocklet and multi blocklet in one app (#7299)
- feat(ux): start all non-running components and stop only running components (#7317)
- chore: update ux deps (#7311)
- fix(ux): incorrect date locale for subscription tip (#7310)
- fix: only enable logging when process.env.DEBUG is @abtnode/models
- fix: add backup migration && verify backup queue && update audit-log (#7301)
- chore: use blocklet.appPid replace blocklet.meta.did (#7302)
- fix(router): increase proxy timeouts for space reliability
- feat: support getBlocklet in auth-service (#7293)
- fix(service): support aliyun smtp mail sending (#7291)
- fix(core): incorrect server passport claim url (#7290)
- chore: polish blocklet url link of notification in slack (#7287)
- chore: update revoked passport syntax (#7286)
- chore: send notification to slack after component started (#7284)
- feat: display logs for each component individually (#7282)
- fix: unrelated process should not stop when upgrading component (#7281)
- chore: add more logs for component status sync workflow (#7277)
- feat: add federated login module (#7260)
- feat: use new design for passport (#7263)
- fix: app status should be stopped if has no component (#7265)
- chore: polish notification message of blocklet lifecycles (#7258)
- chore(dev): polish error tip of develop production component (#7250)
- feat(ux): show updated at on blocklet list page (#7252)
- chore: fix backup texts when no data && upgrade @did-space/client dep (#7225)
- feat(ux): use new did-abt component (#7249)
- chore: bump version to v1.16.14
- feat: mount server admin to well-known by default (#7245)
- fix(dashboard): should cancel downloading component in blocklet dashboard (#7246)

## 1.16.13 (June 13, 2023)

- feat: persist runtime monitor data in sqlite (#7231)
- fix(ui): reduce latency after begin install component (#7235)
- fix(ui): blocklet status sometimes is unknown in a few seconds (#7236)
- fix(ui): add link to app home on 4xx/5xx page (#7234)
- chore: allow dev component if exists same production mode (#7233)
- chore: config appDid and mountPoint by env when dev component (#7229)
- fix: add type defines for timemachine (#7228)
- fix: page should not flash when switch to other tab (#7226)
- perf: improve benchmark of lighthouse for dashboard (#7220)
- feat(sdk): add auth.refreshSession in blocklet sdk (#7221)
- fix(dev): component status stuck in downloading (#7222)
- chore(deps): bump fast-xml-parser from 4.2.4 to 4.2.5 (#7197)
- chore(deps): bump semver from 7.5.0 to 7.5.2 (#7198)
- fix(security): protect blocklet analytics pages with session (#7216)
- fix: language config crash and navigation locales (#7212)
- feat: support did spaces audit log (#7144)
- feat: client side tracking and better analytics ux (#7208)
- feat(core): app status not blocked by failed component when start all (#7195)
- fix: some checks failed in pwa checklist (#7207)
- fix: should dev component that enable clusterMode in blocklet.yml (#7202)
- fix: user fullName does not forward to blocklet from service (#7206)
- fix(core): traffic insight job not handling edge cases (#7199)
- feat(core): support traffic insights with goaccess (#7193)
- feat: dynamic refresh occupied port before start component (#7182)
- fix(blocklet-service): add domain alias failed during setup blocklet (#7189)
- fix(certificate-manager): add status field to certificates table (#7190)
- fix(ui): error message overflow in setup complete page (#7180)
- fix: should double confirm before restart component (#7179)
- chore: add user fullName in login token (#7178)
- fix(queue): incorrect delay when reschedule delayed jobs (#7176)
- fix(core): upgrade stepping and title (#7175)
- fix(core): sqlite caused auto upgrading error (#7171)
- feat(cli): speed up server start by reduce wait/timeout (#7172)
- feat: support pwa for server and blocklet dashboard (#7141)
- fix(service): login session lost after 10min (#7165)
- fix(core): node state update error caused by incompatible $set syntax (#7168)
- fix(security): stripe sensitive env for getNodeInfo (#7167)
- chore(service): polish expiration component ui (#7163)
- fix(sdk): log and rethrow the error from the component call (#7158)
- fix(service): add zh to default languages (#7147)
- feat: better expiration ux for launcher purchased space (#7139)
- fix(ui): display transfer ownership for only owner (#7142)
- fix(core): make start faster by reduce waits/timeouts (#7143)
- feat: add cache for session api & support refresh token (#7079)
- fix(router): support empty page-group when route with component (#7138)
- fix(sdk): hook should not crash if notification emit error event (#7136)
- feat: support for displaying the latest space nft display (#7137)
- feat(routing): support multiple mountPoint for components (#7092)
- chore(core): ensure blocklet.extra.meta is not empty field when restoring blocklet (#7135)
- fix(blocklet-service): show resume tip if the blocklet already expired (#7131)
- fix(core): support migrated appId when query audit-log (#7130)
- chore(deps): bump fast-xml-parser from 4.2.2 to 4.2.4 (#7075)
- chore(deps): bump dottie from 2.0.3 to 2.0.4 (#7111)
- fix: component status blocked at starting (#7121)
- chore: extract blocklet resolve logic into reusable package (#7126)
- fix(blocklet-service): resume blocklet tips error (#7115)
- chore: bump version to 1.16.13

## 1.16.12 (June 13, 2023)

- fix: bump deps to latest to fix cookie domain overwrite
- chore: bump version to 1.16.12

## 1.16.11 (May 29, 2023)

- feat(service): support customize supported languages (#7101)
- feat: better blocklet storage tab page ui/ux v2 (#7089)
- fix(core): set blocklet owner on install complete (#7091)
- fix(dev): should broadcast component info after dev component started (#7087)
- fix(ux): exit visiting when throw error
- fix(queue): handle duplicate job and empty job (#7084)
- feat(core): support overwrite existing apps when restore from space (#7082)
- fix: component status is unknown durning upgrading (#7080)
- chore: update eslint config and fix errors (#7073)
- fix(ux): remove delay when launch/restore blocklet (#7081)
- feat: better blocklet storage tab page ui/ux (#7041)
- fix(cli): print url when connect developer with cli (#7064)
- fix: add unit test for blocklet-service user api (#7065)
- fix(webapp): login failed in android webview (#7074)
- fix(ux): revert install/restore delay to 4 seconds
- chore: enable eslint for jsx files (#7071)
- fix: component status should be stopped after server started from crash (#7070)
- fix(core): emit progress events anyway when components cached
- (fix-launch-progress) fix(service): brand new user login is broken
- fix(db): allow connectedAccount.pk to be null
- fix(core): ensure no dirty data when update user record (#7060)
- chore: update findComponent logic in .blocklet/proxy (#7059)
- chore: upgrade cypress and tweak tests (#7051)
- chore: not restart app after server upgraded/restarted (#7048)
- feat: support start component separately (#7018)
- feat(core): simpler blocklet launch workflow (#7008)
- fix(core): modify the app url given to the launcher when consuming nft (#7036)
- feat(core): ignore expiredAt in blocklet extra when restore blocklet (#7026)
- fix: blocklet service page crashed when setting dns fails (#7021)
- chore: bump version to 1.16.11

## 1.16.10 (May 23, 2023)

- fix(core): ignore env items whose name starts with BLOCKLET\_ on upgrade
- fix(cert): meta not updated on wildcard cert downloaded #7007
- fix(router): proxy pipeline not respect client abort (#7014)
- optimize the application recovery process
- after recovery, do not automatically redirect, allow the user to click to proceed
- if the application can be directly started, start it directly
- if the application cannot be directly started, redirect to the Blocklet dashboard
- if the application already exists on that node, prompt the user to redirect
- fix the intermittent crash logic on the Blocklet Auth Service page
- fix: text Progress replace to In progress (#6991)
- fix(core): sqlite connections not closed for blocklets (#7006)
- fix: email asset link work with url chainHost (#6993)
- fix(webapp): blocklet launch/restore page blink
- repair the installation page does not show the download progress
- fix: getExpiredList should not use nested condition (#6992)
- fix(core): adapt renew cert finding to sqlite (#6983)
- fix(core): waiting for serverless nft consumed (#6984)

## 1.16.9 (May 23, 2023)

- feat(arch): use sqlite as persistent layer
- fix(webapp): restore failed by ownership nft (#6974)
- chore: convert @blocklet/constant from js to ts (#6965)

## 1.16.8 (May 10, 2023)

- fix(core): cron job not scheduled on daemon crash (#6971)
- fix(core): getSystemInfo should ignore disk without valid mountPoint #6602
- fix(core): usage disk alert should ignore NaN #6602
- fix(connect): give correct passport claimUrl on login (#6968)
- chore: add coming soon in more oauth login methods & more notification channel (#6966)
- fix(core): incorrect wallet type when install evm dapps (#6964)
- feat: show progress when downloading blocklet bundle (#6956)
- feat: email support locale (#6957)
- fix(dev): blocklet preferences editor is broken (#6953)
- fix(service): polish email title/layout/logo (#6952)
- fix: cannot add custom domain when setup blocklet (#6944)
- fix: email config check (#6943)
- feat: add email module in blocklet-service (#6935)
- chore(deps): bump vm2 from 3.9.17 to 3.9.18 (#6937)
- perf: add cache for getNodeInfo and getBlocklet (#6936)
- perf(sdk): replace wallet sign to totp sign in AuthClient (#6929)
- fix(core): always poll blocklet state when launch blocklet (#6926)
- feat: support audit log for backup & show restore errors (#6922)
- fix(webapp): check if logged in when restoring to server (#6921)
- chore: make oauth login schema avatar & fullName optional (#6920)
- chore: disable update and rollback component title (#6912)
- fix: should only check permission for server data dir (#6918)
- feat: unify time format of logger, pm2, hook script (#6908)
- fix(ui): should show tip if delete domain is disabled (#6910)
- feat: better spaces connect and support backup trail (#6774)
- fix: sometimes blocklet uptime is incorrect (#6903)
- fix(ui): description of CHAIN_ID should not display undefined (#6906)
- chore: add log in blocklet-service (#6907)
- fix: should auto fix status for no-component app (#6905)
- feat: add user login api in blocklet-service (#6889)
- fix: should not display mask for empty secure env (#6904)
- fix: invite link should work if no component mounted in / (#6901)
- fix(cli): print the did domain as a priority during development (#6897)

## 1.16.7 (May 08, 2023)

- fix(cli): upgrade hangs forever since v1.16.5
- fix(sdk): getUser caused crash
- fix(sdk): customized chainInfo not respected

## 1.16.6 (April 14, 2023)

- feat: app wallet type cannot be changed after installed (#6840)
- feat: support serverless guard on blocklet launch (#6875)
- feat: add audit-log with auth0 account relate (#6874)
- feat: support transfer application ownership (#6729)
- feat(core): support exchange passport with nft (#6739)
- feat: add login in user state (#6784)
- feat: chain host/id/type should be manged in app level (#6769)
- feat(core): support resolve did domain for all known app did (#6782)
- chore(cert-manager): remove useless deps (#6857)
- chore: supplemental multi did use flow (#6841)
- chore: polish nft-passport-exchange ux and cleanup deps (#6825)
- chore(deps): bump vm2 from 3.9.16 to 3.9.17 (#6775)
- perf(arch): start pm2 log rotater and updater on demand (#6767)
- fix: unzip blocklet.zip failed in nodejs v18 (#6885)
- fix(security): use blocklet secret as session secret (#6883)
- fix(webapp): 401 issue when launch blocklet using ownership nft
- fix(perf): should use cache data for req.getBlocklet (#6879)
- fix: BLOCKLET_WALLET_TYPE should backward compatible (#6864)
- fix(core): add /.well-known rule to dashboard site (#6872)
- fix: should dev blocklet with CHAIN_TYPE in blocklet.yml
- fix: put hook logs into blocklet dashboard and fix hook timeout (#6860)
- fix(webapp): blocklet detail page crashed (#6859)
- fix(ci): disable lockfile for broken install
- fix(ci): publish failure
- fix(core): delete expired blocklet failed (#6854)
- fix(cli): try to speedup install with npm-shrinkwrap.json (#6851)
- fix(core): beta version upgrading error (#6850)
- fix: make build failed with lint errors
- fix: dev blocklet should not break change (#6830)
- fix(core): restore serverless blocklet faild (#6842)
- fix: should auto kill process that occupied the port (#6831)
- fix(core): do not delete DID DNS records after deleting the blocklet (#6829)
- fix: members in server cannot read notification (#6824)
- fix(dev): use app did that is different from component did (#6818)
- fix: receive invitation should pass connectedAccount in loginUser (#6820)
- fix(core): blocklet well-known url (#6791)
- fix(setup): should check blocklet status after start (#6815) (#6817)
- fix(proxy): add public path for /.blocklet/proxy (#6816)
- fix(setup): should check blocklet status after start (#6815)
- fix(webapp): redirect failed after restored migrated blocklet (#6808)
- fix: chain info should be auto migrated to app config (#6797)
- fix: auth0 account login and mobile error (#6790)
- fix: should throw error if chain_host is invalid uri (#6781)
- fix(core): dashboard sometimes become not responsive (#6783)
- fix: mergeUserData need connectedAccount provider & did (#6771)
- fix(ux): do not show claim link when not from launcher (#6772)
- fix(ui): should refresh button status after connect to did-sapces (#6770)
- fix: blocklet dashboard can not receive events (#6768)
- fix: ensure app logo when dev blocklet (#6765)
- fix(service): only show exchange passport link nessessary (#6757)
- fix(ui): show error tip when start no component app (#6758)
- fix(ui): should notice stop app first before transfer (#6753)
- fix(ui): duplicate component name in config page (#6755)
- fix(service): use previousUserDid when bind wallet from auth0 (#6756)
- fix: should allow transfer app ownership to self (#6752)
- fix(sdk): should use appPid to join appPublicChannel (#6750)
- fix(core): monitor should ignore disk without size (#6749)
- fix: oauth account declare on blocklet customize

## 1.16.5 (April 13, 2023)

- fix: getRawUser should compatible with user version2 (#6731)
- fix(core): blocklets mounted on server dashboard is broken (#6730)
- chore(deps): bump vm2 from 3.9.15 to 3.9.16 (#6727)
- fix(bundle): should throw error if index.html does not exist in static blocklet (#6726)
- chore: bump deps to latest to fix multiple wallet open (#6725)
- fix(webapp): transferring server failed purchased from launcher (#6724)
- chore(ui): upgrade @blocklet/launcher-layout @blocklet/launcher-ux to latest (#6723)

## 1.16.4 (April 05, 2023)

- feat: combine oauth account & wallet account as unified account (#6718)
- feat(sdk): add process.env.X for blocklet sdk (#6690)
- feat(core): record and show blocklet app sk owner (#6691)
- fix(cli): exit early when do not have access to data dir (#6720)
- fix: pathPrefix should accept . and \_ (#6715)
- fix: external port blocklet should work when it is a component (#6709)
- fix: rotate sk should not run if blocklet is in progress or running (#6703)
- fix(ux): should keep original value if cancel configuration (#6700)
- fix(ux): blocklet endpoint should use root prefix first if exists (#6702)
- fix(service): blocklet dashboard should accessible for empty apps (#6695)
- fix(sdk): support generic parameter for database (#6683)
- chore: bump deps to latest and enable connect socket
- chore(deps): bump vm2 from 3.9.13 to 3.9.15 (#6696)

## 1.16.3 (April 04, 2023)

- fix: should prevent parallel migration (#6680)

## 1.16.2 (April 03, 2023)

- feat: send cpu and mem usage to wallet explorer page (#6671)
- feat(ui): auto check server upgrade when visit about page (#6670)
- fix(migrate): should declare account if app did not exist on chain (#6664)
- fix: should not show update if component version is lower than before (#6672)
- fix(ui): foot bottom disappear in did wallet in restore page (#6669)
- fix: add x-blocklet-server-version in util-meta request & pass serverVersion to @blocklet/list (#6665)

## 1.16.1 (April 01, 2023)

- fix(migration): should migrate account if app is in main chain (#6661)
- fix(sdk): auth service yell about bad sk size for ethereum apps (#6656)
- fix(core): should check requirement in first step of launch (#6659)

## 1.16.0 (March 17, 2023)

- feat(core): support did-wallet managed app sk (#6371)
- feat(core): support did-wallet managed blocklet sk (#6334)
- feat(core): support creating ethereum wallet (#6522)
- feat(core): support rotate app sk with did-wallet
- feat(core): support rotating app sk and better backup/restore (#6425)
- feat(core): add alsoKnownAs for migrated blocklets (#6455)
- feat(core): unify application to container structure (#6412)
- feat(core): support backup and restore from disk (#6554)
- feat(core): support enable/disable gateway cache from dashboard (#6420)
- feat(core): support env placeholders in blocklet config (#6421)
- feat(auth): blocklet-service support login with auth0 (#6487)
- feat(sdk): support delegated connect
- feat(sdk): support getEthereumWallet and getPermanentWallet (#6540)
- feat(sdk): support communicate with all level1 components (#6442)
- feat(sdk): support blocklet embed utils
- feat(sdk): app id list should in runtime environments (#6567)
- feat(sdk): support custom method & streaming response (#6533)
- chore(sdk): split blocklet env to standalone lib (#6593)
- feat(cli): support custom timeout for blocklet exec (#6458)
- feat(service): remove /.blocklet/proxy dependency on req.headers.referer (#6380)
- feat(service): show nested component-mount-point in **blocklet**.js (#6443)
- feat(service): simpler auth for blocklet setup workflow (#6483)
- feat(service): general socket relay for better connect ux (#6354)
- feat(serverless): restore from did space to serverless server (#6555)
- feat(serverless): add 'serverless' mode to blocklet server (#6349)
- feat(serverless): always start blocklet when server in serverless mode (#6386)
- feat(serverless): create dynamic trusted issuers when verify launcher nft (#6607)
- feat(spaces): support for backing up blocklet logos to DID Spaces (#6529)
- feat(spaces): support for binding DID Spaces when adding component (#6536)
- feat(spaces): collect the address of the server when backup blocklet (#6445)
- feat(db): auto compact database file with custom interval (#6459)
- feat(ux): send close message to wallet after receive lost passport (#6528)
- feat(ui): polish launch blocklet navigation layout (#6493)
- chore: do not prevent socket join channel in non-exist app (#6521)
- chore(cli): improve the stability of obtaining public ip (#6395)
- chore: deprecate useless installFromVC (#6356)
- chore(deps): bump webpack from 5.75.0 to 5.76.0 (#6494)
- fix: preConfig hook runtime should include shared environment (#6634)
- fix: blocklet status should not keep stopping if stop failed (#6636)
- fix(deploy): should include all files in bundle dir (#6631)
- fix: should remove tmp restore dir after restored (#6622)
- fix: show more tip when adding a non-component blocklet (#6611)
- fix(core): custom wallet type not respected when install-from-url (#6609)
- fix(ux): should not goto setup page if blocklet is initialized (#6600)
- fix: error message should include passport name (#6604)
- fix(core): delete expired blocklet and clean expired data (#6635)
- fix: polish navigation edit experience (#6595)
- fix: encrypted data is decrypted normally (#6564)
- fix: did spaces text && installation process (#6520)
- fix(core): do not throw when client query without any args
- fix: sometimes cannot delete blocklet (#6449)
- fix(cli): remove dependencies prop when bundling
- fix(ci): exclude source maps in dashboard and service release
- fix: /**blocklet**.js should always be accessible (#6414)
- fix(core): throw error on invalid mountPoint in blocklet.yml (#6415)
- fix(core): validate pathPrefix and mountPoint before save (#6409)
- fix(cli): validate server mode before update core db (#6392)
- fix: handle cjk when create blocklet (#6387)
- fix(sdk): reduce memory usage for auth middleware #6385
- fix: retry not working as expected during backup restore (#6378)
- fix(ts): change build target from es6 to es2020 #6385
- fix: server should force start from crash as expected (#6365)
- fix(core): downloading certificate error at startup (#6369)
- fix: backup restore process routing error (#6329)
- fix(service): login error when switch to guest passport (#6338)
- doc: remove hardcoded sk in webapp/README.md #6511

## 1.8.68 (March 07, 2023)

- fix(cli): keep dependencies prop when bundling

## 1.8.67 (March 06, 2023)

- fix(gateway): nginx cache memory allocate config error (#6424)

## 1.8.66 (March 02, 2023)

- replace `$*_+~. ()'"! \-:@space` in path to `-`
- convert path to lowercase
- keep the slash `/` in path
- uniform route formatting: add `/` at the beginning and at the end
- ci: run test when raising PR to release branch
- increase variables_hash_max_size to 2048 and increase variables_hash_bucket_size to 256 in nginx

## 1.8.65 (February 09, 2023)

- feat: better optimize blocklet backup and restore (#6248)
- feat(perf): support blocklet customized cache paths (#6323)
- feat(perf): use nginx proxy cache to improve server performance (#6312)
- feat(service): log and show user last login ip (#6307)
- chore(webapp): optimize the blocklet installation workflow (#6272)
- chore(webapp): optimize the workflow of installing serverless blocklets (#6317)
- chore(dev): optimized update the did domain dns logic (#6305)
- refactor: optimize blocklet download check method (#6275)
- fix: should always cancel waiting or downloading for a blocklet (#6310)
- fix: dashboard should not crash if blocklet corrupted (#6278)
- fix: blocklet sk should be encrypted in blocklet_extra.db (#6308)
- fix(core): convert custom domain names to lowercase (#6262)
- fix(core): the bug of stopping expired blocklet (#6281)
- fix(ui): should display custom logo for custom created blocklet (#6256)
- fix(core): reload nginx on blocklet cert issued (#6257)
- fix(ux): do not force connected user when issue/recover passport (#6246)
- ci: cancels execution when pull request title contains some string (#6263)

## 1.8.64 (February 02, 2023)

- feat: keep invitation session for 1min after user was joined (#6225)
- feat: support feature switch with local storage (#6224)
- fix(serverless): add chainHost data to serverless blocklet controller (#6214)
- feat: support blocklet end-to-end backup and restore (phase 1) (#6131)
- fix(wellknown): add wellknown for children blocklet (#6219)
- fix: should log blocklet name if verify entry failed (#6216)
- fix: should not monit runtime after blocklet removed (#6212)

## 1.8.63 (January 31, 2023)

- feat: support issue https cert from blocklet dasnboard
- fix(core): preferences not working for arrays
- fix(ci): dashboard bundle missing folder
- fix: should start next beta version successfully
- fix(core): blocklet did domain not properly handled
- fix: can not change key of custom environment
- fix(cli): better files support for blocklet bundle
- fix(cli): remove start lock on process is terminated
- fix: "make build" should build @blocklet/cli (#6184)
- feat: support update beta package version (#6165)
- fix(ui): blocklet uptime incorrect in list page (#6138)
- fix(service): should respect cookie when authenticate websocket (#6183)
- perf: reduce memory usage of supervisor process (#6179)
- fix: disabled core/webapp build sourcemap generate (#6176)
- fix: use prod spaces address replace staging spaces address (#6178)
- feat: support install blocklet from backup dir (#6130)
- chore(docker): reduce docker images size (#6166)
- feat: blocklet service will intercept /favicon.ico (#6162)
- fix(webapp): blocklet list page can't search by domain name (#6151)
- chore(deps): bump cookie-jar from 2.1.3 to 2.1.4 (#6145)
- chore(deps): bump ua-parser-js from 1.0.32 to 1.0.33 (#6146)
- fix(webapp): did resolver api bug (#6135)
- fix: cors can not set to empty (#6136)

## 1.8.62 (January 17, 2023)

- feat(core): support 307 and 308 redirect (#6123)
- feat: support update mount point of root component (#6126)
- fix(gateway): cors for redirect path (#6124)
- fix: can not receive issued passport (#6127)

## 1.8.61 (January 13, 2023)

- feat(ux): show danger zone for blocklet sk configuration (#6111)
- feat: support download log files from dashboard (#6098)
- fix: should not monit runtime before blocklet installed (#6113)
- fix(ux): logo bundle lost after installed (#6108)

## 1.8.60 (January 11, 2023)

- feat(auth): use same profileFields and fallback to app config for components (#6102)
- fix(sdk): incorrect parsed env caused by try-json-parse (#6099)
- chore(deps): bump luxon from 1.28.0 to 1.28.1 (#6093)

## 1.8.59 (January 10, 2023)

- feat: improve message structure of notification (#6090)
- style: rename node.prefix to node.imgPrefix (#6082)

## 1.8.58 (January 06, 2023)

- fix: upgrade crash of v1.8.57

## 1.8.57 (January 06, 2023)

- feat(core): do not immediately delete expired blocklet data (#6039)
- feat(core): support restart from server dashboard (#6075)
- fix(ux): add tooltips for navigation-actions (#6073)
- feat(core): support export blocklet data dir as archive (#6076)
- fix(log): delete expired log files bug (#6046)
- fix(ux): polish code and ux for blocklet navigation (#6070)
- fix(security): bump jsonwebtoken from 8.x to 9.x (#6071)
- style: rename node.prefix to node.imgPrefix (#6069)
- fix(core): should allow upgrade if available mem > 300M (#6068)
- fix(core): improve reliability for server upgrading (#6065)
- fix(ux): react-sortable-tree work with mui-datatables (#6066)

## 1.8.56 (January 04, 2023)

- feat: config component source store dynamically when bundling (#6062)
- fix(webapp): remember the certificate list page paging settings (#6056)

## 1.8.55 (January 03, 2023)

- fix(cert-manager): failed to generate a certificate (#6050)

## 1.8.54 (January 03, 2023)

- fix(core): use latest nedb to fix cert-manager issue
- fix(service): "write after end" error in blocklet service (#6047)
- fix(ux): remove link to logs page from blocklet log dir (#6045)
- fix(ux): i18n should fallback to en in blocklet dashbaord (#6048)
- fix(ux): polish ui of server monitor page (#6044)
- fix(core): runtime-history api return 403 (#6043)

## 1.8.53 (January 02, 2023)

- fix: make server db process crash safe

## 1.8.52 (December 31, 2022)

- feat: improve runtime monitor for blocklet and server (#5991)
- feat: support fuzzy query users (#6027)
- chore: use latest nedb and ux lib (#6026)
- fix(core): get appUrl bug (#6025)
- fix(core): update did domain after blocklet appId change (#6017)
- fix(cron): always use await when run jobs (#6018)

## 1.8.51 (December 27, 2022)

- fix(core): encode eth address as base32 failed (#6011)

## 1.8.50 (December 27, 2022)

- chore: bump deps to latest
- feat(core): encode did domain as base32 format (#5986)
- fix: missing root component logo in blocklet dashboard #6003
- fix: custom domain is not clickable in blocklet dashboard #5803

## 1.8.49 (December 23, 2022)

- fix(router): use only path for trailing slash redirect #5989
- feat: support update specific components (#5997)
- feat(core): support rolling connect session (#5996)
- docs: update doc site in hard code (#5995)
- feat: config blocklet favicon in blocklet dashboard (#5977)

## 1.8.48 (December 22, 2022)

- fix: monitor process does not exist after pm2 crash
- fix(core): aws ec2 detecting not working anymore (#5976)

## 1.8.47 (December 19, 2022)

- fix: should not remove custom app config when blocklet upgrade (#5971)

## 1.8.46 (December 16, 2022)

- fix: remove pm2.connect() due to memory leak risk (#5965)
- fix: return maintenance page instead of notRunning page (#5953)
- fix: use `@latest` in npx command (#5949)

## 1.8.45 (December 13, 2022)

- fix(cli): rollback blocklet start --keep-alive

## 1.8.44 (December 12, 2022)

- fix(cli): pm2 api sometimes crash
- chore: upgrade deps to latest (#5942)

## 1.8.43 (December 06, 2022)

- feat: improve server reliability when not exiting normally
- feat(sdk): better ts and updateUserApproval support
- fix: blocklet preference defaults should be populated after download
- fix: The address of the did connect interface of the did spaces is incorrect

## 1.8.42 (December 06, 2022)

- fix: gql config mutate_blocklets
- fix: error with parent navigation has multi locales links
- fix: autocomplete matched error component
- feat: level up navigation while there is only one child
- fix: add "invalidPathFallback" for navigation-preview dashboard component
- fix: navigation "save" & "reset" not show error message

## 1.8.41 (December 05, 2022)

- fix: sessionManager is not limit to 1 item

## 1.8.40 (December 05, 2022)

- chore: update deps
- fix: default sessionManager inject logic
- Merge branch 'master' into dev
- feat: add custom navigation page in blocklet detail page (#5782) (#5887)
- feat: ensure blocklet env json-parsed from sdk
- fix: polish blocklet navigation (#5883)
- [skip ci] update readme
- fix: polish ux for component config dialog #5864
- chore(service): redirect to login page if user is not authorized to access (#5878)
- chore(webapp): fix Renew typo (#5884)
- chore(cli): polish err message if did and name not match (#5875)
- fix: failed to config passport color (#5871)
- fix: preference-builder should not say save and close #5860
- fix: disallow studio when blocklet in prod mode #5868
- fix: lost issue passport btn in member detail in blocklet dashboard #5857
- fix: login sometimes failed #5867
- feat: add custom navigation page in blocklet detail page (#5782)

## 1.8.39 (December 03, 2022)

- fix: sometimes login failed

## 1.8.38 (December 01, 2022)

- feat: config access for each component (#5828)
- feat(core): use nftId for blocklet existence detection on serverless installation (#5832)
- feat(core): optimize install blocklet via serverless NFT (#5831)
- feat: rename capabilites.didStorage to capabilites.didSpace (#5818)
- feat: send blocklet events to blocklet owner and admins (#5811)
- feat: add "manage blocklet" in passport actions (#5810)
- chore: add server did and version in blocklet dashboard and feedback (#5815)
- fix(cli): should throw error if did and name mismatch in blocklet.yml (#5814)
- fix: component logo is not correct in blocklet dashboard (#5813)
- fix: user data in blocklet dashboard should update in real time (#5809)
- fix: preference page grid layout #5805
- fix(ux): timer should repect i18n in logs page (#5808)
- fix(ui): Cpu Usage -> CPU Usage
- chore(deps): bump loader-utils from 2.0.3 to 2.0.4 (#5799)

## 1.8.37 (November 18, 2022)

- feat: add component from blocklet dashboard (#5798)
- feat: support blocklet studio and blocklet preferences (#5800)

## 1.8.36 (November 17, 2022)

- feat(core): authorize external service (launcher) management blocklet (#5801)
- fix: typo in permission atom (#5797)

## 1.8.35 (November 15, 2022)

- feat(meta): add typescript support (#5754)
- feat: separate access and app in blocklet dashboard (#5771)
- feat(ui): add report entry at footer in dashboard (#5792)
- chore: show more tip if "blocklet create" failed (#5785)
- fix(ui): should be able to retry if get data failed in blocklet dashboard (#5791)
- fix: export blocklet with components does not work (#5789)
- fix(ux): confirm by "enter" in setup config page (#5784)
- fix(ui): user counts should update in real time in member list page (#5788)
- fix(ui): router page crashed if page is under custom port (#5787)
- fix(ui): certificate tag crashed if manual upload cert exists (#5767)
- fix(core): the wrong udp proxy in Nginx (#5773)
- chore(deps): bump loader-utils from 2.0.2 to 2.0.3 (#5760)

## 1.8.34 (November 08, 2022)

- feat(sdk): add typescript support (#5648)
- feat: integrate did storage into the blocklet setup process (#5722)
- feat: refactor domain and url routing in dashboard (#5725)
- chore: always return 404 if user does not has permission (#5756)
- chore: use 'en' as fallback locale for locale-provider (#5746)
- perf(dashboard): optimize first screen time of blocklet dashboard (#5748)
- fix: members page somitimes crashed (#5758)
- fix(cli): "blocklet dev" should not remove blocklet in production mode (#5757)
- fix(core): remove useless codes[skip ci] (#5753)
- fix(core): failed to clean logs in dev mode on windows (#5750)
- fix: should parse if child navigation depth more than 1 (#5743)
- fix: client dts contains a lot of null (#5731)
- fix: typescript def for server client has null (#5730)
- fix: --no-changelog is not respected by blocklet bundler (#5727)
- refactor: use domainAliases instead of blocklet.interfaces (#5755)

## 1.8.33 (November 02, 2022)

- fix: keep-alive in blocklet-service and nginx (#5719)
- chore: update blocklet memory limit to 800MB (#5720)
- fix: should display err message on blocklet setup failed (#5721)
- chore(ci): push readme.md to docker hub [skip ci] (#5715)

## 1.8.32 (October 28, 2022)

- feat(sdk): support get users by a group of dids (#5708)
- feat(bundle): throw error if unknown prop exists in blocklet.yml (#5683)
- feat(cli): execute component script via blocklet exec --app-id (#5694)
- feat: external user can install blocklet to server (#5646)
- feat: blocklet can require min version of nodejs (#5698)
- chore(ui): use latest blocklet list for better autocomplete ux (#5690)
- chore(cli): polish error message when deploy a no-exist dir (#5703)
- chore(cli): remove --skip-hooks option in "blocklet deploy" (#5681)
- fix: failed to start server by via nodejs18 (#5702)
- fix(cli): blocklet add/remove should work as expected (#5692)
- fix: should run pre/post install hook in blocklet dev workflow (#5693)
- fix: should log more reason when blocklet failed to deploy (#5695)
- fix(ui): polish ui in trusted issuer dialog (#5697)
- fix: should not check latest version from other stores (#5688)
- fix: should print err message when DID Domain update failed (#5689)
- fix: should allow no passport when switching passport (#5691)
- fix: should not throw error if svg logo size < 256 (#5680)

## 1.8.31 (October 24, 2022)

- feat(cli): warn when dependency resolved to .pnpm folder
- feat(core): use https did domain as default appUrl
- feat(cli): add skip-navigation option for "blocklet deploy" (#5645)
- chore: update blocklet list (#5658)
- fix: joi broken from 17.6.3 to 17.6.4 (#5674)
- fix(core): prune blocklet failed on windows (#5670)
- fix(cli): ignore files from .pnpm folder when zip bundle
- fix: should abort when dev none-component as component (#5656)
- fix(core): filter empty for compisitive navigation (#5652)
- docs: add development documentation for windows (#5649)

## 1.8.30 (October 17, 2022)

- chore(deps): update deps to latest
- fix(core): should not use port of any existed component (#5640)
- fix(cli): server start stuck on windows (#5633)
- fix(core): string.prototype.replaceAll does not exist (#5639)
- feat(core): support configure square logo for wallet and connect (#5638)

## 1.8.29 (October 14, 2022)

- feat(core): support for running on windows (#5629)

## 1.8.28 (October 13, 2022)

- feat: parent can overwrite child default environment when install blocklet (#5626)
- feat: support standard chainInfo env for blocklets (#5612)
- fix: https over http not working for axios (#5596)
- fix(sdk): should convert user avatar in getUser() (#5603)
- fix: blocklet_dev_port should NOT in components of production mode (#5598)
- docs: update README of blocklet-services (#5601)
- chore: polish page header (#5611)
- chore: bump did-connect deps to latest safely (#5600)

## 1.8.27 (October 01, 2022)

- feat(service): inject management pages into blocklet dashboard (#5577)
- feat(core): support customize blocklet instance logo (#5572)
- chore: rename meta.js to blocklet.js (#5580)
- chore(core): modify 'renewal' to 'renew' and add locale param to querystring (#5574)

## 1.8.26 (September 27, 2022)

- feat(sdk): support security util for encrypt/decrypt data (#5570)
- chore: rename children to components in blocklet.yml and api (#5563)

## 1.8.25 (September 26, 2022)

- chore: bump deps to latest safely
- feat(cli): support bundle a svg as a logo (#5568)
- fix: static server should not let browser cache html file to disk (#5567)

## 1.8.24 (September 22, 2022)

- chore: update did-connect deps to latest
- feat: include hooks automatically when bundle in zip mode #5553
- fix: blocklet cli should crash when spec file not found #5554

## 1.8.23 (September 21, 2022)

- feat: dynamic update component title and mountPoint (#5541)
- fix(navigation): should not filter same link in diff section (#5548)
- fix: should update blocklet env value if secure changes after upgraded (#5549)
- fix: issuse about members and passport (#5545)
- chore(core): modify the data directory in the docker image (#5539)

## 1.8.22 (September 15, 2022)

- feat: get webendpoint of first-level components (#5532)
- ci: update pr template

## 1.8.21 (September 14, 2022)

- feat(queue): support delay job (#5527)
- chore: use preInstall instead of preDeploy (#5524) (#5529)
- fix: zip bundle not working when multiple package.json (#5528)

## 1.8.20 (September 13, 2022)

- fix(cli): polish ux of "blocklet upload" (#5513)
- feat(cli): support hooks for any blocklet type (#5518)
- fix(ui): polish required configuration missing tip (#5515)
- fix(ui): blocklet configuration form overflow issue (#5516)
- feat(core): send notification to wallet after blocklet deleted (#5514)

## 1.8.19 (September 09, 2022)

- fix: use latest nedb for security updates

## 1.8.18 (September 08, 2022)

- feat: support post-start hook in blocklet lifecycle (#5506)
- fix: do not share nedb multi ports with blocklet (#5508)
- chore: polish blocklet sdk database paginate method (#5505)
- fix(service): should return json if request accept json (#5507)

## 1.8.17 (September 08, 2022)

- feat(sdk): extract component module and support signed api calls (#5495)
- chore: use latest nedb with promise and typescript support (#5502)

## 1.8.16 (September 07, 2022)

- feat: add user passport related api for Blocklet SDK (#5498)
- chore: return shares in create createNftFactoryItx() (#5499)
- chore: the prompt after blocklet auto-publishing success (#5492)
- fix: polish ui for launch workflow (#5497)

## 1.8.15 (September 02, 2022)

- feat: support upload/download paid blocklet components (#5477)
- chore: add blocklet version info in purchase nft factory (#5480)

## 1.8.14 (September 01, 2022)

- feat: payment lib for Blocklet CLI and Store (#5469)
- fix: should fill child group section to top level nav if empty (#5475)

## 1.8.13 (August 29, 2022)

- feat(blocklet): add blocklet status http api (#5466)
- feat(dev): use env.mode to check blocklet mode (#5455)
- chore: polish notifications page (#5460)
- chore: add locales for add-components (#5449)
- fix: blocklet config should not be resetted after reinstalled (#5451)
- fix: should return bundleDid and bundleName in componentMountPoints (#5464)
- fix: should not create webhook if test send failed (#5456)
- fix: incorrect status change event when reload blocklet (#5465)
- fix: should notify to blocklet-service when blocklet status changed (#5458)
- fix: disable index.html cache for static app (#5457)
- fix: issues related to member list (#5453)
- fix: polish api request in blocklet detail page (#5450)

## 1.8.12 (August 24, 2022)

- fix: icon and section in child nav config should work (#5441)
- chore: feedback given when blocklet selected (#5443)
- chore: bump deps to latest safely (#5442)
- chore: update blocklet-list component (#5440)

## 1.8.11 (August 24, 2022)

- feat(core): limit blocklet-service instance num in low memory machine (#5430)
- fix(ui): register node in blocklet launcher (#5425)
- fix(ui): domain https status is not correct (#5422)
- fix(ui): display loading in invitation list dialog if endpoint not ready (#5421)
- fix(lint): add test.skip and test.only lint (#5423)

## 1.8.10 (August 20, 2022)

- fix: should not open store when add component from search (#5417)
- fix: launcher logo issue (#5414)

## 1.8.9 (August 18, 2022)

- fix: blocklet setup failed due to database not init (#5405)
- fix: navigation link does not work as expected (#5402)
- fix: upgrading 502 issue by increase wait time (#5400)

## 1.8.8 (August 17, 2022)

- feat: support i18n for navigation link (#5391)
- chore: use latest blocklet list component (#5389)
- fix(ui): blocklet link point to other blocklet in list page (#5394)
- fix(ui): setup complete page does not work as expected (#5388)
- fix: should do redirect in launch page in blocklet is running (#5392)
- fix: should throw error if duplicate mountpoint is found (#5393)
- fix: security warning by upgrading dependencies
- fix: resolve bugs which related to adding component (#5376)
- fix: typo on blocklet config screen during setup

## 1.8.7 (August 10, 2022)

- feat: support get component mountPoints by Blocklet SDK and web api (#5364)
- feat: support set role in blocklet navigation item (#5365)
- feat: support run migration for blocklet component (#5340)
- chore: use correct fonts on result pages (#5352)
- chore: bump deps to latest safely (#5348)
- chore: update blocklet-list && remove unused api (#5338)
- chore: use react-router-v6 and migrate to emotion
- fix(dev): should support fill secure env to child component (#5361)
- fix(deploy): should not print mountPoint if deploying is not a component (#5362)
- fix: should not show env which is not shared in meta.js (#5354)
- fix: blocklet startup issue (#5347) (#5357)
- fix: blocklet urls should not be broken if an unavailable domain exists (#5344)
- fix: a few ui improvements (#5345)
- fix: register a node to blocklet-launcher (#5342)

## 1.8.6 (August 02, 2022)

- fix(dev): blocklet dev failed due to required environment (#5334)
- fix(cert-manager): error main field in package.json (#5332)
- chore(deps): bump cron to latest

## 1.8.5 (August 01, 2022)

- chore: optimize url-evaluation by reducing redundant requests (#5327)
- chore: polish @abtnode/types generating (#5323)
- chore(webapp): resolve issues related to component-tab and add-component (#5315)
- chore: remove warnning&&accessibility checkbox (#5314)
- chore: use react-script v5 for console and service building (#5312)
- chore: lock @blocklet/list version (#5329)
- fix: sometimes blocklet dev faild due to domainAliases not found (#5321)
- fix: should display component name when get meta faild (#5320)
- fix: should share parent env to child in "blocklet dev" (#5322)
- fix(core): more meaningful creation of transfer node audit logs (#5309)
- fix(nginx): clean up tmp files after checking nginx availability (#5307)
- ci: update pull request template #3143

## 1.8.4 (July 25, 2022)

- feat: send notification to administrator's wallet (#5293)
- feat: add a logs subpage to blocklet detail page & refactor logs page (#5278)
- feat: navigation for the same link should be removed (#5298)
- chore: make session manager v2 work with blocklet service (#5282)
- chore: add types generated from protobuf (#5301)
- chore: polish the ux of installing blocklet (#5285)
- chore: remove version check in blocklet list page (#5276)
- fix(dev): fix some bugs in "blocklet dev" (#5275)
- fix(spec): do not use package.json to parse blocklet meta anymore (#5302)
- fix: should stop or delete blocklet at any time (#5289)
- fix: duration problem with blocklet list table (#5297)
- fix: should report error if has incorrect field in meta when developing (#5294)
- fix: reset upgrade session when force server to none-maintenance mode on start (#5281)

## 1.8.3 (July 18, 2022)

- feat: improve ux of blocklet configuration page (#5248)
- feat: polish ux in launch workflow (#5249)
- feat(SDK): support get web endpoint of other components (#5252)
- feat(cli): support custom memory limit in "blocklet server init" (#5261)
- chore: integrate did-connect-v2 with blocklet sdk and service (#5256)
- fix: polish deleable text in blocklet config page (#5270)
- feat(cli): support default mountPoint for "blocklet deploy" (#5272)
- feat(cli): support reset server mode on start (#5271)
- chore(webapp): optimize static file prefetch (#5229)
- chore: polish duplicate checking of yarn.lock (#5242)
- chore: update deps & use @arcblock/terminal (#5267)
- chore: update graphql-playground related dependencies (#5251)
- chore: add blocklet-purchase templates (#5230)
- chore: update blocklet list component (#5228)
- chore(deps): bump moment from 2.29.3 to 2.29.4 (#5222)
- fix: typo in warning when download blocklet
- fix: some audit logs should displayed in blocklet detail page (#5257)
- fix: dependency cycles in @blocklet/meta and @abtnode/util (#5254)
- fix: ensure uniq vcId when purchase blocklet (#5244)
- fix(ui): double scroll bar on blocklet list (#5241)

## 1.8.2 (July 08, 2022)

- feat: send notification to app public channel (#5207)
- feat: support BLOCKLET_DEV_MOUNT_POINT for blocklet dev script (#5211)
- feat: separate the blocklet logger from the blocklet sdk (#5213)
- fix: the problem of http proxy failure in cli (#5217)
- fix(ui): polish blocklet version layout in blocklet list page (#5214)
- fix: throw an error when packing folders (#5210)
- fix: handleInstanceInStore method optimization (#5212)

## 1.8.1 (July 05, 2022)

- feat: add child step in launch workflow (#5150)
- feat: support add app url to Blocklet Store (#5148)
- feat: displays error details when the user makes a download error (#5179)
- feat: support for adding components from url (#5174)
- feat: support store-select delete or open registryUrl when adding component (#5196)
- feat: polish select store interaction when adding component (#5139)
- feat(cli): rename the root-did parameter to app-did (#5170)
- feat(bundle): gives a warning message when a file is duplicated (#5175)
- chore: update header addon icons (#5194)
- chore(core/schema): update build scripts and docs (#5197)
- chore: upgrade to arcblock-eslint-config 0.2.x and react-scripts 4.x (#5166)
- chore(webapp): fix some warnings (#5177)
- fix: error when packing folders (#5201)
- fix: polish the error file path in README.md (#5200)
- fix: no need to verify server vc when already logined in (#5198)
- fix(core): expired invitation is not deleted (#5183)
- fix: cannot install blocklet when content-type header missing (#5191)
- fix: resolve missing environments bug when adding component (#5185)
- fix(core): verify the invitation is valid before receive node (#5180)
- fix: should remove blocklet when process is canceled in blocklet dev (#5167)
- fix(core/cli): bundle fails when logo is not an image (#5169)
- fix(cert-manager): should reload nginx after updated certificate (#5156)

## 1.8.0 (June 25, 2022)

> After more than three months of polishing, 363 commits and 27 minor iterations, Blocklet Server version 1.8.0 was officially released on June 25, 2022.

To try out the latest version, you can run `npm install -g @blocklet/cli` to get it.

Blocklet Server 1.8.0 major updates:

## Blocklet Component

Composability is one of the core features of Blocklets. In version 1.8.0, the composability of Blocklets has been greatly enhanced

- Support for multi-level nested components
- Support unified Header/Footer for component
- Support combining multiple identical components in a blocklet

## Blocklet Launcher

- We have added a setup process to blocklet, which makes it easier for you to start an application
- We also refactored the process of dynamically adding components

## Blocklet Server

- Enhanced download protection for paid blocklets
- New Brand Logo for Blocklet Server
- Add audit log in Blocklet Server
- Support transfer blocklet server owner with owner nft
- UI improvements to the Blocklet Server console

## Better Developer Experience

- Blocklet SDK
  - support query and paging for getUsers api
- Blocklet Bundle
  - blocklet.md support reference local resource files
  - use README.md as a backup to blocklet.md
  - support bundle dapp in simple and esm mode
- Blocklet DEV
  - Support dev component from .env and reset data
  - Add or remove component in blocklet.yml by Blocklet CLI
  - `blocklet dev clear` supports resetting installed blocklet

## Other improvements

- feat(invitation): new invite landing page for blocklet-service
- feat(component): supports setting exact version and multiple source urls
- feat(connect): support switch profile and passport
- feat(security): support encrypt sensitive data in did-connect session
- feat(gateway): support request limit by client ip
- feat(router): make http2 support optional and adaptive
- Upgrade to react 18 and mui v5
- Lots of bug fixes and stability improvements

- feat(webapp): show expiration info and renewal link if available (#5141)
- fix: blocklet list durability issues (#5146)
- fix: android error pop-up window (#5144)
- fix: should not log error if blocklet not exist in getBlocklet() (#5143)
- docs: update server development doc (#5140)

## 1.7.27 (June 23, 2022)

- feat: refact the ux of adding dynamic component (#5044)
- feat: support config blocklet environments before installation in api
- feat(core): download paid blocklets with token generated from store (#5073)
- feat(api): add downloadToken field when installComponent
- feat: carry the signature of the server when downloading the paid blocklet (#5090)
- feat: change table to datatable for ux (#5024)
- feat: add webWalletUrl to result of metajs (#5136)
- feat(meta): update navigation, theme and add copyright in blocklet meta (#5104)
- feat(api): support query and paging for getUsers api (#5089)
- feat(core/cli): validate the size of blocklet logo (#5096)
- fix: db should be removed in db-proxy after blocklet deleted (#5086)
- fix: support i18n for error message in mount point configuration
- fix: "back to server" link should be properly displayed on setup page
- fix(cli): typo in warning when bundling blocklet logo (#5131)
- fix(webapp): incorrect did-connect path when adding component (#5130)
- fix: build webapp failed cause logo not found (#5110)
- fix(cli): should not print warning from dot-env #5106
- fix: too frequent requests to the api and failure to update paid blocklet (#5101)
- fix(webapp): server session expired on blocklet purchase/verify #5100
- fix: webapp build failed caused by lint error
- fix(core): keep download token var name consistent (#5088)
- fix: support checking app upgradable in component page (#5082)
- fix(webapp): nav active state for sub routes (#5066)
- fix: should remove blocklet if blocklet name is a number (#5093)
- fix: default sorting of blocklets list (#5078)
- chore: polish header and clean up code (#5105)
- refactor(blocklet-services): add schema-form to @abtnode/ux, and refactor the setup page (#5079)
- doc: add FAQ in server development doc #5063
- ci: remove integration tests on push-events (#5107)
- test: add test for nested component (#5097)

## 1.7.26 (June 18, 2022)

- fix(deps): lock cryptography related deps to avoid breaking

## 1.7.25 (June 11, 2022)

- fix: failed to get blocklet detail with runtime info (#5062)

## 1.7.24 (June 10, 2022)

- feat(ui): better reset handling for error-boundary (#5049)
- feat(ui): improve dashboard layout (#5032)
- feat(ui): optimize the typo when generating transfer nft invitation link (#5047)
- fix(dev server): should not kill other process after daemon is killed (#5060)
- fix(notification): should not log error if receiver is a server (#5055)
- fix: replace dns slot in blocklet detail with ip (#5048)
- chore(perf): move user avatar from db to fs storage (#5053)
- chore: update arcblock deps & wrap blocklet-list in error boundary (#5054)
- chore(cli): syntax error in cli prompt message (#5051)
- chore: update arcblock deps (#5058)

## 1.7.23 (June 07, 2022)

- fix(perf): remove geoip lookup to reduce memory consumption (#5038)

## 1.7.22 (June 03, 2022)

- chore(deps): bump internal deps to latest
- fix(webapp): crash caused by empty ownerNft field (#5028)
- fix(webapp): #5025 #5026

## 1.7.21 (June 02, 2022)

- feat(core): transfer blocklet via invitation link (#4961)
- feat(ui): add tooltip for action icon in component page (#5017)
- fix: complete issues about the UI (#5022)
- fix(text): fix text of component removing tip
- fix: audit log of addComponent should in blocklet scope (#5015)
- chore: polish passport color ux on blocklet setup (#5006)
- chore: polish invite landing page UI (#5021)
- chore(deps): bump dset from 3.1.1 to 3.1.2 (#4916)
- chore(deps): bump eventsource from 1.1.0 to 1.1.1 (#5008)

## 1.7.20 (June 01, 2022)

- feat(component): support nested composable blocklet (#4934)
- feat: new invite landing page for blocklet-service (#4963)
- feat(gateway): make nginx and upstream servers use keepalive connections (#4978)
- feat(cli): limit blocklet bundle size on upload (#4972)
- fix(core): disable update gateway for users without privileges (#5001)
- fix(webapp): the issue of the blocklet-details-page's icons (#4975)
- fix(webapp): move open-store-link from blocklet detail header to overview tab (#4971)
- chore: update blocklet-list component (#4980)
- chore: add sonarlint inspection code (#4968)
- chore: wallet friendly icon url in did connect (#4977)
- chore: bump deps to latest
- test(cli): add unit tests for changlog bundler (#4967)
- docs: update core/webapp/README.md, add some details (#5000)

## 1.7.19 (May 27, 2022)

- feat(ui): update blocklet store page in dashboard (#4917)
- feat(bundle): use README.md as a backup to blocklet.md (#4954)
- feat(bundle): better error message when referenced file not found in markdown (#4925)
- feat(bundle): support multilingual blocklet.md when bundling (#4935)
- chore: polish blocklet maintenance/not-running pages (#4938)
- chore: adjust SnackbarContent text color (#4929)
- chore: remove extra scrollbar from audit-logs page when loading data (#4927)
- fix(cli): sometimes blocklet dev fails on static blocklet (#4958)
- fix(cli): the problem of no protocol header link error (#4956)
- fix: improve accessibility of invitation link (#4926)
- fix: fix issue with truncating text in text-field label (#4928)
- fix(cli): more reliable local markdown resource detection (#4922)
- fix(cli): the problem of bundle error when the anchor point exists (#4921)
- doc: update server development doc
- ci(template): use comments instead of citations (#4920)

## 1.7.18 (May 21, 2022)

- fix(cli): blocklet bundle crash in monorepo

## 1.7.17 (May 20, 2022)

- feat(connect): use recent passport to login after recover/receive (#4883)
- feat: click on the launch logo to return dashboard (#4902)
- feat(cli): support case insensitive markdown file when bundling (#4900)
- feat: add support to search blocklets by domain (#4901)
- chore: remove repository field from blocklet overview (#4898)
- chore: polish result pages like welcome, 404, 500 (#4875)
- chore(webapp): polish switch component style on settings page (#4890)
- refactor: adjust url-evaluation hook logic & fix eslint error (#4908)
- fix(test): install from upload always failed in ci (#4913)
- fix(dev): routing rule should auto refresh in access page (#4909)
- fix(webapp): avoid flickering of blocklet link when remove blocklet (#4897)
- fix(cli): failed to render html with markdown (#4892)
- fix(service): login crash for guest user (#4891)
- fix: avoid audit logs page flickering on browser tab re-focus (#4882)
- ci: save error screenshot when cypress test fails (#4895)
- ci: update PR check list (#4910)

## 1.7.16 (May 16, 2022)

- feat: show nav in header for dynamic component without configration (#4871)
- fix: login page return 404 in wallet-playground (#4885)
- fix: the blocklet installed ux (#4880)
- fix: duplicate env shows in terminal of blocklet dev (#4872)

## 1.7.15 (May 16, 2022)

- feat(core): support transfer owner with owner nft (#4860)
- feat: support add or remove component in blocklet.yml by Blocklet CLI (#4859)
- feat(cli): support dev component from .env and reset data (#4813)
- feat(component): supports setting exact version and multiple source urls (#4855)
- feat: favicon of component should be same with blocklet (#4820)
- feat(gateway): record X-Forwarded-For in nginx access log (#4851)
- feat(webapp): no longer verify hold when auth by ownership nft (#4852)
- feat: auto mount navigation to app for dynamic component (#4841)
- feat(sdk): make blocklet env an frozen object
- feat(cli): support custom web-wallet-url when init server (#4844)
- feat: set proper user-agent when request from sdk and cli (#4839)
- feat(log): audit log for user login and switch profile/passport
- chore: upgrade to react 18 and mui v5 (#4862)
- chore(gateway): update access log format (#4846)
- chore(dev): deprecate env.appId from server dashboard dev mode
- chore(schema): change blocklet title length limit to 24
- fix: waiter ux in launch workflow (#4856)
- fix: setup page of custom created blocklet gets 404 (#4861)
- fix: crash and waiter ux in launch workflow (#4845)
- fix(test): install from upload sometime failed (#4836)
- fix: should setup work for custom path prefix blocklet (#4840)
- fix(log): should record audit log for blocklets on server start
- fix: should validate server version on blocklet dev (#4834)
- fix(service): check-running crash in blocklet service (#4829)
- fix(test): blocklet meta schema test broken

## 1.7.14 (May 10, 2022)

- fix(core): polish upgrade log and notification
- fix(cli): restart updater process on daemon restart
- fix(core): audit log crash when args empty
- fix(core): audit log links are broken
- chore(deps): bump ux to latest

## 1.7.13 (May 10, 2022)

- fix(ui): text input bug on the page of adding certificate (#4817)
- fix(core): upgrade stuck on cleanup phase (#4818)

## 1.7.12 (May 09, 2022)

- feat(cli): force reload for updater process on upgrade
- fix(core): proper error handling when start certificate-manager (#4812)
- fix(ui): certificate page crash on API request failure (#4811)
- feat(gateway): support request limit by client ip (#4795)
- feat(cli): support monorepo and optional changelog (#4808)
- feat(cli): blocklet.md support reference local resource files (#4787)
- fix(core): renewal certificate failed (#4803)
- chore(ci): add audit log to pull request check list
- fix(ui): timing of animation watier's message (#4802)
- feat(core): support adding same component multiple times (#4768)
- chore(ui): save form data on enter key (#4781) (#4800)
- feat(schema): blocklet title length limit (#4799)
- feat(service): use did-connect for blocklet fueling during setup (#4755)
- feat(core): support audit log for server and blocklets (#4780)
- feat(ui): add animation-waiter in launcher workflow (#4786)

## 1.7.11 (May 06, 2022)

- fix: cannot find auth.json in @blocklet/meta

## 1.7.10 (May 05, 2022)

- feat(certificate-manager): optimize certificate generation (#4756)
- feat(router): set worker_connections base on ulimit and worker_processes
- fix(gateway-nginx): set x-powered-by header bug
- fix: memory leakage caused by ajv.compile (#4773)
- fix(dev): environment should be reset to default value defined in meta (#4771)
- fix: polish error log for blocklet server start (#4769)
- fix: link is incorrect in navigation in **meta**.js (#4770)
- fix domain status context
- fix(webapp): session-manager responsive style issue (#4757)
- chore: allow to return back to server after setup completed (#4774)
- chore: add rounded corner for blocklet avatar (#4767)

## 1.7.9 (April 28, 2022)

- feat: dynamic bind user for initialized blocklet (#4752)
- feat: support get blocklet owner through server api (#4751)
- feat(sdk): add logger support in blocklet sdk (#4743)
- feat(router): make http2 support optional and adaptive (#4745)
- feat(routing): enable http2 in nginx routing engine (#4742)
- feat(connect): support switch profile and passport (#4737)
- fix: memory leakage in blocklet services (#4744)
- fix: change register server in safari (#4749)
- fix: remove migration backup dir in some situation (#4750)
- fix: ensure compatibility with nodejs v12 (#4748)
- chore(webapp): improve server-mode tag and access-keys page (#4736)
- chore: update PULL_REQUEST_TEMPLATE
- chore(ci): make sure the date header language in changelog is all in English (#4724)
- chore(ci): add version-check action (#4718)
- chore: remove invitedUnerOnly in auth config (#4721)

## 1.7.8 (April 23, 2022)

- feat(core): support verify delegation blocklet meta signatures
- feat(cli): support bundle dapp in simple and esm mode (#4663)
- fix(webapp): localStorage persistence for pageSize should work properly (#4703)
- feat(spec): add dist size for blocklet release (#4696)
- feat(webapp): polish the top navigation ui (#4695)
- feat(cli): support new server from custom sk and e2e mode (#4683)
- fix(service): cannot send notification to user from auth service (#4692)
- feat(dev): blocklet dev clear supports resetting installed blocklet (#4689)
- fix(service): did connect does not work as expected (#4691)
- chore(webapp): a few ui fixes and improvements (#4685)
- fix(webapp): polish vi in service workflow (#4673)
- fix(service): disable index.html caching for blocklet services (#4684)
- refactor(webapp): add url-evaluation hook & refactor urls evaluation logic (#4682)
- fix(service): should redirect to login page when visit child blocklet (#4676)
- fix(ui): polish blocklet component page (#4680)
- chore: remove useless code (#4671)
- feat(service): add version query to blocklet logo url (#4678)
- fix(webapp): blocklet detail page crash when installing (#4675)
- feat(spec): add whoCanAccess in auth service config (#4669)
- chore(build): update gql interface (#4666)
- chore(deps): bump js-yaml to latest
- chore(deps): bump moment from 2.29.1 to 2.29.2 (#4625)
- test(cli): add unit tests for blocklet.js (#4645)
- chore(dev): support build schema with docker cli (#4657)
- fix(test): fix npm run test error (#4643)
- fix(core): blocklet create exception (#4632)

## 1.7.7 (April 08, 2022)

- feat: use unified theme and navigation for components (#4609)
- feat: support hiding blocked members in list page (#4616)
- fix: two colours of spinner when logging in (#4607)
- fix: should generate did logo when developing blocklet (#4615)
- fix: help button link open fail on iOS device (#4606)
- fix: cannot send notification to user #4601 (#4614)
- chore: register launch by postMessage (#4613)
- chore: add issue template (#4612)

## 1.7.6 (April 07, 2022)

- feat(security): support encrypt sensitive data in did-connect session (#4602)
- fix: new server logo should be used everywhere (#4600)

## 1.7.5 (April 02, 2022)

- refactor: add url-evaluation module & refactor logic related to domain-status (#4572)
- fix(webapp): the primary main color use in launcher workflow (#4589)
- fix(webapp): ensure connect step is supervised on claim server (#4590)
- chore: polish url search params for launcher steps (#4587)
- fix(cli): return undefined and do not throw when config does not exist (#4585)
- chore(webapp): always show link when blocklet url is not accessible (#4586)
- feat: check for overwrite when run blocklet connect (#4576)
- chore(core): remove the warning that fs-extra is deprecating rmdir (#4581)
- fix: should allow error and goback when blocklet install failed (#4583)
- fix: should not show session component in top of setup page (#4578)
- fix: ui and text on launch workflow (#4574)
- chore: bump deps to latest (#4584)
- fix(cli): failed to start on nodejs v16+ (#4577)
- fix: add routing crashed after blocklet installed (#4575)
- fix(dev): should output blocklet url in terminal (#4567)
- doc: update server development doc
- chore(core): remove certificate related code from router manager (#4560)
- fix: should not declare default value for secure env (#4569)
- chore(deps): bump chain and common deps to latest
- chore: update blocklet card (#4565)
- fix(core): can not install blocklets on node v17 (#4566)
- fix: should use blocklet meta did avatar as default (#4562)
- fix: should redirect to login page after receive passport (#4563)
- fix(security): blocklet setup should be protected by server passport (#4561)
- feat(connect): support switch did and elimate noisy connect (#4559)
- chore(webapp): update logo and favicon (#4557)
- fix: polish blocklet upload message (#4556)
- chore(webapp): tweak style of button on blocklet card (#4549) (#4551)
- fix(sdk): toBlockletDid crash when input starts with z (#4554)
- chore: update pull request template
- chore: polish `blocklet create` command description (#4552)

## 1.7.4 (March 30, 2022)

- fix: polish log of migration script of 1.7.1
- fix: should dynamic config chain of fuel (#4531)
- fix: the launcher logo is displayed briefly when accessed from the launcher (#4528)
- chore(webapp): polish notification list and passport tag (#4529)
- fix(service): should be compatible with previous blocklet logo url (#4522)
- chore: update github pull request template
- fix(cli): brand banner file not included in package files (#4523)

## 1.7.3 (March 29, 2022)

- fix: auth config in meta does not take effect

## 1.7.2 (March 29, 2022)

- fix(publish): latest version install failed

## 1.7.1 (March 29, 2022)

- feat: support blocklet setup process (#4447)
- feat: polish ux in launch blocklet workflow (#4442)
- feat(core): use dynamic did-connect claims for better login ux (#4435)
- feat(webapp): skip license when login to server created in launcher (#4439)
- feat(webapp): support view logs for service (#4469)
- feat: support not staging messages for notification service (#4465)
- feat: echo brand with first command after install @blocklet/cli (#4463)
- feat: show who can access in blocklet detail page (#4504)
- fix(webapp): no access url available in some cases (#4501)
- fix: should redirect to login page after get back passport (#4498)
- fix(routing): default engine crash on manipulate dynamic composed blocklets (#4497)
- fix(cli): trim and ensure param type on server init (#4471)
- fix(core): certificate expiration check and alert broken (#4460)
- fix: move frontend deps to devDpes in service package (#4457)
- fix: use `npx create-blocklet@latest` replace `npm init blocklet` in `blocklet create` command (#4455)
- fix: blocklet dev logs not fully piped to console (#4451)
- fix(routing): chained proxy not working in default engine (#4445)
- fix: default value of shared should be false if secure is true (#4433)
- chore(vi): ui/vi improvements (#4462)
- chore: support daemon api in blocklet-services (#4434)
- chore: change all login to connect for consistent ux (#4441)
- chore: open launch process in current window (#4437)
- chore: bump deps to latest

## 1.7.0 (March 18, 2022)

> After more than three months of polishing, 353 commits and 30 minor iterations, Blocklet Server version 1.7.0 was officially released on March 18, 2022.

To try out the latest version, you can run `npm install -g @blocklet/cli` to get it.

Blocklet Server 1.7.0 major updates:

## Dynamically add components for Blocklet

Composability is one of the core features of Blocklets. In version 1.7.0, the composability of Blocklets has been greatly enhanced, and you can dynamically combine different blocklets together.

You can also create your own Blocklet, add some components, export this Blocklet, and upload it to your own github.

## Blocklet Launcher

We improved the Blocklet launcher process, you can easily launch a Blocklet from the Blocklet Store

## Better Developer Experience

- Support for installing @blocklet/cli using pnpm
- Blocklet SDK: Added more APIs, see https://docs.arcblock.io/abtnode/en/developer/blocklet-sdk
- Blocklet CLI: `blocklet config` supports `--profile` to store multiple configs. You can view detailed instructions with `blocklet config --help`
- Blocklet DEV: When developing a blocklet, support clearing all data of this blocklet through `blocklet dev clear`
- More robust service gateway: We support a pure JavaScript version of the service gateway for Blocklet Server, so that developers can run Blocklet Server without nginx environment
- Product name change for developers: data directory, configuration file, name change of some configuration items

## Other improvements

- Support for accessing blocklets through DID Domain, which significantly improves the accessibility of Blocklets in decentralized networks
- We've significantly improved Blocklet Server security in this release. All private information will be encrypted before storage
- Redesigned the style of the pass
- Supports two-way communication between Blocklet and DID Wallet
- Lots of bug fixes and stability improvements

- fix: update passport color in lost passport page (#4422)
- chore: polish ux for register dialog (#4406)
- chore(deps): bump chain and common deps to latest
- feat: blocklet environments support shared property (#4405)
- fix: only enforce insecure-upgrade when visiting in https (#4410)

## 1.6.31 (March 18, 2022)

- fix(webapp): fix broken link on debug page (#4354) (#4404)
- fix(routing): port selection should be part of routing engine (#4403)
- fix: should disable start in start page if blocklet is starting (#4399)
- fix: mobile ux for launch workflow (#4401)
- fix: status of redirect rule is incorrect in blocklet detail page (#4402)
- fix: should use live generated jwt token for websocket auth (#4400)
- chore(webapp): add open button on agreement (#4391)
- feat(ci): prune remote branches on each release
- fix: csp meta caused dev issue (#4398)
- feat(webapp): support non-standard ports if 80/443 not-available (#4395)
- fix(cli): failed to bundle extra javascript files in monorepo (#4392)
- fix(webapp): logging should work properly when page is first loaded (#4363) (#4396)
- fix(webapp): access-url inconsistency when using non-standard port (#4390)
- feat(webapp): enhanced auditing and display of access keys (#4380)
- fix(webapp): some mobile display issues (#4387)
- chore(webapp): fix browser console warning
- fix(ci): coverage report for webapp is incorrect (#4386)
- fix(webapp): server dashboard and blocklet service should use same locale (#4384)
- fix(routing): default engine not working for blocklets with assets (#4381)
- fix(core): blocklet access url inconsistent and missing locale (#4382)
- fix(dev): cleanup script support both test and dev mode (#4379)

## 1.6.30 (March 14, 2022)

- fix(webapp): launch crash when node info not loaded (#4376)

## 1.6.29 (March 12, 2022)

- feat: launch application display skeleton (#4370)
- fix: should be backward compatible for @abtnode/auth-service (#4371)
- fix: encrypted data is displayed incorrectly in start page (#4364)

## 1.6.28 (March 11, 2022)

- feat: support config and start blocklet from well-known service (#4291)
- fix(webapp): install blocklet failed when logged in
- chore(webapp): tweak split-button styles (#4336) (#4345)
- chore: replace install to launch (#4343)

## 1.6.27 (March 10, 2022)

- chore: polish domain/urls list on blocklet detail page (#4322)
- fix(core): deprecate deps with native binding (#4321)
- fix(webapp): crash when login with nft on unclaimed server (#4320)
- fix(webapp): use current http protocol to check url (#4314)
- fix(tools): case sensitive module require (#4313)
- chore: remove logic related to downloading certificates (#4181) (#4305)

## 1.6.26 (March 10, 2022)

- chore: test release for upgrading

## 1.6.25 (March 09, 2022)

- fix(cli): updater crash on upgrade

## 1.6.24 (March 09, 2022)

- chore: add e2e test case for blocklet launch workflow (#4300)
- chore: checking status with polling when installing blocklet (#4304)
- chore: tune breadcrumb link color on blocklet detail (#4303)
- chore: resolve the react-error-overlay problem (#4302)
- fix(cli): should crash early when ports already occupied (#4299)
- chore: improve ux for components and certs table (#4301)
- chore(deps): bump chain and common deps to latest
- fix(webapp): download ip and did domain certificate in development (#4296)
- fix(core): crash issues on dev mode with default routing engine (#4295)
- fix(core): certificate matching error in default routing engine (#4294)
- chore(deps): bump url-parse from 1.5.7 to 1.5.10 [skip ci] (#4263)
- fix(core): better error handling and more stable luanch workflow (#4290)
- fix(cli): should not crash when no config for profile (#4289)
- chore: update the latest ux package (#4277)
- fix(ui): get accessible url bug (#4275)
- feat(cli): support profile when run blocklet connect (#4276)
- chore: unified blocklet launch authentication (#4270)
- fix: logo display error when launching the app (#4274)
- feat(ux): more reliable blocklet url selection (#4266)
- feat(cli): encrypt session data when run blocklet connect (#4272)
- fix(cli): max_cluster_size not defined error
- chore(deps): bump chain and common deps to latest
- feat: a light weight node.js based routing engine (#4228)
- fix: firstPageUrl error (#4265)
- chore: unify blocklet launch process (#4256)
- fix: should not get runtime info from empty blocklet (#4262)
- fix: did avatar related ui (#4259)
- chore(deps): bump url-parse from 1.5.7 to 1.5.10 [skip ci] (#4244)
- chore: tweak member avatar styles (#4253)
- fix: getSysInfo make daemon crashed (#4251)
- fix(core): disk info and alert not working for multiple device (#4250)
- feat(cli): add 'blocklet connect' command (#4240)
- fix(core): launch paid blocklet failed (#4249)
- fix: logger config for audit file (#4246)
- fix: duplicate child and unexpected error notification on "blocklet dev" (#4245)
- feat: support add remark for trusted passport issuer (#4243)

## 1.6.23 (February 25, 2022)

- feat: support export custom created blocklet (#4221)
- feat: update server folder name and config file name (#4225)
- feat: make meta web api similar with Blocklet SDK (#4223)
- feat(core): make blocklet server can work with pnpm (#4222)
- feat: reuse blocklet detail from blocklet store (#4213)
- fix: blocklet source should not be url if meta is in a registry (#4238)
- fix: shell.exec should be silent when locate npm global
- fix(core): bad secret key size error on server and blocklets (#4220)
- fix: disable scale on mobile to avoid styling issues (#4217)
- fix(sdk): ensure appInfo.link for child blocklets are same as root (#4214)
- fix(ui): routing.adminPath appending condition
- fix: slack hook use public address (#4216)
- fix: increase server_names_hash_bucket_size to 512 in nginx config (#4203)
- fix: show special tag for blocklets in dev mode (#4210)
- fix: remove extra scroll bar on dialog (#4198)
- fix(auth): login or launch blocklet by vc (#4200)
- chore: limit blocklet name length to 32 and change did domain format (#4237)
- chore: replace @arcblock/abt-launcher with @blocklet/launcher-layout package (#4206)
- chore(deps): bump chain and common deps to latest
- refactor: migrate @abtnode/service-loader to @abtnode/blocklet-services (#4229)

## 1.6.22 (February 18, 2022)

- fix: link problem about slack hook (#4171)
- fix: blocklet payment does not work in store page (#4180)
- fix: should show server mode tip in debug page (#4196)
- fix: increase server_names_hash_bucket_size in nginx config (#4188)
- fix: should show 404 page for blocklet if / not in routes (#4185)
- fix(ui): fix blocklet button styling (#4187)
- fix: 404 routing rule does not show in access page (#4184)
- fix: should support run migration for dev server (#4183)
- chore(deps): bump chain and common deps to latest
- chore(deps): bump url-parse from 1.5.4 to 1.5.7 (#4177)

## 1.6.21 (February 17, 2022)

- fix(cli): wildcard cert download tip
- feat(core): download and use wildcard certificate for did domain (#4169)
- fix(ui): hide root blocklet status in component page (#4174)
- fix: should not log previous logs in blocklet dev (#4175)
- feat: upgrade blocklet meta for children (#4172)
- feat: support dynamic installation of paid components (#4167)
- feat: ensure required environments when run blocklet exec (#4168)
- feat: support new nft when verify-owner and launch blocklet (#4166)

## 1.6.20 (February 16, 2022)

- feat: support send message from wallet to blocklet (#4158)
- feat: support get blocklet by app did (#4159)
- chore: using filter list to send vc claim (#4163)
- chore(deps): bump vm2 from 3.9.5 to 3.9.7 (#4153)
- chore: using filter list to send vc claim (#4144)
- fix: should not show component disabled blocklet in adding list (#4149)
- fix: blocklet status should update after "blocklet dev start" (#4162)
- fix: polish display for ssl certificate table (#4157)
- fix: issues with installing blocklet process (#4143)
- fix(ui): end-user-license-agreement ux polish (#4142)
- refactor(ui): polish layout of the about page (#4145)
- chore(deps): bump chain and common deps to latest
- chore(deps): bump follow-redirects from 1.14.7 to 1.14.8 (#4140)
- ci: should create new dev branch from latest commit (#4141)

## 1.6.19 (February 11, 2022)

- feat: display blocklet component status in dashboard (#4129)
- feat: add capabilities.component in blocklet meta spec (#4124)
- fix: deploy blocklet failed if bundle not change (#4136)
- fix(ui): show blocklet runnint tooltip on delete button (#4137)
- fix(ui): should show proper error when blocklet not found (#4127)
- fix: createPassportSvg should not throw error if missing params (#4122)
- fix: output url of blocklet dev should use did domain or ip echo domain (#4121)
- fix(ux): unify blocklet access url in dashboard (#4118)
- fix(upgrade): failed to check new version (#4117)
- doc: update README.md in webapp
- chore(deps): bump chain sdk and common deps to latest (#4125)
- chore(deps): bump simple-get from 2.8.1 to 2.8.2 (#4108)
- chore: update blocklet (#4128)
- chore: fix blocklet z-index (#4115)

## 1.6.18 (February 08, 2022)

- fix(cli): blocklet hooks should be silent when stop server
- feat(cli): support execute script within blocklet context (#4105)
- fix(cli): cannot dev blocklet server if baseUrl does not in env (#4104)
- feat(core): better blocklet hook/migration execution logging (#4099)
- fix(core): make did-domain optional and tune blocklet domain (#4088)
- feat: display maintenance info when blocklet is starting (#4095)
- feat: support dev blocklet by server in dev environment (#4090)
- fix: polish blocklet display name across the console (#4071)
- chore(deps): bump cached-path-relative from 1.0.2 to 1.1.0 (#4020)
- fix: e2e test always failed (#4089)
- fix: enforce length limit for blocklet title (#4086)
- fix: autoUpgrade config is always false after rebranding (#4087)
- chore: fix blocklet button hover (#4085)

## 1.6.17 (January 30, 2022)

- feat: support dynamically add component (#4021)
- feat: support remote deploy dynamic blocklet (#4033)
- feat: support custom create empty blocklet (#4013)
- feat: polish ui of result pages (#4038)
- feat(security): support trust external-only passports completely (#4022)
- feat(cli): add command "blocklet create" (#4066)
- feat(cli): remove command "blocklet publish" (#4040)
- feat(cli): tips after blocklet upload (#4015)
- feat(cli): add cli upload printInfo (#4014)
- refactor: move mountPoint from meta.children to children (#4016)
- fix(cli): should not use default store for explicit profile on upload (#4011)
- fix: increase nginx worker_connections to 10K (#4012)
- fix: hide abtnode agreement after initialized (#4032)
- fix: debug page crashed (#4009)
- fix: dynamic component is lost after blocklet upgraded (#4067)
- fix: blocklet uptime is incorrect in dashboard (#4069)
- fix: polish ux of dynamic component (#4065)
- fix(core): remove node name and description from process.env (#4064)
- fix(core): should only check self aliveness when start component blocklet (#4063)
- fix(core): should early throw if blocklet start failed (#4036)
- fix: passport theme not match between wallet and console (#4039)
- chore(deps): bump chain sdk and ux to latest

## 1.6.16 (January 21, 2022)

- feat: support theming for passport nft display
- feat: support permanant url in blocklet runtime environment
- feat(cli): support customized ip-cert download url from env
- feat(core): use production did domain and did registry
- feat(ui): change blocklet icon shape from circle to rect
- feat(ui): polish launch screen for paid blocklets
- feat(dashboard): add link to store in store switcher
- feat: add blocklet-launcher integration back
- fix: bad secret key size error during blocklet lifecyle
- fix(dashboard): remove duplicate alert when config failed
- fix(sdk): tune blocklet sdk env lib
- fix(sdk): tune utils to make bundle smaller
- fix: polish uptime in blocklet list page
- fix: should return html error page
- fix: early throw when launch an already installed blocklet
- fix: launch blocklet blocklet show did-avatar
- fix: incorrect shares and factory issuers when upload paid blocklets
- fix: launch blocklet button width
- fix: blocklet store detail page crashed
- fix: should not show blocklet new version alert in dev mode
- chore(deps): bump shelljs from 0.8.4 to 0.8.5

## 1.6.15 (January 14, 2022)

- feat: polish display for blocklet server passport nft (#3875)
- feat: support keeping routing config on blocklet remove (#3927)
- feat: polish launcher blocklet ui (#3933)
- feat(certificate-manager): do not issue certificate for did domain (#3929)
- feat: add "feed" notification type (#3931)
- feat: add express middleware, env, blocklet wallet for SDK (#3918)
- feat(cli): support claim test tokens from faucet for dev command (#3920)
- fix: should not remove data when install blocklet faild (#3940)
- fix: should return pretty error message when create permission failed (#3922)
- fix(service): should receive passport when blocklet is not running (#3924)
- fix(cli): do not create blocklet-purchase-factory on upload (#3923)
- fix: e2e test always failed (#3930)
- doc: update doc of blocklet SDK
- ci: auto create dev branch after publish (#3917)

## 1.6.14 (January 12, 2022)

- feat: support clear blocklet data in development mode (#3912)
- feat(sdk): skip notification validation in debug mode (#3906)
- feat(cli): add alias "ls" for "blocklet config list" (#3908)
- fix: should develop blocklet under the server in debug mode (#3907)
- refactor: use @arcblock/did-connect to get web wallet url (#3905)

## 1.6.13 (January 11, 2022)

- fix(router): update well-known rule bug (#3896)

## 1.6.12 (January 10, 2022)

- fix(deps): crash caused by colors lib

## 1.6.11 (January 10, 2022)

- fix(deps): lock colors version to 1.4.0 in blocklet/cli package

## 1.6.10 (January 10, 2022)

- feat(core): support delete protection for blocklets (#3880)
- fix(cli): show uptime on blocklet server status command (#3885)
- fix(cli): some typos after rebranding abtnode to blocklet server (#3884)
- fix(docker): replace "abtnode start" with "blocklet server start" (#3882)
- fix(core): should try the original store on blocklet upgrading (#3879)
- fix(core): use name to identify node when sending integration messages

## 1.6.9 (January 09, 2022)

- fix(cli): pin colors@1.4.0 in yarn (#3877)
- fix(cli): lock colors dependency to 1.4.0 (#3876)
- fix(cert-manager): get normal certificate bug (#3870)
- fix(cli): should not gen did domain for blocklets run in dev mode (#3869)
- feat(cli): better error handling when update did-doc (#3868)
- fix(ui): blocklet domain & url page crashed bug (#3866)
- fix(webapp): fix position problem of notification-list (#3859) (#3864)
- fix(cli): false positive when assert public ip accessibility (#3867)
- feat(cli): add spinner when updating did document (#3865)
- fix(cert-manager): renewal certificate bug (#3846)
- fix(queue): should check doc existence before reading props (#3847)
- fix(security): ensure no collision app sk for blocklet instances (#3845)
- feat(core): support did domain address (#3774)
- fix(core): share public config between parent and child blocklet (#3842)
- fix(security): wipe sensitive data in socket event data (#3841)
- fix(security): ensure no sensitive blocklet data in logs (#3840)

## 1.6.8 (January 05, 2022)

- fix(certificate-manager): pack npm package bug

## 1.6.7 (January 05, 2022)

- fix(cli): download certificate output (#3830)
- fix(cli): abtnode init --> blocklet server init
- feat(cli): support profile for config and upload command (#3816)
- chore(i18n): update i18n for launch workflow (#3817)
- fix(cert-manager): http-challenge bug when run in daemon (#3813)
- chore: replace ux/graphql-playground with @arcblock/graphql-playground (#3815)
- chore: remove unused did-logo fonts (#3808)
- fix(upgrade): check if nextVersion is empty before comparing nextVersion and curren version (#3810)
- fix(core): should reset nextVersion when upgraded to newer version (#3806)
- chore: merge with master
- feat(core): embed certificate manager in daemon (#3793)
- fix(service): typo for reserver proxy error handling (#3799)
- feat: use ip dns endpoint when developing blocklet (#3798)

## 1.6.6 (January 03, 2022)

- fix router: updateRoutingRule method bug

## 1.6.5 (December 30, 2021)

- fix(security): better sensitive data protection logic (#3794)
- fix(ui): uptime in blocklet list page is incorrect (#3792)

## 1.6.4 (December 29, 2021)

- feat(security): encrypt and protect sensitive data (#3787)
- refactor(ui): polish blocklet launch workflow (#3784)

## 1.6.3 (December 24, 2021)

- feat: add server and deprecate abtnode in blockletSpec.requirements (#3775)
- feat: change url of store meta api (#3782)
- fix: blocklet domain failed to create if "\_" in blocklet name (#3781)
- fix: "uptime" should not be start time (#3780)
- docs: polish doc of contribute (#3779)
- ci: add pr title lint (#3777)

## 1.6.2 (December 22, 2021)

- chore: rename docker image name (#3772)
- fix(cli): optional chaining syntax caused crash (#3771)
- chore(deps): bump ocap and ux deps to latest (#3770)
- fix(cli): tune block upload command output (#3765)
- fix(ui): launch-blocklet layout and more about agreement (#3764)

## 1.6.1 (December 17, 2021)

- feat: return blocklet name and description in meta.js api (#3754)
- fix: should display blocklet stopped time (#3757)
- fix: api perf warning should not in error log (#3756)
- test: reopen integration tests case for blocklet manager (#3744)
- test: test https certificate is outdated (#3755)

## 1.6.0 (December 10, 2021)

Since 1.5.0 release of ABT Node, after 21 releases and 175 commits was created, now we proudly present to you ABT Node 1.6.0

## Product name change

- For User
  - Rename `ABT Node` to `Blocklet Server`
- For Developer
  - Upgrade `@abtnode/cli` to `@blocklet/cli`
  - Upgrade `abtnode <action>` to `blocklet server <action>`

## Blocklet Server

- Support custom name and description when creating Blocklet Server
- Support Blocklet-based access address, routing, and security configuration
- Install the application via Launcher: greatly optimize UI/UX, support responsive layout
- Provide support for "getting applications for zero configuration" on the Blocklet Server side: you can install and start an application through a pass when you are not logged in
- Better DID Connect 2.0 support: Log in to ABT Node, log in to Blocklet, and the process of buying Blocklet also supports DID Connect 2.0 interaction
- Provide better Websocket support for Blocklet: Websocket server supports working in blocklet cluster mode

## Blocklet Spec

- Blocklet can only declare one web interface
- Support the ability to extend server through `wellknown` type interface
- Charge related configuration through the `charging` attribute

## Blocklet Develop

- Support for adding custom data migration scripts for Blocklet
- Blocklet SDK adds NeDB-based Database

## Performance and safety

- Event hub message service supports grouping, enhancing the isolation between blocklet and abtnode.
- Improve the access speed of blocklet list page and detail page; reduce the front-end static resource package volume by 70%.

## 1.5.21 (December 09, 2021)

- feat: rebrand cli package and command for developers (#3717)
- feat: automatic updater supports @blocklet/cli (#3719)
- fix(auth): token in cookie should not take effect in subdomains (#3721)
- fix: blocklet access url port is incorrect (#3720)
- fix: polish text of no blocklet tip for rule selector (#3722)
- fix: blocklet/sdk database paginate (#3711)
- test: polish ci of coverage reporting (#3716)
- doc: update development docs (#3710)

## 1.5.20 (十二月 06, 2021)

- feat: meta.charging -> meta.payment (#3694)
- chore: bump deps to latest (#3699)
- fix: ip dns domain should not be used by user (#3689)
- fix: auto fill https:// for store endpoint (#3690)
- fix: rules of composite blocklet should be grouped together (#3692)
- fix: blocklet url port is lost if port is not 80 or 443 (#3691)
- fix: endpoit of blocklet server is lost in debug page (#3693)
- feat: save remark of invitation to memberInfo (#3688)
- fix: increase healthy check time to 10s for eventHub and dbProxy (#3687)
- feat: display status dot to left of blocklet name (#3686)

## 1.5.19 (December 01, 2021)

- feat(ui): rename marketplace to store (#3680)
- feat: return scheduler instance when init cron
- feat: update blocklet spec version (#3681)
- chore: add spec for parse files check (#3684)
- chore: use debug as logger for cron and queue package (#3683)
- fix some ui bug in launch blocklet page (#3682)

## 1.5.18 (November 29, 2021)

- fix: disable state of button is lost (#3677)
- feat(text): polish text of blocklet router (#3671)

## 1.5.17 (November 29, 2021)

- polish launch blocklet ui (#3666)
- fix: launch blocklet ui (#3662)

## 1.5.16 (November 28, 2021)

- fix: blocklet access url is incorrect if node domain is custom (#3664)

## 1.5.15 (November 27, 2021)

- feat: support router configuration based on blocklet (#3625)
- feat: blocklet can declare only one web interface (#3618)
- feat(ui): remove dot before blocklet interface #3634
- chore: rebrand ABT Node to Blocklet Server (#3627)
- chore: rebrand registy name and address (#3646)
- chore: rebrand blocklet store related code (#3623)
- fix: should use generic bearer key (#3620)
- fix: Using target="\_blank" without rel="noopener noreferrer"
- chore: bump deps to latest

## 1.5.14 (November 19, 2021)

- fix: blocklet migration and blocklet hook security enhancement (#3607)
- fix: page refresh issue during blocklet launch workflow (#3613)
- chore: bump deps to latest

## 1.5.13 (November 17, 2021)

- feat: handle upgrading during blocklet launch workflow (#3605)
- feat(auth service): support set auth token in header, query, body (#3609)
- fix: blocklet registry cannot upgrade from blocklet registry (#3610)
- fix: blocklet pre-start should be blocked if has unhandledRejection (#3602)

## 1.5.12 (November 13, 2021)

- chore: responsive support for blocklet launch workflow (#3600)
- fix: blocklet hooks preDeploy error (#3599)
- chore(deps-dev): bump remark-html from 12.0.0 to 13.0.2 (#3596)

## 1.5.11 (November 09, 2021)

- chore: update deps to latest (#3592)
- fix: enable cors for ip.abtnet.io subdomain (#3589)
- fix #3586
- fix: auth service scan message
- chore: remove blocklet developer:init command (#3582)

## 1.5.10 (November 04, 2021)

- feat: latest launch blocklet ui and workflow (#3576)
- chore: move blocklet hooks lib to proper location
- chore: bump chain deps to latest
- feat: a common blocklet migration flow (#3570)
- test: upgrade jest to 27.3.1 (#3574)
- feat: blocklet sdk database (#3569)
- feat: support name and description customization on node init (#3561)

## 1.5.9 (October 28, 2021)

- hotfix: jwt dependency error

## 1.5.8 (October 28, 2021)

- feat: support did connect 2.0 for login to dashboard or blocklet (#3549)
- feat: polish blocklet upgrade signature check (#3553)
- fix: issue-passport page is not accessiable in auth-service (#3552)

## 1.5.7 (October 22, 2021)

- feat: use static welcome page and add debug page (#3533)
- fix: the first user of invited-only blocklet should be owner (#3538)
- fix inappropriate way of throwing exceptions (#3528)
- fix: should disable upgrade button when blocklet is upgrading (#3527)
- test: add test for blocklet routing (#3532)
- chore: bump depedencies to latest (#3541)

## 1.5.6 (October 19, 2021)

- feat: add "hasPermission" api (#3502)
- feat: add proxy warnning to 'blocklet dev command' (#3517)
- feat: remove support for zero framework (#3518)
- feat: return html page if blocklet is not running (#3494)
- chore: expose granting related api in blocklet sdk (#3500)
- chore: replace @abtnode/event-hub with @arcblock/event-hub
- chore: add blocklet/sdk document (#3511)
- chore: optimize the launch application page (#3503)
- perf: optimize performance of blocklet list api (#3489)
- perf: optimize performance of blocklet latest version api (#3489)
- perf: cache external accissible ip (#3522)
- perf: optimize getIp() for development (#3495)
- fix: add tail slash redirect if GET request only (#3493)
- fix: well-known routing bug in dashboard alias domain (#3504)
- fix: blocklet detail page crash if blocklet does not exist (#3508)
- fix: blocklet upload command (#3510)
- fix: e2e test always fails in github action (#3516)
- chore: bump chain deps to latest

## 1.5.5 (October 09, 2021)

- hotfix: compatible old `blocklet config` command

## 1.5.4 (October 09, 2021)

- feat: add performance log for gql api (#3486)
- feat: support the use of service ownership nft when launching blocklets (#3483)
- fix: better blocklet config and blocklet upload (#3484)
- fix: get blocklet registry meta bug (#3481)
- fix: access key check should allow lower case etherum addr (#3479)

## 1.5.3 (October 02, 2021)

- feat: support standalone blocklet launch page (#3462)
- fix: issue passport page return 404 (#3477)
- chore: use websocket package from arcblock scope (#3466)
- feat: blocklet upload command (#3453)
- feat: increase token ttl to 1day for web wallet (#3467)
- perf: reduce bundle size (#3465)
- perf: reduce bundle size (#3464)
- fix(ux): should not mutate registry if no permission (#3463)
- chore: bump chain deps to latest
- fix: blocklet access path is occupied (#3458)
- feat: remove register url in abtnode (#3446)

## 1.5.2 (September 28, 2021)

- feat: support did-connect 2.0 (#3451)
- chore: polish ui (#3452)

## 1.5.1 (September 26, 2021)

- fix: lock phoenix to 1.5.x
- chore: bump chain deps to latest
- fix: ensure permission failed after blocklet installed (#3445)

## 1.5.0 (September 18, 2021)

Since 1.4.0 release of ABT Node, after 14 releases and 161 commits was created, now we proudly present to you ABT Node 1.5.0

## 团队管理

- UI has been greatly optimized: redesigned team management, pass management, permission management pages and interactions
- You can use DID wallet to retrieve your lost passport
- Support to configure the permissions of an external passport: When a member uses an external passport to access your blocklet, you can specify whether the passport is valid and what permissions it has

## Blocklet

- Automatically generate a secure access address with an independent domain name for each blocklet (base on IP Echo DNS domain)
- Support the create websocket connection with auth by Auth Service
- Blocklet SDK supports permission management API (based on RBAC)
- Support setting application ID based on ETH format for Blocklet

## ABT Node

- Significantly improve the experience of using Docker

## UI Optimize

- Redesign the page and interaction of team management, pass management and permission management
- Brand new DID Connect component
- Added about page
- Some list pages in Dashboard support paging

## Other

- Some bug fixes, stability optimization, security optimization

## Bug fix

- fix: blocklet routing is missing after upgraded (#3441)
- fix: should not display ip-dns-domain endpoint in gitpod (#3438)
- fix: add cors of webwallet url for each blocklet endpoint (#3431)
- fix: remove system blocklet site if ip-dns-domain is not 888-888-888-888 (#3432)
- fix(ui): should not trim remark when inputing (#3434)
- fix: .blocklet/proxy does not work in ip-dns-domain of blocklet (#3433)
- fix(ui): healthy status is incorrect when abtnode is stopping (#3435)
- fix: passport permissions is missing after blocklet reinstalled (#3436)
- fix: update button in verison is missing (#3415)
- fix: purchase blocklet failed on end (#3430)
- fix: print more error output when node daemon start failed (#3410)
- chore: bump chain deps to latest
- chore: update test-xxx-yyy-test.arcblockio.cn test certificate

## 1.4.14 (September 17, 2021)

- fix: eth wallet type not respected on block install
- fix: htmlAst not stripped as expected when install blocklet
- chore: bump chain deps to latest
- fix(ui): polish action button of cert-setting page (#3405)
- fix(ui): restarting stage is too short when upgrading node (#3406)
- fix: should not display upgrade blocklet btn if no permission (#3399)
- feat: remove blocklet endpoint of pathPrefix in dashboard (#3404)
- feat: support dynamic ip dns domain for blocklet (#3398)
- chore: move design diagrams to github repo
- fix: upgrade abtnode failed in docker (#3397)
- fix: missing port number when redirecting in docker
- feat(ui): polish dialogs (#3392)

## 1.4.13 (September 10, 2021)

- fix: failed to install blocklets when initializing node

## 1.4.12 (September 09, 2021)

- feat: install blocklet via vc and simple did resolver (#3376)
- feat: show tip if external issuer is not trusted (#3379)
- fix(ui): trusted issuer was not refreshed in real time (#3383)
- fix: broken layout on login page (#3388)
- fix: node owner passport should include type of ABTNodePassport (#3386)
- fix: support 32 bytes custom blocklet sk
- fix: getBlockletInfo requires nodeSk as param (#3382)
- fix: delete confirm text should support i18n (#3378)
- chore(deps): bump tar from 4.4.15 to 4.4.18 (#3377)
- chore: bump chain deps to latest

## 1.4.11 (September 06, 2021)

- fix: env of child blocklet should be overwritten by parent

## 1.4.10 (September 03, 2021)

- feat: support custom wallet type for blocklet (#3348)
- feat: polish ui of blocklet interface (#3335)
- feat: more api for blocklet/sdk (#3322)
- feat: admin can disable passport issuance in a team (#3359)
- feat: add pagination in member list page and notification list page (#3357)
- feat: replace CircularProgress with ux/spinner (#3338)
- fix: cannot upgrade remote-deployed blocklet from marketplace (#3340)
- fix: font resource return 400 in did wallet in chrome (#3351)
- fix: spinner broken style when checking node version (#3372)
- fix: polish style of passport detail page (#3370)
- fix: layout of member list page in mobile (#3371)
- fix: https request failed if https_proxy exists (#3356)
- fix: integration test failed in ci (#3358)
- fix: refresh ip dns domain endpoint for blocklet when starting abtnode (#3342)
- fix: improve responsive layout of blocklet list (#3341)
- fix(ui): polish auth page for mobile (#3337)
- fix(ui): tune did-auth ui on verify-purchase dialog (#3339)
- refactor: replace mui dialog with ux/dialog (#3360)
- refactor: layout refactor to fix sidebar flash (#3336)
- chore: bump chain deps to latest

## 1.4.9 (September 01, 2021)

- fix: blocklet overview crash in safari

## 1.4.8 (August 27, 2021)

- feat(ui): optimize ux of team management module (#3292)
- feat(ui): replace did-react with did-connect (#3290)
- feat(ui): remove child interface in blocklet detail page (#3279)
- feat: add description for passport
- fix: should refresh blocklet cache after blocklet started or stopped (#3325)
- fix: @abtnode/queue crash if NEDB_MULTI_PORT is empty (#3278)
- fix: miss blocklet icon when connect to blocklet (#3323)
- fix: user last login is empty (#3321)
- fix(ui): should feedback after blocklet reload success (#3306)
- fix: should not do proxy if blocklet is not running (#3305)
- fix(cli): fix: polish blocklet dev (#3275)
- fix: optimize the text when abtnode crash (#3277)
- feat(ui): hide group if no access url (#3276)

## 1.4.7 (August 13, 2021)

- feat: auto add blocklet endpoint of ip-dns-domain (#3255)
- feat: return blocklet version in meta.js (#3254)
- fix: polish default blocklet public interface in list page (#3264)
- fix(cli): printError (#3248)
- chore: bump deps to latest
- chore: upgrade nodejs to 14.x in docker (#3250)

## 1.4.6 (August 10, 2021)

- fix: nginx user bug

## 1.4.5 (August 06, 2021)

- feat: user can config the mapping from external passport to internal role (#3212)
- feat: support simple access control on access key (#3194)
- feat: polish about page (#3206)
- feat: print command version in cli command (#3196)
- feat: display version number of welcome page (#3195)
- feat: logger keep 60 log files by default (#3216)
- feat: polish websocket connect auth in auth service (#3180)
- fix: should not expose abtnode env to blocklet process (#3213)
- fix: upload https certificate failed (#3201)
- fix: polish sort in member list page (#3204)
- fix: user detail page should be reactive (#3203)
- fix: should init cron in development environment (#3202)
- fix: should forbid external passport if user is blocked by external issuer (#3197)
- fix: should refresh blocklet meta when blocklet dev (#3179)
- fix: team action should not be there when no team (#3183)
- chore: bump deps to latest

## 1.4.4 (July 30, 2021)

- feat: add about page (#3148)
- feat: support create websocket with auth between web and blocklet (#3158)
- fix: node_module is dirty after remote deploy (#3161)
- fix: more reasonable log rotating (#3155)
- fix: incorrect tip command on blocklet dev (#3156)
- fix: check for dependent nginx modules before starting (#3154)
- fix: better error message when node start failed because of nginx (#3160)
- fix: cannot add site with a long domain name (#3149)
- fix: remove useless node info in dashboard page (#3145)
- style: update eslint config (#3152)
- style: move constant to a standalone package (#3142)
- chore: bump deps to latest

## 1.4.3 (July 26, 2021)

- fix: cleanup dependency graph for blocklet sdk

## 1.4.2 (July 26, 2021)

- fix: blocklet bundle failed in zip mode

## 1.4.1 (July 23, 2021)

- feat: enhance the function of getting lost passport (#3119)
- feat: auto logout when user is blocked from logging in (#3112)
- fix: should not block self account from logging in (#3104)
- fix: bug when creating blocklet factory (#3103)
- fix: blocklet proxy should work in gitpod or play-with-docker (#3100)
- fix: polish color of httpProxy warning text (#3099)
- fix: confused naming in bind permission dialog (#3088)
- fix: check session existed before scan qrcode in did-auth (#3091)
- fix: lost-passport page should display description in did wallet (#3090)
- fix(ui): did overflowed in passport card (#3089)
- style: update eslint extends to @arcblock/eslint-config (#3125)

## 1.4.0 (July 14, 2021)

Since 1.3.0 release of ABT Node, after 2 month of hard working(we created 19 releases with 322 commits), now we proudly present to you ABT Node 1.4.0.

Most important features included in this version includes:

- **Team**: support use passport NFT for access control in team
- **Notification Service**: Support sending notifications to wallet from blocklet (#2740)

### Dashboard

- Upgrade marketplace list page with blocklet card component
- Polish blocklet list page for mobile view
- Polish ux on mobile browser
- Rename ABT Wallet to DID Wallet
- Unified user login component
- Display launcher info on dashboard

### Core

- Support running blocklet in cluster mode
- Support custom app sk/name/description on blocklet config
- Running abt-node-service in cluster mode
- Add event bus for inter process communication
- Send alert information when disk usage exceeds threshhold
- More performant blocklet healthy check with tcp connection
- Support service purchase/ownership nft
- Support config service in parent-blocklet mount points
- Auto start pre-installed blocklets when starting abtnode first time
- Cache blocklet tarFile after downloaded
- Rotate blocklet logs daily
- Optimize ci speed for integration tests
- Use github workflow to ensure sprint pr are against dev branch
- Check upgrade on daily basis to avoid overwhelming notification

### Blocklet

- Add WalletAuthenticator to blocklet SDK

### SPEC

- Add signatures and lastPublishedAt into blocklet schema (#2703)
- Support config service in parent-blocklet mount points

## 1.3.19 (July 14, 2021)

- fix: upgrade state was cleanup unexpected before upgrade complete

## 1.3.18 (July 14, 2021)

- fix: show reason when revoke passport is disabled (#3059)
- fix: incorrect user role when login with 3rd party issued passports (#3061)
- fix: should enable cors for webWalletUrl host (#3060)
- fix: print warning if http_proxy found in environment (#3057)
- fix: require node.js v12+
- fix: **meta**.js does not response correct content (#3043)
- feat: increase daemon memory limit to 600MB (#3042)
- fix: update nginx ssl config for better security (#3041)
- fix: blocklet overview runtime-info style (#3039)
- fix: consistent tabs style (#3038)
- feat: show passport endpoint in nft actions in DID wallet (#3035)
- fix: customized app name/description/sk not persisted on upgrading (#3036)
- fix: rename urls to sites on router index page (#3037)
- fix: should display invite button when child blocklet enable invitation (#3029)
- test: add test for blocklet proxy middleware (#3032)
- fix: order of roles and permissions is should not change after update (#3030)
- chore: bump ocap and ux deps to latest
- fix: should cleanup dirty upgrade state on node start (#3022)

## 1.3.17 (July 08, 2021)

- fix: should allow empty address on token schema (#3019)
- fix: remove ABT_NODE_EVENT_PORT in blocklet environments (#3020)
- fix(ux): return to login page from lost-passport page (#3018)
- fix: remove backward compatible code of did wallet (#3016)
- fix: update hosted-git-info version in package.json (#3017)

## 1.3.16 (July 07, 2021)

- feat: user login component (#3002)
- feat: invalidate cache in service process by subscribe to daemon events (#3009)
- feat: support use external passport to login (#2981)
- fix: git url parse (#3007)
- fix: should throw meaningful error on child meta fail (#3000)
- fix: update did-react version (#3006)
- fix: hide Auth Serive in abtnode passports
- fix: cannot use web wallet in issue and lost passport page
- chore: bump deps to latest

## 1.3.15 (July 02, 2021)

- fix: blocklet sdk should set proper defaults for app link and icon (#2994)
- fix: should return passport when verify-owner (#2991)
- fix: allow login after receiver passport (#2988)
- fix: should set accurate first and last login time for team members
- feat: display launcher info on dashboard
- fix: exclude related tabs on blocklet detail which has no auth service (#2986)
- fix: should rewrite absolute path prefix when routing to auth service (#2966)
- chore: upgrade did-address component (#2983)
- fix: check upgrade on daily basis to avoid overwhelming notification
- fix: redirect rule bug in router (#2972)
- refactor: refactor code of toast in dashboard (#2977)
- feat: support custom app sk/name/description on blocklet config (#2974)
- fix: ux for blocked team member (#2976)
- feat: delete blocklet app did prefix rule from router (#2969)
- fix: address should be optional in schema of notification token (#2967)

## 1.3.14 (June 14, 2021)

- fix: polish ui of team module (#2948)
- fix: update ios wallet version limit to test-flight version (#2947)

## 1.3.13 (June 12, 2021)

- feat: support use passport NFT for access control in team (#2907)
- fix: nginx pre-check failed when run in docker (#2916)
- chore: rename ABT Wallet to DID Wallet (#2917)
- fix: font icon cannot be displayed in abt wallet (#2914)
- fix: table scroll in y axis on blocklets list page (#2913)
- feat: add decimal property in notification schema
- chore: optimize error messages when creating or updating sites (#2902)

## 1.3.12 (June 04, 2021)

- feat: add WalletAuthenticator to blocklet SDK (#2892)
- feat: support send message to any account from blocklets (#2896)
- fix: should remove system routing rule when interface.prefix change from "\*" to "/" (#2889)
- fix: should upgrade blocklet that has external port (#2893)
- fix: should ensureBlockletExpanded before move bundle to installDir (#2890)
- fix: bump did-auth sdk to fix crash issue (#2895)
- chore: bump ocap sdk dependency version

## 1.3.11 (May 31, 2021)

- feat: return correct chainInfo when CHAIN_HOST is not empty #2885
- feat: increase cors cache time to 30 minutes

## 1.3.10 (May 31, 2021)

- fix: the rewriting url of /.blocklet/proxy/\*\* is wrong

## 1.3.9 (May 28, 2021)

- fix: should display recent 100 logs when user first access logs page (#2874)
- fix: should not output too many logs in testing
- fix: should have different prefix for different blocklets in asset proxy
- fix: reuse ports of child blocklet when upgradeing
- fix: sometimes font icons was lost

## 1.3.8 (May 24, 2021)

- feat: support service purchase/ownership nft (#2617)
- feat: support i18n for notification service (#2845)
- fix: multi-lang support bug for action button in bocklet detail page (#2863)
- fix: should not excute auth-service code in blocklet sdk (#2860)

## 1.3.7 (May 21, 2021)

- fix: bump ux lib version to fix disabled button clickable issue
- fix: abtnode start failed when initial blocklet exists (#2858)
- fix: make component blocklet config readonly in development (#2857)
- fix: child blocklet data directory is incorrect (#2856)
- fix: useMemo dependence eslint error (#2855)
- fix: hosted-git-info caused blocklet detail page crash (#2854)
- feat: refactor blocklet install button (#2848)
- fix(ui): every notification should be closed (#2847)
- fix: web-wallet button should be disabled when session expired #2736
- fix: abort start when no nginx is available (#2844)
- feat: upgrade notification message format (#2839)
- fix: log bugs in abtnode/cron and abtnode/queue package (#2843)
- feat: auto start pre-installed blocklets when starting abtnode first time (#2836)
- fix: check if the echo domain certificate expires on start (#2824)

## 1.3.6 (May 14, 2021)

- fix: blocklet install by verify failed (#2821)
- fix: blocklet install button text (#2820)
- fix: upgrade button display error in marketplace (#2818)
- doc: add doc for @blocklet/sdk (#2811)
- feat: support config service in parent-blocklet mount points (#2801)
- test: add test for notification service (#2810)
- feat: remove non-root restriction on node start
- feat: add updateSubEndpoint property in appInfo on auth-service (#2808)
- fix: disabled button style on blocklet button (#2806)
- fix: notification popup should be closed one by one (#2805)
- fix: ensure endpoint healthy should support `host` argument (#2804)
- fix: update blocklet card, make button click zone scale (#2802)
- fix: marketplace search result empty
- fix: blocklet list updating bug and optimize registry switching ux (#2800)
- fix: should not display upgrade icon for child blocklets (#2799)
- feat: optimize blocklet upgrade checking logic (#2797)
- feat: cache blocklet tarFile after downloaded (#2796)
- feat: use exact cookie domain in auth service (#2798)
- chore: refactor node registry list manage api (#2794)
- fix: should only do prune message once per week (#2795)
- fix: sometimes the port number of blocklet conflicts (#2792)
- fix: reassign well-known rule port bug (#2793)
- fix: should not check child blocklet entry before installed (#2791)
- fix: can not install from file path that contains whitespace (#2790)
- fix: remove support for `none` routing engine (#2788)
- fix: should leave blocklets untouched on some condition (#2789)

## 1.3.5 (May 07, 2021)

- fix: @abtnode/event-hub was not installed in @abtnode/cli

## 1.3.4 (May 07, 2021)

- feat: upgrade marketplace list page with blocklet card component (#2755)
- feat: add event bus for inter process communication (#2739)
- feat: support sending notifications to wallet from blocklet (#2740)
- fix: possible bug that may be caused by set registry url
- fix: blocklet detail crash on empty price tokens (#2784)
- fix: upgrade-ux-library
- fix: should merge logs when run in cluster mode (#2764)
- fix: should auto expand config panel if child blocklet config missing (#2760)
- fix: should not update node version in blocklet cli (#2759)
- fix: add proper validation when adding integration (#2758)
- fix: package version and cleanup dependencies
- fix: update dashboard layout for get better logger and console page (#2750)

## 1.3.3 (May 04, 2021)

- feat: read owner data from disk on aws ec2 (#2746)
- fix: snapshot history item style (#2744)
- fix: polish tabs scrollButtons -> auto (#2743)
- fix: simple display in blocklet detail page action button group (#2738)
- fix: test case failure caused by blocklet listing change
- fix: use url-join to improve robusty (#2737)
- fix: team member page select dropdown should use materiral design (#2732)
- fix: blocklet detail setting tab desc is missing (#2731)
- Merge master into dev
- chore: update branch workflow to test branch syncing
- [skip ci] chore: add github action to sync dev branch automatically

## 1.3.2 (May 01, 2021)

- chore: polish ux on mobile browser (#2714)
- fix: github workflow not updating base branch to dev (#2713)
- fix: use github workflow to ensure sprint pr are against dev branch
- fix: queue not working as expected when "maxRetries" set to 0 (#2710)
- fix: display price for paid blocklet on marketplace detail (#2708)
- fix: marketplace detail page error caused by meta verify logic (#2707)
- feat: add signatures and lastPublishedAt into blocklet schema (#2703)
- fix: router-rules-mobile-view (#2702)
- fix: polish blocklet list page for mobile view (#2699)
- fix: confirm dialog margin in mobile view (#2700)
- fix: could not dev a blocklet
- fix: notification style in mobile view (#2694)
- fix(ci): "lerna version" should bump to exact version (#2696)
- fix: should only stop running blocklets on node stop (#2691)

## 1.3.1 (April 23, 2021)

- fix: link in deatil page should link to correct url (#2686)
- fix: exception occurs when installing blocklets in parallel (#2666)
- fix: should not dev blocklet in cluster mode (#2665)
- fix: should not stop abtnode if a blocklet is under development (#2664)
- feat: support running blocklet in cluster mode (#2663)
- fix: button status is incorrect in market place page (#2660)
- fix: polish blocklet list page for mobile view (#2659)
- feat: more performant blocklet healthy check with tcp connection (#2656)
- fix: remove signature claim on node setup (#2658)
- feat: optimize ci speed for integration tests (#2657)
- feat: rotate blocklet logs daily (#2655)
- feat: support running abt-node-service in cluster mode (#2654)
- chore: polish blocklet waiting ux during purchase workflow (#2653)
- feat: send alert information when disk usage exceeds threshhold
- chore: enable integration tests on 1.3.x branch

## 1.3.0 (April 19, 2021)

Since 1.2.0 release of ABT Node, after 2 month of hard working(we created 14 releases with 159 commits), now we proudly present to you ABT Node 1.3.0.

Most important features included in this version includes:

- **Blocklet Component**: which makes it very easy for developers to compose complex blocklets with reusable parts
- **Paid Blocklets**: developers can now earn ABT by providing high quality blocklets

### Dashboard

Tons of UX improvements and bug fixes are done to gain better user experience of ABT Node dashboard.

- Support adding/editing/switch blocklet registry on marketplace page
- Support search and filter blocklet on marketplace page
- Support custimizing web wallet url from dev tools when setup the node
- Support editing the primary domain of a site
- Display blocklet version and publish acvitity on marketplace page
- Display blocklet payment info on blocklet detail
- Make most pages responsive on mobile

### Core

The ABT Node Core is continuesely improved to gain better stability, security and performance.

- Support install/config/upgrade blocklet components
- Support bind, request and verify node ownership NFT on setup
- Support purchase and verify NFT for paid blocklets
- All blocklet meta and signatures are verified before download and install
- Automatic cleanup for old blocklets after upgraded to a new version to reduce disk consumption
- Hand reverse proxy error gracefully in service-loader
- Replace `/{did}/{resource}` with `/.proxy/{resource}` for static asset loading

### Router

The routing engine is improved and for performance

- Support routing for blocklet components
- Support adaptive nginx worker process count for better performance
- Set proper headers for forwarded requests
- CORS support for blocklets is now battle-tested and performant

### CLI

ABT Node CLI now provides 2 commands to manipulate ABT Node and blocklets:

- `abtnode init` now works with wrapper blocklets
- `blocklet dev` now works with blocklet components
- `blocklet bundle` now works when bundling blocklets that live in a monorepo
- `blocklet publish` can setup all related NFT factory for paid blocklets
- `blocklet publish` now attaches self-proving signature before publish

### Blocklets

Several reusable components built along the way to 1.3.0:

- **NFT Store**: a general purpose blocklet for users to acquire NFT
- **Blocklet Registry**: now includes blocklet list and detail, and support blocklet purchasing
- **ABT Node Launcher Reloaded**: redesigned to support ABT Node acquire without run any command
- **OCAP Playground**: helps users to know what's possible with our new asset chain and DID Wallet

### SPEC

We extended [blocklet meta spec](https://github.com/blocklet/blocklet-specification/blob/main/docs/meta.md) wit following changes

- Blocklet can define charging policies with `charging` field in `blocklet.yml`
- Blocklet meta now includes `signatures` field to prove data integraty

## 1.2.14 (April 16, 2021)

- feat: add performance timing log for service process (#2648)
- feat: should not allow downgrade specVersion of blocklet.yml (#2646)
- feat: add access-control-max-age to reduce cors preflight requests (#2644)
- fix: should not run migration script that smaller than current version (#2647)
- fix: unable to cancel download of installing blocklet (#2645)

## 1.2.13 (April 15, 2021)

- fix: tune i18n for restart and verify-purchase #2637
- chore: only run integration tests on node.js 14.x
- feat: specify blocklet did as tag when verify-purchase
- feat: specify node owner as tag when verify-ownership
- feat: add app_name and app_description to blocklet env (#2632)
- chore: bump ocap sdk dependency version
- fix: marketplace search build error
- fix: responsive layout for setup page (#2635)
- feat: marketplace page add search function (#2628)
- feat: support updating child blocklets in dashboard (#2626)
- fix: polish blocklet purchase dialog (#2625)

## 1.2.12 (April 12, 2021)

- feat: prefetch next workflow url on blocklet purchase

## 1.2.11 (April 12, 2021)

- feat: only use registry cdn when downloading
- feat: add cdnUrl in validator and registry meta info
- feat: add blocklet registry cdn url in node state
- feat: change default registry url to origin

## 1.2.10 (四月 12, 2021)

- hotfix: layout error in logger page and console page

## 1.2.9 (April 11, 2021)

- feat: support nextWorkflow on purchase complete (#2596)
- chore: bump lodash/axios to latest version
- feat: use dotenv-flow to allow more flexible env config for blocklet dev
- fix: blocklet config environment page readonly in dev mode (#2609)
- fix: first page have scrollbar while loading (#2610)
- feat: add blocklet lastPublishedAt time display (#2608)
- chore: bump ocap sdk dependency version
- fix: nginx should set proper headers for forwarded requests

## 1.2.8 (April 09, 2021)

- feat: disable editing overridden configs of child blocklet (#2594)
- feat: blocklet name cannot contain Chinese characters (#2591)
- feat(ui): polish ui of blocklet confiuration page (#2585)
- feat(ui): optimize ui of component info in detail page (#2560)
- feat: more strict meta verification for blocklet meta from registry (#2573)
- feat: support the development of blocklet with component (#2570)
- feat: polish cli output on node start (#2571)
- feat: add child blocklet's configs in **meta**.js (#2568)
- refactor: refactor the logic of local deploy (#2590)
- fix: payment.js test failed because nft template changed (#2592)
- fix(dev): should let user fill required prop of child blocklet (#2584)
- fix: polish blocklet configuration ux and start time issue (#2578)
- fix: should show error popup on install/upgrade error (#2576)
- fix: blocklet should auto restart after node started (#2577)
- fix review: disable upgrade from non-registry source
- chore: bump sdk to latest version
- ci: optimize ci reliability (#2562)

## 1.2.7 (April 01, 2021)

- feat: support purchase and verify nft for paid blocklets (#2556)
- fix: should not redirect when the request method is OPTIONS
- fix(ws): topic of subscription should not be empty
- fix: should not display config when blocklet is installing (#2555)
- fix(ui): blocklet data storage info is always empty (#2552)
- fix: should support proxy request where the hostname is localhost (#2554)
- fix: should not display duplicate access url in detail page (#2553)
- fix: loading blocklet logo

## 1.2.6 (March 29, 2021)

- fix: should not allow adding exist routing rule (#2535)
- fix: Promise.allSetted does not exist in nodejs v12.7.0 (#2534)
- fix: web wallet button is missing for localStorage not set #2528
- feat: support creating blocklet nft factory on publish (#2516)
- feat: auto merge auth config of chlild blocklet to parent (#2523)
- feat: support request and verify owner nft on node setup (#2513)
- fix: auth service should not cache session api (#2522)
- feat(ui): add component info in blocklet overview (#2512)
- feat: maxRetries can be set to 0 in @abtnode/queue (#2521)
- fix: prune should not stop when an error occurred durning finding blocklet bundle (#2520)
- fix: should support unified login status for blocklet component (#2518)
- fix: should deploy files defined in blocklet.yml (#2517)
- fix: blocklet status not update correctly when upgrading a running blocklet (#2505)
- fix: should not start blocklet if required config is missing (#2508)
- fix: blocklet status is always starting (#2509)
- fix: logo image on marketplace page (#2510)
- fix: clear blocklet registry cache after switched registry (#2506)
- fix: could not request font resource (#2503)
- fix(blocklet init): should not create main property if group is gateway (#2502)
- fix: static resource proxy works not as expected (#2495)

## 1.2.5 (March 22, 2021)

- fix: blocklet process version is error while upgrading (#2492)
- fix: should update blocklet environments when starting abtnode (#2487)

## 1.2.4 (March 18, 2021)

- feat: support blocklet components
- fix: blocklet bundle --zip is incorrect in a monorepo (#2468)
- fix: router provider test case
- chore: change all forge related packages to ocap

## 1.2.3 (March 06, 2021)

- fix: validate the registry before add it and polish switch ui (#2451)
- chore: import blocklet detail page (#2449)
- feat: add signatures to blocklet meta when publish blocklet (#2446)
- fix: schema package go dependency error
- fix: blocklet list download nums style (#2445)
- fix: should not ignore /core/state/lib/states/blocklet.js
- fix: clear all nginx relates processes (#2440)
- fix: set proper nginx worker_process count in different env (#2439)
- doc: update abtnode dev environment setup instructions(#2438)
- fix: missing necessary files in @blocklet/sdk package (#2432)

## 1.2.2 (February 26, 2021)

- fix: registry editing not working as expected
- chore: change default worker_connections to 4096
- fix: can not delete current selected registry #2428
- fix: registry switch crash caused by default list format
- feat: support multi blocklet registry in marketplace (#2419)
- feat: complete cors support with preflight request (#2417)
- fix: should not remove app dir if version did not change (#2421)
- fix: log viewer is cleared unexpectedly on blocklet events(#2418)
- feat: blocklet can get user data by blocklet sdk (#2411)
- feat: support update site domain (#2412)
- feat: remove app dir of old version after blocklet upgraded (#2410)
- fix: routing rule should auto refresh in routing page (#2413)

## 1.2.1 (February 20, 2021)

- fix: log viewer ui bug in mobile mode (#2401)
- fix: should not exclude aws-sdk when bundle blocklet
- fix: blocklet is missing in marketplace if abtnode is an prerelease version (#2399)
- fix: hide dialog cancel button when no new version for upgrading (#2395)
- test: add auth service e2e test (#2396)

## 1.2.0 (February 09, 2021)

- feat: make auth service binding with blocklet interface (#2343)
- feat: blocklet can be cancelled when waiting for download (#2337) (#2370)
- feat: add pre-config hook for blocklet (#2351)
- feat: auth service can get dev web wallet url from localStorage (#2375)
- chore: polish blocklet bundle command (#2347)
- ci: add prelease ci workflow (#2378)
- fix: blocklet installed time should not be empty when downloading (#2368)
- fix(ui): user defined rule should be displayed first (#2376)
- fix(ui): auth config info should be ordered (#2372)
- fix: add user permissions in auth service user session (#2374)
- fix: should show user role in user list page (#2371)
- fix: optimize ui of bind permission component (#2369)
- fix: notification queue not working because daemon set to false (#2352)
- fix: should auto select refer blocklet when add routing rule (#2350)
- fix: log viewer file path display bug (#2348)

## 1.1.18 (January 29, 2021)

- fix: blocklet upgrading error #2318
- fix: trim inputs on blocklet configuration form (#2333)
- fix: auth service does not work if ignoreUrls have empty value (#2332)
- fix: blocklet team page 404 (#2331)
- fix: should ensure blocklet decompressed before run hooks
- feat: add gateway logs to log viewer (#2315)
- feat: auth service can serve more blocklets under one domain (#2314)
- feat: trim form inputs before submit (#2308)
- feat: support websocket proxy on abtnode service (#2311)
- feat: make browser open configurable when run blocklet dev (#2312)
- feat: update service config form style (#2310)
- fix: blocklet logo is missing in auth service (#2305)
- chore: enable coverage for auth service
- feat: check if the cli version is matched the config version before start (#2306)
- chore: improve marketplace card item click event (#2302)
- feat: improve ripple effect on router rule list item (#2301)
- fix: blocklet config should be removed after abtnode dev stopped (#2304)
- feat: set blocklet installation startup concurrency base on memory
- chore: deprecate @abtnode/passport (#2299)
- fix: make team page responsive on mobile device (#2297)
- fix: should reset team before running team e2e test (#2293)
- feat: add manage team entrance in blocklet actions (#2294)
- fix: should not send request in welcome page in production node (#2296)
- fix: add domain alias form support enter key (#2298)

## 1.1.17 (January 22, 2021)

- fix: admin and config interface not responding to click
- fix: "blocklet version" should not change service config in blocklet.yml (#2273)
- feat: support config auth service in blocklet meta (#2237)
- fix: verify required fields on blocklet init (#2268)
- fix: 'domain+port' pattern access url bug
- feat: change worker_connects from 1024 to 2048 in nginx conf (#2266)
- fix: webapp bundle issue
- feat: unify blocklet registry api
- fix: export blocklet registry config
- chore: support optional chainInfo during did-auth #2133 (#2254)
- fix: blocklet config table header style (#2257)
- fix: should not check upgrade if blocklet is not from registry (#2256)
- chore: remove bundle command from abtnode
- chore: deprecate blocklet commands from `abtnode` (#2255)

## 1.1.16 (January 16, 2021)

- feat: use booster.registry.arcblock.io as default registry (#2248)
- feat: increase the timeout threshold at startup to 30s
- feat: rename request headers when publish blocklet (#2238)
- fix: should only respond to pm2-events when node is alive #2198
- fix: should run post-install hook on local deploy (#2234)
- feat: optimize team ui and rbac data structure (#2230)
- fix: do not throw exception if the download is cancelled (#2231)
- fix: integrity verify error on incomplete download (#2229)
- fix: blocklet registry bug
- chore: extend refresh blocklet registry interval
- feat: cache blocklets data when fetch from registry
- fix: join url bug
- fix: blocklet dev failed (#2222)
- chore: add service docs

## 1.1.15 (January 11, 2021)

- fix: do not push to remote until lerna publish success

## 1.1.14 (January 11, 2021)

- bump version to 1.1.14

## 1.1.13 (January 11, 2021)

- fix format router data bug

## 1.1.12 (January 09, 2021)

- fix: auth service publish config

## 1.1.11 (January 09, 2021)

- fix: typo in auth service publish script

## 1.1.10 (January 09, 2021)

- fix: do not expand routing rule items when click action btn (#2215)
- fix: should prevent event propagation for rule item actions (#2214)
- fix: should clone deep when enable new service #2206
- fix: service port env name not properly set #2202
- fix: admin and config iframe should use adaptive protocol #2204
- fix: #2199
- fix: rbac manager data sync cross process
- feat: support invite user to blocklet team (#2192)
- fix: blockchain-manager blank screen (#2196)
- feat: support and enforce blocklet requirements (#2195)
- chore: polish publish error message
- feat: support blocklet developer:init and do not create wallet before publish (#2191)
- feat: support mount and schedule multiple services (#2183)
- chore: improve invitation creation tips (#2188)
- feat: show permission page by permission code (#2184)
- feat: use nedb as storage of rbac (#2185)
- feat: publish blocklet to blocklet registry (#2176)
- fix: add meta info for blocklet:init (#2182)
- chore: enable github actions for coverage on push
- feat: generic team and invitation (#2173)
- fix: update blocklet start timeout from 10s => 60s (#2178)
- feat: basic login service (#2170)
- feat: enable default web-wallet-url for public beta testing

## 1.1.9 (January 01, 2021)

- fix: disk info not correct on linux vm (#2155)
- fix: blocklet config properties not properly merged on update (#2154)
- feat: modify max-header-buffer-size to 16k for nginx and node engine (#2153)
- fix: https error in blocklet interfaces (#2150)
- feat: add invitation list page (#2144)
- fix: sleep 60s after published to npm (#2148)
- chore: enable welcome page by default (#2147)
- feat: support authorization and access control (#2143)

## 1.1.8 (December 25, 2020)

- fix: should support enable cors for dashboard domain #2127
- feat: init cli skip https setting commands when engine is none (#2125)
- feat: improve webapp e2e test (#2121)
- chore: add test case for migration scripts (#2124)
- fix: node running state bug while use blocklet command (#2122)
- fix: blockchain manager can not open without nginx (#2109)
- chore: upgrade blocklet wallet derive function (#2117)
- feat: move blocklet related subcommands to separate command (#2108)
- feat: improve team reset feature (#2105)
- fix: https access url should not contain any port (#2104)
- chore: custom lerna commit message (#2103)

## 1.1.7 (December 21, 2020)

- add github container registry and ecr notifications
- fix build docker in ci

## 1.1.6 (December 21, 2020)

- chore: use github actions for publish

## 1.1.5 (December 20, 2020)

- feat: improve core webapp e2e tests (#2059)
- fix: add fallback avatar for user (#2085)
- fix default web wallet url value bug (#2086)
- fix: should display readable error message for invalid invitation (#2087)
- fix: bump forge sdk and ux lib version to latest (#2076)
- chore: use github actions to run tests
- feat: support invite team member to join node (#2072)
- fix: bump forge sdk to latest (#2071)
- fix: remove user config keys from blocklet configs (#2073)
- chore: remove some config items from the config file (#2058)
- feat: support install blocklet from local file (#2063)
- fix: should include extra domains in blocklet access-url list (#2064)
- fix: remove login token from log since its sensitive

## 1.1.4 (December 15, 2020)

- fix: blocklet status bug on ui
- chore: enable lerna run parallel to speedup ci
- fix: sync pm2 status error tolerance
- chore: optimize websocket tests
- feat: sync pm2 start & stop status to blocklet (#2053)
- feat: routing and display support for non-standard web interfaces (#2052)
- fix(test): use blockletEvent instead of sleep (#2051)
- fix: core state test failed on local (#2050)

## 1.1.3 (December 11, 2020)

- fix: update arcblock did-auth lib (#2035)
- feat: add tests to service gateway (#2033)
- chore: add integration tests for webapp (#2032)
- test: add test for blocklet manager (#2030)
- feat: if "x-forwarded-host header" exists, redirect with it (#2031)
- feat(dev): print local access url in docker (#2024)
- feat: add link for each domain in service gateway (#2027)
- fix: add incorrect general_proxy bug (#2026)
- fix: url mapping page crash when update domain security (#2025)
- fix: style error on logger page (#2019)

## 1.1.2 (December 05, 2020)

- fix: webWalletUrl should allow empty when init node (#2016)
- fix: should not add blocklet if abtnode deploy failed (#2014)
- fix: should not include interface.path in interface url (#2015)
- fix: router service select component should not update params when type is redirect (#2013)
- fix: setting form should not be dirty after changes saved (#2012)
- fix: increase stop timeout from 12s to 60s (#2011)
- fix: define $did if it is not defined in nginx router (#2009)
- fix: typo in i18n key #2002 (#2003)
- fix: allow empty webWalletUrl and registerUrl (#2010)
- chore: update dev.Dockerfile
- feat: build docker image in ci and push to github and docker hub (#1989)
- fix: upgrade blocklet failed
- feat: support search by blocklet title (#1994)
- chore: add notification config in .travis.yml
- feat: support webWalletUrl on abtnode init (#1990)
- feat: add style when hover url mapping item (#1991)
- feat: optimize status for blocklet lifecycle (#1986)
- feat: better error page when blocklet is down (#1987)
- fix: should allow ip+port url when no rules for blocklet (#1983)
- chore: report code coverage to codecov (#1981)
- fix: welcome page should not need sign in (#1975)
- fix: blocklet init should respect latest blocklet meta (#1967)
- chore: cleanup useless fields in blocklet meta (#1978)
- fix: static server env api not working on prefixed path (#1977)
- fix: recursive redirection in nginx routing engine (#1973)
- fix: health check failed when blocklet start on aliyun node (#1963)
- fix: static-server should not set cache headers for html files (#1970)
- feat: use eslint to enforce kebab filename naming (#1903)
- fix: defining member methods of the arrow function is not supported in version 10.x (#1968)
- chore: bump hdkey lib version to make things work in browser (#1965)
- fix: blocklet download failed in debug mode with a bad network environment (#1960)
- chore: do not add system routing rule to dashboard site for blocklet that can only mount on `/` (#1964)

## 1.1.1 (November 30, 2020)

- fix: missing path and query string on redirects

## 1.1.0 (November 30, 2020)

Since 1.0.0 release of ABT Node, after 3 month of hard working(we created 41 releases with 533 commits), now we proudly present to you ABT Node 1.1.0.

### Dashboard

Tons of UX improvements and bug fixes are done to gain better user experience of ABT Node dashboard.

- **Support upgrading the node form dashboard with just 1 click**
- Basic integration support to send notifications to `slack` for `api`
- Standardized installing from url workflow and UX, this is what powers `Install from GitHub`
- Support viewing logs from ABT Node and blocklets within the dashboard
- System information metrics can be inspected on the dashboard
- Support register your node on `install.arcblock.io`
- Consistent ordering of blocklets within marketplace and list page

### Core

The ABT Node Core is refactored and reorganized to gain better stability, security and performance.

- **ABT Node is completely adaptive to any network**, no restart required on network changes
- **Non Node.js blocklets can now be installed and run in ABT Node**
- Access key management feature to secure operations within the node
- Blocklet configuration are improved and separated to extra storage
- Support assign multiple ports to a single blocklet
- Cron scheduler to manage and run periodic tasks
- Reduced the bundle size of ABT Node dashboard to gain better performance

### Router

The routing engine is extended to handle more usage scenarios.

- **Built-in https support** for newly created ABT Node
- Support domain alias of a site
- Support customize [CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS) settings for any domain
- Support wildcard domain for a site
- Support `.well-known` routes for blocklets

### CLI

ABT Node CLI is polished to provider better developer experience.

- `abtnode dev` to start an run your blocklets in `debug` mode in ABT Node
- `abtnode export` to export and share the state and config of a ABT Node
- `abtnode deploy` supports deploy blocklet to remote node
- `abtnode bundle` now supports both `webpack` and `zip` mode, and `--create-release` flag enables release creating
- `abtnode blocklet:version` to bump version
- `abtnode blocklet:migrate` to migration blocklet meta

Besides, we fully tested ABT Node CLI in [GitPod](https://gitpod.io), [Docker](https://github.com/ArcBlock/play-abtnode-with-docker), and [GitHub CodeSpace](https://github.com/features/codespaces) support is on the way.

### Blocklets

Several reusable components built along the way to 1.1.0:

- **Install on ABT Node** blocklet to serve as the bridge between blocklets and ABT Node instances
- **IP Echo DNS** blocklet to serve as the backend for
- **Certificate Manager** to automatically generate and review HTTPs certificates
- **IPFS Deployer** blocklet to help you run an IPFS node in ABT Node(**currently in beta**)

### SPEC

We documented our [blocklet meta spec](https://github.com/blocklet/blocklet-specification/blob/main/docs/meta.md) and finalized some part of it.

- **Blocklet meta are now defined in `blocklet.yml`**
- Blocklet can expose both web and service interfaces
- Blocklet hooks are defined in `scripts` field now

### DevOps

We released an [GitHub Action](https://github.com/blocklet/action-release-to-github) to bundle and release your blocklets automatically to GitHub Releases, so that user can install the blocklet directly from GitHub.

Besides our production nodes are always upgraded to latest version along the way to handle all our production website traffic, such as:

- https://www.arcblock.io
- https://docs.arcblock.io
- https://registry.arcblock.io
- https://www.abtwallet.io
- https://playground.abtwallet.io
- https://www.abtnetwork.io

## 1.0.42 (November 30, 2020)

- fix: should enforce admin login when show upgrading page #1680

## 1.0.41 (November 30, 2020)

- fix: do a hard refresh when upgrade success #1995

## 1.0.40 (November 29, 2020)

- chore: update readme for cli

## 1.0.39 (November 29, 2020)

- fix: updater throw error when call getInstaller #1593

## 1.0.38 (November 29, 2020)

- fix: dashboard server bundle size from 10M to 5M

## 1.0.37 (November 28, 2020)

- fix: exclude source maps from webapp bundle

## 1.0.36 (November 28, 2020)

- feat: support providing encoded url when install from url
- fix: service url also displayed in access url
- fix: blocklet access urls are not correctly concated #1946
- fix: system routing rules not updated correctly (#1952)
- fix: add domain alias bug (#1950)
- fix: abtnode dev error: "Invalid URL: http:/" (#1951)
- fix: should pretty print routing snapshot data (#1949)
- chore: remove auto open welcome page in dev (#1929)
- fix: blocklet status is wrong after node restarted (#1924)
- feat: support add wildcard domain (#1881) (#1926)
- fix: http and https request should not attemp only single IP (#1921)
- fix: should have a tip when access url is wrong (#1927)
- fix: log error info after ensure endpoint healthy failed (#1925)
- chore: optimized domain status check (#1919)
- fix: nginx routing engine not render services correctly (#1923)
- fix: should respect blocklet prefix when add site (#1918)
- fix: proper error printing when parse meta filed on bundling (#1914)
- feat: support wellknow routes (#1911)
- chore: split cron scheduler to a standalone package (#1913)
- fix: should consider interface.prefix when update routing table (#1912)
- fix: improve blocklet meta parse logic (#1905)
- feat(ux): when unsaved changes and leave setting page, show prompt (#1898)
- fix: “network error” show up after install a blocklet success (#1893)
- fix: 404 error using install on abtnode (#1892)
- feat: support creating system rules for fixed path interface (#1889)
- fix: filter url that host name is not ip for show it when visit url (#1883)
- fix: remove BLOCKLET_PUBLIC_URL from blocklet env
- chore: polish blocklet meta schema for ease of migration
- fix: should throw error when try to remove non-existing blocklet (#1881)

## 1.0.35 (November 24, 2020)

- fix(ux): unSaved tip in settings page display wrong (#1878)
- fix: try to fix babel deps warning by adding @babel/core #1873 (#1876)
- fix: error log not properly recorded in blocklet state

## 1.0.34 (November 23, 2020)

- fix: exclude source maps from webapp bundle
- fix: migration script crashed because occupied port check
- [skip travis] update readme
- [skip travis] update readme

## 1.0.33 (November 23, 2020)

- fix: blocklet config not properly updated when blocklet meta change (#1863)
- chore: migration script update and edge case handling (#1865)
- fix: dismiss one loading view for blocklet actions menu (#1861)
- fix: abtnode access url does not display in welcome page (#1853)
- fix: blocklet stuck on starting when check start throw error (#1859)
- fix: preDeploy hook does not exec in remote deploy (#1860)
- fix: add i18n for 'downloading' (#1858)
- feat: optimize interface behavior on routing (#1827)
- fix: meta environment can't have `BLOCK` or `ABT_NODE` (#1831)
- chore: move nedb to another repo #1829 (#1833)
- feat: display access entries in welcome page (#1822)
- fix: configs row is null when migrate configs extras db (#1830)
- chore: using interface from blocklet meta (#1821)
- fix: improve blocklet actions loading state (#1819)
- fix: improve cert page style (#1818)
- fix: hide secure value in configuration page (#1817)
- fix: update slack message structure for show priview (#1812)
- chore: add blocklet schema parse/clean/validate (#1795)
- fix: reset merge config function for extras db and add secure schema (#1811)
- fix: update text when delete in the service Gateway (#1804)
- fix: loading dismiss before action done (#1806)
- feat: hide routing snapshot created by "abtnode dev" (#1785)
- chore: rename the command `eject` to `export` (#1802)
- feat: copy extra db in abtnode eject command (#1801)
- feat: add -f option for an blocklet:init command (#1799)
- feat: split blocklet configs into blocklet extras (#1737)
- fix: not exit all processes when start failed and node.js v15.x crash (#1796)
- fix: failed to validate install url from github releases (#1792)
- chore: no more checking read & write permissions on `/data` directory in docker (#1794)
- feat: exclude blocklet source code from eject and download it on recover (#1789)
- fix: blocklet status stuck at starting after local deploy (#1787)
- fix: bad log and ux when upgrade blocklet failed (#1784)
- chore: extract blocklet meta related to a standalone package (#1782)
- fix: display title for notification popup and upgrade wording (#1783)
- chore: remove color field from meta spec (#1781)
- feat: add log when run the cron job (#1780)
- feat: support relative meta.dist.tarball (#1775)
- fix: `abtnode eject` hangs when node is not running (#1778)

## 1.0.32 (November 13, 2020)

- fix: only eject the blocklets that installed from blocklet registry or url (#1767)
- chore: polish `blocklet:version` and `eject` command (#1766)
- fix: adjust reload time for fix cpu display error (#1752)
- fix: notification width error when text too long (#1761)
- fix: settings basic page on mobile (#1763)
- chore: remove `kill` alias for `stop`
- fix: get meta failed if meta has invalid field (#1756)
- fix: display wrong number when check process healthy timeout (#1750)
- fix: sort the routing rule data by `createAt` field before take snapshot (#1749)
- fix: upgrade node small updates (#1748)
- chore: polish updater and upgrading (#1743)
- fix: should use bundle folder when deploy to local (#1746)
- fix(ux): user-friendly installed prompt (#1742)
- fix: can't run migration scripts in-docker (#1740)
- fix: blocklet did not included in release meta
- fix(dev): dev failed if meta has not environments field (#1739)
- chore: merge webpack and zip bundle and support creating release after bundle (#1730)
- fix: bug when checking whether the certificate has expired (#1738)
- feat: support `abtnode eject` and recover from ejected data (#1727)
- feat: won't install if blocklet already install with same or highter version (#1719)
- fix: improve upgrade checking wording (#1724)
- feat(dev): missing required environments can be auto or mannal filled (#1722)
- chore: remove useless blocklet field (#1732)
- chore: support bump blocklet version and use latest meta file on init (#1723)
- fix: uniform button color for register url (#1714)
- fix: parse_blocklet_meta and migration/bundle command (#1715)
- fix: incorrect disk info on mac oc (#1717)
- fix: token contains non ISO-8859-1 code point (#1709)
- fix: click to copy support i18n (#1706)
- fix: upgrading progress wording (#1708)
- fix: incorrect port param when register node (#1707)
- feat: parse blocklet meta from blocklet.yml and support migration command (#1703)
- fix: update text for register ABT Node (#1699)
- feat: support disable https completely for dashboard and blocklets with config (#1698)
- fix: should throw error when attempt to enable auto upgrade in unsupported env (#1697)
- spec: attach git hash in blocklet bundle (#1695)
- chore: rename requiredEnvironments to environments #1618 (#1688)
- fix: failed to install/upgrade blocklet-registry from market place (#1658)
- fix: use https link in dashboard for webhook messages (#1685)
- feat: send webhook notification on node start or stop (#1675)
- fix: disk usage error for NFS (#1683)

## 1.0.31 (November 07, 2020)

- fix download cert bug

## 1.0.30 (November 07, 2020)

- fix: auto upgrade toggle ux #1663

## 1.0.29 (November 07, 2020)

- fix: updater cwd not correctly set

## 1.0.28 (November 07, 2020)

- fix: updater cwd not correctly set

## 1.0.27 (November 07, 2020)

- fix: make member related notification sticky #814
- fix: notification.create should always have entityType #1652
- fix: undefined in member approve notification (#1674)
- chore: add a tag for docker hub ci after published (#1673)

## 1.0.26 (November 07, 2020)

- fix: publish script

## 1.0.25 (November 07, 2020)

- feat: support auto upgrade from dashboard (ui & daemon) (#1630)
- fix: member approve notification (#1659)
- fix: node regesiter url position (#1642)
- fix: service health check may cause the service fail (#1640)
- feat: auto open install blocklet dialog according to url params (#1639)
- perf: optimize memory for remote upload of big blocklet (#1634)
- feat: support register node on install bridge (#1624)
- chore: remove install blocklet directly from npm by just using registry meta (#1635)
- fix: change login attempt notification severity and description (#1632)
- fix: router config not save notice dialog jump error (#1631)
- chore: send error notification when update routing rule failed on blocklet installation (#1625)
- fix: timing of tagging caused docker image build error during publish process (#1626)
- feat: improve install from url by using meta.dis (#1574)
- feat: polish `abtnode bundle` ux (#1615)
- feat: support auto upgrade from dashboard (cli & cron) #58 (#1614)
- fix: update did to address (#1616)
- fix: should listen to blocklet install/upgrade error on marketplace (#1613)
- fix(dev): not enough logs in console (#1608)
- feat: add alert for router tip (#1599)
- feat: rotate nginx access and error log everyday (#1611)
- fix(bundle): not throw error if main is empty (#1609)
- fix(deploy): error message is printed repeatedly (#1612)
- fix: add hover color on table (#1582)
- feat: use .blocklet/bundle as bundle folder #1576 (#1605)
- ux: polish no access url description (#1603)
- fix: should not run migration for newly created nodes (#1602)
- fix update certificate bug and polish ui (#1600)
- fix: eidt input disabled if row is requried on configuration page (#1580)
- feat: persistence the blocklets list page size (#1591)

## 1.0.24 (November 02, 2020)

- fix: remove disk info from getNodeInfo #1579
- fix(dev): force use scripts.dev as entry
- fix: bug when get blocklet engine version (#1598)

## 1.0.23 (November 01, 2020)

- fix: migration script of 1.0.22 #1557

## 1.0.22 (October 30, 2020)

- fix: blocklet bundle should not update main for static blocklets (#1546)
- fix: start blocklet bug (#1545)
- fix: unify-tag-style-in-blocklet-detail (#1544)
- fix: migration ux (#1541)
- fix: btn is different and no center each row (#1542)
- fix: check nginx bug (#1540)
- fix: abtnode dev not working because of interpretor (#1539)
- fix: can not install from registry
- fix: set max_restarts to 0 when developing blocklet (#1528)
- fix(dev): keep blocklet when blocklet is stopped abnormally (#1526)
- feat: display blocklet exposed services in blocklet detail page (#1522)
- fix: error occurs when debugging the same blocklet repeatedly (#1525)
- fix: hide dashboard cert (#1523)
- feat: support generic migration scripts in abtnode core (#1520)
- feat: support blocklet engines (#1465)
- fix(dev): An error occurred after pressing ctrl + c (#1515)
- fix: check nginx conf before start (#1516)
- fix: unified constants and fix a mobile style issue (#1519)
- fix(ux): disable action button of blocklet of development mode (#1518)
- fix: add title url for slack notification (#1507)
- fix(dev): print development mode tip (#1517)
- chore: add tip on load balancer not available #1360
- chore: optimize pm2 related logic on abtnode start (#1510)
- fix(dev): use unProtected rule "/" in develop time (#1514)
- fix: disable nginx cache in debug mode (#1511)
- fix: improve router enginee setting (#1513)
- fix: process was not killed after terminal window closed (#1512)
- fix: optimize console ui of "abtnode dev" (#1509)
- fix: toBlockletDid should treat blocklet name as utf8-string #1398 (#1495)
- feat: auto open in browser after blocklet start success in dev mode (#1492)
- feat: support serve pure static repo by "abtnode dev" (#1493)
- fix: do not verify main field when developing a blocklet (#1485)
- fix: dashboard responsive issues (#1480)
- chore: hide gql console on the sidebar (#1489)
- chore: remove info.domain from node config & state #1348 (#1488)
- fix: tune blocklet start timeout in develop mode (#1484)
- feat: basic cron jobs support (#1411)
- chore: move blocklets to separate repo (#1481)
- fix: add pretty-ms-i18n package (#1387)
- fix: sometimes dev is abnormal when stoping or starting (#1463)
- chore: move lock from core to util (#1464)
- feat: add install btn on marketplace blocklet detail (#1461)
- fix(cli): port is missing in entry output after abtnode start (#1409)
- fix: context.hostname and port can not be empty at same time error from cli (#1462)
- feat: display gitpod on dashboard (#1460)
- fix: tag component style is overwritten (#1453)

## 1.0.21 (October 23, 2020)

- fix: browser title (#1439)
- fix: ip on ec2 is not correctly destructed #1432 (#1438)
- fix: tag margin error (#1434)
- chore: polish blocklet detail page (#1437)
- fix: do not include ip in node description when init in docker (#1436)
- fix: The blocklet registry is not verified and not effective (#1435)
- feat: send slack notification when add / remove webhook (#1397)
- chore: rename "access link" to "access url" (#1422)
- feat: reorganize blocklet detail page by adding interface tab (#1414)
- fix: blocklet config is missing (#1413)
- fix: do not print public url if no public ip (#1410)
- feat: add proto schema for send webhook message (#1399)
- chore: move some node state to api (#1406)
- fix: change webhook tab and route name to integration (#1392)
- chore: extract static blocklet server to a package (#1405)
- chore: update ABT Node modes (#1404)
- chore: reorganize code in abt node core (#1402)
- feat(cli): "abtnode dev" supports gitpod (#1401)
- fix: default value of mode option (#1400)
- feat: blocklet dev environment can be served in abtnode (#1310)
- fix: restarting blocklets on node start takes too long (#1395)
- feat: enable add IP to cors whitelist (#1393)
- feat: support zipped bundle of blocklets (#1388)
- fix: update version to config and state on start (#1381)
- chore: add ip types for dashboard url (#1385)
- chore: merge with master
- fix: add site ui bug (#1386)
- fix: ip-echo-dns renaming caused ci failure
- chore: rename simple dns to ip-echo-dns (#1382)
- chore: optimize webapp bundle size by removing source maps
- fix: only build master branch on travis

## 1.0.20 (October 21, 2020)

- clone dashboard rules to default site

## 1.0.19 (October 20, 2020)

- fix getBaseUrls bug

## 1.0.18 (October 20, 2020)

- fix: build config before publish

## 1.0.17 (October 20, 2020)

> Major changes in this release: webhook support, https support

- fix: dynamic module loading in nginx on amazon linux
- feat: support send outgoing notifications with webhook (#1305)
- chore: update text on setup url mapping
- fix: add subscription for notification.create to refresh node context (#1344)
- fix: add padding on action button in service gateway (#1343)
- chore: cleanup blocklet publish scripts
- chore: update blocklet build script to achieve smaller bundles
- fix: dashboard https bug (#1333)
- chore: a bunch of router bugfix (#1338)
- fix: page is blockled by "Netwok error" after blocklet installed (#1337)
- fix: wrong node status text after "abtnode stop" (#1336)
- feat: simple dns and dashboard https support (#1316)
- chore: add prompt to restart node after upgrade for root user
- feat: support setoninsert in nedb mongoose driver (#1330)
- feat: user can input maxUploadFileSize when init abtnode (#1322)
- fix: some text and and margin on confirm textfield (#1314)
- fix: nginx return 413 when upload file larger than 300m (#1311)
- fix: should auto close the drop down action menu when clicked #1307 (#1313)
- fix(ux): show cursor pointer when hover Log Directory (#1312)
- fix: optimize batch blocklet restart with async/queue (#1309)
- feat: refactor routing ui and support config domain security (#1302)
- chore: upgrade @arcblock/sdk-util package to resolve text field bug (#1303)
- fix: the bug of inconsistent disk usage display (#1300)
- fix: replace env position (#1294)
- chore: update readme in nedb packages
- fix: set uptime start time (#1292)
- chore: bump forge and ocap sdk to latest version
- fix: timer on the top bar should be live (#1239) (#1283)
- fix: calculate disk total (#1296)
- fix: add strong text on del confirm (#1290)
- chore: add docs about test in docker (#1291)
- chore: upgrade mongoose to latest 4.x
- chore: update logs => `view logs`
- fix: uptime on live (#1278)
- feat: install blocklet from Github repo (#1277)
- chore: maintain our own fork of nedb and support mongoose (#1254)
- fix: add topbar for logs page (#1282)
- fix: reset style cpu etc in dashboard (#1274)
- fix(ci): travis task is automatically closed (#1271)
- fix: change style in del confirm (#1276)
- fix redirect bug (#1280)
- fix: add confirm when delete site or url (#1244)
- fix: ABT_NODE_HTTP_PORT bug in router (#1266)
- fix: _meta_.js path bug (#1264)
- fix: create a box instead of switch for secret key (#1256)
- fix: keep no round conner of the bar (#1259)
- fix: keep logo center with bar (#1260)
- fix: go more blocklet detail by click blocklet card (#1231)
- fix: blocklet logo disploy error (#1247)
- fix: "abtnode logs" never stop if node is not starting (#1235)
- fix: sort installAt in blocklets (#1246)
- fix: log output should be responsive (#1245)
- fix: small fix to text on logs start (#1232)
- chore: replace fs.exits api with fs.existsSync, fs.exists was deprecated (#1243)
- fix: update node settings bug #1221 (#1227)
- chore: improve tests (#1226)
- fix: log page is crashing on Safari (#1230)

## 1.0.16 (September 30, 2020)

- fix: disk usage fomat issue

## 1.0.15 (September 30, 2020)

- fix: router and error log (#1208)
- ux: optimize ui of logger page (#1206)
- fix: fetch downloading status bug (#1207)
- fix: domain dns status bug #1202
- fix: improve sidebar item sequence
- feat: add system info in dashboard (#1162)
- fix: doc link and env var (#1181)
- feat: remove ip and forwarded port dependency from node (#1153)
- feat: add entry frome blocklet page to logs page (#1173)
- fix: update rule bug
- fix: abtnode logs bug (#1166)
- fix: redirect bug (#1170)
- fix: ealint failed check at logger page (#1165)
- feat: add match sites to cert, and add match cert to site and cert detail page (#1157)
- fix: trail slash bug in nginx path (#1158)
- feat: streaming logs for each blocklet to browser #57 (#1152)
- fix: blocklet status is always "starting" (#1161)
- chore: add code spell checker whitelist
- feat: add code spell checker whitelist
- fix: change text in zh.js
- fix: change alias description
- fix: change alias description
- fix: add confirm dialog when restart blocklet
- fix: remove alias btn when default or ip site
- fix: review code
- fix: update default text 'Default - Not found' to 'Default - User will see the 404 page'
- fix: url sort error when update in url mapping

## 1.0.14 (September 26, 2020)

- fix: bunch of bugs in bugbash 1.0.4 (#1143)
- fix: mark as read does not work (#1141)
- fix: blockchain manager api permission issue (#1142)
- fix update rule bug (#1140)
- fix: check available memroy before start chain (#1120)
- fix: input snapshot message and polish add/update rule/site (#1118)
- fix: blocklet status tag margin left issue #881
- fix: regenerate qrcode and change some text (#1117)
- fix update text url mapping (#1112)
- fix update text (#1114)
- fix: version tag in blcoklet overview (#1116)
- fix: cert expires wording and style (#1106)
- cli: improve start error prompt (#1115)
- chore: polish read blocklet meta(abtnode blocklet:meta) command (#1105)
- fix: change text (#1104)
- fix: job queue restore param error #1100
- fix: eslint useEffect params (#1102)
- fix: modify error hint message when add site and read https certificate information bug (#1103)
- chore: router technical docs (#1099)
- fix: auto trigger build of ArcBlock/blocklets (#1101)
- fix: reset upgrade blocklet version btn (#1097)
- fix: verify https status bug and other bugs (#1087)
- feat: local storage sort (#1086)
- fix: no url mapping helper text
- feat(ui): optimize health status ui (#1073)
- feat: add domain alias (#1083)
- fix: dashboard: blocklet status changed after config (#1084)
- fix: user can still install a deprecated version of blocklet (#1082)
- fix: blocklet config merge should not delete user config (#1081)
- chore: add tests for hash_files (#1062)
- feat: avoid checkin unnecessary folders to git (#1067)
- fix: refresh page when add certs (#1069)
- fix: fatal error may occur if uploaded blocklet has error #900 (#1065)
- fix: set all close btn zh (#1063)
- fix: notification list (#1064)
- fix: remove incorrect events when upgrading blocklet #1060 (#1061)

## 1.0.13 (September 19, 2020)

- fix: error tolerance on populate job from disk

## 1.0.12 (September 19, 2020)

- fix: adapt blockchain manager to latest queue #1053

## 1.0.11 (September 18, 2020)

- fix: access log bug in webapp (#1037)
- fix: common Nginx config for better security to consider (#1031)
- fix: error info set config on configuration (#1038)
- fix: better error page (#1029)
- fix: blocklet env update on deploy and upgrade (#1035)
- chore: refactor job queue to fix stucking (#1034)
- fix: hide ip on docker (#1027)
- chore: remove map files before publish (#1030)
- fix: redirect to blocklet's publis_url when request path is not found and '/' (#1028)
- fix redirect relative path bug in docker (#1026)
- feat: rewrite notification component (#1021)
- add strict cors header to router (#1020)
- feat: cleanup router in the daemon #869 (#1006)
- fix: blocklet list upgrade error (#1015)
- feat(cli): list change set in the deploy output (#1018)
- fix blockletmd image canot show (#1007)
- fix: router not update when upgrade blocklet with diff dynamicPathPrefix (#994)
- fix the 'running data directory' bug when run 'abtnode upgrade' #985 (#1012)
- fix: allow upgrade node itsself as root without restarting #950 (#999)
- fix: sort blocklets (#993)
- fix: size of notifications (#989)
- chore: update docker doc and dockerfile #988 #987 (#996)
- fix: hide loading icon in router page #895 (#997)
- fix: hide value can not click copy (#991)
- Fix: port conflict for blocklets (#992)
- fix: remote deploy blocklet failed if has already deployed from local (#990)

## 1.0.10 (September 16, 2020)

- fix: route map text spacing (#983)
- fix default site rule link bug (#978)
- fix: deploy dapp blocklet to remote faild (#979)
- fix default site rule link bug
- chore: increase the waiting time for start daemon
- chore: update blocklets docs (#970)
- Fix: spacing spacing on Service Gateway URL Mapping page (#969)
- fix: update position confirm btn for setup page (#972)
- fix: blocklet start check logic #957 (#961)
- feat: show blocklet install source detail in notify and detail page #873 (#964)
- fix: display num when site collapsed (#968)
- fix(cli): show better error format when deploy blocklet fail (#966)
- fix: persistence the sort for marketplace (#967)
- fix: size of notifications (#963)
- fix: publish script and cleanup (#956)
- feat(cli): change deploy param from "node-host" to "endpoint" (#965)
- build: use eslint --fix when lint (#944)
- feat: allow deploy blocklet of same version if has diff files #899 (#946)
- fix: value indentation for blocklet configuration (#948)
- update engine name for service gateway (#942)
- fix: missing upload files when deploy blocklet #897 (#938)
- fix: Update Access Key Dialogue Box (#939)
- chore: update language for blocklet detail page (#943)
- fix: show bwa notification when have bwa configuration and update text (#936)
- fix: uploaded blocklet can't successfully start #902 (#941)

## 1.0.9 (September 14, 2020)

- fix start blocklet sleep time in docker

## 1.0.8 (September 13, 2020)

- fix bugs when run in docker #318

## 1.0.7 (September 12, 2020)

- fix: core/state should not import from cli

## 1.0.6 (September 12, 2020)

- fix: add rule bug and other bugs (#907)
- fix: start check should respect blocklet url (#904)
- fix: deploy @arcblock/blocklet-registry failed (#906)
- fix: remote deploy fail if name has "/" (#905)
- fix(ux): optimize spinner message in cli (#892)
- fix: terminate the started processes when node start failed (#889)
- fix: blockchain manager tip (#888)
- fix: optimize some text (#884)
- fix: deploy not working in production build (#886)
- fix: polish start blocklet and fix many bugs (#880)
- feat: only upload diff files when deploy blocklet by CLI (#879)
- feat: auto check session when page visibility state changed #565 (#883)
- feat: UI layout optimization for responsive screen (#875)
- feat: ensure blocklet started (#874)
- feat: make abtnode start adaptive (#872)
- fix: make build failed; client bundle size too large (#867)
- feat: define default route for sites (#852)
- fix: core/client package size exploded by assign webpack alias
- feat: deploy blocklet to remote ABT Node by CLI (#846)
- fix: console warning (#851)
- fix: validatePathPrefix bug
- feat: add redirect service type to site and rule (#836)
- fix:size of image after first wallet scan (#849)
- fix: change "router" to "service gateway"
- chore: some ux improvements by nate (#848)
- feat: order of blocklets (#835)
- fix:hide none option in router engine (#847)
- fix: should update env before restart blocklets on node start (#834)
- feat: access key management (#822)
- bugfix:to rename title (#823)

## 1.0.5 (September 07, 2020)

- fix: lerna should force publish all packages on new version

## 1.0.3 (September 07, 2020)

- fix: travis publish failure caused by `last failure`
- fix: travis publish failure caused by `React.useEffect`

## 1.0.1 (September 04, 2020)

- fix: 修复路由页面样式错乱 (#783)
- feat: allow a simple redirect rule in route (#781)
- fix: blocklet card style on marketplace (#782)
- fix: switch Logout zh (#767)
- fix: default server generation bug (#761)
- fix: X-Powered-By setting bug
- feat:(router) support custom headers in http context (#757)
- fix: 'abtnode logs' bug (#756)
- fix: did auth bug in docker and change the way of initializing in ec2 (#755)
- fix(ux): router page: hide empty tip when not empty (#754)
- fix: missing logger in webapp auth routes
- feat: add auth verification for all gql api except whitelist #732 (#752)
- fix(ux): marketplace: button status error when installing blocklets (#750)
- chore: bump forge sdk to latest version
- feat(ux): routes can be collapsed in router page #715 (#749)
- fix: the bug that interfaces not hidden when blocklet is not running (#751)
- fix: logging issues (#748)
- feat: client can check server health by hearbeat of websocket #571 (#746)
- feat(ux): optimize routing page ui #716 (#744)
- test(ws): add tests for @abtnode/ws #646 (#743)
- fix: should use 127.0.0.1 when connect do daemon websocket from cli #737 (#742)

## 1.0.0 (August 29, 2020)

This release indicates that ABT Node has reached a stable version as an blocklet runtime container, major changes since the technical preview release are listed below:

### Blocklets

- Support sensible defaults for blocklets, support deploy a blocklet without `package.json` or `blocklet.json`
- Extend blocklet spec to support `capabilities` field
- Most official blocklets can now work in dynamic path prefix

### Router

- Full-featured routing rule editor with snapshot support
- Simple certificate manager with a brief list of router-managed certificates
- Stable nginx provider with multiple site, multiple path, and https support
- ABT Node dashboard is served from `/admin` path by default
- All installed blocklets are served from `/admin/{blocklet_name}` by default (if dynamic path prefix is supported)
- Routing rules are validated on any change, add/update/remove

### Marketplace

- Better UX when install/upgrade/downgrade blocklets
- Make blocklet registry error more readable to end user
- Support built-in blocklet detail page

### Notifications

- Display time/tag in notification list
- Auto popup on important notifications

### UX & Performance

- Use websocket subscription to replace pulling in server-client data flow
- Enable compression in built-in static blocklet server to make pages load faster
- Smooth data refresh on every page
- End User License Agreement on ABT Node setup

### CLI

- Make sure all running blocklets are correctly restored on ABT Node restart
- Support live output for `abtnode bundle` and `abtnode deploy`
- More stable `abtnode start`: then this command exits, the node is accessible
- Eliminate native-binding modules to achieve a better install process

Along the way to 1.0.0, there are tons of bugfixes here and there, all for a better user experience.

## 0.9.11 (August 29, 2020)

- chore: polish blocklet registry logging
- fix: peer dependency warning in web socket package

## 0.9.10 (August 29, 2020)

- chore: update eula doc
- fix: restart router after mutate certificate (#733)
- chore: optimize certificates table ui

## 0.9.9 (August 28, 2020)

- fix: bump ux lib version #720
- fix: router https issues (#722)
- fix: show tip in routing page if version is not the latest #719 (#723)
- feat: enable compression for static assets in built-in static server (#725)
- fix: sometimes event queue will not tigger event #694 (#721)
- add timeago for notification list (#714)
- Fix: should update member/owner profile on relogin (#712)
- fix: running blocklets are not restored on start #706 (#708)
- feat: optimize blocklet registry logic #658 (#707)

## 0.9.8 (August 27, 2020)

- feat: install blocklet from url #181 (#701)
- update ws (#703)
- fix(router): remove certs from snapshots (#702)
- feat: add eula page (#685)
- add more informations to https certificates page (#697)
- fix: router provider should have a favicon.ico
- Fix start init (#695)
- feat(ux): real-time and silent refresh data #659 (#689)
- chore: bump forge sdk to latest version
- improve notification severity (#687)
- fix data directory verification bug (#686)
- feat: show notification popup on push event (#676)
- fix the data directory verification bug during start&init (#674)
- Fix: should have timeout when fetch ip info on init (#679)
- fix: support event publish from cli through socket (#673)

## 0.9.7 (August 22, 2020)

- fix: npm publish

## 0.9.6 (August 22, 2020)

- fix: travis build and get smaller bundles by adding mocks for webpack

## 0.9.5 (August 21, 2020)

- better data folder (#640)
- fix: websocket connection issue behind router #660
- feat: optimize certificate manager ui (#654)
- fix: default router ui is not reactive #579 (#653)
- feat: add certificate manage page (#645)
- support websocket and subscription (#628)
- Feat: support live output for bundle and deploy (#650)
- add doc link (#648)
- Fix material table (#644)
- fix: static server should return index.html properly
- fix #603 (#639)
- Feat: support blocklet capabilities in spec (#638)
- chore: cleanup BLOCKLET_BASE_URL and BLOCKLET_PREFIX (#631)
- fix blocklet interface urls bug in blocklet detail page (#630)
- fix: abtnode bundle should copy `publishConfig` fields
- Fix: blocklet corrupted and stucking at stop (#626)
- adapt router to docker (#624)
- Feat: support minimal and sensible defaults of static meta (#621)

## 0.9.4 (August 14, 2020)

- feat: verify routing rules before applying #515 (#592)
- chore: update blocklet to adapt to latest router (#606)
- fix #585 (#607)
- fix: better nginx error message #575 (#605)
- fix: expose blocklet did to blocklet instance
- fix: should wait for node ready on start #594
- fix #590
- chore: update router-provider readme to add a ref tool
- fix: ensure default admin path is set properly when initial engine is none
- support adaptive blocklet and bugfix (#589)
- fix: should generate system routing rule on engine switch (#582)
- improve logging (#572)
- fix: separate system and user routing rules #576 #568 (#580)
- feat: add the upgrade and downgrade feature to blocklet detail page (#569)
- fix add admin rule error (#574)
- fix add admin rule error
- Feat: better router onboarding (#560)
- support display local deploy blocklet logo (#561)
- feat: update blocklets when blocklet registry changed and hide ip input (#562)
- perf: prefetch bundle when visit first web page (#563)
- perf: optimize response time of api listVersions (#559)
- fix router engine error message style (#556)
- Fix: secp256k1 native module caused install issue (#554)
- perf: add lazy-load for abt node dashboard web page #478 (#553)
- add default error location to nginx router (#552)
- Fix: install hanging (#550)
- fix(ux): missing loading progress icon in blocklet list page #538 (#549)
- feat(ux): add missing required fields tip in blocklet list page #539 (#546)
- files not be watched after npm run start:server (#547)
- fix: blocklet status not update in blocklet detail page when force reload page (#545)
- feat(cli): print error when provider check failed when init abtnode #537 (#544)
- fix #501

## 0.9.3 (August 07, 2020)

- Feat: remove port for routing rules (#532)
- Feat: support restarting status for blocklets (#530)
- feat: list routing providers on frontend (#529)
- fix: #499 add validate on server side (#528)
- build(webapp): remove nodemon in scripts.start:hub (#526)
- docs: modify ABT Node Dashboard setup doc (#525)
- feat(cli): #487 abtnode upgrade (#524)
- add certificates data to routing snapshot (#518)
- fix: #493 async call shelljs.exec when download blocklet (#521)
- fix #499 (#517)

## 0.9.2 (July 31, 2020)

- fix: image path not correct for dashboard

## 0.9.1 (July 31, 2020)

- update ux lib
- fix #491, #494
- fix #498

## 0.9.0 (July 31, 2020)

- feat #506

## 0.8.16 (July 31, 2020)

- fix add updatedAt field to routing snapshot
- bump version
- fix routing snapshot bug
- bump version
- Merge branch 'master' into change-routing-data-structure
- modify update routing rule item api
- remove useless routing apis
- apply new data structure to backend
- apply new data structure to front end
- add deleteRoutingRule api
- change routing rule data structure

## 0.8.15 (July 31, 2020)

- fix #482 #486
- fix #486

## 0.8.14 (July 30, 2020)

- feat: support blocklet detail in marketplace #416

## 0.8.13 (July 30, 2020)

- fix #471
- hide route rule tab when rule engine is none
- fix #443: mark all as read not work sometime

## 0.8.12 (July 30, 2020)

- fix: abtnode can not start on brand new setup

## 0.8.11 (July 30, 2020)

- fix #407
- fix #391
- fix #468
- fix #469
- fix #458
- chore: extract blocklets into contexts
- chore: change value of no provider to none (#472)
- fix: unstable handle routing on node start
- chore: polish nginx provider log name
- fix #466 #445

## 0.8.10 (July 29, 2020)

- fix #427: support edit routing rule
- fix #436
- update boarding gate and blockchain manager blocklets
- improve abt node launcher blocklet
- add 404 page

## 0.8.9 (July 28, 2020)

- fix #461
- fix #460
- fix #456
- fix #428
- fix #454
- fix #451
- feat #435
- feat #438
- fix #417
- fix #386

## 0.8.8 (July 28, 2020)

- fix router-provider publish failed bug

## 0.8.7 (July 28, 2020)

- fix eslint version bug when run in ci
- fix merge bug
- remove blocklet listening routing rule event
- fix getBlockletBaseUrl function bug in state util lib
- add prefix blacklist
- comment X-Content-Type-Options in nginx config temporarily
- fix nginx config generation bug, and js mime type bug
- fix nginx config directory bug
- fix import normalizePathPrefix bug
- fix nginx config bug
- fix init bug
- split the abtnode/util package
- Merge branch 'master' into feature/init-router-provider
- stop the router when stopping node
- fix routing provider pre-check when starting node
- perfect nginx configuration
- perfect nginx provider check
- add routing provider prerequisite when init & start the node
- fix get Provider bug
- rename proxyType to provider #394
- extract router provider as a standalone package

## 0.8.6 (July 25, 2020)

- chore: bump forge sdk to latest
- [skip travis] update readme

## 0.8.5 (July 24, 2020)

- feat: add router adapter reuse across blocklets
- chore: use base url adapter in daemon webapp
- fix #411: update add text
- fix #410: hide rule tab when no engine be set
- fix #398, #395, #399
- fix #394

## 0.8.4 (July 24, 2020)

- fix: hide deprecated versions in marketplace #418

## 0.8.3 (July 24, 2020)

- fix: https listen syntax error for nginx provider #404
- feat: show https icon along side domain name #404
- fix: use x509 to parse and verify https certificates #414
- feat: basic ngixn cert upload workflow #404
- feat: basic ngixn cert upload dialog #404
- fix #402 403
- fix #401

## 0.8.2 (July 23, 2020)

- removing the blocklet related routing rules after removed the blocklet #406
- fix bug of judging whether routing rule is dirty #392

## 0.8.1 (July 23, 2020)

- fix compatibility bug: remove static key word from class

## 0.8.0 (July 23, 2020)

- fix: start node need reload router
- if no value do not hide the value
- fix: pooling hook caused too much requests
- fix: pooling hook caused too much requests
- fix: do not reload router from cli ops
- fix: appDir for static blocklets not correctly set
- fix: appDir for static blocklets not correctly set
- [router] fix default domain bug and clean useless graphql api
- chore: update use history fallback to replace send
- fix: make sure latest node port is used in routing rules
- Merge branch 'feature/router' of github.com:ArcBlock/abt-node into feature/router
- fix: ip as domain in url resolving
- [router] fix db state bugs
- chore: polish routing snapshots display
- chore: polish routing rules display
- fix: static server should handle spa
- [router] add https support to nginx provider (#387)
- fix: error display in node context
- fix: router page error display
- fix: joi error
- chore: update sidebar tab order
- [router] polish routing rules validation
- [router] add routing rules validation server side
- fix: abtnode bundle should work with static blocklets if they have hooks
- fix: lint errors
- feat: support routing rule snapshots (#383)
- [router] fix '0.0.0.0' domain bug
- chore: make routing table responsive
- chore: commit domain status component
- feat: make default ip as 0.0.0.0 and support domain status component
- fix boarding gate api request error
- fix: port shoud also change when change blocklets
- fix: lint errors
- feat: add check domain api in backend
- chore: cleanup console.log
- Merge branch 'feature/router' of github.com:ArcBlock/abt-node into feature/router
- feat: better routing rule and domain adding ux
- Merge branch 'feature/router' into feature/update-blocklets
- update blocklets
- [router] fix concatenate url bug
- [router] add log to nginx provider
- Merge branch 'feature/router' of github.com:ArcBlock/abt-node into feature/router
- chore: unify button styles and make confirm forms more interactive
- [router] fix nginx config generation bug
- fix: external link for router rules not correctly
- chore: use node domain/ip as default
- chore: polish empty rule list render
- chore: polish empty routing rule render
- Merge branch 'feature/router' of github.com:ArcBlock/abt-node into feature/router
- chore: add hack to disable pooling from local storage
- [router] fix remove rules bug
- chore: bump forge sdk to latest
- [router] add api request to router page
- fix: add rule api payload
- chore: bump forge sdk to latest
- [router] add api request to router page
- [router] fix router config generation
- [router] modify routing rule's data structure
- chore: polish use pooling hook
- feat: display upstream service status on router page
- Merge branch 'master' into feature/router
- fix: remove useless files
- [skip travis] update readme
- chore: polish router page by split into tabs
- Merge branch 'master' into feature/router
- feat: new routing configure ui
- [router] update routing rules graphql api
- chore: polish schema
- [router] add routing rules graphql api
- fix: nginx provider not handling hybird config properly
- fix: nginx provider not handling hybird config properly
- [router] polish router setting page ui
- [router] format generated nginx conf
- [router] add router icon
- [router] move router settings into router page
- [router] disable winston.js as logger tool temperaily
- [router] fix bugs of config node routing
- [router] restart the blocklet after update settings
- [router] fix blocklet settings bug
- [router] fix bugs
- [router] adappt blockchain-manager
- [router] add blocklet router setting
- [router] add router setting page of Node
- [router] add infrastructure and nginx provider

## 0.7.4 (July 16, 2020)

- fix #329
- fix #299
- fix #310

## 0.7.3 (July 15, 2020)

- fix: unique index caused node start failure
- [skip travis] update readme

## 0.7.2 (July 10, 2020)

- fix: blocklet upgrade tip should hide when upgraded
- fix: upgrade not working
- fix: add upgrade tooltip for new blocklet version
- fix: possible cli exit issue #370
- fix: proper handling of broken blocklet detail page
- fix: do not show latest version during an upgrade
- feat: show upgradable blocklets on list and detail

## 0.7.1 (July 07, 2020)

- fix: webapp start in dev env
- fix: test case failure caused by nedb-multi
- fix: time stamp render issue caused by nedb-multi
- fix: typo
- chore: basic implementation of multi-thread disk db

## 0.7.0 (July 07, 2020)

- chore: update cli readme
- feat: add command to list log files #343
- feat: add status command #223
- feat: make stop and kill command the same #223
- [skip travis] update readme
- add vscode settings of the repository
- [skip travis] update cli readme
- [skip travis] update readme

## 0.6.42 (June 26, 2020)

## 0.6.41 (June 26, 2020)

- fix getInterfaceUrl function bug
- [skip travis] update readme

## 0.6.40 (June 26, 2020)

- 修复 states.node.getBaseUrl bug
- 删除数据库中 blocklet 的环境变量: BLOCKLET_BASE_URL
- 修复启动时更新数据库 bug
- 启动时检测 domain 是否改变
- 启动时检测 https 是否改变
- 修复初始化节点错误
- [webapp] 添加设置 blocklet domain 功能
- [webapp] 修改 `Configuration` 重命名为 `Environment`
- 添加`ip`配置项
- [skip travis] update readme

## 0.6.35 (June 23, 2020)

- fix: 开发 Blocklet 时，无法更新 blocklet.group #350
- fix: blocklet init questions
- chore: reorganize cli commands
- fix: add more fields in blocklet init #342
- fix: add node version check before start #340
- fix: add root check for abtnode cli #340
- fix: deploy 本地的 blocklet 如果 main 没设置报错让人摸不着头脑 #348
- feat: support new version upgrade prompt #353
- chore: bump forge sdk version
- fix: ignore noise errors in process manager

## 0.6.34 (June 19, 2020)

- fix blocklet publish config
- [skip travis] update readme

## 0.6.33 (June 19, 2020)

- chore: bump forge sdk version
- [skip travis] update readme

## 0.6.32 (June 17, 2020)

- fix: bundle not copy title attr from package.json

## 0.6.31 (June 16, 2020)

- [skip travis] update readme

## 0.6.30 (June 15, 2020)

- fix start docker failed
- fix port error
- [skip travis] update readme

## 0.6.29 (June 15, 2020)

- fix: enable process.env.NODE_ENV compress in webpack build #335
- fix: cli start command string handling
- feat: 增加类似 gatsby info 这样的自命令方便用户报 bug #336
- chore: remove useless debugger

## 0.6.28 (June 13, 2020)

- fix: update abtnode domina & port when run in docker
- fix: do not throw warning when using public ip

## 0.6.27 (June 12, 2020)

- make init command read config path like other command
- add .dockerignore
- update dockerfile

## 0.6.26 (June 11, 2020)

- read default daemon port from environments

## 0.6.25 (June 11, 2020)

- fix version bump

## 0.6.4 (June 11, 2020)

- fix: abt node launcher responsive ArcBlock/blocklets#34
- fix: blockchain manager naming
- fix: do not show doc link when doc_url is empty #272

## 0.6.23 (June 09, 2020)

- [cli] fix docker init bug
- [cli] add a version output when start
- [docker] fix performance problem
- [blockchain-manager] update readme
- [skip travis] update readme

## 0.6.22 (June 09, 2020)

- [blockchain-manager] add a limit to the number of chains
- [blockchain-manager] fix uptime bug
- [skip travis] update readme

## 0.6.21 (June 09, 2020)

- chore: polish blockchain boarding gate
- fix: env not properly set for deployed blocklets
- fix: bundle command should support blocklet config exported as function

## 0.6.20 (June 08, 2020)

- chore: optimize images

## 0.6.19 (June 08, 2020)

- fix: travis publish for abt-node-launcher

## 0.6.18 (June 08, 2020)

- feat: support selecting provider #316
- fix: include nano instance types #309
- fix: launcher node-id name font issue #319
- chore: rename aws-node-launcher to abt-node-launcher

## 0.6.17 (June 06, 2020)

- feat: support instance name when launch node #303
- fix: display message during spinning #307
- fix: display error message on list instance #301
- chore: bump ux lib to latest version
- fix: broken image on node launch success page #302
- fix: aws node stop button state error #305

## 0.6.16 (June 06, 2020)

- fix: blocklet 如果缺配置项默认进到配置页并展示红色提示 #300
- fix: blocklet 如果必须一些配置项，应该预先出现让用户填空 #300
- fix: error display when fetch blocklets failed

## 0.6.15 (June 05, 2020)

- feat: aws node launcher blocklet #265
- [webapp] polish network error #290

## 0.6.14 (June 04, 2020)

- [CLI] init 时在交互过程中校验数据目录、配置文件目录是否有读写权限 (#296)
- [skip travis] update readme

## 0.6.13 (June 03, 2020)

- 修复 'abtnode start -u' bug
- [skip travis] update readme

## 0.6.12 (June 03, 2020)

- fix port error in init
- fix abtnode cli subcommand error
- [skip travis] update readme

## 0.6.11 (June 02, 2020)

- update components readme
- [skip travis] update readme

## 0.6.10 (June 02, 2020)

- add blocklet:init command
- [skip travis] update readme

## 0.6.9 (May 29, 2020)

- fix blockchain-boarding-gate bug
- [skip travis] update readme

## 0.6.8 (May 29, 2020)

- fix blockchain-boarding-gate publish error
- [skip travis] update readme

## 0.6.7 (May 28, 2020)

- Merge branch 'master' into blockchain-boarding-gate
- support locale
- get chainHost in query string and fill it in the form
- [skip travis] update readme
- bump version
- Merge branch 'master' into blockchain-boarding-gate
- bug fixes
- Merge branch 'blockchain-boarding-gate' of github.com:ArcBlock/abt-node into blockchain-boarding-gate
- update icons and copies
- return chainhost to wallet based on user selection
- allow user to select chainhost
- Merge branch 'master' of github.com:ArcBlock/abt-node into blockchain-boarding-gate
- chore: update readme
- chore: make boarding-gate blocklet deployable to abtnode
- chore: blockchain-boarding-gate blocklet skeleton

## 0.6.6 (May 28, 2020)

- bump version
- cache forge release list #260
- [skip travis] update readme

## 0.6.5 (May 27, 2020)

- chore: cleanup redundant env aggregate file
- chore: remove ABT_NODE_BASE_URL from daemon env
- chore: use dynamic baseUrl instead of static one

## 0.6.4 (May 27, 2020)

- package merge blocklet meta config lib
- 修复 docker 环境下 init 失败 bug #257

## 0.6.3 (May 26, 2020)

- 如果用户输入一个合法的 yaml 配置文件名称，则不允许和数据目录名称相同
- 如果用户输入的配置文件路径不是 yaml 文件路径，生成配置文件时添加`.yml`后缀
- 每次更新数据库时更新 blocklet 所有环境变量
- 更新数据库时重启运行着的 blocklet

## 0.6.2 (May 26, 2020)

- check if the local ip has changed before executing the start/stop/kill/deploy
- chore: only show blocklet uptime when it's running
- [skip travis] update readme

## 0.6.1 (May 26, 2020)

- [skip travis] update readme
- feat: support i18n for blocklets (#270)
- [skip travis] update readme

## 0.6.0 (May 25, 2020)

- fix: cleanup package.json of util lib
- feat: display node environments in blocklet config
- feat: #255
- fix: #258
- fix: #256
- rename @abtnode/js-util to @abtnode/util
- 修改 hooks 的错误处理, 并添加 @abtnode/js-util 包
- fix review: modify memory limitation of blockchain manager
- 将 hooks 执行错误信息放到消息通知里
- [blockchain-manager] add pre-install hook to check system requirements #245

## 0.5.22 (May 25, 2020)

- [blockchain-manager] fix forge_version bug

## 0.5.21 (May 25, 2020)

- fix blocklet environments bug
- [blockchain-manager] fix read local version bug

## 0.5.20 (五月 23, 2020)

- support chain upgrade

## 0.5.19 (五月 23, 2020)

- improve codes
- save moderator when change create type
- support add multi token holders

## 0.5.18 (May 22, 2020)

- fix: should set default notification receiver after setup node
- feat: support multiple token holders when creating chain

## 0.5.17 (May 22, 2020)

- feat: add notification for member related
- fix: remove unescessary block detail refresh
- chore: remove useless sleep
- feat: complete notification workflow
- feat: send notifications on async blocklet operations
- fix: add context for gql resolvers
- feat: update gql console to add extra auth headers
- feat: support notification in core state and gql layer
- feat: update gql client to have notification related methods
- feat: add notifications schema
- feat: put time consuming task into job queue #60
- feat: add md5 and sleep util
- fix: disable action buttons when blocklet operation not complete
- fix: show progress when blocklet operation not complete
- fix: blocklet start error not display correctly on list page
- chore: refactor blocklet manager

## 0.5.16 (May 21, 2020)

- fix silent init bug #238
- [skip travis] update readme

## 0.5.15 (May 21, 2020)

- fix silent start failed
- [skip travis] update readme

## 0.5.14 (May 21, 2020)

- add docker usage

## 0.5.13 (May 21, 2020)

- fix: "Install Latest" 安装的不是最新版 #234
- fix: not display beta version of blocklet by default #233
- fix: should validate node version input
- fix: web 上的版本号在 node 更新后显示不更新 #174
- fix: CLI 发版时需要锁定依赖的版本号 #216
- fix: debug statements
- fix: 在 blocklet 配置里面增加必须的配置项 #232
- fix: consistent font family #212

## 0.5.12 (May 15, 2020)

- fix edit user env bug
- [skip travis] update readme

## 0.5.11 (May 15, 2020)

- update webapp README.md to bump webapp version
- [skip travis] update readme

## 0.5.10 (May 15, 2020)

- fix bundle output file error
- [skip travis] update readme

## 0.5.9 (May 14, 2020)

- [node-manager] add pre-stop hook
- add hooks for blocklet
- modify `abtnode bundle/deploy`

## 0.5.8 (May 14, 2020)

- fix header link clickable area

## 0.5.7 (五月 14, 2020)

- modify tip text #175
- chain overview page support display gql endpoint #201
- fix #200 add empty placeholder
- [skip travis] update readme

## 0.5.6 (May 14, 2020)

- fix: blockchain manager auth routes should be guarged by passport
- fix: AWS AMI usage doc

## 0.5.5 (May 14, 2020)

- feat: support not exit after start to make it compatible in systemd
- [skip travis] update readme

## 0.5.4 (May 13, 2020)

- fix: make blockchain-manager work in production
- feat: save moderator in wallet

## 0.5.3 (May 13, 2020)

- fix: disallow sharing data dir across different abt node instances
- fix: make sleep shorter when on production
- fix: abtnode finally can start on aws ec2 without init
- fix: ec2 detection
- fix: use ec2 public host on init when possible
- feat: support start in silent mode that inits automatically
- fix: crash when do abtnode kill before the node is initialized #196

## 0.5.1 (May 12, 2020)

- fix: should set node as initialized when set owner #189
- fix: uptime is still growing after stopping the blocklet #188
- fix: abtnode stop should not crash when not running #187
- chore: bump dependency version

## 0.5.0 (May 12, 2020)

- chore: remove chain related config from cli
- fix: prepublish script
- feat: use ocap nedb adapter to replace 3rd party chain

## 0.4.28 (May 11, 2020)

- [node-manager] fix react lint error
- v0.4.27

## 0.4.27 (May 11, 2020)

- bump version to v0.4.27

## 0.4.26 (五月 09, 2020)

- Merge branch 'master' into members-manager
- [skip travis] update readme
- improve i18
- improve code
- bump version
- add members manager

## 0.4.25 (May 09, 2020)

- fix: allow user to update database config from cli #115
- fix: error reject reference error

## 0.4.24 (五月 09, 2020)

- fix #162
- fix #166
- fix #163

## 0.4.23 (May 09, 2020)

- fix: public package filter login when do post publish
- feat: use zinc as default chain when init node

## 0.4.22 (May 09, 2020)

- [node-manager] fix start/stop chain state bug

## 0.4.21 (May 08, 2020)

- [node-manager] fix update chains dynamically bug
- [node-manager] fix redirect error
- [skip travis] update readme

## 0.4.20 (May 08, 2020)

- fix: blocklet avatar border
- chore: polish abt node init messages
- fix: blocklet actions align
- feat: support reading config from env and default location
- feat: support abtnode init command #160

## 0.4.19 (May 08, 2020)

- [node-manager] add starting chain state
- [node-manager] add stopping chain state
- [node-manager] load chain states dynamically
- [node-manager] add more infomations to chains page
- [skip travis] update readme

## 0.4.18 (May 08, 2020)

- Merge branch 'master' into wangshijun/polish
- chore: polish blocklet detail action strip
- fix: 删除 blocklet 之后不要停留在详情页而是跳转到列表页 #155
- chore: cleanup useless tags
- chore: cleanup useless tags
- feat: marketplace 里面 blocklet 卡片增加管理入口 #158
- [skip travis] update readme
- feat: display blocklet logo in marketplace
- feat: 支持后台配置 blocklet registry #157
- fix: change auth timeout from 1 minutes to 10 minutes
- feat: add blockletRegistry in node core state
- chore: add logo for core blocklets
- fix: polish logo in blocklet list #152
- fix: polish logo in blocklet list #152
- feat: display logo in detail #152
- feat: display logo in list #152
- feat: add logo url in blocklet meta
- fix: set blocklet environments on install/deploy #156

## 0.4.17 (May 08, 2020)

- [node-manager] refact remove release button
- [node-manager] chore: refact releases code
- [node-manager] disable remove release asset when it's used by existed chain

## 0.4.16 (五月 07, 2020)

- improve code
- fix #80, #81
- fix #105 do not jump to blocklets list after install
- fix #119
- fix #117
- fix #123 after save success reload directly
- fix #124 add check for domain field

## 0.4.15 (May 07, 2020)

- [skip travis] update readme

## 0.4.14 (May 07, 2020)

- [chain-node-manager] 优化创建链过程
- [skip travis] update readme

## 0.4.13 (May 07, 2020)

- fix: error tolerance for blocklet detail page
- fix: attach env when blocklet not started
- fix: can not view blocklet disk usage when not started
- feat: support passing DEBUG env to daemon process

## 0.4.12 (May 07, 2020)

- fix: unify blocklet actions across list and detail
- fix: should not persist user env to system env
- fix: does not allow reset ABT*NODE*\* env var for blocklet
- fix: blocklet detail action loading and disable
- fix: better error message when bundle entry does not exist
- chore: polish blocklet keywords
- fix: blocklet env BLOCKLET_BASE_URL
- fix: blocklet port calc type error
- [skip travis] update readme

## 0.4.11 (May 06, 2020)

- fix: blocklet port are persisted in storage other than dynamic #76
- fix: uptime text
- chore: bump dependency version
- fix: process cleanup logic
- Merge branch 'master' into bugfix
- fix: setup redirect should go home instead of stay current page
- feat: add celebrate emoji after node is setup
- [skip travis] update readme
- fix: version inconsistent in marketplace #116
- fix: cleanup running process before installing/deploying/upgrading #121
- fix: polish ipv display logic #130
- fix: polish ipv6 fetch logic #130
- fix: restart and reload i18n
- feat: display node basic information on panel #108
- fix: Cannot read prperty chaCodeAt of undefined #120

## 0.4.10 (May 06, 2020)

- polish ui
- [skip travis] update readme

## 0.4.9 (May 04, 2020)

- feat: use job queue in blockchain manager
- feat: better job queue support
- chore: basic job queue implementation
- [skip travis] update readme

## 0.4.8 (May 01, 2020)

- improve multi language support

## 0.4.7 (April 30, 2020)

- [chain-node-manager] fix get forge state bug and polish ui

## 0.4.6 (April 30, 2020)

- [skip travis] update readme

## 0.4.5 (April 29, 2020)

- Merge branch 'master' into chain-node-manager
- [chain node manager] chore: update screenshots
- [chain node manager] polish ui
- [chain node manager] 修改读取 sk 方式
- [skip travis] update readme
- [chain node manager] merge master
- [chain node manager] 在 chain overview 页面添加 disk usage 信息
- [chain node manager] 在 chain overview 页面添加 start/stop 按钮
- [chain node manager] 在 chain overview 页面添加更多的信息
- [chain node manager] 添加 chain error status
- [chain node manager] 创建时自动下载未下载的 release
- [chain node manager] 完善操作链时的页面交互
- [chain node manager] 完善快速创建 chain
- [chain node manager] chore: refactor
- [chain node manager] 添加 chain 详情页
- [chain node manager] 修改 create page layout
- [chain node manager] 修改页面布局
- [chain node manager] 修改删除 chain 方法
- [chain node manager] 添加 remove chain 功能
- [chain node manager] merge master
- [chain node manager] ui: 添加 start/stop 操作
- [chain node manager] 将 chains 页面数据替换为真是数据
- [chain node manager] 添加 stop chain
- [chain node manager] chore: fix lint error
- [chain node manager] 添加 start forge web
- [chain node manager] 添加 start chain 接口
- [chain node manager] 将 node-manager 和 release manager 合并
- [chain node manager] add create chain api
- [chain node manager] init project

## 0.4.4 (April 29, 2020)

- [skip travis] update readme

## 0.4.3 (April 29, 2020)

- feat: basic member list on team page
- [skip travis] update readme

## 0.4.2 (April 29, 2020)

- chore: update docs
- feat: add command to kill all related processes
- fix: deploy not using correct config
- [skip travis] update readme

## 0.4.1 (April 29, 2020)

- fix: improper config handling when from inline args
- [skip travis] update readme

## 0.4.0 (April 28, 2020)

- fix: interface display not correct
- fix: ip info should be displayed in dashboard
- fix: ip info api cause slow response
- chore: do not calculate disk size for uploaded blocklet
- fix: sleep shorter
- fix: reload daemon after deploy to load new database
- fix: demo dapp text changes
- chore: bump forge sdk to latest
- fix: eslint errors
- fix: get blocklet wallet is generating key-pair that can not be used
- feat: add passport api
- chore: disable db refresh
- chore: refactor contexts
- chore: update schema
- fix: set blocklet to stopped if we cannot construct runtime info
- fix: bundle command fails after renaming param
- fix: add namespace for blocklet process
- fix: blocklet install time is empty for deployed ones
- feat: put domain/port/https into node state
- chore: polish blocklet deploy script
- fix: use latest process status when fetch blocklet list/detail
- feat: display blocklet group and source in frontend
- fix: daemon and cli db sync issue
- feat: basic deployment workflow
- chore: make node daemon process name constant
- chore: add getBlockletMeta util
- chore: make registry as default blocklet source
- chore: add script to serve a static folder
- chore: rename interface-demo => dapp-demo
- chore: refactor cli config names
- chore: allow static blocklets in registry
- feat: add source field in blocklet state
- fix: should check if blocklet token is used to auth
- feat: add static demo blocklet #69
- chore: change static demo blocklet
- fix: eslint errors
- fix: demo blocklet interface
- chore: change blocklet name
- feat: add demo blocklet that show differnt interfaces
- feat: complete password integrationt test with abt node
- feat: support passport api in abt node dashboard
- feat: add basic passport lib for abt node
- fix: shoule use node info when do did-auth #71
- feat: set abt node related env vars when start blocklet
- fix: polish dashboard blocklet loading
- [skip travis] update readme

## 0.3.8 (April 27, 2020)

- chore: show ip on dashboard #33
- fix: append blocklet version to admin and config iframe to bust cache #65
- feat: login user directly when connected node owner on setup #64
- chore: protect all mutations
- chore: polish loading overlay style
- fix: member count and blocklet count #47 #48
- fix: polish node member display
- fix: show loading indicator for slow blocklet admin or config pages #63
- [skip travis] update readme

## 0.3.7 (April 26, 2020)

- feat: basic blocklet upgrade/downgrade/install backend
- feat: basic blocklet upgrade/downgrade/install button
- feat: add publish date on versions
- chore: add more documentation
- Merge branch 'master' into feat-upgrade
- fix: registry.listVersions is not working
- [skip travis] update readme
- feat: add listVersions api
- feat: add listVersions api
- refactor: rename param for install command
- chore: bump version
- feat: support remove without keeping data in core state
- chore: cleanup eslint errors
- feat: support remove with options
- feat: confirm dialog supports render description with state
- feat: better blocklet dangerous op confirm #38
- feat: add new confirm dialog component
- feat: export useNodeContext hook shortcut
- chore: extract blocklet interface component
- chore: disable blocklet batch operations
- feat: move blocklet install page to marketplace
- chore: bump ux lib version
- chore: update post publish script

## 0.3.6 (April 26, 2020)

- feat: support remove without keeping data in core state
- chore: cleanup eslint errors
- feat: support remove with options
- feat: confirm dialog supports render description with state
- feat: better blocklet dangerous op confirm #38
- feat: add new confirm dialog component
- feat: export useNodeContext hook shortcut
- chore: extract blocklet interface component
- chore: disable blocklet batch operations
- feat: move blocklet install page to marketplace
- chore: bump ux lib version
- chore: update post publish script
- [skip travis] update readme

## 0.3.5 (April 23, 2020)

- fix: cli does not handling bash tilde properly
- Merge branch 'master' of github.com:ArcBlock/abt-node
- chore: increase dashboard post body size limit
- [skip travis] update readme

## 0.3.4 (April 23, 2020)

## 0.3.3 (April 23, 2020)

- chore: add more debug statements
- fix: do not start abt node daemon if node status initialize failed
- fix: get owner function is invalid
- chore: add more test case for node state
- chore: add docs for cli usage
- [skip travis] update readme

## 0.3.2 (April 23, 2020)

- fix: should not commit changes to package.json
- fix: package.json for forge-release-manager
- fix: should not ensure main file exists when start blocklet
- [skip travis] update readme

## 0.3.1 (April 23, 2020)

- [skip travis] update readme

## 0.3.0 (April 23, 2020)

- feat: add admin and config interface preview
- feat: basic dashboard page
- chore: basic settings page
- chore: cleanup some todos
- fix: forge release manager missing required fields in blocklet.json
- fix: add strict validation for blocklet config before bundle
- feat: support automatic refresh of blocklets from blocklet registry
- fix: eslint config

## 0.2.6 (April 22, 2020)

- chore: add forge-release-manager (#26)
- [skip travis] update readme

## 0.2.5 (April 22, 2020)

- fix: should not disconnect when fetch runtime info for multiple blocklets
- chore: send slack notify
- [skip travis] update readme

## 0.2.4 (April 22, 2020)

- fix: blocklet runtime logic extract
- chore: update default logo
- fix: session should not query chain info
- fix: absolute path config is not properly handled
- [skip travis] update readme

## 0.2.3 (April 22, 2020)

- fix: cli release config

## 0.2.2 (April 22, 2020)

- fix: abtnode cli usage from webapp in travis ci

## 0.2.1 (April 22, 2020)

- fix: travis publish

## 0.2.0 (April 22, 2020)

- basic abt node daemon components: state,schema,gql,client,webapp,cli
