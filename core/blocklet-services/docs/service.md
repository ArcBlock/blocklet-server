# Blocklet Service Features

## Overview

Blocklet Service provides a comprehensive management layer for production blocklet deployments.

## Navigation Structure

### Dashboard

The central hub for frequently accessed functionality.

**Overview**

* Current status: Basic implementation requiring enhancement
* Future vision: Comprehensive overview page with actionable insights and key metrics
* Purpose: Quick access to critical system information and status

**Blocklets**

* Component lifecycle management: Add, remove, start, stop, and upgrade blocklets
* Configuration management: Environment variables and preferences (migrated from legacy Configuration section)
* Streamlined interface for managing all installed blocklets

### AIGNE Hub

Integration management for AIGNE Hub services to provide AI capabilities across all blocklets.

**Features**

* Account balance monitoring
* Account switching functionality
* Centralized AI service management for all blocklets

### DID Connect

Comprehensive user and group management center.

**Users**

* User listing and search
* User groups and segmentation
* Detailed user profiles
* User invitation system

**Passports**

* Issued passport registry
* Passport usage history and analytics
* Passport templates management
* Issue new passports
* Create custom passport types

**Settings**

*Login Settings*

* Session duration configuration
* User profile field requirements
* Authentication behavior customization

*KYC Settings*

* Know Your Customer (KYC) configuration
* Current state: Interface density needs improvement for better user experience
* Comprehensive KYC workflow settings

*OAuth Settings*

* Third-party authentication provider integration
* OAuth credential configuration
* Provider ordering and priority
* Enable/disable authentication channels

*Federated Login Settings*

* Cross-site authentication for federated site clusters
* Single sign-on (SSO) configuration

### Security

Advanced security controls for authentication and response handling.

**Sections**

* **Security Rules**: Define security policies and rule sets
* **Access Policies**: Control access permissions and restrictions
* **Response Policies**: Configure response security headers and behaviors

### Website

Complete website presentation and branding management (critical for site administrators).

**Domains**

* Domain registration and management
* Custom domain configuration
* URL mapping and routing rules

**Branding**

* Application title and description
* Multi-language support configuration
* Logo and visual identity management
* Splash screen images
* OpenGraph metadata and background images

**Theming**

* Typography configuration (font family, sizes)
* Color scheme customization
* Visual design system management
* Reference: https://team.arcblock.io/task/task/556635418687176704

**Navigation**

* Navigation menu configuration
* Live preview functionality for real-time navigation testing
* Enhanced user experience for navigation management

### Operations

Aggregated operational and administrative functions for production management.

**Notifications**

* Notification history and listing
* Notification retry and resend functionality
* Multi-channel notification settings (Email, PushKit)

**Audit Logs**

* Comprehensive audit trail
* Advanced filtering and search
* Detailed log entry inspection

**Analytics**

* Traffic analysis and metrics
* Visitor statistics and insights
* Performance monitoring

**Advanced**

* Low-frequency administrative functions (formerly "danger zone")
* Ownership transfer
* Vault configuration
* DID rotation
* Cache management and clearing
* Deletion protection settings

### Integrations

External system integration and API management.

**WebHooks**

* WebHook registry and listing
* WebHook configuration and details
* Event subscription management

**Access Keys**

* Programmatic API access management
* Access key browsing and viewing
* Create and manage API credentials

**Developers**

* Developer-focused tools and features
* Can be hidden by default in advanced settings to reduce interface complexity
* Technical integrations and debugging tools

### Developers

Dedicated developer tools and resources (can be hidden to reduce system complexity).

**Logs**

* Real-time log viewer (current Log Viewer implementation)
* Historical log file browser
* Log filtering and search capabilities

**Performance**

* Blocklet runtime monitoring
* Performance metrics visualization (Memory, CPU, Docker, etc.)
* Resource utilization dashboards

**Docs**

* Embedded documentation portal
* Quick links to common documentation resources
* Integration with main documentation site

### DID Spaces

Decentralized storage management with DID Spaces integration.

**Backups**

* Backup history and records
* Automated backup strategies
* DID Spaces connection management
* Backup restoration tools

**Storage**

* Storage quota and usage monitoring
* File management interface
* Storage configuration settings

### Blocklet Studio

No-code blocklet creation, management, and publishing platform.

**Scope**

* Maintain existing functionality
* Visual blocklet builder
* Simplified publishing workflow
* Template-based blocklet creation
