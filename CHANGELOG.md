# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).


## [4.0.0] - 2021-02-02
### Changed
- using jsonschema to validate user config input (https://github.com/supertokens/supertokens-node/issues/73)
- Fixed https://github.com/supertokens/supertokens-node/issues/77
- Extracts email verification into its own recipe
- Implements thirdparty recipe
- Sends telemetryId for telemetry

## [3.4.2] - 2021-01-09
## Added
- Telemetry as per https://github.com/supertokens/supertokens-node/issues/85

## [3.4.1] - 2021-02-06
## Added
- Allow users to pass FaunaDB client directly when using Session.init
- Fixes https://github.com/supertokens/supertokens-node/issues/83

## [3.4.0] - 2021-01-28
### Changed
- enableAntiCsrf as config parameter in session recipe
- enableAntiCsrf boolean in session create,verify and refresh APIs if CDI version is 2.6
- cookieSecure to true by default if the apiDomain has https
- if the apiDomain and websiteDomain values are different (no common top level domain), then cookieSameSite will be set to none by default, else set it to lax
- Fixed https://github.com/supertokens/supertokens-node/issues/63

## [3.3.2] - 2021-01-29
### Fixed
- Always sets httpOnly flag to be true for session cookies regardless of if secure flag is on or off.

## [3.3.1] - 2021-01-20
### Changed
- Update superTokensNextWrapper to add a return value.

## [3.3.0] - 2021-01-13
### Added
- Email verification feature
- Change the User object to include timeJoined
- Sends emails to our APIs only if not testing mode
- Add superTokensNextWrapper generic express middleware wrapper
- getUsersNewestFirst, getUsersOldestFirst and getUserCount functions

### Fixed
- Bump axios from 0.19 to 0.21 to fix Critical Dependency


## [3.2.2] - 2020-12-18
### Fixed
- Removes the need for Proxy in NextJS so that if a session is created manually by the user, it still works

## [3.2.1] - 2020-12-16
### Fixed
- Fixes bug for missing return in nextjs helper
- Changed name from supertokenMiddleware to superTokensMiddleware

## [3.2.0] - 2020-12-13
### Changed
- Add NextJS helper

## [3.1.1] - 2020-12-12
### Changed
- If `init` is called multiple times, it does not throw an error

## [3.1.0] - 2020-11-26
### Added
- Added changes as per new FDI: https://github.com/supertokens/frontend-driver-interface/issues/3
   - API to check if an email exists

## [3.0.0] - 2020-11-18
### Added
- EmailPassword login features
   - https://github.com/supertokens/supertokens-node/pull/29

### Changed
- Restructures sessions to be its own recipe
- Other changes:
   - https://github.com/supertokens/supertokens-node/pull/24
   - https://github.com/supertokens/supertokens-node/pull/25
   - https://github.com/supertokens/supertokens-node/pull/45

## [2.5.0] - 2020-09-19
### Added
- FaunaDB integration

## [2.4.1] - 2020-10-15
### Fixed
- Issue #17 - Do not clear cookies if they do not exist in the first place

## [2.4.0] - 2020-09-10
### Added
- Support for CDI 2.3 and FDI 1.2
- Fixes issue #7
- Remove compatibility with CDI 1.0

## [2.3.0] - 2020-08-05
### Added
- auth0Handler function
- `getCORSAllowedHeaders` function to be used by `cors` middleware
- Automatically adds a refresh API if the user calls the `init` function inside `app.use()`
- Support for CDI 2.2

## [2.2.2] - 2020-07-30
### Fixed
- Fixes #2 - Prevents duplicate `Access-Control-Allow-Credentials` header value

## [2.2.1] - 2020-07-14
### Fixed
- Fixed typo in exported typescript type

## [2.2.0] - 2020-06-29
### Addition
- Support for API key
- Compatibility with CDI 2.1

## [2.1.0] - 2020-06-18
### Changes
- config changes and code refactor

## [2.0.0] - 2020-05-04
### Added
- Middleware for verification, refreshing and error handling
- `revokeMultipleSessions` function
- `updateJWTPayload` function
### Changes
- Code refactor
### Breaking changes
- Changed `revokeSessionUsingSessionHandle` => `revokeSession`

## [1.1.0] - 2020-04-19
### Added
- Support for [CDI version 2.0](https://github.com/supertokens/core-driver-interface/blob/master/v2.0.0.txt)