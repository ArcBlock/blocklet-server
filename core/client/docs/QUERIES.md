# ABT Node GraphQL API List


> Updated on 2026-02-27T04:18:46.695Z

## Table of Contents

## Queries

### getBlocklet

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
{
  getBlocklet {
    code
    blocklet {
      appDid
      appPid
      bundleSource
      createdAt
      deployedFrom
      dynamic
      enableDocker
      enableDockerNetwork
      enablePassportIssuance
      externalSk
      externalSkSource
      installedAt
      mode
      mountPoint
      pausedAt
      port
      ports
      source
      startedAt
      status
      stoppedAt
      structVersion
      updatedAt
      appRuntimeInfo {
        cpus
        cpuUsage
        memoryUsage
        pid
        port
        runningDocker
        uptime
      }
      children {
        bundleSource
        createdAt
        deployedFrom
        dynamic
        greenStatus
        installedAt
        mode
        mountPoint
        pausedAt
        port
        ports
        required
        source
        startedAt
        status
        stoppedAt
        appRuntimeInfo {
          cpus
          cpuUsage
          memoryUsage
          pid
          port
          runningDocker
          uptime
        }
        children {
          bundleSource
          createdAt
          deployedFrom
          dynamic
          greenStatus
          installedAt
          mode
          mountPoint
          pausedAt
          port
          ports
          required
          source
          startedAt
          status
          stoppedAt
          appRuntimeInfo {
            cpus
            cpuUsage
            memoryUsage
            pid
            port
            runningDocker
            uptime
          }
          children {
            bundleSource
            createdAt
            deployedFrom
            dynamic
            greenStatus
            installedAt
            mode
            mountPoint
            pausedAt
            port
            ports
            required
            source
            startedAt
            status
            stoppedAt
            appRuntimeInfo {
              cpus
              cpuUsage
              memoryUsage
              pid
              port
              runningDocker
              uptime
            }
            children {
              bundleSource
              createdAt
              deployedFrom
              dynamic
              greenStatus
              installedAt
              mode
              mountPoint
              pausedAt
              port
              ports
              required
              source
              startedAt
              status
              stoppedAt
              appRuntimeInfo {
                cpus
                cpuUsage
                memoryUsage
                pid
                port
                runningDocker
                uptime
              }
              children {
                bundleSource
                createdAt
                deployedFrom
                dynamic
                greenStatus
                installedAt
                mode
                mountPoint
                pausedAt
                port
                ports
                required
                source
                startedAt
                status
                stoppedAt
              }
              configs {
                custom
                description
                key
                required
                secure
                shared
                validation
                value
              }
              dependents {
                id
                required
              }
              diskInfo {
                app
                blocklets
                cache
                data
                log
              }
              engine {
                available
                description
                displayName
                logo
                name
                version
                visible
              }
              environments {
                custom
                description
                key
                required
                secure
                shared
                validation
                value
              }
              meta {
                bundleDid
                bundleName
                community
                description
                did
                documentation
                engine
                group
                homepage
                keywords
                lastPublishedAt
                logo
                main
                name
                navigation
                nftFactory
                path
                resources
                screenshots
                support
                title
                version
              }
              runtimeInfo {
                cpus
                cpuUsage
                memoryUsage
                pid
                port
                runningDocker
                uptime
              }
            }
            configs {
              custom
              description
              key
              required
              secure
              shared
              validation
              value
            }
            dependents {
              id
              required
            }
            diskInfo {
              app
              blocklets
              cache
              data
              log
            }
            engine {
              available
              description
              displayName
              logo
              name
              version
              visible
            }
            environments {
              custom
              description
              key
              required
              secure
              shared
              validation
              value
            }
            meta {
              bundleDid
              bundleName
              community
              description
              did
              documentation
              engine
              group
              homepage
              keywords
              lastPublishedAt
              logo
              main
              name
              navigation
              nftFactory
              path
              resources
              screenshots
              support
              title
              version
              author {
                email
                name
                url
              }
              capabilities {
                clusterMode
                component
                didSpace
                navigation
                resourceExportApi
              }
              components {
                mountPoint
                name
                required
              }
              contributors {
                email
                name
                url
              }
              dist {
                integrity
                tarball
              }
              docker {
                image
                installNodeModules
                runBaseScript
                shell
              }
              environments {
                default
                description
                name
                required
                secure
                shared
                validation
              }
              events {
                description
                type
              }
              interfaces {
                cacheable
                name
                pageGroups
                path
                port
                prefix
                protocol
                type
              }
              maintainers {
                email
                name
                url
              }
              owner {
                avatar
                did
                email
                fullName
              }
              repository {
                type
                url
              }
              requirements {
                aigne
                cpu
                os
                server
              }
              resource {
                exportApi
              }
              stats {
                downloads
                purchases
                star
              }
            }
            runtimeInfo {
              cpus
              cpuUsage
              memoryUsage
              pid
              port
              runningDocker
              uptime
            }
          }
          configs {
            custom
            description
            key
            required
            secure
            shared
            validation
            value
          }
          dependents {
            id
            required
          }
          diskInfo {
            app
            blocklets
            cache
            data
            log
          }
          engine {
            available
            description
            displayName
            logo
            name
            version
            visible
          }
          environments {
            custom
            description
            key
            required
            secure
            shared
            validation
            value
          }
          meta {
            bundleDid
            bundleName
            community
            description
            did
            documentation
            engine
            group
            homepage
            keywords
            lastPublishedAt
            logo
            main
            name
            navigation
            nftFactory
            path
            resources
            screenshots
            support
            title
            version
            author {
              email
              name
              url
            }
            capabilities {
              clusterMode
              component
              didSpace
              navigation
              resourceExportApi
            }
            components {
              mountPoint
              name
              required
            }
            contributors {
              email
              name
              url
            }
            dist {
              integrity
              tarball
            }
            docker {
              image
              installNodeModules
              runBaseScript
              shell
            }
            environments {
              default
              description
              name
              required
              secure
              shared
              validation
            }
            events {
              description
              type
            }
            interfaces {
              cacheable
              name
              pageGroups
              path
              port
              prefix
              protocol
              type
              services {
                config
                name
              }
            }
            maintainers {
              email
              name
              url
            }
            owner {
              avatar
              did
              email
              fullName
            }
            payment {
              price {
                address
                symbol
                value
              }
              share {
                address
                name
                value
              }
            }
            repository {
              type
              url
            }
            requirements {
              aigne
              cpu
              os
              server
              fuels {
                address
                endpoint
                reason
                value
              }
            }
            resource {
              exportApi
              bundles {
                did
                public
                type
              }
              types {
                description
                type
              }
            }
            stats {
              downloads
              purchases
              star
            }
          }
          runtimeInfo {
            cpus
            cpuUsage
            memoryUsage
            pid
            port
            runningDocker
            uptime
          }
        }
        configs {
          custom
          description
          key
          required
          secure
          shared
          validation
          value
        }
        dependents {
          id
          required
        }
        diskInfo {
          app
          blocklets
          cache
          data
          log
        }
        engine {
          available
          description
          displayName
          logo
          name
          version
          visible
        }
        environments {
          custom
          description
          key
          required
          secure
          shared
          validation
          value
        }
        meta {
          bundleDid
          bundleName
          community
          description
          did
          documentation
          engine
          group
          homepage
          keywords
          lastPublishedAt
          logo
          main
          name
          navigation
          nftFactory
          path
          resources
          screenshots
          support
          title
          version
          author {
            email
            name
            url
          }
          capabilities {
            clusterMode
            component
            didSpace
            navigation
            resourceExportApi
          }
          components {
            mountPoint
            name
            required
          }
          contributors {
            email
            name
            url
          }
          dist {
            integrity
            tarball
          }
          docker {
            image
            installNodeModules
            runBaseScript
            shell
          }
          environments {
            default
            description
            name
            required
            secure
            shared
            validation
          }
          events {
            description
            type
          }
          interfaces {
            cacheable
            name
            pageGroups
            path
            port
            prefix
            protocol
            type
            services {
              config
              name
            }
          }
          maintainers {
            email
            name
            url
          }
          owner {
            avatar
            did
            email
            fullName
          }
          payment {
            price {
              address
              symbol
              value
            }
            share {
              address
              name
              value
            }
          }
          repository {
            type
            url
          }
          requirements {
            aigne
            cpu
            os
            server
            fuels {
              address
              endpoint
              reason
              value
            }
          }
          resource {
            exportApi
            bundles {
              did
              public
              type
            }
            types {
              description
              type
            }
          }
          stats {
            downloads
            purchases
            star
          }
        }
        runtimeInfo {
          cpus
          cpuUsage
          memoryUsage
          pid
          port
          runningDocker
          uptime
        }
      }
      configs {
        custom
        description
        key
        required
        secure
        shared
        validation
        value
      }
      controller {
        chainHost
        consumedAt
        expireDate
        id
        launcherSessionId
        launcherUrl
        nftId
        nftOwner
        ownerDid
        status {
          reason
          value
        }
      }
      diskInfo {
        app
        blocklets
        cache
        data
        log
      }
      engine {
        available
        description
        displayName
        logo
        name
        version
        visible
      }
      environments {
        custom
        description
        key
        required
        secure
        shared
        validation
        value
      }
      meta {
        bundleDid
        bundleName
        community
        description
        did
        documentation
        engine
        group
        homepage
        keywords
        lastPublishedAt
        logo
        main
        name
        navigation
        nftFactory
        path
        resources
        screenshots
        support
        title
        version
        author {
          email
          name
          url
        }
        capabilities {
          clusterMode
          component
          didSpace
          navigation
          resourceExportApi
        }
        components {
          mountPoint
          name
          required
        }
        contributors {
          email
          name
          url
        }
        dist {
          integrity
          tarball
        }
        docker {
          image
          installNodeModules
          runBaseScript
          shell
        }
        environments {
          default
          description
          name
          required
          secure
          shared
          validation
        }
        events {
          description
          type
        }
        interfaces {
          cacheable
          name
          pageGroups
          path
          port
          prefix
          protocol
          type
          services {
            config
            name
          }
        }
        maintainers {
          email
          name
          url
        }
        owner {
          avatar
          did
          email
          fullName
        }
        payment {
          price {
            address
            symbol
            value
          }
          share {
            address
            name
            value
          }
        }
        repository {
          type
          url
        }
        requirements {
          aigne
          cpu
          os
          server
          fuels {
            address
            endpoint
            reason
            value
          }
        }
        resource {
          exportApi
          bundles {
            did
            public
            type
          }
          types {
            description
            type
          }
        }
        stats {
          downloads
          purchases
          star
        }
      }
      migratedFrom {
        appDid
        appSk
        at
      }
      optionalComponents {
        bundleSource
        logoUrl
        dependencies {
          mountPoint
          parentDid
          parentName
          parentTitle
          required
        }
        meta {
          bundleDid
          bundleName
          community
          description
          did
          documentation
          engine
          group
          homepage
          keywords
          lastPublishedAt
          logo
          main
          name
          navigation
          nftFactory
          path
          resources
          screenshots
          support
          title
          version
          author {
            email
            name
            url
          }
          capabilities {
            clusterMode
            component
            didSpace
            navigation
            resourceExportApi
          }
          components {
            mountPoint
            name
            required
          }
          contributors {
            email
            name
            url
          }
          dist {
            integrity
            tarball
          }
          docker {
            image
            installNodeModules
            runBaseScript
            shell
          }
          environments {
            default
            description
            name
            required
            secure
            shared
            validation
          }
          events {
            description
            type
          }
          interfaces {
            cacheable
            name
            pageGroups
            path
            port
            prefix
            protocol
            type
            services {
              config
              name
            }
          }
          maintainers {
            email
            name
            url
          }
          owner {
            avatar
            did
            email
            fullName
          }
          payment {
            price {
              address
              symbol
              value
            }
            share {
              address
              name
              value
            }
          }
          repository {
            type
            url
          }
          requirements {
            aigne
            cpu
            os
            server
            fuels {
              address
              endpoint
              reason
              value
            }
          }
          resource {
            exportApi
            bundles {
              did
              public
              type
            }
            types {
              description
              type
            }
          }
          stats {
            downloads
            purchases
            star
          }
        }
      }
      runtimeInfo {
        cpus
        cpuUsage
        memoryUsage
        pid
        port
        runningDocker
        uptime
      }
      settings {
        actionConfig
        authentication
        didConnect
        enablePassportIssuance
        enableSessionHardening
        initialized
        notification
        oauth
        publicToStore
        theme
        whoCanAccess
        aigne {
          accessKeyId
          key
          model
          provider
          secretAccessKey
          url
          validationResult
        }
        autoBackup {
          enabled
        }
        autoCheckUpdate {
          enabled
        }
        children {
          deletedAt
          deployedFrom
          mountPoint
          status
          meta {
            bundleDid
            bundleName
            description
            did
            name
            title
            version
          }
        }
        endpointList {
          appDescription
          appName
          endpoint
          id
          protected
          scope
          url
        }
        federated {
          config {
            appId
            appPid
            autoLogin
            delegation
            isMaster
          }
          sites {
            aliasDid
            aliasDomain
            appDescription
            appId
            appliedAt
            appLogo
            appLogoRect
            appName
            appPid
            appUrl
            did
            isMaster
            pk
            serverId
            serverVersion
            status
            version
          }
        }
        gateway {
          cacheEnabled
          blockPolicy {
            blacklist
            enabled
            autoBlocking {
              blockDuration
              enabled
              statusCodes
              windowQuota
              windowSize
            }
          }
          proxyPolicy {
            enabled
            realIpHeader
            trustedProxies
            trustRecursive
          }
          requestLimit {
            burstDelay
            burstFactor
            enabled
            global
            methods
            rate
          }
          wafPolicy {
            enabled
            inboundAnomalyScoreThreshold
            logLevel
            mode
            outboundAnomalyScoreThreshold
          }
        }
        invite {
          enabled
        }
        navigations {
          activeColor
          activeIcon
          color
          component
          description
          from
          icon
          id
          link
          parent
          private
          role
          section
          title
          visible
        }
        org {
          enabled
          maxMemberPerOrg
          maxOrgPerUser
        }
        owner {
          did
          pk
        }
        session {
          cacheTtl
          enableBlacklist
          salt
          ttl
          email {
            domainBlackList
            domainWhiteList
            enabled
            enableDomainBlackList
            enableDomainWhiteList
            requireUnique
            requireVerified
            trustOauthProviders
            trustedIssuers {
              id
              name
              pk
            }
          }
          phone {
            enabled
            enableRegionBlackList
            enableRegionWhiteList
            regionBlackList
            regionWhiteList
            requireUnique
            requireVerified
            trustedIssuers {
              id
              name
              pk
            }
          }
        }
        storeList {
          cdnUrl
          description
          id
          logoUrl
          maintainer
          name
          protected
          scope
          url
        }
        subService {
          domain
          enabled
          staticRoot
        }
        trustedFactories {
          factoryAddress
          holderDid
          issuerDid
          remark
          passport {
            role
            ttl
            ttlPolicy
          }
        }
        trustedPassports {
          issuerDid
          remark
          mappings {
            from {
              passport
            }
            to {
              role
              ttl
              ttlPolicy
            }
          }
        }
      }
      site {
        corsAllowedOrigins
        domain
        domainAliases
        id
        isProtected
        rules {
          id
          isProtected
          from {
            pathPrefix
            header {
              key
              type
              value
            }
          }
          to {
            componentId
            did
            interfaceName
            pageGroup
            port
            redirectCode
            type
            url
            response {
              body
              contentType
              status
            }
          }
        }
      }
      trustedFactories {
        factoryAddress
        holderDid
        issuerDid
        remark
        passport {
          role
          ttl
          ttlPolicy
        }
      }
      trustedPassports {
        issuerDid
        remark
        mappings {
          from {
            passport
          }
          to {
            role
            ttl
            ttlPolicy
          }
        }
      }
      vaults {
        approverDid
        approverPk
        approverSig
        at
        did
        pk
        sig
      }
    }
  }
}
```

### getBlockletMetaFromUrl

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
{
  getBlockletMetaFromUrl {
    code
    inStore
    isFree
    registryUrl
    meta {
      bundleDid
      bundleName
      community
      description
      did
      documentation
      engine
      group
      homepage
      keywords
      lastPublishedAt
      logo
      main
      name
      navigation
      nftFactory
      path
      resources
      screenshots
      support
      title
      version
      author {
        email
        name
        url
      }
      capabilities {
        clusterMode
        component
        didSpace
        navigation
        resourceExportApi
      }
      components {
        mountPoint
        name
        required
      }
      contributors {
        email
        name
        url
      }
      dist {
        integrity
        tarball
      }
      docker {
        image
        installNodeModules
        runBaseScript
        shell
      }
      environments {
        default
        description
        name
        required
        secure
        shared
        validation
      }
      events {
        description
        type
      }
      interfaces {
        cacheable
        name
        pageGroups
        path
        port
        prefix
        protocol
        type
        services {
          config
          name
        }
      }
      maintainers {
        email
        name
        url
      }
      owner {
        avatar
        did
        email
        fullName
      }
      payment {
        price {
          address
          symbol
          value
        }
        share {
          address
          name
          value
        }
      }
      repository {
        type
        url
      }
      requirements {
        aigne
        cpu
        os
        server
        fuels {
          address
          endpoint
          reason
          value
        }
      }
      resource {
        exportApi
        bundles {
          did
          public
          type
        }
        types {
          description
          type
        }
      }
      stats {
        downloads
        purchases
        star
      }
    }
  }
}
```

### getBlockletDiff

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
{
  getBlockletDiff {
    code
    blockletDiff {
      addSet
      changeSet
      deleteSet
      hasBlocklet
      version
    }
  }
}
```

### getBlocklets

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
{
  getBlocklets {
    code
    blocklets {
      appDid
      appPid
      bundleSource
      createdAt
      deployedFrom
      dynamic
      enableDocker
      enableDockerNetwork
      enablePassportIssuance
      externalSk
      externalSkSource
      installedAt
      mode
      mountPoint
      pausedAt
      port
      ports
      source
      startedAt
      status
      stoppedAt
      structVersion
      updatedAt
      appRuntimeInfo {
        cpus
        cpuUsage
        memoryUsage
        pid
        port
        runningDocker
        uptime
      }
      children {
        bundleSource
        createdAt
        deployedFrom
        dynamic
        greenStatus
        installedAt
        mode
        mountPoint
        pausedAt
        port
        ports
        required
        source
        startedAt
        status
        stoppedAt
        appRuntimeInfo {
          cpus
          cpuUsage
          memoryUsage
          pid
          port
          runningDocker
          uptime
        }
        children {
          bundleSource
          createdAt
          deployedFrom
          dynamic
          greenStatus
          installedAt
          mode
          mountPoint
          pausedAt
          port
          ports
          required
          source
          startedAt
          status
          stoppedAt
          appRuntimeInfo {
            cpus
            cpuUsage
            memoryUsage
            pid
            port
            runningDocker
            uptime
          }
          children {
            bundleSource
            createdAt
            deployedFrom
            dynamic
            greenStatus
            installedAt
            mode
            mountPoint
            pausedAt
            port
            ports
            required
            source
            startedAt
            status
            stoppedAt
            appRuntimeInfo {
              cpus
              cpuUsage
              memoryUsage
              pid
              port
              runningDocker
              uptime
            }
            children {
              bundleSource
              createdAt
              deployedFrom
              dynamic
              greenStatus
              installedAt
              mode
              mountPoint
              pausedAt
              port
              ports
              required
              source
              startedAt
              status
              stoppedAt
              appRuntimeInfo {
                cpus
                cpuUsage
                memoryUsage
                pid
                port
                runningDocker
                uptime
              }
              children {
                bundleSource
                createdAt
                deployedFrom
                dynamic
                greenStatus
                installedAt
                mode
                mountPoint
                pausedAt
                port
                ports
                required
                source
                startedAt
                status
                stoppedAt
              }
              configs {
                custom
                description
                key
                required
                secure
                shared
                validation
                value
              }
              dependents {
                id
                required
              }
              diskInfo {
                app
                blocklets
                cache
                data
                log
              }
              engine {
                available
                description
                displayName
                logo
                name
                version
                visible
              }
              environments {
                custom
                description
                key
                required
                secure
                shared
                validation
                value
              }
              meta {
                bundleDid
                bundleName
                community
                description
                did
                documentation
                engine
                group
                homepage
                keywords
                lastPublishedAt
                logo
                main
                name
                navigation
                nftFactory
                path
                resources
                screenshots
                support
                title
                version
              }
              runtimeInfo {
                cpus
                cpuUsage
                memoryUsage
                pid
                port
                runningDocker
                uptime
              }
            }
            configs {
              custom
              description
              key
              required
              secure
              shared
              validation
              value
            }
            dependents {
              id
              required
            }
            diskInfo {
              app
              blocklets
              cache
              data
              log
            }
            engine {
              available
              description
              displayName
              logo
              name
              version
              visible
            }
            environments {
              custom
              description
              key
              required
              secure
              shared
              validation
              value
            }
            meta {
              bundleDid
              bundleName
              community
              description
              did
              documentation
              engine
              group
              homepage
              keywords
              lastPublishedAt
              logo
              main
              name
              navigation
              nftFactory
              path
              resources
              screenshots
              support
              title
              version
              author {
                email
                name
                url
              }
              capabilities {
                clusterMode
                component
                didSpace
                navigation
                resourceExportApi
              }
              components {
                mountPoint
                name
                required
              }
              contributors {
                email
                name
                url
              }
              dist {
                integrity
                tarball
              }
              docker {
                image
                installNodeModules
                runBaseScript
                shell
              }
              environments {
                default
                description
                name
                required
                secure
                shared
                validation
              }
              events {
                description
                type
              }
              interfaces {
                cacheable
                name
                pageGroups
                path
                port
                prefix
                protocol
                type
              }
              maintainers {
                email
                name
                url
              }
              owner {
                avatar
                did
                email
                fullName
              }
              repository {
                type
                url
              }
              requirements {
                aigne
                cpu
                os
                server
              }
              resource {
                exportApi
              }
              stats {
                downloads
                purchases
                star
              }
            }
            runtimeInfo {
              cpus
              cpuUsage
              memoryUsage
              pid
              port
              runningDocker
              uptime
            }
          }
          configs {
            custom
            description
            key
            required
            secure
            shared
            validation
            value
          }
          dependents {
            id
            required
          }
          diskInfo {
            app
            blocklets
            cache
            data
            log
          }
          engine {
            available
            description
            displayName
            logo
            name
            version
            visible
          }
          environments {
            custom
            description
            key
            required
            secure
            shared
            validation
            value
          }
          meta {
            bundleDid
            bundleName
            community
            description
            did
            documentation
            engine
            group
            homepage
            keywords
            lastPublishedAt
            logo
            main
            name
            navigation
            nftFactory
            path
            resources
            screenshots
            support
            title
            version
            author {
              email
              name
              url
            }
            capabilities {
              clusterMode
              component
              didSpace
              navigation
              resourceExportApi
            }
            components {
              mountPoint
              name
              required
            }
            contributors {
              email
              name
              url
            }
            dist {
              integrity
              tarball
            }
            docker {
              image
              installNodeModules
              runBaseScript
              shell
            }
            environments {
              default
              description
              name
              required
              secure
              shared
              validation
            }
            events {
              description
              type
            }
            interfaces {
              cacheable
              name
              pageGroups
              path
              port
              prefix
              protocol
              type
              services {
                config
                name
              }
            }
            maintainers {
              email
              name
              url
            }
            owner {
              avatar
              did
              email
              fullName
            }
            payment {
              price {
                address
                symbol
                value
              }
              share {
                address
                name
                value
              }
            }
            repository {
              type
              url
            }
            requirements {
              aigne
              cpu
              os
              server
              fuels {
                address
                endpoint
                reason
                value
              }
            }
            resource {
              exportApi
              bundles {
                did
                public
                type
              }
              types {
                description
                type
              }
            }
            stats {
              downloads
              purchases
              star
            }
          }
          runtimeInfo {
            cpus
            cpuUsage
            memoryUsage
            pid
            port
            runningDocker
            uptime
          }
        }
        configs {
          custom
          description
          key
          required
          secure
          shared
          validation
          value
        }
        dependents {
          id
          required
        }
        diskInfo {
          app
          blocklets
          cache
          data
          log
        }
        engine {
          available
          description
          displayName
          logo
          name
          version
          visible
        }
        environments {
          custom
          description
          key
          required
          secure
          shared
          validation
          value
        }
        meta {
          bundleDid
          bundleName
          community
          description
          did
          documentation
          engine
          group
          homepage
          keywords
          lastPublishedAt
          logo
          main
          name
          navigation
          nftFactory
          path
          resources
          screenshots
          support
          title
          version
          author {
            email
            name
            url
          }
          capabilities {
            clusterMode
            component
            didSpace
            navigation
            resourceExportApi
          }
          components {
            mountPoint
            name
            required
          }
          contributors {
            email
            name
            url
          }
          dist {
            integrity
            tarball
          }
          docker {
            image
            installNodeModules
            runBaseScript
            shell
          }
          environments {
            default
            description
            name
            required
            secure
            shared
            validation
          }
          events {
            description
            type
          }
          interfaces {
            cacheable
            name
            pageGroups
            path
            port
            prefix
            protocol
            type
            services {
              config
              name
            }
          }
          maintainers {
            email
            name
            url
          }
          owner {
            avatar
            did
            email
            fullName
          }
          payment {
            price {
              address
              symbol
              value
            }
            share {
              address
              name
              value
            }
          }
          repository {
            type
            url
          }
          requirements {
            aigne
            cpu
            os
            server
            fuels {
              address
              endpoint
              reason
              value
            }
          }
          resource {
            exportApi
            bundles {
              did
              public
              type
            }
            types {
              description
              type
            }
          }
          stats {
            downloads
            purchases
            star
          }
        }
        runtimeInfo {
          cpus
          cpuUsage
          memoryUsage
          pid
          port
          runningDocker
          uptime
        }
      }
      configs {
        custom
        description
        key
        required
        secure
        shared
        validation
        value
      }
      controller {
        chainHost
        consumedAt
        expireDate
        id
        launcherSessionId
        launcherUrl
        nftId
        nftOwner
        ownerDid
        status {
          reason
          value
        }
      }
      diskInfo {
        app
        blocklets
        cache
        data
        log
      }
      engine {
        available
        description
        displayName
        logo
        name
        version
        visible
      }
      environments {
        custom
        description
        key
        required
        secure
        shared
        validation
        value
      }
      meta {
        bundleDid
        bundleName
        community
        description
        did
        documentation
        engine
        group
        homepage
        keywords
        lastPublishedAt
        logo
        main
        name
        navigation
        nftFactory
        path
        resources
        screenshots
        support
        title
        version
        author {
          email
          name
          url
        }
        capabilities {
          clusterMode
          component
          didSpace
          navigation
          resourceExportApi
        }
        components {
          mountPoint
          name
          required
        }
        contributors {
          email
          name
          url
        }
        dist {
          integrity
          tarball
        }
        docker {
          image
          installNodeModules
          runBaseScript
          shell
        }
        environments {
          default
          description
          name
          required
          secure
          shared
          validation
        }
        events {
          description
          type
        }
        interfaces {
          cacheable
          name
          pageGroups
          path
          port
          prefix
          protocol
          type
          services {
            config
            name
          }
        }
        maintainers {
          email
          name
          url
        }
        owner {
          avatar
          did
          email
          fullName
        }
        payment {
          price {
            address
            symbol
            value
          }
          share {
            address
            name
            value
          }
        }
        repository {
          type
          url
        }
        requirements {
          aigne
          cpu
          os
          server
          fuels {
            address
            endpoint
            reason
            value
          }
        }
        resource {
          exportApi
          bundles {
            did
            public
            type
          }
          types {
            description
            type
          }
        }
        stats {
          downloads
          purchases
          star
        }
      }
      migratedFrom {
        appDid
        appSk
        at
      }
      optionalComponents {
        bundleSource
        logoUrl
        dependencies {
          mountPoint
          parentDid
          parentName
          parentTitle
          required
        }
        meta {
          bundleDid
          bundleName
          community
          description
          did
          documentation
          engine
          group
          homepage
          keywords
          lastPublishedAt
          logo
          main
          name
          navigation
          nftFactory
          path
          resources
          screenshots
          support
          title
          version
          author {
            email
            name
            url
          }
          capabilities {
            clusterMode
            component
            didSpace
            navigation
            resourceExportApi
          }
          components {
            mountPoint
            name
            required
          }
          contributors {
            email
            name
            url
          }
          dist {
            integrity
            tarball
          }
          docker {
            image
            installNodeModules
            runBaseScript
            shell
          }
          environments {
            default
            description
            name
            required
            secure
            shared
            validation
          }
          events {
            description
            type
          }
          interfaces {
            cacheable
            name
            pageGroups
            path
            port
            prefix
            protocol
            type
            services {
              config
              name
            }
          }
          maintainers {
            email
            name
            url
          }
          owner {
            avatar
            did
            email
            fullName
          }
          payment {
            price {
              address
              symbol
              value
            }
            share {
              address
              name
              value
            }
          }
          repository {
            type
            url
          }
          requirements {
            aigne
            cpu
            os
            server
            fuels {
              address
              endpoint
              reason
              value
            }
          }
          resource {
            exportApi
            bundles {
              did
              public
              type
            }
            types {
              description
              type
            }
          }
          stats {
            downloads
            purchases
            star
          }
        }
      }
      runtimeInfo {
        cpus
        cpuUsage
        memoryUsage
        pid
        port
        runningDocker
        uptime
      }
      settings {
        actionConfig
        authentication
        didConnect
        enablePassportIssuance
        enableSessionHardening
        initialized
        notification
        oauth
        publicToStore
        theme
        whoCanAccess
        aigne {
          accessKeyId
          key
          model
          provider
          secretAccessKey
          url
          validationResult
        }
        autoBackup {
          enabled
        }
        autoCheckUpdate {
          enabled
        }
        children {
          deletedAt
          deployedFrom
          mountPoint
          status
          meta {
            bundleDid
            bundleName
            description
            did
            name
            title
            version
          }
        }
        endpointList {
          appDescription
          appName
          endpoint
          id
          protected
          scope
          url
        }
        federated {
          config {
            appId
            appPid
            autoLogin
            delegation
            isMaster
          }
          sites {
            aliasDid
            aliasDomain
            appDescription
            appId
            appliedAt
            appLogo
            appLogoRect
            appName
            appPid
            appUrl
            did
            isMaster
            pk
            serverId
            serverVersion
            status
            version
          }
        }
        gateway {
          cacheEnabled
          blockPolicy {
            blacklist
            enabled
            autoBlocking {
              blockDuration
              enabled
              statusCodes
              windowQuota
              windowSize
            }
          }
          proxyPolicy {
            enabled
            realIpHeader
            trustedProxies
            trustRecursive
          }
          requestLimit {
            burstDelay
            burstFactor
            enabled
            global
            methods
            rate
          }
          wafPolicy {
            enabled
            inboundAnomalyScoreThreshold
            logLevel
            mode
            outboundAnomalyScoreThreshold
          }
        }
        invite {
          enabled
        }
        navigations {
          activeColor
          activeIcon
          color
          component
          description
          from
          icon
          id
          link
          parent
          private
          role
          section
          title
          visible
        }
        org {
          enabled
          maxMemberPerOrg
          maxOrgPerUser
        }
        owner {
          did
          pk
        }
        session {
          cacheTtl
          enableBlacklist
          salt
          ttl
          email {
            domainBlackList
            domainWhiteList
            enabled
            enableDomainBlackList
            enableDomainWhiteList
            requireUnique
            requireVerified
            trustOauthProviders
            trustedIssuers {
              id
              name
              pk
            }
          }
          phone {
            enabled
            enableRegionBlackList
            enableRegionWhiteList
            regionBlackList
            regionWhiteList
            requireUnique
            requireVerified
            trustedIssuers {
              id
              name
              pk
            }
          }
        }
        storeList {
          cdnUrl
          description
          id
          logoUrl
          maintainer
          name
          protected
          scope
          url
        }
        subService {
          domain
          enabled
          staticRoot
        }
        trustedFactories {
          factoryAddress
          holderDid
          issuerDid
          remark
          passport {
            role
            ttl
            ttlPolicy
          }
        }
        trustedPassports {
          issuerDid
          remark
          mappings {
            from {
              passport
            }
            to {
              role
              ttl
              ttlPolicy
            }
          }
        }
      }
      site {
        corsAllowedOrigins
        domain
        domainAliases
        id
        isProtected
        rules {
          id
          isProtected
          from {
            pathPrefix
            header {
              key
              type
              value
            }
          }
          to {
            componentId
            did
            interfaceName
            pageGroup
            port
            redirectCode
            type
            url
            response {
              body
              contentType
              status
            }
          }
        }
      }
      trustedFactories {
        factoryAddress
        holderDid
        issuerDid
        remark
        passport {
          role
          ttl
          ttlPolicy
        }
      }
      trustedPassports {
        issuerDid
        remark
        mappings {
          from {
            passport
          }
          to {
            role
            ttl
            ttlPolicy
          }
        }
      }
      vaults {
        approverDid
        approverPk
        approverSig
        at
        did
        pk
        sig
      }
    }
    paging {
      page
      pageCount
      pageSize
      total
    }
  }
}
```

### getBlockletRuntimeHistory

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
{
  getBlockletRuntimeHistory {
    code
    historyList {
      key
      value {
        cpu
        date
        mem
      }
    }
  }
}
```

### getBlockletsFromBackup

#### Arguments

No arguments

#### Result Format

```graphql
{
  getBlockletsFromBackup {
    code
    backups {
      appDid
      appPid
      createdAt
      name
    }
  }
}
```

### getDynamicComponents

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
{
  getDynamicComponents {
    code
    components {
      bundleSource
      createdAt
      deployedFrom
      dynamic
      greenStatus
      installedAt
      mode
      mountPoint
      pausedAt
      port
      ports
      required
      source
      startedAt
      status
      stoppedAt
      appRuntimeInfo {
        cpus
        cpuUsage
        memoryUsage
        pid
        port
        runningDocker
        uptime
      }
      children {
        bundleSource
        createdAt
        deployedFrom
        dynamic
        greenStatus
        installedAt
        mode
        mountPoint
        pausedAt
        port
        ports
        required
        source
        startedAt
        status
        stoppedAt
        appRuntimeInfo {
          cpus
          cpuUsage
          memoryUsage
          pid
          port
          runningDocker
          uptime
        }
        children {
          bundleSource
          createdAt
          deployedFrom
          dynamic
          greenStatus
          installedAt
          mode
          mountPoint
          pausedAt
          port
          ports
          required
          source
          startedAt
          status
          stoppedAt
          appRuntimeInfo {
            cpus
            cpuUsage
            memoryUsage
            pid
            port
            runningDocker
            uptime
          }
          children {
            bundleSource
            createdAt
            deployedFrom
            dynamic
            greenStatus
            installedAt
            mode
            mountPoint
            pausedAt
            port
            ports
            required
            source
            startedAt
            status
            stoppedAt
            appRuntimeInfo {
              cpus
              cpuUsage
              memoryUsage
              pid
              port
              runningDocker
              uptime
            }
            children {
              bundleSource
              createdAt
              deployedFrom
              dynamic
              greenStatus
              installedAt
              mode
              mountPoint
              pausedAt
              port
              ports
              required
              source
              startedAt
              status
              stoppedAt
              appRuntimeInfo {
                cpus
                cpuUsage
                memoryUsage
                pid
                port
                runningDocker
                uptime
              }
              children {
                bundleSource
                createdAt
                deployedFrom
                dynamic
                greenStatus
                installedAt
                mode
                mountPoint
                pausedAt
                port
                ports
                required
                source
                startedAt
                status
                stoppedAt
              }
              configs {
                custom
                description
                key
                required
                secure
                shared
                validation
                value
              }
              dependents {
                id
                required
              }
              diskInfo {
                app
                blocklets
                cache
                data
                log
              }
              engine {
                available
                description
                displayName
                logo
                name
                version
                visible
              }
              environments {
                custom
                description
                key
                required
                secure
                shared
                validation
                value
              }
              meta {
                bundleDid
                bundleName
                community
                description
                did
                documentation
                engine
                group
                homepage
                keywords
                lastPublishedAt
                logo
                main
                name
                navigation
                nftFactory
                path
                resources
                screenshots
                support
                title
                version
              }
              runtimeInfo {
                cpus
                cpuUsage
                memoryUsage
                pid
                port
                runningDocker
                uptime
              }
            }
            configs {
              custom
              description
              key
              required
              secure
              shared
              validation
              value
            }
            dependents {
              id
              required
            }
            diskInfo {
              app
              blocklets
              cache
              data
              log
            }
            engine {
              available
              description
              displayName
              logo
              name
              version
              visible
            }
            environments {
              custom
              description
              key
              required
              secure
              shared
              validation
              value
            }
            meta {
              bundleDid
              bundleName
              community
              description
              did
              documentation
              engine
              group
              homepage
              keywords
              lastPublishedAt
              logo
              main
              name
              navigation
              nftFactory
              path
              resources
              screenshots
              support
              title
              version
              author {
                email
                name
                url
              }
              capabilities {
                clusterMode
                component
                didSpace
                navigation
                resourceExportApi
              }
              components {
                mountPoint
                name
                required
              }
              contributors {
                email
                name
                url
              }
              dist {
                integrity
                tarball
              }
              docker {
                image
                installNodeModules
                runBaseScript
                shell
              }
              environments {
                default
                description
                name
                required
                secure
                shared
                validation
              }
              events {
                description
                type
              }
              interfaces {
                cacheable
                name
                pageGroups
                path
                port
                prefix
                protocol
                type
              }
              maintainers {
                email
                name
                url
              }
              owner {
                avatar
                did
                email
                fullName
              }
              repository {
                type
                url
              }
              requirements {
                aigne
                cpu
                os
                server
              }
              resource {
                exportApi
              }
              stats {
                downloads
                purchases
                star
              }
            }
            runtimeInfo {
              cpus
              cpuUsage
              memoryUsage
              pid
              port
              runningDocker
              uptime
            }
          }
          configs {
            custom
            description
            key
            required
            secure
            shared
            validation
            value
          }
          dependents {
            id
            required
          }
          diskInfo {
            app
            blocklets
            cache
            data
            log
          }
          engine {
            available
            description
            displayName
            logo
            name
            version
            visible
          }
          environments {
            custom
            description
            key
            required
            secure
            shared
            validation
            value
          }
          meta {
            bundleDid
            bundleName
            community
            description
            did
            documentation
            engine
            group
            homepage
            keywords
            lastPublishedAt
            logo
            main
            name
            navigation
            nftFactory
            path
            resources
            screenshots
            support
            title
            version
            author {
              email
              name
              url
            }
            capabilities {
              clusterMode
              component
              didSpace
              navigation
              resourceExportApi
            }
            components {
              mountPoint
              name
              required
            }
            contributors {
              email
              name
              url
            }
            dist {
              integrity
              tarball
            }
            docker {
              image
              installNodeModules
              runBaseScript
              shell
            }
            environments {
              default
              description
              name
              required
              secure
              shared
              validation
            }
            events {
              description
              type
            }
            interfaces {
              cacheable
              name
              pageGroups
              path
              port
              prefix
              protocol
              type
              services {
                config
                name
              }
            }
            maintainers {
              email
              name
              url
            }
            owner {
              avatar
              did
              email
              fullName
            }
            payment {
              price {
                address
                symbol
                value
              }
              share {
                address
                name
                value
              }
            }
            repository {
              type
              url
            }
            requirements {
              aigne
              cpu
              os
              server
              fuels {
                address
                endpoint
                reason
                value
              }
            }
            resource {
              exportApi
              bundles {
                did
                public
                type
              }
              types {
                description
                type
              }
            }
            stats {
              downloads
              purchases
              star
            }
          }
          runtimeInfo {
            cpus
            cpuUsage
            memoryUsage
            pid
            port
            runningDocker
            uptime
          }
        }
        configs {
          custom
          description
          key
          required
          secure
          shared
          validation
          value
        }
        dependents {
          id
          required
        }
        diskInfo {
          app
          blocklets
          cache
          data
          log
        }
        engine {
          available
          description
          displayName
          logo
          name
          version
          visible
        }
        environments {
          custom
          description
          key
          required
          secure
          shared
          validation
          value
        }
        meta {
          bundleDid
          bundleName
          community
          description
          did
          documentation
          engine
          group
          homepage
          keywords
          lastPublishedAt
          logo
          main
          name
          navigation
          nftFactory
          path
          resources
          screenshots
          support
          title
          version
          author {
            email
            name
            url
          }
          capabilities {
            clusterMode
            component
            didSpace
            navigation
            resourceExportApi
          }
          components {
            mountPoint
            name
            required
          }
          contributors {
            email
            name
            url
          }
          dist {
            integrity
            tarball
          }
          docker {
            image
            installNodeModules
            runBaseScript
            shell
          }
          environments {
            default
            description
            name
            required
            secure
            shared
            validation
          }
          events {
            description
            type
          }
          interfaces {
            cacheable
            name
            pageGroups
            path
            port
            prefix
            protocol
            type
            services {
              config
              name
            }
          }
          maintainers {
            email
            name
            url
          }
          owner {
            avatar
            did
            email
            fullName
          }
          payment {
            price {
              address
              symbol
              value
            }
            share {
              address
              name
              value
            }
          }
          repository {
            type
            url
          }
          requirements {
            aigne
            cpu
            os
            server
            fuels {
              address
              endpoint
              reason
              value
            }
          }
          resource {
            exportApi
            bundles {
              did
              public
              type
            }
            types {
              description
              type
            }
          }
          stats {
            downloads
            purchases
            star
          }
        }
        runtimeInfo {
          cpus
          cpuUsage
          memoryUsage
          pid
          port
          runningDocker
          uptime
        }
      }
      configs {
        custom
        description
        key
        required
        secure
        shared
        validation
        value
      }
      dependents {
        id
        required
      }
      diskInfo {
        app
        blocklets
        cache
        data
        log
      }
      engine {
        available
        description
        displayName
        logo
        name
        version
        visible
      }
      environments {
        custom
        description
        key
        required
        secure
        shared
        validation
        value
      }
      meta {
        bundleDid
        bundleName
        community
        description
        did
        documentation
        engine
        group
        homepage
        keywords
        lastPublishedAt
        logo
        main
        name
        navigation
        nftFactory
        path
        resources
        screenshots
        support
        title
        version
        author {
          email
          name
          url
        }
        capabilities {
          clusterMode
          component
          didSpace
          navigation
          resourceExportApi
        }
        components {
          mountPoint
          name
          required
        }
        contributors {
          email
          name
          url
        }
        dist {
          integrity
          tarball
        }
        docker {
          image
          installNodeModules
          runBaseScript
          shell
        }
        environments {
          default
          description
          name
          required
          secure
          shared
          validation
        }
        events {
          description
          type
        }
        interfaces {
          cacheable
          name
          pageGroups
          path
          port
          prefix
          protocol
          type
          services {
            config
            name
          }
        }
        maintainers {
          email
          name
          url
        }
        owner {
          avatar
          did
          email
          fullName
        }
        payment {
          price {
            address
            symbol
            value
          }
          share {
            address
            name
            value
          }
        }
        repository {
          type
          url
        }
        requirements {
          aigne
          cpu
          os
          server
          fuels {
            address
            endpoint
            reason
            value
          }
        }
        resource {
          exportApi
          bundles {
            did
            public
            type
          }
          types {
            description
            type
          }
        }
        stats {
          downloads
          purchases
          star
        }
      }
      runtimeInfo {
        cpus
        cpuUsage
        memoryUsage
        pid
        port
        runningDocker
        uptime
      }
    }
  }
}
```

### getNodeInfo

#### Arguments

No arguments

#### Result Format

```graphql
{
  getNodeInfo {
    code
    info {
      autoUpgrade
      createdAt
      description
      did
      didDomain
      didRegistry
      diskAlertThreshold
      enableBetaRelease
      enableDocker
      enableDockerNetwork
      enableFileSystemIsolation
      enablePassportIssuance
      enableSessionHardening
      enableWelcomePage
      initialized
      initializedAt
      isDockerInstalled
      mode
      name
      nextVersion
      nftDomainUrl
      pk
      port
      registerUrl
      sessionSalt
      startedAt
      status
      upgradeSessionId
      uptime
      version
      webWalletUrl
      blockletRegistryList {
        cdnUrl
        description
        id
        logoUrl
        maintainer
        name
        protected
        scope
        url
      }
      environments {
        custom
        description
        key
        required
        secure
        shared
        validation
        value
      }
      launcher {
        chainHost
        did
        provider
        tag
        type
        url
      }
      nodeOwner {
        did
        pk
      }
      ownerNft {
        did
        holder
        issuer
        launcherSessionId
      }
      routing {
        adminPath
        cacheEnabled
        provider
        snapshotHash
        blockPolicy {
          blacklist
          enabled
          autoBlocking {
            blockDuration
            enabled
            statusCodes
            windowQuota
            windowSize
          }
        }
        proxyPolicy {
          enabled
          realIpHeader
          trustedProxies
          trustRecursive
        }
        requestLimit {
          burstDelay
          burstFactor
          enabled
          global
          methods
          rate
        }
        wafPolicy {
          enabled
          inboundAnomalyScoreThreshold
          logLevel
          mode
          outboundAnomalyScoreThreshold
        }
      }
      runtimeConfig {
        blockletMaxMemoryLimit
        daemonMaxMemoryLimit
      }
      trustedFactories {
        factoryAddress
        holderDid
        issuerDid
        remark
        passport {
          role
          ttl
          ttlPolicy
        }
      }
      trustedPassports {
        issuerDid
        remark
        mappings {
          from {
            passport
          }
          to {
            role
            ttl
            ttlPolicy
          }
        }
      }
    }
  }
}
```

### resetNodeStatus

#### Arguments

No arguments

#### Result Format

```graphql
{
  resetNodeStatus {
    code
    info {
      autoUpgrade
      createdAt
      description
      did
      didDomain
      didRegistry
      diskAlertThreshold
      enableBetaRelease
      enableDocker
      enableDockerNetwork
      enableFileSystemIsolation
      enablePassportIssuance
      enableSessionHardening
      enableWelcomePage
      initialized
      initializedAt
      isDockerInstalled
      mode
      name
      nextVersion
      nftDomainUrl
      pk
      port
      registerUrl
      sessionSalt
      startedAt
      status
      upgradeSessionId
      uptime
      version
      webWalletUrl
      blockletRegistryList {
        cdnUrl
        description
        id
        logoUrl
        maintainer
        name
        protected
        scope
        url
      }
      environments {
        custom
        description
        key
        required
        secure
        shared
        validation
        value
      }
      launcher {
        chainHost
        did
        provider
        tag
        type
        url
      }
      nodeOwner {
        did
        pk
      }
      ownerNft {
        did
        holder
        issuer
        launcherSessionId
      }
      routing {
        adminPath
        cacheEnabled
        provider
        snapshotHash
        blockPolicy {
          blacklist
          enabled
          autoBlocking {
            blockDuration
            enabled
            statusCodes
            windowQuota
            windowSize
          }
        }
        proxyPolicy {
          enabled
          realIpHeader
          trustedProxies
          trustRecursive
        }
        requestLimit {
          burstDelay
          burstFactor
          enabled
          global
          methods
          rate
        }
        wafPolicy {
          enabled
          inboundAnomalyScoreThreshold
          logLevel
          mode
          outboundAnomalyScoreThreshold
        }
      }
      runtimeConfig {
        blockletMaxMemoryLimit
        daemonMaxMemoryLimit
      }
      trustedFactories {
        factoryAddress
        holderDid
        issuerDid
        remark
        passport {
          role
          ttl
          ttlPolicy
        }
      }
      trustedPassports {
        issuerDid
        remark
        mappings {
          from {
            passport
          }
          to {
            role
            ttl
            ttlPolicy
          }
        }
      }
    }
  }
}
```

### getNodeEnv

#### Arguments

No arguments

#### Result Format

```graphql
{
  getNodeEnv {
    code
    info {
      dbProvider
      docker
      gitpod
      image
      location
      os
      routerProvider
      blockletEngines {
        available
        description
        displayName
        logo
        name
        version
        visible
      }
      disk {
        app
        blocklets
        cache
        data
        log
      }
      ip {
        externalV4
        externalV6
        internalV4
        internalV6
      }
    }
  }
}
```

### checkNodeVersion

#### Arguments

No arguments

#### Result Format

```graphql
{
  checkNodeVersion {
    code
    version
  }
}
```

### getDelegationState

#### Arguments

No arguments

#### Result Format

```graphql
{
  getDelegationState {
    code
    state {
      delegated
    }
  }
}
```

### getNodeRuntimeHistory

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
{
  getNodeRuntimeHistory {
    code
    history {
      cpu
      daemonMem
      date
      hubMem
      mem
      serviceMem
    }
  }
}
```

### getBlockletMeta

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
{
  getBlockletMeta {
    code
    meta
  }
}
```

### getNotifications

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
{
  getNotifications {
    code
    unreadCount
    list {
      action
      componentDid
      createdAt
      data
      description
      entityId
      entityType
      feedType
      id
      options
      read
      receiver
      sender
      severity
      source
      title
      type
      actions {
        bgColor
        color
        link
        name
        title
        utm {
          campaign
          content
          medium
          source
        }
      }
      activity {
        actor
        meta
        target
        type
      }
      actorInfo {
        approved
        avatar
        createdAt
        createdByAppPid
        did
        didSpace
        email
        emailVerified
        extra
        firstLoginAt
        fullName
        generation
        inviter
        isFollowing
        lastLoginAt
        lastLoginIp
        locale
        name
        phone
        phoneVerified
        pk
        remark
        role
        sourceAppPid
        sourceProvider
        updatedAt
        url
        userSessionsCount
        address {
          city
          country
          line1
          line2
          postalCode
          province
        }
        connectedAccounts {
          did
          extra
          id
          lastLoginAt
          pk
          provider
          userInfo {
            email
            emailVerified
            extraData
            name
            picture
            sub
          }
        }
        metadata {
          bio
          cover
          location
          timezone
          links {
            favicon
            url
          }
          phone {
            country
            phoneNumber
          }
          status {
            dateRange
            duration
            icon
            label
          }
        }
        passports {
          expirationDate
          id
          issuanceDate
          lastLoginAt
          name
          parentDid
          role
          scope
          source
          status
          title
          type
          userDid
          display {
            content
            type
          }
          issuer {
            id
            name
            pk
          }
          user {
            approved
            avatar
            createdAt
            did
            email
            fullName
            locale
            pk
            role
            updatedAt
          }
        }
        tags {
          color
          componentDid
          createdAt
          createdBy
          description
          id
          parentId
          slug
          title
          type
          updatedAt
          updatedBy
        }
        userSessions {
          appPid
          createdAt
          createdByAppPid
          extra
          id
          lastLoginIp
          passportId
          status
          ua
          updatedAt
          userDid
          visitorId
        }
      }
      attachments {
        data
        fields
        type
      }
      blocks {
        data
        fields
        type
      }
      receivers {
        createdAt
        deviceId
        email
        emailSendAt
        emailSendFailedReason
        emailSendStatus
        id
        notificationId
        pushKitSendAt
        pushKitSendFailedReason
        pushKitSendStatus
        read
        readAt
        receiver
        walletSendAt
        walletSendFailedReason
        walletSendStatus
        webhook
        webhookUrls
        emailSendRecord {
          failedReason
          sendAt
          sendStatus
        }
        pushKitSendRecord {
          failedReason
          sendAt
          sendStatus
        }
        receiverUser {
          approved
          avatar
          createdAt
          createdByAppPid
          did
          didSpace
          email
          emailVerified
          extra
          firstLoginAt
          fullName
          generation
          inviter
          isFollowing
          lastLoginAt
          lastLoginIp
          locale
          name
          phone
          phoneVerified
          pk
          remark
          role
          sourceAppPid
          sourceProvider
          updatedAt
          url
          userSessionsCount
          address {
            city
            country
            line1
            line2
            postalCode
            province
          }
          connectedAccounts {
            did
            extra
            id
            lastLoginAt
            pk
            provider
            userInfo {
              email
              emailVerified
              extraData
              name
              picture
              sub
            }
          }
          metadata {
            bio
            cover
            location
            timezone
            links {
              favicon
              url
            }
            phone {
              country
              phoneNumber
            }
            status {
              dateRange
              duration
              icon
              label
            }
          }
          passports {
            expirationDate
            id
            issuanceDate
            lastLoginAt
            name
            parentDid
            role
            scope
            source
            status
            title
            type
            userDid
            display {
              content
              type
            }
            issuer {
              id
              name
              pk
            }
            user {
              approved
              avatar
              createdAt
              did
              email
              fullName
              locale
              pk
              role
              updatedAt
            }
          }
          tags {
            color
            componentDid
            createdAt
            createdBy
            description
            id
            parentId
            slug
            title
            type
            updatedAt
            updatedBy
          }
          userSessions {
            appPid
            createdAt
            createdByAppPid
            extra
            id
            lastLoginIp
            passportId
            status
            ua
            updatedAt
            userDid
            visitorId
          }
        }
        walletSendRecord {
          failedReason
          sendAt
          sendStatus
        }
      }
      statistics {
        total
        email {
          failed
          pending
          success
          total
        }
        push {
          failed
          pending
          success
          total
        }
        wallet {
          failed
          pending
          success
          total
        }
        webhook {
          failed
          pending
          success
          total
        }
      }
      utm {
        campaign
        content
        medium
        source
      }
    }
    paging {
      page
      pageCount
      pageSize
      total
    }
  }
}
```

### makeAllNotificationsAsRead

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
{
  makeAllNotificationsAsRead {
    code
    data {
      notificationIds
      numAffected
    }
  }
}
```

### getNotificationSendLog

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
{
  getNotificationSendLog {
    code
    list {
      action
      componentDid
      createdAt
      data
      description
      entityId
      entityType
      feedType
      id
      options
      read
      receiver
      sender
      severity
      source
      title
      type
      actions {
        bgColor
        color
        link
        name
        title
        utm {
          campaign
          content
          medium
          source
        }
      }
      activity {
        actor
        meta
        target
        type
      }
      actorInfo {
        approved
        avatar
        createdAt
        createdByAppPid
        did
        didSpace
        email
        emailVerified
        extra
        firstLoginAt
        fullName
        generation
        inviter
        isFollowing
        lastLoginAt
        lastLoginIp
        locale
        name
        phone
        phoneVerified
        pk
        remark
        role
        sourceAppPid
        sourceProvider
        updatedAt
        url
        userSessionsCount
        address {
          city
          country
          line1
          line2
          postalCode
          province
        }
        connectedAccounts {
          did
          extra
          id
          lastLoginAt
          pk
          provider
          userInfo {
            email
            emailVerified
            extraData
            name
            picture
            sub
          }
        }
        metadata {
          bio
          cover
          location
          timezone
          links {
            favicon
            url
          }
          phone {
            country
            phoneNumber
          }
          status {
            dateRange
            duration
            icon
            label
          }
        }
        passports {
          expirationDate
          id
          issuanceDate
          lastLoginAt
          name
          parentDid
          role
          scope
          source
          status
          title
          type
          userDid
          display {
            content
            type
          }
          issuer {
            id
            name
            pk
          }
          user {
            approved
            avatar
            createdAt
            did
            email
            fullName
            locale
            pk
            role
            updatedAt
          }
        }
        tags {
          color
          componentDid
          createdAt
          createdBy
          description
          id
          parentId
          slug
          title
          type
          updatedAt
          updatedBy
        }
        userSessions {
          appPid
          createdAt
          createdByAppPid
          extra
          id
          lastLoginIp
          passportId
          status
          ua
          updatedAt
          userDid
          visitorId
        }
      }
      attachments {
        data
        fields
        type
      }
      blocks {
        data
        fields
        type
      }
      receivers {
        createdAt
        deviceId
        email
        emailSendAt
        emailSendFailedReason
        emailSendStatus
        id
        notificationId
        pushKitSendAt
        pushKitSendFailedReason
        pushKitSendStatus
        read
        readAt
        receiver
        walletSendAt
        walletSendFailedReason
        walletSendStatus
        webhook
        webhookUrls
        emailSendRecord {
          failedReason
          sendAt
          sendStatus
        }
        pushKitSendRecord {
          failedReason
          sendAt
          sendStatus
        }
        receiverUser {
          approved
          avatar
          createdAt
          createdByAppPid
          did
          didSpace
          email
          emailVerified
          extra
          firstLoginAt
          fullName
          generation
          inviter
          isFollowing
          lastLoginAt
          lastLoginIp
          locale
          name
          phone
          phoneVerified
          pk
          remark
          role
          sourceAppPid
          sourceProvider
          updatedAt
          url
          userSessionsCount
          address {
            city
            country
            line1
            line2
            postalCode
            province
          }
          connectedAccounts {
            did
            extra
            id
            lastLoginAt
            pk
            provider
            userInfo {
              email
              emailVerified
              extraData
              name
              picture
              sub
            }
          }
          metadata {
            bio
            cover
            location
            timezone
            links {
              favicon
              url
            }
            phone {
              country
              phoneNumber
            }
            status {
              dateRange
              duration
              icon
              label
            }
          }
          passports {
            expirationDate
            id
            issuanceDate
            lastLoginAt
            name
            parentDid
            role
            scope
            source
            status
            title
            type
            userDid
            display {
              content
              type
            }
            issuer {
              id
              name
              pk
            }
            user {
              approved
              avatar
              createdAt
              did
              email
              fullName
              locale
              pk
              role
              updatedAt
            }
          }
          tags {
            color
            componentDid
            createdAt
            createdBy
            description
            id
            parentId
            slug
            title
            type
            updatedAt
            updatedBy
          }
          userSessions {
            appPid
            createdAt
            createdByAppPid
            extra
            id
            lastLoginIp
            passportId
            status
            ua
            updatedAt
            userDid
            visitorId
          }
        }
        walletSendRecord {
          failedReason
          sendAt
          sendStatus
        }
      }
      statistics {
        total
        email {
          failed
          pending
          success
          total
        }
        push {
          failed
          pending
          success
          total
        }
        wallet {
          failed
          pending
          success
          total
        }
        webhook {
          failed
          pending
          success
          total
        }
      }
      utm {
        campaign
        content
        medium
        source
      }
    }
    paging {
      page
      pageCount
      pageSize
      total
    }
  }
}
```

### getReceivers

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
{
  getReceivers {
    code
    list {
      createdAt
      deviceId
      email
      emailSendAt
      emailSendFailedReason
      emailSendStatus
      id
      notificationId
      pushKitSendAt
      pushKitSendFailedReason
      pushKitSendStatus
      read
      readAt
      receiver
      walletSendAt
      walletSendFailedReason
      walletSendStatus
      webhook
      webhookUrls
      emailSendRecord {
        failedReason
        sendAt
        sendStatus
      }
      pushKitSendRecord {
        failedReason
        sendAt
        sendStatus
      }
      receiverUser {
        approved
        avatar
        createdAt
        createdByAppPid
        did
        didSpace
        email
        emailVerified
        extra
        firstLoginAt
        fullName
        generation
        inviter
        isFollowing
        lastLoginAt
        lastLoginIp
        locale
        name
        phone
        phoneVerified
        pk
        remark
        role
        sourceAppPid
        sourceProvider
        updatedAt
        url
        userSessionsCount
        address {
          city
          country
          line1
          line2
          postalCode
          province
        }
        connectedAccounts {
          did
          extra
          id
          lastLoginAt
          pk
          provider
          userInfo {
            email
            emailVerified
            extraData
            name
            picture
            sub
          }
        }
        metadata {
          bio
          cover
          location
          timezone
          links {
            favicon
            url
          }
          phone {
            country
            phoneNumber
          }
          status {
            dateRange
            duration
            icon
            label
          }
        }
        passports {
          expirationDate
          id
          issuanceDate
          lastLoginAt
          name
          parentDid
          role
          scope
          source
          status
          title
          type
          userDid
          display {
            content
            type
          }
          issuer {
            id
            name
            pk
          }
          user {
            approved
            avatar
            createdAt
            did
            email
            fullName
            locale
            pk
            role
            updatedAt
          }
        }
        tags {
          color
          componentDid
          createdAt
          createdBy
          description
          id
          parentId
          slug
          title
          type
          updatedAt
          updatedBy
        }
        userSessions {
          appPid
          createdAt
          createdByAppPid
          extra
          id
          lastLoginIp
          passportId
          status
          ua
          updatedAt
          userDid
          visitorId
        }
      }
      walletSendRecord {
        failedReason
        sendAt
        sendStatus
      }
    }
    paging {
      page
      pageCount
      pageSize
      total
    }
  }
}
```

### getNotificationComponents

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
{
  getNotificationComponents {
    code
    componentDids
  }
}
```

### resendNotification

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
{
  resendNotification {
    code
    data
  }
}
```

### getRoutingSites

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
{
  getRoutingSites {
    code
    sites {
      corsAllowedOrigins
      domain
      domainAliases
      id
      isProtected
      rules {
        id
        isProtected
        from {
          pathPrefix
          header {
            key
            type
            value
          }
        }
        to {
          componentId
          did
          interfaceName
          pageGroup
          port
          redirectCode
          type
          url
          response {
            body
            contentType
            status
          }
        }
      }
    }
  }
}
```

### getRoutingProviders

#### Arguments

No arguments

#### Result Format

```graphql
{
  getRoutingProviders {
    code
    providers {
      available
      description
      error
      name
      running
    }
  }
}
```

### isDidDomain

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
{
  isDidDomain {
    code
    value
  }
}
```

### getCertificates

#### Arguments

No arguments

#### Result Format

```graphql
{
  getCertificates {
    code
    certificates {
      createdAt
      domain
      id
      isProtected
      name
      source
      status
      updatedAt
      matchedSites {
        domain
        id
      }
      meta {
        fingerprint
        fingerprintAlg
        sans
        validFrom
        validityPeriod
        validTo
        issuer {
          commonName
          countryName
          organizationName
        }
      }
    }
  }
}
```

### checkDomains

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
{
  checkDomains {
    code
  }
}
```

### findCertificateByDomain

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
{
  findCertificateByDomain {
    code
    cert {
      createdAt
      domain
      id
      isProtected
      name
      source
      status
      updatedAt
      matchedSites {
        domain
        id
      }
      meta {
        fingerprint
        fingerprintAlg
        sans
        validFrom
        validityPeriod
        validTo
        issuer {
          commonName
          countryName
          organizationName
        }
      }
    }
  }
}
```

### getAccessKeys

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
{
  getAccessKeys {
    code
    list {
      accessKeyId
      accessKeyPublic
      authType
      componentDid
      createdAt
      createdBy
      createdVia
      expireAt
      lastUsedAt
      passport
      remark
      resourceId
      resourceType
      updatedAt
      updatedBy
    }
    paging {
      page
      pageCount
      pageSize
      total
    }
  }
}
```

### getAccessKey

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
{
  getAccessKey {
    code
    data {
      accessKeyId
      accessKeyPublic
      authType
      componentDid
      createdAt
      createdBy
      createdVia
      expireAt
      lastUsedAt
      passport
      remark
      resourceId
      resourceType
      updatedAt
      updatedBy
    }
  }
}
```

### getWebHooks

#### Arguments

No arguments

#### Result Format

```graphql
{
  getWebHooks {
    code
    webhooks {
      createdAt
      id
      type
      updatedAt
      params {
        consecutiveFailures
        defaultValue
        description
        enabled
        name
        required
        type
        value
      }
    }
  }
}
```

### getWebhookSenders

#### Arguments

No arguments

#### Result Format

```graphql
{
  getWebhookSenders {
    code
    senders {
      description
      title
      type
      params {
        consecutiveFailures
        defaultValue
        description
        enabled
        name
        required
        type
        value
      }
    }
  }
}
```

### sendTestMessage

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
{
  sendTestMessage {
    code
  }
}
```

### getSession

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
{
  getSession {
    code
    session
  }
}
```

### getRoles

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
{
  getRoles {
    code
    roles {
      description
      extra
      grants
      isProtected
      name
      orgId
      title
    }
  }
}
```

### getRole

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
{
  getRole {
    code
    role {
      description
      extra
      grants
      isProtected
      name
      orgId
      title
    }
  }
}
```

### getPermissions

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
{
  getPermissions {
    code
    permissions {
      description
      isProtected
      name
    }
  }
}
```

### getInvitations

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
{
  getInvitations {
    code
    invitations {
      expireDate
      interfaceName
      inviteId
      inviteUserDids
      orgId
      remark
      role
      teamDid
      display {
        content
        type
      }
      inviter {
        approved
        avatar
        createdAt
        createdByAppPid
        did
        didSpace
        email
        emailVerified
        extra
        firstLoginAt
        fullName
        generation
        inviter
        isFollowing
        lastLoginAt
        lastLoginIp
        locale
        name
        phone
        phoneVerified
        pk
        remark
        role
        sourceAppPid
        sourceProvider
        updatedAt
        url
        userSessionsCount
        address {
          city
          country
          line1
          line2
          postalCode
          province
        }
        connectedAccounts {
          did
          extra
          id
          lastLoginAt
          pk
          provider
          userInfo {
            email
            emailVerified
            extraData
            name
            picture
            sub
          }
        }
        metadata {
          bio
          cover
          location
          timezone
          links {
            favicon
            url
          }
          phone {
            country
            phoneNumber
          }
          status {
            dateRange
            duration
            icon
            label
          }
        }
        passports {
          expirationDate
          id
          issuanceDate
          lastLoginAt
          name
          parentDid
          role
          scope
          source
          status
          title
          type
          userDid
          display {
            content
            type
          }
          issuer {
            id
            name
            pk
          }
          user {
            approved
            avatar
            createdAt
            did
            email
            fullName
            locale
            pk
            role
            updatedAt
          }
        }
        tags {
          color
          componentDid
          createdAt
          createdBy
          description
          id
          parentId
          slug
          title
          type
          updatedAt
          updatedBy
        }
        userSessions {
          appPid
          createdAt
          createdByAppPid
          extra
          id
          lastLoginIp
          passportId
          status
          ua
          updatedAt
          userDid
          visitorId
        }
      }
    }
  }
}
```

### getUsers

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
{
  getUsers {
    code
    paging {
      page
      pageCount
      pageSize
      total
    }
    users {
      approved
      avatar
      createdAt
      createdByAppPid
      did
      didSpace
      email
      emailVerified
      extra
      firstLoginAt
      fullName
      generation
      inviter
      isFollowing
      lastLoginAt
      lastLoginIp
      locale
      name
      phone
      phoneVerified
      pk
      remark
      role
      sourceAppPid
      sourceProvider
      updatedAt
      url
      userSessionsCount
      address {
        city
        country
        line1
        line2
        postalCode
        province
      }
      connectedAccounts {
        did
        extra
        id
        lastLoginAt
        pk
        provider
        userInfo {
          email
          emailVerified
          extraData
          name
          picture
          sub
        }
      }
      metadata {
        bio
        cover
        location
        timezone
        links {
          favicon
          url
        }
        phone {
          country
          phoneNumber
        }
        status {
          dateRange
          duration
          icon
          label
        }
      }
      passports {
        expirationDate
        id
        issuanceDate
        lastLoginAt
        name
        parentDid
        role
        scope
        source
        status
        title
        type
        userDid
        display {
          content
          type
        }
        issuer {
          id
          name
          pk
        }
        user {
          approved
          avatar
          createdAt
          did
          email
          fullName
          locale
          pk
          role
          updatedAt
        }
      }
      tags {
        color
        componentDid
        createdAt
        createdBy
        description
        id
        parentId
        slug
        title
        type
        updatedAt
        updatedBy
      }
      userSessions {
        appPid
        createdAt
        createdByAppPid
        extra
        id
        lastLoginIp
        passportId
        status
        ua
        updatedAt
        userDid
        visitorId
      }
    }
  }
}
```

### getUser

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
{
  getUser {
    code
    user {
      approved
      avatar
      createdAt
      createdByAppPid
      did
      didSpace
      email
      emailVerified
      extra
      firstLoginAt
      fullName
      generation
      inviter
      isFollowing
      lastLoginAt
      lastLoginIp
      locale
      name
      phone
      phoneVerified
      pk
      remark
      role
      sourceAppPid
      sourceProvider
      updatedAt
      url
      userSessionsCount
      address {
        city
        country
        line1
        line2
        postalCode
        province
      }
      connectedAccounts {
        did
        extra
        id
        lastLoginAt
        pk
        provider
        userInfo {
          email
          emailVerified
          extraData
          name
          picture
          sub
        }
      }
      metadata {
        bio
        cover
        location
        timezone
        links {
          favicon
          url
        }
        phone {
          country
          phoneNumber
        }
        status {
          dateRange
          duration
          icon
          label
        }
      }
      passports {
        expirationDate
        id
        issuanceDate
        lastLoginAt
        name
        parentDid
        role
        scope
        source
        status
        title
        type
        userDid
        display {
          content
          type
        }
        issuer {
          id
          name
          pk
        }
        user {
          approved
          avatar
          createdAt
          did
          email
          fullName
          locale
          pk
          role
          updatedAt
        }
      }
      tags {
        color
        componentDid
        createdAt
        createdBy
        description
        id
        parentId
        slug
        title
        type
        updatedAt
        updatedBy
      }
      userSessions {
        appPid
        createdAt
        createdByAppPid
        extra
        id
        lastLoginIp
        passportId
        status
        ua
        updatedAt
        userDid
        visitorId
      }
    }
  }
}
```

### getUserSessions

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
{
  getUserSessions {
    code
    list {
      appPid
      createdAt
      createdByAppPid
      extra
      id
      lastLoginIp
      passportId
      status
      ua
      updatedAt
      userDid
      visitorId
    }
    paging {
      page
      pageCount
      pageSize
      total
    }
  }
}
```

### getUserSessionsCount

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
{
  getUserSessionsCount {
    code
    count
  }
}
```

### getUsersCount

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
{
  getUsersCount {
    code
    count
  }
}
```

### getUsersCountPerRole

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
{
  getUsersCountPerRole {
    code
    counts {
      key
      value
    }
  }
}
```

### getOwner

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
{
  getOwner {
    code
    user {
      approved
      avatar
      createdAt
      createdByAppPid
      did
      didSpace
      email
      emailVerified
      extra
      firstLoginAt
      fullName
      generation
      inviter
      isFollowing
      lastLoginAt
      lastLoginIp
      locale
      name
      phone
      phoneVerified
      pk
      remark
      role
      sourceAppPid
      sourceProvider
      updatedAt
      url
      userSessionsCount
      address {
        city
        country
        line1
        line2
        postalCode
        province
      }
      connectedAccounts {
        did
        extra
        id
        lastLoginAt
        pk
        provider
        userInfo {
          email
          emailVerified
          extraData
          name
          picture
          sub
        }
      }
      metadata {
        bio
        cover
        location
        timezone
        links {
          favicon
          url
        }
        phone {
          country
          phoneNumber
        }
        status {
          dateRange
          duration
          icon
          label
        }
      }
      passports {
        expirationDate
        id
        issuanceDate
        lastLoginAt
        name
        parentDid
        role
        scope
        source
        status
        title
        type
        userDid
        display {
          content
          type
        }
        issuer {
          id
          name
          pk
        }
        user {
          approved
          avatar
          createdAt
          did
          email
          fullName
          locale
          pk
          role
          updatedAt
        }
      }
      tags {
        color
        componentDid
        createdAt
        createdBy
        description
        id
        parentId
        slug
        title
        type
        updatedAt
        updatedBy
      }
      userSessions {
        appPid
        createdAt
        createdByAppPid
        extra
        id
        lastLoginIp
        passportId
        status
        ua
        updatedAt
        userDid
        visitorId
      }
    }
  }
}
```

### getPermissionsByRole

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
{
  getPermissionsByRole {
    code
    permissions {
      description
      isProtected
      name
    }
  }
}
```

### getPassportIssuances

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
{
  getPassportIssuances {
    code
    list {
      expireDate
      id
      name
      ownerDid
      teamDid
      title
      display {
        content
        type
      }
    }
  }
}
```

### logoutUser

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
{
  logoutUser {
    code
  }
}
```

### destroySelf

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
{
  destroySelf {
    code
    user {
      approved
      avatar
      createdAt
      createdByAppPid
      did
      didSpace
      email
      emailVerified
      extra
      firstLoginAt
      fullName
      generation
      inviter
      isFollowing
      lastLoginAt
      lastLoginIp
      locale
      name
      phone
      phoneVerified
      pk
      remark
      role
      sourceAppPid
      sourceProvider
      updatedAt
      url
      userSessionsCount
      address {
        city
        country
        line1
        line2
        postalCode
        province
      }
      connectedAccounts {
        did
        extra
        id
        lastLoginAt
        pk
        provider
        userInfo {
          email
          emailVerified
          extraData
          name
          picture
          sub
        }
      }
      metadata {
        bio
        cover
        location
        timezone
        links {
          favicon
          url
        }
        phone {
          country
          phoneNumber
        }
        status {
          dateRange
          duration
          icon
          label
        }
      }
      passports {
        expirationDate
        id
        issuanceDate
        lastLoginAt
        name
        parentDid
        role
        scope
        source
        status
        title
        type
        userDid
        display {
          content
          type
        }
        issuer {
          id
          name
          pk
        }
        user {
          approved
          avatar
          createdAt
          did
          email
          fullName
          locale
          pk
          role
          updatedAt
        }
      }
      tags {
        color
        componentDid
        createdAt
        createdBy
        description
        id
        parentId
        slug
        title
        type
        updatedAt
        updatedBy
      }
      userSessions {
        appPid
        createdAt
        createdByAppPid
        extra
        id
        lastLoginIp
        passportId
        status
        ua
        updatedAt
        userDid
        visitorId
      }
    }
  }
}
```

### getUserFollowers

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
{
  getUserFollowers {
    code
    data {
      createdAt
      followerDid
      isFollowing
      userDid
      user {
        approved
        avatar
        createdAt
        createdByAppPid
        did
        didSpace
        email
        emailVerified
        extra
        firstLoginAt
        fullName
        generation
        inviter
        isFollowing
        lastLoginAt
        lastLoginIp
        locale
        name
        phone
        phoneVerified
        pk
        remark
        role
        sourceAppPid
        sourceProvider
        updatedAt
        url
        userSessionsCount
        address {
          city
          country
          line1
          line2
          postalCode
          province
        }
        connectedAccounts {
          did
          extra
          id
          lastLoginAt
          pk
          provider
          userInfo {
            email
            emailVerified
            extraData
            name
            picture
            sub
          }
        }
        metadata {
          bio
          cover
          location
          timezone
          links {
            favicon
            url
          }
          phone {
            country
            phoneNumber
          }
          status {
            dateRange
            duration
            icon
            label
          }
        }
        passports {
          expirationDate
          id
          issuanceDate
          lastLoginAt
          name
          parentDid
          role
          scope
          source
          status
          title
          type
          userDid
          display {
            content
            type
          }
          issuer {
            id
            name
            pk
          }
          user {
            approved
            avatar
            createdAt
            did
            email
            fullName
            locale
            pk
            role
            updatedAt
          }
        }
        tags {
          color
          componentDid
          createdAt
          createdBy
          description
          id
          parentId
          slug
          title
          type
          updatedAt
          updatedBy
        }
        userSessions {
          appPid
          createdAt
          createdByAppPid
          extra
          id
          lastLoginIp
          passportId
          status
          ua
          updatedAt
          userDid
          visitorId
        }
      }
    }
    paging {
      page
      pageCount
      pageSize
      total
    }
  }
}
```

### getUserFollowing

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
{
  getUserFollowing {
    code
    data {
      createdAt
      followerDid
      isFollowing
      userDid
      user {
        approved
        avatar
        createdAt
        createdByAppPid
        did
        didSpace
        email
        emailVerified
        extra
        firstLoginAt
        fullName
        generation
        inviter
        isFollowing
        lastLoginAt
        lastLoginIp
        locale
        name
        phone
        phoneVerified
        pk
        remark
        role
        sourceAppPid
        sourceProvider
        updatedAt
        url
        userSessionsCount
        address {
          city
          country
          line1
          line2
          postalCode
          province
        }
        connectedAccounts {
          did
          extra
          id
          lastLoginAt
          pk
          provider
          userInfo {
            email
            emailVerified
            extraData
            name
            picture
            sub
          }
        }
        metadata {
          bio
          cover
          location
          timezone
          links {
            favicon
            url
          }
          phone {
            country
            phoneNumber
          }
          status {
            dateRange
            duration
            icon
            label
          }
        }
        passports {
          expirationDate
          id
          issuanceDate
          lastLoginAt
          name
          parentDid
          role
          scope
          source
          status
          title
          type
          userDid
          display {
            content
            type
          }
          issuer {
            id
            name
            pk
          }
          user {
            approved
            avatar
            createdAt
            did
            email
            fullName
            locale
            pk
            role
            updatedAt
          }
        }
        tags {
          color
          componentDid
          createdAt
          createdBy
          description
          id
          parentId
          slug
          title
          type
          updatedAt
          updatedBy
        }
        userSessions {
          appPid
          createdAt
          createdByAppPid
          extra
          id
          lastLoginIp
          passportId
          status
          ua
          updatedAt
          userDid
          visitorId
        }
      }
    }
    paging {
      page
      pageCount
      pageSize
      total
    }
  }
}
```

### getUserFollowStats

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
{
  getUserFollowStats {
    code
    data
  }
}
```

### checkFollowing

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
{
  checkFollowing {
    code
    data
  }
}
```

### followUser

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
{
  followUser {
    code
  }
}
```

### unfollowUser

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
{
  unfollowUser {
    code
  }
}
```

### getUserInvites

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
{
  getUserInvites {
    code
    paging {
      page
      pageCount
      pageSize
      total
    }
    users {
      approved
      avatar
      createdAt
      createdByAppPid
      did
      didSpace
      email
      emailVerified
      extra
      firstLoginAt
      fullName
      generation
      inviter
      isFollowing
      lastLoginAt
      lastLoginIp
      locale
      name
      phone
      phoneVerified
      pk
      remark
      role
      sourceAppPid
      sourceProvider
      updatedAt
      url
      userSessionsCount
      address {
        city
        country
        line1
        line2
        postalCode
        province
      }
      connectedAccounts {
        did
        extra
        id
        lastLoginAt
        pk
        provider
        userInfo {
          email
          emailVerified
          extraData
          name
          picture
          sub
        }
      }
      metadata {
        bio
        cover
        location
        timezone
        links {
          favicon
          url
        }
        phone {
          country
          phoneNumber
        }
        status {
          dateRange
          duration
          icon
          label
        }
      }
      passports {
        expirationDate
        id
        issuanceDate
        lastLoginAt
        name
        parentDid
        role
        scope
        source
        status
        title
        type
        userDid
        display {
          content
          type
        }
        issuer {
          id
          name
          pk
        }
        user {
          approved
          avatar
          createdAt
          did
          email
          fullName
          locale
          pk
          role
          updatedAt
        }
      }
      tags {
        color
        componentDid
        createdAt
        createdBy
        description
        id
        parentId
        slug
        title
        type
        updatedAt
        updatedBy
      }
      userSessions {
        appPid
        createdAt
        createdByAppPid
        extra
        id
        lastLoginIp
        passportId
        status
        ua
        updatedAt
        userDid
        visitorId
      }
    }
  }
}
```

### getTags

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
{
  getTags {
    code
    paging {
      page
      pageCount
      pageSize
      total
    }
    tags {
      color
      componentDid
      createdAt
      createdBy
      description
      id
      parentId
      slug
      title
      type
      updatedAt
      updatedBy
    }
  }
}
```

### getAuditLogs

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
{
  getAuditLogs {
    code
    list {
      action
      category
      componentDid
      content
      createdAt
      id
      ip
      scope
      ua
      actor {
        avatar
        did
        fullName
        role
        source
      }
      env {
        browser {
          name
          version
        }
        os {
          name
          version
        }
      }
    }
    paging {
      page
      pageCount
      pageSize
      total
    }
  }
}
```

### getLauncherSession

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
{
  getLauncherSession {
    code
    error
    launcherSession
  }
}
```

### getBlockletBackups

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
{
  getBlockletBackups {
    code
    backups {
      appPid
      createdAt
      message
      metadata
      progress
      sourceUrl
      status
      strategy
      target
      targetName
      targetUrl
      updatedAt
      userDid
    }
  }
}
```

### getBlockletBackupSummary

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
{
  getBlockletBackupSummary {
    code
    summary {
      date
      errorCount
      successCount
    }
  }
}
```

### getBlockletSpaceGateways

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
{
  getBlockletSpaceGateways {
    code
    spaceGateways {
      did
      endpoint
      name
      protected
      url
    }
  }
}
```

### getTrafficInsights

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
{
  getTrafficInsights {
    code
    list {
      bandwidth
      date
      did
      excludedHits
      failedRequests
      generationTime
      logSize
      totalRequests
      uniqueFiles
      uniqueNotFound
      uniqueReferrers
      uniqueStaticFiles
      uniqueVisitors
      validRequests
    }
    paging {
      page
      pageCount
      pageSize
      total
    }
  }
}
```

### getProjects

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
{
  getProjects {
    code
    paging {
      page
      pageCount
      pageSize
      total
    }
    projects {
      autoUpload
      blockletDescription
      blockletDid
      blockletIntroduction
      blockletLogo
      blockletScreenshots
      blockletTitle
      blockletVersion
      componentDid
      createdAt
      createdBy
      id
      lastReleaseFiles
      lastReleaseId
      possibleSameStore
      tenantScope
      type
      updatedAt
      connectedEndpoints {
        accessKeyId
        accessKeySecret
        createdBy
        developerDid
        developerEmail
        developerName
        endpointId
        expireId
      }
      connectedStores {
        accessToken
        developerDid
        developerEmail
        developerName
        scope
        storeId
        storeName
        storeUrl
      }
    }
  }
}
```

### getProject

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
{
  getProject {
    code
    project {
      autoUpload
      blockletDescription
      blockletDid
      blockletIntroduction
      blockletLogo
      blockletScreenshots
      blockletTitle
      blockletVersion
      componentDid
      createdAt
      createdBy
      id
      lastReleaseFiles
      lastReleaseId
      possibleSameStore
      tenantScope
      type
      updatedAt
      connectedEndpoints {
        accessKeyId
        accessKeySecret
        createdBy
        developerDid
        developerEmail
        developerName
        endpointId
        expireId
      }
      connectedStores {
        accessToken
        developerDid
        developerEmail
        developerName
        scope
        storeId
        storeName
        storeUrl
      }
    }
  }
}
```

### getReleases

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
{
  getReleases {
    code
    paging {
      page
      pageCount
      pageSize
      total
    }
    releases {
      blockletCommunity
      blockletDescription
      blockletDid
      blockletHomepage
      blockletIntroduction
      blockletLogo
      blockletRepository
      blockletResourceType
      blockletScreenshots
      blockletSingleton
      blockletSupport
      blockletTitle
      blockletVersion
      blockletVideos
      contentType
      createdAt
      files
      id
      note
      projectId
      publishedStoreIds
      status
      updatedAt
      uploadedResource
      blockletComponents {
        did
        required
      }
      blockletDocker {
        dockerCommand
        dockerImage
        dockerArgs {
          key
          name
          path
          prefix
          protocol
          proxyBehavior
          type
          value
        }
        dockerEnvs {
          custom
          description
          key
          required
          secure
          shared
          value
        }
      }
    }
  }
}
```

### getRelease

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
{
  getRelease {
    code
    release {
      blockletCommunity
      blockletDescription
      blockletDid
      blockletHomepage
      blockletIntroduction
      blockletLogo
      blockletRepository
      blockletResourceType
      blockletScreenshots
      blockletSingleton
      blockletSupport
      blockletTitle
      blockletVersion
      blockletVideos
      contentType
      createdAt
      files
      id
      note
      projectId
      publishedStoreIds
      status
      updatedAt
      uploadedResource
      blockletComponents {
        did
        required
      }
      blockletDocker {
        dockerCommand
        dockerImage
        dockerArgs {
          key
          name
          path
          prefix
          protocol
          proxyBehavior
          type
          value
        }
        dockerEnvs {
          custom
          description
          key
          required
          secure
          shared
          value
        }
      }
    }
  }
}
```

### getSelectedResources

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
{
  getSelectedResources {
    code
    resources
  }
}
```

### getBlockletSecurityRule

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
{
  getBlockletSecurityRule {
    code
    securityRule {
      accessPolicyId
      componentDid
      enabled
      id
      pathPattern
      priority
      remark
      responseHeaderPolicyId
      accessPolicy {
        description
        id
        isProtected
        name
        reverse
        roles
      }
      responseHeaderPolicy {
        cors
        customHeader
        description
        id
        isProtected
        name
        removeHeader
        securityHeader
      }
    }
  }
}
```

### getBlockletSecurityRules

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
{
  getBlockletSecurityRules {
    code
    paging {
      page
      pageCount
      pageSize
      total
    }
    securityRules {
      accessPolicyId
      componentDid
      enabled
      id
      pathPattern
      priority
      remark
      responseHeaderPolicyId
      accessPolicy {
        description
        id
        isProtected
        name
        reverse
        roles
      }
      responseHeaderPolicy {
        cors
        customHeader
        description
        id
        isProtected
        name
        removeHeader
        securityHeader
      }
    }
  }
}
```

### getBlockletResponseHeaderPolicy

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
{
  getBlockletResponseHeaderPolicy {
    code
    accessPolicy {
      description
      id
      isProtected
      name
      reverse
      roles
    }
  }
}
```

### getBlockletResponseHeaderPolicies

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
{
  getBlockletResponseHeaderPolicies {
    code
    paging {
      page
      pageCount
      pageSize
      total
    }
    responseHeaderPolicies {
      cors
      customHeader
      description
      id
      isProtected
      name
      removeHeader
      securityHeader
    }
  }
}
```

### getBlockletAccessPolicy

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
{
  getBlockletAccessPolicy {
    code
    accessPolicy {
      description
      id
      isProtected
      name
      reverse
      roles
    }
  }
}
```

### getBlockletAccessPolicies

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
{
  getBlockletAccessPolicies {
    code
    accessPolicies {
      description
      id
      isProtected
      name
      reverse
      roles
    }
    paging {
      page
      pageCount
      pageSize
      total
    }
  }
}
```

### getWebhookEndpoints

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
{
  getWebhookEndpoints {
    list {
      apiVersion
      createdAt
      description
      id
      metadata
      secret
      status
      updatedAt
      url
      createUser {
        approved
        avatar
        createdAt
        createdByAppPid
        did
        didSpace
        email
        emailVerified
        extra
        firstLoginAt
        fullName
        generation
        inviter
        isFollowing
        lastLoginAt
        lastLoginIp
        locale
        name
        phone
        phoneVerified
        pk
        remark
        role
        sourceAppPid
        sourceProvider
        updatedAt
        url
        userSessionsCount
        address {
          city
          country
          line1
          line2
          postalCode
          province
        }
        connectedAccounts {
          did
          extra
          id
          lastLoginAt
          pk
          provider
          userInfo {
            email
            emailVerified
            extraData
            name
            picture
            sub
          }
        }
        metadata {
          bio
          cover
          location
          timezone
          links {
            favicon
            url
          }
          phone {
            country
            phoneNumber
          }
          status {
            dateRange
            duration
            icon
            label
          }
        }
        passports {
          expirationDate
          id
          issuanceDate
          lastLoginAt
          name
          parentDid
          role
          scope
          source
          status
          title
          type
          userDid
          display {
            content
            type
          }
          issuer {
            id
            name
            pk
          }
          user {
            approved
            avatar
            createdAt
            did
            email
            fullName
            locale
            pk
            role
            updatedAt
          }
        }
        tags {
          color
          componentDid
          createdAt
          createdBy
          description
          id
          parentId
          slug
          title
          type
          updatedAt
          updatedBy
        }
        userSessions {
          appPid
          createdAt
          createdByAppPid
          extra
          id
          lastLoginIp
          passportId
          status
          ua
          updatedAt
          userDid
          visitorId
        }
      }
      enabledEvents {
        source
        type
      }
      updateUser {
        approved
        avatar
        createdAt
        createdByAppPid
        did
        didSpace
        email
        emailVerified
        extra
        firstLoginAt
        fullName
        generation
        inviter
        isFollowing
        lastLoginAt
        lastLoginIp
        locale
        name
        phone
        phoneVerified
        pk
        remark
        role
        sourceAppPid
        sourceProvider
        updatedAt
        url
        userSessionsCount
        address {
          city
          country
          line1
          line2
          postalCode
          province
        }
        connectedAccounts {
          did
          extra
          id
          lastLoginAt
          pk
          provider
          userInfo {
            email
            emailVerified
            extraData
            name
            picture
            sub
          }
        }
        metadata {
          bio
          cover
          location
          timezone
          links {
            favicon
            url
          }
          phone {
            country
            phoneNumber
          }
          status {
            dateRange
            duration
            icon
            label
          }
        }
        passports {
          expirationDate
          id
          issuanceDate
          lastLoginAt
          name
          parentDid
          role
          scope
          source
          status
          title
          type
          userDid
          display {
            content
            type
          }
          issuer {
            id
            name
            pk
          }
          user {
            approved
            avatar
            createdAt
            did
            email
            fullName
            locale
            pk
            role
            updatedAt
          }
        }
        tags {
          color
          componentDid
          createdAt
          createdBy
          description
          id
          parentId
          slug
          title
          type
          updatedAt
          updatedBy
        }
        userSessions {
          appPid
          createdAt
          createdByAppPid
          extra
          id
          lastLoginIp
          passportId
          status
          ua
          updatedAt
          userDid
          visitorId
        }
      }
    }
    paging {
      page
      pageCount
      pageSize
      total
    }
  }
}
```

### getWebhookEndpoint

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
{
  getWebhookEndpoint {
    data {
      apiVersion
      createdAt
      description
      id
      metadata
      secret
      status
      updatedAt
      url
      createUser {
        approved
        avatar
        createdAt
        createdByAppPid
        did
        didSpace
        email
        emailVerified
        extra
        firstLoginAt
        fullName
        generation
        inviter
        isFollowing
        lastLoginAt
        lastLoginIp
        locale
        name
        phone
        phoneVerified
        pk
        remark
        role
        sourceAppPid
        sourceProvider
        updatedAt
        url
        userSessionsCount
        address {
          city
          country
          line1
          line2
          postalCode
          province
        }
        connectedAccounts {
          did
          extra
          id
          lastLoginAt
          pk
          provider
          userInfo {
            email
            emailVerified
            extraData
            name
            picture
            sub
          }
        }
        metadata {
          bio
          cover
          location
          timezone
          links {
            favicon
            url
          }
          phone {
            country
            phoneNumber
          }
          status {
            dateRange
            duration
            icon
            label
          }
        }
        passports {
          expirationDate
          id
          issuanceDate
          lastLoginAt
          name
          parentDid
          role
          scope
          source
          status
          title
          type
          userDid
          display {
            content
            type
          }
          issuer {
            id
            name
            pk
          }
          user {
            approved
            avatar
            createdAt
            did
            email
            fullName
            locale
            pk
            role
            updatedAt
          }
        }
        tags {
          color
          componentDid
          createdAt
          createdBy
          description
          id
          parentId
          slug
          title
          type
          updatedAt
          updatedBy
        }
        userSessions {
          appPid
          createdAt
          createdByAppPid
          extra
          id
          lastLoginIp
          passportId
          status
          ua
          updatedAt
          userDid
          visitorId
        }
      }
      enabledEvents {
        source
        type
      }
      updateUser {
        approved
        avatar
        createdAt
        createdByAppPid
        did
        didSpace
        email
        emailVerified
        extra
        firstLoginAt
        fullName
        generation
        inviter
        isFollowing
        lastLoginAt
        lastLoginIp
        locale
        name
        phone
        phoneVerified
        pk
        remark
        role
        sourceAppPid
        sourceProvider
        updatedAt
        url
        userSessionsCount
        address {
          city
          country
          line1
          line2
          postalCode
          province
        }
        connectedAccounts {
          did
          extra
          id
          lastLoginAt
          pk
          provider
          userInfo {
            email
            emailVerified
            extraData
            name
            picture
            sub
          }
        }
        metadata {
          bio
          cover
          location
          timezone
          links {
            favicon
            url
          }
          phone {
            country
            phoneNumber
          }
          status {
            dateRange
            duration
            icon
            label
          }
        }
        passports {
          expirationDate
          id
          issuanceDate
          lastLoginAt
          name
          parentDid
          role
          scope
          source
          status
          title
          type
          userDid
          display {
            content
            type
          }
          issuer {
            id
            name
            pk
          }
          user {
            approved
            avatar
            createdAt
            did
            email
            fullName
            locale
            pk
            role
            updatedAt
          }
        }
        tags {
          color
          componentDid
          createdAt
          createdBy
          description
          id
          parentId
          slug
          title
          type
          updatedAt
          updatedBy
        }
        userSessions {
          appPid
          createdAt
          createdByAppPid
          extra
          id
          lastLoginIp
          passportId
          status
          ua
          updatedAt
          userDid
          visitorId
        }
      }
    }
  }
}
```

### getWebhookAttempts

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
{
  getWebhookAttempts {
    list {
      createdAt
      eventId
      id
      responseBody
      responseStatus
      retryCount
      status
      triggeredBy
      triggeredFrom
      updatedAt
      webhookId
      endpoint {
        apiVersion
        createdAt
        description
        id
        metadata
        secret
        status
        updatedAt
        url
        enabledEvents {
          source
          type
        }
      }
      event {
        apiVersion
        createdAt
        data
        id
        metadata
        objectId
        objectType
        pendingWebhooks
        request
        source
        type
        updatedAt
      }
    }
    paging {
      page
      pageCount
      pageSize
      total
    }
  }
}
```

### getPassportRoleCounts

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
{
  getPassportRoleCounts {
    code
    counts {
      key
      value
    }
  }
}
```

### getPassportsByRole

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
{
  getPassportsByRole {
    code
    paging {
      page
      pageCount
      pageSize
      total
    }
    passports {
      expirationDate
      id
      issuanceDate
      lastLoginAt
      name
      parentDid
      role
      scope
      source
      status
      title
      type
      userDid
      display {
        content
        type
      }
      issuer {
        id
        name
        pk
      }
      user {
        approved
        avatar
        createdAt
        did
        email
        fullName
        locale
        pk
        role
        updatedAt
      }
    }
  }
}
```

### getPassportLogs

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
{
  getPassportLogs {
    paging {
      page
      pageCount
      pageSize
      total
    }
    passportLogs {
      action
      createdAt
      id
      metadata
      operatorDid
      operatorIp
      operatorUa
      passportId
    }
  }
}
```

### getRelatedPassports

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
{
  getRelatedPassports {
    code
    paging {
      page
      pageCount
      pageSize
      total
    }
    passports {
      expirationDate
      id
      issuanceDate
      lastLoginAt
      name
      parentDid
      role
      scope
      source
      status
      title
      type
      userDid
      display {
        content
        type
      }
      issuer {
        id
        name
        pk
      }
      user {
        approved
        avatar
        createdAt
        did
        email
        fullName
        locale
        pk
        role
        updatedAt
      }
    }
  }
}
```

### getBlockletBaseInfo

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
{
  getBlockletBaseInfo {
    appRuntimeInfo {
      cpus
      cpuUsage
      memoryUsage
      pid
      port
      runningDocker
      uptime
    }
    backup {
      appPid
      createdAt
      message
      metadata
      progress
      sourceUrl
      status
      strategy
      target
      targetName
      targetUrl
      updatedAt
      userDid
    }
    integrations {
      accessKeys
      oauthApps
      webhooks
    }
    passport {
      activePassports
      passports
    }
    studio {
      blocklets
      releases
    }
    traffic {
      failedRequests
      totalRequests
    }
    user {
      approvedUsers
      users
    }
  }
}
```

### getDomainDNS

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
{
  getDomainDNS {
    error
    hasCname
    isCnameMatch
    isDnsResolved
  }
}
```

### getOAuthClients

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
{
  getOAuthClients {
    list {
      clientId
      clientIdIssuedAt
      clientName
      clientSecret
      clientSecretExpiresAt
      clientUri
      contacts
      createdBy
      grantTypes
      jwks
      jwksUri
      logoUri
      policyUri
      redirectUris
      responseTypes
      scope
      softwareId
      softwareVersion
      tokenEndpointAuthMethod
      tosUri
      updatedAt
      createUser {
        approved
        avatar
        createdAt
        createdByAppPid
        did
        didSpace
        email
        emailVerified
        extra
        firstLoginAt
        fullName
        generation
        inviter
        isFollowing
        lastLoginAt
        lastLoginIp
        locale
        name
        phone
        phoneVerified
        pk
        remark
        role
        sourceAppPid
        sourceProvider
        updatedAt
        url
        userSessionsCount
        address {
          city
          country
          line1
          line2
          postalCode
          province
        }
        connectedAccounts {
          did
          extra
          id
          lastLoginAt
          pk
          provider
          userInfo {
            email
            emailVerified
            extraData
            name
            picture
            sub
          }
        }
        metadata {
          bio
          cover
          location
          timezone
          links {
            favicon
            url
          }
          phone {
            country
            phoneNumber
          }
          status {
            dateRange
            duration
            icon
            label
          }
        }
        passports {
          expirationDate
          id
          issuanceDate
          lastLoginAt
          name
          parentDid
          role
          scope
          source
          status
          title
          type
          userDid
          display {
            content
            type
          }
          issuer {
            id
            name
            pk
          }
          user {
            approved
            avatar
            createdAt
            did
            email
            fullName
            locale
            pk
            role
            updatedAt
          }
        }
        tags {
          color
          componentDid
          createdAt
          createdBy
          description
          id
          parentId
          slug
          title
          type
          updatedAt
          updatedBy
        }
        userSessions {
          appPid
          createdAt
          createdByAppPid
          extra
          id
          lastLoginIp
          passportId
          status
          ua
          updatedAt
          userDid
          visitorId
        }
      }
    }
  }
}
```

### createOAuthClient

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
{
  createOAuthClient {
    data {
      clientId
      clientIdIssuedAt
      clientName
      clientSecret
      clientSecretExpiresAt
      clientUri
      contacts
      createdBy
      grantTypes
      jwks
      jwksUri
      logoUri
      policyUri
      redirectUris
      responseTypes
      scope
      softwareId
      softwareVersion
      tokenEndpointAuthMethod
      tosUri
      updatedAt
      createUser {
        approved
        avatar
        createdAt
        createdByAppPid
        did
        didSpace
        email
        emailVerified
        extra
        firstLoginAt
        fullName
        generation
        inviter
        isFollowing
        lastLoginAt
        lastLoginIp
        locale
        name
        phone
        phoneVerified
        pk
        remark
        role
        sourceAppPid
        sourceProvider
        updatedAt
        url
        userSessionsCount
        address {
          city
          country
          line1
          line2
          postalCode
          province
        }
        connectedAccounts {
          did
          extra
          id
          lastLoginAt
          pk
          provider
          userInfo {
            email
            emailVerified
            extraData
            name
            picture
            sub
          }
        }
        metadata {
          bio
          cover
          location
          timezone
          links {
            favicon
            url
          }
          phone {
            country
            phoneNumber
          }
          status {
            dateRange
            duration
            icon
            label
          }
        }
        passports {
          expirationDate
          id
          issuanceDate
          lastLoginAt
          name
          parentDid
          role
          scope
          source
          status
          title
          type
          userDid
          display {
            content
            type
          }
          issuer {
            id
            name
            pk
          }
          user {
            approved
            avatar
            createdAt
            did
            email
            fullName
            locale
            pk
            role
            updatedAt
          }
        }
        tags {
          color
          componentDid
          createdAt
          createdBy
          description
          id
          parentId
          slug
          title
          type
          updatedAt
          updatedBy
        }
        userSessions {
          appPid
          createdAt
          createdByAppPid
          extra
          id
          lastLoginIp
          passportId
          status
          ua
          updatedAt
          userDid
          visitorId
        }
      }
    }
  }
}
```

### updateOAuthClient

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
{
  updateOAuthClient {
    data {
      clientId
      clientIdIssuedAt
      clientName
      clientSecret
      clientSecretExpiresAt
      clientUri
      contacts
      createdBy
      grantTypes
      jwks
      jwksUri
      logoUri
      policyUri
      redirectUris
      responseTypes
      scope
      softwareId
      softwareVersion
      tokenEndpointAuthMethod
      tosUri
      updatedAt
      createUser {
        approved
        avatar
        createdAt
        createdByAppPid
        did
        didSpace
        email
        emailVerified
        extra
        firstLoginAt
        fullName
        generation
        inviter
        isFollowing
        lastLoginAt
        lastLoginIp
        locale
        name
        phone
        phoneVerified
        pk
        remark
        role
        sourceAppPid
        sourceProvider
        updatedAt
        url
        userSessionsCount
        address {
          city
          country
          line1
          line2
          postalCode
          province
        }
        connectedAccounts {
          did
          extra
          id
          lastLoginAt
          pk
          provider
          userInfo {
            email
            emailVerified
            extraData
            name
            picture
            sub
          }
        }
        metadata {
          bio
          cover
          location
          timezone
          links {
            favicon
            url
          }
          phone {
            country
            phoneNumber
          }
          status {
            dateRange
            duration
            icon
            label
          }
        }
        passports {
          expirationDate
          id
          issuanceDate
          lastLoginAt
          name
          parentDid
          role
          scope
          source
          status
          title
          type
          userDid
          display {
            content
            type
          }
          issuer {
            id
            name
            pk
          }
          user {
            approved
            avatar
            createdAt
            did
            email
            fullName
            locale
            pk
            role
            updatedAt
          }
        }
        tags {
          color
          componentDid
          createdAt
          createdBy
          description
          id
          parentId
          slug
          title
          type
          updatedAt
          updatedBy
        }
        userSessions {
          appPid
          createdAt
          createdByAppPid
          extra
          id
          lastLoginIp
          passportId
          status
          ua
          updatedAt
          userDid
          visitorId
        }
      }
    }
  }
}
```

### deleteOAuthClient

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
{
  deleteOAuthClient {
    code
  }
}
```

### getOrgs

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
{
  getOrgs {
    code
    orgs {
      avatar
      createdAt
      description
      id
      membersCount
      metadata
      name
      ownerDid
      updatedAt
      members {
        createdAt
        id
        metadata
        orgId
        status
        updatedAt
        userDid
        user {
          approved
          avatar
          createdAt
          createdByAppPid
          did
          didSpace
          email
          emailVerified
          extra
          firstLoginAt
          fullName
          generation
          inviter
          isFollowing
          lastLoginAt
          lastLoginIp
          locale
          name
          phone
          phoneVerified
          pk
          remark
          role
          sourceAppPid
          sourceProvider
          updatedAt
          url
          userSessionsCount
          address {
            city
            country
            line1
            line2
            postalCode
            province
          }
          connectedAccounts {
            did
            extra
            id
            lastLoginAt
            pk
            provider
            userInfo {
              email
              emailVerified
              extraData
              name
              picture
              sub
            }
          }
          metadata {
            bio
            cover
            location
            timezone
            links {
              favicon
              url
            }
            phone {
              country
              phoneNumber
            }
            status {
              dateRange
              duration
              icon
              label
            }
          }
          passports {
            expirationDate
            id
            issuanceDate
            lastLoginAt
            name
            parentDid
            role
            scope
            source
            status
            title
            type
            userDid
            display {
              content
              type
            }
            issuer {
              id
              name
              pk
            }
            user {
              approved
              avatar
              createdAt
              did
              email
              fullName
              locale
              pk
              role
              updatedAt
            }
          }
          tags {
            color
            componentDid
            createdAt
            createdBy
            description
            id
            parentId
            slug
            title
            type
            updatedAt
            updatedBy
          }
          userSessions {
            appPid
            createdAt
            createdByAppPid
            extra
            id
            lastLoginIp
            passportId
            status
            ua
            updatedAt
            userDid
            visitorId
          }
        }
      }
      owner {
        approved
        avatar
        createdAt
        createdByAppPid
        did
        didSpace
        email
        emailVerified
        extra
        firstLoginAt
        fullName
        generation
        inviter
        isFollowing
        lastLoginAt
        lastLoginIp
        locale
        name
        phone
        phoneVerified
        pk
        remark
        role
        sourceAppPid
        sourceProvider
        updatedAt
        url
        userSessionsCount
        address {
          city
          country
          line1
          line2
          postalCode
          province
        }
        connectedAccounts {
          did
          extra
          id
          lastLoginAt
          pk
          provider
          userInfo {
            email
            emailVerified
            extraData
            name
            picture
            sub
          }
        }
        metadata {
          bio
          cover
          location
          timezone
          links {
            favicon
            url
          }
          phone {
            country
            phoneNumber
          }
          status {
            dateRange
            duration
            icon
            label
          }
        }
        passports {
          expirationDate
          id
          issuanceDate
          lastLoginAt
          name
          parentDid
          role
          scope
          source
          status
          title
          type
          userDid
          display {
            content
            type
          }
          issuer {
            id
            name
            pk
          }
          user {
            approved
            avatar
            createdAt
            did
            email
            fullName
            locale
            pk
            role
            updatedAt
          }
        }
        tags {
          color
          componentDid
          createdAt
          createdBy
          description
          id
          parentId
          slug
          title
          type
          updatedAt
          updatedBy
        }
        userSessions {
          appPid
          createdAt
          createdByAppPid
          extra
          id
          lastLoginIp
          passportId
          status
          ua
          updatedAt
          userDid
          visitorId
        }
      }
      passports {
        expirationDate
        id
        issuanceDate
        lastLoginAt
        name
        parentDid
        role
        scope
        source
        status
        title
        type
        userDid
        display {
          content
          type
        }
        issuer {
          id
          name
          pk
        }
        user {
          approved
          avatar
          createdAt
          did
          email
          fullName
          locale
          pk
          role
          updatedAt
        }
      }
    }
    paging {
      page
      pageCount
      pageSize
      total
    }
  }
}
```

### getOrg

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
{
  getOrg {
    code
    org {
      avatar
      createdAt
      description
      id
      membersCount
      metadata
      name
      ownerDid
      updatedAt
      members {
        createdAt
        id
        metadata
        orgId
        status
        updatedAt
        userDid
        user {
          approved
          avatar
          createdAt
          createdByAppPid
          did
          didSpace
          email
          emailVerified
          extra
          firstLoginAt
          fullName
          generation
          inviter
          isFollowing
          lastLoginAt
          lastLoginIp
          locale
          name
          phone
          phoneVerified
          pk
          remark
          role
          sourceAppPid
          sourceProvider
          updatedAt
          url
          userSessionsCount
          address {
            city
            country
            line1
            line2
            postalCode
            province
          }
          connectedAccounts {
            did
            extra
            id
            lastLoginAt
            pk
            provider
            userInfo {
              email
              emailVerified
              extraData
              name
              picture
              sub
            }
          }
          metadata {
            bio
            cover
            location
            timezone
            links {
              favicon
              url
            }
            phone {
              country
              phoneNumber
            }
            status {
              dateRange
              duration
              icon
              label
            }
          }
          passports {
            expirationDate
            id
            issuanceDate
            lastLoginAt
            name
            parentDid
            role
            scope
            source
            status
            title
            type
            userDid
            display {
              content
              type
            }
            issuer {
              id
              name
              pk
            }
            user {
              approved
              avatar
              createdAt
              did
              email
              fullName
              locale
              pk
              role
              updatedAt
            }
          }
          tags {
            color
            componentDid
            createdAt
            createdBy
            description
            id
            parentId
            slug
            title
            type
            updatedAt
            updatedBy
          }
          userSessions {
            appPid
            createdAt
            createdByAppPid
            extra
            id
            lastLoginIp
            passportId
            status
            ua
            updatedAt
            userDid
            visitorId
          }
        }
      }
      owner {
        approved
        avatar
        createdAt
        createdByAppPid
        did
        didSpace
        email
        emailVerified
        extra
        firstLoginAt
        fullName
        generation
        inviter
        isFollowing
        lastLoginAt
        lastLoginIp
        locale
        name
        phone
        phoneVerified
        pk
        remark
        role
        sourceAppPid
        sourceProvider
        updatedAt
        url
        userSessionsCount
        address {
          city
          country
          line1
          line2
          postalCode
          province
        }
        connectedAccounts {
          did
          extra
          id
          lastLoginAt
          pk
          provider
          userInfo {
            email
            emailVerified
            extraData
            name
            picture
            sub
          }
        }
        metadata {
          bio
          cover
          location
          timezone
          links {
            favicon
            url
          }
          phone {
            country
            phoneNumber
          }
          status {
            dateRange
            duration
            icon
            label
          }
        }
        passports {
          expirationDate
          id
          issuanceDate
          lastLoginAt
          name
          parentDid
          role
          scope
          source
          status
          title
          type
          userDid
          display {
            content
            type
          }
          issuer {
            id
            name
            pk
          }
          user {
            approved
            avatar
            createdAt
            did
            email
            fullName
            locale
            pk
            role
            updatedAt
          }
        }
        tags {
          color
          componentDid
          createdAt
          createdBy
          description
          id
          parentId
          slug
          title
          type
          updatedAt
          updatedBy
        }
        userSessions {
          appPid
          createdAt
          createdByAppPid
          extra
          id
          lastLoginIp
          passportId
          status
          ua
          updatedAt
          userDid
          visitorId
        }
      }
      passports {
        expirationDate
        id
        issuanceDate
        lastLoginAt
        name
        parentDid
        role
        scope
        source
        status
        title
        type
        userDid
        display {
          content
          type
        }
        issuer {
          id
          name
          pk
        }
        user {
          approved
          avatar
          createdAt
          did
          email
          fullName
          locale
          pk
          role
          updatedAt
        }
      }
    }
  }
}
```

### getOrgMembers

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
{
  getOrgMembers {
    code
    paging {
      page
      pageCount
      pageSize
      total
    }
    users {
      createdAt
      id
      metadata
      orgId
      status
      updatedAt
      userDid
      user {
        approved
        avatar
        createdAt
        createdByAppPid
        did
        didSpace
        email
        emailVerified
        extra
        firstLoginAt
        fullName
        generation
        inviter
        isFollowing
        lastLoginAt
        lastLoginIp
        locale
        name
        phone
        phoneVerified
        pk
        remark
        role
        sourceAppPid
        sourceProvider
        updatedAt
        url
        userSessionsCount
        address {
          city
          country
          line1
          line2
          postalCode
          province
        }
        connectedAccounts {
          did
          extra
          id
          lastLoginAt
          pk
          provider
          userInfo {
            email
            emailVerified
            extraData
            name
            picture
            sub
          }
        }
        metadata {
          bio
          cover
          location
          timezone
          links {
            favicon
            url
          }
          phone {
            country
            phoneNumber
          }
          status {
            dateRange
            duration
            icon
            label
          }
        }
        passports {
          expirationDate
          id
          issuanceDate
          lastLoginAt
          name
          parentDid
          role
          scope
          source
          status
          title
          type
          userDid
          display {
            content
            type
          }
          issuer {
            id
            name
            pk
          }
          user {
            approved
            avatar
            createdAt
            did
            email
            fullName
            locale
            pk
            role
            updatedAt
          }
        }
        tags {
          color
          componentDid
          createdAt
          createdBy
          description
          id
          parentId
          slug
          title
          type
          updatedAt
          updatedBy
        }
        userSessions {
          appPid
          createdAt
          createdByAppPid
          extra
          id
          lastLoginIp
          passportId
          status
          ua
          updatedAt
          userDid
          visitorId
        }
      }
    }
  }
}
```

### getOrgInvitableUsers

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
{
  getOrgInvitableUsers {
    code
    paging {
      page
      pageCount
      pageSize
      total
    }
    users {
      approved
      avatar
      createdAt
      createdByAppPid
      did
      didSpace
      email
      emailVerified
      extra
      firstLoginAt
      fullName
      generation
      inviter
      isFollowing
      lastLoginAt
      lastLoginIp
      locale
      name
      phone
      phoneVerified
      pk
      remark
      role
      sourceAppPid
      sourceProvider
      updatedAt
      url
      userSessionsCount
      address {
        city
        country
        line1
        line2
        postalCode
        province
      }
      connectedAccounts {
        did
        extra
        id
        lastLoginAt
        pk
        provider
        userInfo {
          email
          emailVerified
          extraData
          name
          picture
          sub
        }
      }
      metadata {
        bio
        cover
        location
        timezone
        links {
          favicon
          url
        }
        phone {
          country
          phoneNumber
        }
        status {
          dateRange
          duration
          icon
          label
        }
      }
      passports {
        expirationDate
        id
        issuanceDate
        lastLoginAt
        name
        parentDid
        role
        scope
        source
        status
        title
        type
        userDid
        display {
          content
          type
        }
        issuer {
          id
          name
          pk
        }
        user {
          approved
          avatar
          createdAt
          did
          email
          fullName
          locale
          pk
          role
          updatedAt
        }
      }
      tags {
        color
        componentDid
        createdAt
        createdBy
        description
        id
        parentId
        slug
        title
        type
        updatedAt
        updatedBy
      }
      userSessions {
        appPid
        createdAt
        createdByAppPid
        extra
        id
        lastLoginIp
        passportId
        status
        ua
        updatedAt
        userDid
        visitorId
      }
    }
  }
}
```

### getOrgResource

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
{
  getOrgResource {
    code
    data {
      createdAt
      id
      metadata
      orgId
      resourceId
      type
      updatedAt
    }
  }
}
```

## Subscriptions

No Subscriptions supported yet.


## Mutations

### installBlocklet

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
mutation {
  installBlocklet {
    code
    blocklet {
      appDid
      appPid
      bundleSource
      createdAt
      deployedFrom
      dynamic
      enableDocker
      enableDockerNetwork
      enablePassportIssuance
      externalSk
      externalSkSource
      installedAt
      mode
      mountPoint
      pausedAt
      port
      ports
      source
      startedAt
      status
      stoppedAt
      structVersion
      updatedAt
      appRuntimeInfo {
        cpus
        cpuUsage
        memoryUsage
        pid
        port
        runningDocker
        uptime
      }
      children {
        bundleSource
        createdAt
        deployedFrom
        dynamic
        greenStatus
        installedAt
        mode
        mountPoint
        pausedAt
        port
        ports
        required
        source
        startedAt
        status
        stoppedAt
        appRuntimeInfo {
          cpus
          cpuUsage
          memoryUsage
          pid
          port
          runningDocker
          uptime
        }
        children {
          bundleSource
          createdAt
          deployedFrom
          dynamic
          greenStatus
          installedAt
          mode
          mountPoint
          pausedAt
          port
          ports
          required
          source
          startedAt
          status
          stoppedAt
          appRuntimeInfo {
            cpus
            cpuUsage
            memoryUsage
            pid
            port
            runningDocker
            uptime
          }
          children {
            bundleSource
            createdAt
            deployedFrom
            dynamic
            greenStatus
            installedAt
            mode
            mountPoint
            pausedAt
            port
            ports
            required
            source
            startedAt
            status
            stoppedAt
            appRuntimeInfo {
              cpus
              cpuUsage
              memoryUsage
              pid
              port
              runningDocker
              uptime
            }
            children {
              bundleSource
              createdAt
              deployedFrom
              dynamic
              greenStatus
              installedAt
              mode
              mountPoint
              pausedAt
              port
              ports
              required
              source
              startedAt
              status
              stoppedAt
              appRuntimeInfo {
                cpus
                cpuUsage
                memoryUsage
                pid
                port
                runningDocker
                uptime
              }
              children {
                bundleSource
                createdAt
                deployedFrom
                dynamic
                greenStatus
                installedAt
                mode
                mountPoint
                pausedAt
                port
                ports
                required
                source
                startedAt
                status
                stoppedAt
              }
              configs {
                custom
                description
                key
                required
                secure
                shared
                validation
                value
              }
              dependents {
                id
                required
              }
              diskInfo {
                app
                blocklets
                cache
                data
                log
              }
              engine {
                available
                description
                displayName
                logo
                name
                version
                visible
              }
              environments {
                custom
                description
                key
                required
                secure
                shared
                validation
                value
              }
              meta {
                bundleDid
                bundleName
                community
                description
                did
                documentation
                engine
                group
                homepage
                keywords
                lastPublishedAt
                logo
                main
                name
                navigation
                nftFactory
                path
                resources
                screenshots
                support
                title
                version
              }
              runtimeInfo {
                cpus
                cpuUsage
                memoryUsage
                pid
                port
                runningDocker
                uptime
              }
            }
            configs {
              custom
              description
              key
              required
              secure
              shared
              validation
              value
            }
            dependents {
              id
              required
            }
            diskInfo {
              app
              blocklets
              cache
              data
              log
            }
            engine {
              available
              description
              displayName
              logo
              name
              version
              visible
            }
            environments {
              custom
              description
              key
              required
              secure
              shared
              validation
              value
            }
            meta {
              bundleDid
              bundleName
              community
              description
              did
              documentation
              engine
              group
              homepage
              keywords
              lastPublishedAt
              logo
              main
              name
              navigation
              nftFactory
              path
              resources
              screenshots
              support
              title
              version
              author {
                email
                name
                url
              }
              capabilities {
                clusterMode
                component
                didSpace
                navigation
                resourceExportApi
              }
              components {
                mountPoint
                name
                required
              }
              contributors {
                email
                name
                url
              }
              dist {
                integrity
                tarball
              }
              docker {
                image
                installNodeModules
                runBaseScript
                shell
              }
              environments {
                default
                description
                name
                required
                secure
                shared
                validation
              }
              events {
                description
                type
              }
              interfaces {
                cacheable
                name
                pageGroups
                path
                port
                prefix
                protocol
                type
              }
              maintainers {
                email
                name
                url
              }
              owner {
                avatar
                did
                email
                fullName
              }
              repository {
                type
                url
              }
              requirements {
                aigne
                cpu
                os
                server
              }
              resource {
                exportApi
              }
              stats {
                downloads
                purchases
                star
              }
            }
            runtimeInfo {
              cpus
              cpuUsage
              memoryUsage
              pid
              port
              runningDocker
              uptime
            }
          }
          configs {
            custom
            description
            key
            required
            secure
            shared
            validation
            value
          }
          dependents {
            id
            required
          }
          diskInfo {
            app
            blocklets
            cache
            data
            log
          }
          engine {
            available
            description
            displayName
            logo
            name
            version
            visible
          }
          environments {
            custom
            description
            key
            required
            secure
            shared
            validation
            value
          }
          meta {
            bundleDid
            bundleName
            community
            description
            did
            documentation
            engine
            group
            homepage
            keywords
            lastPublishedAt
            logo
            main
            name
            navigation
            nftFactory
            path
            resources
            screenshots
            support
            title
            version
            author {
              email
              name
              url
            }
            capabilities {
              clusterMode
              component
              didSpace
              navigation
              resourceExportApi
            }
            components {
              mountPoint
              name
              required
            }
            contributors {
              email
              name
              url
            }
            dist {
              integrity
              tarball
            }
            docker {
              image
              installNodeModules
              runBaseScript
              shell
            }
            environments {
              default
              description
              name
              required
              secure
              shared
              validation
            }
            events {
              description
              type
            }
            interfaces {
              cacheable
              name
              pageGroups
              path
              port
              prefix
              protocol
              type
              services {
                config
                name
              }
            }
            maintainers {
              email
              name
              url
            }
            owner {
              avatar
              did
              email
              fullName
            }
            payment {
              price {
                address
                symbol
                value
              }
              share {
                address
                name
                value
              }
            }
            repository {
              type
              url
            }
            requirements {
              aigne
              cpu
              os
              server
              fuels {
                address
                endpoint
                reason
                value
              }
            }
            resource {
              exportApi
              bundles {
                did
                public
                type
              }
              types {
                description
                type
              }
            }
            stats {
              downloads
              purchases
              star
            }
          }
          runtimeInfo {
            cpus
            cpuUsage
            memoryUsage
            pid
            port
            runningDocker
            uptime
          }
        }
        configs {
          custom
          description
          key
          required
          secure
          shared
          validation
          value
        }
        dependents {
          id
          required
        }
        diskInfo {
          app
          blocklets
          cache
          data
          log
        }
        engine {
          available
          description
          displayName
          logo
          name
          version
          visible
        }
        environments {
          custom
          description
          key
          required
          secure
          shared
          validation
          value
        }
        meta {
          bundleDid
          bundleName
          community
          description
          did
          documentation
          engine
          group
          homepage
          keywords
          lastPublishedAt
          logo
          main
          name
          navigation
          nftFactory
          path
          resources
          screenshots
          support
          title
          version
          author {
            email
            name
            url
          }
          capabilities {
            clusterMode
            component
            didSpace
            navigation
            resourceExportApi
          }
          components {
            mountPoint
            name
            required
          }
          contributors {
            email
            name
            url
          }
          dist {
            integrity
            tarball
          }
          docker {
            image
            installNodeModules
            runBaseScript
            shell
          }
          environments {
            default
            description
            name
            required
            secure
            shared
            validation
          }
          events {
            description
            type
          }
          interfaces {
            cacheable
            name
            pageGroups
            path
            port
            prefix
            protocol
            type
            services {
              config
              name
            }
          }
          maintainers {
            email
            name
            url
          }
          owner {
            avatar
            did
            email
            fullName
          }
          payment {
            price {
              address
              symbol
              value
            }
            share {
              address
              name
              value
            }
          }
          repository {
            type
            url
          }
          requirements {
            aigne
            cpu
            os
            server
            fuels {
              address
              endpoint
              reason
              value
            }
          }
          resource {
            exportApi
            bundles {
              did
              public
              type
            }
            types {
              description
              type
            }
          }
          stats {
            downloads
            purchases
            star
          }
        }
        runtimeInfo {
          cpus
          cpuUsage
          memoryUsage
          pid
          port
          runningDocker
          uptime
        }
      }
      configs {
        custom
        description
        key
        required
        secure
        shared
        validation
        value
      }
      controller {
        chainHost
        consumedAt
        expireDate
        id
        launcherSessionId
        launcherUrl
        nftId
        nftOwner
        ownerDid
        status {
          reason
          value
        }
      }
      diskInfo {
        app
        blocklets
        cache
        data
        log
      }
      engine {
        available
        description
        displayName
        logo
        name
        version
        visible
      }
      environments {
        custom
        description
        key
        required
        secure
        shared
        validation
        value
      }
      meta {
        bundleDid
        bundleName
        community
        description
        did
        documentation
        engine
        group
        homepage
        keywords
        lastPublishedAt
        logo
        main
        name
        navigation
        nftFactory
        path
        resources
        screenshots
        support
        title
        version
        author {
          email
          name
          url
        }
        capabilities {
          clusterMode
          component
          didSpace
          navigation
          resourceExportApi
        }
        components {
          mountPoint
          name
          required
        }
        contributors {
          email
          name
          url
        }
        dist {
          integrity
          tarball
        }
        docker {
          image
          installNodeModules
          runBaseScript
          shell
        }
        environments {
          default
          description
          name
          required
          secure
          shared
          validation
        }
        events {
          description
          type
        }
        interfaces {
          cacheable
          name
          pageGroups
          path
          port
          prefix
          protocol
          type
          services {
            config
            name
          }
        }
        maintainers {
          email
          name
          url
        }
        owner {
          avatar
          did
          email
          fullName
        }
        payment {
          price {
            address
            symbol
            value
          }
          share {
            address
            name
            value
          }
        }
        repository {
          type
          url
        }
        requirements {
          aigne
          cpu
          os
          server
          fuels {
            address
            endpoint
            reason
            value
          }
        }
        resource {
          exportApi
          bundles {
            did
            public
            type
          }
          types {
            description
            type
          }
        }
        stats {
          downloads
          purchases
          star
        }
      }
      migratedFrom {
        appDid
        appSk
        at
      }
      optionalComponents {
        bundleSource
        logoUrl
        dependencies {
          mountPoint
          parentDid
          parentName
          parentTitle
          required
        }
        meta {
          bundleDid
          bundleName
          community
          description
          did
          documentation
          engine
          group
          homepage
          keywords
          lastPublishedAt
          logo
          main
          name
          navigation
          nftFactory
          path
          resources
          screenshots
          support
          title
          version
          author {
            email
            name
            url
          }
          capabilities {
            clusterMode
            component
            didSpace
            navigation
            resourceExportApi
          }
          components {
            mountPoint
            name
            required
          }
          contributors {
            email
            name
            url
          }
          dist {
            integrity
            tarball
          }
          docker {
            image
            installNodeModules
            runBaseScript
            shell
          }
          environments {
            default
            description
            name
            required
            secure
            shared
            validation
          }
          events {
            description
            type
          }
          interfaces {
            cacheable
            name
            pageGroups
            path
            port
            prefix
            protocol
            type
            services {
              config
              name
            }
          }
          maintainers {
            email
            name
            url
          }
          owner {
            avatar
            did
            email
            fullName
          }
          payment {
            price {
              address
              symbol
              value
            }
            share {
              address
              name
              value
            }
          }
          repository {
            type
            url
          }
          requirements {
            aigne
            cpu
            os
            server
            fuels {
              address
              endpoint
              reason
              value
            }
          }
          resource {
            exportApi
            bundles {
              did
              public
              type
            }
            types {
              description
              type
            }
          }
          stats {
            downloads
            purchases
            star
          }
        }
      }
      runtimeInfo {
        cpus
        cpuUsage
        memoryUsage
        pid
        port
        runningDocker
        uptime
      }
      settings {
        actionConfig
        authentication
        didConnect
        enablePassportIssuance
        enableSessionHardening
        initialized
        notification
        oauth
        publicToStore
        theme
        whoCanAccess
        aigne {
          accessKeyId
          key
          model
          provider
          secretAccessKey
          url
          validationResult
        }
        autoBackup {
          enabled
        }
        autoCheckUpdate {
          enabled
        }
        children {
          deletedAt
          deployedFrom
          mountPoint
          status
          meta {
            bundleDid
            bundleName
            description
            did
            name
            title
            version
          }
        }
        endpointList {
          appDescription
          appName
          endpoint
          id
          protected
          scope
          url
        }
        federated {
          config {
            appId
            appPid
            autoLogin
            delegation
            isMaster
          }
          sites {
            aliasDid
            aliasDomain
            appDescription
            appId
            appliedAt
            appLogo
            appLogoRect
            appName
            appPid
            appUrl
            did
            isMaster
            pk
            serverId
            serverVersion
            status
            version
          }
        }
        gateway {
          cacheEnabled
          blockPolicy {
            blacklist
            enabled
            autoBlocking {
              blockDuration
              enabled
              statusCodes
              windowQuota
              windowSize
            }
          }
          proxyPolicy {
            enabled
            realIpHeader
            trustedProxies
            trustRecursive
          }
          requestLimit {
            burstDelay
            burstFactor
            enabled
            global
            methods
            rate
          }
          wafPolicy {
            enabled
            inboundAnomalyScoreThreshold
            logLevel
            mode
            outboundAnomalyScoreThreshold
          }
        }
        invite {
          enabled
        }
        navigations {
          activeColor
          activeIcon
          color
          component
          description
          from
          icon
          id
          link
          parent
          private
          role
          section
          title
          visible
        }
        org {
          enabled
          maxMemberPerOrg
          maxOrgPerUser
        }
        owner {
          did
          pk
        }
        session {
          cacheTtl
          enableBlacklist
          salt
          ttl
          email {
            domainBlackList
            domainWhiteList
            enabled
            enableDomainBlackList
            enableDomainWhiteList
            requireUnique
            requireVerified
            trustOauthProviders
            trustedIssuers {
              id
              name
              pk
            }
          }
          phone {
            enabled
            enableRegionBlackList
            enableRegionWhiteList
            regionBlackList
            regionWhiteList
            requireUnique
            requireVerified
            trustedIssuers {
              id
              name
              pk
            }
          }
        }
        storeList {
          cdnUrl
          description
          id
          logoUrl
          maintainer
          name
          protected
          scope
          url
        }
        subService {
          domain
          enabled
          staticRoot
        }
        trustedFactories {
          factoryAddress
          holderDid
          issuerDid
          remark
          passport {
            role
            ttl
            ttlPolicy
          }
        }
        trustedPassports {
          issuerDid
          remark
          mappings {
            from {
              passport
            }
            to {
              role
              ttl
              ttlPolicy
            }
          }
        }
      }
      site {
        corsAllowedOrigins
        domain
        domainAliases
        id
        isProtected
        rules {
          id
          isProtected
          from {
            pathPrefix
            header {
              key
              type
              value
            }
          }
          to {
            componentId
            did
            interfaceName
            pageGroup
            port
            redirectCode
            type
            url
            response {
              body
              contentType
              status
            }
          }
        }
      }
      trustedFactories {
        factoryAddress
        holderDid
        issuerDid
        remark
        passport {
          role
          ttl
          ttlPolicy
        }
      }
      trustedPassports {
        issuerDid
        remark
        mappings {
          from {
            passport
          }
          to {
            role
            ttl
            ttlPolicy
          }
        }
      }
      vaults {
        approverDid
        approverPk
        approverSig
        at
        did
        pk
        sig
      }
    }
  }
}
```

### installComponent

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
mutation {
  installComponent {
    code
    blocklet {
      appDid
      appPid
      bundleSource
      createdAt
      deployedFrom
      dynamic
      enableDocker
      enableDockerNetwork
      enablePassportIssuance
      externalSk
      externalSkSource
      installedAt
      mode
      mountPoint
      pausedAt
      port
      ports
      source
      startedAt
      status
      stoppedAt
      structVersion
      updatedAt
      appRuntimeInfo {
        cpus
        cpuUsage
        memoryUsage
        pid
        port
        runningDocker
        uptime
      }
      children {
        bundleSource
        createdAt
        deployedFrom
        dynamic
        greenStatus
        installedAt
        mode
        mountPoint
        pausedAt
        port
        ports
        required
        source
        startedAt
        status
        stoppedAt
        appRuntimeInfo {
          cpus
          cpuUsage
          memoryUsage
          pid
          port
          runningDocker
          uptime
        }
        children {
          bundleSource
          createdAt
          deployedFrom
          dynamic
          greenStatus
          installedAt
          mode
          mountPoint
          pausedAt
          port
          ports
          required
          source
          startedAt
          status
          stoppedAt
          appRuntimeInfo {
            cpus
            cpuUsage
            memoryUsage
            pid
            port
            runningDocker
            uptime
          }
          children {
            bundleSource
            createdAt
            deployedFrom
            dynamic
            greenStatus
            installedAt
            mode
            mountPoint
            pausedAt
            port
            ports
            required
            source
            startedAt
            status
            stoppedAt
            appRuntimeInfo {
              cpus
              cpuUsage
              memoryUsage
              pid
              port
              runningDocker
              uptime
            }
            children {
              bundleSource
              createdAt
              deployedFrom
              dynamic
              greenStatus
              installedAt
              mode
              mountPoint
              pausedAt
              port
              ports
              required
              source
              startedAt
              status
              stoppedAt
              appRuntimeInfo {
                cpus
                cpuUsage
                memoryUsage
                pid
                port
                runningDocker
                uptime
              }
              children {
                bundleSource
                createdAt
                deployedFrom
                dynamic
                greenStatus
                installedAt
                mode
                mountPoint
                pausedAt
                port
                ports
                required
                source
                startedAt
                status
                stoppedAt
              }
              configs {
                custom
                description
                key
                required
                secure
                shared
                validation
                value
              }
              dependents {
                id
                required
              }
              diskInfo {
                app
                blocklets
                cache
                data
                log
              }
              engine {
                available
                description
                displayName
                logo
                name
                version
                visible
              }
              environments {
                custom
                description
                key
                required
                secure
                shared
                validation
                value
              }
              meta {
                bundleDid
                bundleName
                community
                description
                did
                documentation
                engine
                group
                homepage
                keywords
                lastPublishedAt
                logo
                main
                name
                navigation
                nftFactory
                path
                resources
                screenshots
                support
                title
                version
              }
              runtimeInfo {
                cpus
                cpuUsage
                memoryUsage
                pid
                port
                runningDocker
                uptime
              }
            }
            configs {
              custom
              description
              key
              required
              secure
              shared
              validation
              value
            }
            dependents {
              id
              required
            }
            diskInfo {
              app
              blocklets
              cache
              data
              log
            }
            engine {
              available
              description
              displayName
              logo
              name
              version
              visible
            }
            environments {
              custom
              description
              key
              required
              secure
              shared
              validation
              value
            }
            meta {
              bundleDid
              bundleName
              community
              description
              did
              documentation
              engine
              group
              homepage
              keywords
              lastPublishedAt
              logo
              main
              name
              navigation
              nftFactory
              path
              resources
              screenshots
              support
              title
              version
              author {
                email
                name
                url
              }
              capabilities {
                clusterMode
                component
                didSpace
                navigation
                resourceExportApi
              }
              components {
                mountPoint
                name
                required
              }
              contributors {
                email
                name
                url
              }
              dist {
                integrity
                tarball
              }
              docker {
                image
                installNodeModules
                runBaseScript
                shell
              }
              environments {
                default
                description
                name
                required
                secure
                shared
                validation
              }
              events {
                description
                type
              }
              interfaces {
                cacheable
                name
                pageGroups
                path
                port
                prefix
                protocol
                type
              }
              maintainers {
                email
                name
                url
              }
              owner {
                avatar
                did
                email
                fullName
              }
              repository {
                type
                url
              }
              requirements {
                aigne
                cpu
                os
                server
              }
              resource {
                exportApi
              }
              stats {
                downloads
                purchases
                star
              }
            }
            runtimeInfo {
              cpus
              cpuUsage
              memoryUsage
              pid
              port
              runningDocker
              uptime
            }
          }
          configs {
            custom
            description
            key
            required
            secure
            shared
            validation
            value
          }
          dependents {
            id
            required
          }
          diskInfo {
            app
            blocklets
            cache
            data
            log
          }
          engine {
            available
            description
            displayName
            logo
            name
            version
            visible
          }
          environments {
            custom
            description
            key
            required
            secure
            shared
            validation
            value
          }
          meta {
            bundleDid
            bundleName
            community
            description
            did
            documentation
            engine
            group
            homepage
            keywords
            lastPublishedAt
            logo
            main
            name
            navigation
            nftFactory
            path
            resources
            screenshots
            support
            title
            version
            author {
              email
              name
              url
            }
            capabilities {
              clusterMode
              component
              didSpace
              navigation
              resourceExportApi
            }
            components {
              mountPoint
              name
              required
            }
            contributors {
              email
              name
              url
            }
            dist {
              integrity
              tarball
            }
            docker {
              image
              installNodeModules
              runBaseScript
              shell
            }
            environments {
              default
              description
              name
              required
              secure
              shared
              validation
            }
            events {
              description
              type
            }
            interfaces {
              cacheable
              name
              pageGroups
              path
              port
              prefix
              protocol
              type
              services {
                config
                name
              }
            }
            maintainers {
              email
              name
              url
            }
            owner {
              avatar
              did
              email
              fullName
            }
            payment {
              price {
                address
                symbol
                value
              }
              share {
                address
                name
                value
              }
            }
            repository {
              type
              url
            }
            requirements {
              aigne
              cpu
              os
              server
              fuels {
                address
                endpoint
                reason
                value
              }
            }
            resource {
              exportApi
              bundles {
                did
                public
                type
              }
              types {
                description
                type
              }
            }
            stats {
              downloads
              purchases
              star
            }
          }
          runtimeInfo {
            cpus
            cpuUsage
            memoryUsage
            pid
            port
            runningDocker
            uptime
          }
        }
        configs {
          custom
          description
          key
          required
          secure
          shared
          validation
          value
        }
        dependents {
          id
          required
        }
        diskInfo {
          app
          blocklets
          cache
          data
          log
        }
        engine {
          available
          description
          displayName
          logo
          name
          version
          visible
        }
        environments {
          custom
          description
          key
          required
          secure
          shared
          validation
          value
        }
        meta {
          bundleDid
          bundleName
          community
          description
          did
          documentation
          engine
          group
          homepage
          keywords
          lastPublishedAt
          logo
          main
          name
          navigation
          nftFactory
          path
          resources
          screenshots
          support
          title
          version
          author {
            email
            name
            url
          }
          capabilities {
            clusterMode
            component
            didSpace
            navigation
            resourceExportApi
          }
          components {
            mountPoint
            name
            required
          }
          contributors {
            email
            name
            url
          }
          dist {
            integrity
            tarball
          }
          docker {
            image
            installNodeModules
            runBaseScript
            shell
          }
          environments {
            default
            description
            name
            required
            secure
            shared
            validation
          }
          events {
            description
            type
          }
          interfaces {
            cacheable
            name
            pageGroups
            path
            port
            prefix
            protocol
            type
            services {
              config
              name
            }
          }
          maintainers {
            email
            name
            url
          }
          owner {
            avatar
            did
            email
            fullName
          }
          payment {
            price {
              address
              symbol
              value
            }
            share {
              address
              name
              value
            }
          }
          repository {
            type
            url
          }
          requirements {
            aigne
            cpu
            os
            server
            fuels {
              address
              endpoint
              reason
              value
            }
          }
          resource {
            exportApi
            bundles {
              did
              public
              type
            }
            types {
              description
              type
            }
          }
          stats {
            downloads
            purchases
            star
          }
        }
        runtimeInfo {
          cpus
          cpuUsage
          memoryUsage
          pid
          port
          runningDocker
          uptime
        }
      }
      configs {
        custom
        description
        key
        required
        secure
        shared
        validation
        value
      }
      controller {
        chainHost
        consumedAt
        expireDate
        id
        launcherSessionId
        launcherUrl
        nftId
        nftOwner
        ownerDid
        status {
          reason
          value
        }
      }
      diskInfo {
        app
        blocklets
        cache
        data
        log
      }
      engine {
        available
        description
        displayName
        logo
        name
        version
        visible
      }
      environments {
        custom
        description
        key
        required
        secure
        shared
        validation
        value
      }
      meta {
        bundleDid
        bundleName
        community
        description
        did
        documentation
        engine
        group
        homepage
        keywords
        lastPublishedAt
        logo
        main
        name
        navigation
        nftFactory
        path
        resources
        screenshots
        support
        title
        version
        author {
          email
          name
          url
        }
        capabilities {
          clusterMode
          component
          didSpace
          navigation
          resourceExportApi
        }
        components {
          mountPoint
          name
          required
        }
        contributors {
          email
          name
          url
        }
        dist {
          integrity
          tarball
        }
        docker {
          image
          installNodeModules
          runBaseScript
          shell
        }
        environments {
          default
          description
          name
          required
          secure
          shared
          validation
        }
        events {
          description
          type
        }
        interfaces {
          cacheable
          name
          pageGroups
          path
          port
          prefix
          protocol
          type
          services {
            config
            name
          }
        }
        maintainers {
          email
          name
          url
        }
        owner {
          avatar
          did
          email
          fullName
        }
        payment {
          price {
            address
            symbol
            value
          }
          share {
            address
            name
            value
          }
        }
        repository {
          type
          url
        }
        requirements {
          aigne
          cpu
          os
          server
          fuels {
            address
            endpoint
            reason
            value
          }
        }
        resource {
          exportApi
          bundles {
            did
            public
            type
          }
          types {
            description
            type
          }
        }
        stats {
          downloads
          purchases
          star
        }
      }
      migratedFrom {
        appDid
        appSk
        at
      }
      optionalComponents {
        bundleSource
        logoUrl
        dependencies {
          mountPoint
          parentDid
          parentName
          parentTitle
          required
        }
        meta {
          bundleDid
          bundleName
          community
          description
          did
          documentation
          engine
          group
          homepage
          keywords
          lastPublishedAt
          logo
          main
          name
          navigation
          nftFactory
          path
          resources
          screenshots
          support
          title
          version
          author {
            email
            name
            url
          }
          capabilities {
            clusterMode
            component
            didSpace
            navigation
            resourceExportApi
          }
          components {
            mountPoint
            name
            required
          }
          contributors {
            email
            name
            url
          }
          dist {
            integrity
            tarball
          }
          docker {
            image
            installNodeModules
            runBaseScript
            shell
          }
          environments {
            default
            description
            name
            required
            secure
            shared
            validation
          }
          events {
            description
            type
          }
          interfaces {
            cacheable
            name
            pageGroups
            path
            port
            prefix
            protocol
            type
            services {
              config
              name
            }
          }
          maintainers {
            email
            name
            url
          }
          owner {
            avatar
            did
            email
            fullName
          }
          payment {
            price {
              address
              symbol
              value
            }
            share {
              address
              name
              value
            }
          }
          repository {
            type
            url
          }
          requirements {
            aigne
            cpu
            os
            server
            fuels {
              address
              endpoint
              reason
              value
            }
          }
          resource {
            exportApi
            bundles {
              did
              public
              type
            }
            types {
              description
              type
            }
          }
          stats {
            downloads
            purchases
            star
          }
        }
      }
      runtimeInfo {
        cpus
        cpuUsage
        memoryUsage
        pid
        port
        runningDocker
        uptime
      }
      settings {
        actionConfig
        authentication
        didConnect
        enablePassportIssuance
        enableSessionHardening
        initialized
        notification
        oauth
        publicToStore
        theme
        whoCanAccess
        aigne {
          accessKeyId
          key
          model
          provider
          secretAccessKey
          url
          validationResult
        }
        autoBackup {
          enabled
        }
        autoCheckUpdate {
          enabled
        }
        children {
          deletedAt
          deployedFrom
          mountPoint
          status
          meta {
            bundleDid
            bundleName
            description
            did
            name
            title
            version
          }
        }
        endpointList {
          appDescription
          appName
          endpoint
          id
          protected
          scope
          url
        }
        federated {
          config {
            appId
            appPid
            autoLogin
            delegation
            isMaster
          }
          sites {
            aliasDid
            aliasDomain
            appDescription
            appId
            appliedAt
            appLogo
            appLogoRect
            appName
            appPid
            appUrl
            did
            isMaster
            pk
            serverId
            serverVersion
            status
            version
          }
        }
        gateway {
          cacheEnabled
          blockPolicy {
            blacklist
            enabled
            autoBlocking {
              blockDuration
              enabled
              statusCodes
              windowQuota
              windowSize
            }
          }
          proxyPolicy {
            enabled
            realIpHeader
            trustedProxies
            trustRecursive
          }
          requestLimit {
            burstDelay
            burstFactor
            enabled
            global
            methods
            rate
          }
          wafPolicy {
            enabled
            inboundAnomalyScoreThreshold
            logLevel
            mode
            outboundAnomalyScoreThreshold
          }
        }
        invite {
          enabled
        }
        navigations {
          activeColor
          activeIcon
          color
          component
          description
          from
          icon
          id
          link
          parent
          private
          role
          section
          title
          visible
        }
        org {
          enabled
          maxMemberPerOrg
          maxOrgPerUser
        }
        owner {
          did
          pk
        }
        session {
          cacheTtl
          enableBlacklist
          salt
          ttl
          email {
            domainBlackList
            domainWhiteList
            enabled
            enableDomainBlackList
            enableDomainWhiteList
            requireUnique
            requireVerified
            trustOauthProviders
            trustedIssuers {
              id
              name
              pk
            }
          }
          phone {
            enabled
            enableRegionBlackList
            enableRegionWhiteList
            regionBlackList
            regionWhiteList
            requireUnique
            requireVerified
            trustedIssuers {
              id
              name
              pk
            }
          }
        }
        storeList {
          cdnUrl
          description
          id
          logoUrl
          maintainer
          name
          protected
          scope
          url
        }
        subService {
          domain
          enabled
          staticRoot
        }
        trustedFactories {
          factoryAddress
          holderDid
          issuerDid
          remark
          passport {
            role
            ttl
            ttlPolicy
          }
        }
        trustedPassports {
          issuerDid
          remark
          mappings {
            from {
              passport
            }
            to {
              role
              ttl
              ttlPolicy
            }
          }
        }
      }
      site {
        corsAllowedOrigins
        domain
        domainAliases
        id
        isProtected
        rules {
          id
          isProtected
          from {
            pathPrefix
            header {
              key
              type
              value
            }
          }
          to {
            componentId
            did
            interfaceName
            pageGroup
            port
            redirectCode
            type
            url
            response {
              body
              contentType
              status
            }
          }
        }
      }
      trustedFactories {
        factoryAddress
        holderDid
        issuerDid
        remark
        passport {
          role
          ttl
          ttlPolicy
        }
      }
      trustedPassports {
        issuerDid
        remark
        mappings {
          from {
            passport
          }
          to {
            role
            ttl
            ttlPolicy
          }
        }
      }
      vaults {
        approverDid
        approverPk
        approverSig
        at
        did
        pk
        sig
      }
    }
  }
}
```

### startBlocklet

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
mutation {
  startBlocklet {
    code
    blocklet {
      appDid
      appPid
      bundleSource
      createdAt
      deployedFrom
      dynamic
      enableDocker
      enableDockerNetwork
      enablePassportIssuance
      externalSk
      externalSkSource
      installedAt
      mode
      mountPoint
      pausedAt
      port
      ports
      source
      startedAt
      status
      stoppedAt
      structVersion
      updatedAt
      appRuntimeInfo {
        cpus
        cpuUsage
        memoryUsage
        pid
        port
        runningDocker
        uptime
      }
      children {
        bundleSource
        createdAt
        deployedFrom
        dynamic
        greenStatus
        installedAt
        mode
        mountPoint
        pausedAt
        port
        ports
        required
        source
        startedAt
        status
        stoppedAt
        appRuntimeInfo {
          cpus
          cpuUsage
          memoryUsage
          pid
          port
          runningDocker
          uptime
        }
        children {
          bundleSource
          createdAt
          deployedFrom
          dynamic
          greenStatus
          installedAt
          mode
          mountPoint
          pausedAt
          port
          ports
          required
          source
          startedAt
          status
          stoppedAt
          appRuntimeInfo {
            cpus
            cpuUsage
            memoryUsage
            pid
            port
            runningDocker
            uptime
          }
          children {
            bundleSource
            createdAt
            deployedFrom
            dynamic
            greenStatus
            installedAt
            mode
            mountPoint
            pausedAt
            port
            ports
            required
            source
            startedAt
            status
            stoppedAt
            appRuntimeInfo {
              cpus
              cpuUsage
              memoryUsage
              pid
              port
              runningDocker
              uptime
            }
            children {
              bundleSource
              createdAt
              deployedFrom
              dynamic
              greenStatus
              installedAt
              mode
              mountPoint
              pausedAt
              port
              ports
              required
              source
              startedAt
              status
              stoppedAt
              appRuntimeInfo {
                cpus
                cpuUsage
                memoryUsage
                pid
                port
                runningDocker
                uptime
              }
              children {
                bundleSource
                createdAt
                deployedFrom
                dynamic
                greenStatus
                installedAt
                mode
                mountPoint
                pausedAt
                port
                ports
                required
                source
                startedAt
                status
                stoppedAt
              }
              configs {
                custom
                description
                key
                required
                secure
                shared
                validation
                value
              }
              dependents {
                id
                required
              }
              diskInfo {
                app
                blocklets
                cache
                data
                log
              }
              engine {
                available
                description
                displayName
                logo
                name
                version
                visible
              }
              environments {
                custom
                description
                key
                required
                secure
                shared
                validation
                value
              }
              meta {
                bundleDid
                bundleName
                community
                description
                did
                documentation
                engine
                group
                homepage
                keywords
                lastPublishedAt
                logo
                main
                name
                navigation
                nftFactory
                path
                resources
                screenshots
                support
                title
                version
              }
              runtimeInfo {
                cpus
                cpuUsage
                memoryUsage
                pid
                port
                runningDocker
                uptime
              }
            }
            configs {
              custom
              description
              key
              required
              secure
              shared
              validation
              value
            }
            dependents {
              id
              required
            }
            diskInfo {
              app
              blocklets
              cache
              data
              log
            }
            engine {
              available
              description
              displayName
              logo
              name
              version
              visible
            }
            environments {
              custom
              description
              key
              required
              secure
              shared
              validation
              value
            }
            meta {
              bundleDid
              bundleName
              community
              description
              did
              documentation
              engine
              group
              homepage
              keywords
              lastPublishedAt
              logo
              main
              name
              navigation
              nftFactory
              path
              resources
              screenshots
              support
              title
              version
              author {
                email
                name
                url
              }
              capabilities {
                clusterMode
                component
                didSpace
                navigation
                resourceExportApi
              }
              components {
                mountPoint
                name
                required
              }
              contributors {
                email
                name
                url
              }
              dist {
                integrity
                tarball
              }
              docker {
                image
                installNodeModules
                runBaseScript
                shell
              }
              environments {
                default
                description
                name
                required
                secure
                shared
                validation
              }
              events {
                description
                type
              }
              interfaces {
                cacheable
                name
                pageGroups
                path
                port
                prefix
                protocol
                type
              }
              maintainers {
                email
                name
                url
              }
              owner {
                avatar
                did
                email
                fullName
              }
              repository {
                type
                url
              }
              requirements {
                aigne
                cpu
                os
                server
              }
              resource {
                exportApi
              }
              stats {
                downloads
                purchases
                star
              }
            }
            runtimeInfo {
              cpus
              cpuUsage
              memoryUsage
              pid
              port
              runningDocker
              uptime
            }
          }
          configs {
            custom
            description
            key
            required
            secure
            shared
            validation
            value
          }
          dependents {
            id
            required
          }
          diskInfo {
            app
            blocklets
            cache
            data
            log
          }
          engine {
            available
            description
            displayName
            logo
            name
            version
            visible
          }
          environments {
            custom
            description
            key
            required
            secure
            shared
            validation
            value
          }
          meta {
            bundleDid
            bundleName
            community
            description
            did
            documentation
            engine
            group
            homepage
            keywords
            lastPublishedAt
            logo
            main
            name
            navigation
            nftFactory
            path
            resources
            screenshots
            support
            title
            version
            author {
              email
              name
              url
            }
            capabilities {
              clusterMode
              component
              didSpace
              navigation
              resourceExportApi
            }
            components {
              mountPoint
              name
              required
            }
            contributors {
              email
              name
              url
            }
            dist {
              integrity
              tarball
            }
            docker {
              image
              installNodeModules
              runBaseScript
              shell
            }
            environments {
              default
              description
              name
              required
              secure
              shared
              validation
            }
            events {
              description
              type
            }
            interfaces {
              cacheable
              name
              pageGroups
              path
              port
              prefix
              protocol
              type
              services {
                config
                name
              }
            }
            maintainers {
              email
              name
              url
            }
            owner {
              avatar
              did
              email
              fullName
            }
            payment {
              price {
                address
                symbol
                value
              }
              share {
                address
                name
                value
              }
            }
            repository {
              type
              url
            }
            requirements {
              aigne
              cpu
              os
              server
              fuels {
                address
                endpoint
                reason
                value
              }
            }
            resource {
              exportApi
              bundles {
                did
                public
                type
              }
              types {
                description
                type
              }
            }
            stats {
              downloads
              purchases
              star
            }
          }
          runtimeInfo {
            cpus
            cpuUsage
            memoryUsage
            pid
            port
            runningDocker
            uptime
          }
        }
        configs {
          custom
          description
          key
          required
          secure
          shared
          validation
          value
        }
        dependents {
          id
          required
        }
        diskInfo {
          app
          blocklets
          cache
          data
          log
        }
        engine {
          available
          description
          displayName
          logo
          name
          version
          visible
        }
        environments {
          custom
          description
          key
          required
          secure
          shared
          validation
          value
        }
        meta {
          bundleDid
          bundleName
          community
          description
          did
          documentation
          engine
          group
          homepage
          keywords
          lastPublishedAt
          logo
          main
          name
          navigation
          nftFactory
          path
          resources
          screenshots
          support
          title
          version
          author {
            email
            name
            url
          }
          capabilities {
            clusterMode
            component
            didSpace
            navigation
            resourceExportApi
          }
          components {
            mountPoint
            name
            required
          }
          contributors {
            email
            name
            url
          }
          dist {
            integrity
            tarball
          }
          docker {
            image
            installNodeModules
            runBaseScript
            shell
          }
          environments {
            default
            description
            name
            required
            secure
            shared
            validation
          }
          events {
            description
            type
          }
          interfaces {
            cacheable
            name
            pageGroups
            path
            port
            prefix
            protocol
            type
            services {
              config
              name
            }
          }
          maintainers {
            email
            name
            url
          }
          owner {
            avatar
            did
            email
            fullName
          }
          payment {
            price {
              address
              symbol
              value
            }
            share {
              address
              name
              value
            }
          }
          repository {
            type
            url
          }
          requirements {
            aigne
            cpu
            os
            server
            fuels {
              address
              endpoint
              reason
              value
            }
          }
          resource {
            exportApi
            bundles {
              did
              public
              type
            }
            types {
              description
              type
            }
          }
          stats {
            downloads
            purchases
            star
          }
        }
        runtimeInfo {
          cpus
          cpuUsage
          memoryUsage
          pid
          port
          runningDocker
          uptime
        }
      }
      configs {
        custom
        description
        key
        required
        secure
        shared
        validation
        value
      }
      controller {
        chainHost
        consumedAt
        expireDate
        id
        launcherSessionId
        launcherUrl
        nftId
        nftOwner
        ownerDid
        status {
          reason
          value
        }
      }
      diskInfo {
        app
        blocklets
        cache
        data
        log
      }
      engine {
        available
        description
        displayName
        logo
        name
        version
        visible
      }
      environments {
        custom
        description
        key
        required
        secure
        shared
        validation
        value
      }
      meta {
        bundleDid
        bundleName
        community
        description
        did
        documentation
        engine
        group
        homepage
        keywords
        lastPublishedAt
        logo
        main
        name
        navigation
        nftFactory
        path
        resources
        screenshots
        support
        title
        version
        author {
          email
          name
          url
        }
        capabilities {
          clusterMode
          component
          didSpace
          navigation
          resourceExportApi
        }
        components {
          mountPoint
          name
          required
        }
        contributors {
          email
          name
          url
        }
        dist {
          integrity
          tarball
        }
        docker {
          image
          installNodeModules
          runBaseScript
          shell
        }
        environments {
          default
          description
          name
          required
          secure
          shared
          validation
        }
        events {
          description
          type
        }
        interfaces {
          cacheable
          name
          pageGroups
          path
          port
          prefix
          protocol
          type
          services {
            config
            name
          }
        }
        maintainers {
          email
          name
          url
        }
        owner {
          avatar
          did
          email
          fullName
        }
        payment {
          price {
            address
            symbol
            value
          }
          share {
            address
            name
            value
          }
        }
        repository {
          type
          url
        }
        requirements {
          aigne
          cpu
          os
          server
          fuels {
            address
            endpoint
            reason
            value
          }
        }
        resource {
          exportApi
          bundles {
            did
            public
            type
          }
          types {
            description
            type
          }
        }
        stats {
          downloads
          purchases
          star
        }
      }
      migratedFrom {
        appDid
        appSk
        at
      }
      optionalComponents {
        bundleSource
        logoUrl
        dependencies {
          mountPoint
          parentDid
          parentName
          parentTitle
          required
        }
        meta {
          bundleDid
          bundleName
          community
          description
          did
          documentation
          engine
          group
          homepage
          keywords
          lastPublishedAt
          logo
          main
          name
          navigation
          nftFactory
          path
          resources
          screenshots
          support
          title
          version
          author {
            email
            name
            url
          }
          capabilities {
            clusterMode
            component
            didSpace
            navigation
            resourceExportApi
          }
          components {
            mountPoint
            name
            required
          }
          contributors {
            email
            name
            url
          }
          dist {
            integrity
            tarball
          }
          docker {
            image
            installNodeModules
            runBaseScript
            shell
          }
          environments {
            default
            description
            name
            required
            secure
            shared
            validation
          }
          events {
            description
            type
          }
          interfaces {
            cacheable
            name
            pageGroups
            path
            port
            prefix
            protocol
            type
            services {
              config
              name
            }
          }
          maintainers {
            email
            name
            url
          }
          owner {
            avatar
            did
            email
            fullName
          }
          payment {
            price {
              address
              symbol
              value
            }
            share {
              address
              name
              value
            }
          }
          repository {
            type
            url
          }
          requirements {
            aigne
            cpu
            os
            server
            fuels {
              address
              endpoint
              reason
              value
            }
          }
          resource {
            exportApi
            bundles {
              did
              public
              type
            }
            types {
              description
              type
            }
          }
          stats {
            downloads
            purchases
            star
          }
        }
      }
      runtimeInfo {
        cpus
        cpuUsage
        memoryUsage
        pid
        port
        runningDocker
        uptime
      }
      settings {
        actionConfig
        authentication
        didConnect
        enablePassportIssuance
        enableSessionHardening
        initialized
        notification
        oauth
        publicToStore
        theme
        whoCanAccess
        aigne {
          accessKeyId
          key
          model
          provider
          secretAccessKey
          url
          validationResult
        }
        autoBackup {
          enabled
        }
        autoCheckUpdate {
          enabled
        }
        children {
          deletedAt
          deployedFrom
          mountPoint
          status
          meta {
            bundleDid
            bundleName
            description
            did
            name
            title
            version
          }
        }
        endpointList {
          appDescription
          appName
          endpoint
          id
          protected
          scope
          url
        }
        federated {
          config {
            appId
            appPid
            autoLogin
            delegation
            isMaster
          }
          sites {
            aliasDid
            aliasDomain
            appDescription
            appId
            appliedAt
            appLogo
            appLogoRect
            appName
            appPid
            appUrl
            did
            isMaster
            pk
            serverId
            serverVersion
            status
            version
          }
        }
        gateway {
          cacheEnabled
          blockPolicy {
            blacklist
            enabled
            autoBlocking {
              blockDuration
              enabled
              statusCodes
              windowQuota
              windowSize
            }
          }
          proxyPolicy {
            enabled
            realIpHeader
            trustedProxies
            trustRecursive
          }
          requestLimit {
            burstDelay
            burstFactor
            enabled
            global
            methods
            rate
          }
          wafPolicy {
            enabled
            inboundAnomalyScoreThreshold
            logLevel
            mode
            outboundAnomalyScoreThreshold
          }
        }
        invite {
          enabled
        }
        navigations {
          activeColor
          activeIcon
          color
          component
          description
          from
          icon
          id
          link
          parent
          private
          role
          section
          title
          visible
        }
        org {
          enabled
          maxMemberPerOrg
          maxOrgPerUser
        }
        owner {
          did
          pk
        }
        session {
          cacheTtl
          enableBlacklist
          salt
          ttl
          email {
            domainBlackList
            domainWhiteList
            enabled
            enableDomainBlackList
            enableDomainWhiteList
            requireUnique
            requireVerified
            trustOauthProviders
            trustedIssuers {
              id
              name
              pk
            }
          }
          phone {
            enabled
            enableRegionBlackList
            enableRegionWhiteList
            regionBlackList
            regionWhiteList
            requireUnique
            requireVerified
            trustedIssuers {
              id
              name
              pk
            }
          }
        }
        storeList {
          cdnUrl
          description
          id
          logoUrl
          maintainer
          name
          protected
          scope
          url
        }
        subService {
          domain
          enabled
          staticRoot
        }
        trustedFactories {
          factoryAddress
          holderDid
          issuerDid
          remark
          passport {
            role
            ttl
            ttlPolicy
          }
        }
        trustedPassports {
          issuerDid
          remark
          mappings {
            from {
              passport
            }
            to {
              role
              ttl
              ttlPolicy
            }
          }
        }
      }
      site {
        corsAllowedOrigins
        domain
        domainAliases
        id
        isProtected
        rules {
          id
          isProtected
          from {
            pathPrefix
            header {
              key
              type
              value
            }
          }
          to {
            componentId
            did
            interfaceName
            pageGroup
            port
            redirectCode
            type
            url
            response {
              body
              contentType
              status
            }
          }
        }
      }
      trustedFactories {
        factoryAddress
        holderDid
        issuerDid
        remark
        passport {
          role
          ttl
          ttlPolicy
        }
      }
      trustedPassports {
        issuerDid
        remark
        mappings {
          from {
            passport
          }
          to {
            role
            ttl
            ttlPolicy
          }
        }
      }
      vaults {
        approverDid
        approverPk
        approverSig
        at
        did
        pk
        sig
      }
    }
  }
}
```

### stopBlocklet

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
mutation {
  stopBlocklet {
    code
    blocklet {
      appDid
      appPid
      bundleSource
      createdAt
      deployedFrom
      dynamic
      enableDocker
      enableDockerNetwork
      enablePassportIssuance
      externalSk
      externalSkSource
      installedAt
      mode
      mountPoint
      pausedAt
      port
      ports
      source
      startedAt
      status
      stoppedAt
      structVersion
      updatedAt
      appRuntimeInfo {
        cpus
        cpuUsage
        memoryUsage
        pid
        port
        runningDocker
        uptime
      }
      children {
        bundleSource
        createdAt
        deployedFrom
        dynamic
        greenStatus
        installedAt
        mode
        mountPoint
        pausedAt
        port
        ports
        required
        source
        startedAt
        status
        stoppedAt
        appRuntimeInfo {
          cpus
          cpuUsage
          memoryUsage
          pid
          port
          runningDocker
          uptime
        }
        children {
          bundleSource
          createdAt
          deployedFrom
          dynamic
          greenStatus
          installedAt
          mode
          mountPoint
          pausedAt
          port
          ports
          required
          source
          startedAt
          status
          stoppedAt
          appRuntimeInfo {
            cpus
            cpuUsage
            memoryUsage
            pid
            port
            runningDocker
            uptime
          }
          children {
            bundleSource
            createdAt
            deployedFrom
            dynamic
            greenStatus
            installedAt
            mode
            mountPoint
            pausedAt
            port
            ports
            required
            source
            startedAt
            status
            stoppedAt
            appRuntimeInfo {
              cpus
              cpuUsage
              memoryUsage
              pid
              port
              runningDocker
              uptime
            }
            children {
              bundleSource
              createdAt
              deployedFrom
              dynamic
              greenStatus
              installedAt
              mode
              mountPoint
              pausedAt
              port
              ports
              required
              source
              startedAt
              status
              stoppedAt
              appRuntimeInfo {
                cpus
                cpuUsage
                memoryUsage
                pid
                port
                runningDocker
                uptime
              }
              children {
                bundleSource
                createdAt
                deployedFrom
                dynamic
                greenStatus
                installedAt
                mode
                mountPoint
                pausedAt
                port
                ports
                required
                source
                startedAt
                status
                stoppedAt
              }
              configs {
                custom
                description
                key
                required
                secure
                shared
                validation
                value
              }
              dependents {
                id
                required
              }
              diskInfo {
                app
                blocklets
                cache
                data
                log
              }
              engine {
                available
                description
                displayName
                logo
                name
                version
                visible
              }
              environments {
                custom
                description
                key
                required
                secure
                shared
                validation
                value
              }
              meta {
                bundleDid
                bundleName
                community
                description
                did
                documentation
                engine
                group
                homepage
                keywords
                lastPublishedAt
                logo
                main
                name
                navigation
                nftFactory
                path
                resources
                screenshots
                support
                title
                version
              }
              runtimeInfo {
                cpus
                cpuUsage
                memoryUsage
                pid
                port
                runningDocker
                uptime
              }
            }
            configs {
              custom
              description
              key
              required
              secure
              shared
              validation
              value
            }
            dependents {
              id
              required
            }
            diskInfo {
              app
              blocklets
              cache
              data
              log
            }
            engine {
              available
              description
              displayName
              logo
              name
              version
              visible
            }
            environments {
              custom
              description
              key
              required
              secure
              shared
              validation
              value
            }
            meta {
              bundleDid
              bundleName
              community
              description
              did
              documentation
              engine
              group
              homepage
              keywords
              lastPublishedAt
              logo
              main
              name
              navigation
              nftFactory
              path
              resources
              screenshots
              support
              title
              version
              author {
                email
                name
                url
              }
              capabilities {
                clusterMode
                component
                didSpace
                navigation
                resourceExportApi
              }
              components {
                mountPoint
                name
                required
              }
              contributors {
                email
                name
                url
              }
              dist {
                integrity
                tarball
              }
              docker {
                image
                installNodeModules
                runBaseScript
                shell
              }
              environments {
                default
                description
                name
                required
                secure
                shared
                validation
              }
              events {
                description
                type
              }
              interfaces {
                cacheable
                name
                pageGroups
                path
                port
                prefix
                protocol
                type
              }
              maintainers {
                email
                name
                url
              }
              owner {
                avatar
                did
                email
                fullName
              }
              repository {
                type
                url
              }
              requirements {
                aigne
                cpu
                os
                server
              }
              resource {
                exportApi
              }
              stats {
                downloads
                purchases
                star
              }
            }
            runtimeInfo {
              cpus
              cpuUsage
              memoryUsage
              pid
              port
              runningDocker
              uptime
            }
          }
          configs {
            custom
            description
            key
            required
            secure
            shared
            validation
            value
          }
          dependents {
            id
            required
          }
          diskInfo {
            app
            blocklets
            cache
            data
            log
          }
          engine {
            available
            description
            displayName
            logo
            name
            version
            visible
          }
          environments {
            custom
            description
            key
            required
            secure
            shared
            validation
            value
          }
          meta {
            bundleDid
            bundleName
            community
            description
            did
            documentation
            engine
            group
            homepage
            keywords
            lastPublishedAt
            logo
            main
            name
            navigation
            nftFactory
            path
            resources
            screenshots
            support
            title
            version
            author {
              email
              name
              url
            }
            capabilities {
              clusterMode
              component
              didSpace
              navigation
              resourceExportApi
            }
            components {
              mountPoint
              name
              required
            }
            contributors {
              email
              name
              url
            }
            dist {
              integrity
              tarball
            }
            docker {
              image
              installNodeModules
              runBaseScript
              shell
            }
            environments {
              default
              description
              name
              required
              secure
              shared
              validation
            }
            events {
              description
              type
            }
            interfaces {
              cacheable
              name
              pageGroups
              path
              port
              prefix
              protocol
              type
              services {
                config
                name
              }
            }
            maintainers {
              email
              name
              url
            }
            owner {
              avatar
              did
              email
              fullName
            }
            payment {
              price {
                address
                symbol
                value
              }
              share {
                address
                name
                value
              }
            }
            repository {
              type
              url
            }
            requirements {
              aigne
              cpu
              os
              server
              fuels {
                address
                endpoint
                reason
                value
              }
            }
            resource {
              exportApi
              bundles {
                did
                public
                type
              }
              types {
                description
                type
              }
            }
            stats {
              downloads
              purchases
              star
            }
          }
          runtimeInfo {
            cpus
            cpuUsage
            memoryUsage
            pid
            port
            runningDocker
            uptime
          }
        }
        configs {
          custom
          description
          key
          required
          secure
          shared
          validation
          value
        }
        dependents {
          id
          required
        }
        diskInfo {
          app
          blocklets
          cache
          data
          log
        }
        engine {
          available
          description
          displayName
          logo
          name
          version
          visible
        }
        environments {
          custom
          description
          key
          required
          secure
          shared
          validation
          value
        }
        meta {
          bundleDid
          bundleName
          community
          description
          did
          documentation
          engine
          group
          homepage
          keywords
          lastPublishedAt
          logo
          main
          name
          navigation
          nftFactory
          path
          resources
          screenshots
          support
          title
          version
          author {
            email
            name
            url
          }
          capabilities {
            clusterMode
            component
            didSpace
            navigation
            resourceExportApi
          }
          components {
            mountPoint
            name
            required
          }
          contributors {
            email
            name
            url
          }
          dist {
            integrity
            tarball
          }
          docker {
            image
            installNodeModules
            runBaseScript
            shell
          }
          environments {
            default
            description
            name
            required
            secure
            shared
            validation
          }
          events {
            description
            type
          }
          interfaces {
            cacheable
            name
            pageGroups
            path
            port
            prefix
            protocol
            type
            services {
              config
              name
            }
          }
          maintainers {
            email
            name
            url
          }
          owner {
            avatar
            did
            email
            fullName
          }
          payment {
            price {
              address
              symbol
              value
            }
            share {
              address
              name
              value
            }
          }
          repository {
            type
            url
          }
          requirements {
            aigne
            cpu
            os
            server
            fuels {
              address
              endpoint
              reason
              value
            }
          }
          resource {
            exportApi
            bundles {
              did
              public
              type
            }
            types {
              description
              type
            }
          }
          stats {
            downloads
            purchases
            star
          }
        }
        runtimeInfo {
          cpus
          cpuUsage
          memoryUsage
          pid
          port
          runningDocker
          uptime
        }
      }
      configs {
        custom
        description
        key
        required
        secure
        shared
        validation
        value
      }
      controller {
        chainHost
        consumedAt
        expireDate
        id
        launcherSessionId
        launcherUrl
        nftId
        nftOwner
        ownerDid
        status {
          reason
          value
        }
      }
      diskInfo {
        app
        blocklets
        cache
        data
        log
      }
      engine {
        available
        description
        displayName
        logo
        name
        version
        visible
      }
      environments {
        custom
        description
        key
        required
        secure
        shared
        validation
        value
      }
      meta {
        bundleDid
        bundleName
        community
        description
        did
        documentation
        engine
        group
        homepage
        keywords
        lastPublishedAt
        logo
        main
        name
        navigation
        nftFactory
        path
        resources
        screenshots
        support
        title
        version
        author {
          email
          name
          url
        }
        capabilities {
          clusterMode
          component
          didSpace
          navigation
          resourceExportApi
        }
        components {
          mountPoint
          name
          required
        }
        contributors {
          email
          name
          url
        }
        dist {
          integrity
          tarball
        }
        docker {
          image
          installNodeModules
          runBaseScript
          shell
        }
        environments {
          default
          description
          name
          required
          secure
          shared
          validation
        }
        events {
          description
          type
        }
        interfaces {
          cacheable
          name
          pageGroups
          path
          port
          prefix
          protocol
          type
          services {
            config
            name
          }
        }
        maintainers {
          email
          name
          url
        }
        owner {
          avatar
          did
          email
          fullName
        }
        payment {
          price {
            address
            symbol
            value
          }
          share {
            address
            name
            value
          }
        }
        repository {
          type
          url
        }
        requirements {
          aigne
          cpu
          os
          server
          fuels {
            address
            endpoint
            reason
            value
          }
        }
        resource {
          exportApi
          bundles {
            did
            public
            type
          }
          types {
            description
            type
          }
        }
        stats {
          downloads
          purchases
          star
        }
      }
      migratedFrom {
        appDid
        appSk
        at
      }
      optionalComponents {
        bundleSource
        logoUrl
        dependencies {
          mountPoint
          parentDid
          parentName
          parentTitle
          required
        }
        meta {
          bundleDid
          bundleName
          community
          description
          did
          documentation
          engine
          group
          homepage
          keywords
          lastPublishedAt
          logo
          main
          name
          navigation
          nftFactory
          path
          resources
          screenshots
          support
          title
          version
          author {
            email
            name
            url
          }
          capabilities {
            clusterMode
            component
            didSpace
            navigation
            resourceExportApi
          }
          components {
            mountPoint
            name
            required
          }
          contributors {
            email
            name
            url
          }
          dist {
            integrity
            tarball
          }
          docker {
            image
            installNodeModules
            runBaseScript
            shell
          }
          environments {
            default
            description
            name
            required
            secure
            shared
            validation
          }
          events {
            description
            type
          }
          interfaces {
            cacheable
            name
            pageGroups
            path
            port
            prefix
            protocol
            type
            services {
              config
              name
            }
          }
          maintainers {
            email
            name
            url
          }
          owner {
            avatar
            did
            email
            fullName
          }
          payment {
            price {
              address
              symbol
              value
            }
            share {
              address
              name
              value
            }
          }
          repository {
            type
            url
          }
          requirements {
            aigne
            cpu
            os
            server
            fuels {
              address
              endpoint
              reason
              value
            }
          }
          resource {
            exportApi
            bundles {
              did
              public
              type
            }
            types {
              description
              type
            }
          }
          stats {
            downloads
            purchases
            star
          }
        }
      }
      runtimeInfo {
        cpus
        cpuUsage
        memoryUsage
        pid
        port
        runningDocker
        uptime
      }
      settings {
        actionConfig
        authentication
        didConnect
        enablePassportIssuance
        enableSessionHardening
        initialized
        notification
        oauth
        publicToStore
        theme
        whoCanAccess
        aigne {
          accessKeyId
          key
          model
          provider
          secretAccessKey
          url
          validationResult
        }
        autoBackup {
          enabled
        }
        autoCheckUpdate {
          enabled
        }
        children {
          deletedAt
          deployedFrom
          mountPoint
          status
          meta {
            bundleDid
            bundleName
            description
            did
            name
            title
            version
          }
        }
        endpointList {
          appDescription
          appName
          endpoint
          id
          protected
          scope
          url
        }
        federated {
          config {
            appId
            appPid
            autoLogin
            delegation
            isMaster
          }
          sites {
            aliasDid
            aliasDomain
            appDescription
            appId
            appliedAt
            appLogo
            appLogoRect
            appName
            appPid
            appUrl
            did
            isMaster
            pk
            serverId
            serverVersion
            status
            version
          }
        }
        gateway {
          cacheEnabled
          blockPolicy {
            blacklist
            enabled
            autoBlocking {
              blockDuration
              enabled
              statusCodes
              windowQuota
              windowSize
            }
          }
          proxyPolicy {
            enabled
            realIpHeader
            trustedProxies
            trustRecursive
          }
          requestLimit {
            burstDelay
            burstFactor
            enabled
            global
            methods
            rate
          }
          wafPolicy {
            enabled
            inboundAnomalyScoreThreshold
            logLevel
            mode
            outboundAnomalyScoreThreshold
          }
        }
        invite {
          enabled
        }
        navigations {
          activeColor
          activeIcon
          color
          component
          description
          from
          icon
          id
          link
          parent
          private
          role
          section
          title
          visible
        }
        org {
          enabled
          maxMemberPerOrg
          maxOrgPerUser
        }
        owner {
          did
          pk
        }
        session {
          cacheTtl
          enableBlacklist
          salt
          ttl
          email {
            domainBlackList
            domainWhiteList
            enabled
            enableDomainBlackList
            enableDomainWhiteList
            requireUnique
            requireVerified
            trustOauthProviders
            trustedIssuers {
              id
              name
              pk
            }
          }
          phone {
            enabled
            enableRegionBlackList
            enableRegionWhiteList
            regionBlackList
            regionWhiteList
            requireUnique
            requireVerified
            trustedIssuers {
              id
              name
              pk
            }
          }
        }
        storeList {
          cdnUrl
          description
          id
          logoUrl
          maintainer
          name
          protected
          scope
          url
        }
        subService {
          domain
          enabled
          staticRoot
        }
        trustedFactories {
          factoryAddress
          holderDid
          issuerDid
          remark
          passport {
            role
            ttl
            ttlPolicy
          }
        }
        trustedPassports {
          issuerDid
          remark
          mappings {
            from {
              passport
            }
            to {
              role
              ttl
              ttlPolicy
            }
          }
        }
      }
      site {
        corsAllowedOrigins
        domain
        domainAliases
        id
        isProtected
        rules {
          id
          isProtected
          from {
            pathPrefix
            header {
              key
              type
              value
            }
          }
          to {
            componentId
            did
            interfaceName
            pageGroup
            port
            redirectCode
            type
            url
            response {
              body
              contentType
              status
            }
          }
        }
      }
      trustedFactories {
        factoryAddress
        holderDid
        issuerDid
        remark
        passport {
          role
          ttl
          ttlPolicy
        }
      }
      trustedPassports {
        issuerDid
        remark
        mappings {
          from {
            passport
          }
          to {
            role
            ttl
            ttlPolicy
          }
        }
      }
      vaults {
        approverDid
        approverPk
        approverSig
        at
        did
        pk
        sig
      }
    }
  }
}
```

### reloadBlocklet

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
mutation {
  reloadBlocklet {
    code
    blocklet {
      appDid
      appPid
      bundleSource
      createdAt
      deployedFrom
      dynamic
      enableDocker
      enableDockerNetwork
      enablePassportIssuance
      externalSk
      externalSkSource
      installedAt
      mode
      mountPoint
      pausedAt
      port
      ports
      source
      startedAt
      status
      stoppedAt
      structVersion
      updatedAt
      appRuntimeInfo {
        cpus
        cpuUsage
        memoryUsage
        pid
        port
        runningDocker
        uptime
      }
      children {
        bundleSource
        createdAt
        deployedFrom
        dynamic
        greenStatus
        installedAt
        mode
        mountPoint
        pausedAt
        port
        ports
        required
        source
        startedAt
        status
        stoppedAt
        appRuntimeInfo {
          cpus
          cpuUsage
          memoryUsage
          pid
          port
          runningDocker
          uptime
        }
        children {
          bundleSource
          createdAt
          deployedFrom
          dynamic
          greenStatus
          installedAt
          mode
          mountPoint
          pausedAt
          port
          ports
          required
          source
          startedAt
          status
          stoppedAt
          appRuntimeInfo {
            cpus
            cpuUsage
            memoryUsage
            pid
            port
            runningDocker
            uptime
          }
          children {
            bundleSource
            createdAt
            deployedFrom
            dynamic
            greenStatus
            installedAt
            mode
            mountPoint
            pausedAt
            port
            ports
            required
            source
            startedAt
            status
            stoppedAt
            appRuntimeInfo {
              cpus
              cpuUsage
              memoryUsage
              pid
              port
              runningDocker
              uptime
            }
            children {
              bundleSource
              createdAt
              deployedFrom
              dynamic
              greenStatus
              installedAt
              mode
              mountPoint
              pausedAt
              port
              ports
              required
              source
              startedAt
              status
              stoppedAt
              appRuntimeInfo {
                cpus
                cpuUsage
                memoryUsage
                pid
                port
                runningDocker
                uptime
              }
              children {
                bundleSource
                createdAt
                deployedFrom
                dynamic
                greenStatus
                installedAt
                mode
                mountPoint
                pausedAt
                port
                ports
                required
                source
                startedAt
                status
                stoppedAt
              }
              configs {
                custom
                description
                key
                required
                secure
                shared
                validation
                value
              }
              dependents {
                id
                required
              }
              diskInfo {
                app
                blocklets
                cache
                data
                log
              }
              engine {
                available
                description
                displayName
                logo
                name
                version
                visible
              }
              environments {
                custom
                description
                key
                required
                secure
                shared
                validation
                value
              }
              meta {
                bundleDid
                bundleName
                community
                description
                did
                documentation
                engine
                group
                homepage
                keywords
                lastPublishedAt
                logo
                main
                name
                navigation
                nftFactory
                path
                resources
                screenshots
                support
                title
                version
              }
              runtimeInfo {
                cpus
                cpuUsage
                memoryUsage
                pid
                port
                runningDocker
                uptime
              }
            }
            configs {
              custom
              description
              key
              required
              secure
              shared
              validation
              value
            }
            dependents {
              id
              required
            }
            diskInfo {
              app
              blocklets
              cache
              data
              log
            }
            engine {
              available
              description
              displayName
              logo
              name
              version
              visible
            }
            environments {
              custom
              description
              key
              required
              secure
              shared
              validation
              value
            }
            meta {
              bundleDid
              bundleName
              community
              description
              did
              documentation
              engine
              group
              homepage
              keywords
              lastPublishedAt
              logo
              main
              name
              navigation
              nftFactory
              path
              resources
              screenshots
              support
              title
              version
              author {
                email
                name
                url
              }
              capabilities {
                clusterMode
                component
                didSpace
                navigation
                resourceExportApi
              }
              components {
                mountPoint
                name
                required
              }
              contributors {
                email
                name
                url
              }
              dist {
                integrity
                tarball
              }
              docker {
                image
                installNodeModules
                runBaseScript
                shell
              }
              environments {
                default
                description
                name
                required
                secure
                shared
                validation
              }
              events {
                description
                type
              }
              interfaces {
                cacheable
                name
                pageGroups
                path
                port
                prefix
                protocol
                type
              }
              maintainers {
                email
                name
                url
              }
              owner {
                avatar
                did
                email
                fullName
              }
              repository {
                type
                url
              }
              requirements {
                aigne
                cpu
                os
                server
              }
              resource {
                exportApi
              }
              stats {
                downloads
                purchases
                star
              }
            }
            runtimeInfo {
              cpus
              cpuUsage
              memoryUsage
              pid
              port
              runningDocker
              uptime
            }
          }
          configs {
            custom
            description
            key
            required
            secure
            shared
            validation
            value
          }
          dependents {
            id
            required
          }
          diskInfo {
            app
            blocklets
            cache
            data
            log
          }
          engine {
            available
            description
            displayName
            logo
            name
            version
            visible
          }
          environments {
            custom
            description
            key
            required
            secure
            shared
            validation
            value
          }
          meta {
            bundleDid
            bundleName
            community
            description
            did
            documentation
            engine
            group
            homepage
            keywords
            lastPublishedAt
            logo
            main
            name
            navigation
            nftFactory
            path
            resources
            screenshots
            support
            title
            version
            author {
              email
              name
              url
            }
            capabilities {
              clusterMode
              component
              didSpace
              navigation
              resourceExportApi
            }
            components {
              mountPoint
              name
              required
            }
            contributors {
              email
              name
              url
            }
            dist {
              integrity
              tarball
            }
            docker {
              image
              installNodeModules
              runBaseScript
              shell
            }
            environments {
              default
              description
              name
              required
              secure
              shared
              validation
            }
            events {
              description
              type
            }
            interfaces {
              cacheable
              name
              pageGroups
              path
              port
              prefix
              protocol
              type
              services {
                config
                name
              }
            }
            maintainers {
              email
              name
              url
            }
            owner {
              avatar
              did
              email
              fullName
            }
            payment {
              price {
                address
                symbol
                value
              }
              share {
                address
                name
                value
              }
            }
            repository {
              type
              url
            }
            requirements {
              aigne
              cpu
              os
              server
              fuels {
                address
                endpoint
                reason
                value
              }
            }
            resource {
              exportApi
              bundles {
                did
                public
                type
              }
              types {
                description
                type
              }
            }
            stats {
              downloads
              purchases
              star
            }
          }
          runtimeInfo {
            cpus
            cpuUsage
            memoryUsage
            pid
            port
            runningDocker
            uptime
          }
        }
        configs {
          custom
          description
          key
          required
          secure
          shared
          validation
          value
        }
        dependents {
          id
          required
        }
        diskInfo {
          app
          blocklets
          cache
          data
          log
        }
        engine {
          available
          description
          displayName
          logo
          name
          version
          visible
        }
        environments {
          custom
          description
          key
          required
          secure
          shared
          validation
          value
        }
        meta {
          bundleDid
          bundleName
          community
          description
          did
          documentation
          engine
          group
          homepage
          keywords
          lastPublishedAt
          logo
          main
          name
          navigation
          nftFactory
          path
          resources
          screenshots
          support
          title
          version
          author {
            email
            name
            url
          }
          capabilities {
            clusterMode
            component
            didSpace
            navigation
            resourceExportApi
          }
          components {
            mountPoint
            name
            required
          }
          contributors {
            email
            name
            url
          }
          dist {
            integrity
            tarball
          }
          docker {
            image
            installNodeModules
            runBaseScript
            shell
          }
          environments {
            default
            description
            name
            required
            secure
            shared
            validation
          }
          events {
            description
            type
          }
          interfaces {
            cacheable
            name
            pageGroups
            path
            port
            prefix
            protocol
            type
            services {
              config
              name
            }
          }
          maintainers {
            email
            name
            url
          }
          owner {
            avatar
            did
            email
            fullName
          }
          payment {
            price {
              address
              symbol
              value
            }
            share {
              address
              name
              value
            }
          }
          repository {
            type
            url
          }
          requirements {
            aigne
            cpu
            os
            server
            fuels {
              address
              endpoint
              reason
              value
            }
          }
          resource {
            exportApi
            bundles {
              did
              public
              type
            }
            types {
              description
              type
            }
          }
          stats {
            downloads
            purchases
            star
          }
        }
        runtimeInfo {
          cpus
          cpuUsage
          memoryUsage
          pid
          port
          runningDocker
          uptime
        }
      }
      configs {
        custom
        description
        key
        required
        secure
        shared
        validation
        value
      }
      controller {
        chainHost
        consumedAt
        expireDate
        id
        launcherSessionId
        launcherUrl
        nftId
        nftOwner
        ownerDid
        status {
          reason
          value
        }
      }
      diskInfo {
        app
        blocklets
        cache
        data
        log
      }
      engine {
        available
        description
        displayName
        logo
        name
        version
        visible
      }
      environments {
        custom
        description
        key
        required
        secure
        shared
        validation
        value
      }
      meta {
        bundleDid
        bundleName
        community
        description
        did
        documentation
        engine
        group
        homepage
        keywords
        lastPublishedAt
        logo
        main
        name
        navigation
        nftFactory
        path
        resources
        screenshots
        support
        title
        version
        author {
          email
          name
          url
        }
        capabilities {
          clusterMode
          component
          didSpace
          navigation
          resourceExportApi
        }
        components {
          mountPoint
          name
          required
        }
        contributors {
          email
          name
          url
        }
        dist {
          integrity
          tarball
        }
        docker {
          image
          installNodeModules
          runBaseScript
          shell
        }
        environments {
          default
          description
          name
          required
          secure
          shared
          validation
        }
        events {
          description
          type
        }
        interfaces {
          cacheable
          name
          pageGroups
          path
          port
          prefix
          protocol
          type
          services {
            config
            name
          }
        }
        maintainers {
          email
          name
          url
        }
        owner {
          avatar
          did
          email
          fullName
        }
        payment {
          price {
            address
            symbol
            value
          }
          share {
            address
            name
            value
          }
        }
        repository {
          type
          url
        }
        requirements {
          aigne
          cpu
          os
          server
          fuels {
            address
            endpoint
            reason
            value
          }
        }
        resource {
          exportApi
          bundles {
            did
            public
            type
          }
          types {
            description
            type
          }
        }
        stats {
          downloads
          purchases
          star
        }
      }
      migratedFrom {
        appDid
        appSk
        at
      }
      optionalComponents {
        bundleSource
        logoUrl
        dependencies {
          mountPoint
          parentDid
          parentName
          parentTitle
          required
        }
        meta {
          bundleDid
          bundleName
          community
          description
          did
          documentation
          engine
          group
          homepage
          keywords
          lastPublishedAt
          logo
          main
          name
          navigation
          nftFactory
          path
          resources
          screenshots
          support
          title
          version
          author {
            email
            name
            url
          }
          capabilities {
            clusterMode
            component
            didSpace
            navigation
            resourceExportApi
          }
          components {
            mountPoint
            name
            required
          }
          contributors {
            email
            name
            url
          }
          dist {
            integrity
            tarball
          }
          docker {
            image
            installNodeModules
            runBaseScript
            shell
          }
          environments {
            default
            description
            name
            required
            secure
            shared
            validation
          }
          events {
            description
            type
          }
          interfaces {
            cacheable
            name
            pageGroups
            path
            port
            prefix
            protocol
            type
            services {
              config
              name
            }
          }
          maintainers {
            email
            name
            url
          }
          owner {
            avatar
            did
            email
            fullName
          }
          payment {
            price {
              address
              symbol
              value
            }
            share {
              address
              name
              value
            }
          }
          repository {
            type
            url
          }
          requirements {
            aigne
            cpu
            os
            server
            fuels {
              address
              endpoint
              reason
              value
            }
          }
          resource {
            exportApi
            bundles {
              did
              public
              type
            }
            types {
              description
              type
            }
          }
          stats {
            downloads
            purchases
            star
          }
        }
      }
      runtimeInfo {
        cpus
        cpuUsage
        memoryUsage
        pid
        port
        runningDocker
        uptime
      }
      settings {
        actionConfig
        authentication
        didConnect
        enablePassportIssuance
        enableSessionHardening
        initialized
        notification
        oauth
        publicToStore
        theme
        whoCanAccess
        aigne {
          accessKeyId
          key
          model
          provider
          secretAccessKey
          url
          validationResult
        }
        autoBackup {
          enabled
        }
        autoCheckUpdate {
          enabled
        }
        children {
          deletedAt
          deployedFrom
          mountPoint
          status
          meta {
            bundleDid
            bundleName
            description
            did
            name
            title
            version
          }
        }
        endpointList {
          appDescription
          appName
          endpoint
          id
          protected
          scope
          url
        }
        federated {
          config {
            appId
            appPid
            autoLogin
            delegation
            isMaster
          }
          sites {
            aliasDid
            aliasDomain
            appDescription
            appId
            appliedAt
            appLogo
            appLogoRect
            appName
            appPid
            appUrl
            did
            isMaster
            pk
            serverId
            serverVersion
            status
            version
          }
        }
        gateway {
          cacheEnabled
          blockPolicy {
            blacklist
            enabled
            autoBlocking {
              blockDuration
              enabled
              statusCodes
              windowQuota
              windowSize
            }
          }
          proxyPolicy {
            enabled
            realIpHeader
            trustedProxies
            trustRecursive
          }
          requestLimit {
            burstDelay
            burstFactor
            enabled
            global
            methods
            rate
          }
          wafPolicy {
            enabled
            inboundAnomalyScoreThreshold
            logLevel
            mode
            outboundAnomalyScoreThreshold
          }
        }
        invite {
          enabled
        }
        navigations {
          activeColor
          activeIcon
          color
          component
          description
          from
          icon
          id
          link
          parent
          private
          role
          section
          title
          visible
        }
        org {
          enabled
          maxMemberPerOrg
          maxOrgPerUser
        }
        owner {
          did
          pk
        }
        session {
          cacheTtl
          enableBlacklist
          salt
          ttl
          email {
            domainBlackList
            domainWhiteList
            enabled
            enableDomainBlackList
            enableDomainWhiteList
            requireUnique
            requireVerified
            trustOauthProviders
            trustedIssuers {
              id
              name
              pk
            }
          }
          phone {
            enabled
            enableRegionBlackList
            enableRegionWhiteList
            regionBlackList
            regionWhiteList
            requireUnique
            requireVerified
            trustedIssuers {
              id
              name
              pk
            }
          }
        }
        storeList {
          cdnUrl
          description
          id
          logoUrl
          maintainer
          name
          protected
          scope
          url
        }
        subService {
          domain
          enabled
          staticRoot
        }
        trustedFactories {
          factoryAddress
          holderDid
          issuerDid
          remark
          passport {
            role
            ttl
            ttlPolicy
          }
        }
        trustedPassports {
          issuerDid
          remark
          mappings {
            from {
              passport
            }
            to {
              role
              ttl
              ttlPolicy
            }
          }
        }
      }
      site {
        corsAllowedOrigins
        domain
        domainAliases
        id
        isProtected
        rules {
          id
          isProtected
          from {
            pathPrefix
            header {
              key
              type
              value
            }
          }
          to {
            componentId
            did
            interfaceName
            pageGroup
            port
            redirectCode
            type
            url
            response {
              body
              contentType
              status
            }
          }
        }
      }
      trustedFactories {
        factoryAddress
        holderDid
        issuerDid
        remark
        passport {
          role
          ttl
          ttlPolicy
        }
      }
      trustedPassports {
        issuerDid
        remark
        mappings {
          from {
            passport
          }
          to {
            role
            ttl
            ttlPolicy
          }
        }
      }
      vaults {
        approverDid
        approverPk
        approverSig
        at
        did
        pk
        sig
      }
    }
  }
}
```

### restartBlocklet

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
mutation {
  restartBlocklet {
    code
    blocklet {
      appDid
      appPid
      bundleSource
      createdAt
      deployedFrom
      dynamic
      enableDocker
      enableDockerNetwork
      enablePassportIssuance
      externalSk
      externalSkSource
      installedAt
      mode
      mountPoint
      pausedAt
      port
      ports
      source
      startedAt
      status
      stoppedAt
      structVersion
      updatedAt
      appRuntimeInfo {
        cpus
        cpuUsage
        memoryUsage
        pid
        port
        runningDocker
        uptime
      }
      children {
        bundleSource
        createdAt
        deployedFrom
        dynamic
        greenStatus
        installedAt
        mode
        mountPoint
        pausedAt
        port
        ports
        required
        source
        startedAt
        status
        stoppedAt
        appRuntimeInfo {
          cpus
          cpuUsage
          memoryUsage
          pid
          port
          runningDocker
          uptime
        }
        children {
          bundleSource
          createdAt
          deployedFrom
          dynamic
          greenStatus
          installedAt
          mode
          mountPoint
          pausedAt
          port
          ports
          required
          source
          startedAt
          status
          stoppedAt
          appRuntimeInfo {
            cpus
            cpuUsage
            memoryUsage
            pid
            port
            runningDocker
            uptime
          }
          children {
            bundleSource
            createdAt
            deployedFrom
            dynamic
            greenStatus
            installedAt
            mode
            mountPoint
            pausedAt
            port
            ports
            required
            source
            startedAt
            status
            stoppedAt
            appRuntimeInfo {
              cpus
              cpuUsage
              memoryUsage
              pid
              port
              runningDocker
              uptime
            }
            children {
              bundleSource
              createdAt
              deployedFrom
              dynamic
              greenStatus
              installedAt
              mode
              mountPoint
              pausedAt
              port
              ports
              required
              source
              startedAt
              status
              stoppedAt
              appRuntimeInfo {
                cpus
                cpuUsage
                memoryUsage
                pid
                port
                runningDocker
                uptime
              }
              children {
                bundleSource
                createdAt
                deployedFrom
                dynamic
                greenStatus
                installedAt
                mode
                mountPoint
                pausedAt
                port
                ports
                required
                source
                startedAt
                status
                stoppedAt
              }
              configs {
                custom
                description
                key
                required
                secure
                shared
                validation
                value
              }
              dependents {
                id
                required
              }
              diskInfo {
                app
                blocklets
                cache
                data
                log
              }
              engine {
                available
                description
                displayName
                logo
                name
                version
                visible
              }
              environments {
                custom
                description
                key
                required
                secure
                shared
                validation
                value
              }
              meta {
                bundleDid
                bundleName
                community
                description
                did
                documentation
                engine
                group
                homepage
                keywords
                lastPublishedAt
                logo
                main
                name
                navigation
                nftFactory
                path
                resources
                screenshots
                support
                title
                version
              }
              runtimeInfo {
                cpus
                cpuUsage
                memoryUsage
                pid
                port
                runningDocker
                uptime
              }
            }
            configs {
              custom
              description
              key
              required
              secure
              shared
              validation
              value
            }
            dependents {
              id
              required
            }
            diskInfo {
              app
              blocklets
              cache
              data
              log
            }
            engine {
              available
              description
              displayName
              logo
              name
              version
              visible
            }
            environments {
              custom
              description
              key
              required
              secure
              shared
              validation
              value
            }
            meta {
              bundleDid
              bundleName
              community
              description
              did
              documentation
              engine
              group
              homepage
              keywords
              lastPublishedAt
              logo
              main
              name
              navigation
              nftFactory
              path
              resources
              screenshots
              support
              title
              version
              author {
                email
                name
                url
              }
              capabilities {
                clusterMode
                component
                didSpace
                navigation
                resourceExportApi
              }
              components {
                mountPoint
                name
                required
              }
              contributors {
                email
                name
                url
              }
              dist {
                integrity
                tarball
              }
              docker {
                image
                installNodeModules
                runBaseScript
                shell
              }
              environments {
                default
                description
                name
                required
                secure
                shared
                validation
              }
              events {
                description
                type
              }
              interfaces {
                cacheable
                name
                pageGroups
                path
                port
                prefix
                protocol
                type
              }
              maintainers {
                email
                name
                url
              }
              owner {
                avatar
                did
                email
                fullName
              }
              repository {
                type
                url
              }
              requirements {
                aigne
                cpu
                os
                server
              }
              resource {
                exportApi
              }
              stats {
                downloads
                purchases
                star
              }
            }
            runtimeInfo {
              cpus
              cpuUsage
              memoryUsage
              pid
              port
              runningDocker
              uptime
            }
          }
          configs {
            custom
            description
            key
            required
            secure
            shared
            validation
            value
          }
          dependents {
            id
            required
          }
          diskInfo {
            app
            blocklets
            cache
            data
            log
          }
          engine {
            available
            description
            displayName
            logo
            name
            version
            visible
          }
          environments {
            custom
            description
            key
            required
            secure
            shared
            validation
            value
          }
          meta {
            bundleDid
            bundleName
            community
            description
            did
            documentation
            engine
            group
            homepage
            keywords
            lastPublishedAt
            logo
            main
            name
            navigation
            nftFactory
            path
            resources
            screenshots
            support
            title
            version
            author {
              email
              name
              url
            }
            capabilities {
              clusterMode
              component
              didSpace
              navigation
              resourceExportApi
            }
            components {
              mountPoint
              name
              required
            }
            contributors {
              email
              name
              url
            }
            dist {
              integrity
              tarball
            }
            docker {
              image
              installNodeModules
              runBaseScript
              shell
            }
            environments {
              default
              description
              name
              required
              secure
              shared
              validation
            }
            events {
              description
              type
            }
            interfaces {
              cacheable
              name
              pageGroups
              path
              port
              prefix
              protocol
              type
              services {
                config
                name
              }
            }
            maintainers {
              email
              name
              url
            }
            owner {
              avatar
              did
              email
              fullName
            }
            payment {
              price {
                address
                symbol
                value
              }
              share {
                address
                name
                value
              }
            }
            repository {
              type
              url
            }
            requirements {
              aigne
              cpu
              os
              server
              fuels {
                address
                endpoint
                reason
                value
              }
            }
            resource {
              exportApi
              bundles {
                did
                public
                type
              }
              types {
                description
                type
              }
            }
            stats {
              downloads
              purchases
              star
            }
          }
          runtimeInfo {
            cpus
            cpuUsage
            memoryUsage
            pid
            port
            runningDocker
            uptime
          }
        }
        configs {
          custom
          description
          key
          required
          secure
          shared
          validation
          value
        }
        dependents {
          id
          required
        }
        diskInfo {
          app
          blocklets
          cache
          data
          log
        }
        engine {
          available
          description
          displayName
          logo
          name
          version
          visible
        }
        environments {
          custom
          description
          key
          required
          secure
          shared
          validation
          value
        }
        meta {
          bundleDid
          bundleName
          community
          description
          did
          documentation
          engine
          group
          homepage
          keywords
          lastPublishedAt
          logo
          main
          name
          navigation
          nftFactory
          path
          resources
          screenshots
          support
          title
          version
          author {
            email
            name
            url
          }
          capabilities {
            clusterMode
            component
            didSpace
            navigation
            resourceExportApi
          }
          components {
            mountPoint
            name
            required
          }
          contributors {
            email
            name
            url
          }
          dist {
            integrity
            tarball
          }
          docker {
            image
            installNodeModules
            runBaseScript
            shell
          }
          environments {
            default
            description
            name
            required
            secure
            shared
            validation
          }
          events {
            description
            type
          }
          interfaces {
            cacheable
            name
            pageGroups
            path
            port
            prefix
            protocol
            type
            services {
              config
              name
            }
          }
          maintainers {
            email
            name
            url
          }
          owner {
            avatar
            did
            email
            fullName
          }
          payment {
            price {
              address
              symbol
              value
            }
            share {
              address
              name
              value
            }
          }
          repository {
            type
            url
          }
          requirements {
            aigne
            cpu
            os
            server
            fuels {
              address
              endpoint
              reason
              value
            }
          }
          resource {
            exportApi
            bundles {
              did
              public
              type
            }
            types {
              description
              type
            }
          }
          stats {
            downloads
            purchases
            star
          }
        }
        runtimeInfo {
          cpus
          cpuUsage
          memoryUsage
          pid
          port
          runningDocker
          uptime
        }
      }
      configs {
        custom
        description
        key
        required
        secure
        shared
        validation
        value
      }
      controller {
        chainHost
        consumedAt
        expireDate
        id
        launcherSessionId
        launcherUrl
        nftId
        nftOwner
        ownerDid
        status {
          reason
          value
        }
      }
      diskInfo {
        app
        blocklets
        cache
        data
        log
      }
      engine {
        available
        description
        displayName
        logo
        name
        version
        visible
      }
      environments {
        custom
        description
        key
        required
        secure
        shared
        validation
        value
      }
      meta {
        bundleDid
        bundleName
        community
        description
        did
        documentation
        engine
        group
        homepage
        keywords
        lastPublishedAt
        logo
        main
        name
        navigation
        nftFactory
        path
        resources
        screenshots
        support
        title
        version
        author {
          email
          name
          url
        }
        capabilities {
          clusterMode
          component
          didSpace
          navigation
          resourceExportApi
        }
        components {
          mountPoint
          name
          required
        }
        contributors {
          email
          name
          url
        }
        dist {
          integrity
          tarball
        }
        docker {
          image
          installNodeModules
          runBaseScript
          shell
        }
        environments {
          default
          description
          name
          required
          secure
          shared
          validation
        }
        events {
          description
          type
        }
        interfaces {
          cacheable
          name
          pageGroups
          path
          port
          prefix
          protocol
          type
          services {
            config
            name
          }
        }
        maintainers {
          email
          name
          url
        }
        owner {
          avatar
          did
          email
          fullName
        }
        payment {
          price {
            address
            symbol
            value
          }
          share {
            address
            name
            value
          }
        }
        repository {
          type
          url
        }
        requirements {
          aigne
          cpu
          os
          server
          fuels {
            address
            endpoint
            reason
            value
          }
        }
        resource {
          exportApi
          bundles {
            did
            public
            type
          }
          types {
            description
            type
          }
        }
        stats {
          downloads
          purchases
          star
        }
      }
      migratedFrom {
        appDid
        appSk
        at
      }
      optionalComponents {
        bundleSource
        logoUrl
        dependencies {
          mountPoint
          parentDid
          parentName
          parentTitle
          required
        }
        meta {
          bundleDid
          bundleName
          community
          description
          did
          documentation
          engine
          group
          homepage
          keywords
          lastPublishedAt
          logo
          main
          name
          navigation
          nftFactory
          path
          resources
          screenshots
          support
          title
          version
          author {
            email
            name
            url
          }
          capabilities {
            clusterMode
            component
            didSpace
            navigation
            resourceExportApi
          }
          components {
            mountPoint
            name
            required
          }
          contributors {
            email
            name
            url
          }
          dist {
            integrity
            tarball
          }
          docker {
            image
            installNodeModules
            runBaseScript
            shell
          }
          environments {
            default
            description
            name
            required
            secure
            shared
            validation
          }
          events {
            description
            type
          }
          interfaces {
            cacheable
            name
            pageGroups
            path
            port
            prefix
            protocol
            type
            services {
              config
              name
            }
          }
          maintainers {
            email
            name
            url
          }
          owner {
            avatar
            did
            email
            fullName
          }
          payment {
            price {
              address
              symbol
              value
            }
            share {
              address
              name
              value
            }
          }
          repository {
            type
            url
          }
          requirements {
            aigne
            cpu
            os
            server
            fuels {
              address
              endpoint
              reason
              value
            }
          }
          resource {
            exportApi
            bundles {
              did
              public
              type
            }
            types {
              description
              type
            }
          }
          stats {
            downloads
            purchases
            star
          }
        }
      }
      runtimeInfo {
        cpus
        cpuUsage
        memoryUsage
        pid
        port
        runningDocker
        uptime
      }
      settings {
        actionConfig
        authentication
        didConnect
        enablePassportIssuance
        enableSessionHardening
        initialized
        notification
        oauth
        publicToStore
        theme
        whoCanAccess
        aigne {
          accessKeyId
          key
          model
          provider
          secretAccessKey
          url
          validationResult
        }
        autoBackup {
          enabled
        }
        autoCheckUpdate {
          enabled
        }
        children {
          deletedAt
          deployedFrom
          mountPoint
          status
          meta {
            bundleDid
            bundleName
            description
            did
            name
            title
            version
          }
        }
        endpointList {
          appDescription
          appName
          endpoint
          id
          protected
          scope
          url
        }
        federated {
          config {
            appId
            appPid
            autoLogin
            delegation
            isMaster
          }
          sites {
            aliasDid
            aliasDomain
            appDescription
            appId
            appliedAt
            appLogo
            appLogoRect
            appName
            appPid
            appUrl
            did
            isMaster
            pk
            serverId
            serverVersion
            status
            version
          }
        }
        gateway {
          cacheEnabled
          blockPolicy {
            blacklist
            enabled
            autoBlocking {
              blockDuration
              enabled
              statusCodes
              windowQuota
              windowSize
            }
          }
          proxyPolicy {
            enabled
            realIpHeader
            trustedProxies
            trustRecursive
          }
          requestLimit {
            burstDelay
            burstFactor
            enabled
            global
            methods
            rate
          }
          wafPolicy {
            enabled
            inboundAnomalyScoreThreshold
            logLevel
            mode
            outboundAnomalyScoreThreshold
          }
        }
        invite {
          enabled
        }
        navigations {
          activeColor
          activeIcon
          color
          component
          description
          from
          icon
          id
          link
          parent
          private
          role
          section
          title
          visible
        }
        org {
          enabled
          maxMemberPerOrg
          maxOrgPerUser
        }
        owner {
          did
          pk
        }
        session {
          cacheTtl
          enableBlacklist
          salt
          ttl
          email {
            domainBlackList
            domainWhiteList
            enabled
            enableDomainBlackList
            enableDomainWhiteList
            requireUnique
            requireVerified
            trustOauthProviders
            trustedIssuers {
              id
              name
              pk
            }
          }
          phone {
            enabled
            enableRegionBlackList
            enableRegionWhiteList
            regionBlackList
            regionWhiteList
            requireUnique
            requireVerified
            trustedIssuers {
              id
              name
              pk
            }
          }
        }
        storeList {
          cdnUrl
          description
          id
          logoUrl
          maintainer
          name
          protected
          scope
          url
        }
        subService {
          domain
          enabled
          staticRoot
        }
        trustedFactories {
          factoryAddress
          holderDid
          issuerDid
          remark
          passport {
            role
            ttl
            ttlPolicy
          }
        }
        trustedPassports {
          issuerDid
          remark
          mappings {
            from {
              passport
            }
            to {
              role
              ttl
              ttlPolicy
            }
          }
        }
      }
      site {
        corsAllowedOrigins
        domain
        domainAliases
        id
        isProtected
        rules {
          id
          isProtected
          from {
            pathPrefix
            header {
              key
              type
              value
            }
          }
          to {
            componentId
            did
            interfaceName
            pageGroup
            port
            redirectCode
            type
            url
            response {
              body
              contentType
              status
            }
          }
        }
      }
      trustedFactories {
        factoryAddress
        holderDid
        issuerDid
        remark
        passport {
          role
          ttl
          ttlPolicy
        }
      }
      trustedPassports {
        issuerDid
        remark
        mappings {
          from {
            passport
          }
          to {
            role
            ttl
            ttlPolicy
          }
        }
      }
      vaults {
        approverDid
        approverPk
        approverSig
        at
        did
        pk
        sig
      }
    }
  }
}
```

### deleteBlocklet

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
mutation {
  deleteBlocklet {
    code
    blocklet {
      appDid
      appPid
      bundleSource
      createdAt
      deployedFrom
      dynamic
      enableDocker
      enableDockerNetwork
      enablePassportIssuance
      externalSk
      externalSkSource
      installedAt
      mode
      mountPoint
      pausedAt
      port
      ports
      source
      startedAt
      status
      stoppedAt
      structVersion
      updatedAt
      appRuntimeInfo {
        cpus
        cpuUsage
        memoryUsage
        pid
        port
        runningDocker
        uptime
      }
      children {
        bundleSource
        createdAt
        deployedFrom
        dynamic
        greenStatus
        installedAt
        mode
        mountPoint
        pausedAt
        port
        ports
        required
        source
        startedAt
        status
        stoppedAt
        appRuntimeInfo {
          cpus
          cpuUsage
          memoryUsage
          pid
          port
          runningDocker
          uptime
        }
        children {
          bundleSource
          createdAt
          deployedFrom
          dynamic
          greenStatus
          installedAt
          mode
          mountPoint
          pausedAt
          port
          ports
          required
          source
          startedAt
          status
          stoppedAt
          appRuntimeInfo {
            cpus
            cpuUsage
            memoryUsage
            pid
            port
            runningDocker
            uptime
          }
          children {
            bundleSource
            createdAt
            deployedFrom
            dynamic
            greenStatus
            installedAt
            mode
            mountPoint
            pausedAt
            port
            ports
            required
            source
            startedAt
            status
            stoppedAt
            appRuntimeInfo {
              cpus
              cpuUsage
              memoryUsage
              pid
              port
              runningDocker
              uptime
            }
            children {
              bundleSource
              createdAt
              deployedFrom
              dynamic
              greenStatus
              installedAt
              mode
              mountPoint
              pausedAt
              port
              ports
              required
              source
              startedAt
              status
              stoppedAt
              appRuntimeInfo {
                cpus
                cpuUsage
                memoryUsage
                pid
                port
                runningDocker
                uptime
              }
              children {
                bundleSource
                createdAt
                deployedFrom
                dynamic
                greenStatus
                installedAt
                mode
                mountPoint
                pausedAt
                port
                ports
                required
                source
                startedAt
                status
                stoppedAt
              }
              configs {
                custom
                description
                key
                required
                secure
                shared
                validation
                value
              }
              dependents {
                id
                required
              }
              diskInfo {
                app
                blocklets
                cache
                data
                log
              }
              engine {
                available
                description
                displayName
                logo
                name
                version
                visible
              }
              environments {
                custom
                description
                key
                required
                secure
                shared
                validation
                value
              }
              meta {
                bundleDid
                bundleName
                community
                description
                did
                documentation
                engine
                group
                homepage
                keywords
                lastPublishedAt
                logo
                main
                name
                navigation
                nftFactory
                path
                resources
                screenshots
                support
                title
                version
              }
              runtimeInfo {
                cpus
                cpuUsage
                memoryUsage
                pid
                port
                runningDocker
                uptime
              }
            }
            configs {
              custom
              description
              key
              required
              secure
              shared
              validation
              value
            }
            dependents {
              id
              required
            }
            diskInfo {
              app
              blocklets
              cache
              data
              log
            }
            engine {
              available
              description
              displayName
              logo
              name
              version
              visible
            }
            environments {
              custom
              description
              key
              required
              secure
              shared
              validation
              value
            }
            meta {
              bundleDid
              bundleName
              community
              description
              did
              documentation
              engine
              group
              homepage
              keywords
              lastPublishedAt
              logo
              main
              name
              navigation
              nftFactory
              path
              resources
              screenshots
              support
              title
              version
              author {
                email
                name
                url
              }
              capabilities {
                clusterMode
                component
                didSpace
                navigation
                resourceExportApi
              }
              components {
                mountPoint
                name
                required
              }
              contributors {
                email
                name
                url
              }
              dist {
                integrity
                tarball
              }
              docker {
                image
                installNodeModules
                runBaseScript
                shell
              }
              environments {
                default
                description
                name
                required
                secure
                shared
                validation
              }
              events {
                description
                type
              }
              interfaces {
                cacheable
                name
                pageGroups
                path
                port
                prefix
                protocol
                type
              }
              maintainers {
                email
                name
                url
              }
              owner {
                avatar
                did
                email
                fullName
              }
              repository {
                type
                url
              }
              requirements {
                aigne
                cpu
                os
                server
              }
              resource {
                exportApi
              }
              stats {
                downloads
                purchases
                star
              }
            }
            runtimeInfo {
              cpus
              cpuUsage
              memoryUsage
              pid
              port
              runningDocker
              uptime
            }
          }
          configs {
            custom
            description
            key
            required
            secure
            shared
            validation
            value
          }
          dependents {
            id
            required
          }
          diskInfo {
            app
            blocklets
            cache
            data
            log
          }
          engine {
            available
            description
            displayName
            logo
            name
            version
            visible
          }
          environments {
            custom
            description
            key
            required
            secure
            shared
            validation
            value
          }
          meta {
            bundleDid
            bundleName
            community
            description
            did
            documentation
            engine
            group
            homepage
            keywords
            lastPublishedAt
            logo
            main
            name
            navigation
            nftFactory
            path
            resources
            screenshots
            support
            title
            version
            author {
              email
              name
              url
            }
            capabilities {
              clusterMode
              component
              didSpace
              navigation
              resourceExportApi
            }
            components {
              mountPoint
              name
              required
            }
            contributors {
              email
              name
              url
            }
            dist {
              integrity
              tarball
            }
            docker {
              image
              installNodeModules
              runBaseScript
              shell
            }
            environments {
              default
              description
              name
              required
              secure
              shared
              validation
            }
            events {
              description
              type
            }
            interfaces {
              cacheable
              name
              pageGroups
              path
              port
              prefix
              protocol
              type
              services {
                config
                name
              }
            }
            maintainers {
              email
              name
              url
            }
            owner {
              avatar
              did
              email
              fullName
            }
            payment {
              price {
                address
                symbol
                value
              }
              share {
                address
                name
                value
              }
            }
            repository {
              type
              url
            }
            requirements {
              aigne
              cpu
              os
              server
              fuels {
                address
                endpoint
                reason
                value
              }
            }
            resource {
              exportApi
              bundles {
                did
                public
                type
              }
              types {
                description
                type
              }
            }
            stats {
              downloads
              purchases
              star
            }
          }
          runtimeInfo {
            cpus
            cpuUsage
            memoryUsage
            pid
            port
            runningDocker
            uptime
          }
        }
        configs {
          custom
          description
          key
          required
          secure
          shared
          validation
          value
        }
        dependents {
          id
          required
        }
        diskInfo {
          app
          blocklets
          cache
          data
          log
        }
        engine {
          available
          description
          displayName
          logo
          name
          version
          visible
        }
        environments {
          custom
          description
          key
          required
          secure
          shared
          validation
          value
        }
        meta {
          bundleDid
          bundleName
          community
          description
          did
          documentation
          engine
          group
          homepage
          keywords
          lastPublishedAt
          logo
          main
          name
          navigation
          nftFactory
          path
          resources
          screenshots
          support
          title
          version
          author {
            email
            name
            url
          }
          capabilities {
            clusterMode
            component
            didSpace
            navigation
            resourceExportApi
          }
          components {
            mountPoint
            name
            required
          }
          contributors {
            email
            name
            url
          }
          dist {
            integrity
            tarball
          }
          docker {
            image
            installNodeModules
            runBaseScript
            shell
          }
          environments {
            default
            description
            name
            required
            secure
            shared
            validation
          }
          events {
            description
            type
          }
          interfaces {
            cacheable
            name
            pageGroups
            path
            port
            prefix
            protocol
            type
            services {
              config
              name
            }
          }
          maintainers {
            email
            name
            url
          }
          owner {
            avatar
            did
            email
            fullName
          }
          payment {
            price {
              address
              symbol
              value
            }
            share {
              address
              name
              value
            }
          }
          repository {
            type
            url
          }
          requirements {
            aigne
            cpu
            os
            server
            fuels {
              address
              endpoint
              reason
              value
            }
          }
          resource {
            exportApi
            bundles {
              did
              public
              type
            }
            types {
              description
              type
            }
          }
          stats {
            downloads
            purchases
            star
          }
        }
        runtimeInfo {
          cpus
          cpuUsage
          memoryUsage
          pid
          port
          runningDocker
          uptime
        }
      }
      configs {
        custom
        description
        key
        required
        secure
        shared
        validation
        value
      }
      controller {
        chainHost
        consumedAt
        expireDate
        id
        launcherSessionId
        launcherUrl
        nftId
        nftOwner
        ownerDid
        status {
          reason
          value
        }
      }
      diskInfo {
        app
        blocklets
        cache
        data
        log
      }
      engine {
        available
        description
        displayName
        logo
        name
        version
        visible
      }
      environments {
        custom
        description
        key
        required
        secure
        shared
        validation
        value
      }
      meta {
        bundleDid
        bundleName
        community
        description
        did
        documentation
        engine
        group
        homepage
        keywords
        lastPublishedAt
        logo
        main
        name
        navigation
        nftFactory
        path
        resources
        screenshots
        support
        title
        version
        author {
          email
          name
          url
        }
        capabilities {
          clusterMode
          component
          didSpace
          navigation
          resourceExportApi
        }
        components {
          mountPoint
          name
          required
        }
        contributors {
          email
          name
          url
        }
        dist {
          integrity
          tarball
        }
        docker {
          image
          installNodeModules
          runBaseScript
          shell
        }
        environments {
          default
          description
          name
          required
          secure
          shared
          validation
        }
        events {
          description
          type
        }
        interfaces {
          cacheable
          name
          pageGroups
          path
          port
          prefix
          protocol
          type
          services {
            config
            name
          }
        }
        maintainers {
          email
          name
          url
        }
        owner {
          avatar
          did
          email
          fullName
        }
        payment {
          price {
            address
            symbol
            value
          }
          share {
            address
            name
            value
          }
        }
        repository {
          type
          url
        }
        requirements {
          aigne
          cpu
          os
          server
          fuels {
            address
            endpoint
            reason
            value
          }
        }
        resource {
          exportApi
          bundles {
            did
            public
            type
          }
          types {
            description
            type
          }
        }
        stats {
          downloads
          purchases
          star
        }
      }
      migratedFrom {
        appDid
        appSk
        at
      }
      optionalComponents {
        bundleSource
        logoUrl
        dependencies {
          mountPoint
          parentDid
          parentName
          parentTitle
          required
        }
        meta {
          bundleDid
          bundleName
          community
          description
          did
          documentation
          engine
          group
          homepage
          keywords
          lastPublishedAt
          logo
          main
          name
          navigation
          nftFactory
          path
          resources
          screenshots
          support
          title
          version
          author {
            email
            name
            url
          }
          capabilities {
            clusterMode
            component
            didSpace
            navigation
            resourceExportApi
          }
          components {
            mountPoint
            name
            required
          }
          contributors {
            email
            name
            url
          }
          dist {
            integrity
            tarball
          }
          docker {
            image
            installNodeModules
            runBaseScript
            shell
          }
          environments {
            default
            description
            name
            required
            secure
            shared
            validation
          }
          events {
            description
            type
          }
          interfaces {
            cacheable
            name
            pageGroups
            path
            port
            prefix
            protocol
            type
            services {
              config
              name
            }
          }
          maintainers {
            email
            name
            url
          }
          owner {
            avatar
            did
            email
            fullName
          }
          payment {
            price {
              address
              symbol
              value
            }
            share {
              address
              name
              value
            }
          }
          repository {
            type
            url
          }
          requirements {
            aigne
            cpu
            os
            server
            fuels {
              address
              endpoint
              reason
              value
            }
          }
          resource {
            exportApi
            bundles {
              did
              public
              type
            }
            types {
              description
              type
            }
          }
          stats {
            downloads
            purchases
            star
          }
        }
      }
      runtimeInfo {
        cpus
        cpuUsage
        memoryUsage
        pid
        port
        runningDocker
        uptime
      }
      settings {
        actionConfig
        authentication
        didConnect
        enablePassportIssuance
        enableSessionHardening
        initialized
        notification
        oauth
        publicToStore
        theme
        whoCanAccess
        aigne {
          accessKeyId
          key
          model
          provider
          secretAccessKey
          url
          validationResult
        }
        autoBackup {
          enabled
        }
        autoCheckUpdate {
          enabled
        }
        children {
          deletedAt
          deployedFrom
          mountPoint
          status
          meta {
            bundleDid
            bundleName
            description
            did
            name
            title
            version
          }
        }
        endpointList {
          appDescription
          appName
          endpoint
          id
          protected
          scope
          url
        }
        federated {
          config {
            appId
            appPid
            autoLogin
            delegation
            isMaster
          }
          sites {
            aliasDid
            aliasDomain
            appDescription
            appId
            appliedAt
            appLogo
            appLogoRect
            appName
            appPid
            appUrl
            did
            isMaster
            pk
            serverId
            serverVersion
            status
            version
          }
        }
        gateway {
          cacheEnabled
          blockPolicy {
            blacklist
            enabled
            autoBlocking {
              blockDuration
              enabled
              statusCodes
              windowQuota
              windowSize
            }
          }
          proxyPolicy {
            enabled
            realIpHeader
            trustedProxies
            trustRecursive
          }
          requestLimit {
            burstDelay
            burstFactor
            enabled
            global
            methods
            rate
          }
          wafPolicy {
            enabled
            inboundAnomalyScoreThreshold
            logLevel
            mode
            outboundAnomalyScoreThreshold
          }
        }
        invite {
          enabled
        }
        navigations {
          activeColor
          activeIcon
          color
          component
          description
          from
          icon
          id
          link
          parent
          private
          role
          section
          title
          visible
        }
        org {
          enabled
          maxMemberPerOrg
          maxOrgPerUser
        }
        owner {
          did
          pk
        }
        session {
          cacheTtl
          enableBlacklist
          salt
          ttl
          email {
            domainBlackList
            domainWhiteList
            enabled
            enableDomainBlackList
            enableDomainWhiteList
            requireUnique
            requireVerified
            trustOauthProviders
            trustedIssuers {
              id
              name
              pk
            }
          }
          phone {
            enabled
            enableRegionBlackList
            enableRegionWhiteList
            regionBlackList
            regionWhiteList
            requireUnique
            requireVerified
            trustedIssuers {
              id
              name
              pk
            }
          }
        }
        storeList {
          cdnUrl
          description
          id
          logoUrl
          maintainer
          name
          protected
          scope
          url
        }
        subService {
          domain
          enabled
          staticRoot
        }
        trustedFactories {
          factoryAddress
          holderDid
          issuerDid
          remark
          passport {
            role
            ttl
            ttlPolicy
          }
        }
        trustedPassports {
          issuerDid
          remark
          mappings {
            from {
              passport
            }
            to {
              role
              ttl
              ttlPolicy
            }
          }
        }
      }
      site {
        corsAllowedOrigins
        domain
        domainAliases
        id
        isProtected
        rules {
          id
          isProtected
          from {
            pathPrefix
            header {
              key
              type
              value
            }
          }
          to {
            componentId
            did
            interfaceName
            pageGroup
            port
            redirectCode
            type
            url
            response {
              body
              contentType
              status
            }
          }
        }
      }
      trustedFactories {
        factoryAddress
        holderDid
        issuerDid
        remark
        passport {
          role
          ttl
          ttlPolicy
        }
      }
      trustedPassports {
        issuerDid
        remark
        mappings {
          from {
            passport
          }
          to {
            role
            ttl
            ttlPolicy
          }
        }
      }
      vaults {
        approverDid
        approverPk
        approverSig
        at
        did
        pk
        sig
      }
    }
  }
}
```

### deleteComponent

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
mutation {
  deleteComponent {
    code
    blocklet {
      appDid
      appPid
      bundleSource
      createdAt
      deployedFrom
      dynamic
      enableDocker
      enableDockerNetwork
      enablePassportIssuance
      externalSk
      externalSkSource
      installedAt
      mode
      mountPoint
      pausedAt
      port
      ports
      source
      startedAt
      status
      stoppedAt
      structVersion
      updatedAt
      appRuntimeInfo {
        cpus
        cpuUsage
        memoryUsage
        pid
        port
        runningDocker
        uptime
      }
      children {
        bundleSource
        createdAt
        deployedFrom
        dynamic
        greenStatus
        installedAt
        mode
        mountPoint
        pausedAt
        port
        ports
        required
        source
        startedAt
        status
        stoppedAt
        appRuntimeInfo {
          cpus
          cpuUsage
          memoryUsage
          pid
          port
          runningDocker
          uptime
        }
        children {
          bundleSource
          createdAt
          deployedFrom
          dynamic
          greenStatus
          installedAt
          mode
          mountPoint
          pausedAt
          port
          ports
          required
          source
          startedAt
          status
          stoppedAt
          appRuntimeInfo {
            cpus
            cpuUsage
            memoryUsage
            pid
            port
            runningDocker
            uptime
          }
          children {
            bundleSource
            createdAt
            deployedFrom
            dynamic
            greenStatus
            installedAt
            mode
            mountPoint
            pausedAt
            port
            ports
            required
            source
            startedAt
            status
            stoppedAt
            appRuntimeInfo {
              cpus
              cpuUsage
              memoryUsage
              pid
              port
              runningDocker
              uptime
            }
            children {
              bundleSource
              createdAt
              deployedFrom
              dynamic
              greenStatus
              installedAt
              mode
              mountPoint
              pausedAt
              port
              ports
              required
              source
              startedAt
              status
              stoppedAt
              appRuntimeInfo {
                cpus
                cpuUsage
                memoryUsage
                pid
                port
                runningDocker
                uptime
              }
              children {
                bundleSource
                createdAt
                deployedFrom
                dynamic
                greenStatus
                installedAt
                mode
                mountPoint
                pausedAt
                port
                ports
                required
                source
                startedAt
                status
                stoppedAt
              }
              configs {
                custom
                description
                key
                required
                secure
                shared
                validation
                value
              }
              dependents {
                id
                required
              }
              diskInfo {
                app
                blocklets
                cache
                data
                log
              }
              engine {
                available
                description
                displayName
                logo
                name
                version
                visible
              }
              environments {
                custom
                description
                key
                required
                secure
                shared
                validation
                value
              }
              meta {
                bundleDid
                bundleName
                community
                description
                did
                documentation
                engine
                group
                homepage
                keywords
                lastPublishedAt
                logo
                main
                name
                navigation
                nftFactory
                path
                resources
                screenshots
                support
                title
                version
              }
              runtimeInfo {
                cpus
                cpuUsage
                memoryUsage
                pid
                port
                runningDocker
                uptime
              }
            }
            configs {
              custom
              description
              key
              required
              secure
              shared
              validation
              value
            }
            dependents {
              id
              required
            }
            diskInfo {
              app
              blocklets
              cache
              data
              log
            }
            engine {
              available
              description
              displayName
              logo
              name
              version
              visible
            }
            environments {
              custom
              description
              key
              required
              secure
              shared
              validation
              value
            }
            meta {
              bundleDid
              bundleName
              community
              description
              did
              documentation
              engine
              group
              homepage
              keywords
              lastPublishedAt
              logo
              main
              name
              navigation
              nftFactory
              path
              resources
              screenshots
              support
              title
              version
              author {
                email
                name
                url
              }
              capabilities {
                clusterMode
                component
                didSpace
                navigation
                resourceExportApi
              }
              components {
                mountPoint
                name
                required
              }
              contributors {
                email
                name
                url
              }
              dist {
                integrity
                tarball
              }
              docker {
                image
                installNodeModules
                runBaseScript
                shell
              }
              environments {
                default
                description
                name
                required
                secure
                shared
                validation
              }
              events {
                description
                type
              }
              interfaces {
                cacheable
                name
                pageGroups
                path
                port
                prefix
                protocol
                type
              }
              maintainers {
                email
                name
                url
              }
              owner {
                avatar
                did
                email
                fullName
              }
              repository {
                type
                url
              }
              requirements {
                aigne
                cpu
                os
                server
              }
              resource {
                exportApi
              }
              stats {
                downloads
                purchases
                star
              }
            }
            runtimeInfo {
              cpus
              cpuUsage
              memoryUsage
              pid
              port
              runningDocker
              uptime
            }
          }
          configs {
            custom
            description
            key
            required
            secure
            shared
            validation
            value
          }
          dependents {
            id
            required
          }
          diskInfo {
            app
            blocklets
            cache
            data
            log
          }
          engine {
            available
            description
            displayName
            logo
            name
            version
            visible
          }
          environments {
            custom
            description
            key
            required
            secure
            shared
            validation
            value
          }
          meta {
            bundleDid
            bundleName
            community
            description
            did
            documentation
            engine
            group
            homepage
            keywords
            lastPublishedAt
            logo
            main
            name
            navigation
            nftFactory
            path
            resources
            screenshots
            support
            title
            version
            author {
              email
              name
              url
            }
            capabilities {
              clusterMode
              component
              didSpace
              navigation
              resourceExportApi
            }
            components {
              mountPoint
              name
              required
            }
            contributors {
              email
              name
              url
            }
            dist {
              integrity
              tarball
            }
            docker {
              image
              installNodeModules
              runBaseScript
              shell
            }
            environments {
              default
              description
              name
              required
              secure
              shared
              validation
            }
            events {
              description
              type
            }
            interfaces {
              cacheable
              name
              pageGroups
              path
              port
              prefix
              protocol
              type
              services {
                config
                name
              }
            }
            maintainers {
              email
              name
              url
            }
            owner {
              avatar
              did
              email
              fullName
            }
            payment {
              price {
                address
                symbol
                value
              }
              share {
                address
                name
                value
              }
            }
            repository {
              type
              url
            }
            requirements {
              aigne
              cpu
              os
              server
              fuels {
                address
                endpoint
                reason
                value
              }
            }
            resource {
              exportApi
              bundles {
                did
                public
                type
              }
              types {
                description
                type
              }
            }
            stats {
              downloads
              purchases
              star
            }
          }
          runtimeInfo {
            cpus
            cpuUsage
            memoryUsage
            pid
            port
            runningDocker
            uptime
          }
        }
        configs {
          custom
          description
          key
          required
          secure
          shared
          validation
          value
        }
        dependents {
          id
          required
        }
        diskInfo {
          app
          blocklets
          cache
          data
          log
        }
        engine {
          available
          description
          displayName
          logo
          name
          version
          visible
        }
        environments {
          custom
          description
          key
          required
          secure
          shared
          validation
          value
        }
        meta {
          bundleDid
          bundleName
          community
          description
          did
          documentation
          engine
          group
          homepage
          keywords
          lastPublishedAt
          logo
          main
          name
          navigation
          nftFactory
          path
          resources
          screenshots
          support
          title
          version
          author {
            email
            name
            url
          }
          capabilities {
            clusterMode
            component
            didSpace
            navigation
            resourceExportApi
          }
          components {
            mountPoint
            name
            required
          }
          contributors {
            email
            name
            url
          }
          dist {
            integrity
            tarball
          }
          docker {
            image
            installNodeModules
            runBaseScript
            shell
          }
          environments {
            default
            description
            name
            required
            secure
            shared
            validation
          }
          events {
            description
            type
          }
          interfaces {
            cacheable
            name
            pageGroups
            path
            port
            prefix
            protocol
            type
            services {
              config
              name
            }
          }
          maintainers {
            email
            name
            url
          }
          owner {
            avatar
            did
            email
            fullName
          }
          payment {
            price {
              address
              symbol
              value
            }
            share {
              address
              name
              value
            }
          }
          repository {
            type
            url
          }
          requirements {
            aigne
            cpu
            os
            server
            fuels {
              address
              endpoint
              reason
              value
            }
          }
          resource {
            exportApi
            bundles {
              did
              public
              type
            }
            types {
              description
              type
            }
          }
          stats {
            downloads
            purchases
            star
          }
        }
        runtimeInfo {
          cpus
          cpuUsage
          memoryUsage
          pid
          port
          runningDocker
          uptime
        }
      }
      configs {
        custom
        description
        key
        required
        secure
        shared
        validation
        value
      }
      controller {
        chainHost
        consumedAt
        expireDate
        id
        launcherSessionId
        launcherUrl
        nftId
        nftOwner
        ownerDid
        status {
          reason
          value
        }
      }
      diskInfo {
        app
        blocklets
        cache
        data
        log
      }
      engine {
        available
        description
        displayName
        logo
        name
        version
        visible
      }
      environments {
        custom
        description
        key
        required
        secure
        shared
        validation
        value
      }
      meta {
        bundleDid
        bundleName
        community
        description
        did
        documentation
        engine
        group
        homepage
        keywords
        lastPublishedAt
        logo
        main
        name
        navigation
        nftFactory
        path
        resources
        screenshots
        support
        title
        version
        author {
          email
          name
          url
        }
        capabilities {
          clusterMode
          component
          didSpace
          navigation
          resourceExportApi
        }
        components {
          mountPoint
          name
          required
        }
        contributors {
          email
          name
          url
        }
        dist {
          integrity
          tarball
        }
        docker {
          image
          installNodeModules
          runBaseScript
          shell
        }
        environments {
          default
          description
          name
          required
          secure
          shared
          validation
        }
        events {
          description
          type
        }
        interfaces {
          cacheable
          name
          pageGroups
          path
          port
          prefix
          protocol
          type
          services {
            config
            name
          }
        }
        maintainers {
          email
          name
          url
        }
        owner {
          avatar
          did
          email
          fullName
        }
        payment {
          price {
            address
            symbol
            value
          }
          share {
            address
            name
            value
          }
        }
        repository {
          type
          url
        }
        requirements {
          aigne
          cpu
          os
          server
          fuels {
            address
            endpoint
            reason
            value
          }
        }
        resource {
          exportApi
          bundles {
            did
            public
            type
          }
          types {
            description
            type
          }
        }
        stats {
          downloads
          purchases
          star
        }
      }
      migratedFrom {
        appDid
        appSk
        at
      }
      optionalComponents {
        bundleSource
        logoUrl
        dependencies {
          mountPoint
          parentDid
          parentName
          parentTitle
          required
        }
        meta {
          bundleDid
          bundleName
          community
          description
          did
          documentation
          engine
          group
          homepage
          keywords
          lastPublishedAt
          logo
          main
          name
          navigation
          nftFactory
          path
          resources
          screenshots
          support
          title
          version
          author {
            email
            name
            url
          }
          capabilities {
            clusterMode
            component
            didSpace
            navigation
            resourceExportApi
          }
          components {
            mountPoint
            name
            required
          }
          contributors {
            email
            name
            url
          }
          dist {
            integrity
            tarball
          }
          docker {
            image
            installNodeModules
            runBaseScript
            shell
          }
          environments {
            default
            description
            name
            required
            secure
            shared
            validation
          }
          events {
            description
            type
          }
          interfaces {
            cacheable
            name
            pageGroups
            path
            port
            prefix
            protocol
            type
            services {
              config
              name
            }
          }
          maintainers {
            email
            name
            url
          }
          owner {
            avatar
            did
            email
            fullName
          }
          payment {
            price {
              address
              symbol
              value
            }
            share {
              address
              name
              value
            }
          }
          repository {
            type
            url
          }
          requirements {
            aigne
            cpu
            os
            server
            fuels {
              address
              endpoint
              reason
              value
            }
          }
          resource {
            exportApi
            bundles {
              did
              public
              type
            }
            types {
              description
              type
            }
          }
          stats {
            downloads
            purchases
            star
          }
        }
      }
      runtimeInfo {
        cpus
        cpuUsage
        memoryUsage
        pid
        port
        runningDocker
        uptime
      }
      settings {
        actionConfig
        authentication
        didConnect
        enablePassportIssuance
        enableSessionHardening
        initialized
        notification
        oauth
        publicToStore
        theme
        whoCanAccess
        aigne {
          accessKeyId
          key
          model
          provider
          secretAccessKey
          url
          validationResult
        }
        autoBackup {
          enabled
        }
        autoCheckUpdate {
          enabled
        }
        children {
          deletedAt
          deployedFrom
          mountPoint
          status
          meta {
            bundleDid
            bundleName
            description
            did
            name
            title
            version
          }
        }
        endpointList {
          appDescription
          appName
          endpoint
          id
          protected
          scope
          url
        }
        federated {
          config {
            appId
            appPid
            autoLogin
            delegation
            isMaster
          }
          sites {
            aliasDid
            aliasDomain
            appDescription
            appId
            appliedAt
            appLogo
            appLogoRect
            appName
            appPid
            appUrl
            did
            isMaster
            pk
            serverId
            serverVersion
            status
            version
          }
        }
        gateway {
          cacheEnabled
          blockPolicy {
            blacklist
            enabled
            autoBlocking {
              blockDuration
              enabled
              statusCodes
              windowQuota
              windowSize
            }
          }
          proxyPolicy {
            enabled
            realIpHeader
            trustedProxies
            trustRecursive
          }
          requestLimit {
            burstDelay
            burstFactor
            enabled
            global
            methods
            rate
          }
          wafPolicy {
            enabled
            inboundAnomalyScoreThreshold
            logLevel
            mode
            outboundAnomalyScoreThreshold
          }
        }
        invite {
          enabled
        }
        navigations {
          activeColor
          activeIcon
          color
          component
          description
          from
          icon
          id
          link
          parent
          private
          role
          section
          title
          visible
        }
        org {
          enabled
          maxMemberPerOrg
          maxOrgPerUser
        }
        owner {
          did
          pk
        }
        session {
          cacheTtl
          enableBlacklist
          salt
          ttl
          email {
            domainBlackList
            domainWhiteList
            enabled
            enableDomainBlackList
            enableDomainWhiteList
            requireUnique
            requireVerified
            trustOauthProviders
            trustedIssuers {
              id
              name
              pk
            }
          }
          phone {
            enabled
            enableRegionBlackList
            enableRegionWhiteList
            regionBlackList
            regionWhiteList
            requireUnique
            requireVerified
            trustedIssuers {
              id
              name
              pk
            }
          }
        }
        storeList {
          cdnUrl
          description
          id
          logoUrl
          maintainer
          name
          protected
          scope
          url
        }
        subService {
          domain
          enabled
          staticRoot
        }
        trustedFactories {
          factoryAddress
          holderDid
          issuerDid
          remark
          passport {
            role
            ttl
            ttlPolicy
          }
        }
        trustedPassports {
          issuerDid
          remark
          mappings {
            from {
              passport
            }
            to {
              role
              ttl
              ttlPolicy
            }
          }
        }
      }
      site {
        corsAllowedOrigins
        domain
        domainAliases
        id
        isProtected
        rules {
          id
          isProtected
          from {
            pathPrefix
            header {
              key
              type
              value
            }
          }
          to {
            componentId
            did
            interfaceName
            pageGroup
            port
            redirectCode
            type
            url
            response {
              body
              contentType
              status
            }
          }
        }
      }
      trustedFactories {
        factoryAddress
        holderDid
        issuerDid
        remark
        passport {
          role
          ttl
          ttlPolicy
        }
      }
      trustedPassports {
        issuerDid
        remark
        mappings {
          from {
            passport
          }
          to {
            role
            ttl
            ttlPolicy
          }
        }
      }
      vaults {
        approverDid
        approverPk
        approverSig
        at
        did
        pk
        sig
      }
    }
  }
}
```

### cancelDownloadBlocklet

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
mutation {
  cancelDownloadBlocklet {
    code
    blocklet {
      appDid
      appPid
      bundleSource
      createdAt
      deployedFrom
      dynamic
      enableDocker
      enableDockerNetwork
      enablePassportIssuance
      externalSk
      externalSkSource
      installedAt
      mode
      mountPoint
      pausedAt
      port
      ports
      source
      startedAt
      status
      stoppedAt
      structVersion
      updatedAt
      appRuntimeInfo {
        cpus
        cpuUsage
        memoryUsage
        pid
        port
        runningDocker
        uptime
      }
      children {
        bundleSource
        createdAt
        deployedFrom
        dynamic
        greenStatus
        installedAt
        mode
        mountPoint
        pausedAt
        port
        ports
        required
        source
        startedAt
        status
        stoppedAt
        appRuntimeInfo {
          cpus
          cpuUsage
          memoryUsage
          pid
          port
          runningDocker
          uptime
        }
        children {
          bundleSource
          createdAt
          deployedFrom
          dynamic
          greenStatus
          installedAt
          mode
          mountPoint
          pausedAt
          port
          ports
          required
          source
          startedAt
          status
          stoppedAt
          appRuntimeInfo {
            cpus
            cpuUsage
            memoryUsage
            pid
            port
            runningDocker
            uptime
          }
          children {
            bundleSource
            createdAt
            deployedFrom
            dynamic
            greenStatus
            installedAt
            mode
            mountPoint
            pausedAt
            port
            ports
            required
            source
            startedAt
            status
            stoppedAt
            appRuntimeInfo {
              cpus
              cpuUsage
              memoryUsage
              pid
              port
              runningDocker
              uptime
            }
            children {
              bundleSource
              createdAt
              deployedFrom
              dynamic
              greenStatus
              installedAt
              mode
              mountPoint
              pausedAt
              port
              ports
              required
              source
              startedAt
              status
              stoppedAt
              appRuntimeInfo {
                cpus
                cpuUsage
                memoryUsage
                pid
                port
                runningDocker
                uptime
              }
              children {
                bundleSource
                createdAt
                deployedFrom
                dynamic
                greenStatus
                installedAt
                mode
                mountPoint
                pausedAt
                port
                ports
                required
                source
                startedAt
                status
                stoppedAt
              }
              configs {
                custom
                description
                key
                required
                secure
                shared
                validation
                value
              }
              dependents {
                id
                required
              }
              diskInfo {
                app
                blocklets
                cache
                data
                log
              }
              engine {
                available
                description
                displayName
                logo
                name
                version
                visible
              }
              environments {
                custom
                description
                key
                required
                secure
                shared
                validation
                value
              }
              meta {
                bundleDid
                bundleName
                community
                description
                did
                documentation
                engine
                group
                homepage
                keywords
                lastPublishedAt
                logo
                main
                name
                navigation
                nftFactory
                path
                resources
                screenshots
                support
                title
                version
              }
              runtimeInfo {
                cpus
                cpuUsage
                memoryUsage
                pid
                port
                runningDocker
                uptime
              }
            }
            configs {
              custom
              description
              key
              required
              secure
              shared
              validation
              value
            }
            dependents {
              id
              required
            }
            diskInfo {
              app
              blocklets
              cache
              data
              log
            }
            engine {
              available
              description
              displayName
              logo
              name
              version
              visible
            }
            environments {
              custom
              description
              key
              required
              secure
              shared
              validation
              value
            }
            meta {
              bundleDid
              bundleName
              community
              description
              did
              documentation
              engine
              group
              homepage
              keywords
              lastPublishedAt
              logo
              main
              name
              navigation
              nftFactory
              path
              resources
              screenshots
              support
              title
              version
              author {
                email
                name
                url
              }
              capabilities {
                clusterMode
                component
                didSpace
                navigation
                resourceExportApi
              }
              components {
                mountPoint
                name
                required
              }
              contributors {
                email
                name
                url
              }
              dist {
                integrity
                tarball
              }
              docker {
                image
                installNodeModules
                runBaseScript
                shell
              }
              environments {
                default
                description
                name
                required
                secure
                shared
                validation
              }
              events {
                description
                type
              }
              interfaces {
                cacheable
                name
                pageGroups
                path
                port
                prefix
                protocol
                type
              }
              maintainers {
                email
                name
                url
              }
              owner {
                avatar
                did
                email
                fullName
              }
              repository {
                type
                url
              }
              requirements {
                aigne
                cpu
                os
                server
              }
              resource {
                exportApi
              }
              stats {
                downloads
                purchases
                star
              }
            }
            runtimeInfo {
              cpus
              cpuUsage
              memoryUsage
              pid
              port
              runningDocker
              uptime
            }
          }
          configs {
            custom
            description
            key
            required
            secure
            shared
            validation
            value
          }
          dependents {
            id
            required
          }
          diskInfo {
            app
            blocklets
            cache
            data
            log
          }
          engine {
            available
            description
            displayName
            logo
            name
            version
            visible
          }
          environments {
            custom
            description
            key
            required
            secure
            shared
            validation
            value
          }
          meta {
            bundleDid
            bundleName
            community
            description
            did
            documentation
            engine
            group
            homepage
            keywords
            lastPublishedAt
            logo
            main
            name
            navigation
            nftFactory
            path
            resources
            screenshots
            support
            title
            version
            author {
              email
              name
              url
            }
            capabilities {
              clusterMode
              component
              didSpace
              navigation
              resourceExportApi
            }
            components {
              mountPoint
              name
              required
            }
            contributors {
              email
              name
              url
            }
            dist {
              integrity
              tarball
            }
            docker {
              image
              installNodeModules
              runBaseScript
              shell
            }
            environments {
              default
              description
              name
              required
              secure
              shared
              validation
            }
            events {
              description
              type
            }
            interfaces {
              cacheable
              name
              pageGroups
              path
              port
              prefix
              protocol
              type
              services {
                config
                name
              }
            }
            maintainers {
              email
              name
              url
            }
            owner {
              avatar
              did
              email
              fullName
            }
            payment {
              price {
                address
                symbol
                value
              }
              share {
                address
                name
                value
              }
            }
            repository {
              type
              url
            }
            requirements {
              aigne
              cpu
              os
              server
              fuels {
                address
                endpoint
                reason
                value
              }
            }
            resource {
              exportApi
              bundles {
                did
                public
                type
              }
              types {
                description
                type
              }
            }
            stats {
              downloads
              purchases
              star
            }
          }
          runtimeInfo {
            cpus
            cpuUsage
            memoryUsage
            pid
            port
            runningDocker
            uptime
          }
        }
        configs {
          custom
          description
          key
          required
          secure
          shared
          validation
          value
        }
        dependents {
          id
          required
        }
        diskInfo {
          app
          blocklets
          cache
          data
          log
        }
        engine {
          available
          description
          displayName
          logo
          name
          version
          visible
        }
        environments {
          custom
          description
          key
          required
          secure
          shared
          validation
          value
        }
        meta {
          bundleDid
          bundleName
          community
          description
          did
          documentation
          engine
          group
          homepage
          keywords
          lastPublishedAt
          logo
          main
          name
          navigation
          nftFactory
          path
          resources
          screenshots
          support
          title
          version
          author {
            email
            name
            url
          }
          capabilities {
            clusterMode
            component
            didSpace
            navigation
            resourceExportApi
          }
          components {
            mountPoint
            name
            required
          }
          contributors {
            email
            name
            url
          }
          dist {
            integrity
            tarball
          }
          docker {
            image
            installNodeModules
            runBaseScript
            shell
          }
          environments {
            default
            description
            name
            required
            secure
            shared
            validation
          }
          events {
            description
            type
          }
          interfaces {
            cacheable
            name
            pageGroups
            path
            port
            prefix
            protocol
            type
            services {
              config
              name
            }
          }
          maintainers {
            email
            name
            url
          }
          owner {
            avatar
            did
            email
            fullName
          }
          payment {
            price {
              address
              symbol
              value
            }
            share {
              address
              name
              value
            }
          }
          repository {
            type
            url
          }
          requirements {
            aigne
            cpu
            os
            server
            fuels {
              address
              endpoint
              reason
              value
            }
          }
          resource {
            exportApi
            bundles {
              did
              public
              type
            }
            types {
              description
              type
            }
          }
          stats {
            downloads
            purchases
            star
          }
        }
        runtimeInfo {
          cpus
          cpuUsage
          memoryUsage
          pid
          port
          runningDocker
          uptime
        }
      }
      configs {
        custom
        description
        key
        required
        secure
        shared
        validation
        value
      }
      controller {
        chainHost
        consumedAt
        expireDate
        id
        launcherSessionId
        launcherUrl
        nftId
        nftOwner
        ownerDid
        status {
          reason
          value
        }
      }
      diskInfo {
        app
        blocklets
        cache
        data
        log
      }
      engine {
        available
        description
        displayName
        logo
        name
        version
        visible
      }
      environments {
        custom
        description
        key
        required
        secure
        shared
        validation
        value
      }
      meta {
        bundleDid
        bundleName
        community
        description
        did
        documentation
        engine
        group
        homepage
        keywords
        lastPublishedAt
        logo
        main
        name
        navigation
        nftFactory
        path
        resources
        screenshots
        support
        title
        version
        author {
          email
          name
          url
        }
        capabilities {
          clusterMode
          component
          didSpace
          navigation
          resourceExportApi
        }
        components {
          mountPoint
          name
          required
        }
        contributors {
          email
          name
          url
        }
        dist {
          integrity
          tarball
        }
        docker {
          image
          installNodeModules
          runBaseScript
          shell
        }
        environments {
          default
          description
          name
          required
          secure
          shared
          validation
        }
        events {
          description
          type
        }
        interfaces {
          cacheable
          name
          pageGroups
          path
          port
          prefix
          protocol
          type
          services {
            config
            name
          }
        }
        maintainers {
          email
          name
          url
        }
        owner {
          avatar
          did
          email
          fullName
        }
        payment {
          price {
            address
            symbol
            value
          }
          share {
            address
            name
            value
          }
        }
        repository {
          type
          url
        }
        requirements {
          aigne
          cpu
          os
          server
          fuels {
            address
            endpoint
            reason
            value
          }
        }
        resource {
          exportApi
          bundles {
            did
            public
            type
          }
          types {
            description
            type
          }
        }
        stats {
          downloads
          purchases
          star
        }
      }
      migratedFrom {
        appDid
        appSk
        at
      }
      optionalComponents {
        bundleSource
        logoUrl
        dependencies {
          mountPoint
          parentDid
          parentName
          parentTitle
          required
        }
        meta {
          bundleDid
          bundleName
          community
          description
          did
          documentation
          engine
          group
          homepage
          keywords
          lastPublishedAt
          logo
          main
          name
          navigation
          nftFactory
          path
          resources
          screenshots
          support
          title
          version
          author {
            email
            name
            url
          }
          capabilities {
            clusterMode
            component
            didSpace
            navigation
            resourceExportApi
          }
          components {
            mountPoint
            name
            required
          }
          contributors {
            email
            name
            url
          }
          dist {
            integrity
            tarball
          }
          docker {
            image
            installNodeModules
            runBaseScript
            shell
          }
          environments {
            default
            description
            name
            required
            secure
            shared
            validation
          }
          events {
            description
            type
          }
          interfaces {
            cacheable
            name
            pageGroups
            path
            port
            prefix
            protocol
            type
            services {
              config
              name
            }
          }
          maintainers {
            email
            name
            url
          }
          owner {
            avatar
            did
            email
            fullName
          }
          payment {
            price {
              address
              symbol
              value
            }
            share {
              address
              name
              value
            }
          }
          repository {
            type
            url
          }
          requirements {
            aigne
            cpu
            os
            server
            fuels {
              address
              endpoint
              reason
              value
            }
          }
          resource {
            exportApi
            bundles {
              did
              public
              type
            }
            types {
              description
              type
            }
          }
          stats {
            downloads
            purchases
            star
          }
        }
      }
      runtimeInfo {
        cpus
        cpuUsage
        memoryUsage
        pid
        port
        runningDocker
        uptime
      }
      settings {
        actionConfig
        authentication
        didConnect
        enablePassportIssuance
        enableSessionHardening
        initialized
        notification
        oauth
        publicToStore
        theme
        whoCanAccess
        aigne {
          accessKeyId
          key
          model
          provider
          secretAccessKey
          url
          validationResult
        }
        autoBackup {
          enabled
        }
        autoCheckUpdate {
          enabled
        }
        children {
          deletedAt
          deployedFrom
          mountPoint
          status
          meta {
            bundleDid
            bundleName
            description
            did
            name
            title
            version
          }
        }
        endpointList {
          appDescription
          appName
          endpoint
          id
          protected
          scope
          url
        }
        federated {
          config {
            appId
            appPid
            autoLogin
            delegation
            isMaster
          }
          sites {
            aliasDid
            aliasDomain
            appDescription
            appId
            appliedAt
            appLogo
            appLogoRect
            appName
            appPid
            appUrl
            did
            isMaster
            pk
            serverId
            serverVersion
            status
            version
          }
        }
        gateway {
          cacheEnabled
          blockPolicy {
            blacklist
            enabled
            autoBlocking {
              blockDuration
              enabled
              statusCodes
              windowQuota
              windowSize
            }
          }
          proxyPolicy {
            enabled
            realIpHeader
            trustedProxies
            trustRecursive
          }
          requestLimit {
            burstDelay
            burstFactor
            enabled
            global
            methods
            rate
          }
          wafPolicy {
            enabled
            inboundAnomalyScoreThreshold
            logLevel
            mode
            outboundAnomalyScoreThreshold
          }
        }
        invite {
          enabled
        }
        navigations {
          activeColor
          activeIcon
          color
          component
          description
          from
          icon
          id
          link
          parent
          private
          role
          section
          title
          visible
        }
        org {
          enabled
          maxMemberPerOrg
          maxOrgPerUser
        }
        owner {
          did
          pk
        }
        session {
          cacheTtl
          enableBlacklist
          salt
          ttl
          email {
            domainBlackList
            domainWhiteList
            enabled
            enableDomainBlackList
            enableDomainWhiteList
            requireUnique
            requireVerified
            trustOauthProviders
            trustedIssuers {
              id
              name
              pk
            }
          }
          phone {
            enabled
            enableRegionBlackList
            enableRegionWhiteList
            regionBlackList
            regionWhiteList
            requireUnique
            requireVerified
            trustedIssuers {
              id
              name
              pk
            }
          }
        }
        storeList {
          cdnUrl
          description
          id
          logoUrl
          maintainer
          name
          protected
          scope
          url
        }
        subService {
          domain
          enabled
          staticRoot
        }
        trustedFactories {
          factoryAddress
          holderDid
          issuerDid
          remark
          passport {
            role
            ttl
            ttlPolicy
          }
        }
        trustedPassports {
          issuerDid
          remark
          mappings {
            from {
              passport
            }
            to {
              role
              ttl
              ttlPolicy
            }
          }
        }
      }
      site {
        corsAllowedOrigins
        domain
        domainAliases
        id
        isProtected
        rules {
          id
          isProtected
          from {
            pathPrefix
            header {
              key
              type
              value
            }
          }
          to {
            componentId
            did
            interfaceName
            pageGroup
            port
            redirectCode
            type
            url
            response {
              body
              contentType
              status
            }
          }
        }
      }
      trustedFactories {
        factoryAddress
        holderDid
        issuerDid
        remark
        passport {
          role
          ttl
          ttlPolicy
        }
      }
      trustedPassports {
        issuerDid
        remark
        mappings {
          from {
            passport
          }
          to {
            role
            ttl
            ttlPolicy
          }
        }
      }
      vaults {
        approverDid
        approverPk
        approverSig
        at
        did
        pk
        sig
      }
    }
  }
}
```

### checkComponentsForUpdates

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
mutation {
  checkComponentsForUpdates {
    code
    preUpdateInfo {
      updateId
      updateList {
        id
        meta {
          bundleDid
          bundleName
          community
          description
          did
          documentation
          engine
          group
          homepage
          keywords
          lastPublishedAt
          logo
          main
          name
          navigation
          nftFactory
          path
          resources
          screenshots
          support
          title
          version
          author {
            email
            name
            url
          }
          capabilities {
            clusterMode
            component
            didSpace
            navigation
            resourceExportApi
          }
          components {
            mountPoint
            name
            required
          }
          contributors {
            email
            name
            url
          }
          dist {
            integrity
            tarball
          }
          docker {
            image
            installNodeModules
            runBaseScript
            shell
          }
          environments {
            default
            description
            name
            required
            secure
            shared
            validation
          }
          events {
            description
            type
          }
          interfaces {
            cacheable
            name
            pageGroups
            path
            port
            prefix
            protocol
            type
            services {
              config
              name
            }
          }
          maintainers {
            email
            name
            url
          }
          owner {
            avatar
            did
            email
            fullName
          }
          payment {
            price {
              address
              symbol
              value
            }
            share {
              address
              name
              value
            }
          }
          repository {
            type
            url
          }
          requirements {
            aigne
            cpu
            os
            server
            fuels {
              address
              endpoint
              reason
              value
            }
          }
          resource {
            exportApi
            bundles {
              did
              public
              type
            }
            types {
              description
              type
            }
          }
          stats {
            downloads
            purchases
            star
          }
        }
      }
    }
  }
}
```

### upgradeComponents

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
mutation {
  upgradeComponents {
    code
    blocklet {
      appDid
      appPid
      bundleSource
      createdAt
      deployedFrom
      dynamic
      enableDocker
      enableDockerNetwork
      enablePassportIssuance
      externalSk
      externalSkSource
      installedAt
      mode
      mountPoint
      pausedAt
      port
      ports
      source
      startedAt
      status
      stoppedAt
      structVersion
      updatedAt
      appRuntimeInfo {
        cpus
        cpuUsage
        memoryUsage
        pid
        port
        runningDocker
        uptime
      }
      children {
        bundleSource
        createdAt
        deployedFrom
        dynamic
        greenStatus
        installedAt
        mode
        mountPoint
        pausedAt
        port
        ports
        required
        source
        startedAt
        status
        stoppedAt
        appRuntimeInfo {
          cpus
          cpuUsage
          memoryUsage
          pid
          port
          runningDocker
          uptime
        }
        children {
          bundleSource
          createdAt
          deployedFrom
          dynamic
          greenStatus
          installedAt
          mode
          mountPoint
          pausedAt
          port
          ports
          required
          source
          startedAt
          status
          stoppedAt
          appRuntimeInfo {
            cpus
            cpuUsage
            memoryUsage
            pid
            port
            runningDocker
            uptime
          }
          children {
            bundleSource
            createdAt
            deployedFrom
            dynamic
            greenStatus
            installedAt
            mode
            mountPoint
            pausedAt
            port
            ports
            required
            source
            startedAt
            status
            stoppedAt
            appRuntimeInfo {
              cpus
              cpuUsage
              memoryUsage
              pid
              port
              runningDocker
              uptime
            }
            children {
              bundleSource
              createdAt
              deployedFrom
              dynamic
              greenStatus
              installedAt
              mode
              mountPoint
              pausedAt
              port
              ports
              required
              source
              startedAt
              status
              stoppedAt
              appRuntimeInfo {
                cpus
                cpuUsage
                memoryUsage
                pid
                port
                runningDocker
                uptime
              }
              children {
                bundleSource
                createdAt
                deployedFrom
                dynamic
                greenStatus
                installedAt
                mode
                mountPoint
                pausedAt
                port
                ports
                required
                source
                startedAt
                status
                stoppedAt
              }
              configs {
                custom
                description
                key
                required
                secure
                shared
                validation
                value
              }
              dependents {
                id
                required
              }
              diskInfo {
                app
                blocklets
                cache
                data
                log
              }
              engine {
                available
                description
                displayName
                logo
                name
                version
                visible
              }
              environments {
                custom
                description
                key
                required
                secure
                shared
                validation
                value
              }
              meta {
                bundleDid
                bundleName
                community
                description
                did
                documentation
                engine
                group
                homepage
                keywords
                lastPublishedAt
                logo
                main
                name
                navigation
                nftFactory
                path
                resources
                screenshots
                support
                title
                version
              }
              runtimeInfo {
                cpus
                cpuUsage
                memoryUsage
                pid
                port
                runningDocker
                uptime
              }
            }
            configs {
              custom
              description
              key
              required
              secure
              shared
              validation
              value
            }
            dependents {
              id
              required
            }
            diskInfo {
              app
              blocklets
              cache
              data
              log
            }
            engine {
              available
              description
              displayName
              logo
              name
              version
              visible
            }
            environments {
              custom
              description
              key
              required
              secure
              shared
              validation
              value
            }
            meta {
              bundleDid
              bundleName
              community
              description
              did
              documentation
              engine
              group
              homepage
              keywords
              lastPublishedAt
              logo
              main
              name
              navigation
              nftFactory
              path
              resources
              screenshots
              support
              title
              version
              author {
                email
                name
                url
              }
              capabilities {
                clusterMode
                component
                didSpace
                navigation
                resourceExportApi
              }
              components {
                mountPoint
                name
                required
              }
              contributors {
                email
                name
                url
              }
              dist {
                integrity
                tarball
              }
              docker {
                image
                installNodeModules
                runBaseScript
                shell
              }
              environments {
                default
                description
                name
                required
                secure
                shared
                validation
              }
              events {
                description
                type
              }
              interfaces {
                cacheable
                name
                pageGroups
                path
                port
                prefix
                protocol
                type
              }
              maintainers {
                email
                name
                url
              }
              owner {
                avatar
                did
                email
                fullName
              }
              repository {
                type
                url
              }
              requirements {
                aigne
                cpu
                os
                server
              }
              resource {
                exportApi
              }
              stats {
                downloads
                purchases
                star
              }
            }
            runtimeInfo {
              cpus
              cpuUsage
              memoryUsage
              pid
              port
              runningDocker
              uptime
            }
          }
          configs {
            custom
            description
            key
            required
            secure
            shared
            validation
            value
          }
          dependents {
            id
            required
          }
          diskInfo {
            app
            blocklets
            cache
            data
            log
          }
          engine {
            available
            description
            displayName
            logo
            name
            version
            visible
          }
          environments {
            custom
            description
            key
            required
            secure
            shared
            validation
            value
          }
          meta {
            bundleDid
            bundleName
            community
            description
            did
            documentation
            engine
            group
            homepage
            keywords
            lastPublishedAt
            logo
            main
            name
            navigation
            nftFactory
            path
            resources
            screenshots
            support
            title
            version
            author {
              email
              name
              url
            }
            capabilities {
              clusterMode
              component
              didSpace
              navigation
              resourceExportApi
            }
            components {
              mountPoint
              name
              required
            }
            contributors {
              email
              name
              url
            }
            dist {
              integrity
              tarball
            }
            docker {
              image
              installNodeModules
              runBaseScript
              shell
            }
            environments {
              default
              description
              name
              required
              secure
              shared
              validation
            }
            events {
              description
              type
            }
            interfaces {
              cacheable
              name
              pageGroups
              path
              port
              prefix
              protocol
              type
              services {
                config
                name
              }
            }
            maintainers {
              email
              name
              url
            }
            owner {
              avatar
              did
              email
              fullName
            }
            payment {
              price {
                address
                symbol
                value
              }
              share {
                address
                name
                value
              }
            }
            repository {
              type
              url
            }
            requirements {
              aigne
              cpu
              os
              server
              fuels {
                address
                endpoint
                reason
                value
              }
            }
            resource {
              exportApi
              bundles {
                did
                public
                type
              }
              types {
                description
                type
              }
            }
            stats {
              downloads
              purchases
              star
            }
          }
          runtimeInfo {
            cpus
            cpuUsage
            memoryUsage
            pid
            port
            runningDocker
            uptime
          }
        }
        configs {
          custom
          description
          key
          required
          secure
          shared
          validation
          value
        }
        dependents {
          id
          required
        }
        diskInfo {
          app
          blocklets
          cache
          data
          log
        }
        engine {
          available
          description
          displayName
          logo
          name
          version
          visible
        }
        environments {
          custom
          description
          key
          required
          secure
          shared
          validation
          value
        }
        meta {
          bundleDid
          bundleName
          community
          description
          did
          documentation
          engine
          group
          homepage
          keywords
          lastPublishedAt
          logo
          main
          name
          navigation
          nftFactory
          path
          resources
          screenshots
          support
          title
          version
          author {
            email
            name
            url
          }
          capabilities {
            clusterMode
            component
            didSpace
            navigation
            resourceExportApi
          }
          components {
            mountPoint
            name
            required
          }
          contributors {
            email
            name
            url
          }
          dist {
            integrity
            tarball
          }
          docker {
            image
            installNodeModules
            runBaseScript
            shell
          }
          environments {
            default
            description
            name
            required
            secure
            shared
            validation
          }
          events {
            description
            type
          }
          interfaces {
            cacheable
            name
            pageGroups
            path
            port
            prefix
            protocol
            type
            services {
              config
              name
            }
          }
          maintainers {
            email
            name
            url
          }
          owner {
            avatar
            did
            email
            fullName
          }
          payment {
            price {
              address
              symbol
              value
            }
            share {
              address
              name
              value
            }
          }
          repository {
            type
            url
          }
          requirements {
            aigne
            cpu
            os
            server
            fuels {
              address
              endpoint
              reason
              value
            }
          }
          resource {
            exportApi
            bundles {
              did
              public
              type
            }
            types {
              description
              type
            }
          }
          stats {
            downloads
            purchases
            star
          }
        }
        runtimeInfo {
          cpus
          cpuUsage
          memoryUsage
          pid
          port
          runningDocker
          uptime
        }
      }
      configs {
        custom
        description
        key
        required
        secure
        shared
        validation
        value
      }
      controller {
        chainHost
        consumedAt
        expireDate
        id
        launcherSessionId
        launcherUrl
        nftId
        nftOwner
        ownerDid
        status {
          reason
          value
        }
      }
      diskInfo {
        app
        blocklets
        cache
        data
        log
      }
      engine {
        available
        description
        displayName
        logo
        name
        version
        visible
      }
      environments {
        custom
        description
        key
        required
        secure
        shared
        validation
        value
      }
      meta {
        bundleDid
        bundleName
        community
        description
        did
        documentation
        engine
        group
        homepage
        keywords
        lastPublishedAt
        logo
        main
        name
        navigation
        nftFactory
        path
        resources
        screenshots
        support
        title
        version
        author {
          email
          name
          url
        }
        capabilities {
          clusterMode
          component
          didSpace
          navigation
          resourceExportApi
        }
        components {
          mountPoint
          name
          required
        }
        contributors {
          email
          name
          url
        }
        dist {
          integrity
          tarball
        }
        docker {
          image
          installNodeModules
          runBaseScript
          shell
        }
        environments {
          default
          description
          name
          required
          secure
          shared
          validation
        }
        events {
          description
          type
        }
        interfaces {
          cacheable
          name
          pageGroups
          path
          port
          prefix
          protocol
          type
          services {
            config
            name
          }
        }
        maintainers {
          email
          name
          url
        }
        owner {
          avatar
          did
          email
          fullName
        }
        payment {
          price {
            address
            symbol
            value
          }
          share {
            address
            name
            value
          }
        }
        repository {
          type
          url
        }
        requirements {
          aigne
          cpu
          os
          server
          fuels {
            address
            endpoint
            reason
            value
          }
        }
        resource {
          exportApi
          bundles {
            did
            public
            type
          }
          types {
            description
            type
          }
        }
        stats {
          downloads
          purchases
          star
        }
      }
      migratedFrom {
        appDid
        appSk
        at
      }
      optionalComponents {
        bundleSource
        logoUrl
        dependencies {
          mountPoint
          parentDid
          parentName
          parentTitle
          required
        }
        meta {
          bundleDid
          bundleName
          community
          description
          did
          documentation
          engine
          group
          homepage
          keywords
          lastPublishedAt
          logo
          main
          name
          navigation
          nftFactory
          path
          resources
          screenshots
          support
          title
          version
          author {
            email
            name
            url
          }
          capabilities {
            clusterMode
            component
            didSpace
            navigation
            resourceExportApi
          }
          components {
            mountPoint
            name
            required
          }
          contributors {
            email
            name
            url
          }
          dist {
            integrity
            tarball
          }
          docker {
            image
            installNodeModules
            runBaseScript
            shell
          }
          environments {
            default
            description
            name
            required
            secure
            shared
            validation
          }
          events {
            description
            type
          }
          interfaces {
            cacheable
            name
            pageGroups
            path
            port
            prefix
            protocol
            type
            services {
              config
              name
            }
          }
          maintainers {
            email
            name
            url
          }
          owner {
            avatar
            did
            email
            fullName
          }
          payment {
            price {
              address
              symbol
              value
            }
            share {
              address
              name
              value
            }
          }
          repository {
            type
            url
          }
          requirements {
            aigne
            cpu
            os
            server
            fuels {
              address
              endpoint
              reason
              value
            }
          }
          resource {
            exportApi
            bundles {
              did
              public
              type
            }
            types {
              description
              type
            }
          }
          stats {
            downloads
            purchases
            star
          }
        }
      }
      runtimeInfo {
        cpus
        cpuUsage
        memoryUsage
        pid
        port
        runningDocker
        uptime
      }
      settings {
        actionConfig
        authentication
        didConnect
        enablePassportIssuance
        enableSessionHardening
        initialized
        notification
        oauth
        publicToStore
        theme
        whoCanAccess
        aigne {
          accessKeyId
          key
          model
          provider
          secretAccessKey
          url
          validationResult
        }
        autoBackup {
          enabled
        }
        autoCheckUpdate {
          enabled
        }
        children {
          deletedAt
          deployedFrom
          mountPoint
          status
          meta {
            bundleDid
            bundleName
            description
            did
            name
            title
            version
          }
        }
        endpointList {
          appDescription
          appName
          endpoint
          id
          protected
          scope
          url
        }
        federated {
          config {
            appId
            appPid
            autoLogin
            delegation
            isMaster
          }
          sites {
            aliasDid
            aliasDomain
            appDescription
            appId
            appliedAt
            appLogo
            appLogoRect
            appName
            appPid
            appUrl
            did
            isMaster
            pk
            serverId
            serverVersion
            status
            version
          }
        }
        gateway {
          cacheEnabled
          blockPolicy {
            blacklist
            enabled
            autoBlocking {
              blockDuration
              enabled
              statusCodes
              windowQuota
              windowSize
            }
          }
          proxyPolicy {
            enabled
            realIpHeader
            trustedProxies
            trustRecursive
          }
          requestLimit {
            burstDelay
            burstFactor
            enabled
            global
            methods
            rate
          }
          wafPolicy {
            enabled
            inboundAnomalyScoreThreshold
            logLevel
            mode
            outboundAnomalyScoreThreshold
          }
        }
        invite {
          enabled
        }
        navigations {
          activeColor
          activeIcon
          color
          component
          description
          from
          icon
          id
          link
          parent
          private
          role
          section
          title
          visible
        }
        org {
          enabled
          maxMemberPerOrg
          maxOrgPerUser
        }
        owner {
          did
          pk
        }
        session {
          cacheTtl
          enableBlacklist
          salt
          ttl
          email {
            domainBlackList
            domainWhiteList
            enabled
            enableDomainBlackList
            enableDomainWhiteList
            requireUnique
            requireVerified
            trustOauthProviders
            trustedIssuers {
              id
              name
              pk
            }
          }
          phone {
            enabled
            enableRegionBlackList
            enableRegionWhiteList
            regionBlackList
            regionWhiteList
            requireUnique
            requireVerified
            trustedIssuers {
              id
              name
              pk
            }
          }
        }
        storeList {
          cdnUrl
          description
          id
          logoUrl
          maintainer
          name
          protected
          scope
          url
        }
        subService {
          domain
          enabled
          staticRoot
        }
        trustedFactories {
          factoryAddress
          holderDid
          issuerDid
          remark
          passport {
            role
            ttl
            ttlPolicy
          }
        }
        trustedPassports {
          issuerDid
          remark
          mappings {
            from {
              passport
            }
            to {
              role
              ttl
              ttlPolicy
            }
          }
        }
      }
      site {
        corsAllowedOrigins
        domain
        domainAliases
        id
        isProtected
        rules {
          id
          isProtected
          from {
            pathPrefix
            header {
              key
              type
              value
            }
          }
          to {
            componentId
            did
            interfaceName
            pageGroup
            port
            redirectCode
            type
            url
            response {
              body
              contentType
              status
            }
          }
        }
      }
      trustedFactories {
        factoryAddress
        holderDid
        issuerDid
        remark
        passport {
          role
          ttl
          ttlPolicy
        }
      }
      trustedPassports {
        issuerDid
        remark
        mappings {
          from {
            passport
          }
          to {
            role
            ttl
            ttlPolicy
          }
        }
      }
      vaults {
        approverDid
        approverPk
        approverSig
        at
        did
        pk
        sig
      }
    }
  }
}
```

### configBlocklet

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
mutation {
  configBlocklet {
    code
    blocklet {
      appDid
      appPid
      bundleSource
      createdAt
      deployedFrom
      dynamic
      enableDocker
      enableDockerNetwork
      enablePassportIssuance
      externalSk
      externalSkSource
      installedAt
      mode
      mountPoint
      pausedAt
      port
      ports
      source
      startedAt
      status
      stoppedAt
      structVersion
      updatedAt
      appRuntimeInfo {
        cpus
        cpuUsage
        memoryUsage
        pid
        port
        runningDocker
        uptime
      }
      children {
        bundleSource
        createdAt
        deployedFrom
        dynamic
        greenStatus
        installedAt
        mode
        mountPoint
        pausedAt
        port
        ports
        required
        source
        startedAt
        status
        stoppedAt
        appRuntimeInfo {
          cpus
          cpuUsage
          memoryUsage
          pid
          port
          runningDocker
          uptime
        }
        children {
          bundleSource
          createdAt
          deployedFrom
          dynamic
          greenStatus
          installedAt
          mode
          mountPoint
          pausedAt
          port
          ports
          required
          source
          startedAt
          status
          stoppedAt
          appRuntimeInfo {
            cpus
            cpuUsage
            memoryUsage
            pid
            port
            runningDocker
            uptime
          }
          children {
            bundleSource
            createdAt
            deployedFrom
            dynamic
            greenStatus
            installedAt
            mode
            mountPoint
            pausedAt
            port
            ports
            required
            source
            startedAt
            status
            stoppedAt
            appRuntimeInfo {
              cpus
              cpuUsage
              memoryUsage
              pid
              port
              runningDocker
              uptime
            }
            children {
              bundleSource
              createdAt
              deployedFrom
              dynamic
              greenStatus
              installedAt
              mode
              mountPoint
              pausedAt
              port
              ports
              required
              source
              startedAt
              status
              stoppedAt
              appRuntimeInfo {
                cpus
                cpuUsage
                memoryUsage
                pid
                port
                runningDocker
                uptime
              }
              children {
                bundleSource
                createdAt
                deployedFrom
                dynamic
                greenStatus
                installedAt
                mode
                mountPoint
                pausedAt
                port
                ports
                required
                source
                startedAt
                status
                stoppedAt
              }
              configs {
                custom
                description
                key
                required
                secure
                shared
                validation
                value
              }
              dependents {
                id
                required
              }
              diskInfo {
                app
                blocklets
                cache
                data
                log
              }
              engine {
                available
                description
                displayName
                logo
                name
                version
                visible
              }
              environments {
                custom
                description
                key
                required
                secure
                shared
                validation
                value
              }
              meta {
                bundleDid
                bundleName
                community
                description
                did
                documentation
                engine
                group
                homepage
                keywords
                lastPublishedAt
                logo
                main
                name
                navigation
                nftFactory
                path
                resources
                screenshots
                support
                title
                version
              }
              runtimeInfo {
                cpus
                cpuUsage
                memoryUsage
                pid
                port
                runningDocker
                uptime
              }
            }
            configs {
              custom
              description
              key
              required
              secure
              shared
              validation
              value
            }
            dependents {
              id
              required
            }
            diskInfo {
              app
              blocklets
              cache
              data
              log
            }
            engine {
              available
              description
              displayName
              logo
              name
              version
              visible
            }
            environments {
              custom
              description
              key
              required
              secure
              shared
              validation
              value
            }
            meta {
              bundleDid
              bundleName
              community
              description
              did
              documentation
              engine
              group
              homepage
              keywords
              lastPublishedAt
              logo
              main
              name
              navigation
              nftFactory
              path
              resources
              screenshots
              support
              title
              version
              author {
                email
                name
                url
              }
              capabilities {
                clusterMode
                component
                didSpace
                navigation
                resourceExportApi
              }
              components {
                mountPoint
                name
                required
              }
              contributors {
                email
                name
                url
              }
              dist {
                integrity
                tarball
              }
              docker {
                image
                installNodeModules
                runBaseScript
                shell
              }
              environments {
                default
                description
                name
                required
                secure
                shared
                validation
              }
              events {
                description
                type
              }
              interfaces {
                cacheable
                name
                pageGroups
                path
                port
                prefix
                protocol
                type
              }
              maintainers {
                email
                name
                url
              }
              owner {
                avatar
                did
                email
                fullName
              }
              repository {
                type
                url
              }
              requirements {
                aigne
                cpu
                os
                server
              }
              resource {
                exportApi
              }
              stats {
                downloads
                purchases
                star
              }
            }
            runtimeInfo {
              cpus
              cpuUsage
              memoryUsage
              pid
              port
              runningDocker
              uptime
            }
          }
          configs {
            custom
            description
            key
            required
            secure
            shared
            validation
            value
          }
          dependents {
            id
            required
          }
          diskInfo {
            app
            blocklets
            cache
            data
            log
          }
          engine {
            available
            description
            displayName
            logo
            name
            version
            visible
          }
          environments {
            custom
            description
            key
            required
            secure
            shared
            validation
            value
          }
          meta {
            bundleDid
            bundleName
            community
            description
            did
            documentation
            engine
            group
            homepage
            keywords
            lastPublishedAt
            logo
            main
            name
            navigation
            nftFactory
            path
            resources
            screenshots
            support
            title
            version
            author {
              email
              name
              url
            }
            capabilities {
              clusterMode
              component
              didSpace
              navigation
              resourceExportApi
            }
            components {
              mountPoint
              name
              required
            }
            contributors {
              email
              name
              url
            }
            dist {
              integrity
              tarball
            }
            docker {
              image
              installNodeModules
              runBaseScript
              shell
            }
            environments {
              default
              description
              name
              required
              secure
              shared
              validation
            }
            events {
              description
              type
            }
            interfaces {
              cacheable
              name
              pageGroups
              path
              port
              prefix
              protocol
              type
              services {
                config
                name
              }
            }
            maintainers {
              email
              name
              url
            }
            owner {
              avatar
              did
              email
              fullName
            }
            payment {
              price {
                address
                symbol
                value
              }
              share {
                address
                name
                value
              }
            }
            repository {
              type
              url
            }
            requirements {
              aigne
              cpu
              os
              server
              fuels {
                address
                endpoint
                reason
                value
              }
            }
            resource {
              exportApi
              bundles {
                did
                public
                type
              }
              types {
                description
                type
              }
            }
            stats {
              downloads
              purchases
              star
            }
          }
          runtimeInfo {
            cpus
            cpuUsage
            memoryUsage
            pid
            port
            runningDocker
            uptime
          }
        }
        configs {
          custom
          description
          key
          required
          secure
          shared
          validation
          value
        }
        dependents {
          id
          required
        }
        diskInfo {
          app
          blocklets
          cache
          data
          log
        }
        engine {
          available
          description
          displayName
          logo
          name
          version
          visible
        }
        environments {
          custom
          description
          key
          required
          secure
          shared
          validation
          value
        }
        meta {
          bundleDid
          bundleName
          community
          description
          did
          documentation
          engine
          group
          homepage
          keywords
          lastPublishedAt
          logo
          main
          name
          navigation
          nftFactory
          path
          resources
          screenshots
          support
          title
          version
          author {
            email
            name
            url
          }
          capabilities {
            clusterMode
            component
            didSpace
            navigation
            resourceExportApi
          }
          components {
            mountPoint
            name
            required
          }
          contributors {
            email
            name
            url
          }
          dist {
            integrity
            tarball
          }
          docker {
            image
            installNodeModules
            runBaseScript
            shell
          }
          environments {
            default
            description
            name
            required
            secure
            shared
            validation
          }
          events {
            description
            type
          }
          interfaces {
            cacheable
            name
            pageGroups
            path
            port
            prefix
            protocol
            type
            services {
              config
              name
            }
          }
          maintainers {
            email
            name
            url
          }
          owner {
            avatar
            did
            email
            fullName
          }
          payment {
            price {
              address
              symbol
              value
            }
            share {
              address
              name
              value
            }
          }
          repository {
            type
            url
          }
          requirements {
            aigne
            cpu
            os
            server
            fuels {
              address
              endpoint
              reason
              value
            }
          }
          resource {
            exportApi
            bundles {
              did
              public
              type
            }
            types {
              description
              type
            }
          }
          stats {
            downloads
            purchases
            star
          }
        }
        runtimeInfo {
          cpus
          cpuUsage
          memoryUsage
          pid
          port
          runningDocker
          uptime
        }
      }
      configs {
        custom
        description
        key
        required
        secure
        shared
        validation
        value
      }
      controller {
        chainHost
        consumedAt
        expireDate
        id
        launcherSessionId
        launcherUrl
        nftId
        nftOwner
        ownerDid
        status {
          reason
          value
        }
      }
      diskInfo {
        app
        blocklets
        cache
        data
        log
      }
      engine {
        available
        description
        displayName
        logo
        name
        version
        visible
      }
      environments {
        custom
        description
        key
        required
        secure
        shared
        validation
        value
      }
      meta {
        bundleDid
        bundleName
        community
        description
        did
        documentation
        engine
        group
        homepage
        keywords
        lastPublishedAt
        logo
        main
        name
        navigation
        nftFactory
        path
        resources
        screenshots
        support
        title
        version
        author {
          email
          name
          url
        }
        capabilities {
          clusterMode
          component
          didSpace
          navigation
          resourceExportApi
        }
        components {
          mountPoint
          name
          required
        }
        contributors {
          email
          name
          url
        }
        dist {
          integrity
          tarball
        }
        docker {
          image
          installNodeModules
          runBaseScript
          shell
        }
        environments {
          default
          description
          name
          required
          secure
          shared
          validation
        }
        events {
          description
          type
        }
        interfaces {
          cacheable
          name
          pageGroups
          path
          port
          prefix
          protocol
          type
          services {
            config
            name
          }
        }
        maintainers {
          email
          name
          url
        }
        owner {
          avatar
          did
          email
          fullName
        }
        payment {
          price {
            address
            symbol
            value
          }
          share {
            address
            name
            value
          }
        }
        repository {
          type
          url
        }
        requirements {
          aigne
          cpu
          os
          server
          fuels {
            address
            endpoint
            reason
            value
          }
        }
        resource {
          exportApi
          bundles {
            did
            public
            type
          }
          types {
            description
            type
          }
        }
        stats {
          downloads
          purchases
          star
        }
      }
      migratedFrom {
        appDid
        appSk
        at
      }
      optionalComponents {
        bundleSource
        logoUrl
        dependencies {
          mountPoint
          parentDid
          parentName
          parentTitle
          required
        }
        meta {
          bundleDid
          bundleName
          community
          description
          did
          documentation
          engine
          group
          homepage
          keywords
          lastPublishedAt
          logo
          main
          name
          navigation
          nftFactory
          path
          resources
          screenshots
          support
          title
          version
          author {
            email
            name
            url
          }
          capabilities {
            clusterMode
            component
            didSpace
            navigation
            resourceExportApi
          }
          components {
            mountPoint
            name
            required
          }
          contributors {
            email
            name
            url
          }
          dist {
            integrity
            tarball
          }
          docker {
            image
            installNodeModules
            runBaseScript
            shell
          }
          environments {
            default
            description
            name
            required
            secure
            shared
            validation
          }
          events {
            description
            type
          }
          interfaces {
            cacheable
            name
            pageGroups
            path
            port
            prefix
            protocol
            type
            services {
              config
              name
            }
          }
          maintainers {
            email
            name
            url
          }
          owner {
            avatar
            did
            email
            fullName
          }
          payment {
            price {
              address
              symbol
              value
            }
            share {
              address
              name
              value
            }
          }
          repository {
            type
            url
          }
          requirements {
            aigne
            cpu
            os
            server
            fuels {
              address
              endpoint
              reason
              value
            }
          }
          resource {
            exportApi
            bundles {
              did
              public
              type
            }
            types {
              description
              type
            }
          }
          stats {
            downloads
            purchases
            star
          }
        }
      }
      runtimeInfo {
        cpus
        cpuUsage
        memoryUsage
        pid
        port
        runningDocker
        uptime
      }
      settings {
        actionConfig
        authentication
        didConnect
        enablePassportIssuance
        enableSessionHardening
        initialized
        notification
        oauth
        publicToStore
        theme
        whoCanAccess
        aigne {
          accessKeyId
          key
          model
          provider
          secretAccessKey
          url
          validationResult
        }
        autoBackup {
          enabled
        }
        autoCheckUpdate {
          enabled
        }
        children {
          deletedAt
          deployedFrom
          mountPoint
          status
          meta {
            bundleDid
            bundleName
            description
            did
            name
            title
            version
          }
        }
        endpointList {
          appDescription
          appName
          endpoint
          id
          protected
          scope
          url
        }
        federated {
          config {
            appId
            appPid
            autoLogin
            delegation
            isMaster
          }
          sites {
            aliasDid
            aliasDomain
            appDescription
            appId
            appliedAt
            appLogo
            appLogoRect
            appName
            appPid
            appUrl
            did
            isMaster
            pk
            serverId
            serverVersion
            status
            version
          }
        }
        gateway {
          cacheEnabled
          blockPolicy {
            blacklist
            enabled
            autoBlocking {
              blockDuration
              enabled
              statusCodes
              windowQuota
              windowSize
            }
          }
          proxyPolicy {
            enabled
            realIpHeader
            trustedProxies
            trustRecursive
          }
          requestLimit {
            burstDelay
            burstFactor
            enabled
            global
            methods
            rate
          }
          wafPolicy {
            enabled
            inboundAnomalyScoreThreshold
            logLevel
            mode
            outboundAnomalyScoreThreshold
          }
        }
        invite {
          enabled
        }
        navigations {
          activeColor
          activeIcon
          color
          component
          description
          from
          icon
          id
          link
          parent
          private
          role
          section
          title
          visible
        }
        org {
          enabled
          maxMemberPerOrg
          maxOrgPerUser
        }
        owner {
          did
          pk
        }
        session {
          cacheTtl
          enableBlacklist
          salt
          ttl
          email {
            domainBlackList
            domainWhiteList
            enabled
            enableDomainBlackList
            enableDomainWhiteList
            requireUnique
            requireVerified
            trustOauthProviders
            trustedIssuers {
              id
              name
              pk
            }
          }
          phone {
            enabled
            enableRegionBlackList
            enableRegionWhiteList
            regionBlackList
            regionWhiteList
            requireUnique
            requireVerified
            trustedIssuers {
              id
              name
              pk
            }
          }
        }
        storeList {
          cdnUrl
          description
          id
          logoUrl
          maintainer
          name
          protected
          scope
          url
        }
        subService {
          domain
          enabled
          staticRoot
        }
        trustedFactories {
          factoryAddress
          holderDid
          issuerDid
          remark
          passport {
            role
            ttl
            ttlPolicy
          }
        }
        trustedPassports {
          issuerDid
          remark
          mappings {
            from {
              passport
            }
            to {
              role
              ttl
              ttlPolicy
            }
          }
        }
      }
      site {
        corsAllowedOrigins
        domain
        domainAliases
        id
        isProtected
        rules {
          id
          isProtected
          from {
            pathPrefix
            header {
              key
              type
              value
            }
          }
          to {
            componentId
            did
            interfaceName
            pageGroup
            port
            redirectCode
            type
            url
            response {
              body
              contentType
              status
            }
          }
        }
      }
      trustedFactories {
        factoryAddress
        holderDid
        issuerDid
        remark
        passport {
          role
          ttl
          ttlPolicy
        }
      }
      trustedPassports {
        issuerDid
        remark
        mappings {
          from {
            passport
          }
          to {
            role
            ttl
            ttlPolicy
          }
        }
      }
      vaults {
        approverDid
        approverPk
        approverSig
        at
        did
        pk
        sig
      }
    }
  }
}
```

### configPublicToStore

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
mutation {
  configPublicToStore {
    code
    blocklet {
      appDid
      appPid
      bundleSource
      createdAt
      deployedFrom
      dynamic
      enableDocker
      enableDockerNetwork
      enablePassportIssuance
      externalSk
      externalSkSource
      installedAt
      mode
      mountPoint
      pausedAt
      port
      ports
      source
      startedAt
      status
      stoppedAt
      structVersion
      updatedAt
      appRuntimeInfo {
        cpus
        cpuUsage
        memoryUsage
        pid
        port
        runningDocker
        uptime
      }
      children {
        bundleSource
        createdAt
        deployedFrom
        dynamic
        greenStatus
        installedAt
        mode
        mountPoint
        pausedAt
        port
        ports
        required
        source
        startedAt
        status
        stoppedAt
        appRuntimeInfo {
          cpus
          cpuUsage
          memoryUsage
          pid
          port
          runningDocker
          uptime
        }
        children {
          bundleSource
          createdAt
          deployedFrom
          dynamic
          greenStatus
          installedAt
          mode
          mountPoint
          pausedAt
          port
          ports
          required
          source
          startedAt
          status
          stoppedAt
          appRuntimeInfo {
            cpus
            cpuUsage
            memoryUsage
            pid
            port
            runningDocker
            uptime
          }
          children {
            bundleSource
            createdAt
            deployedFrom
            dynamic
            greenStatus
            installedAt
            mode
            mountPoint
            pausedAt
            port
            ports
            required
            source
            startedAt
            status
            stoppedAt
            appRuntimeInfo {
              cpus
              cpuUsage
              memoryUsage
              pid
              port
              runningDocker
              uptime
            }
            children {
              bundleSource
              createdAt
              deployedFrom
              dynamic
              greenStatus
              installedAt
              mode
              mountPoint
              pausedAt
              port
              ports
              required
              source
              startedAt
              status
              stoppedAt
              appRuntimeInfo {
                cpus
                cpuUsage
                memoryUsage
                pid
                port
                runningDocker
                uptime
              }
              children {
                bundleSource
                createdAt
                deployedFrom
                dynamic
                greenStatus
                installedAt
                mode
                mountPoint
                pausedAt
                port
                ports
                required
                source
                startedAt
                status
                stoppedAt
              }
              configs {
                custom
                description
                key
                required
                secure
                shared
                validation
                value
              }
              dependents {
                id
                required
              }
              diskInfo {
                app
                blocklets
                cache
                data
                log
              }
              engine {
                available
                description
                displayName
                logo
                name
                version
                visible
              }
              environments {
                custom
                description
                key
                required
                secure
                shared
                validation
                value
              }
              meta {
                bundleDid
                bundleName
                community
                description
                did
                documentation
                engine
                group
                homepage
                keywords
                lastPublishedAt
                logo
                main
                name
                navigation
                nftFactory
                path
                resources
                screenshots
                support
                title
                version
              }
              runtimeInfo {
                cpus
                cpuUsage
                memoryUsage
                pid
                port
                runningDocker
                uptime
              }
            }
            configs {
              custom
              description
              key
              required
              secure
              shared
              validation
              value
            }
            dependents {
              id
              required
            }
            diskInfo {
              app
              blocklets
              cache
              data
              log
            }
            engine {
              available
              description
              displayName
              logo
              name
              version
              visible
            }
            environments {
              custom
              description
              key
              required
              secure
              shared
              validation
              value
            }
            meta {
              bundleDid
              bundleName
              community
              description
              did
              documentation
              engine
              group
              homepage
              keywords
              lastPublishedAt
              logo
              main
              name
              navigation
              nftFactory
              path
              resources
              screenshots
              support
              title
              version
              author {
                email
                name
                url
              }
              capabilities {
                clusterMode
                component
                didSpace
                navigation
                resourceExportApi
              }
              components {
                mountPoint
                name
                required
              }
              contributors {
                email
                name
                url
              }
              dist {
                integrity
                tarball
              }
              docker {
                image
                installNodeModules
                runBaseScript
                shell
              }
              environments {
                default
                description
                name
                required
                secure
                shared
                validation
              }
              events {
                description
                type
              }
              interfaces {
                cacheable
                name
                pageGroups
                path
                port
                prefix
                protocol
                type
              }
              maintainers {
                email
                name
                url
              }
              owner {
                avatar
                did
                email
                fullName
              }
              repository {
                type
                url
              }
              requirements {
                aigne
                cpu
                os
                server
              }
              resource {
                exportApi
              }
              stats {
                downloads
                purchases
                star
              }
            }
            runtimeInfo {
              cpus
              cpuUsage
              memoryUsage
              pid
              port
              runningDocker
              uptime
            }
          }
          configs {
            custom
            description
            key
            required
            secure
            shared
            validation
            value
          }
          dependents {
            id
            required
          }
          diskInfo {
            app
            blocklets
            cache
            data
            log
          }
          engine {
            available
            description
            displayName
            logo
            name
            version
            visible
          }
          environments {
            custom
            description
            key
            required
            secure
            shared
            validation
            value
          }
          meta {
            bundleDid
            bundleName
            community
            description
            did
            documentation
            engine
            group
            homepage
            keywords
            lastPublishedAt
            logo
            main
            name
            navigation
            nftFactory
            path
            resources
            screenshots
            support
            title
            version
            author {
              email
              name
              url
            }
            capabilities {
              clusterMode
              component
              didSpace
              navigation
              resourceExportApi
            }
            components {
              mountPoint
              name
              required
            }
            contributors {
              email
              name
              url
            }
            dist {
              integrity
              tarball
            }
            docker {
              image
              installNodeModules
              runBaseScript
              shell
            }
            environments {
              default
              description
              name
              required
              secure
              shared
              validation
            }
            events {
              description
              type
            }
            interfaces {
              cacheable
              name
              pageGroups
              path
              port
              prefix
              protocol
              type
              services {
                config
                name
              }
            }
            maintainers {
              email
              name
              url
            }
            owner {
              avatar
              did
              email
              fullName
            }
            payment {
              price {
                address
                symbol
                value
              }
              share {
                address
                name
                value
              }
            }
            repository {
              type
              url
            }
            requirements {
              aigne
              cpu
              os
              server
              fuels {
                address
                endpoint
                reason
                value
              }
            }
            resource {
              exportApi
              bundles {
                did
                public
                type
              }
              types {
                description
                type
              }
            }
            stats {
              downloads
              purchases
              star
            }
          }
          runtimeInfo {
            cpus
            cpuUsage
            memoryUsage
            pid
            port
            runningDocker
            uptime
          }
        }
        configs {
          custom
          description
          key
          required
          secure
          shared
          validation
          value
        }
        dependents {
          id
          required
        }
        diskInfo {
          app
          blocklets
          cache
          data
          log
        }
        engine {
          available
          description
          displayName
          logo
          name
          version
          visible
        }
        environments {
          custom
          description
          key
          required
          secure
          shared
          validation
          value
        }
        meta {
          bundleDid
          bundleName
          community
          description
          did
          documentation
          engine
          group
          homepage
          keywords
          lastPublishedAt
          logo
          main
          name
          navigation
          nftFactory
          path
          resources
          screenshots
          support
          title
          version
          author {
            email
            name
            url
          }
          capabilities {
            clusterMode
            component
            didSpace
            navigation
            resourceExportApi
          }
          components {
            mountPoint
            name
            required
          }
          contributors {
            email
            name
            url
          }
          dist {
            integrity
            tarball
          }
          docker {
            image
            installNodeModules
            runBaseScript
            shell
          }
          environments {
            default
            description
            name
            required
            secure
            shared
            validation
          }
          events {
            description
            type
          }
          interfaces {
            cacheable
            name
            pageGroups
            path
            port
            prefix
            protocol
            type
            services {
              config
              name
            }
          }
          maintainers {
            email
            name
            url
          }
          owner {
            avatar
            did
            email
            fullName
          }
          payment {
            price {
              address
              symbol
              value
            }
            share {
              address
              name
              value
            }
          }
          repository {
            type
            url
          }
          requirements {
            aigne
            cpu
            os
            server
            fuels {
              address
              endpoint
              reason
              value
            }
          }
          resource {
            exportApi
            bundles {
              did
              public
              type
            }
            types {
              description
              type
            }
          }
          stats {
            downloads
            purchases
            star
          }
        }
        runtimeInfo {
          cpus
          cpuUsage
          memoryUsage
          pid
          port
          runningDocker
          uptime
        }
      }
      configs {
        custom
        description
        key
        required
        secure
        shared
        validation
        value
      }
      controller {
        chainHost
        consumedAt
        expireDate
        id
        launcherSessionId
        launcherUrl
        nftId
        nftOwner
        ownerDid
        status {
          reason
          value
        }
      }
      diskInfo {
        app
        blocklets
        cache
        data
        log
      }
      engine {
        available
        description
        displayName
        logo
        name
        version
        visible
      }
      environments {
        custom
        description
        key
        required
        secure
        shared
        validation
        value
      }
      meta {
        bundleDid
        bundleName
        community
        description
        did
        documentation
        engine
        group
        homepage
        keywords
        lastPublishedAt
        logo
        main
        name
        navigation
        nftFactory
        path
        resources
        screenshots
        support
        title
        version
        author {
          email
          name
          url
        }
        capabilities {
          clusterMode
          component
          didSpace
          navigation
          resourceExportApi
        }
        components {
          mountPoint
          name
          required
        }
        contributors {
          email
          name
          url
        }
        dist {
          integrity
          tarball
        }
        docker {
          image
          installNodeModules
          runBaseScript
          shell
        }
        environments {
          default
          description
          name
          required
          secure
          shared
          validation
        }
        events {
          description
          type
        }
        interfaces {
          cacheable
          name
          pageGroups
          path
          port
          prefix
          protocol
          type
          services {
            config
            name
          }
        }
        maintainers {
          email
          name
          url
        }
        owner {
          avatar
          did
          email
          fullName
        }
        payment {
          price {
            address
            symbol
            value
          }
          share {
            address
            name
            value
          }
        }
        repository {
          type
          url
        }
        requirements {
          aigne
          cpu
          os
          server
          fuels {
            address
            endpoint
            reason
            value
          }
        }
        resource {
          exportApi
          bundles {
            did
            public
            type
          }
          types {
            description
            type
          }
        }
        stats {
          downloads
          purchases
          star
        }
      }
      migratedFrom {
        appDid
        appSk
        at
      }
      optionalComponents {
        bundleSource
        logoUrl
        dependencies {
          mountPoint
          parentDid
          parentName
          parentTitle
          required
        }
        meta {
          bundleDid
          bundleName
          community
          description
          did
          documentation
          engine
          group
          homepage
          keywords
          lastPublishedAt
          logo
          main
          name
          navigation
          nftFactory
          path
          resources
          screenshots
          support
          title
          version
          author {
            email
            name
            url
          }
          capabilities {
            clusterMode
            component
            didSpace
            navigation
            resourceExportApi
          }
          components {
            mountPoint
            name
            required
          }
          contributors {
            email
            name
            url
          }
          dist {
            integrity
            tarball
          }
          docker {
            image
            installNodeModules
            runBaseScript
            shell
          }
          environments {
            default
            description
            name
            required
            secure
            shared
            validation
          }
          events {
            description
            type
          }
          interfaces {
            cacheable
            name
            pageGroups
            path
            port
            prefix
            protocol
            type
            services {
              config
              name
            }
          }
          maintainers {
            email
            name
            url
          }
          owner {
            avatar
            did
            email
            fullName
          }
          payment {
            price {
              address
              symbol
              value
            }
            share {
              address
              name
              value
            }
          }
          repository {
            type
            url
          }
          requirements {
            aigne
            cpu
            os
            server
            fuels {
              address
              endpoint
              reason
              value
            }
          }
          resource {
            exportApi
            bundles {
              did
              public
              type
            }
            types {
              description
              type
            }
          }
          stats {
            downloads
            purchases
            star
          }
        }
      }
      runtimeInfo {
        cpus
        cpuUsage
        memoryUsage
        pid
        port
        runningDocker
        uptime
      }
      settings {
        actionConfig
        authentication
        didConnect
        enablePassportIssuance
        enableSessionHardening
        initialized
        notification
        oauth
        publicToStore
        theme
        whoCanAccess
        aigne {
          accessKeyId
          key
          model
          provider
          secretAccessKey
          url
          validationResult
        }
        autoBackup {
          enabled
        }
        autoCheckUpdate {
          enabled
        }
        children {
          deletedAt
          deployedFrom
          mountPoint
          status
          meta {
            bundleDid
            bundleName
            description
            did
            name
            title
            version
          }
        }
        endpointList {
          appDescription
          appName
          endpoint
          id
          protected
          scope
          url
        }
        federated {
          config {
            appId
            appPid
            autoLogin
            delegation
            isMaster
          }
          sites {
            aliasDid
            aliasDomain
            appDescription
            appId
            appliedAt
            appLogo
            appLogoRect
            appName
            appPid
            appUrl
            did
            isMaster
            pk
            serverId
            serverVersion
            status
            version
          }
        }
        gateway {
          cacheEnabled
          blockPolicy {
            blacklist
            enabled
            autoBlocking {
              blockDuration
              enabled
              statusCodes
              windowQuota
              windowSize
            }
          }
          proxyPolicy {
            enabled
            realIpHeader
            trustedProxies
            trustRecursive
          }
          requestLimit {
            burstDelay
            burstFactor
            enabled
            global
            methods
            rate
          }
          wafPolicy {
            enabled
            inboundAnomalyScoreThreshold
            logLevel
            mode
            outboundAnomalyScoreThreshold
          }
        }
        invite {
          enabled
        }
        navigations {
          activeColor
          activeIcon
          color
          component
          description
          from
          icon
          id
          link
          parent
          private
          role
          section
          title
          visible
        }
        org {
          enabled
          maxMemberPerOrg
          maxOrgPerUser
        }
        owner {
          did
          pk
        }
        session {
          cacheTtl
          enableBlacklist
          salt
          ttl
          email {
            domainBlackList
            domainWhiteList
            enabled
            enableDomainBlackList
            enableDomainWhiteList
            requireUnique
            requireVerified
            trustOauthProviders
            trustedIssuers {
              id
              name
              pk
            }
          }
          phone {
            enabled
            enableRegionBlackList
            enableRegionWhiteList
            regionBlackList
            regionWhiteList
            requireUnique
            requireVerified
            trustedIssuers {
              id
              name
              pk
            }
          }
        }
        storeList {
          cdnUrl
          description
          id
          logoUrl
          maintainer
          name
          protected
          scope
          url
        }
        subService {
          domain
          enabled
          staticRoot
        }
        trustedFactories {
          factoryAddress
          holderDid
          issuerDid
          remark
          passport {
            role
            ttl
            ttlPolicy
          }
        }
        trustedPassports {
          issuerDid
          remark
          mappings {
            from {
              passport
            }
            to {
              role
              ttl
              ttlPolicy
            }
          }
        }
      }
      site {
        corsAllowedOrigins
        domain
        domainAliases
        id
        isProtected
        rules {
          id
          isProtected
          from {
            pathPrefix
            header {
              key
              type
              value
            }
          }
          to {
            componentId
            did
            interfaceName
            pageGroup
            port
            redirectCode
            type
            url
            response {
              body
              contentType
              status
            }
          }
        }
      }
      trustedFactories {
        factoryAddress
        holderDid
        issuerDid
        remark
        passport {
          role
          ttl
          ttlPolicy
        }
      }
      trustedPassports {
        issuerDid
        remark
        mappings {
          from {
            passport
          }
          to {
            role
            ttl
            ttlPolicy
          }
        }
      }
      vaults {
        approverDid
        approverPk
        approverSig
        at
        did
        pk
        sig
      }
    }
  }
}
```

### configNavigations

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
mutation {
  configNavigations {
    code
    blocklet {
      appDid
      appPid
      bundleSource
      createdAt
      deployedFrom
      dynamic
      enableDocker
      enableDockerNetwork
      enablePassportIssuance
      externalSk
      externalSkSource
      installedAt
      mode
      mountPoint
      pausedAt
      port
      ports
      source
      startedAt
      status
      stoppedAt
      structVersion
      updatedAt
      appRuntimeInfo {
        cpus
        cpuUsage
        memoryUsage
        pid
        port
        runningDocker
        uptime
      }
      children {
        bundleSource
        createdAt
        deployedFrom
        dynamic
        greenStatus
        installedAt
        mode
        mountPoint
        pausedAt
        port
        ports
        required
        source
        startedAt
        status
        stoppedAt
        appRuntimeInfo {
          cpus
          cpuUsage
          memoryUsage
          pid
          port
          runningDocker
          uptime
        }
        children {
          bundleSource
          createdAt
          deployedFrom
          dynamic
          greenStatus
          installedAt
          mode
          mountPoint
          pausedAt
          port
          ports
          required
          source
          startedAt
          status
          stoppedAt
          appRuntimeInfo {
            cpus
            cpuUsage
            memoryUsage
            pid
            port
            runningDocker
            uptime
          }
          children {
            bundleSource
            createdAt
            deployedFrom
            dynamic
            greenStatus
            installedAt
            mode
            mountPoint
            pausedAt
            port
            ports
            required
            source
            startedAt
            status
            stoppedAt
            appRuntimeInfo {
              cpus
              cpuUsage
              memoryUsage
              pid
              port
              runningDocker
              uptime
            }
            children {
              bundleSource
              createdAt
              deployedFrom
              dynamic
              greenStatus
              installedAt
              mode
              mountPoint
              pausedAt
              port
              ports
              required
              source
              startedAt
              status
              stoppedAt
              appRuntimeInfo {
                cpus
                cpuUsage
                memoryUsage
                pid
                port
                runningDocker
                uptime
              }
              children {
                bundleSource
                createdAt
                deployedFrom
                dynamic
                greenStatus
                installedAt
                mode
                mountPoint
                pausedAt
                port
                ports
                required
                source
                startedAt
                status
                stoppedAt
              }
              configs {
                custom
                description
                key
                required
                secure
                shared
                validation
                value
              }
              dependents {
                id
                required
              }
              diskInfo {
                app
                blocklets
                cache
                data
                log
              }
              engine {
                available
                description
                displayName
                logo
                name
                version
                visible
              }
              environments {
                custom
                description
                key
                required
                secure
                shared
                validation
                value
              }
              meta {
                bundleDid
                bundleName
                community
                description
                did
                documentation
                engine
                group
                homepage
                keywords
                lastPublishedAt
                logo
                main
                name
                navigation
                nftFactory
                path
                resources
                screenshots
                support
                title
                version
              }
              runtimeInfo {
                cpus
                cpuUsage
                memoryUsage
                pid
                port
                runningDocker
                uptime
              }
            }
            configs {
              custom
              description
              key
              required
              secure
              shared
              validation
              value
            }
            dependents {
              id
              required
            }
            diskInfo {
              app
              blocklets
              cache
              data
              log
            }
            engine {
              available
              description
              displayName
              logo
              name
              version
              visible
            }
            environments {
              custom
              description
              key
              required
              secure
              shared
              validation
              value
            }
            meta {
              bundleDid
              bundleName
              community
              description
              did
              documentation
              engine
              group
              homepage
              keywords
              lastPublishedAt
              logo
              main
              name
              navigation
              nftFactory
              path
              resources
              screenshots
              support
              title
              version
              author {
                email
                name
                url
              }
              capabilities {
                clusterMode
                component
                didSpace
                navigation
                resourceExportApi
              }
              components {
                mountPoint
                name
                required
              }
              contributors {
                email
                name
                url
              }
              dist {
                integrity
                tarball
              }
              docker {
                image
                installNodeModules
                runBaseScript
                shell
              }
              environments {
                default
                description
                name
                required
                secure
                shared
                validation
              }
              events {
                description
                type
              }
              interfaces {
                cacheable
                name
                pageGroups
                path
                port
                prefix
                protocol
                type
              }
              maintainers {
                email
                name
                url
              }
              owner {
                avatar
                did
                email
                fullName
              }
              repository {
                type
                url
              }
              requirements {
                aigne
                cpu
                os
                server
              }
              resource {
                exportApi
              }
              stats {
                downloads
                purchases
                star
              }
            }
            runtimeInfo {
              cpus
              cpuUsage
              memoryUsage
              pid
              port
              runningDocker
              uptime
            }
          }
          configs {
            custom
            description
            key
            required
            secure
            shared
            validation
            value
          }
          dependents {
            id
            required
          }
          diskInfo {
            app
            blocklets
            cache
            data
            log
          }
          engine {
            available
            description
            displayName
            logo
            name
            version
            visible
          }
          environments {
            custom
            description
            key
            required
            secure
            shared
            validation
            value
          }
          meta {
            bundleDid
            bundleName
            community
            description
            did
            documentation
            engine
            group
            homepage
            keywords
            lastPublishedAt
            logo
            main
            name
            navigation
            nftFactory
            path
            resources
            screenshots
            support
            title
            version
            author {
              email
              name
              url
            }
            capabilities {
              clusterMode
              component
              didSpace
              navigation
              resourceExportApi
            }
            components {
              mountPoint
              name
              required
            }
            contributors {
              email
              name
              url
            }
            dist {
              integrity
              tarball
            }
            docker {
              image
              installNodeModules
              runBaseScript
              shell
            }
            environments {
              default
              description
              name
              required
              secure
              shared
              validation
            }
            events {
              description
              type
            }
            interfaces {
              cacheable
              name
              pageGroups
              path
              port
              prefix
              protocol
              type
              services {
                config
                name
              }
            }
            maintainers {
              email
              name
              url
            }
            owner {
              avatar
              did
              email
              fullName
            }
            payment {
              price {
                address
                symbol
                value
              }
              share {
                address
                name
                value
              }
            }
            repository {
              type
              url
            }
            requirements {
              aigne
              cpu
              os
              server
              fuels {
                address
                endpoint
                reason
                value
              }
            }
            resource {
              exportApi
              bundles {
                did
                public
                type
              }
              types {
                description
                type
              }
            }
            stats {
              downloads
              purchases
              star
            }
          }
          runtimeInfo {
            cpus
            cpuUsage
            memoryUsage
            pid
            port
            runningDocker
            uptime
          }
        }
        configs {
          custom
          description
          key
          required
          secure
          shared
          validation
          value
        }
        dependents {
          id
          required
        }
        diskInfo {
          app
          blocklets
          cache
          data
          log
        }
        engine {
          available
          description
          displayName
          logo
          name
          version
          visible
        }
        environments {
          custom
          description
          key
          required
          secure
          shared
          validation
          value
        }
        meta {
          bundleDid
          bundleName
          community
          description
          did
          documentation
          engine
          group
          homepage
          keywords
          lastPublishedAt
          logo
          main
          name
          navigation
          nftFactory
          path
          resources
          screenshots
          support
          title
          version
          author {
            email
            name
            url
          }
          capabilities {
            clusterMode
            component
            didSpace
            navigation
            resourceExportApi
          }
          components {
            mountPoint
            name
            required
          }
          contributors {
            email
            name
            url
          }
          dist {
            integrity
            tarball
          }
          docker {
            image
            installNodeModules
            runBaseScript
            shell
          }
          environments {
            default
            description
            name
            required
            secure
            shared
            validation
          }
          events {
            description
            type
          }
          interfaces {
            cacheable
            name
            pageGroups
            path
            port
            prefix
            protocol
            type
            services {
              config
              name
            }
          }
          maintainers {
            email
            name
            url
          }
          owner {
            avatar
            did
            email
            fullName
          }
          payment {
            price {
              address
              symbol
              value
            }
            share {
              address
              name
              value
            }
          }
          repository {
            type
            url
          }
          requirements {
            aigne
            cpu
            os
            server
            fuels {
              address
              endpoint
              reason
              value
            }
          }
          resource {
            exportApi
            bundles {
              did
              public
              type
            }
            types {
              description
              type
            }
          }
          stats {
            downloads
            purchases
            star
          }
        }
        runtimeInfo {
          cpus
          cpuUsage
          memoryUsage
          pid
          port
          runningDocker
          uptime
        }
      }
      configs {
        custom
        description
        key
        required
        secure
        shared
        validation
        value
      }
      controller {
        chainHost
        consumedAt
        expireDate
        id
        launcherSessionId
        launcherUrl
        nftId
        nftOwner
        ownerDid
        status {
          reason
          value
        }
      }
      diskInfo {
        app
        blocklets
        cache
        data
        log
      }
      engine {
        available
        description
        displayName
        logo
        name
        version
        visible
      }
      environments {
        custom
        description
        key
        required
        secure
        shared
        validation
        value
      }
      meta {
        bundleDid
        bundleName
        community
        description
        did
        documentation
        engine
        group
        homepage
        keywords
        lastPublishedAt
        logo
        main
        name
        navigation
        nftFactory
        path
        resources
        screenshots
        support
        title
        version
        author {
          email
          name
          url
        }
        capabilities {
          clusterMode
          component
          didSpace
          navigation
          resourceExportApi
        }
        components {
          mountPoint
          name
          required
        }
        contributors {
          email
          name
          url
        }
        dist {
          integrity
          tarball
        }
        docker {
          image
          installNodeModules
          runBaseScript
          shell
        }
        environments {
          default
          description
          name
          required
          secure
          shared
          validation
        }
        events {
          description
          type
        }
        interfaces {
          cacheable
          name
          pageGroups
          path
          port
          prefix
          protocol
          type
          services {
            config
            name
          }
        }
        maintainers {
          email
          name
          url
        }
        owner {
          avatar
          did
          email
          fullName
        }
        payment {
          price {
            address
            symbol
            value
          }
          share {
            address
            name
            value
          }
        }
        repository {
          type
          url
        }
        requirements {
          aigne
          cpu
          os
          server
          fuels {
            address
            endpoint
            reason
            value
          }
        }
        resource {
          exportApi
          bundles {
            did
            public
            type
          }
          types {
            description
            type
          }
        }
        stats {
          downloads
          purchases
          star
        }
      }
      migratedFrom {
        appDid
        appSk
        at
      }
      optionalComponents {
        bundleSource
        logoUrl
        dependencies {
          mountPoint
          parentDid
          parentName
          parentTitle
          required
        }
        meta {
          bundleDid
          bundleName
          community
          description
          did
          documentation
          engine
          group
          homepage
          keywords
          lastPublishedAt
          logo
          main
          name
          navigation
          nftFactory
          path
          resources
          screenshots
          support
          title
          version
          author {
            email
            name
            url
          }
          capabilities {
            clusterMode
            component
            didSpace
            navigation
            resourceExportApi
          }
          components {
            mountPoint
            name
            required
          }
          contributors {
            email
            name
            url
          }
          dist {
            integrity
            tarball
          }
          docker {
            image
            installNodeModules
            runBaseScript
            shell
          }
          environments {
            default
            description
            name
            required
            secure
            shared
            validation
          }
          events {
            description
            type
          }
          interfaces {
            cacheable
            name
            pageGroups
            path
            port
            prefix
            protocol
            type
            services {
              config
              name
            }
          }
          maintainers {
            email
            name
            url
          }
          owner {
            avatar
            did
            email
            fullName
          }
          payment {
            price {
              address
              symbol
              value
            }
            share {
              address
              name
              value
            }
          }
          repository {
            type
            url
          }
          requirements {
            aigne
            cpu
            os
            server
            fuels {
              address
              endpoint
              reason
              value
            }
          }
          resource {
            exportApi
            bundles {
              did
              public
              type
            }
            types {
              description
              type
            }
          }
          stats {
            downloads
            purchases
            star
          }
        }
      }
      runtimeInfo {
        cpus
        cpuUsage
        memoryUsage
        pid
        port
        runningDocker
        uptime
      }
      settings {
        actionConfig
        authentication
        didConnect
        enablePassportIssuance
        enableSessionHardening
        initialized
        notification
        oauth
        publicToStore
        theme
        whoCanAccess
        aigne {
          accessKeyId
          key
          model
          provider
          secretAccessKey
          url
          validationResult
        }
        autoBackup {
          enabled
        }
        autoCheckUpdate {
          enabled
        }
        children {
          deletedAt
          deployedFrom
          mountPoint
          status
          meta {
            bundleDid
            bundleName
            description
            did
            name
            title
            version
          }
        }
        endpointList {
          appDescription
          appName
          endpoint
          id
          protected
          scope
          url
        }
        federated {
          config {
            appId
            appPid
            autoLogin
            delegation
            isMaster
          }
          sites {
            aliasDid
            aliasDomain
            appDescription
            appId
            appliedAt
            appLogo
            appLogoRect
            appName
            appPid
            appUrl
            did
            isMaster
            pk
            serverId
            serverVersion
            status
            version
          }
        }
        gateway {
          cacheEnabled
          blockPolicy {
            blacklist
            enabled
            autoBlocking {
              blockDuration
              enabled
              statusCodes
              windowQuota
              windowSize
            }
          }
          proxyPolicy {
            enabled
            realIpHeader
            trustedProxies
            trustRecursive
          }
          requestLimit {
            burstDelay
            burstFactor
            enabled
            global
            methods
            rate
          }
          wafPolicy {
            enabled
            inboundAnomalyScoreThreshold
            logLevel
            mode
            outboundAnomalyScoreThreshold
          }
        }
        invite {
          enabled
        }
        navigations {
          activeColor
          activeIcon
          color
          component
          description
          from
          icon
          id
          link
          parent
          private
          role
          section
          title
          visible
        }
        org {
          enabled
          maxMemberPerOrg
          maxOrgPerUser
        }
        owner {
          did
          pk
        }
        session {
          cacheTtl
          enableBlacklist
          salt
          ttl
          email {
            domainBlackList
            domainWhiteList
            enabled
            enableDomainBlackList
            enableDomainWhiteList
            requireUnique
            requireVerified
            trustOauthProviders
            trustedIssuers {
              id
              name
              pk
            }
          }
          phone {
            enabled
            enableRegionBlackList
            enableRegionWhiteList
            regionBlackList
            regionWhiteList
            requireUnique
            requireVerified
            trustedIssuers {
              id
              name
              pk
            }
          }
        }
        storeList {
          cdnUrl
          description
          id
          logoUrl
          maintainer
          name
          protected
          scope
          url
        }
        subService {
          domain
          enabled
          staticRoot
        }
        trustedFactories {
          factoryAddress
          holderDid
          issuerDid
          remark
          passport {
            role
            ttl
            ttlPolicy
          }
        }
        trustedPassports {
          issuerDid
          remark
          mappings {
            from {
              passport
            }
            to {
              role
              ttl
              ttlPolicy
            }
          }
        }
      }
      site {
        corsAllowedOrigins
        domain
        domainAliases
        id
        isProtected
        rules {
          id
          isProtected
          from {
            pathPrefix
            header {
              key
              type
              value
            }
          }
          to {
            componentId
            did
            interfaceName
            pageGroup
            port
            redirectCode
            type
            url
            response {
              body
              contentType
              status
            }
          }
        }
      }
      trustedFactories {
        factoryAddress
        holderDid
        issuerDid
        remark
        passport {
          role
          ttl
          ttlPolicy
        }
      }
      trustedPassports {
        issuerDid
        remark
        mappings {
          from {
            passport
          }
          to {
            role
            ttl
            ttlPolicy
          }
        }
      }
      vaults {
        approverDid
        approverPk
        approverSig
        at
        did
        pk
        sig
      }
    }
  }
}
```

### configAuthentication

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
mutation {
  configAuthentication {
    code
    blocklet {
      appDid
      appPid
      bundleSource
      createdAt
      deployedFrom
      dynamic
      enableDocker
      enableDockerNetwork
      enablePassportIssuance
      externalSk
      externalSkSource
      installedAt
      mode
      mountPoint
      pausedAt
      port
      ports
      source
      startedAt
      status
      stoppedAt
      structVersion
      updatedAt
      appRuntimeInfo {
        cpus
        cpuUsage
        memoryUsage
        pid
        port
        runningDocker
        uptime
      }
      children {
        bundleSource
        createdAt
        deployedFrom
        dynamic
        greenStatus
        installedAt
        mode
        mountPoint
        pausedAt
        port
        ports
        required
        source
        startedAt
        status
        stoppedAt
        appRuntimeInfo {
          cpus
          cpuUsage
          memoryUsage
          pid
          port
          runningDocker
          uptime
        }
        children {
          bundleSource
          createdAt
          deployedFrom
          dynamic
          greenStatus
          installedAt
          mode
          mountPoint
          pausedAt
          port
          ports
          required
          source
          startedAt
          status
          stoppedAt
          appRuntimeInfo {
            cpus
            cpuUsage
            memoryUsage
            pid
            port
            runningDocker
            uptime
          }
          children {
            bundleSource
            createdAt
            deployedFrom
            dynamic
            greenStatus
            installedAt
            mode
            mountPoint
            pausedAt
            port
            ports
            required
            source
            startedAt
            status
            stoppedAt
            appRuntimeInfo {
              cpus
              cpuUsage
              memoryUsage
              pid
              port
              runningDocker
              uptime
            }
            children {
              bundleSource
              createdAt
              deployedFrom
              dynamic
              greenStatus
              installedAt
              mode
              mountPoint
              pausedAt
              port
              ports
              required
              source
              startedAt
              status
              stoppedAt
              appRuntimeInfo {
                cpus
                cpuUsage
                memoryUsage
                pid
                port
                runningDocker
                uptime
              }
              children {
                bundleSource
                createdAt
                deployedFrom
                dynamic
                greenStatus
                installedAt
                mode
                mountPoint
                pausedAt
                port
                ports
                required
                source
                startedAt
                status
                stoppedAt
              }
              configs {
                custom
                description
                key
                required
                secure
                shared
                validation
                value
              }
              dependents {
                id
                required
              }
              diskInfo {
                app
                blocklets
                cache
                data
                log
              }
              engine {
                available
                description
                displayName
                logo
                name
                version
                visible
              }
              environments {
                custom
                description
                key
                required
                secure
                shared
                validation
                value
              }
              meta {
                bundleDid
                bundleName
                community
                description
                did
                documentation
                engine
                group
                homepage
                keywords
                lastPublishedAt
                logo
                main
                name
                navigation
                nftFactory
                path
                resources
                screenshots
                support
                title
                version
              }
              runtimeInfo {
                cpus
                cpuUsage
                memoryUsage
                pid
                port
                runningDocker
                uptime
              }
            }
            configs {
              custom
              description
              key
              required
              secure
              shared
              validation
              value
            }
            dependents {
              id
              required
            }
            diskInfo {
              app
              blocklets
              cache
              data
              log
            }
            engine {
              available
              description
              displayName
              logo
              name
              version
              visible
            }
            environments {
              custom
              description
              key
              required
              secure
              shared
              validation
              value
            }
            meta {
              bundleDid
              bundleName
              community
              description
              did
              documentation
              engine
              group
              homepage
              keywords
              lastPublishedAt
              logo
              main
              name
              navigation
              nftFactory
              path
              resources
              screenshots
              support
              title
              version
              author {
                email
                name
                url
              }
              capabilities {
                clusterMode
                component
                didSpace
                navigation
                resourceExportApi
              }
              components {
                mountPoint
                name
                required
              }
              contributors {
                email
                name
                url
              }
              dist {
                integrity
                tarball
              }
              docker {
                image
                installNodeModules
                runBaseScript
                shell
              }
              environments {
                default
                description
                name
                required
                secure
                shared
                validation
              }
              events {
                description
                type
              }
              interfaces {
                cacheable
                name
                pageGroups
                path
                port
                prefix
                protocol
                type
              }
              maintainers {
                email
                name
                url
              }
              owner {
                avatar
                did
                email
                fullName
              }
              repository {
                type
                url
              }
              requirements {
                aigne
                cpu
                os
                server
              }
              resource {
                exportApi
              }
              stats {
                downloads
                purchases
                star
              }
            }
            runtimeInfo {
              cpus
              cpuUsage
              memoryUsage
              pid
              port
              runningDocker
              uptime
            }
          }
          configs {
            custom
            description
            key
            required
            secure
            shared
            validation
            value
          }
          dependents {
            id
            required
          }
          diskInfo {
            app
            blocklets
            cache
            data
            log
          }
          engine {
            available
            description
            displayName
            logo
            name
            version
            visible
          }
          environments {
            custom
            description
            key
            required
            secure
            shared
            validation
            value
          }
          meta {
            bundleDid
            bundleName
            community
            description
            did
            documentation
            engine
            group
            homepage
            keywords
            lastPublishedAt
            logo
            main
            name
            navigation
            nftFactory
            path
            resources
            screenshots
            support
            title
            version
            author {
              email
              name
              url
            }
            capabilities {
              clusterMode
              component
              didSpace
              navigation
              resourceExportApi
            }
            components {
              mountPoint
              name
              required
            }
            contributors {
              email
              name
              url
            }
            dist {
              integrity
              tarball
            }
            docker {
              image
              installNodeModules
              runBaseScript
              shell
            }
            environments {
              default
              description
              name
              required
              secure
              shared
              validation
            }
            events {
              description
              type
            }
            interfaces {
              cacheable
              name
              pageGroups
              path
              port
              prefix
              protocol
              type
              services {
                config
                name
              }
            }
            maintainers {
              email
              name
              url
            }
            owner {
              avatar
              did
              email
              fullName
            }
            payment {
              price {
                address
                symbol
                value
              }
              share {
                address
                name
                value
              }
            }
            repository {
              type
              url
            }
            requirements {
              aigne
              cpu
              os
              server
              fuels {
                address
                endpoint
                reason
                value
              }
            }
            resource {
              exportApi
              bundles {
                did
                public
                type
              }
              types {
                description
                type
              }
            }
            stats {
              downloads
              purchases
              star
            }
          }
          runtimeInfo {
            cpus
            cpuUsage
            memoryUsage
            pid
            port
            runningDocker
            uptime
          }
        }
        configs {
          custom
          description
          key
          required
          secure
          shared
          validation
          value
        }
        dependents {
          id
          required
        }
        diskInfo {
          app
          blocklets
          cache
          data
          log
        }
        engine {
          available
          description
          displayName
          logo
          name
          version
          visible
        }
        environments {
          custom
          description
          key
          required
          secure
          shared
          validation
          value
        }
        meta {
          bundleDid
          bundleName
          community
          description
          did
          documentation
          engine
          group
          homepage
          keywords
          lastPublishedAt
          logo
          main
          name
          navigation
          nftFactory
          path
          resources
          screenshots
          support
          title
          version
          author {
            email
            name
            url
          }
          capabilities {
            clusterMode
            component
            didSpace
            navigation
            resourceExportApi
          }
          components {
            mountPoint
            name
            required
          }
          contributors {
            email
            name
            url
          }
          dist {
            integrity
            tarball
          }
          docker {
            image
            installNodeModules
            runBaseScript
            shell
          }
          environments {
            default
            description
            name
            required
            secure
            shared
            validation
          }
          events {
            description
            type
          }
          interfaces {
            cacheable
            name
            pageGroups
            path
            port
            prefix
            protocol
            type
            services {
              config
              name
            }
          }
          maintainers {
            email
            name
            url
          }
          owner {
            avatar
            did
            email
            fullName
          }
          payment {
            price {
              address
              symbol
              value
            }
            share {
              address
              name
              value
            }
          }
          repository {
            type
            url
          }
          requirements {
            aigne
            cpu
            os
            server
            fuels {
              address
              endpoint
              reason
              value
            }
          }
          resource {
            exportApi
            bundles {
              did
              public
              type
            }
            types {
              description
              type
            }
          }
          stats {
            downloads
            purchases
            star
          }
        }
        runtimeInfo {
          cpus
          cpuUsage
          memoryUsage
          pid
          port
          runningDocker
          uptime
        }
      }
      configs {
        custom
        description
        key
        required
        secure
        shared
        validation
        value
      }
      controller {
        chainHost
        consumedAt
        expireDate
        id
        launcherSessionId
        launcherUrl
        nftId
        nftOwner
        ownerDid
        status {
          reason
          value
        }
      }
      diskInfo {
        app
        blocklets
        cache
        data
        log
      }
      engine {
        available
        description
        displayName
        logo
        name
        version
        visible
      }
      environments {
        custom
        description
        key
        required
        secure
        shared
        validation
        value
      }
      meta {
        bundleDid
        bundleName
        community
        description
        did
        documentation
        engine
        group
        homepage
        keywords
        lastPublishedAt
        logo
        main
        name
        navigation
        nftFactory
        path
        resources
        screenshots
        support
        title
        version
        author {
          email
          name
          url
        }
        capabilities {
          clusterMode
          component
          didSpace
          navigation
          resourceExportApi
        }
        components {
          mountPoint
          name
          required
        }
        contributors {
          email
          name
          url
        }
        dist {
          integrity
          tarball
        }
        docker {
          image
          installNodeModules
          runBaseScript
          shell
        }
        environments {
          default
          description
          name
          required
          secure
          shared
          validation
        }
        events {
          description
          type
        }
        interfaces {
          cacheable
          name
          pageGroups
          path
          port
          prefix
          protocol
          type
          services {
            config
            name
          }
        }
        maintainers {
          email
          name
          url
        }
        owner {
          avatar
          did
          email
          fullName
        }
        payment {
          price {
            address
            symbol
            value
          }
          share {
            address
            name
            value
          }
        }
        repository {
          type
          url
        }
        requirements {
          aigne
          cpu
          os
          server
          fuels {
            address
            endpoint
            reason
            value
          }
        }
        resource {
          exportApi
          bundles {
            did
            public
            type
          }
          types {
            description
            type
          }
        }
        stats {
          downloads
          purchases
          star
        }
      }
      migratedFrom {
        appDid
        appSk
        at
      }
      optionalComponents {
        bundleSource
        logoUrl
        dependencies {
          mountPoint
          parentDid
          parentName
          parentTitle
          required
        }
        meta {
          bundleDid
          bundleName
          community
          description
          did
          documentation
          engine
          group
          homepage
          keywords
          lastPublishedAt
          logo
          main
          name
          navigation
          nftFactory
          path
          resources
          screenshots
          support
          title
          version
          author {
            email
            name
            url
          }
          capabilities {
            clusterMode
            component
            didSpace
            navigation
            resourceExportApi
          }
          components {
            mountPoint
            name
            required
          }
          contributors {
            email
            name
            url
          }
          dist {
            integrity
            tarball
          }
          docker {
            image
            installNodeModules
            runBaseScript
            shell
          }
          environments {
            default
            description
            name
            required
            secure
            shared
            validation
          }
          events {
            description
            type
          }
          interfaces {
            cacheable
            name
            pageGroups
            path
            port
            prefix
            protocol
            type
            services {
              config
              name
            }
          }
          maintainers {
            email
            name
            url
          }
          owner {
            avatar
            did
            email
            fullName
          }
          payment {
            price {
              address
              symbol
              value
            }
            share {
              address
              name
              value
            }
          }
          repository {
            type
            url
          }
          requirements {
            aigne
            cpu
            os
            server
            fuels {
              address
              endpoint
              reason
              value
            }
          }
          resource {
            exportApi
            bundles {
              did
              public
              type
            }
            types {
              description
              type
            }
          }
          stats {
            downloads
            purchases
            star
          }
        }
      }
      runtimeInfo {
        cpus
        cpuUsage
        memoryUsage
        pid
        port
        runningDocker
        uptime
      }
      settings {
        actionConfig
        authentication
        didConnect
        enablePassportIssuance
        enableSessionHardening
        initialized
        notification
        oauth
        publicToStore
        theme
        whoCanAccess
        aigne {
          accessKeyId
          key
          model
          provider
          secretAccessKey
          url
          validationResult
        }
        autoBackup {
          enabled
        }
        autoCheckUpdate {
          enabled
        }
        children {
          deletedAt
          deployedFrom
          mountPoint
          status
          meta {
            bundleDid
            bundleName
            description
            did
            name
            title
            version
          }
        }
        endpointList {
          appDescription
          appName
          endpoint
          id
          protected
          scope
          url
        }
        federated {
          config {
            appId
            appPid
            autoLogin
            delegation
            isMaster
          }
          sites {
            aliasDid
            aliasDomain
            appDescription
            appId
            appliedAt
            appLogo
            appLogoRect
            appName
            appPid
            appUrl
            did
            isMaster
            pk
            serverId
            serverVersion
            status
            version
          }
        }
        gateway {
          cacheEnabled
          blockPolicy {
            blacklist
            enabled
            autoBlocking {
              blockDuration
              enabled
              statusCodes
              windowQuota
              windowSize
            }
          }
          proxyPolicy {
            enabled
            realIpHeader
            trustedProxies
            trustRecursive
          }
          requestLimit {
            burstDelay
            burstFactor
            enabled
            global
            methods
            rate
          }
          wafPolicy {
            enabled
            inboundAnomalyScoreThreshold
            logLevel
            mode
            outboundAnomalyScoreThreshold
          }
        }
        invite {
          enabled
        }
        navigations {
          activeColor
          activeIcon
          color
          component
          description
          from
          icon
          id
          link
          parent
          private
          role
          section
          title
          visible
        }
        org {
          enabled
          maxMemberPerOrg
          maxOrgPerUser
        }
        owner {
          did
          pk
        }
        session {
          cacheTtl
          enableBlacklist
          salt
          ttl
          email {
            domainBlackList
            domainWhiteList
            enabled
            enableDomainBlackList
            enableDomainWhiteList
            requireUnique
            requireVerified
            trustOauthProviders
            trustedIssuers {
              id
              name
              pk
            }
          }
          phone {
            enabled
            enableRegionBlackList
            enableRegionWhiteList
            regionBlackList
            regionWhiteList
            requireUnique
            requireVerified
            trustedIssuers {
              id
              name
              pk
            }
          }
        }
        storeList {
          cdnUrl
          description
          id
          logoUrl
          maintainer
          name
          protected
          scope
          url
        }
        subService {
          domain
          enabled
          staticRoot
        }
        trustedFactories {
          factoryAddress
          holderDid
          issuerDid
          remark
          passport {
            role
            ttl
            ttlPolicy
          }
        }
        trustedPassports {
          issuerDid
          remark
          mappings {
            from {
              passport
            }
            to {
              role
              ttl
              ttlPolicy
            }
          }
        }
      }
      site {
        corsAllowedOrigins
        domain
        domainAliases
        id
        isProtected
        rules {
          id
          isProtected
          from {
            pathPrefix
            header {
              key
              type
              value
            }
          }
          to {
            componentId
            did
            interfaceName
            pageGroup
            port
            redirectCode
            type
            url
            response {
              body
              contentType
              status
            }
          }
        }
      }
      trustedFactories {
        factoryAddress
        holderDid
        issuerDid
        remark
        passport {
          role
          ttl
          ttlPolicy
        }
      }
      trustedPassports {
        issuerDid
        remark
        mappings {
          from {
            passport
          }
          to {
            role
            ttl
            ttlPolicy
          }
        }
      }
      vaults {
        approverDid
        approverPk
        approverSig
        at
        did
        pk
        sig
      }
    }
  }
}
```

### configDidConnect

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
mutation {
  configDidConnect {
    code
    blocklet {
      appDid
      appPid
      bundleSource
      createdAt
      deployedFrom
      dynamic
      enableDocker
      enableDockerNetwork
      enablePassportIssuance
      externalSk
      externalSkSource
      installedAt
      mode
      mountPoint
      pausedAt
      port
      ports
      source
      startedAt
      status
      stoppedAt
      structVersion
      updatedAt
      appRuntimeInfo {
        cpus
        cpuUsage
        memoryUsage
        pid
        port
        runningDocker
        uptime
      }
      children {
        bundleSource
        createdAt
        deployedFrom
        dynamic
        greenStatus
        installedAt
        mode
        mountPoint
        pausedAt
        port
        ports
        required
        source
        startedAt
        status
        stoppedAt
        appRuntimeInfo {
          cpus
          cpuUsage
          memoryUsage
          pid
          port
          runningDocker
          uptime
        }
        children {
          bundleSource
          createdAt
          deployedFrom
          dynamic
          greenStatus
          installedAt
          mode
          mountPoint
          pausedAt
          port
          ports
          required
          source
          startedAt
          status
          stoppedAt
          appRuntimeInfo {
            cpus
            cpuUsage
            memoryUsage
            pid
            port
            runningDocker
            uptime
          }
          children {
            bundleSource
            createdAt
            deployedFrom
            dynamic
            greenStatus
            installedAt
            mode
            mountPoint
            pausedAt
            port
            ports
            required
            source
            startedAt
            status
            stoppedAt
            appRuntimeInfo {
              cpus
              cpuUsage
              memoryUsage
              pid
              port
              runningDocker
              uptime
            }
            children {
              bundleSource
              createdAt
              deployedFrom
              dynamic
              greenStatus
              installedAt
              mode
              mountPoint
              pausedAt
              port
              ports
              required
              source
              startedAt
              status
              stoppedAt
              appRuntimeInfo {
                cpus
                cpuUsage
                memoryUsage
                pid
                port
                runningDocker
                uptime
              }
              children {
                bundleSource
                createdAt
                deployedFrom
                dynamic
                greenStatus
                installedAt
                mode
                mountPoint
                pausedAt
                port
                ports
                required
                source
                startedAt
                status
                stoppedAt
              }
              configs {
                custom
                description
                key
                required
                secure
                shared
                validation
                value
              }
              dependents {
                id
                required
              }
              diskInfo {
                app
                blocklets
                cache
                data
                log
              }
              engine {
                available
                description
                displayName
                logo
                name
                version
                visible
              }
              environments {
                custom
                description
                key
                required
                secure
                shared
                validation
                value
              }
              meta {
                bundleDid
                bundleName
                community
                description
                did
                documentation
                engine
                group
                homepage
                keywords
                lastPublishedAt
                logo
                main
                name
                navigation
                nftFactory
                path
                resources
                screenshots
                support
                title
                version
              }
              runtimeInfo {
                cpus
                cpuUsage
                memoryUsage
                pid
                port
                runningDocker
                uptime
              }
            }
            configs {
              custom
              description
              key
              required
              secure
              shared
              validation
              value
            }
            dependents {
              id
              required
            }
            diskInfo {
              app
              blocklets
              cache
              data
              log
            }
            engine {
              available
              description
              displayName
              logo
              name
              version
              visible
            }
            environments {
              custom
              description
              key
              required
              secure
              shared
              validation
              value
            }
            meta {
              bundleDid
              bundleName
              community
              description
              did
              documentation
              engine
              group
              homepage
              keywords
              lastPublishedAt
              logo
              main
              name
              navigation
              nftFactory
              path
              resources
              screenshots
              support
              title
              version
              author {
                email
                name
                url
              }
              capabilities {
                clusterMode
                component
                didSpace
                navigation
                resourceExportApi
              }
              components {
                mountPoint
                name
                required
              }
              contributors {
                email
                name
                url
              }
              dist {
                integrity
                tarball
              }
              docker {
                image
                installNodeModules
                runBaseScript
                shell
              }
              environments {
                default
                description
                name
                required
                secure
                shared
                validation
              }
              events {
                description
                type
              }
              interfaces {
                cacheable
                name
                pageGroups
                path
                port
                prefix
                protocol
                type
              }
              maintainers {
                email
                name
                url
              }
              owner {
                avatar
                did
                email
                fullName
              }
              repository {
                type
                url
              }
              requirements {
                aigne
                cpu
                os
                server
              }
              resource {
                exportApi
              }
              stats {
                downloads
                purchases
                star
              }
            }
            runtimeInfo {
              cpus
              cpuUsage
              memoryUsage
              pid
              port
              runningDocker
              uptime
            }
          }
          configs {
            custom
            description
            key
            required
            secure
            shared
            validation
            value
          }
          dependents {
            id
            required
          }
          diskInfo {
            app
            blocklets
            cache
            data
            log
          }
          engine {
            available
            description
            displayName
            logo
            name
            version
            visible
          }
          environments {
            custom
            description
            key
            required
            secure
            shared
            validation
            value
          }
          meta {
            bundleDid
            bundleName
            community
            description
            did
            documentation
            engine
            group
            homepage
            keywords
            lastPublishedAt
            logo
            main
            name
            navigation
            nftFactory
            path
            resources
            screenshots
            support
            title
            version
            author {
              email
              name
              url
            }
            capabilities {
              clusterMode
              component
              didSpace
              navigation
              resourceExportApi
            }
            components {
              mountPoint
              name
              required
            }
            contributors {
              email
              name
              url
            }
            dist {
              integrity
              tarball
            }
            docker {
              image
              installNodeModules
              runBaseScript
              shell
            }
            environments {
              default
              description
              name
              required
              secure
              shared
              validation
            }
            events {
              description
              type
            }
            interfaces {
              cacheable
              name
              pageGroups
              path
              port
              prefix
              protocol
              type
              services {
                config
                name
              }
            }
            maintainers {
              email
              name
              url
            }
            owner {
              avatar
              did
              email
              fullName
            }
            payment {
              price {
                address
                symbol
                value
              }
              share {
                address
                name
                value
              }
            }
            repository {
              type
              url
            }
            requirements {
              aigne
              cpu
              os
              server
              fuels {
                address
                endpoint
                reason
                value
              }
            }
            resource {
              exportApi
              bundles {
                did
                public
                type
              }
              types {
                description
                type
              }
            }
            stats {
              downloads
              purchases
              star
            }
          }
          runtimeInfo {
            cpus
            cpuUsage
            memoryUsage
            pid
            port
            runningDocker
            uptime
          }
        }
        configs {
          custom
          description
          key
          required
          secure
          shared
          validation
          value
        }
        dependents {
          id
          required
        }
        diskInfo {
          app
          blocklets
          cache
          data
          log
        }
        engine {
          available
          description
          displayName
          logo
          name
          version
          visible
        }
        environments {
          custom
          description
          key
          required
          secure
          shared
          validation
          value
        }
        meta {
          bundleDid
          bundleName
          community
          description
          did
          documentation
          engine
          group
          homepage
          keywords
          lastPublishedAt
          logo
          main
          name
          navigation
          nftFactory
          path
          resources
          screenshots
          support
          title
          version
          author {
            email
            name
            url
          }
          capabilities {
            clusterMode
            component
            didSpace
            navigation
            resourceExportApi
          }
          components {
            mountPoint
            name
            required
          }
          contributors {
            email
            name
            url
          }
          dist {
            integrity
            tarball
          }
          docker {
            image
            installNodeModules
            runBaseScript
            shell
          }
          environments {
            default
            description
            name
            required
            secure
            shared
            validation
          }
          events {
            description
            type
          }
          interfaces {
            cacheable
            name
            pageGroups
            path
            port
            prefix
            protocol
            type
            services {
              config
              name
            }
          }
          maintainers {
            email
            name
            url
          }
          owner {
            avatar
            did
            email
            fullName
          }
          payment {
            price {
              address
              symbol
              value
            }
            share {
              address
              name
              value
            }
          }
          repository {
            type
            url
          }
          requirements {
            aigne
            cpu
            os
            server
            fuels {
              address
              endpoint
              reason
              value
            }
          }
          resource {
            exportApi
            bundles {
              did
              public
              type
            }
            types {
              description
              type
            }
          }
          stats {
            downloads
            purchases
            star
          }
        }
        runtimeInfo {
          cpus
          cpuUsage
          memoryUsage
          pid
          port
          runningDocker
          uptime
        }
      }
      configs {
        custom
        description
        key
        required
        secure
        shared
        validation
        value
      }
      controller {
        chainHost
        consumedAt
        expireDate
        id
        launcherSessionId
        launcherUrl
        nftId
        nftOwner
        ownerDid
        status {
          reason
          value
        }
      }
      diskInfo {
        app
        blocklets
        cache
        data
        log
      }
      engine {
        available
        description
        displayName
        logo
        name
        version
        visible
      }
      environments {
        custom
        description
        key
        required
        secure
        shared
        validation
        value
      }
      meta {
        bundleDid
        bundleName
        community
        description
        did
        documentation
        engine
        group
        homepage
        keywords
        lastPublishedAt
        logo
        main
        name
        navigation
        nftFactory
        path
        resources
        screenshots
        support
        title
        version
        author {
          email
          name
          url
        }
        capabilities {
          clusterMode
          component
          didSpace
          navigation
          resourceExportApi
        }
        components {
          mountPoint
          name
          required
        }
        contributors {
          email
          name
          url
        }
        dist {
          integrity
          tarball
        }
        docker {
          image
          installNodeModules
          runBaseScript
          shell
        }
        environments {
          default
          description
          name
          required
          secure
          shared
          validation
        }
        events {
          description
          type
        }
        interfaces {
          cacheable
          name
          pageGroups
          path
          port
          prefix
          protocol
          type
          services {
            config
            name
          }
        }
        maintainers {
          email
          name
          url
        }
        owner {
          avatar
          did
          email
          fullName
        }
        payment {
          price {
            address
            symbol
            value
          }
          share {
            address
            name
            value
          }
        }
        repository {
          type
          url
        }
        requirements {
          aigne
          cpu
          os
          server
          fuels {
            address
            endpoint
            reason
            value
          }
        }
        resource {
          exportApi
          bundles {
            did
            public
            type
          }
          types {
            description
            type
          }
        }
        stats {
          downloads
          purchases
          star
        }
      }
      migratedFrom {
        appDid
        appSk
        at
      }
      optionalComponents {
        bundleSource
        logoUrl
        dependencies {
          mountPoint
          parentDid
          parentName
          parentTitle
          required
        }
        meta {
          bundleDid
          bundleName
          community
          description
          did
          documentation
          engine
          group
          homepage
          keywords
          lastPublishedAt
          logo
          main
          name
          navigation
          nftFactory
          path
          resources
          screenshots
          support
          title
          version
          author {
            email
            name
            url
          }
          capabilities {
            clusterMode
            component
            didSpace
            navigation
            resourceExportApi
          }
          components {
            mountPoint
            name
            required
          }
          contributors {
            email
            name
            url
          }
          dist {
            integrity
            tarball
          }
          docker {
            image
            installNodeModules
            runBaseScript
            shell
          }
          environments {
            default
            description
            name
            required
            secure
            shared
            validation
          }
          events {
            description
            type
          }
          interfaces {
            cacheable
            name
            pageGroups
            path
            port
            prefix
            protocol
            type
            services {
              config
              name
            }
          }
          maintainers {
            email
            name
            url
          }
          owner {
            avatar
            did
            email
            fullName
          }
          payment {
            price {
              address
              symbol
              value
            }
            share {
              address
              name
              value
            }
          }
          repository {
            type
            url
          }
          requirements {
            aigne
            cpu
            os
            server
            fuels {
              address
              endpoint
              reason
              value
            }
          }
          resource {
            exportApi
            bundles {
              did
              public
              type
            }
            types {
              description
              type
            }
          }
          stats {
            downloads
            purchases
            star
          }
        }
      }
      runtimeInfo {
        cpus
        cpuUsage
        memoryUsage
        pid
        port
        runningDocker
        uptime
      }
      settings {
        actionConfig
        authentication
        didConnect
        enablePassportIssuance
        enableSessionHardening
        initialized
        notification
        oauth
        publicToStore
        theme
        whoCanAccess
        aigne {
          accessKeyId
          key
          model
          provider
          secretAccessKey
          url
          validationResult
        }
        autoBackup {
          enabled
        }
        autoCheckUpdate {
          enabled
        }
        children {
          deletedAt
          deployedFrom
          mountPoint
          status
          meta {
            bundleDid
            bundleName
            description
            did
            name
            title
            version
          }
        }
        endpointList {
          appDescription
          appName
          endpoint
          id
          protected
          scope
          url
        }
        federated {
          config {
            appId
            appPid
            autoLogin
            delegation
            isMaster
          }
          sites {
            aliasDid
            aliasDomain
            appDescription
            appId
            appliedAt
            appLogo
            appLogoRect
            appName
            appPid
            appUrl
            did
            isMaster
            pk
            serverId
            serverVersion
            status
            version
          }
        }
        gateway {
          cacheEnabled
          blockPolicy {
            blacklist
            enabled
            autoBlocking {
              blockDuration
              enabled
              statusCodes
              windowQuota
              windowSize
            }
          }
          proxyPolicy {
            enabled
            realIpHeader
            trustedProxies
            trustRecursive
          }
          requestLimit {
            burstDelay
            burstFactor
            enabled
            global
            methods
            rate
          }
          wafPolicy {
            enabled
            inboundAnomalyScoreThreshold
            logLevel
            mode
            outboundAnomalyScoreThreshold
          }
        }
        invite {
          enabled
        }
        navigations {
          activeColor
          activeIcon
          color
          component
          description
          from
          icon
          id
          link
          parent
          private
          role
          section
          title
          visible
        }
        org {
          enabled
          maxMemberPerOrg
          maxOrgPerUser
        }
        owner {
          did
          pk
        }
        session {
          cacheTtl
          enableBlacklist
          salt
          ttl
          email {
            domainBlackList
            domainWhiteList
            enabled
            enableDomainBlackList
            enableDomainWhiteList
            requireUnique
            requireVerified
            trustOauthProviders
            trustedIssuers {
              id
              name
              pk
            }
          }
          phone {
            enabled
            enableRegionBlackList
            enableRegionWhiteList
            regionBlackList
            regionWhiteList
            requireUnique
            requireVerified
            trustedIssuers {
              id
              name
              pk
            }
          }
        }
        storeList {
          cdnUrl
          description
          id
          logoUrl
          maintainer
          name
          protected
          scope
          url
        }
        subService {
          domain
          enabled
          staticRoot
        }
        trustedFactories {
          factoryAddress
          holderDid
          issuerDid
          remark
          passport {
            role
            ttl
            ttlPolicy
          }
        }
        trustedPassports {
          issuerDid
          remark
          mappings {
            from {
              passport
            }
            to {
              role
              ttl
              ttlPolicy
            }
          }
        }
      }
      site {
        corsAllowedOrigins
        domain
        domainAliases
        id
        isProtected
        rules {
          id
          isProtected
          from {
            pathPrefix
            header {
              key
              type
              value
            }
          }
          to {
            componentId
            did
            interfaceName
            pageGroup
            port
            redirectCode
            type
            url
            response {
              body
              contentType
              status
            }
          }
        }
      }
      trustedFactories {
        factoryAddress
        holderDid
        issuerDid
        remark
        passport {
          role
          ttl
          ttlPolicy
        }
      }
      trustedPassports {
        issuerDid
        remark
        mappings {
          from {
            passport
          }
          to {
            role
            ttl
            ttlPolicy
          }
        }
      }
      vaults {
        approverDid
        approverPk
        approverSig
        at
        did
        pk
        sig
      }
    }
  }
}
```

### configDidConnectActions

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
mutation {
  configDidConnectActions {
    code
    blocklet {
      appDid
      appPid
      bundleSource
      createdAt
      deployedFrom
      dynamic
      enableDocker
      enableDockerNetwork
      enablePassportIssuance
      externalSk
      externalSkSource
      installedAt
      mode
      mountPoint
      pausedAt
      port
      ports
      source
      startedAt
      status
      stoppedAt
      structVersion
      updatedAt
      appRuntimeInfo {
        cpus
        cpuUsage
        memoryUsage
        pid
        port
        runningDocker
        uptime
      }
      children {
        bundleSource
        createdAt
        deployedFrom
        dynamic
        greenStatus
        installedAt
        mode
        mountPoint
        pausedAt
        port
        ports
        required
        source
        startedAt
        status
        stoppedAt
        appRuntimeInfo {
          cpus
          cpuUsage
          memoryUsage
          pid
          port
          runningDocker
          uptime
        }
        children {
          bundleSource
          createdAt
          deployedFrom
          dynamic
          greenStatus
          installedAt
          mode
          mountPoint
          pausedAt
          port
          ports
          required
          source
          startedAt
          status
          stoppedAt
          appRuntimeInfo {
            cpus
            cpuUsage
            memoryUsage
            pid
            port
            runningDocker
            uptime
          }
          children {
            bundleSource
            createdAt
            deployedFrom
            dynamic
            greenStatus
            installedAt
            mode
            mountPoint
            pausedAt
            port
            ports
            required
            source
            startedAt
            status
            stoppedAt
            appRuntimeInfo {
              cpus
              cpuUsage
              memoryUsage
              pid
              port
              runningDocker
              uptime
            }
            children {
              bundleSource
              createdAt
              deployedFrom
              dynamic
              greenStatus
              installedAt
              mode
              mountPoint
              pausedAt
              port
              ports
              required
              source
              startedAt
              status
              stoppedAt
              appRuntimeInfo {
                cpus
                cpuUsage
                memoryUsage
                pid
                port
                runningDocker
                uptime
              }
              children {
                bundleSource
                createdAt
                deployedFrom
                dynamic
                greenStatus
                installedAt
                mode
                mountPoint
                pausedAt
                port
                ports
                required
                source
                startedAt
                status
                stoppedAt
              }
              configs {
                custom
                description
                key
                required
                secure
                shared
                validation
                value
              }
              dependents {
                id
                required
              }
              diskInfo {
                app
                blocklets
                cache
                data
                log
              }
              engine {
                available
                description
                displayName
                logo
                name
                version
                visible
              }
              environments {
                custom
                description
                key
                required
                secure
                shared
                validation
                value
              }
              meta {
                bundleDid
                bundleName
                community
                description
                did
                documentation
                engine
                group
                homepage
                keywords
                lastPublishedAt
                logo
                main
                name
                navigation
                nftFactory
                path
                resources
                screenshots
                support
                title
                version
              }
              runtimeInfo {
                cpus
                cpuUsage
                memoryUsage
                pid
                port
                runningDocker
                uptime
              }
            }
            configs {
              custom
              description
              key
              required
              secure
              shared
              validation
              value
            }
            dependents {
              id
              required
            }
            diskInfo {
              app
              blocklets
              cache
              data
              log
            }
            engine {
              available
              description
              displayName
              logo
              name
              version
              visible
            }
            environments {
              custom
              description
              key
              required
              secure
              shared
              validation
              value
            }
            meta {
              bundleDid
              bundleName
              community
              description
              did
              documentation
              engine
              group
              homepage
              keywords
              lastPublishedAt
              logo
              main
              name
              navigation
              nftFactory
              path
              resources
              screenshots
              support
              title
              version
              author {
                email
                name
                url
              }
              capabilities {
                clusterMode
                component
                didSpace
                navigation
                resourceExportApi
              }
              components {
                mountPoint
                name
                required
              }
              contributors {
                email
                name
                url
              }
              dist {
                integrity
                tarball
              }
              docker {
                image
                installNodeModules
                runBaseScript
                shell
              }
              environments {
                default
                description
                name
                required
                secure
                shared
                validation
              }
              events {
                description
                type
              }
              interfaces {
                cacheable
                name
                pageGroups
                path
                port
                prefix
                protocol
                type
              }
              maintainers {
                email
                name
                url
              }
              owner {
                avatar
                did
                email
                fullName
              }
              repository {
                type
                url
              }
              requirements {
                aigne
                cpu
                os
                server
              }
              resource {
                exportApi
              }
              stats {
                downloads
                purchases
                star
              }
            }
            runtimeInfo {
              cpus
              cpuUsage
              memoryUsage
              pid
              port
              runningDocker
              uptime
            }
          }
          configs {
            custom
            description
            key
            required
            secure
            shared
            validation
            value
          }
          dependents {
            id
            required
          }
          diskInfo {
            app
            blocklets
            cache
            data
            log
          }
          engine {
            available
            description
            displayName
            logo
            name
            version
            visible
          }
          environments {
            custom
            description
            key
            required
            secure
            shared
            validation
            value
          }
          meta {
            bundleDid
            bundleName
            community
            description
            did
            documentation
            engine
            group
            homepage
            keywords
            lastPublishedAt
            logo
            main
            name
            navigation
            nftFactory
            path
            resources
            screenshots
            support
            title
            version
            author {
              email
              name
              url
            }
            capabilities {
              clusterMode
              component
              didSpace
              navigation
              resourceExportApi
            }
            components {
              mountPoint
              name
              required
            }
            contributors {
              email
              name
              url
            }
            dist {
              integrity
              tarball
            }
            docker {
              image
              installNodeModules
              runBaseScript
              shell
            }
            environments {
              default
              description
              name
              required
              secure
              shared
              validation
            }
            events {
              description
              type
            }
            interfaces {
              cacheable
              name
              pageGroups
              path
              port
              prefix
              protocol
              type
              services {
                config
                name
              }
            }
            maintainers {
              email
              name
              url
            }
            owner {
              avatar
              did
              email
              fullName
            }
            payment {
              price {
                address
                symbol
                value
              }
              share {
                address
                name
                value
              }
            }
            repository {
              type
              url
            }
            requirements {
              aigne
              cpu
              os
              server
              fuels {
                address
                endpoint
                reason
                value
              }
            }
            resource {
              exportApi
              bundles {
                did
                public
                type
              }
              types {
                description
                type
              }
            }
            stats {
              downloads
              purchases
              star
            }
          }
          runtimeInfo {
            cpus
            cpuUsage
            memoryUsage
            pid
            port
            runningDocker
            uptime
          }
        }
        configs {
          custom
          description
          key
          required
          secure
          shared
          validation
          value
        }
        dependents {
          id
          required
        }
        diskInfo {
          app
          blocklets
          cache
          data
          log
        }
        engine {
          available
          description
          displayName
          logo
          name
          version
          visible
        }
        environments {
          custom
          description
          key
          required
          secure
          shared
          validation
          value
        }
        meta {
          bundleDid
          bundleName
          community
          description
          did
          documentation
          engine
          group
          homepage
          keywords
          lastPublishedAt
          logo
          main
          name
          navigation
          nftFactory
          path
          resources
          screenshots
          support
          title
          version
          author {
            email
            name
            url
          }
          capabilities {
            clusterMode
            component
            didSpace
            navigation
            resourceExportApi
          }
          components {
            mountPoint
            name
            required
          }
          contributors {
            email
            name
            url
          }
          dist {
            integrity
            tarball
          }
          docker {
            image
            installNodeModules
            runBaseScript
            shell
          }
          environments {
            default
            description
            name
            required
            secure
            shared
            validation
          }
          events {
            description
            type
          }
          interfaces {
            cacheable
            name
            pageGroups
            path
            port
            prefix
            protocol
            type
            services {
              config
              name
            }
          }
          maintainers {
            email
            name
            url
          }
          owner {
            avatar
            did
            email
            fullName
          }
          payment {
            price {
              address
              symbol
              value
            }
            share {
              address
              name
              value
            }
          }
          repository {
            type
            url
          }
          requirements {
            aigne
            cpu
            os
            server
            fuels {
              address
              endpoint
              reason
              value
            }
          }
          resource {
            exportApi
            bundles {
              did
              public
              type
            }
            types {
              description
              type
            }
          }
          stats {
            downloads
            purchases
            star
          }
        }
        runtimeInfo {
          cpus
          cpuUsage
          memoryUsage
          pid
          port
          runningDocker
          uptime
        }
      }
      configs {
        custom
        description
        key
        required
        secure
        shared
        validation
        value
      }
      controller {
        chainHost
        consumedAt
        expireDate
        id
        launcherSessionId
        launcherUrl
        nftId
        nftOwner
        ownerDid
        status {
          reason
          value
        }
      }
      diskInfo {
        app
        blocklets
        cache
        data
        log
      }
      engine {
        available
        description
        displayName
        logo
        name
        version
        visible
      }
      environments {
        custom
        description
        key
        required
        secure
        shared
        validation
        value
      }
      meta {
        bundleDid
        bundleName
        community
        description
        did
        documentation
        engine
        group
        homepage
        keywords
        lastPublishedAt
        logo
        main
        name
        navigation
        nftFactory
        path
        resources
        screenshots
        support
        title
        version
        author {
          email
          name
          url
        }
        capabilities {
          clusterMode
          component
          didSpace
          navigation
          resourceExportApi
        }
        components {
          mountPoint
          name
          required
        }
        contributors {
          email
          name
          url
        }
        dist {
          integrity
          tarball
        }
        docker {
          image
          installNodeModules
          runBaseScript
          shell
        }
        environments {
          default
          description
          name
          required
          secure
          shared
          validation
        }
        events {
          description
          type
        }
        interfaces {
          cacheable
          name
          pageGroups
          path
          port
          prefix
          protocol
          type
          services {
            config
            name
          }
        }
        maintainers {
          email
          name
          url
        }
        owner {
          avatar
          did
          email
          fullName
        }
        payment {
          price {
            address
            symbol
            value
          }
          share {
            address
            name
            value
          }
        }
        repository {
          type
          url
        }
        requirements {
          aigne
          cpu
          os
          server
          fuels {
            address
            endpoint
            reason
            value
          }
        }
        resource {
          exportApi
          bundles {
            did
            public
            type
          }
          types {
            description
            type
          }
        }
        stats {
          downloads
          purchases
          star
        }
      }
      migratedFrom {
        appDid
        appSk
        at
      }
      optionalComponents {
        bundleSource
        logoUrl
        dependencies {
          mountPoint
          parentDid
          parentName
          parentTitle
          required
        }
        meta {
          bundleDid
          bundleName
          community
          description
          did
          documentation
          engine
          group
          homepage
          keywords
          lastPublishedAt
          logo
          main
          name
          navigation
          nftFactory
          path
          resources
          screenshots
          support
          title
          version
          author {
            email
            name
            url
          }
          capabilities {
            clusterMode
            component
            didSpace
            navigation
            resourceExportApi
          }
          components {
            mountPoint
            name
            required
          }
          contributors {
            email
            name
            url
          }
          dist {
            integrity
            tarball
          }
          docker {
            image
            installNodeModules
            runBaseScript
            shell
          }
          environments {
            default
            description
            name
            required
            secure
            shared
            validation
          }
          events {
            description
            type
          }
          interfaces {
            cacheable
            name
            pageGroups
            path
            port
            prefix
            protocol
            type
            services {
              config
              name
            }
          }
          maintainers {
            email
            name
            url
          }
          owner {
            avatar
            did
            email
            fullName
          }
          payment {
            price {
              address
              symbol
              value
            }
            share {
              address
              name
              value
            }
          }
          repository {
            type
            url
          }
          requirements {
            aigne
            cpu
            os
            server
            fuels {
              address
              endpoint
              reason
              value
            }
          }
          resource {
            exportApi
            bundles {
              did
              public
              type
            }
            types {
              description
              type
            }
          }
          stats {
            downloads
            purchases
            star
          }
        }
      }
      runtimeInfo {
        cpus
        cpuUsage
        memoryUsage
        pid
        port
        runningDocker
        uptime
      }
      settings {
        actionConfig
        authentication
        didConnect
        enablePassportIssuance
        enableSessionHardening
        initialized
        notification
        oauth
        publicToStore
        theme
        whoCanAccess
        aigne {
          accessKeyId
          key
          model
          provider
          secretAccessKey
          url
          validationResult
        }
        autoBackup {
          enabled
        }
        autoCheckUpdate {
          enabled
        }
        children {
          deletedAt
          deployedFrom
          mountPoint
          status
          meta {
            bundleDid
            bundleName
            description
            did
            name
            title
            version
          }
        }
        endpointList {
          appDescription
          appName
          endpoint
          id
          protected
          scope
          url
        }
        federated {
          config {
            appId
            appPid
            autoLogin
            delegation
            isMaster
          }
          sites {
            aliasDid
            aliasDomain
            appDescription
            appId
            appliedAt
            appLogo
            appLogoRect
            appName
            appPid
            appUrl
            did
            isMaster
            pk
            serverId
            serverVersion
            status
            version
          }
        }
        gateway {
          cacheEnabled
          blockPolicy {
            blacklist
            enabled
            autoBlocking {
              blockDuration
              enabled
              statusCodes
              windowQuota
              windowSize
            }
          }
          proxyPolicy {
            enabled
            realIpHeader
            trustedProxies
            trustRecursive
          }
          requestLimit {
            burstDelay
            burstFactor
            enabled
            global
            methods
            rate
          }
          wafPolicy {
            enabled
            inboundAnomalyScoreThreshold
            logLevel
            mode
            outboundAnomalyScoreThreshold
          }
        }
        invite {
          enabled
        }
        navigations {
          activeColor
          activeIcon
          color
          component
          description
          from
          icon
          id
          link
          parent
          private
          role
          section
          title
          visible
        }
        org {
          enabled
          maxMemberPerOrg
          maxOrgPerUser
        }
        owner {
          did
          pk
        }
        session {
          cacheTtl
          enableBlacklist
          salt
          ttl
          email {
            domainBlackList
            domainWhiteList
            enabled
            enableDomainBlackList
            enableDomainWhiteList
            requireUnique
            requireVerified
            trustOauthProviders
            trustedIssuers {
              id
              name
              pk
            }
          }
          phone {
            enabled
            enableRegionBlackList
            enableRegionWhiteList
            regionBlackList
            regionWhiteList
            requireUnique
            requireVerified
            trustedIssuers {
              id
              name
              pk
            }
          }
        }
        storeList {
          cdnUrl
          description
          id
          logoUrl
          maintainer
          name
          protected
          scope
          url
        }
        subService {
          domain
          enabled
          staticRoot
        }
        trustedFactories {
          factoryAddress
          holderDid
          issuerDid
          remark
          passport {
            role
            ttl
            ttlPolicy
          }
        }
        trustedPassports {
          issuerDid
          remark
          mappings {
            from {
              passport
            }
            to {
              role
              ttl
              ttlPolicy
            }
          }
        }
      }
      site {
        corsAllowedOrigins
        domain
        domainAliases
        id
        isProtected
        rules {
          id
          isProtected
          from {
            pathPrefix
            header {
              key
              type
              value
            }
          }
          to {
            componentId
            did
            interfaceName
            pageGroup
            port
            redirectCode
            type
            url
            response {
              body
              contentType
              status
            }
          }
        }
      }
      trustedFactories {
        factoryAddress
        holderDid
        issuerDid
        remark
        passport {
          role
          ttl
          ttlPolicy
        }
      }
      trustedPassports {
        issuerDid
        remark
        mappings {
          from {
            passport
          }
          to {
            role
            ttl
            ttlPolicy
          }
        }
      }
      vaults {
        approverDid
        approverPk
        approverSig
        at
        did
        pk
        sig
      }
    }
  }
}
```

### configNotification

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
mutation {
  configNotification {
    code
    blocklet {
      appDid
      appPid
      bundleSource
      createdAt
      deployedFrom
      dynamic
      enableDocker
      enableDockerNetwork
      enablePassportIssuance
      externalSk
      externalSkSource
      installedAt
      mode
      mountPoint
      pausedAt
      port
      ports
      source
      startedAt
      status
      stoppedAt
      structVersion
      updatedAt
      appRuntimeInfo {
        cpus
        cpuUsage
        memoryUsage
        pid
        port
        runningDocker
        uptime
      }
      children {
        bundleSource
        createdAt
        deployedFrom
        dynamic
        greenStatus
        installedAt
        mode
        mountPoint
        pausedAt
        port
        ports
        required
        source
        startedAt
        status
        stoppedAt
        appRuntimeInfo {
          cpus
          cpuUsage
          memoryUsage
          pid
          port
          runningDocker
          uptime
        }
        children {
          bundleSource
          createdAt
          deployedFrom
          dynamic
          greenStatus
          installedAt
          mode
          mountPoint
          pausedAt
          port
          ports
          required
          source
          startedAt
          status
          stoppedAt
          appRuntimeInfo {
            cpus
            cpuUsage
            memoryUsage
            pid
            port
            runningDocker
            uptime
          }
          children {
            bundleSource
            createdAt
            deployedFrom
            dynamic
            greenStatus
            installedAt
            mode
            mountPoint
            pausedAt
            port
            ports
            required
            source
            startedAt
            status
            stoppedAt
            appRuntimeInfo {
              cpus
              cpuUsage
              memoryUsage
              pid
              port
              runningDocker
              uptime
            }
            children {
              bundleSource
              createdAt
              deployedFrom
              dynamic
              greenStatus
              installedAt
              mode
              mountPoint
              pausedAt
              port
              ports
              required
              source
              startedAt
              status
              stoppedAt
              appRuntimeInfo {
                cpus
                cpuUsage
                memoryUsage
                pid
                port
                runningDocker
                uptime
              }
              children {
                bundleSource
                createdAt
                deployedFrom
                dynamic
                greenStatus
                installedAt
                mode
                mountPoint
                pausedAt
                port
                ports
                required
                source
                startedAt
                status
                stoppedAt
              }
              configs {
                custom
                description
                key
                required
                secure
                shared
                validation
                value
              }
              dependents {
                id
                required
              }
              diskInfo {
                app
                blocklets
                cache
                data
                log
              }
              engine {
                available
                description
                displayName
                logo
                name
                version
                visible
              }
              environments {
                custom
                description
                key
                required
                secure
                shared
                validation
                value
              }
              meta {
                bundleDid
                bundleName
                community
                description
                did
                documentation
                engine
                group
                homepage
                keywords
                lastPublishedAt
                logo
                main
                name
                navigation
                nftFactory
                path
                resources
                screenshots
                support
                title
                version
              }
              runtimeInfo {
                cpus
                cpuUsage
                memoryUsage
                pid
                port
                runningDocker
                uptime
              }
            }
            configs {
              custom
              description
              key
              required
              secure
              shared
              validation
              value
            }
            dependents {
              id
              required
            }
            diskInfo {
              app
              blocklets
              cache
              data
              log
            }
            engine {
              available
              description
              displayName
              logo
              name
              version
              visible
            }
            environments {
              custom
              description
              key
              required
              secure
              shared
              validation
              value
            }
            meta {
              bundleDid
              bundleName
              community
              description
              did
              documentation
              engine
              group
              homepage
              keywords
              lastPublishedAt
              logo
              main
              name
              navigation
              nftFactory
              path
              resources
              screenshots
              support
              title
              version
              author {
                email
                name
                url
              }
              capabilities {
                clusterMode
                component
                didSpace
                navigation
                resourceExportApi
              }
              components {
                mountPoint
                name
                required
              }
              contributors {
                email
                name
                url
              }
              dist {
                integrity
                tarball
              }
              docker {
                image
                installNodeModules
                runBaseScript
                shell
              }
              environments {
                default
                description
                name
                required
                secure
                shared
                validation
              }
              events {
                description
                type
              }
              interfaces {
                cacheable
                name
                pageGroups
                path
                port
                prefix
                protocol
                type
              }
              maintainers {
                email
                name
                url
              }
              owner {
                avatar
                did
                email
                fullName
              }
              repository {
                type
                url
              }
              requirements {
                aigne
                cpu
                os
                server
              }
              resource {
                exportApi
              }
              stats {
                downloads
                purchases
                star
              }
            }
            runtimeInfo {
              cpus
              cpuUsage
              memoryUsage
              pid
              port
              runningDocker
              uptime
            }
          }
          configs {
            custom
            description
            key
            required
            secure
            shared
            validation
            value
          }
          dependents {
            id
            required
          }
          diskInfo {
            app
            blocklets
            cache
            data
            log
          }
          engine {
            available
            description
            displayName
            logo
            name
            version
            visible
          }
          environments {
            custom
            description
            key
            required
            secure
            shared
            validation
            value
          }
          meta {
            bundleDid
            bundleName
            community
            description
            did
            documentation
            engine
            group
            homepage
            keywords
            lastPublishedAt
            logo
            main
            name
            navigation
            nftFactory
            path
            resources
            screenshots
            support
            title
            version
            author {
              email
              name
              url
            }
            capabilities {
              clusterMode
              component
              didSpace
              navigation
              resourceExportApi
            }
            components {
              mountPoint
              name
              required
            }
            contributors {
              email
              name
              url
            }
            dist {
              integrity
              tarball
            }
            docker {
              image
              installNodeModules
              runBaseScript
              shell
            }
            environments {
              default
              description
              name
              required
              secure
              shared
              validation
            }
            events {
              description
              type
            }
            interfaces {
              cacheable
              name
              pageGroups
              path
              port
              prefix
              protocol
              type
              services {
                config
                name
              }
            }
            maintainers {
              email
              name
              url
            }
            owner {
              avatar
              did
              email
              fullName
            }
            payment {
              price {
                address
                symbol
                value
              }
              share {
                address
                name
                value
              }
            }
            repository {
              type
              url
            }
            requirements {
              aigne
              cpu
              os
              server
              fuels {
                address
                endpoint
                reason
                value
              }
            }
            resource {
              exportApi
              bundles {
                did
                public
                type
              }
              types {
                description
                type
              }
            }
            stats {
              downloads
              purchases
              star
            }
          }
          runtimeInfo {
            cpus
            cpuUsage
            memoryUsage
            pid
            port
            runningDocker
            uptime
          }
        }
        configs {
          custom
          description
          key
          required
          secure
          shared
          validation
          value
        }
        dependents {
          id
          required
        }
        diskInfo {
          app
          blocklets
          cache
          data
          log
        }
        engine {
          available
          description
          displayName
          logo
          name
          version
          visible
        }
        environments {
          custom
          description
          key
          required
          secure
          shared
          validation
          value
        }
        meta {
          bundleDid
          bundleName
          community
          description
          did
          documentation
          engine
          group
          homepage
          keywords
          lastPublishedAt
          logo
          main
          name
          navigation
          nftFactory
          path
          resources
          screenshots
          support
          title
          version
          author {
            email
            name
            url
          }
          capabilities {
            clusterMode
            component
            didSpace
            navigation
            resourceExportApi
          }
          components {
            mountPoint
            name
            required
          }
          contributors {
            email
            name
            url
          }
          dist {
            integrity
            tarball
          }
          docker {
            image
            installNodeModules
            runBaseScript
            shell
          }
          environments {
            default
            description
            name
            required
            secure
            shared
            validation
          }
          events {
            description
            type
          }
          interfaces {
            cacheable
            name
            pageGroups
            path
            port
            prefix
            protocol
            type
            services {
              config
              name
            }
          }
          maintainers {
            email
            name
            url
          }
          owner {
            avatar
            did
            email
            fullName
          }
          payment {
            price {
              address
              symbol
              value
            }
            share {
              address
              name
              value
            }
          }
          repository {
            type
            url
          }
          requirements {
            aigne
            cpu
            os
            server
            fuels {
              address
              endpoint
              reason
              value
            }
          }
          resource {
            exportApi
            bundles {
              did
              public
              type
            }
            types {
              description
              type
            }
          }
          stats {
            downloads
            purchases
            star
          }
        }
        runtimeInfo {
          cpus
          cpuUsage
          memoryUsage
          pid
          port
          runningDocker
          uptime
        }
      }
      configs {
        custom
        description
        key
        required
        secure
        shared
        validation
        value
      }
      controller {
        chainHost
        consumedAt
        expireDate
        id
        launcherSessionId
        launcherUrl
        nftId
        nftOwner
        ownerDid
        status {
          reason
          value
        }
      }
      diskInfo {
        app
        blocklets
        cache
        data
        log
      }
      engine {
        available
        description
        displayName
        logo
        name
        version
        visible
      }
      environments {
        custom
        description
        key
        required
        secure
        shared
        validation
        value
      }
      meta {
        bundleDid
        bundleName
        community
        description
        did
        documentation
        engine
        group
        homepage
        keywords
        lastPublishedAt
        logo
        main
        name
        navigation
        nftFactory
        path
        resources
        screenshots
        support
        title
        version
        author {
          email
          name
          url
        }
        capabilities {
          clusterMode
          component
          didSpace
          navigation
          resourceExportApi
        }
        components {
          mountPoint
          name
          required
        }
        contributors {
          email
          name
          url
        }
        dist {
          integrity
          tarball
        }
        docker {
          image
          installNodeModules
          runBaseScript
          shell
        }
        environments {
          default
          description
          name
          required
          secure
          shared
          validation
        }
        events {
          description
          type
        }
        interfaces {
          cacheable
          name
          pageGroups
          path
          port
          prefix
          protocol
          type
          services {
            config
            name
          }
        }
        maintainers {
          email
          name
          url
        }
        owner {
          avatar
          did
          email
          fullName
        }
        payment {
          price {
            address
            symbol
            value
          }
          share {
            address
            name
            value
          }
        }
        repository {
          type
          url
        }
        requirements {
          aigne
          cpu
          os
          server
          fuels {
            address
            endpoint
            reason
            value
          }
        }
        resource {
          exportApi
          bundles {
            did
            public
            type
          }
          types {
            description
            type
          }
        }
        stats {
          downloads
          purchases
          star
        }
      }
      migratedFrom {
        appDid
        appSk
        at
      }
      optionalComponents {
        bundleSource
        logoUrl
        dependencies {
          mountPoint
          parentDid
          parentName
          parentTitle
          required
        }
        meta {
          bundleDid
          bundleName
          community
          description
          did
          documentation
          engine
          group
          homepage
          keywords
          lastPublishedAt
          logo
          main
          name
          navigation
          nftFactory
          path
          resources
          screenshots
          support
          title
          version
          author {
            email
            name
            url
          }
          capabilities {
            clusterMode
            component
            didSpace
            navigation
            resourceExportApi
          }
          components {
            mountPoint
            name
            required
          }
          contributors {
            email
            name
            url
          }
          dist {
            integrity
            tarball
          }
          docker {
            image
            installNodeModules
            runBaseScript
            shell
          }
          environments {
            default
            description
            name
            required
            secure
            shared
            validation
          }
          events {
            description
            type
          }
          interfaces {
            cacheable
            name
            pageGroups
            path
            port
            prefix
            protocol
            type
            services {
              config
              name
            }
          }
          maintainers {
            email
            name
            url
          }
          owner {
            avatar
            did
            email
            fullName
          }
          payment {
            price {
              address
              symbol
              value
            }
            share {
              address
              name
              value
            }
          }
          repository {
            type
            url
          }
          requirements {
            aigne
            cpu
            os
            server
            fuels {
              address
              endpoint
              reason
              value
            }
          }
          resource {
            exportApi
            bundles {
              did
              public
              type
            }
            types {
              description
              type
            }
          }
          stats {
            downloads
            purchases
            star
          }
        }
      }
      runtimeInfo {
        cpus
        cpuUsage
        memoryUsage
        pid
        port
        runningDocker
        uptime
      }
      settings {
        actionConfig
        authentication
        didConnect
        enablePassportIssuance
        enableSessionHardening
        initialized
        notification
        oauth
        publicToStore
        theme
        whoCanAccess
        aigne {
          accessKeyId
          key
          model
          provider
          secretAccessKey
          url
          validationResult
        }
        autoBackup {
          enabled
        }
        autoCheckUpdate {
          enabled
        }
        children {
          deletedAt
          deployedFrom
          mountPoint
          status
          meta {
            bundleDid
            bundleName
            description
            did
            name
            title
            version
          }
        }
        endpointList {
          appDescription
          appName
          endpoint
          id
          protected
          scope
          url
        }
        federated {
          config {
            appId
            appPid
            autoLogin
            delegation
            isMaster
          }
          sites {
            aliasDid
            aliasDomain
            appDescription
            appId
            appliedAt
            appLogo
            appLogoRect
            appName
            appPid
            appUrl
            did
            isMaster
            pk
            serverId
            serverVersion
            status
            version
          }
        }
        gateway {
          cacheEnabled
          blockPolicy {
            blacklist
            enabled
            autoBlocking {
              blockDuration
              enabled
              statusCodes
              windowQuota
              windowSize
            }
          }
          proxyPolicy {
            enabled
            realIpHeader
            trustedProxies
            trustRecursive
          }
          requestLimit {
            burstDelay
            burstFactor
            enabled
            global
            methods
            rate
          }
          wafPolicy {
            enabled
            inboundAnomalyScoreThreshold
            logLevel
            mode
            outboundAnomalyScoreThreshold
          }
        }
        invite {
          enabled
        }
        navigations {
          activeColor
          activeIcon
          color
          component
          description
          from
          icon
          id
          link
          parent
          private
          role
          section
          title
          visible
        }
        org {
          enabled
          maxMemberPerOrg
          maxOrgPerUser
        }
        owner {
          did
          pk
        }
        session {
          cacheTtl
          enableBlacklist
          salt
          ttl
          email {
            domainBlackList
            domainWhiteList
            enabled
            enableDomainBlackList
            enableDomainWhiteList
            requireUnique
            requireVerified
            trustOauthProviders
            trustedIssuers {
              id
              name
              pk
            }
          }
          phone {
            enabled
            enableRegionBlackList
            enableRegionWhiteList
            regionBlackList
            regionWhiteList
            requireUnique
            requireVerified
            trustedIssuers {
              id
              name
              pk
            }
          }
        }
        storeList {
          cdnUrl
          description
          id
          logoUrl
          maintainer
          name
          protected
          scope
          url
        }
        subService {
          domain
          enabled
          staticRoot
        }
        trustedFactories {
          factoryAddress
          holderDid
          issuerDid
          remark
          passport {
            role
            ttl
            ttlPolicy
          }
        }
        trustedPassports {
          issuerDid
          remark
          mappings {
            from {
              passport
            }
            to {
              role
              ttl
              ttlPolicy
            }
          }
        }
      }
      site {
        corsAllowedOrigins
        domain
        domainAliases
        id
        isProtected
        rules {
          id
          isProtected
          from {
            pathPrefix
            header {
              key
              type
              value
            }
          }
          to {
            componentId
            did
            interfaceName
            pageGroup
            port
            redirectCode
            type
            url
            response {
              body
              contentType
              status
            }
          }
        }
      }
      trustedFactories {
        factoryAddress
        holderDid
        issuerDid
        remark
        passport {
          role
          ttl
          ttlPolicy
        }
      }
      trustedPassports {
        issuerDid
        remark
        mappings {
          from {
            passport
          }
          to {
            role
            ttl
            ttlPolicy
          }
        }
      }
      vaults {
        approverDid
        approverPk
        approverSig
        at
        did
        pk
        sig
      }
    }
  }
}
```

### configVault

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
mutation {
  configVault {
    code
    sessionId
  }
}
```

### sendEmail

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
mutation {
  sendEmail {
    code
  }
}
```

### sendPush

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
mutation {
  sendPush {
    code
  }
}
```

### joinFederatedLogin

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
mutation {
  joinFederatedLogin {
    code
    blocklet {
      appDid
      appPid
      bundleSource
      createdAt
      deployedFrom
      dynamic
      enableDocker
      enableDockerNetwork
      enablePassportIssuance
      externalSk
      externalSkSource
      installedAt
      mode
      mountPoint
      pausedAt
      port
      ports
      source
      startedAt
      status
      stoppedAt
      structVersion
      updatedAt
      appRuntimeInfo {
        cpus
        cpuUsage
        memoryUsage
        pid
        port
        runningDocker
        uptime
      }
      children {
        bundleSource
        createdAt
        deployedFrom
        dynamic
        greenStatus
        installedAt
        mode
        mountPoint
        pausedAt
        port
        ports
        required
        source
        startedAt
        status
        stoppedAt
        appRuntimeInfo {
          cpus
          cpuUsage
          memoryUsage
          pid
          port
          runningDocker
          uptime
        }
        children {
          bundleSource
          createdAt
          deployedFrom
          dynamic
          greenStatus
          installedAt
          mode
          mountPoint
          pausedAt
          port
          ports
          required
          source
          startedAt
          status
          stoppedAt
          appRuntimeInfo {
            cpus
            cpuUsage
            memoryUsage
            pid
            port
            runningDocker
            uptime
          }
          children {
            bundleSource
            createdAt
            deployedFrom
            dynamic
            greenStatus
            installedAt
            mode
            mountPoint
            pausedAt
            port
            ports
            required
            source
            startedAt
            status
            stoppedAt
            appRuntimeInfo {
              cpus
              cpuUsage
              memoryUsage
              pid
              port
              runningDocker
              uptime
            }
            children {
              bundleSource
              createdAt
              deployedFrom
              dynamic
              greenStatus
              installedAt
              mode
              mountPoint
              pausedAt
              port
              ports
              required
              source
              startedAt
              status
              stoppedAt
              appRuntimeInfo {
                cpus
                cpuUsage
                memoryUsage
                pid
                port
                runningDocker
                uptime
              }
              children {
                bundleSource
                createdAt
                deployedFrom
                dynamic
                greenStatus
                installedAt
                mode
                mountPoint
                pausedAt
                port
                ports
                required
                source
                startedAt
                status
                stoppedAt
              }
              configs {
                custom
                description
                key
                required
                secure
                shared
                validation
                value
              }
              dependents {
                id
                required
              }
              diskInfo {
                app
                blocklets
                cache
                data
                log
              }
              engine {
                available
                description
                displayName
                logo
                name
                version
                visible
              }
              environments {
                custom
                description
                key
                required
                secure
                shared
                validation
                value
              }
              meta {
                bundleDid
                bundleName
                community
                description
                did
                documentation
                engine
                group
                homepage
                keywords
                lastPublishedAt
                logo
                main
                name
                navigation
                nftFactory
                path
                resources
                screenshots
                support
                title
                version
              }
              runtimeInfo {
                cpus
                cpuUsage
                memoryUsage
                pid
                port
                runningDocker
                uptime
              }
            }
            configs {
              custom
              description
              key
              required
              secure
              shared
              validation
              value
            }
            dependents {
              id
              required
            }
            diskInfo {
              app
              blocklets
              cache
              data
              log
            }
            engine {
              available
              description
              displayName
              logo
              name
              version
              visible
            }
            environments {
              custom
              description
              key
              required
              secure
              shared
              validation
              value
            }
            meta {
              bundleDid
              bundleName
              community
              description
              did
              documentation
              engine
              group
              homepage
              keywords
              lastPublishedAt
              logo
              main
              name
              navigation
              nftFactory
              path
              resources
              screenshots
              support
              title
              version
              author {
                email
                name
                url
              }
              capabilities {
                clusterMode
                component
                didSpace
                navigation
                resourceExportApi
              }
              components {
                mountPoint
                name
                required
              }
              contributors {
                email
                name
                url
              }
              dist {
                integrity
                tarball
              }
              docker {
                image
                installNodeModules
                runBaseScript
                shell
              }
              environments {
                default
                description
                name
                required
                secure
                shared
                validation
              }
              events {
                description
                type
              }
              interfaces {
                cacheable
                name
                pageGroups
                path
                port
                prefix
                protocol
                type
              }
              maintainers {
                email
                name
                url
              }
              owner {
                avatar
                did
                email
                fullName
              }
              repository {
                type
                url
              }
              requirements {
                aigne
                cpu
                os
                server
              }
              resource {
                exportApi
              }
              stats {
                downloads
                purchases
                star
              }
            }
            runtimeInfo {
              cpus
              cpuUsage
              memoryUsage
              pid
              port
              runningDocker
              uptime
            }
          }
          configs {
            custom
            description
            key
            required
            secure
            shared
            validation
            value
          }
          dependents {
            id
            required
          }
          diskInfo {
            app
            blocklets
            cache
            data
            log
          }
          engine {
            available
            description
            displayName
            logo
            name
            version
            visible
          }
          environments {
            custom
            description
            key
            required
            secure
            shared
            validation
            value
          }
          meta {
            bundleDid
            bundleName
            community
            description
            did
            documentation
            engine
            group
            homepage
            keywords
            lastPublishedAt
            logo
            main
            name
            navigation
            nftFactory
            path
            resources
            screenshots
            support
            title
            version
            author {
              email
              name
              url
            }
            capabilities {
              clusterMode
              component
              didSpace
              navigation
              resourceExportApi
            }
            components {
              mountPoint
              name
              required
            }
            contributors {
              email
              name
              url
            }
            dist {
              integrity
              tarball
            }
            docker {
              image
              installNodeModules
              runBaseScript
              shell
            }
            environments {
              default
              description
              name
              required
              secure
              shared
              validation
            }
            events {
              description
              type
            }
            interfaces {
              cacheable
              name
              pageGroups
              path
              port
              prefix
              protocol
              type
              services {
                config
                name
              }
            }
            maintainers {
              email
              name
              url
            }
            owner {
              avatar
              did
              email
              fullName
            }
            payment {
              price {
                address
                symbol
                value
              }
              share {
                address
                name
                value
              }
            }
            repository {
              type
              url
            }
            requirements {
              aigne
              cpu
              os
              server
              fuels {
                address
                endpoint
                reason
                value
              }
            }
            resource {
              exportApi
              bundles {
                did
                public
                type
              }
              types {
                description
                type
              }
            }
            stats {
              downloads
              purchases
              star
            }
          }
          runtimeInfo {
            cpus
            cpuUsage
            memoryUsage
            pid
            port
            runningDocker
            uptime
          }
        }
        configs {
          custom
          description
          key
          required
          secure
          shared
          validation
          value
        }
        dependents {
          id
          required
        }
        diskInfo {
          app
          blocklets
          cache
          data
          log
        }
        engine {
          available
          description
          displayName
          logo
          name
          version
          visible
        }
        environments {
          custom
          description
          key
          required
          secure
          shared
          validation
          value
        }
        meta {
          bundleDid
          bundleName
          community
          description
          did
          documentation
          engine
          group
          homepage
          keywords
          lastPublishedAt
          logo
          main
          name
          navigation
          nftFactory
          path
          resources
          screenshots
          support
          title
          version
          author {
            email
            name
            url
          }
          capabilities {
            clusterMode
            component
            didSpace
            navigation
            resourceExportApi
          }
          components {
            mountPoint
            name
            required
          }
          contributors {
            email
            name
            url
          }
          dist {
            integrity
            tarball
          }
          docker {
            image
            installNodeModules
            runBaseScript
            shell
          }
          environments {
            default
            description
            name
            required
            secure
            shared
            validation
          }
          events {
            description
            type
          }
          interfaces {
            cacheable
            name
            pageGroups
            path
            port
            prefix
            protocol
            type
            services {
              config
              name
            }
          }
          maintainers {
            email
            name
            url
          }
          owner {
            avatar
            did
            email
            fullName
          }
          payment {
            price {
              address
              symbol
              value
            }
            share {
              address
              name
              value
            }
          }
          repository {
            type
            url
          }
          requirements {
            aigne
            cpu
            os
            server
            fuels {
              address
              endpoint
              reason
              value
            }
          }
          resource {
            exportApi
            bundles {
              did
              public
              type
            }
            types {
              description
              type
            }
          }
          stats {
            downloads
            purchases
            star
          }
        }
        runtimeInfo {
          cpus
          cpuUsage
          memoryUsage
          pid
          port
          runningDocker
          uptime
        }
      }
      configs {
        custom
        description
        key
        required
        secure
        shared
        validation
        value
      }
      controller {
        chainHost
        consumedAt
        expireDate
        id
        launcherSessionId
        launcherUrl
        nftId
        nftOwner
        ownerDid
        status {
          reason
          value
        }
      }
      diskInfo {
        app
        blocklets
        cache
        data
        log
      }
      engine {
        available
        description
        displayName
        logo
        name
        version
        visible
      }
      environments {
        custom
        description
        key
        required
        secure
        shared
        validation
        value
      }
      meta {
        bundleDid
        bundleName
        community
        description
        did
        documentation
        engine
        group
        homepage
        keywords
        lastPublishedAt
        logo
        main
        name
        navigation
        nftFactory
        path
        resources
        screenshots
        support
        title
        version
        author {
          email
          name
          url
        }
        capabilities {
          clusterMode
          component
          didSpace
          navigation
          resourceExportApi
        }
        components {
          mountPoint
          name
          required
        }
        contributors {
          email
          name
          url
        }
        dist {
          integrity
          tarball
        }
        docker {
          image
          installNodeModules
          runBaseScript
          shell
        }
        environments {
          default
          description
          name
          required
          secure
          shared
          validation
        }
        events {
          description
          type
        }
        interfaces {
          cacheable
          name
          pageGroups
          path
          port
          prefix
          protocol
          type
          services {
            config
            name
          }
        }
        maintainers {
          email
          name
          url
        }
        owner {
          avatar
          did
          email
          fullName
        }
        payment {
          price {
            address
            symbol
            value
          }
          share {
            address
            name
            value
          }
        }
        repository {
          type
          url
        }
        requirements {
          aigne
          cpu
          os
          server
          fuels {
            address
            endpoint
            reason
            value
          }
        }
        resource {
          exportApi
          bundles {
            did
            public
            type
          }
          types {
            description
            type
          }
        }
        stats {
          downloads
          purchases
          star
        }
      }
      migratedFrom {
        appDid
        appSk
        at
      }
      optionalComponents {
        bundleSource
        logoUrl
        dependencies {
          mountPoint
          parentDid
          parentName
          parentTitle
          required
        }
        meta {
          bundleDid
          bundleName
          community
          description
          did
          documentation
          engine
          group
          homepage
          keywords
          lastPublishedAt
          logo
          main
          name
          navigation
          nftFactory
          path
          resources
          screenshots
          support
          title
          version
          author {
            email
            name
            url
          }
          capabilities {
            clusterMode
            component
            didSpace
            navigation
            resourceExportApi
          }
          components {
            mountPoint
            name
            required
          }
          contributors {
            email
            name
            url
          }
          dist {
            integrity
            tarball
          }
          docker {
            image
            installNodeModules
            runBaseScript
            shell
          }
          environments {
            default
            description
            name
            required
            secure
            shared
            validation
          }
          events {
            description
            type
          }
          interfaces {
            cacheable
            name
            pageGroups
            path
            port
            prefix
            protocol
            type
            services {
              config
              name
            }
          }
          maintainers {
            email
            name
            url
          }
          owner {
            avatar
            did
            email
            fullName
          }
          payment {
            price {
              address
              symbol
              value
            }
            share {
              address
              name
              value
            }
          }
          repository {
            type
            url
          }
          requirements {
            aigne
            cpu
            os
            server
            fuels {
              address
              endpoint
              reason
              value
            }
          }
          resource {
            exportApi
            bundles {
              did
              public
              type
            }
            types {
              description
              type
            }
          }
          stats {
            downloads
            purchases
            star
          }
        }
      }
      runtimeInfo {
        cpus
        cpuUsage
        memoryUsage
        pid
        port
        runningDocker
        uptime
      }
      settings {
        actionConfig
        authentication
        didConnect
        enablePassportIssuance
        enableSessionHardening
        initialized
        notification
        oauth
        publicToStore
        theme
        whoCanAccess
        aigne {
          accessKeyId
          key
          model
          provider
          secretAccessKey
          url
          validationResult
        }
        autoBackup {
          enabled
        }
        autoCheckUpdate {
          enabled
        }
        children {
          deletedAt
          deployedFrom
          mountPoint
          status
          meta {
            bundleDid
            bundleName
            description
            did
            name
            title
            version
          }
        }
        endpointList {
          appDescription
          appName
          endpoint
          id
          protected
          scope
          url
        }
        federated {
          config {
            appId
            appPid
            autoLogin
            delegation
            isMaster
          }
          sites {
            aliasDid
            aliasDomain
            appDescription
            appId
            appliedAt
            appLogo
            appLogoRect
            appName
            appPid
            appUrl
            did
            isMaster
            pk
            serverId
            serverVersion
            status
            version
          }
        }
        gateway {
          cacheEnabled
          blockPolicy {
            blacklist
            enabled
            autoBlocking {
              blockDuration
              enabled
              statusCodes
              windowQuota
              windowSize
            }
          }
          proxyPolicy {
            enabled
            realIpHeader
            trustedProxies
            trustRecursive
          }
          requestLimit {
            burstDelay
            burstFactor
            enabled
            global
            methods
            rate
          }
          wafPolicy {
            enabled
            inboundAnomalyScoreThreshold
            logLevel
            mode
            outboundAnomalyScoreThreshold
          }
        }
        invite {
          enabled
        }
        navigations {
          activeColor
          activeIcon
          color
          component
          description
          from
          icon
          id
          link
          parent
          private
          role
          section
          title
          visible
        }
        org {
          enabled
          maxMemberPerOrg
          maxOrgPerUser
        }
        owner {
          did
          pk
        }
        session {
          cacheTtl
          enableBlacklist
          salt
          ttl
          email {
            domainBlackList
            domainWhiteList
            enabled
            enableDomainBlackList
            enableDomainWhiteList
            requireUnique
            requireVerified
            trustOauthProviders
            trustedIssuers {
              id
              name
              pk
            }
          }
          phone {
            enabled
            enableRegionBlackList
            enableRegionWhiteList
            regionBlackList
            regionWhiteList
            requireUnique
            requireVerified
            trustedIssuers {
              id
              name
              pk
            }
          }
        }
        storeList {
          cdnUrl
          description
          id
          logoUrl
          maintainer
          name
          protected
          scope
          url
        }
        subService {
          domain
          enabled
          staticRoot
        }
        trustedFactories {
          factoryAddress
          holderDid
          issuerDid
          remark
          passport {
            role
            ttl
            ttlPolicy
          }
        }
        trustedPassports {
          issuerDid
          remark
          mappings {
            from {
              passport
            }
            to {
              role
              ttl
              ttlPolicy
            }
          }
        }
      }
      site {
        corsAllowedOrigins
        domain
        domainAliases
        id
        isProtected
        rules {
          id
          isProtected
          from {
            pathPrefix
            header {
              key
              type
              value
            }
          }
          to {
            componentId
            did
            interfaceName
            pageGroup
            port
            redirectCode
            type
            url
            response {
              body
              contentType
              status
            }
          }
        }
      }
      trustedFactories {
        factoryAddress
        holderDid
        issuerDid
        remark
        passport {
          role
          ttl
          ttlPolicy
        }
      }
      trustedPassports {
        issuerDid
        remark
        mappings {
          from {
            passport
          }
          to {
            role
            ttl
            ttlPolicy
          }
        }
      }
      vaults {
        approverDid
        approverPk
        approverSig
        at
        did
        pk
        sig
      }
    }
  }
}
```

### quitFederatedLogin

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
mutation {
  quitFederatedLogin {
    code
    blocklet {
      appDid
      appPid
      bundleSource
      createdAt
      deployedFrom
      dynamic
      enableDocker
      enableDockerNetwork
      enablePassportIssuance
      externalSk
      externalSkSource
      installedAt
      mode
      mountPoint
      pausedAt
      port
      ports
      source
      startedAt
      status
      stoppedAt
      structVersion
      updatedAt
      appRuntimeInfo {
        cpus
        cpuUsage
        memoryUsage
        pid
        port
        runningDocker
        uptime
      }
      children {
        bundleSource
        createdAt
        deployedFrom
        dynamic
        greenStatus
        installedAt
        mode
        mountPoint
        pausedAt
        port
        ports
        required
        source
        startedAt
        status
        stoppedAt
        appRuntimeInfo {
          cpus
          cpuUsage
          memoryUsage
          pid
          port
          runningDocker
          uptime
        }
        children {
          bundleSource
          createdAt
          deployedFrom
          dynamic
          greenStatus
          installedAt
          mode
          mountPoint
          pausedAt
          port
          ports
          required
          source
          startedAt
          status
          stoppedAt
          appRuntimeInfo {
            cpus
            cpuUsage
            memoryUsage
            pid
            port
            runningDocker
            uptime
          }
          children {
            bundleSource
            createdAt
            deployedFrom
            dynamic
            greenStatus
            installedAt
            mode
            mountPoint
            pausedAt
            port
            ports
            required
            source
            startedAt
            status
            stoppedAt
            appRuntimeInfo {
              cpus
              cpuUsage
              memoryUsage
              pid
              port
              runningDocker
              uptime
            }
            children {
              bundleSource
              createdAt
              deployedFrom
              dynamic
              greenStatus
              installedAt
              mode
              mountPoint
              pausedAt
              port
              ports
              required
              source
              startedAt
              status
              stoppedAt
              appRuntimeInfo {
                cpus
                cpuUsage
                memoryUsage
                pid
                port
                runningDocker
                uptime
              }
              children {
                bundleSource
                createdAt
                deployedFrom
                dynamic
                greenStatus
                installedAt
                mode
                mountPoint
                pausedAt
                port
                ports
                required
                source
                startedAt
                status
                stoppedAt
              }
              configs {
                custom
                description
                key
                required
                secure
                shared
                validation
                value
              }
              dependents {
                id
                required
              }
              diskInfo {
                app
                blocklets
                cache
                data
                log
              }
              engine {
                available
                description
                displayName
                logo
                name
                version
                visible
              }
              environments {
                custom
                description
                key
                required
                secure
                shared
                validation
                value
              }
              meta {
                bundleDid
                bundleName
                community
                description
                did
                documentation
                engine
                group
                homepage
                keywords
                lastPublishedAt
                logo
                main
                name
                navigation
                nftFactory
                path
                resources
                screenshots
                support
                title
                version
              }
              runtimeInfo {
                cpus
                cpuUsage
                memoryUsage
                pid
                port
                runningDocker
                uptime
              }
            }
            configs {
              custom
              description
              key
              required
              secure
              shared
              validation
              value
            }
            dependents {
              id
              required
            }
            diskInfo {
              app
              blocklets
              cache
              data
              log
            }
            engine {
              available
              description
              displayName
              logo
              name
              version
              visible
            }
            environments {
              custom
              description
              key
              required
              secure
              shared
              validation
              value
            }
            meta {
              bundleDid
              bundleName
              community
              description
              did
              documentation
              engine
              group
              homepage
              keywords
              lastPublishedAt
              logo
              main
              name
              navigation
              nftFactory
              path
              resources
              screenshots
              support
              title
              version
              author {
                email
                name
                url
              }
              capabilities {
                clusterMode
                component
                didSpace
                navigation
                resourceExportApi
              }
              components {
                mountPoint
                name
                required
              }
              contributors {
                email
                name
                url
              }
              dist {
                integrity
                tarball
              }
              docker {
                image
                installNodeModules
                runBaseScript
                shell
              }
              environments {
                default
                description
                name
                required
                secure
                shared
                validation
              }
              events {
                description
                type
              }
              interfaces {
                cacheable
                name
                pageGroups
                path
                port
                prefix
                protocol
                type
              }
              maintainers {
                email
                name
                url
              }
              owner {
                avatar
                did
                email
                fullName
              }
              repository {
                type
                url
              }
              requirements {
                aigne
                cpu
                os
                server
              }
              resource {
                exportApi
              }
              stats {
                downloads
                purchases
                star
              }
            }
            runtimeInfo {
              cpus
              cpuUsage
              memoryUsage
              pid
              port
              runningDocker
              uptime
            }
          }
          configs {
            custom
            description
            key
            required
            secure
            shared
            validation
            value
          }
          dependents {
            id
            required
          }
          diskInfo {
            app
            blocklets
            cache
            data
            log
          }
          engine {
            available
            description
            displayName
            logo
            name
            version
            visible
          }
          environments {
            custom
            description
            key
            required
            secure
            shared
            validation
            value
          }
          meta {
            bundleDid
            bundleName
            community
            description
            did
            documentation
            engine
            group
            homepage
            keywords
            lastPublishedAt
            logo
            main
            name
            navigation
            nftFactory
            path
            resources
            screenshots
            support
            title
            version
            author {
              email
              name
              url
            }
            capabilities {
              clusterMode
              component
              didSpace
              navigation
              resourceExportApi
            }
            components {
              mountPoint
              name
              required
            }
            contributors {
              email
              name
              url
            }
            dist {
              integrity
              tarball
            }
            docker {
              image
              installNodeModules
              runBaseScript
              shell
            }
            environments {
              default
              description
              name
              required
              secure
              shared
              validation
            }
            events {
              description
              type
            }
            interfaces {
              cacheable
              name
              pageGroups
              path
              port
              prefix
              protocol
              type
              services {
                config
                name
              }
            }
            maintainers {
              email
              name
              url
            }
            owner {
              avatar
              did
              email
              fullName
            }
            payment {
              price {
                address
                symbol
                value
              }
              share {
                address
                name
                value
              }
            }
            repository {
              type
              url
            }
            requirements {
              aigne
              cpu
              os
              server
              fuels {
                address
                endpoint
                reason
                value
              }
            }
            resource {
              exportApi
              bundles {
                did
                public
                type
              }
              types {
                description
                type
              }
            }
            stats {
              downloads
              purchases
              star
            }
          }
          runtimeInfo {
            cpus
            cpuUsage
            memoryUsage
            pid
            port
            runningDocker
            uptime
          }
        }
        configs {
          custom
          description
          key
          required
          secure
          shared
          validation
          value
        }
        dependents {
          id
          required
        }
        diskInfo {
          app
          blocklets
          cache
          data
          log
        }
        engine {
          available
          description
          displayName
          logo
          name
          version
          visible
        }
        environments {
          custom
          description
          key
          required
          secure
          shared
          validation
          value
        }
        meta {
          bundleDid
          bundleName
          community
          description
          did
          documentation
          engine
          group
          homepage
          keywords
          lastPublishedAt
          logo
          main
          name
          navigation
          nftFactory
          path
          resources
          screenshots
          support
          title
          version
          author {
            email
            name
            url
          }
          capabilities {
            clusterMode
            component
            didSpace
            navigation
            resourceExportApi
          }
          components {
            mountPoint
            name
            required
          }
          contributors {
            email
            name
            url
          }
          dist {
            integrity
            tarball
          }
          docker {
            image
            installNodeModules
            runBaseScript
            shell
          }
          environments {
            default
            description
            name
            required
            secure
            shared
            validation
          }
          events {
            description
            type
          }
          interfaces {
            cacheable
            name
            pageGroups
            path
            port
            prefix
            protocol
            type
            services {
              config
              name
            }
          }
          maintainers {
            email
            name
            url
          }
          owner {
            avatar
            did
            email
            fullName
          }
          payment {
            price {
              address
              symbol
              value
            }
            share {
              address
              name
              value
            }
          }
          repository {
            type
            url
          }
          requirements {
            aigne
            cpu
            os
            server
            fuels {
              address
              endpoint
              reason
              value
            }
          }
          resource {
            exportApi
            bundles {
              did
              public
              type
            }
            types {
              description
              type
            }
          }
          stats {
            downloads
            purchases
            star
          }
        }
        runtimeInfo {
          cpus
          cpuUsage
          memoryUsage
          pid
          port
          runningDocker
          uptime
        }
      }
      configs {
        custom
        description
        key
        required
        secure
        shared
        validation
        value
      }
      controller {
        chainHost
        consumedAt
        expireDate
        id
        launcherSessionId
        launcherUrl
        nftId
        nftOwner
        ownerDid
        status {
          reason
          value
        }
      }
      diskInfo {
        app
        blocklets
        cache
        data
        log
      }
      engine {
        available
        description
        displayName
        logo
        name
        version
        visible
      }
      environments {
        custom
        description
        key
        required
        secure
        shared
        validation
        value
      }
      meta {
        bundleDid
        bundleName
        community
        description
        did
        documentation
        engine
        group
        homepage
        keywords
        lastPublishedAt
        logo
        main
        name
        navigation
        nftFactory
        path
        resources
        screenshots
        support
        title
        version
        author {
          email
          name
          url
        }
        capabilities {
          clusterMode
          component
          didSpace
          navigation
          resourceExportApi
        }
        components {
          mountPoint
          name
          required
        }
        contributors {
          email
          name
          url
        }
        dist {
          integrity
          tarball
        }
        docker {
          image
          installNodeModules
          runBaseScript
          shell
        }
        environments {
          default
          description
          name
          required
          secure
          shared
          validation
        }
        events {
          description
          type
        }
        interfaces {
          cacheable
          name
          pageGroups
          path
          port
          prefix
          protocol
          type
          services {
            config
            name
          }
        }
        maintainers {
          email
          name
          url
        }
        owner {
          avatar
          did
          email
          fullName
        }
        payment {
          price {
            address
            symbol
            value
          }
          share {
            address
            name
            value
          }
        }
        repository {
          type
          url
        }
        requirements {
          aigne
          cpu
          os
          server
          fuels {
            address
            endpoint
            reason
            value
          }
        }
        resource {
          exportApi
          bundles {
            did
            public
            type
          }
          types {
            description
            type
          }
        }
        stats {
          downloads
          purchases
          star
        }
      }
      migratedFrom {
        appDid
        appSk
        at
      }
      optionalComponents {
        bundleSource
        logoUrl
        dependencies {
          mountPoint
          parentDid
          parentName
          parentTitle
          required
        }
        meta {
          bundleDid
          bundleName
          community
          description
          did
          documentation
          engine
          group
          homepage
          keywords
          lastPublishedAt
          logo
          main
          name
          navigation
          nftFactory
          path
          resources
          screenshots
          support
          title
          version
          author {
            email
            name
            url
          }
          capabilities {
            clusterMode
            component
            didSpace
            navigation
            resourceExportApi
          }
          components {
            mountPoint
            name
            required
          }
          contributors {
            email
            name
            url
          }
          dist {
            integrity
            tarball
          }
          docker {
            image
            installNodeModules
            runBaseScript
            shell
          }
          environments {
            default
            description
            name
            required
            secure
            shared
            validation
          }
          events {
            description
            type
          }
          interfaces {
            cacheable
            name
            pageGroups
            path
            port
            prefix
            protocol
            type
            services {
              config
              name
            }
          }
          maintainers {
            email
            name
            url
          }
          owner {
            avatar
            did
            email
            fullName
          }
          payment {
            price {
              address
              symbol
              value
            }
            share {
              address
              name
              value
            }
          }
          repository {
            type
            url
          }
          requirements {
            aigne
            cpu
            os
            server
            fuels {
              address
              endpoint
              reason
              value
            }
          }
          resource {
            exportApi
            bundles {
              did
              public
              type
            }
            types {
              description
              type
            }
          }
          stats {
            downloads
            purchases
            star
          }
        }
      }
      runtimeInfo {
        cpus
        cpuUsage
        memoryUsage
        pid
        port
        runningDocker
        uptime
      }
      settings {
        actionConfig
        authentication
        didConnect
        enablePassportIssuance
        enableSessionHardening
        initialized
        notification
        oauth
        publicToStore
        theme
        whoCanAccess
        aigne {
          accessKeyId
          key
          model
          provider
          secretAccessKey
          url
          validationResult
        }
        autoBackup {
          enabled
        }
        autoCheckUpdate {
          enabled
        }
        children {
          deletedAt
          deployedFrom
          mountPoint
          status
          meta {
            bundleDid
            bundleName
            description
            did
            name
            title
            version
          }
        }
        endpointList {
          appDescription
          appName
          endpoint
          id
          protected
          scope
          url
        }
        federated {
          config {
            appId
            appPid
            autoLogin
            delegation
            isMaster
          }
          sites {
            aliasDid
            aliasDomain
            appDescription
            appId
            appliedAt
            appLogo
            appLogoRect
            appName
            appPid
            appUrl
            did
            isMaster
            pk
            serverId
            serverVersion
            status
            version
          }
        }
        gateway {
          cacheEnabled
          blockPolicy {
            blacklist
            enabled
            autoBlocking {
              blockDuration
              enabled
              statusCodes
              windowQuota
              windowSize
            }
          }
          proxyPolicy {
            enabled
            realIpHeader
            trustedProxies
            trustRecursive
          }
          requestLimit {
            burstDelay
            burstFactor
            enabled
            global
            methods
            rate
          }
          wafPolicy {
            enabled
            inboundAnomalyScoreThreshold
            logLevel
            mode
            outboundAnomalyScoreThreshold
          }
        }
        invite {
          enabled
        }
        navigations {
          activeColor
          activeIcon
          color
          component
          description
          from
          icon
          id
          link
          parent
          private
          role
          section
          title
          visible
        }
        org {
          enabled
          maxMemberPerOrg
          maxOrgPerUser
        }
        owner {
          did
          pk
        }
        session {
          cacheTtl
          enableBlacklist
          salt
          ttl
          email {
            domainBlackList
            domainWhiteList
            enabled
            enableDomainBlackList
            enableDomainWhiteList
            requireUnique
            requireVerified
            trustOauthProviders
            trustedIssuers {
              id
              name
              pk
            }
          }
          phone {
            enabled
            enableRegionBlackList
            enableRegionWhiteList
            regionBlackList
            regionWhiteList
            requireUnique
            requireVerified
            trustedIssuers {
              id
              name
              pk
            }
          }
        }
        storeList {
          cdnUrl
          description
          id
          logoUrl
          maintainer
          name
          protected
          scope
          url
        }
        subService {
          domain
          enabled
          staticRoot
        }
        trustedFactories {
          factoryAddress
          holderDid
          issuerDid
          remark
          passport {
            role
            ttl
            ttlPolicy
          }
        }
        trustedPassports {
          issuerDid
          remark
          mappings {
            from {
              passport
            }
            to {
              role
              ttl
              ttlPolicy
            }
          }
        }
      }
      site {
        corsAllowedOrigins
        domain
        domainAliases
        id
        isProtected
        rules {
          id
          isProtected
          from {
            pathPrefix
            header {
              key
              type
              value
            }
          }
          to {
            componentId
            did
            interfaceName
            pageGroup
            port
            redirectCode
            type
            url
            response {
              body
              contentType
              status
            }
          }
        }
      }
      trustedFactories {
        factoryAddress
        holderDid
        issuerDid
        remark
        passport {
          role
          ttl
          ttlPolicy
        }
      }
      trustedPassports {
        issuerDid
        remark
        mappings {
          from {
            passport
          }
          to {
            role
            ttl
            ttlPolicy
          }
        }
      }
      vaults {
        approverDid
        approverPk
        approverSig
        at
        did
        pk
        sig
      }
    }
  }
}
```

### disbandFederatedLogin

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
mutation {
  disbandFederatedLogin {
    code
    blocklet {
      appDid
      appPid
      bundleSource
      createdAt
      deployedFrom
      dynamic
      enableDocker
      enableDockerNetwork
      enablePassportIssuance
      externalSk
      externalSkSource
      installedAt
      mode
      mountPoint
      pausedAt
      port
      ports
      source
      startedAt
      status
      stoppedAt
      structVersion
      updatedAt
      appRuntimeInfo {
        cpus
        cpuUsage
        memoryUsage
        pid
        port
        runningDocker
        uptime
      }
      children {
        bundleSource
        createdAt
        deployedFrom
        dynamic
        greenStatus
        installedAt
        mode
        mountPoint
        pausedAt
        port
        ports
        required
        source
        startedAt
        status
        stoppedAt
        appRuntimeInfo {
          cpus
          cpuUsage
          memoryUsage
          pid
          port
          runningDocker
          uptime
        }
        children {
          bundleSource
          createdAt
          deployedFrom
          dynamic
          greenStatus
          installedAt
          mode
          mountPoint
          pausedAt
          port
          ports
          required
          source
          startedAt
          status
          stoppedAt
          appRuntimeInfo {
            cpus
            cpuUsage
            memoryUsage
            pid
            port
            runningDocker
            uptime
          }
          children {
            bundleSource
            createdAt
            deployedFrom
            dynamic
            greenStatus
            installedAt
            mode
            mountPoint
            pausedAt
            port
            ports
            required
            source
            startedAt
            status
            stoppedAt
            appRuntimeInfo {
              cpus
              cpuUsage
              memoryUsage
              pid
              port
              runningDocker
              uptime
            }
            children {
              bundleSource
              createdAt
              deployedFrom
              dynamic
              greenStatus
              installedAt
              mode
              mountPoint
              pausedAt
              port
              ports
              required
              source
              startedAt
              status
              stoppedAt
              appRuntimeInfo {
                cpus
                cpuUsage
                memoryUsage
                pid
                port
                runningDocker
                uptime
              }
              children {
                bundleSource
                createdAt
                deployedFrom
                dynamic
                greenStatus
                installedAt
                mode
                mountPoint
                pausedAt
                port
                ports
                required
                source
                startedAt
                status
                stoppedAt
              }
              configs {
                custom
                description
                key
                required
                secure
                shared
                validation
                value
              }
              dependents {
                id
                required
              }
              diskInfo {
                app
                blocklets
                cache
                data
                log
              }
              engine {
                available
                description
                displayName
                logo
                name
                version
                visible
              }
              environments {
                custom
                description
                key
                required
                secure
                shared
                validation
                value
              }
              meta {
                bundleDid
                bundleName
                community
                description
                did
                documentation
                engine
                group
                homepage
                keywords
                lastPublishedAt
                logo
                main
                name
                navigation
                nftFactory
                path
                resources
                screenshots
                support
                title
                version
              }
              runtimeInfo {
                cpus
                cpuUsage
                memoryUsage
                pid
                port
                runningDocker
                uptime
              }
            }
            configs {
              custom
              description
              key
              required
              secure
              shared
              validation
              value
            }
            dependents {
              id
              required
            }
            diskInfo {
              app
              blocklets
              cache
              data
              log
            }
            engine {
              available
              description
              displayName
              logo
              name
              version
              visible
            }
            environments {
              custom
              description
              key
              required
              secure
              shared
              validation
              value
            }
            meta {
              bundleDid
              bundleName
              community
              description
              did
              documentation
              engine
              group
              homepage
              keywords
              lastPublishedAt
              logo
              main
              name
              navigation
              nftFactory
              path
              resources
              screenshots
              support
              title
              version
              author {
                email
                name
                url
              }
              capabilities {
                clusterMode
                component
                didSpace
                navigation
                resourceExportApi
              }
              components {
                mountPoint
                name
                required
              }
              contributors {
                email
                name
                url
              }
              dist {
                integrity
                tarball
              }
              docker {
                image
                installNodeModules
                runBaseScript
                shell
              }
              environments {
                default
                description
                name
                required
                secure
                shared
                validation
              }
              events {
                description
                type
              }
              interfaces {
                cacheable
                name
                pageGroups
                path
                port
                prefix
                protocol
                type
              }
              maintainers {
                email
                name
                url
              }
              owner {
                avatar
                did
                email
                fullName
              }
              repository {
                type
                url
              }
              requirements {
                aigne
                cpu
                os
                server
              }
              resource {
                exportApi
              }
              stats {
                downloads
                purchases
                star
              }
            }
            runtimeInfo {
              cpus
              cpuUsage
              memoryUsage
              pid
              port
              runningDocker
              uptime
            }
          }
          configs {
            custom
            description
            key
            required
            secure
            shared
            validation
            value
          }
          dependents {
            id
            required
          }
          diskInfo {
            app
            blocklets
            cache
            data
            log
          }
          engine {
            available
            description
            displayName
            logo
            name
            version
            visible
          }
          environments {
            custom
            description
            key
            required
            secure
            shared
            validation
            value
          }
          meta {
            bundleDid
            bundleName
            community
            description
            did
            documentation
            engine
            group
            homepage
            keywords
            lastPublishedAt
            logo
            main
            name
            navigation
            nftFactory
            path
            resources
            screenshots
            support
            title
            version
            author {
              email
              name
              url
            }
            capabilities {
              clusterMode
              component
              didSpace
              navigation
              resourceExportApi
            }
            components {
              mountPoint
              name
              required
            }
            contributors {
              email
              name
              url
            }
            dist {
              integrity
              tarball
            }
            docker {
              image
              installNodeModules
              runBaseScript
              shell
            }
            environments {
              default
              description
              name
              required
              secure
              shared
              validation
            }
            events {
              description
              type
            }
            interfaces {
              cacheable
              name
              pageGroups
              path
              port
              prefix
              protocol
              type
              services {
                config
                name
              }
            }
            maintainers {
              email
              name
              url
            }
            owner {
              avatar
              did
              email
              fullName
            }
            payment {
              price {
                address
                symbol
                value
              }
              share {
                address
                name
                value
              }
            }
            repository {
              type
              url
            }
            requirements {
              aigne
              cpu
              os
              server
              fuels {
                address
                endpoint
                reason
                value
              }
            }
            resource {
              exportApi
              bundles {
                did
                public
                type
              }
              types {
                description
                type
              }
            }
            stats {
              downloads
              purchases
              star
            }
          }
          runtimeInfo {
            cpus
            cpuUsage
            memoryUsage
            pid
            port
            runningDocker
            uptime
          }
        }
        configs {
          custom
          description
          key
          required
          secure
          shared
          validation
          value
        }
        dependents {
          id
          required
        }
        diskInfo {
          app
          blocklets
          cache
          data
          log
        }
        engine {
          available
          description
          displayName
          logo
          name
          version
          visible
        }
        environments {
          custom
          description
          key
          required
          secure
          shared
          validation
          value
        }
        meta {
          bundleDid
          bundleName
          community
          description
          did
          documentation
          engine
          group
          homepage
          keywords
          lastPublishedAt
          logo
          main
          name
          navigation
          nftFactory
          path
          resources
          screenshots
          support
          title
          version
          author {
            email
            name
            url
          }
          capabilities {
            clusterMode
            component
            didSpace
            navigation
            resourceExportApi
          }
          components {
            mountPoint
            name
            required
          }
          contributors {
            email
            name
            url
          }
          dist {
            integrity
            tarball
          }
          docker {
            image
            installNodeModules
            runBaseScript
            shell
          }
          environments {
            default
            description
            name
            required
            secure
            shared
            validation
          }
          events {
            description
            type
          }
          interfaces {
            cacheable
            name
            pageGroups
            path
            port
            prefix
            protocol
            type
            services {
              config
              name
            }
          }
          maintainers {
            email
            name
            url
          }
          owner {
            avatar
            did
            email
            fullName
          }
          payment {
            price {
              address
              symbol
              value
            }
            share {
              address
              name
              value
            }
          }
          repository {
            type
            url
          }
          requirements {
            aigne
            cpu
            os
            server
            fuels {
              address
              endpoint
              reason
              value
            }
          }
          resource {
            exportApi
            bundles {
              did
              public
              type
            }
            types {
              description
              type
            }
          }
          stats {
            downloads
            purchases
            star
          }
        }
        runtimeInfo {
          cpus
          cpuUsage
          memoryUsage
          pid
          port
          runningDocker
          uptime
        }
      }
      configs {
        custom
        description
        key
        required
        secure
        shared
        validation
        value
      }
      controller {
        chainHost
        consumedAt
        expireDate
        id
        launcherSessionId
        launcherUrl
        nftId
        nftOwner
        ownerDid
        status {
          reason
          value
        }
      }
      diskInfo {
        app
        blocklets
        cache
        data
        log
      }
      engine {
        available
        description
        displayName
        logo
        name
        version
        visible
      }
      environments {
        custom
        description
        key
        required
        secure
        shared
        validation
        value
      }
      meta {
        bundleDid
        bundleName
        community
        description
        did
        documentation
        engine
        group
        homepage
        keywords
        lastPublishedAt
        logo
        main
        name
        navigation
        nftFactory
        path
        resources
        screenshots
        support
        title
        version
        author {
          email
          name
          url
        }
        capabilities {
          clusterMode
          component
          didSpace
          navigation
          resourceExportApi
        }
        components {
          mountPoint
          name
          required
        }
        contributors {
          email
          name
          url
        }
        dist {
          integrity
          tarball
        }
        docker {
          image
          installNodeModules
          runBaseScript
          shell
        }
        environments {
          default
          description
          name
          required
          secure
          shared
          validation
        }
        events {
          description
          type
        }
        interfaces {
          cacheable
          name
          pageGroups
          path
          port
          prefix
          protocol
          type
          services {
            config
            name
          }
        }
        maintainers {
          email
          name
          url
        }
        owner {
          avatar
          did
          email
          fullName
        }
        payment {
          price {
            address
            symbol
            value
          }
          share {
            address
            name
            value
          }
        }
        repository {
          type
          url
        }
        requirements {
          aigne
          cpu
          os
          server
          fuels {
            address
            endpoint
            reason
            value
          }
        }
        resource {
          exportApi
          bundles {
            did
            public
            type
          }
          types {
            description
            type
          }
        }
        stats {
          downloads
          purchases
          star
        }
      }
      migratedFrom {
        appDid
        appSk
        at
      }
      optionalComponents {
        bundleSource
        logoUrl
        dependencies {
          mountPoint
          parentDid
          parentName
          parentTitle
          required
        }
        meta {
          bundleDid
          bundleName
          community
          description
          did
          documentation
          engine
          group
          homepage
          keywords
          lastPublishedAt
          logo
          main
          name
          navigation
          nftFactory
          path
          resources
          screenshots
          support
          title
          version
          author {
            email
            name
            url
          }
          capabilities {
            clusterMode
            component
            didSpace
            navigation
            resourceExportApi
          }
          components {
            mountPoint
            name
            required
          }
          contributors {
            email
            name
            url
          }
          dist {
            integrity
            tarball
          }
          docker {
            image
            installNodeModules
            runBaseScript
            shell
          }
          environments {
            default
            description
            name
            required
            secure
            shared
            validation
          }
          events {
            description
            type
          }
          interfaces {
            cacheable
            name
            pageGroups
            path
            port
            prefix
            protocol
            type
            services {
              config
              name
            }
          }
          maintainers {
            email
            name
            url
          }
          owner {
            avatar
            did
            email
            fullName
          }
          payment {
            price {
              address
              symbol
              value
            }
            share {
              address
              name
              value
            }
          }
          repository {
            type
            url
          }
          requirements {
            aigne
            cpu
            os
            server
            fuels {
              address
              endpoint
              reason
              value
            }
          }
          resource {
            exportApi
            bundles {
              did
              public
              type
            }
            types {
              description
              type
            }
          }
          stats {
            downloads
            purchases
            star
          }
        }
      }
      runtimeInfo {
        cpus
        cpuUsage
        memoryUsage
        pid
        port
        runningDocker
        uptime
      }
      settings {
        actionConfig
        authentication
        didConnect
        enablePassportIssuance
        enableSessionHardening
        initialized
        notification
        oauth
        publicToStore
        theme
        whoCanAccess
        aigne {
          accessKeyId
          key
          model
          provider
          secretAccessKey
          url
          validationResult
        }
        autoBackup {
          enabled
        }
        autoCheckUpdate {
          enabled
        }
        children {
          deletedAt
          deployedFrom
          mountPoint
          status
          meta {
            bundleDid
            bundleName
            description
            did
            name
            title
            version
          }
        }
        endpointList {
          appDescription
          appName
          endpoint
          id
          protected
          scope
          url
        }
        federated {
          config {
            appId
            appPid
            autoLogin
            delegation
            isMaster
          }
          sites {
            aliasDid
            aliasDomain
            appDescription
            appId
            appliedAt
            appLogo
            appLogoRect
            appName
            appPid
            appUrl
            did
            isMaster
            pk
            serverId
            serverVersion
            status
            version
          }
        }
        gateway {
          cacheEnabled
          blockPolicy {
            blacklist
            enabled
            autoBlocking {
              blockDuration
              enabled
              statusCodes
              windowQuota
              windowSize
            }
          }
          proxyPolicy {
            enabled
            realIpHeader
            trustedProxies
            trustRecursive
          }
          requestLimit {
            burstDelay
            burstFactor
            enabled
            global
            methods
            rate
          }
          wafPolicy {
            enabled
            inboundAnomalyScoreThreshold
            logLevel
            mode
            outboundAnomalyScoreThreshold
          }
        }
        invite {
          enabled
        }
        navigations {
          activeColor
          activeIcon
          color
          component
          description
          from
          icon
          id
          link
          parent
          private
          role
          section
          title
          visible
        }
        org {
          enabled
          maxMemberPerOrg
          maxOrgPerUser
        }
        owner {
          did
          pk
        }
        session {
          cacheTtl
          enableBlacklist
          salt
          ttl
          email {
            domainBlackList
            domainWhiteList
            enabled
            enableDomainBlackList
            enableDomainWhiteList
            requireUnique
            requireVerified
            trustOauthProviders
            trustedIssuers {
              id
              name
              pk
            }
          }
          phone {
            enabled
            enableRegionBlackList
            enableRegionWhiteList
            regionBlackList
            regionWhiteList
            requireUnique
            requireVerified
            trustedIssuers {
              id
              name
              pk
            }
          }
        }
        storeList {
          cdnUrl
          description
          id
          logoUrl
          maintainer
          name
          protected
          scope
          url
        }
        subService {
          domain
          enabled
          staticRoot
        }
        trustedFactories {
          factoryAddress
          holderDid
          issuerDid
          remark
          passport {
            role
            ttl
            ttlPolicy
          }
        }
        trustedPassports {
          issuerDid
          remark
          mappings {
            from {
              passport
            }
            to {
              role
              ttl
              ttlPolicy
            }
          }
        }
      }
      site {
        corsAllowedOrigins
        domain
        domainAliases
        id
        isProtected
        rules {
          id
          isProtected
          from {
            pathPrefix
            header {
              key
              type
              value
            }
          }
          to {
            componentId
            did
            interfaceName
            pageGroup
            port
            redirectCode
            type
            url
            response {
              body
              contentType
              status
            }
          }
        }
      }
      trustedFactories {
        factoryAddress
        holderDid
        issuerDid
        remark
        passport {
          role
          ttl
          ttlPolicy
        }
      }
      trustedPassports {
        issuerDid
        remark
        mappings {
          from {
            passport
          }
          to {
            role
            ttl
            ttlPolicy
          }
        }
      }
      vaults {
        approverDid
        approverPk
        approverSig
        at
        did
        pk
        sig
      }
    }
  }
}
```

### syncMasterAuthorization

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
mutation {
  syncMasterAuthorization {
    code
    blocklet {
      appDid
      appPid
      bundleSource
      createdAt
      deployedFrom
      dynamic
      enableDocker
      enableDockerNetwork
      enablePassportIssuance
      externalSk
      externalSkSource
      installedAt
      mode
      mountPoint
      pausedAt
      port
      ports
      source
      startedAt
      status
      stoppedAt
      structVersion
      updatedAt
      appRuntimeInfo {
        cpus
        cpuUsage
        memoryUsage
        pid
        port
        runningDocker
        uptime
      }
      children {
        bundleSource
        createdAt
        deployedFrom
        dynamic
        greenStatus
        installedAt
        mode
        mountPoint
        pausedAt
        port
        ports
        required
        source
        startedAt
        status
        stoppedAt
        appRuntimeInfo {
          cpus
          cpuUsage
          memoryUsage
          pid
          port
          runningDocker
          uptime
        }
        children {
          bundleSource
          createdAt
          deployedFrom
          dynamic
          greenStatus
          installedAt
          mode
          mountPoint
          pausedAt
          port
          ports
          required
          source
          startedAt
          status
          stoppedAt
          appRuntimeInfo {
            cpus
            cpuUsage
            memoryUsage
            pid
            port
            runningDocker
            uptime
          }
          children {
            bundleSource
            createdAt
            deployedFrom
            dynamic
            greenStatus
            installedAt
            mode
            mountPoint
            pausedAt
            port
            ports
            required
            source
            startedAt
            status
            stoppedAt
            appRuntimeInfo {
              cpus
              cpuUsage
              memoryUsage
              pid
              port
              runningDocker
              uptime
            }
            children {
              bundleSource
              createdAt
              deployedFrom
              dynamic
              greenStatus
              installedAt
              mode
              mountPoint
              pausedAt
              port
              ports
              required
              source
              startedAt
              status
              stoppedAt
              appRuntimeInfo {
                cpus
                cpuUsage
                memoryUsage
                pid
                port
                runningDocker
                uptime
              }
              children {
                bundleSource
                createdAt
                deployedFrom
                dynamic
                greenStatus
                installedAt
                mode
                mountPoint
                pausedAt
                port
                ports
                required
                source
                startedAt
                status
                stoppedAt
              }
              configs {
                custom
                description
                key
                required
                secure
                shared
                validation
                value
              }
              dependents {
                id
                required
              }
              diskInfo {
                app
                blocklets
                cache
                data
                log
              }
              engine {
                available
                description
                displayName
                logo
                name
                version
                visible
              }
              environments {
                custom
                description
                key
                required
                secure
                shared
                validation
                value
              }
              meta {
                bundleDid
                bundleName
                community
                description
                did
                documentation
                engine
                group
                homepage
                keywords
                lastPublishedAt
                logo
                main
                name
                navigation
                nftFactory
                path
                resources
                screenshots
                support
                title
                version
              }
              runtimeInfo {
                cpus
                cpuUsage
                memoryUsage
                pid
                port
                runningDocker
                uptime
              }
            }
            configs {
              custom
              description
              key
              required
              secure
              shared
              validation
              value
            }
            dependents {
              id
              required
            }
            diskInfo {
              app
              blocklets
              cache
              data
              log
            }
            engine {
              available
              description
              displayName
              logo
              name
              version
              visible
            }
            environments {
              custom
              description
              key
              required
              secure
              shared
              validation
              value
            }
            meta {
              bundleDid
              bundleName
              community
              description
              did
              documentation
              engine
              group
              homepage
              keywords
              lastPublishedAt
              logo
              main
              name
              navigation
              nftFactory
              path
              resources
              screenshots
              support
              title
              version
              author {
                email
                name
                url
              }
              capabilities {
                clusterMode
                component
                didSpace
                navigation
                resourceExportApi
              }
              components {
                mountPoint
                name
                required
              }
              contributors {
                email
                name
                url
              }
              dist {
                integrity
                tarball
              }
              docker {
                image
                installNodeModules
                runBaseScript
                shell
              }
              environments {
                default
                description
                name
                required
                secure
                shared
                validation
              }
              events {
                description
                type
              }
              interfaces {
                cacheable
                name
                pageGroups
                path
                port
                prefix
                protocol
                type
              }
              maintainers {
                email
                name
                url
              }
              owner {
                avatar
                did
                email
                fullName
              }
              repository {
                type
                url
              }
              requirements {
                aigne
                cpu
                os
                server
              }
              resource {
                exportApi
              }
              stats {
                downloads
                purchases
                star
              }
            }
            runtimeInfo {
              cpus
              cpuUsage
              memoryUsage
              pid
              port
              runningDocker
              uptime
            }
          }
          configs {
            custom
            description
            key
            required
            secure
            shared
            validation
            value
          }
          dependents {
            id
            required
          }
          diskInfo {
            app
            blocklets
            cache
            data
            log
          }
          engine {
            available
            description
            displayName
            logo
            name
            version
            visible
          }
          environments {
            custom
            description
            key
            required
            secure
            shared
            validation
            value
          }
          meta {
            bundleDid
            bundleName
            community
            description
            did
            documentation
            engine
            group
            homepage
            keywords
            lastPublishedAt
            logo
            main
            name
            navigation
            nftFactory
            path
            resources
            screenshots
            support
            title
            version
            author {
              email
              name
              url
            }
            capabilities {
              clusterMode
              component
              didSpace
              navigation
              resourceExportApi
            }
            components {
              mountPoint
              name
              required
            }
            contributors {
              email
              name
              url
            }
            dist {
              integrity
              tarball
            }
            docker {
              image
              installNodeModules
              runBaseScript
              shell
            }
            environments {
              default
              description
              name
              required
              secure
              shared
              validation
            }
            events {
              description
              type
            }
            interfaces {
              cacheable
              name
              pageGroups
              path
              port
              prefix
              protocol
              type
              services {
                config
                name
              }
            }
            maintainers {
              email
              name
              url
            }
            owner {
              avatar
              did
              email
              fullName
            }
            payment {
              price {
                address
                symbol
                value
              }
              share {
                address
                name
                value
              }
            }
            repository {
              type
              url
            }
            requirements {
              aigne
              cpu
              os
              server
              fuels {
                address
                endpoint
                reason
                value
              }
            }
            resource {
              exportApi
              bundles {
                did
                public
                type
              }
              types {
                description
                type
              }
            }
            stats {
              downloads
              purchases
              star
            }
          }
          runtimeInfo {
            cpus
            cpuUsage
            memoryUsage
            pid
            port
            runningDocker
            uptime
          }
        }
        configs {
          custom
          description
          key
          required
          secure
          shared
          validation
          value
        }
        dependents {
          id
          required
        }
        diskInfo {
          app
          blocklets
          cache
          data
          log
        }
        engine {
          available
          description
          displayName
          logo
          name
          version
          visible
        }
        environments {
          custom
          description
          key
          required
          secure
          shared
          validation
          value
        }
        meta {
          bundleDid
          bundleName
          community
          description
          did
          documentation
          engine
          group
          homepage
          keywords
          lastPublishedAt
          logo
          main
          name
          navigation
          nftFactory
          path
          resources
          screenshots
          support
          title
          version
          author {
            email
            name
            url
          }
          capabilities {
            clusterMode
            component
            didSpace
            navigation
            resourceExportApi
          }
          components {
            mountPoint
            name
            required
          }
          contributors {
            email
            name
            url
          }
          dist {
            integrity
            tarball
          }
          docker {
            image
            installNodeModules
            runBaseScript
            shell
          }
          environments {
            default
            description
            name
            required
            secure
            shared
            validation
          }
          events {
            description
            type
          }
          interfaces {
            cacheable
            name
            pageGroups
            path
            port
            prefix
            protocol
            type
            services {
              config
              name
            }
          }
          maintainers {
            email
            name
            url
          }
          owner {
            avatar
            did
            email
            fullName
          }
          payment {
            price {
              address
              symbol
              value
            }
            share {
              address
              name
              value
            }
          }
          repository {
            type
            url
          }
          requirements {
            aigne
            cpu
            os
            server
            fuels {
              address
              endpoint
              reason
              value
            }
          }
          resource {
            exportApi
            bundles {
              did
              public
              type
            }
            types {
              description
              type
            }
          }
          stats {
            downloads
            purchases
            star
          }
        }
        runtimeInfo {
          cpus
          cpuUsage
          memoryUsage
          pid
          port
          runningDocker
          uptime
        }
      }
      configs {
        custom
        description
        key
        required
        secure
        shared
        validation
        value
      }
      controller {
        chainHost
        consumedAt
        expireDate
        id
        launcherSessionId
        launcherUrl
        nftId
        nftOwner
        ownerDid
        status {
          reason
          value
        }
      }
      diskInfo {
        app
        blocklets
        cache
        data
        log
      }
      engine {
        available
        description
        displayName
        logo
        name
        version
        visible
      }
      environments {
        custom
        description
        key
        required
        secure
        shared
        validation
        value
      }
      meta {
        bundleDid
        bundleName
        community
        description
        did
        documentation
        engine
        group
        homepage
        keywords
        lastPublishedAt
        logo
        main
        name
        navigation
        nftFactory
        path
        resources
        screenshots
        support
        title
        version
        author {
          email
          name
          url
        }
        capabilities {
          clusterMode
          component
          didSpace
          navigation
          resourceExportApi
        }
        components {
          mountPoint
          name
          required
        }
        contributors {
          email
          name
          url
        }
        dist {
          integrity
          tarball
        }
        docker {
          image
          installNodeModules
          runBaseScript
          shell
        }
        environments {
          default
          description
          name
          required
          secure
          shared
          validation
        }
        events {
          description
          type
        }
        interfaces {
          cacheable
          name
          pageGroups
          path
          port
          prefix
          protocol
          type
          services {
            config
            name
          }
        }
        maintainers {
          email
          name
          url
        }
        owner {
          avatar
          did
          email
          fullName
        }
        payment {
          price {
            address
            symbol
            value
          }
          share {
            address
            name
            value
          }
        }
        repository {
          type
          url
        }
        requirements {
          aigne
          cpu
          os
          server
          fuels {
            address
            endpoint
            reason
            value
          }
        }
        resource {
          exportApi
          bundles {
            did
            public
            type
          }
          types {
            description
            type
          }
        }
        stats {
          downloads
          purchases
          star
        }
      }
      migratedFrom {
        appDid
        appSk
        at
      }
      optionalComponents {
        bundleSource
        logoUrl
        dependencies {
          mountPoint
          parentDid
          parentName
          parentTitle
          required
        }
        meta {
          bundleDid
          bundleName
          community
          description
          did
          documentation
          engine
          group
          homepage
          keywords
          lastPublishedAt
          logo
          main
          name
          navigation
          nftFactory
          path
          resources
          screenshots
          support
          title
          version
          author {
            email
            name
            url
          }
          capabilities {
            clusterMode
            component
            didSpace
            navigation
            resourceExportApi
          }
          components {
            mountPoint
            name
            required
          }
          contributors {
            email
            name
            url
          }
          dist {
            integrity
            tarball
          }
          docker {
            image
            installNodeModules
            runBaseScript
            shell
          }
          environments {
            default
            description
            name
            required
            secure
            shared
            validation
          }
          events {
            description
            type
          }
          interfaces {
            cacheable
            name
            pageGroups
            path
            port
            prefix
            protocol
            type
            services {
              config
              name
            }
          }
          maintainers {
            email
            name
            url
          }
          owner {
            avatar
            did
            email
            fullName
          }
          payment {
            price {
              address
              symbol
              value
            }
            share {
              address
              name
              value
            }
          }
          repository {
            type
            url
          }
          requirements {
            aigne
            cpu
            os
            server
            fuels {
              address
              endpoint
              reason
              value
            }
          }
          resource {
            exportApi
            bundles {
              did
              public
              type
            }
            types {
              description
              type
            }
          }
          stats {
            downloads
            purchases
            star
          }
        }
      }
      runtimeInfo {
        cpus
        cpuUsage
        memoryUsage
        pid
        port
        runningDocker
        uptime
      }
      settings {
        actionConfig
        authentication
        didConnect
        enablePassportIssuance
        enableSessionHardening
        initialized
        notification
        oauth
        publicToStore
        theme
        whoCanAccess
        aigne {
          accessKeyId
          key
          model
          provider
          secretAccessKey
          url
          validationResult
        }
        autoBackup {
          enabled
        }
        autoCheckUpdate {
          enabled
        }
        children {
          deletedAt
          deployedFrom
          mountPoint
          status
          meta {
            bundleDid
            bundleName
            description
            did
            name
            title
            version
          }
        }
        endpointList {
          appDescription
          appName
          endpoint
          id
          protected
          scope
          url
        }
        federated {
          config {
            appId
            appPid
            autoLogin
            delegation
            isMaster
          }
          sites {
            aliasDid
            aliasDomain
            appDescription
            appId
            appliedAt
            appLogo
            appLogoRect
            appName
            appPid
            appUrl
            did
            isMaster
            pk
            serverId
            serverVersion
            status
            version
          }
        }
        gateway {
          cacheEnabled
          blockPolicy {
            blacklist
            enabled
            autoBlocking {
              blockDuration
              enabled
              statusCodes
              windowQuota
              windowSize
            }
          }
          proxyPolicy {
            enabled
            realIpHeader
            trustedProxies
            trustRecursive
          }
          requestLimit {
            burstDelay
            burstFactor
            enabled
            global
            methods
            rate
          }
          wafPolicy {
            enabled
            inboundAnomalyScoreThreshold
            logLevel
            mode
            outboundAnomalyScoreThreshold
          }
        }
        invite {
          enabled
        }
        navigations {
          activeColor
          activeIcon
          color
          component
          description
          from
          icon
          id
          link
          parent
          private
          role
          section
          title
          visible
        }
        org {
          enabled
          maxMemberPerOrg
          maxOrgPerUser
        }
        owner {
          did
          pk
        }
        session {
          cacheTtl
          enableBlacklist
          salt
          ttl
          email {
            domainBlackList
            domainWhiteList
            enabled
            enableDomainBlackList
            enableDomainWhiteList
            requireUnique
            requireVerified
            trustOauthProviders
            trustedIssuers {
              id
              name
              pk
            }
          }
          phone {
            enabled
            enableRegionBlackList
            enableRegionWhiteList
            regionBlackList
            regionWhiteList
            requireUnique
            requireVerified
            trustedIssuers {
              id
              name
              pk
            }
          }
        }
        storeList {
          cdnUrl
          description
          id
          logoUrl
          maintainer
          name
          protected
          scope
          url
        }
        subService {
          domain
          enabled
          staticRoot
        }
        trustedFactories {
          factoryAddress
          holderDid
          issuerDid
          remark
          passport {
            role
            ttl
            ttlPolicy
          }
        }
        trustedPassports {
          issuerDid
          remark
          mappings {
            from {
              passport
            }
            to {
              role
              ttl
              ttlPolicy
            }
          }
        }
      }
      site {
        corsAllowedOrigins
        domain
        domainAliases
        id
        isProtected
        rules {
          id
          isProtected
          from {
            pathPrefix
            header {
              key
              type
              value
            }
          }
          to {
            componentId
            did
            interfaceName
            pageGroup
            port
            redirectCode
            type
            url
            response {
              body
              contentType
              status
            }
          }
        }
      }
      trustedFactories {
        factoryAddress
        holderDid
        issuerDid
        remark
        passport {
          role
          ttl
          ttlPolicy
        }
      }
      trustedPassports {
        issuerDid
        remark
        mappings {
          from {
            passport
          }
          to {
            role
            ttl
            ttlPolicy
          }
        }
      }
      vaults {
        approverDid
        approverPk
        approverSig
        at
        did
        pk
        sig
      }
    }
  }
}
```

### syncFederatedConfig

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
mutation {
  syncFederatedConfig {
    code
    blocklet {
      appDid
      appPid
      bundleSource
      createdAt
      deployedFrom
      dynamic
      enableDocker
      enableDockerNetwork
      enablePassportIssuance
      externalSk
      externalSkSource
      installedAt
      mode
      mountPoint
      pausedAt
      port
      ports
      source
      startedAt
      status
      stoppedAt
      structVersion
      updatedAt
      appRuntimeInfo {
        cpus
        cpuUsage
        memoryUsage
        pid
        port
        runningDocker
        uptime
      }
      children {
        bundleSource
        createdAt
        deployedFrom
        dynamic
        greenStatus
        installedAt
        mode
        mountPoint
        pausedAt
        port
        ports
        required
        source
        startedAt
        status
        stoppedAt
        appRuntimeInfo {
          cpus
          cpuUsage
          memoryUsage
          pid
          port
          runningDocker
          uptime
        }
        children {
          bundleSource
          createdAt
          deployedFrom
          dynamic
          greenStatus
          installedAt
          mode
          mountPoint
          pausedAt
          port
          ports
          required
          source
          startedAt
          status
          stoppedAt
          appRuntimeInfo {
            cpus
            cpuUsage
            memoryUsage
            pid
            port
            runningDocker
            uptime
          }
          children {
            bundleSource
            createdAt
            deployedFrom
            dynamic
            greenStatus
            installedAt
            mode
            mountPoint
            pausedAt
            port
            ports
            required
            source
            startedAt
            status
            stoppedAt
            appRuntimeInfo {
              cpus
              cpuUsage
              memoryUsage
              pid
              port
              runningDocker
              uptime
            }
            children {
              bundleSource
              createdAt
              deployedFrom
              dynamic
              greenStatus
              installedAt
              mode
              mountPoint
              pausedAt
              port
              ports
              required
              source
              startedAt
              status
              stoppedAt
              appRuntimeInfo {
                cpus
                cpuUsage
                memoryUsage
                pid
                port
                runningDocker
                uptime
              }
              children {
                bundleSource
                createdAt
                deployedFrom
                dynamic
                greenStatus
                installedAt
                mode
                mountPoint
                pausedAt
                port
                ports
                required
                source
                startedAt
                status
                stoppedAt
              }
              configs {
                custom
                description
                key
                required
                secure
                shared
                validation
                value
              }
              dependents {
                id
                required
              }
              diskInfo {
                app
                blocklets
                cache
                data
                log
              }
              engine {
                available
                description
                displayName
                logo
                name
                version
                visible
              }
              environments {
                custom
                description
                key
                required
                secure
                shared
                validation
                value
              }
              meta {
                bundleDid
                bundleName
                community
                description
                did
                documentation
                engine
                group
                homepage
                keywords
                lastPublishedAt
                logo
                main
                name
                navigation
                nftFactory
                path
                resources
                screenshots
                support
                title
                version
              }
              runtimeInfo {
                cpus
                cpuUsage
                memoryUsage
                pid
                port
                runningDocker
                uptime
              }
            }
            configs {
              custom
              description
              key
              required
              secure
              shared
              validation
              value
            }
            dependents {
              id
              required
            }
            diskInfo {
              app
              blocklets
              cache
              data
              log
            }
            engine {
              available
              description
              displayName
              logo
              name
              version
              visible
            }
            environments {
              custom
              description
              key
              required
              secure
              shared
              validation
              value
            }
            meta {
              bundleDid
              bundleName
              community
              description
              did
              documentation
              engine
              group
              homepage
              keywords
              lastPublishedAt
              logo
              main
              name
              navigation
              nftFactory
              path
              resources
              screenshots
              support
              title
              version
              author {
                email
                name
                url
              }
              capabilities {
                clusterMode
                component
                didSpace
                navigation
                resourceExportApi
              }
              components {
                mountPoint
                name
                required
              }
              contributors {
                email
                name
                url
              }
              dist {
                integrity
                tarball
              }
              docker {
                image
                installNodeModules
                runBaseScript
                shell
              }
              environments {
                default
                description
                name
                required
                secure
                shared
                validation
              }
              events {
                description
                type
              }
              interfaces {
                cacheable
                name
                pageGroups
                path
                port
                prefix
                protocol
                type
              }
              maintainers {
                email
                name
                url
              }
              owner {
                avatar
                did
                email
                fullName
              }
              repository {
                type
                url
              }
              requirements {
                aigne
                cpu
                os
                server
              }
              resource {
                exportApi
              }
              stats {
                downloads
                purchases
                star
              }
            }
            runtimeInfo {
              cpus
              cpuUsage
              memoryUsage
              pid
              port
              runningDocker
              uptime
            }
          }
          configs {
            custom
            description
            key
            required
            secure
            shared
            validation
            value
          }
          dependents {
            id
            required
          }
          diskInfo {
            app
            blocklets
            cache
            data
            log
          }
          engine {
            available
            description
            displayName
            logo
            name
            version
            visible
          }
          environments {
            custom
            description
            key
            required
            secure
            shared
            validation
            value
          }
          meta {
            bundleDid
            bundleName
            community
            description
            did
            documentation
            engine
            group
            homepage
            keywords
            lastPublishedAt
            logo
            main
            name
            navigation
            nftFactory
            path
            resources
            screenshots
            support
            title
            version
            author {
              email
              name
              url
            }
            capabilities {
              clusterMode
              component
              didSpace
              navigation
              resourceExportApi
            }
            components {
              mountPoint
              name
              required
            }
            contributors {
              email
              name
              url
            }
            dist {
              integrity
              tarball
            }
            docker {
              image
              installNodeModules
              runBaseScript
              shell
            }
            environments {
              default
              description
              name
              required
              secure
              shared
              validation
            }
            events {
              description
              type
            }
            interfaces {
              cacheable
              name
              pageGroups
              path
              port
              prefix
              protocol
              type
              services {
                config
                name
              }
            }
            maintainers {
              email
              name
              url
            }
            owner {
              avatar
              did
              email
              fullName
            }
            payment {
              price {
                address
                symbol
                value
              }
              share {
                address
                name
                value
              }
            }
            repository {
              type
              url
            }
            requirements {
              aigne
              cpu
              os
              server
              fuels {
                address
                endpoint
                reason
                value
              }
            }
            resource {
              exportApi
              bundles {
                did
                public
                type
              }
              types {
                description
                type
              }
            }
            stats {
              downloads
              purchases
              star
            }
          }
          runtimeInfo {
            cpus
            cpuUsage
            memoryUsage
            pid
            port
            runningDocker
            uptime
          }
        }
        configs {
          custom
          description
          key
          required
          secure
          shared
          validation
          value
        }
        dependents {
          id
          required
        }
        diskInfo {
          app
          blocklets
          cache
          data
          log
        }
        engine {
          available
          description
          displayName
          logo
          name
          version
          visible
        }
        environments {
          custom
          description
          key
          required
          secure
          shared
          validation
          value
        }
        meta {
          bundleDid
          bundleName
          community
          description
          did
          documentation
          engine
          group
          homepage
          keywords
          lastPublishedAt
          logo
          main
          name
          navigation
          nftFactory
          path
          resources
          screenshots
          support
          title
          version
          author {
            email
            name
            url
          }
          capabilities {
            clusterMode
            component
            didSpace
            navigation
            resourceExportApi
          }
          components {
            mountPoint
            name
            required
          }
          contributors {
            email
            name
            url
          }
          dist {
            integrity
            tarball
          }
          docker {
            image
            installNodeModules
            runBaseScript
            shell
          }
          environments {
            default
            description
            name
            required
            secure
            shared
            validation
          }
          events {
            description
            type
          }
          interfaces {
            cacheable
            name
            pageGroups
            path
            port
            prefix
            protocol
            type
            services {
              config
              name
            }
          }
          maintainers {
            email
            name
            url
          }
          owner {
            avatar
            did
            email
            fullName
          }
          payment {
            price {
              address
              symbol
              value
            }
            share {
              address
              name
              value
            }
          }
          repository {
            type
            url
          }
          requirements {
            aigne
            cpu
            os
            server
            fuels {
              address
              endpoint
              reason
              value
            }
          }
          resource {
            exportApi
            bundles {
              did
              public
              type
            }
            types {
              description
              type
            }
          }
          stats {
            downloads
            purchases
            star
          }
        }
        runtimeInfo {
          cpus
          cpuUsage
          memoryUsage
          pid
          port
          runningDocker
          uptime
        }
      }
      configs {
        custom
        description
        key
        required
        secure
        shared
        validation
        value
      }
      controller {
        chainHost
        consumedAt
        expireDate
        id
        launcherSessionId
        launcherUrl
        nftId
        nftOwner
        ownerDid
        status {
          reason
          value
        }
      }
      diskInfo {
        app
        blocklets
        cache
        data
        log
      }
      engine {
        available
        description
        displayName
        logo
        name
        version
        visible
      }
      environments {
        custom
        description
        key
        required
        secure
        shared
        validation
        value
      }
      meta {
        bundleDid
        bundleName
        community
        description
        did
        documentation
        engine
        group
        homepage
        keywords
        lastPublishedAt
        logo
        main
        name
        navigation
        nftFactory
        path
        resources
        screenshots
        support
        title
        version
        author {
          email
          name
          url
        }
        capabilities {
          clusterMode
          component
          didSpace
          navigation
          resourceExportApi
        }
        components {
          mountPoint
          name
          required
        }
        contributors {
          email
          name
          url
        }
        dist {
          integrity
          tarball
        }
        docker {
          image
          installNodeModules
          runBaseScript
          shell
        }
        environments {
          default
          description
          name
          required
          secure
          shared
          validation
        }
        events {
          description
          type
        }
        interfaces {
          cacheable
          name
          pageGroups
          path
          port
          prefix
          protocol
          type
          services {
            config
            name
          }
        }
        maintainers {
          email
          name
          url
        }
        owner {
          avatar
          did
          email
          fullName
        }
        payment {
          price {
            address
            symbol
            value
          }
          share {
            address
            name
            value
          }
        }
        repository {
          type
          url
        }
        requirements {
          aigne
          cpu
          os
          server
          fuels {
            address
            endpoint
            reason
            value
          }
        }
        resource {
          exportApi
          bundles {
            did
            public
            type
          }
          types {
            description
            type
          }
        }
        stats {
          downloads
          purchases
          star
        }
      }
      migratedFrom {
        appDid
        appSk
        at
      }
      optionalComponents {
        bundleSource
        logoUrl
        dependencies {
          mountPoint
          parentDid
          parentName
          parentTitle
          required
        }
        meta {
          bundleDid
          bundleName
          community
          description
          did
          documentation
          engine
          group
          homepage
          keywords
          lastPublishedAt
          logo
          main
          name
          navigation
          nftFactory
          path
          resources
          screenshots
          support
          title
          version
          author {
            email
            name
            url
          }
          capabilities {
            clusterMode
            component
            didSpace
            navigation
            resourceExportApi
          }
          components {
            mountPoint
            name
            required
          }
          contributors {
            email
            name
            url
          }
          dist {
            integrity
            tarball
          }
          docker {
            image
            installNodeModules
            runBaseScript
            shell
          }
          environments {
            default
            description
            name
            required
            secure
            shared
            validation
          }
          events {
            description
            type
          }
          interfaces {
            cacheable
            name
            pageGroups
            path
            port
            prefix
            protocol
            type
            services {
              config
              name
            }
          }
          maintainers {
            email
            name
            url
          }
          owner {
            avatar
            did
            email
            fullName
          }
          payment {
            price {
              address
              symbol
              value
            }
            share {
              address
              name
              value
            }
          }
          repository {
            type
            url
          }
          requirements {
            aigne
            cpu
            os
            server
            fuels {
              address
              endpoint
              reason
              value
            }
          }
          resource {
            exportApi
            bundles {
              did
              public
              type
            }
            types {
              description
              type
            }
          }
          stats {
            downloads
            purchases
            star
          }
        }
      }
      runtimeInfo {
        cpus
        cpuUsage
        memoryUsage
        pid
        port
        runningDocker
        uptime
      }
      settings {
        actionConfig
        authentication
        didConnect
        enablePassportIssuance
        enableSessionHardening
        initialized
        notification
        oauth
        publicToStore
        theme
        whoCanAccess
        aigne {
          accessKeyId
          key
          model
          provider
          secretAccessKey
          url
          validationResult
        }
        autoBackup {
          enabled
        }
        autoCheckUpdate {
          enabled
        }
        children {
          deletedAt
          deployedFrom
          mountPoint
          status
          meta {
            bundleDid
            bundleName
            description
            did
            name
            title
            version
          }
        }
        endpointList {
          appDescription
          appName
          endpoint
          id
          protected
          scope
          url
        }
        federated {
          config {
            appId
            appPid
            autoLogin
            delegation
            isMaster
          }
          sites {
            aliasDid
            aliasDomain
            appDescription
            appId
            appliedAt
            appLogo
            appLogoRect
            appName
            appPid
            appUrl
            did
            isMaster
            pk
            serverId
            serverVersion
            status
            version
          }
        }
        gateway {
          cacheEnabled
          blockPolicy {
            blacklist
            enabled
            autoBlocking {
              blockDuration
              enabled
              statusCodes
              windowQuota
              windowSize
            }
          }
          proxyPolicy {
            enabled
            realIpHeader
            trustedProxies
            trustRecursive
          }
          requestLimit {
            burstDelay
            burstFactor
            enabled
            global
            methods
            rate
          }
          wafPolicy {
            enabled
            inboundAnomalyScoreThreshold
            logLevel
            mode
            outboundAnomalyScoreThreshold
          }
        }
        invite {
          enabled
        }
        navigations {
          activeColor
          activeIcon
          color
          component
          description
          from
          icon
          id
          link
          parent
          private
          role
          section
          title
          visible
        }
        org {
          enabled
          maxMemberPerOrg
          maxOrgPerUser
        }
        owner {
          did
          pk
        }
        session {
          cacheTtl
          enableBlacklist
          salt
          ttl
          email {
            domainBlackList
            domainWhiteList
            enabled
            enableDomainBlackList
            enableDomainWhiteList
            requireUnique
            requireVerified
            trustOauthProviders
            trustedIssuers {
              id
              name
              pk
            }
          }
          phone {
            enabled
            enableRegionBlackList
            enableRegionWhiteList
            regionBlackList
            regionWhiteList
            requireUnique
            requireVerified
            trustedIssuers {
              id
              name
              pk
            }
          }
        }
        storeList {
          cdnUrl
          description
          id
          logoUrl
          maintainer
          name
          protected
          scope
          url
        }
        subService {
          domain
          enabled
          staticRoot
        }
        trustedFactories {
          factoryAddress
          holderDid
          issuerDid
          remark
          passport {
            role
            ttl
            ttlPolicy
          }
        }
        trustedPassports {
          issuerDid
          remark
          mappings {
            from {
              passport
            }
            to {
              role
              ttl
              ttlPolicy
            }
          }
        }
      }
      site {
        corsAllowedOrigins
        domain
        domainAliases
        id
        isProtected
        rules {
          id
          isProtected
          from {
            pathPrefix
            header {
              key
              type
              value
            }
          }
          to {
            componentId
            did
            interfaceName
            pageGroup
            port
            redirectCode
            type
            url
            response {
              body
              contentType
              status
            }
          }
        }
      }
      trustedFactories {
        factoryAddress
        holderDid
        issuerDid
        remark
        passport {
          role
          ttl
          ttlPolicy
        }
      }
      trustedPassports {
        issuerDid
        remark
        mappings {
          from {
            passport
          }
          to {
            role
            ttl
            ttlPolicy
          }
        }
      }
      vaults {
        approverDid
        approverPk
        approverSig
        at
        did
        pk
        sig
      }
    }
  }
}
```

### auditFederatedLogin

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
mutation {
  auditFederatedLogin {
    code
    blocklet {
      appDid
      appPid
      bundleSource
      createdAt
      deployedFrom
      dynamic
      enableDocker
      enableDockerNetwork
      enablePassportIssuance
      externalSk
      externalSkSource
      installedAt
      mode
      mountPoint
      pausedAt
      port
      ports
      source
      startedAt
      status
      stoppedAt
      structVersion
      updatedAt
      appRuntimeInfo {
        cpus
        cpuUsage
        memoryUsage
        pid
        port
        runningDocker
        uptime
      }
      children {
        bundleSource
        createdAt
        deployedFrom
        dynamic
        greenStatus
        installedAt
        mode
        mountPoint
        pausedAt
        port
        ports
        required
        source
        startedAt
        status
        stoppedAt
        appRuntimeInfo {
          cpus
          cpuUsage
          memoryUsage
          pid
          port
          runningDocker
          uptime
        }
        children {
          bundleSource
          createdAt
          deployedFrom
          dynamic
          greenStatus
          installedAt
          mode
          mountPoint
          pausedAt
          port
          ports
          required
          source
          startedAt
          status
          stoppedAt
          appRuntimeInfo {
            cpus
            cpuUsage
            memoryUsage
            pid
            port
            runningDocker
            uptime
          }
          children {
            bundleSource
            createdAt
            deployedFrom
            dynamic
            greenStatus
            installedAt
            mode
            mountPoint
            pausedAt
            port
            ports
            required
            source
            startedAt
            status
            stoppedAt
            appRuntimeInfo {
              cpus
              cpuUsage
              memoryUsage
              pid
              port
              runningDocker
              uptime
            }
            children {
              bundleSource
              createdAt
              deployedFrom
              dynamic
              greenStatus
              installedAt
              mode
              mountPoint
              pausedAt
              port
              ports
              required
              source
              startedAt
              status
              stoppedAt
              appRuntimeInfo {
                cpus
                cpuUsage
                memoryUsage
                pid
                port
                runningDocker
                uptime
              }
              children {
                bundleSource
                createdAt
                deployedFrom
                dynamic
                greenStatus
                installedAt
                mode
                mountPoint
                pausedAt
                port
                ports
                required
                source
                startedAt
                status
                stoppedAt
              }
              configs {
                custom
                description
                key
                required
                secure
                shared
                validation
                value
              }
              dependents {
                id
                required
              }
              diskInfo {
                app
                blocklets
                cache
                data
                log
              }
              engine {
                available
                description
                displayName
                logo
                name
                version
                visible
              }
              environments {
                custom
                description
                key
                required
                secure
                shared
                validation
                value
              }
              meta {
                bundleDid
                bundleName
                community
                description
                did
                documentation
                engine
                group
                homepage
                keywords
                lastPublishedAt
                logo
                main
                name
                navigation
                nftFactory
                path
                resources
                screenshots
                support
                title
                version
              }
              runtimeInfo {
                cpus
                cpuUsage
                memoryUsage
                pid
                port
                runningDocker
                uptime
              }
            }
            configs {
              custom
              description
              key
              required
              secure
              shared
              validation
              value
            }
            dependents {
              id
              required
            }
            diskInfo {
              app
              blocklets
              cache
              data
              log
            }
            engine {
              available
              description
              displayName
              logo
              name
              version
              visible
            }
            environments {
              custom
              description
              key
              required
              secure
              shared
              validation
              value
            }
            meta {
              bundleDid
              bundleName
              community
              description
              did
              documentation
              engine
              group
              homepage
              keywords
              lastPublishedAt
              logo
              main
              name
              navigation
              nftFactory
              path
              resources
              screenshots
              support
              title
              version
              author {
                email
                name
                url
              }
              capabilities {
                clusterMode
                component
                didSpace
                navigation
                resourceExportApi
              }
              components {
                mountPoint
                name
                required
              }
              contributors {
                email
                name
                url
              }
              dist {
                integrity
                tarball
              }
              docker {
                image
                installNodeModules
                runBaseScript
                shell
              }
              environments {
                default
                description
                name
                required
                secure
                shared
                validation
              }
              events {
                description
                type
              }
              interfaces {
                cacheable
                name
                pageGroups
                path
                port
                prefix
                protocol
                type
              }
              maintainers {
                email
                name
                url
              }
              owner {
                avatar
                did
                email
                fullName
              }
              repository {
                type
                url
              }
              requirements {
                aigne
                cpu
                os
                server
              }
              resource {
                exportApi
              }
              stats {
                downloads
                purchases
                star
              }
            }
            runtimeInfo {
              cpus
              cpuUsage
              memoryUsage
              pid
              port
              runningDocker
              uptime
            }
          }
          configs {
            custom
            description
            key
            required
            secure
            shared
            validation
            value
          }
          dependents {
            id
            required
          }
          diskInfo {
            app
            blocklets
            cache
            data
            log
          }
          engine {
            available
            description
            displayName
            logo
            name
            version
            visible
          }
          environments {
            custom
            description
            key
            required
            secure
            shared
            validation
            value
          }
          meta {
            bundleDid
            bundleName
            community
            description
            did
            documentation
            engine
            group
            homepage
            keywords
            lastPublishedAt
            logo
            main
            name
            navigation
            nftFactory
            path
            resources
            screenshots
            support
            title
            version
            author {
              email
              name
              url
            }
            capabilities {
              clusterMode
              component
              didSpace
              navigation
              resourceExportApi
            }
            components {
              mountPoint
              name
              required
            }
            contributors {
              email
              name
              url
            }
            dist {
              integrity
              tarball
            }
            docker {
              image
              installNodeModules
              runBaseScript
              shell
            }
            environments {
              default
              description
              name
              required
              secure
              shared
              validation
            }
            events {
              description
              type
            }
            interfaces {
              cacheable
              name
              pageGroups
              path
              port
              prefix
              protocol
              type
              services {
                config
                name
              }
            }
            maintainers {
              email
              name
              url
            }
            owner {
              avatar
              did
              email
              fullName
            }
            payment {
              price {
                address
                symbol
                value
              }
              share {
                address
                name
                value
              }
            }
            repository {
              type
              url
            }
            requirements {
              aigne
              cpu
              os
              server
              fuels {
                address
                endpoint
                reason
                value
              }
            }
            resource {
              exportApi
              bundles {
                did
                public
                type
              }
              types {
                description
                type
              }
            }
            stats {
              downloads
              purchases
              star
            }
          }
          runtimeInfo {
            cpus
            cpuUsage
            memoryUsage
            pid
            port
            runningDocker
            uptime
          }
        }
        configs {
          custom
          description
          key
          required
          secure
          shared
          validation
          value
        }
        dependents {
          id
          required
        }
        diskInfo {
          app
          blocklets
          cache
          data
          log
        }
        engine {
          available
          description
          displayName
          logo
          name
          version
          visible
        }
        environments {
          custom
          description
          key
          required
          secure
          shared
          validation
          value
        }
        meta {
          bundleDid
          bundleName
          community
          description
          did
          documentation
          engine
          group
          homepage
          keywords
          lastPublishedAt
          logo
          main
          name
          navigation
          nftFactory
          path
          resources
          screenshots
          support
          title
          version
          author {
            email
            name
            url
          }
          capabilities {
            clusterMode
            component
            didSpace
            navigation
            resourceExportApi
          }
          components {
            mountPoint
            name
            required
          }
          contributors {
            email
            name
            url
          }
          dist {
            integrity
            tarball
          }
          docker {
            image
            installNodeModules
            runBaseScript
            shell
          }
          environments {
            default
            description
            name
            required
            secure
            shared
            validation
          }
          events {
            description
            type
          }
          interfaces {
            cacheable
            name
            pageGroups
            path
            port
            prefix
            protocol
            type
            services {
              config
              name
            }
          }
          maintainers {
            email
            name
            url
          }
          owner {
            avatar
            did
            email
            fullName
          }
          payment {
            price {
              address
              symbol
              value
            }
            share {
              address
              name
              value
            }
          }
          repository {
            type
            url
          }
          requirements {
            aigne
            cpu
            os
            server
            fuels {
              address
              endpoint
              reason
              value
            }
          }
          resource {
            exportApi
            bundles {
              did
              public
              type
            }
            types {
              description
              type
            }
          }
          stats {
            downloads
            purchases
            star
          }
        }
        runtimeInfo {
          cpus
          cpuUsage
          memoryUsage
          pid
          port
          runningDocker
          uptime
        }
      }
      configs {
        custom
        description
        key
        required
        secure
        shared
        validation
        value
      }
      controller {
        chainHost
        consumedAt
        expireDate
        id
        launcherSessionId
        launcherUrl
        nftId
        nftOwner
        ownerDid
        status {
          reason
          value
        }
      }
      diskInfo {
        app
        blocklets
        cache
        data
        log
      }
      engine {
        available
        description
        displayName
        logo
        name
        version
        visible
      }
      environments {
        custom
        description
        key
        required
        secure
        shared
        validation
        value
      }
      meta {
        bundleDid
        bundleName
        community
        description
        did
        documentation
        engine
        group
        homepage
        keywords
        lastPublishedAt
        logo
        main
        name
        navigation
        nftFactory
        path
        resources
        screenshots
        support
        title
        version
        author {
          email
          name
          url
        }
        capabilities {
          clusterMode
          component
          didSpace
          navigation
          resourceExportApi
        }
        components {
          mountPoint
          name
          required
        }
        contributors {
          email
          name
          url
        }
        dist {
          integrity
          tarball
        }
        docker {
          image
          installNodeModules
          runBaseScript
          shell
        }
        environments {
          default
          description
          name
          required
          secure
          shared
          validation
        }
        events {
          description
          type
        }
        interfaces {
          cacheable
          name
          pageGroups
          path
          port
          prefix
          protocol
          type
          services {
            config
            name
          }
        }
        maintainers {
          email
          name
          url
        }
        owner {
          avatar
          did
          email
          fullName
        }
        payment {
          price {
            address
            symbol
            value
          }
          share {
            address
            name
            value
          }
        }
        repository {
          type
          url
        }
        requirements {
          aigne
          cpu
          os
          server
          fuels {
            address
            endpoint
            reason
            value
          }
        }
        resource {
          exportApi
          bundles {
            did
            public
            type
          }
          types {
            description
            type
          }
        }
        stats {
          downloads
          purchases
          star
        }
      }
      migratedFrom {
        appDid
        appSk
        at
      }
      optionalComponents {
        bundleSource
        logoUrl
        dependencies {
          mountPoint
          parentDid
          parentName
          parentTitle
          required
        }
        meta {
          bundleDid
          bundleName
          community
          description
          did
          documentation
          engine
          group
          homepage
          keywords
          lastPublishedAt
          logo
          main
          name
          navigation
          nftFactory
          path
          resources
          screenshots
          support
          title
          version
          author {
            email
            name
            url
          }
          capabilities {
            clusterMode
            component
            didSpace
            navigation
            resourceExportApi
          }
          components {
            mountPoint
            name
            required
          }
          contributors {
            email
            name
            url
          }
          dist {
            integrity
            tarball
          }
          docker {
            image
            installNodeModules
            runBaseScript
            shell
          }
          environments {
            default
            description
            name
            required
            secure
            shared
            validation
          }
          events {
            description
            type
          }
          interfaces {
            cacheable
            name
            pageGroups
            path
            port
            prefix
            protocol
            type
            services {
              config
              name
            }
          }
          maintainers {
            email
            name
            url
          }
          owner {
            avatar
            did
            email
            fullName
          }
          payment {
            price {
              address
              symbol
              value
            }
            share {
              address
              name
              value
            }
          }
          repository {
            type
            url
          }
          requirements {
            aigne
            cpu
            os
            server
            fuels {
              address
              endpoint
              reason
              value
            }
          }
          resource {
            exportApi
            bundles {
              did
              public
              type
            }
            types {
              description
              type
            }
          }
          stats {
            downloads
            purchases
            star
          }
        }
      }
      runtimeInfo {
        cpus
        cpuUsage
        memoryUsage
        pid
        port
        runningDocker
        uptime
      }
      settings {
        actionConfig
        authentication
        didConnect
        enablePassportIssuance
        enableSessionHardening
        initialized
        notification
        oauth
        publicToStore
        theme
        whoCanAccess
        aigne {
          accessKeyId
          key
          model
          provider
          secretAccessKey
          url
          validationResult
        }
        autoBackup {
          enabled
        }
        autoCheckUpdate {
          enabled
        }
        children {
          deletedAt
          deployedFrom
          mountPoint
          status
          meta {
            bundleDid
            bundleName
            description
            did
            name
            title
            version
          }
        }
        endpointList {
          appDescription
          appName
          endpoint
          id
          protected
          scope
          url
        }
        federated {
          config {
            appId
            appPid
            autoLogin
            delegation
            isMaster
          }
          sites {
            aliasDid
            aliasDomain
            appDescription
            appId
            appliedAt
            appLogo
            appLogoRect
            appName
            appPid
            appUrl
            did
            isMaster
            pk
            serverId
            serverVersion
            status
            version
          }
        }
        gateway {
          cacheEnabled
          blockPolicy {
            blacklist
            enabled
            autoBlocking {
              blockDuration
              enabled
              statusCodes
              windowQuota
              windowSize
            }
          }
          proxyPolicy {
            enabled
            realIpHeader
            trustedProxies
            trustRecursive
          }
          requestLimit {
            burstDelay
            burstFactor
            enabled
            global
            methods
            rate
          }
          wafPolicy {
            enabled
            inboundAnomalyScoreThreshold
            logLevel
            mode
            outboundAnomalyScoreThreshold
          }
        }
        invite {
          enabled
        }
        navigations {
          activeColor
          activeIcon
          color
          component
          description
          from
          icon
          id
          link
          parent
          private
          role
          section
          title
          visible
        }
        org {
          enabled
          maxMemberPerOrg
          maxOrgPerUser
        }
        owner {
          did
          pk
        }
        session {
          cacheTtl
          enableBlacklist
          salt
          ttl
          email {
            domainBlackList
            domainWhiteList
            enabled
            enableDomainBlackList
            enableDomainWhiteList
            requireUnique
            requireVerified
            trustOauthProviders
            trustedIssuers {
              id
              name
              pk
            }
          }
          phone {
            enabled
            enableRegionBlackList
            enableRegionWhiteList
            regionBlackList
            regionWhiteList
            requireUnique
            requireVerified
            trustedIssuers {
              id
              name
              pk
            }
          }
        }
        storeList {
          cdnUrl
          description
          id
          logoUrl
          maintainer
          name
          protected
          scope
          url
        }
        subService {
          domain
          enabled
          staticRoot
        }
        trustedFactories {
          factoryAddress
          holderDid
          issuerDid
          remark
          passport {
            role
            ttl
            ttlPolicy
          }
        }
        trustedPassports {
          issuerDid
          remark
          mappings {
            from {
              passport
            }
            to {
              role
              ttl
              ttlPolicy
            }
          }
        }
      }
      site {
        corsAllowedOrigins
        domain
        domainAliases
        id
        isProtected
        rules {
          id
          isProtected
          from {
            pathPrefix
            header {
              key
              type
              value
            }
          }
          to {
            componentId
            did
            interfaceName
            pageGroup
            port
            redirectCode
            type
            url
            response {
              body
              contentType
              status
            }
          }
        }
      }
      trustedFactories {
        factoryAddress
        holderDid
        issuerDid
        remark
        passport {
          role
          ttl
          ttlPolicy
        }
      }
      trustedPassports {
        issuerDid
        remark
        mappings {
          from {
            passport
          }
          to {
            role
            ttl
            ttlPolicy
          }
        }
      }
      vaults {
        approverDid
        approverPk
        approverSig
        at
        did
        pk
        sig
      }
    }
  }
}
```

### updateAppSessionConfig

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
mutation {
  updateAppSessionConfig {
    code
    blocklet {
      appDid
      appPid
      bundleSource
      createdAt
      deployedFrom
      dynamic
      enableDocker
      enableDockerNetwork
      enablePassportIssuance
      externalSk
      externalSkSource
      installedAt
      mode
      mountPoint
      pausedAt
      port
      ports
      source
      startedAt
      status
      stoppedAt
      structVersion
      updatedAt
      appRuntimeInfo {
        cpus
        cpuUsage
        memoryUsage
        pid
        port
        runningDocker
        uptime
      }
      children {
        bundleSource
        createdAt
        deployedFrom
        dynamic
        greenStatus
        installedAt
        mode
        mountPoint
        pausedAt
        port
        ports
        required
        source
        startedAt
        status
        stoppedAt
        appRuntimeInfo {
          cpus
          cpuUsage
          memoryUsage
          pid
          port
          runningDocker
          uptime
        }
        children {
          bundleSource
          createdAt
          deployedFrom
          dynamic
          greenStatus
          installedAt
          mode
          mountPoint
          pausedAt
          port
          ports
          required
          source
          startedAt
          status
          stoppedAt
          appRuntimeInfo {
            cpus
            cpuUsage
            memoryUsage
            pid
            port
            runningDocker
            uptime
          }
          children {
            bundleSource
            createdAt
            deployedFrom
            dynamic
            greenStatus
            installedAt
            mode
            mountPoint
            pausedAt
            port
            ports
            required
            source
            startedAt
            status
            stoppedAt
            appRuntimeInfo {
              cpus
              cpuUsage
              memoryUsage
              pid
              port
              runningDocker
              uptime
            }
            children {
              bundleSource
              createdAt
              deployedFrom
              dynamic
              greenStatus
              installedAt
              mode
              mountPoint
              pausedAt
              port
              ports
              required
              source
              startedAt
              status
              stoppedAt
              appRuntimeInfo {
                cpus
                cpuUsage
                memoryUsage
                pid
                port
                runningDocker
                uptime
              }
              children {
                bundleSource
                createdAt
                deployedFrom
                dynamic
                greenStatus
                installedAt
                mode
                mountPoint
                pausedAt
                port
                ports
                required
                source
                startedAt
                status
                stoppedAt
              }
              configs {
                custom
                description
                key
                required
                secure
                shared
                validation
                value
              }
              dependents {
                id
                required
              }
              diskInfo {
                app
                blocklets
                cache
                data
                log
              }
              engine {
                available
                description
                displayName
                logo
                name
                version
                visible
              }
              environments {
                custom
                description
                key
                required
                secure
                shared
                validation
                value
              }
              meta {
                bundleDid
                bundleName
                community
                description
                did
                documentation
                engine
                group
                homepage
                keywords
                lastPublishedAt
                logo
                main
                name
                navigation
                nftFactory
                path
                resources
                screenshots
                support
                title
                version
              }
              runtimeInfo {
                cpus
                cpuUsage
                memoryUsage
                pid
                port
                runningDocker
                uptime
              }
            }
            configs {
              custom
              description
              key
              required
              secure
              shared
              validation
              value
            }
            dependents {
              id
              required
            }
            diskInfo {
              app
              blocklets
              cache
              data
              log
            }
            engine {
              available
              description
              displayName
              logo
              name
              version
              visible
            }
            environments {
              custom
              description
              key
              required
              secure
              shared
              validation
              value
            }
            meta {
              bundleDid
              bundleName
              community
              description
              did
              documentation
              engine
              group
              homepage
              keywords
              lastPublishedAt
              logo
              main
              name
              navigation
              nftFactory
              path
              resources
              screenshots
              support
              title
              version
              author {
                email
                name
                url
              }
              capabilities {
                clusterMode
                component
                didSpace
                navigation
                resourceExportApi
              }
              components {
                mountPoint
                name
                required
              }
              contributors {
                email
                name
                url
              }
              dist {
                integrity
                tarball
              }
              docker {
                image
                installNodeModules
                runBaseScript
                shell
              }
              environments {
                default
                description
                name
                required
                secure
                shared
                validation
              }
              events {
                description
                type
              }
              interfaces {
                cacheable
                name
                pageGroups
                path
                port
                prefix
                protocol
                type
              }
              maintainers {
                email
                name
                url
              }
              owner {
                avatar
                did
                email
                fullName
              }
              repository {
                type
                url
              }
              requirements {
                aigne
                cpu
                os
                server
              }
              resource {
                exportApi
              }
              stats {
                downloads
                purchases
                star
              }
            }
            runtimeInfo {
              cpus
              cpuUsage
              memoryUsage
              pid
              port
              runningDocker
              uptime
            }
          }
          configs {
            custom
            description
            key
            required
            secure
            shared
            validation
            value
          }
          dependents {
            id
            required
          }
          diskInfo {
            app
            blocklets
            cache
            data
            log
          }
          engine {
            available
            description
            displayName
            logo
            name
            version
            visible
          }
          environments {
            custom
            description
            key
            required
            secure
            shared
            validation
            value
          }
          meta {
            bundleDid
            bundleName
            community
            description
            did
            documentation
            engine
            group
            homepage
            keywords
            lastPublishedAt
            logo
            main
            name
            navigation
            nftFactory
            path
            resources
            screenshots
            support
            title
            version
            author {
              email
              name
              url
            }
            capabilities {
              clusterMode
              component
              didSpace
              navigation
              resourceExportApi
            }
            components {
              mountPoint
              name
              required
            }
            contributors {
              email
              name
              url
            }
            dist {
              integrity
              tarball
            }
            docker {
              image
              installNodeModules
              runBaseScript
              shell
            }
            environments {
              default
              description
              name
              required
              secure
              shared
              validation
            }
            events {
              description
              type
            }
            interfaces {
              cacheable
              name
              pageGroups
              path
              port
              prefix
              protocol
              type
              services {
                config
                name
              }
            }
            maintainers {
              email
              name
              url
            }
            owner {
              avatar
              did
              email
              fullName
            }
            payment {
              price {
                address
                symbol
                value
              }
              share {
                address
                name
                value
              }
            }
            repository {
              type
              url
            }
            requirements {
              aigne
              cpu
              os
              server
              fuels {
                address
                endpoint
                reason
                value
              }
            }
            resource {
              exportApi
              bundles {
                did
                public
                type
              }
              types {
                description
                type
              }
            }
            stats {
              downloads
              purchases
              star
            }
          }
          runtimeInfo {
            cpus
            cpuUsage
            memoryUsage
            pid
            port
            runningDocker
            uptime
          }
        }
        configs {
          custom
          description
          key
          required
          secure
          shared
          validation
          value
        }
        dependents {
          id
          required
        }
        diskInfo {
          app
          blocklets
          cache
          data
          log
        }
        engine {
          available
          description
          displayName
          logo
          name
          version
          visible
        }
        environments {
          custom
          description
          key
          required
          secure
          shared
          validation
          value
        }
        meta {
          bundleDid
          bundleName
          community
          description
          did
          documentation
          engine
          group
          homepage
          keywords
          lastPublishedAt
          logo
          main
          name
          navigation
          nftFactory
          path
          resources
          screenshots
          support
          title
          version
          author {
            email
            name
            url
          }
          capabilities {
            clusterMode
            component
            didSpace
            navigation
            resourceExportApi
          }
          components {
            mountPoint
            name
            required
          }
          contributors {
            email
            name
            url
          }
          dist {
            integrity
            tarball
          }
          docker {
            image
            installNodeModules
            runBaseScript
            shell
          }
          environments {
            default
            description
            name
            required
            secure
            shared
            validation
          }
          events {
            description
            type
          }
          interfaces {
            cacheable
            name
            pageGroups
            path
            port
            prefix
            protocol
            type
            services {
              config
              name
            }
          }
          maintainers {
            email
            name
            url
          }
          owner {
            avatar
            did
            email
            fullName
          }
          payment {
            price {
              address
              symbol
              value
            }
            share {
              address
              name
              value
            }
          }
          repository {
            type
            url
          }
          requirements {
            aigne
            cpu
            os
            server
            fuels {
              address
              endpoint
              reason
              value
            }
          }
          resource {
            exportApi
            bundles {
              did
              public
              type
            }
            types {
              description
              type
            }
          }
          stats {
            downloads
            purchases
            star
          }
        }
        runtimeInfo {
          cpus
          cpuUsage
          memoryUsage
          pid
          port
          runningDocker
          uptime
        }
      }
      configs {
        custom
        description
        key
        required
        secure
        shared
        validation
        value
      }
      controller {
        chainHost
        consumedAt
        expireDate
        id
        launcherSessionId
        launcherUrl
        nftId
        nftOwner
        ownerDid
        status {
          reason
          value
        }
      }
      diskInfo {
        app
        blocklets
        cache
        data
        log
      }
      engine {
        available
        description
        displayName
        logo
        name
        version
        visible
      }
      environments {
        custom
        description
        key
        required
        secure
        shared
        validation
        value
      }
      meta {
        bundleDid
        bundleName
        community
        description
        did
        documentation
        engine
        group
        homepage
        keywords
        lastPublishedAt
        logo
        main
        name
        navigation
        nftFactory
        path
        resources
        screenshots
        support
        title
        version
        author {
          email
          name
          url
        }
        capabilities {
          clusterMode
          component
          didSpace
          navigation
          resourceExportApi
        }
        components {
          mountPoint
          name
          required
        }
        contributors {
          email
          name
          url
        }
        dist {
          integrity
          tarball
        }
        docker {
          image
          installNodeModules
          runBaseScript
          shell
        }
        environments {
          default
          description
          name
          required
          secure
          shared
          validation
        }
        events {
          description
          type
        }
        interfaces {
          cacheable
          name
          pageGroups
          path
          port
          prefix
          protocol
          type
          services {
            config
            name
          }
        }
        maintainers {
          email
          name
          url
        }
        owner {
          avatar
          did
          email
          fullName
        }
        payment {
          price {
            address
            symbol
            value
          }
          share {
            address
            name
            value
          }
        }
        repository {
          type
          url
        }
        requirements {
          aigne
          cpu
          os
          server
          fuels {
            address
            endpoint
            reason
            value
          }
        }
        resource {
          exportApi
          bundles {
            did
            public
            type
          }
          types {
            description
            type
          }
        }
        stats {
          downloads
          purchases
          star
        }
      }
      migratedFrom {
        appDid
        appSk
        at
      }
      optionalComponents {
        bundleSource
        logoUrl
        dependencies {
          mountPoint
          parentDid
          parentName
          parentTitle
          required
        }
        meta {
          bundleDid
          bundleName
          community
          description
          did
          documentation
          engine
          group
          homepage
          keywords
          lastPublishedAt
          logo
          main
          name
          navigation
          nftFactory
          path
          resources
          screenshots
          support
          title
          version
          author {
            email
            name
            url
          }
          capabilities {
            clusterMode
            component
            didSpace
            navigation
            resourceExportApi
          }
          components {
            mountPoint
            name
            required
          }
          contributors {
            email
            name
            url
          }
          dist {
            integrity
            tarball
          }
          docker {
            image
            installNodeModules
            runBaseScript
            shell
          }
          environments {
            default
            description
            name
            required
            secure
            shared
            validation
          }
          events {
            description
            type
          }
          interfaces {
            cacheable
            name
            pageGroups
            path
            port
            prefix
            protocol
            type
            services {
              config
              name
            }
          }
          maintainers {
            email
            name
            url
          }
          owner {
            avatar
            did
            email
            fullName
          }
          payment {
            price {
              address
              symbol
              value
            }
            share {
              address
              name
              value
            }
          }
          repository {
            type
            url
          }
          requirements {
            aigne
            cpu
            os
            server
            fuels {
              address
              endpoint
              reason
              value
            }
          }
          resource {
            exportApi
            bundles {
              did
              public
              type
            }
            types {
              description
              type
            }
          }
          stats {
            downloads
            purchases
            star
          }
        }
      }
      runtimeInfo {
        cpus
        cpuUsage
        memoryUsage
        pid
        port
        runningDocker
        uptime
      }
      settings {
        actionConfig
        authentication
        didConnect
        enablePassportIssuance
        enableSessionHardening
        initialized
        notification
        oauth
        publicToStore
        theme
        whoCanAccess
        aigne {
          accessKeyId
          key
          model
          provider
          secretAccessKey
          url
          validationResult
        }
        autoBackup {
          enabled
        }
        autoCheckUpdate {
          enabled
        }
        children {
          deletedAt
          deployedFrom
          mountPoint
          status
          meta {
            bundleDid
            bundleName
            description
            did
            name
            title
            version
          }
        }
        endpointList {
          appDescription
          appName
          endpoint
          id
          protected
          scope
          url
        }
        federated {
          config {
            appId
            appPid
            autoLogin
            delegation
            isMaster
          }
          sites {
            aliasDid
            aliasDomain
            appDescription
            appId
            appliedAt
            appLogo
            appLogoRect
            appName
            appPid
            appUrl
            did
            isMaster
            pk
            serverId
            serverVersion
            status
            version
          }
        }
        gateway {
          cacheEnabled
          blockPolicy {
            blacklist
            enabled
            autoBlocking {
              blockDuration
              enabled
              statusCodes
              windowQuota
              windowSize
            }
          }
          proxyPolicy {
            enabled
            realIpHeader
            trustedProxies
            trustRecursive
          }
          requestLimit {
            burstDelay
            burstFactor
            enabled
            global
            methods
            rate
          }
          wafPolicy {
            enabled
            inboundAnomalyScoreThreshold
            logLevel
            mode
            outboundAnomalyScoreThreshold
          }
        }
        invite {
          enabled
        }
        navigations {
          activeColor
          activeIcon
          color
          component
          description
          from
          icon
          id
          link
          parent
          private
          role
          section
          title
          visible
        }
        org {
          enabled
          maxMemberPerOrg
          maxOrgPerUser
        }
        owner {
          did
          pk
        }
        session {
          cacheTtl
          enableBlacklist
          salt
          ttl
          email {
            domainBlackList
            domainWhiteList
            enabled
            enableDomainBlackList
            enableDomainWhiteList
            requireUnique
            requireVerified
            trustOauthProviders
            trustedIssuers {
              id
              name
              pk
            }
          }
          phone {
            enabled
            enableRegionBlackList
            enableRegionWhiteList
            regionBlackList
            regionWhiteList
            requireUnique
            requireVerified
            trustedIssuers {
              id
              name
              pk
            }
          }
        }
        storeList {
          cdnUrl
          description
          id
          logoUrl
          maintainer
          name
          protected
          scope
          url
        }
        subService {
          domain
          enabled
          staticRoot
        }
        trustedFactories {
          factoryAddress
          holderDid
          issuerDid
          remark
          passport {
            role
            ttl
            ttlPolicy
          }
        }
        trustedPassports {
          issuerDid
          remark
          mappings {
            from {
              passport
            }
            to {
              role
              ttl
              ttlPolicy
            }
          }
        }
      }
      site {
        corsAllowedOrigins
        domain
        domainAliases
        id
        isProtected
        rules {
          id
          isProtected
          from {
            pathPrefix
            header {
              key
              type
              value
            }
          }
          to {
            componentId
            did
            interfaceName
            pageGroup
            port
            redirectCode
            type
            url
            response {
              body
              contentType
              status
            }
          }
        }
      }
      trustedFactories {
        factoryAddress
        holderDid
        issuerDid
        remark
        passport {
          role
          ttl
          ttlPolicy
        }
      }
      trustedPassports {
        issuerDid
        remark
        mappings {
          from {
            passport
          }
          to {
            role
            ttl
            ttlPolicy
          }
        }
      }
      vaults {
        approverDid
        approverPk
        approverSig
        at
        did
        pk
        sig
      }
    }
  }
}
```

### updateComponentTitle

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
mutation {
  updateComponentTitle {
    code
    blocklet {
      appDid
      appPid
      bundleSource
      createdAt
      deployedFrom
      dynamic
      enableDocker
      enableDockerNetwork
      enablePassportIssuance
      externalSk
      externalSkSource
      installedAt
      mode
      mountPoint
      pausedAt
      port
      ports
      source
      startedAt
      status
      stoppedAt
      structVersion
      updatedAt
      appRuntimeInfo {
        cpus
        cpuUsage
        memoryUsage
        pid
        port
        runningDocker
        uptime
      }
      children {
        bundleSource
        createdAt
        deployedFrom
        dynamic
        greenStatus
        installedAt
        mode
        mountPoint
        pausedAt
        port
        ports
        required
        source
        startedAt
        status
        stoppedAt
        appRuntimeInfo {
          cpus
          cpuUsage
          memoryUsage
          pid
          port
          runningDocker
          uptime
        }
        children {
          bundleSource
          createdAt
          deployedFrom
          dynamic
          greenStatus
          installedAt
          mode
          mountPoint
          pausedAt
          port
          ports
          required
          source
          startedAt
          status
          stoppedAt
          appRuntimeInfo {
            cpus
            cpuUsage
            memoryUsage
            pid
            port
            runningDocker
            uptime
          }
          children {
            bundleSource
            createdAt
            deployedFrom
            dynamic
            greenStatus
            installedAt
            mode
            mountPoint
            pausedAt
            port
            ports
            required
            source
            startedAt
            status
            stoppedAt
            appRuntimeInfo {
              cpus
              cpuUsage
              memoryUsage
              pid
              port
              runningDocker
              uptime
            }
            children {
              bundleSource
              createdAt
              deployedFrom
              dynamic
              greenStatus
              installedAt
              mode
              mountPoint
              pausedAt
              port
              ports
              required
              source
              startedAt
              status
              stoppedAt
              appRuntimeInfo {
                cpus
                cpuUsage
                memoryUsage
                pid
                port
                runningDocker
                uptime
              }
              children {
                bundleSource
                createdAt
                deployedFrom
                dynamic
                greenStatus
                installedAt
                mode
                mountPoint
                pausedAt
                port
                ports
                required
                source
                startedAt
                status
                stoppedAt
              }
              configs {
                custom
                description
                key
                required
                secure
                shared
                validation
                value
              }
              dependents {
                id
                required
              }
              diskInfo {
                app
                blocklets
                cache
                data
                log
              }
              engine {
                available
                description
                displayName
                logo
                name
                version
                visible
              }
              environments {
                custom
                description
                key
                required
                secure
                shared
                validation
                value
              }
              meta {
                bundleDid
                bundleName
                community
                description
                did
                documentation
                engine
                group
                homepage
                keywords
                lastPublishedAt
                logo
                main
                name
                navigation
                nftFactory
                path
                resources
                screenshots
                support
                title
                version
              }
              runtimeInfo {
                cpus
                cpuUsage
                memoryUsage
                pid
                port
                runningDocker
                uptime
              }
            }
            configs {
              custom
              description
              key
              required
              secure
              shared
              validation
              value
            }
            dependents {
              id
              required
            }
            diskInfo {
              app
              blocklets
              cache
              data
              log
            }
            engine {
              available
              description
              displayName
              logo
              name
              version
              visible
            }
            environments {
              custom
              description
              key
              required
              secure
              shared
              validation
              value
            }
            meta {
              bundleDid
              bundleName
              community
              description
              did
              documentation
              engine
              group
              homepage
              keywords
              lastPublishedAt
              logo
              main
              name
              navigation
              nftFactory
              path
              resources
              screenshots
              support
              title
              version
              author {
                email
                name
                url
              }
              capabilities {
                clusterMode
                component
                didSpace
                navigation
                resourceExportApi
              }
              components {
                mountPoint
                name
                required
              }
              contributors {
                email
                name
                url
              }
              dist {
                integrity
                tarball
              }
              docker {
                image
                installNodeModules
                runBaseScript
                shell
              }
              environments {
                default
                description
                name
                required
                secure
                shared
                validation
              }
              events {
                description
                type
              }
              interfaces {
                cacheable
                name
                pageGroups
                path
                port
                prefix
                protocol
                type
              }
              maintainers {
                email
                name
                url
              }
              owner {
                avatar
                did
                email
                fullName
              }
              repository {
                type
                url
              }
              requirements {
                aigne
                cpu
                os
                server
              }
              resource {
                exportApi
              }
              stats {
                downloads
                purchases
                star
              }
            }
            runtimeInfo {
              cpus
              cpuUsage
              memoryUsage
              pid
              port
              runningDocker
              uptime
            }
          }
          configs {
            custom
            description
            key
            required
            secure
            shared
            validation
            value
          }
          dependents {
            id
            required
          }
          diskInfo {
            app
            blocklets
            cache
            data
            log
          }
          engine {
            available
            description
            displayName
            logo
            name
            version
            visible
          }
          environments {
            custom
            description
            key
            required
            secure
            shared
            validation
            value
          }
          meta {
            bundleDid
            bundleName
            community
            description
            did
            documentation
            engine
            group
            homepage
            keywords
            lastPublishedAt
            logo
            main
            name
            navigation
            nftFactory
            path
            resources
            screenshots
            support
            title
            version
            author {
              email
              name
              url
            }
            capabilities {
              clusterMode
              component
              didSpace
              navigation
              resourceExportApi
            }
            components {
              mountPoint
              name
              required
            }
            contributors {
              email
              name
              url
            }
            dist {
              integrity
              tarball
            }
            docker {
              image
              installNodeModules
              runBaseScript
              shell
            }
            environments {
              default
              description
              name
              required
              secure
              shared
              validation
            }
            events {
              description
              type
            }
            interfaces {
              cacheable
              name
              pageGroups
              path
              port
              prefix
              protocol
              type
              services {
                config
                name
              }
            }
            maintainers {
              email
              name
              url
            }
            owner {
              avatar
              did
              email
              fullName
            }
            payment {
              price {
                address
                symbol
                value
              }
              share {
                address
                name
                value
              }
            }
            repository {
              type
              url
            }
            requirements {
              aigne
              cpu
              os
              server
              fuels {
                address
                endpoint
                reason
                value
              }
            }
            resource {
              exportApi
              bundles {
                did
                public
                type
              }
              types {
                description
                type
              }
            }
            stats {
              downloads
              purchases
              star
            }
          }
          runtimeInfo {
            cpus
            cpuUsage
            memoryUsage
            pid
            port
            runningDocker
            uptime
          }
        }
        configs {
          custom
          description
          key
          required
          secure
          shared
          validation
          value
        }
        dependents {
          id
          required
        }
        diskInfo {
          app
          blocklets
          cache
          data
          log
        }
        engine {
          available
          description
          displayName
          logo
          name
          version
          visible
        }
        environments {
          custom
          description
          key
          required
          secure
          shared
          validation
          value
        }
        meta {
          bundleDid
          bundleName
          community
          description
          did
          documentation
          engine
          group
          homepage
          keywords
          lastPublishedAt
          logo
          main
          name
          navigation
          nftFactory
          path
          resources
          screenshots
          support
          title
          version
          author {
            email
            name
            url
          }
          capabilities {
            clusterMode
            component
            didSpace
            navigation
            resourceExportApi
          }
          components {
            mountPoint
            name
            required
          }
          contributors {
            email
            name
            url
          }
          dist {
            integrity
            tarball
          }
          docker {
            image
            installNodeModules
            runBaseScript
            shell
          }
          environments {
            default
            description
            name
            required
            secure
            shared
            validation
          }
          events {
            description
            type
          }
          interfaces {
            cacheable
            name
            pageGroups
            path
            port
            prefix
            protocol
            type
            services {
              config
              name
            }
          }
          maintainers {
            email
            name
            url
          }
          owner {
            avatar
            did
            email
            fullName
          }
          payment {
            price {
              address
              symbol
              value
            }
            share {
              address
              name
              value
            }
          }
          repository {
            type
            url
          }
          requirements {
            aigne
            cpu
            os
            server
            fuels {
              address
              endpoint
              reason
              value
            }
          }
          resource {
            exportApi
            bundles {
              did
              public
              type
            }
            types {
              description
              type
            }
          }
          stats {
            downloads
            purchases
            star
          }
        }
        runtimeInfo {
          cpus
          cpuUsage
          memoryUsage
          pid
          port
          runningDocker
          uptime
        }
      }
      configs {
        custom
        description
        key
        required
        secure
        shared
        validation
        value
      }
      controller {
        chainHost
        consumedAt
        expireDate
        id
        launcherSessionId
        launcherUrl
        nftId
        nftOwner
        ownerDid
        status {
          reason
          value
        }
      }
      diskInfo {
        app
        blocklets
        cache
        data
        log
      }
      engine {
        available
        description
        displayName
        logo
        name
        version
        visible
      }
      environments {
        custom
        description
        key
        required
        secure
        shared
        validation
        value
      }
      meta {
        bundleDid
        bundleName
        community
        description
        did
        documentation
        engine
        group
        homepage
        keywords
        lastPublishedAt
        logo
        main
        name
        navigation
        nftFactory
        path
        resources
        screenshots
        support
        title
        version
        author {
          email
          name
          url
        }
        capabilities {
          clusterMode
          component
          didSpace
          navigation
          resourceExportApi
        }
        components {
          mountPoint
          name
          required
        }
        contributors {
          email
          name
          url
        }
        dist {
          integrity
          tarball
        }
        docker {
          image
          installNodeModules
          runBaseScript
          shell
        }
        environments {
          default
          description
          name
          required
          secure
          shared
          validation
        }
        events {
          description
          type
        }
        interfaces {
          cacheable
          name
          pageGroups
          path
          port
          prefix
          protocol
          type
          services {
            config
            name
          }
        }
        maintainers {
          email
          name
          url
        }
        owner {
          avatar
          did
          email
          fullName
        }
        payment {
          price {
            address
            symbol
            value
          }
          share {
            address
            name
            value
          }
        }
        repository {
          type
          url
        }
        requirements {
          aigne
          cpu
          os
          server
          fuels {
            address
            endpoint
            reason
            value
          }
        }
        resource {
          exportApi
          bundles {
            did
            public
            type
          }
          types {
            description
            type
          }
        }
        stats {
          downloads
          purchases
          star
        }
      }
      migratedFrom {
        appDid
        appSk
        at
      }
      optionalComponents {
        bundleSource
        logoUrl
        dependencies {
          mountPoint
          parentDid
          parentName
          parentTitle
          required
        }
        meta {
          bundleDid
          bundleName
          community
          description
          did
          documentation
          engine
          group
          homepage
          keywords
          lastPublishedAt
          logo
          main
          name
          navigation
          nftFactory
          path
          resources
          screenshots
          support
          title
          version
          author {
            email
            name
            url
          }
          capabilities {
            clusterMode
            component
            didSpace
            navigation
            resourceExportApi
          }
          components {
            mountPoint
            name
            required
          }
          contributors {
            email
            name
            url
          }
          dist {
            integrity
            tarball
          }
          docker {
            image
            installNodeModules
            runBaseScript
            shell
          }
          environments {
            default
            description
            name
            required
            secure
            shared
            validation
          }
          events {
            description
            type
          }
          interfaces {
            cacheable
            name
            pageGroups
            path
            port
            prefix
            protocol
            type
            services {
              config
              name
            }
          }
          maintainers {
            email
            name
            url
          }
          owner {
            avatar
            did
            email
            fullName
          }
          payment {
            price {
              address
              symbol
              value
            }
            share {
              address
              name
              value
            }
          }
          repository {
            type
            url
          }
          requirements {
            aigne
            cpu
            os
            server
            fuels {
              address
              endpoint
              reason
              value
            }
          }
          resource {
            exportApi
            bundles {
              did
              public
              type
            }
            types {
              description
              type
            }
          }
          stats {
            downloads
            purchases
            star
          }
        }
      }
      runtimeInfo {
        cpus
        cpuUsage
        memoryUsage
        pid
        port
        runningDocker
        uptime
      }
      settings {
        actionConfig
        authentication
        didConnect
        enablePassportIssuance
        enableSessionHardening
        initialized
        notification
        oauth
        publicToStore
        theme
        whoCanAccess
        aigne {
          accessKeyId
          key
          model
          provider
          secretAccessKey
          url
          validationResult
        }
        autoBackup {
          enabled
        }
        autoCheckUpdate {
          enabled
        }
        children {
          deletedAt
          deployedFrom
          mountPoint
          status
          meta {
            bundleDid
            bundleName
            description
            did
            name
            title
            version
          }
        }
        endpointList {
          appDescription
          appName
          endpoint
          id
          protected
          scope
          url
        }
        federated {
          config {
            appId
            appPid
            autoLogin
            delegation
            isMaster
          }
          sites {
            aliasDid
            aliasDomain
            appDescription
            appId
            appliedAt
            appLogo
            appLogoRect
            appName
            appPid
            appUrl
            did
            isMaster
            pk
            serverId
            serverVersion
            status
            version
          }
        }
        gateway {
          cacheEnabled
          blockPolicy {
            blacklist
            enabled
            autoBlocking {
              blockDuration
              enabled
              statusCodes
              windowQuota
              windowSize
            }
          }
          proxyPolicy {
            enabled
            realIpHeader
            trustedProxies
            trustRecursive
          }
          requestLimit {
            burstDelay
            burstFactor
            enabled
            global
            methods
            rate
          }
          wafPolicy {
            enabled
            inboundAnomalyScoreThreshold
            logLevel
            mode
            outboundAnomalyScoreThreshold
          }
        }
        invite {
          enabled
        }
        navigations {
          activeColor
          activeIcon
          color
          component
          description
          from
          icon
          id
          link
          parent
          private
          role
          section
          title
          visible
        }
        org {
          enabled
          maxMemberPerOrg
          maxOrgPerUser
        }
        owner {
          did
          pk
        }
        session {
          cacheTtl
          enableBlacklist
          salt
          ttl
          email {
            domainBlackList
            domainWhiteList
            enabled
            enableDomainBlackList
            enableDomainWhiteList
            requireUnique
            requireVerified
            trustOauthProviders
            trustedIssuers {
              id
              name
              pk
            }
          }
          phone {
            enabled
            enableRegionBlackList
            enableRegionWhiteList
            regionBlackList
            regionWhiteList
            requireUnique
            requireVerified
            trustedIssuers {
              id
              name
              pk
            }
          }
        }
        storeList {
          cdnUrl
          description
          id
          logoUrl
          maintainer
          name
          protected
          scope
          url
        }
        subService {
          domain
          enabled
          staticRoot
        }
        trustedFactories {
          factoryAddress
          holderDid
          issuerDid
          remark
          passport {
            role
            ttl
            ttlPolicy
          }
        }
        trustedPassports {
          issuerDid
          remark
          mappings {
            from {
              passport
            }
            to {
              role
              ttl
              ttlPolicy
            }
          }
        }
      }
      site {
        corsAllowedOrigins
        domain
        domainAliases
        id
        isProtected
        rules {
          id
          isProtected
          from {
            pathPrefix
            header {
              key
              type
              value
            }
          }
          to {
            componentId
            did
            interfaceName
            pageGroup
            port
            redirectCode
            type
            url
            response {
              body
              contentType
              status
            }
          }
        }
      }
      trustedFactories {
        factoryAddress
        holderDid
        issuerDid
        remark
        passport {
          role
          ttl
          ttlPolicy
        }
      }
      trustedPassports {
        issuerDid
        remark
        mappings {
          from {
            passport
          }
          to {
            role
            ttl
            ttlPolicy
          }
        }
      }
      vaults {
        approverDid
        approverPk
        approverSig
        at
        did
        pk
        sig
      }
    }
  }
}
```

### updateComponentMountPoint

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
mutation {
  updateComponentMountPoint {
    code
    blocklet {
      appDid
      appPid
      bundleSource
      createdAt
      deployedFrom
      dynamic
      enableDocker
      enableDockerNetwork
      enablePassportIssuance
      externalSk
      externalSkSource
      installedAt
      mode
      mountPoint
      pausedAt
      port
      ports
      source
      startedAt
      status
      stoppedAt
      structVersion
      updatedAt
      appRuntimeInfo {
        cpus
        cpuUsage
        memoryUsage
        pid
        port
        runningDocker
        uptime
      }
      children {
        bundleSource
        createdAt
        deployedFrom
        dynamic
        greenStatus
        installedAt
        mode
        mountPoint
        pausedAt
        port
        ports
        required
        source
        startedAt
        status
        stoppedAt
        appRuntimeInfo {
          cpus
          cpuUsage
          memoryUsage
          pid
          port
          runningDocker
          uptime
        }
        children {
          bundleSource
          createdAt
          deployedFrom
          dynamic
          greenStatus
          installedAt
          mode
          mountPoint
          pausedAt
          port
          ports
          required
          source
          startedAt
          status
          stoppedAt
          appRuntimeInfo {
            cpus
            cpuUsage
            memoryUsage
            pid
            port
            runningDocker
            uptime
          }
          children {
            bundleSource
            createdAt
            deployedFrom
            dynamic
            greenStatus
            installedAt
            mode
            mountPoint
            pausedAt
            port
            ports
            required
            source
            startedAt
            status
            stoppedAt
            appRuntimeInfo {
              cpus
              cpuUsage
              memoryUsage
              pid
              port
              runningDocker
              uptime
            }
            children {
              bundleSource
              createdAt
              deployedFrom
              dynamic
              greenStatus
              installedAt
              mode
              mountPoint
              pausedAt
              port
              ports
              required
              source
              startedAt
              status
              stoppedAt
              appRuntimeInfo {
                cpus
                cpuUsage
                memoryUsage
                pid
                port
                runningDocker
                uptime
              }
              children {
                bundleSource
                createdAt
                deployedFrom
                dynamic
                greenStatus
                installedAt
                mode
                mountPoint
                pausedAt
                port
                ports
                required
                source
                startedAt
                status
                stoppedAt
              }
              configs {
                custom
                description
                key
                required
                secure
                shared
                validation
                value
              }
              dependents {
                id
                required
              }
              diskInfo {
                app
                blocklets
                cache
                data
                log
              }
              engine {
                available
                description
                displayName
                logo
                name
                version
                visible
              }
              environments {
                custom
                description
                key
                required
                secure
                shared
                validation
                value
              }
              meta {
                bundleDid
                bundleName
                community
                description
                did
                documentation
                engine
                group
                homepage
                keywords
                lastPublishedAt
                logo
                main
                name
                navigation
                nftFactory
                path
                resources
                screenshots
                support
                title
                version
              }
              runtimeInfo {
                cpus
                cpuUsage
                memoryUsage
                pid
                port
                runningDocker
                uptime
              }
            }
            configs {
              custom
              description
              key
              required
              secure
              shared
              validation
              value
            }
            dependents {
              id
              required
            }
            diskInfo {
              app
              blocklets
              cache
              data
              log
            }
            engine {
              available
              description
              displayName
              logo
              name
              version
              visible
            }
            environments {
              custom
              description
              key
              required
              secure
              shared
              validation
              value
            }
            meta {
              bundleDid
              bundleName
              community
              description
              did
              documentation
              engine
              group
              homepage
              keywords
              lastPublishedAt
              logo
              main
              name
              navigation
              nftFactory
              path
              resources
              screenshots
              support
              title
              version
              author {
                email
                name
                url
              }
              capabilities {
                clusterMode
                component
                didSpace
                navigation
                resourceExportApi
              }
              components {
                mountPoint
                name
                required
              }
              contributors {
                email
                name
                url
              }
              dist {
                integrity
                tarball
              }
              docker {
                image
                installNodeModules
                runBaseScript
                shell
              }
              environments {
                default
                description
                name
                required
                secure
                shared
                validation
              }
              events {
                description
                type
              }
              interfaces {
                cacheable
                name
                pageGroups
                path
                port
                prefix
                protocol
                type
              }
              maintainers {
                email
                name
                url
              }
              owner {
                avatar
                did
                email
                fullName
              }
              repository {
                type
                url
              }
              requirements {
                aigne
                cpu
                os
                server
              }
              resource {
                exportApi
              }
              stats {
                downloads
                purchases
                star
              }
            }
            runtimeInfo {
              cpus
              cpuUsage
              memoryUsage
              pid
              port
              runningDocker
              uptime
            }
          }
          configs {
            custom
            description
            key
            required
            secure
            shared
            validation
            value
          }
          dependents {
            id
            required
          }
          diskInfo {
            app
            blocklets
            cache
            data
            log
          }
          engine {
            available
            description
            displayName
            logo
            name
            version
            visible
          }
          environments {
            custom
            description
            key
            required
            secure
            shared
            validation
            value
          }
          meta {
            bundleDid
            bundleName
            community
            description
            did
            documentation
            engine
            group
            homepage
            keywords
            lastPublishedAt
            logo
            main
            name
            navigation
            nftFactory
            path
            resources
            screenshots
            support
            title
            version
            author {
              email
              name
              url
            }
            capabilities {
              clusterMode
              component
              didSpace
              navigation
              resourceExportApi
            }
            components {
              mountPoint
              name
              required
            }
            contributors {
              email
              name
              url
            }
            dist {
              integrity
              tarball
            }
            docker {
              image
              installNodeModules
              runBaseScript
              shell
            }
            environments {
              default
              description
              name
              required
              secure
              shared
              validation
            }
            events {
              description
              type
            }
            interfaces {
              cacheable
              name
              pageGroups
              path
              port
              prefix
              protocol
              type
              services {
                config
                name
              }
            }
            maintainers {
              email
              name
              url
            }
            owner {
              avatar
              did
              email
              fullName
            }
            payment {
              price {
                address
                symbol
                value
              }
              share {
                address
                name
                value
              }
            }
            repository {
              type
              url
            }
            requirements {
              aigne
              cpu
              os
              server
              fuels {
                address
                endpoint
                reason
                value
              }
            }
            resource {
              exportApi
              bundles {
                did
                public
                type
              }
              types {
                description
                type
              }
            }
            stats {
              downloads
              purchases
              star
            }
          }
          runtimeInfo {
            cpus
            cpuUsage
            memoryUsage
            pid
            port
            runningDocker
            uptime
          }
        }
        configs {
          custom
          description
          key
          required
          secure
          shared
          validation
          value
        }
        dependents {
          id
          required
        }
        diskInfo {
          app
          blocklets
          cache
          data
          log
        }
        engine {
          available
          description
          displayName
          logo
          name
          version
          visible
        }
        environments {
          custom
          description
          key
          required
          secure
          shared
          validation
          value
        }
        meta {
          bundleDid
          bundleName
          community
          description
          did
          documentation
          engine
          group
          homepage
          keywords
          lastPublishedAt
          logo
          main
          name
          navigation
          nftFactory
          path
          resources
          screenshots
          support
          title
          version
          author {
            email
            name
            url
          }
          capabilities {
            clusterMode
            component
            didSpace
            navigation
            resourceExportApi
          }
          components {
            mountPoint
            name
            required
          }
          contributors {
            email
            name
            url
          }
          dist {
            integrity
            tarball
          }
          docker {
            image
            installNodeModules
            runBaseScript
            shell
          }
          environments {
            default
            description
            name
            required
            secure
            shared
            validation
          }
          events {
            description
            type
          }
          interfaces {
            cacheable
            name
            pageGroups
            path
            port
            prefix
            protocol
            type
            services {
              config
              name
            }
          }
          maintainers {
            email
            name
            url
          }
          owner {
            avatar
            did
            email
            fullName
          }
          payment {
            price {
              address
              symbol
              value
            }
            share {
              address
              name
              value
            }
          }
          repository {
            type
            url
          }
          requirements {
            aigne
            cpu
            os
            server
            fuels {
              address
              endpoint
              reason
              value
            }
          }
          resource {
            exportApi
            bundles {
              did
              public
              type
            }
            types {
              description
              type
            }
          }
          stats {
            downloads
            purchases
            star
          }
        }
        runtimeInfo {
          cpus
          cpuUsage
          memoryUsage
          pid
          port
          runningDocker
          uptime
        }
      }
      configs {
        custom
        description
        key
        required
        secure
        shared
        validation
        value
      }
      controller {
        chainHost
        consumedAt
        expireDate
        id
        launcherSessionId
        launcherUrl
        nftId
        nftOwner
        ownerDid
        status {
          reason
          value
        }
      }
      diskInfo {
        app
        blocklets
        cache
        data
        log
      }
      engine {
        available
        description
        displayName
        logo
        name
        version
        visible
      }
      environments {
        custom
        description
        key
        required
        secure
        shared
        validation
        value
      }
      meta {
        bundleDid
        bundleName
        community
        description
        did
        documentation
        engine
        group
        homepage
        keywords
        lastPublishedAt
        logo
        main
        name
        navigation
        nftFactory
        path
        resources
        screenshots
        support
        title
        version
        author {
          email
          name
          url
        }
        capabilities {
          clusterMode
          component
          didSpace
          navigation
          resourceExportApi
        }
        components {
          mountPoint
          name
          required
        }
        contributors {
          email
          name
          url
        }
        dist {
          integrity
          tarball
        }
        docker {
          image
          installNodeModules
          runBaseScript
          shell
        }
        environments {
          default
          description
          name
          required
          secure
          shared
          validation
        }
        events {
          description
          type
        }
        interfaces {
          cacheable
          name
          pageGroups
          path
          port
          prefix
          protocol
          type
          services {
            config
            name
          }
        }
        maintainers {
          email
          name
          url
        }
        owner {
          avatar
          did
          email
          fullName
        }
        payment {
          price {
            address
            symbol
            value
          }
          share {
            address
            name
            value
          }
        }
        repository {
          type
          url
        }
        requirements {
          aigne
          cpu
          os
          server
          fuels {
            address
            endpoint
            reason
            value
          }
        }
        resource {
          exportApi
          bundles {
            did
            public
            type
          }
          types {
            description
            type
          }
        }
        stats {
          downloads
          purchases
          star
        }
      }
      migratedFrom {
        appDid
        appSk
        at
      }
      optionalComponents {
        bundleSource
        logoUrl
        dependencies {
          mountPoint
          parentDid
          parentName
          parentTitle
          required
        }
        meta {
          bundleDid
          bundleName
          community
          description
          did
          documentation
          engine
          group
          homepage
          keywords
          lastPublishedAt
          logo
          main
          name
          navigation
          nftFactory
          path
          resources
          screenshots
          support
          title
          version
          author {
            email
            name
            url
          }
          capabilities {
            clusterMode
            component
            didSpace
            navigation
            resourceExportApi
          }
          components {
            mountPoint
            name
            required
          }
          contributors {
            email
            name
            url
          }
          dist {
            integrity
            tarball
          }
          docker {
            image
            installNodeModules
            runBaseScript
            shell
          }
          environments {
            default
            description
            name
            required
            secure
            shared
            validation
          }
          events {
            description
            type
          }
          interfaces {
            cacheable
            name
            pageGroups
            path
            port
            prefix
            protocol
            type
            services {
              config
              name
            }
          }
          maintainers {
            email
            name
            url
          }
          owner {
            avatar
            did
            email
            fullName
          }
          payment {
            price {
              address
              symbol
              value
            }
            share {
              address
              name
              value
            }
          }
          repository {
            type
            url
          }
          requirements {
            aigne
            cpu
            os
            server
            fuels {
              address
              endpoint
              reason
              value
            }
          }
          resource {
            exportApi
            bundles {
              did
              public
              type
            }
            types {
              description
              type
            }
          }
          stats {
            downloads
            purchases
            star
          }
        }
      }
      runtimeInfo {
        cpus
        cpuUsage
        memoryUsage
        pid
        port
        runningDocker
        uptime
      }
      settings {
        actionConfig
        authentication
        didConnect
        enablePassportIssuance
        enableSessionHardening
        initialized
        notification
        oauth
        publicToStore
        theme
        whoCanAccess
        aigne {
          accessKeyId
          key
          model
          provider
          secretAccessKey
          url
          validationResult
        }
        autoBackup {
          enabled
        }
        autoCheckUpdate {
          enabled
        }
        children {
          deletedAt
          deployedFrom
          mountPoint
          status
          meta {
            bundleDid
            bundleName
            description
            did
            name
            title
            version
          }
        }
        endpointList {
          appDescription
          appName
          endpoint
          id
          protected
          scope
          url
        }
        federated {
          config {
            appId
            appPid
            autoLogin
            delegation
            isMaster
          }
          sites {
            aliasDid
            aliasDomain
            appDescription
            appId
            appliedAt
            appLogo
            appLogoRect
            appName
            appPid
            appUrl
            did
            isMaster
            pk
            serverId
            serverVersion
            status
            version
          }
        }
        gateway {
          cacheEnabled
          blockPolicy {
            blacklist
            enabled
            autoBlocking {
              blockDuration
              enabled
              statusCodes
              windowQuota
              windowSize
            }
          }
          proxyPolicy {
            enabled
            realIpHeader
            trustedProxies
            trustRecursive
          }
          requestLimit {
            burstDelay
            burstFactor
            enabled
            global
            methods
            rate
          }
          wafPolicy {
            enabled
            inboundAnomalyScoreThreshold
            logLevel
            mode
            outboundAnomalyScoreThreshold
          }
        }
        invite {
          enabled
        }
        navigations {
          activeColor
          activeIcon
          color
          component
          description
          from
          icon
          id
          link
          parent
          private
          role
          section
          title
          visible
        }
        org {
          enabled
          maxMemberPerOrg
          maxOrgPerUser
        }
        owner {
          did
          pk
        }
        session {
          cacheTtl
          enableBlacklist
          salt
          ttl
          email {
            domainBlackList
            domainWhiteList
            enabled
            enableDomainBlackList
            enableDomainWhiteList
            requireUnique
            requireVerified
            trustOauthProviders
            trustedIssuers {
              id
              name
              pk
            }
          }
          phone {
            enabled
            enableRegionBlackList
            enableRegionWhiteList
            regionBlackList
            regionWhiteList
            requireUnique
            requireVerified
            trustedIssuers {
              id
              name
              pk
            }
          }
        }
        storeList {
          cdnUrl
          description
          id
          logoUrl
          maintainer
          name
          protected
          scope
          url
        }
        subService {
          domain
          enabled
          staticRoot
        }
        trustedFactories {
          factoryAddress
          holderDid
          issuerDid
          remark
          passport {
            role
            ttl
            ttlPolicy
          }
        }
        trustedPassports {
          issuerDid
          remark
          mappings {
            from {
              passport
            }
            to {
              role
              ttl
              ttlPolicy
            }
          }
        }
      }
      site {
        corsAllowedOrigins
        domain
        domainAliases
        id
        isProtected
        rules {
          id
          isProtected
          from {
            pathPrefix
            header {
              key
              type
              value
            }
          }
          to {
            componentId
            did
            interfaceName
            pageGroup
            port
            redirectCode
            type
            url
            response {
              body
              contentType
              status
            }
          }
        }
      }
      trustedFactories {
        factoryAddress
        holderDid
        issuerDid
        remark
        passport {
          role
          ttl
          ttlPolicy
        }
      }
      trustedPassports {
        issuerDid
        remark
        mappings {
          from {
            passport
          }
          to {
            role
            ttl
            ttlPolicy
          }
        }
      }
      vaults {
        approverDid
        approverPk
        approverSig
        at
        did
        pk
        sig
      }
    }
  }
}
```

### backupBlocklet

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
mutation {
  backupBlocklet {
    code
  }
}
```

### abortBlockletBackup

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
mutation {
  abortBlockletBackup {
    code
  }
}
```

### restoreBlocklet

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
mutation {
  restoreBlocklet {
    code
  }
}
```

### migrateApplicationToStructV2

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
mutation {
  migrateApplicationToStructV2 {
    code
  }
}
```

### launchBlockletByLauncher

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
mutation {
  launchBlockletByLauncher {
    code
    data
  }
}
```

### launchBlockletWithoutWallet

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
mutation {
  launchBlockletWithoutWallet {
    code
    data
  }
}
```

### addBlockletSpaceGateway

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
mutation {
  addBlockletSpaceGateway {
    code
  }
}
```

### deleteBlockletSpaceGateway

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
mutation {
  deleteBlockletSpaceGateway {
    code
  }
}
```

### updateBlockletSpaceGateway

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
mutation {
  updateBlockletSpaceGateway {
    code
  }
}
```

### updateAutoBackup

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
mutation {
  updateAutoBackup {
    code
  }
}
```

### updateAutoCheckUpdate

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
mutation {
  updateAutoCheckUpdate {
    code
  }
}
```

### updateBlockletSettings

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
mutation {
  updateBlockletSettings {
    code
  }
}
```

### updateNodeInfo

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
mutation {
  updateNodeInfo {
    code
    info {
      autoUpgrade
      createdAt
      description
      did
      didDomain
      didRegistry
      diskAlertThreshold
      enableBetaRelease
      enableDocker
      enableDockerNetwork
      enableFileSystemIsolation
      enablePassportIssuance
      enableSessionHardening
      enableWelcomePage
      initialized
      initializedAt
      isDockerInstalled
      mode
      name
      nextVersion
      nftDomainUrl
      pk
      port
      registerUrl
      sessionSalt
      startedAt
      status
      upgradeSessionId
      uptime
      version
      webWalletUrl
      blockletRegistryList {
        cdnUrl
        description
        id
        logoUrl
        maintainer
        name
        protected
        scope
        url
      }
      environments {
        custom
        description
        key
        required
        secure
        shared
        validation
        value
      }
      launcher {
        chainHost
        did
        provider
        tag
        type
        url
      }
      nodeOwner {
        did
        pk
      }
      ownerNft {
        did
        holder
        issuer
        launcherSessionId
      }
      routing {
        adminPath
        cacheEnabled
        provider
        snapshotHash
        blockPolicy {
          blacklist
          enabled
          autoBlocking {
            blockDuration
            enabled
            statusCodes
            windowQuota
            windowSize
          }
        }
        proxyPolicy {
          enabled
          realIpHeader
          trustedProxies
          trustRecursive
        }
        requestLimit {
          burstDelay
          burstFactor
          enabled
          global
          methods
          rate
        }
        wafPolicy {
          enabled
          inboundAnomalyScoreThreshold
          logLevel
          mode
          outboundAnomalyScoreThreshold
        }
      }
      runtimeConfig {
        blockletMaxMemoryLimit
        daemonMaxMemoryLimit
      }
      trustedFactories {
        factoryAddress
        holderDid
        issuerDid
        remark
        passport {
          role
          ttl
          ttlPolicy
        }
      }
      trustedPassports {
        issuerDid
        remark
        mappings {
          from {
            passport
          }
          to {
            role
            ttl
            ttlPolicy
          }
        }
      }
    }
  }
}
```

### upgradeNodeVersion

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
mutation {
  upgradeNodeVersion {
    code
    sessionId
  }
}
```

### restartServer

#### Arguments

No arguments

#### Result Format

```graphql
mutation {
  restartServer {
    code
    sessionId
  }
}
```

### resetNode

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
mutation {
  resetNode {
    code
  }
}
```

### rotateSessionKey

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
mutation {
  rotateSessionKey {
    code
  }
}
```

### updateGateway

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
mutation {
  updateGateway {
    code
    gateway {
      cacheEnabled
      blockPolicy {
        blacklist
        enabled
        autoBlocking {
          blockDuration
          enabled
          statusCodes
          windowQuota
          windowSize
        }
      }
      proxyPolicy {
        enabled
        realIpHeader
        trustedProxies
        trustRecursive
      }
      requestLimit {
        burstDelay
        burstFactor
        enabled
        global
        methods
        rate
      }
      wafPolicy {
        enabled
        inboundAnomalyScoreThreshold
        logLevel
        mode
        outboundAnomalyScoreThreshold
      }
    }
  }
}
```

### clearCache

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
mutation {
  clearCache {
    code
    removed
  }
}
```

### createMemberInvitation

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
mutation {
  createMemberInvitation {
    code
    inviteInfo {
      expireDate
      interfaceName
      inviteId
      inviteUserDids
      orgId
      remark
      role
      teamDid
      display {
        content
        type
      }
      inviter {
        approved
        avatar
        createdAt
        createdByAppPid
        did
        didSpace
        email
        emailVerified
        extra
        firstLoginAt
        fullName
        generation
        inviter
        isFollowing
        lastLoginAt
        lastLoginIp
        locale
        name
        phone
        phoneVerified
        pk
        remark
        role
        sourceAppPid
        sourceProvider
        updatedAt
        url
        userSessionsCount
        address {
          city
          country
          line1
          line2
          postalCode
          province
        }
        connectedAccounts {
          did
          extra
          id
          lastLoginAt
          pk
          provider
          userInfo {
            email
            emailVerified
            extraData
            name
            picture
            sub
          }
        }
        metadata {
          bio
          cover
          location
          timezone
          links {
            favicon
            url
          }
          phone {
            country
            phoneNumber
          }
          status {
            dateRange
            duration
            icon
            label
          }
        }
        passports {
          expirationDate
          id
          issuanceDate
          lastLoginAt
          name
          parentDid
          role
          scope
          source
          status
          title
          type
          userDid
          display {
            content
            type
          }
          issuer {
            id
            name
            pk
          }
          user {
            approved
            avatar
            createdAt
            did
            email
            fullName
            locale
            pk
            role
            updatedAt
          }
        }
        tags {
          color
          componentDid
          createdAt
          createdBy
          description
          id
          parentId
          slug
          title
          type
          updatedAt
          updatedBy
        }
        userSessions {
          appPid
          createdAt
          createdByAppPid
          extra
          id
          lastLoginIp
          passportId
          status
          ua
          updatedAt
          userDid
          visitorId
        }
      }
    }
  }
}
```

### createTransferInvitation

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
mutation {
  createTransferInvitation {
    code
    inviteInfo {
      expireDate
      interfaceName
      inviteId
      inviteUserDids
      orgId
      remark
      role
      teamDid
      display {
        content
        type
      }
      inviter {
        approved
        avatar
        createdAt
        createdByAppPid
        did
        didSpace
        email
        emailVerified
        extra
        firstLoginAt
        fullName
        generation
        inviter
        isFollowing
        lastLoginAt
        lastLoginIp
        locale
        name
        phone
        phoneVerified
        pk
        remark
        role
        sourceAppPid
        sourceProvider
        updatedAt
        url
        userSessionsCount
        address {
          city
          country
          line1
          line2
          postalCode
          province
        }
        connectedAccounts {
          did
          extra
          id
          lastLoginAt
          pk
          provider
          userInfo {
            email
            emailVerified
            extraData
            name
            picture
            sub
          }
        }
        metadata {
          bio
          cover
          location
          timezone
          links {
            favicon
            url
          }
          phone {
            country
            phoneNumber
          }
          status {
            dateRange
            duration
            icon
            label
          }
        }
        passports {
          expirationDate
          id
          issuanceDate
          lastLoginAt
          name
          parentDid
          role
          scope
          source
          status
          title
          type
          userDid
          display {
            content
            type
          }
          issuer {
            id
            name
            pk
          }
          user {
            approved
            avatar
            createdAt
            did
            email
            fullName
            locale
            pk
            role
            updatedAt
          }
        }
        tags {
          color
          componentDid
          createdAt
          createdBy
          description
          id
          parentId
          slug
          title
          type
          updatedAt
          updatedBy
        }
        userSessions {
          appPid
          createdAt
          createdByAppPid
          extra
          id
          lastLoginIp
          passportId
          status
          ua
          updatedAt
          userDid
          visitorId
        }
      }
    }
  }
}
```

### deleteInvitation

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
mutation {
  deleteInvitation {
    code
  }
}
```

### createPassportIssuance

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
mutation {
  createPassportIssuance {
    code
    info {
      expireDate
      id
      name
      ownerDid
      teamDid
      title
      display {
        content
        type
      }
    }
  }
}
```

### deletePassportIssuance

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
mutation {
  deletePassportIssuance {
    code
  }
}
```

### configTrustedPassports

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
mutation {
  configTrustedPassports {
    code
  }
}
```

### configTrustedFactories

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
mutation {
  configTrustedFactories {
    code
  }
}
```

### configPassportIssuance

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
mutation {
  configPassportIssuance {
    code
  }
}
```

### removeUser

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
mutation {
  removeUser {
    code
    user {
      approved
      avatar
      createdAt
      createdByAppPid
      did
      didSpace
      email
      emailVerified
      extra
      firstLoginAt
      fullName
      generation
      inviter
      isFollowing
      lastLoginAt
      lastLoginIp
      locale
      name
      phone
      phoneVerified
      pk
      remark
      role
      sourceAppPid
      sourceProvider
      updatedAt
      url
      userSessionsCount
      address {
        city
        country
        line1
        line2
        postalCode
        province
      }
      connectedAccounts {
        did
        extra
        id
        lastLoginAt
        pk
        provider
        userInfo {
          email
          emailVerified
          extraData
          name
          picture
          sub
        }
      }
      metadata {
        bio
        cover
        location
        timezone
        links {
          favicon
          url
        }
        phone {
          country
          phoneNumber
        }
        status {
          dateRange
          duration
          icon
          label
        }
      }
      passports {
        expirationDate
        id
        issuanceDate
        lastLoginAt
        name
        parentDid
        role
        scope
        source
        status
        title
        type
        userDid
        display {
          content
          type
        }
        issuer {
          id
          name
          pk
        }
        user {
          approved
          avatar
          createdAt
          did
          email
          fullName
          locale
          pk
          role
          updatedAt
        }
      }
      tags {
        color
        componentDid
        createdAt
        createdBy
        description
        id
        parentId
        slug
        title
        type
        updatedAt
        updatedBy
      }
      userSessions {
        appPid
        createdAt
        createdByAppPid
        extra
        id
        lastLoginIp
        passportId
        status
        ua
        updatedAt
        userDid
        visitorId
      }
    }
  }
}
```

### updateUserTags

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
mutation {
  updateUserTags {
    code
    user {
      approved
      avatar
      createdAt
      createdByAppPid
      did
      didSpace
      email
      emailVerified
      extra
      firstLoginAt
      fullName
      generation
      inviter
      isFollowing
      lastLoginAt
      lastLoginIp
      locale
      name
      phone
      phoneVerified
      pk
      remark
      role
      sourceAppPid
      sourceProvider
      updatedAt
      url
      userSessionsCount
      address {
        city
        country
        line1
        line2
        postalCode
        province
      }
      connectedAccounts {
        did
        extra
        id
        lastLoginAt
        pk
        provider
        userInfo {
          email
          emailVerified
          extraData
          name
          picture
          sub
        }
      }
      metadata {
        bio
        cover
        location
        timezone
        links {
          favicon
          url
        }
        phone {
          country
          phoneNumber
        }
        status {
          dateRange
          duration
          icon
          label
        }
      }
      passports {
        expirationDate
        id
        issuanceDate
        lastLoginAt
        name
        parentDid
        role
        scope
        source
        status
        title
        type
        userDid
        display {
          content
          type
        }
        issuer {
          id
          name
          pk
        }
        user {
          approved
          avatar
          createdAt
          did
          email
          fullName
          locale
          pk
          role
          updatedAt
        }
      }
      tags {
        color
        componentDid
        createdAt
        createdBy
        description
        id
        parentId
        slug
        title
        type
        updatedAt
        updatedBy
      }
      userSessions {
        appPid
        createdAt
        createdByAppPid
        extra
        id
        lastLoginIp
        passportId
        status
        ua
        updatedAt
        userDid
        visitorId
      }
    }
  }
}
```

### updateUserExtra

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
mutation {
  updateUserExtra {
    code
    user {
      approved
      avatar
      createdAt
      createdByAppPid
      did
      didSpace
      email
      emailVerified
      extra
      firstLoginAt
      fullName
      generation
      inviter
      isFollowing
      lastLoginAt
      lastLoginIp
      locale
      name
      phone
      phoneVerified
      pk
      remark
      role
      sourceAppPid
      sourceProvider
      updatedAt
      url
      userSessionsCount
      address {
        city
        country
        line1
        line2
        postalCode
        province
      }
      connectedAccounts {
        did
        extra
        id
        lastLoginAt
        pk
        provider
        userInfo {
          email
          emailVerified
          extraData
          name
          picture
          sub
        }
      }
      metadata {
        bio
        cover
        location
        timezone
        links {
          favicon
          url
        }
        phone {
          country
          phoneNumber
        }
        status {
          dateRange
          duration
          icon
          label
        }
      }
      passports {
        expirationDate
        id
        issuanceDate
        lastLoginAt
        name
        parentDid
        role
        scope
        source
        status
        title
        type
        userDid
        display {
          content
          type
        }
        issuer {
          id
          name
          pk
        }
        user {
          approved
          avatar
          createdAt
          did
          email
          fullName
          locale
          pk
          role
          updatedAt
        }
      }
      tags {
        color
        componentDid
        createdAt
        createdBy
        description
        id
        parentId
        slug
        title
        type
        updatedAt
        updatedBy
      }
      userSessions {
        appPid
        createdAt
        createdByAppPid
        extra
        id
        lastLoginIp
        passportId
        status
        ua
        updatedAt
        userDid
        visitorId
      }
    }
  }
}
```

### updateUserApproval

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
mutation {
  updateUserApproval {
    code
    user {
      approved
      avatar
      createdAt
      createdByAppPid
      did
      didSpace
      email
      emailVerified
      extra
      firstLoginAt
      fullName
      generation
      inviter
      isFollowing
      lastLoginAt
      lastLoginIp
      locale
      name
      phone
      phoneVerified
      pk
      remark
      role
      sourceAppPid
      sourceProvider
      updatedAt
      url
      userSessionsCount
      address {
        city
        country
        line1
        line2
        postalCode
        province
      }
      connectedAccounts {
        did
        extra
        id
        lastLoginAt
        pk
        provider
        userInfo {
          email
          emailVerified
          extraData
          name
          picture
          sub
        }
      }
      metadata {
        bio
        cover
        location
        timezone
        links {
          favicon
          url
        }
        phone {
          country
          phoneNumber
        }
        status {
          dateRange
          duration
          icon
          label
        }
      }
      passports {
        expirationDate
        id
        issuanceDate
        lastLoginAt
        name
        parentDid
        role
        scope
        source
        status
        title
        type
        userDid
        display {
          content
          type
        }
        issuer {
          id
          name
          pk
        }
        user {
          approved
          avatar
          createdAt
          did
          email
          fullName
          locale
          pk
          role
          updatedAt
        }
      }
      tags {
        color
        componentDid
        createdAt
        createdBy
        description
        id
        parentId
        slug
        title
        type
        updatedAt
        updatedBy
      }
      userSessions {
        appPid
        createdAt
        createdByAppPid
        extra
        id
        lastLoginIp
        passportId
        status
        ua
        updatedAt
        userDid
        visitorId
      }
    }
  }
}
```

### issuePassportToUser

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
mutation {
  issuePassportToUser {
    code
    user {
      approved
      avatar
      createdAt
      createdByAppPid
      did
      didSpace
      email
      emailVerified
      extra
      firstLoginAt
      fullName
      generation
      inviter
      isFollowing
      lastLoginAt
      lastLoginIp
      locale
      name
      phone
      phoneVerified
      pk
      remark
      role
      sourceAppPid
      sourceProvider
      updatedAt
      url
      userSessionsCount
      address {
        city
        country
        line1
        line2
        postalCode
        province
      }
      connectedAccounts {
        did
        extra
        id
        lastLoginAt
        pk
        provider
        userInfo {
          email
          emailVerified
          extraData
          name
          picture
          sub
        }
      }
      metadata {
        bio
        cover
        location
        timezone
        links {
          favicon
          url
        }
        phone {
          country
          phoneNumber
        }
        status {
          dateRange
          duration
          icon
          label
        }
      }
      passports {
        expirationDate
        id
        issuanceDate
        lastLoginAt
        name
        parentDid
        role
        scope
        source
        status
        title
        type
        userDid
        display {
          content
          type
        }
        issuer {
          id
          name
          pk
        }
        user {
          approved
          avatar
          createdAt
          did
          email
          fullName
          locale
          pk
          role
          updatedAt
        }
      }
      tags {
        color
        componentDid
        createdAt
        createdBy
        description
        id
        parentId
        slug
        title
        type
        updatedAt
        updatedBy
      }
      userSessions {
        appPid
        createdAt
        createdByAppPid
        extra
        id
        lastLoginIp
        passportId
        status
        ua
        updatedAt
        userDid
        visitorId
      }
    }
  }
}
```

### revokeUserPassport

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
mutation {
  revokeUserPassport {
    code
    user {
      approved
      avatar
      createdAt
      createdByAppPid
      did
      didSpace
      email
      emailVerified
      extra
      firstLoginAt
      fullName
      generation
      inviter
      isFollowing
      lastLoginAt
      lastLoginIp
      locale
      name
      phone
      phoneVerified
      pk
      remark
      role
      sourceAppPid
      sourceProvider
      updatedAt
      url
      userSessionsCount
      address {
        city
        country
        line1
        line2
        postalCode
        province
      }
      connectedAccounts {
        did
        extra
        id
        lastLoginAt
        pk
        provider
        userInfo {
          email
          emailVerified
          extraData
          name
          picture
          sub
        }
      }
      metadata {
        bio
        cover
        location
        timezone
        links {
          favicon
          url
        }
        phone {
          country
          phoneNumber
        }
        status {
          dateRange
          duration
          icon
          label
        }
      }
      passports {
        expirationDate
        id
        issuanceDate
        lastLoginAt
        name
        parentDid
        role
        scope
        source
        status
        title
        type
        userDid
        display {
          content
          type
        }
        issuer {
          id
          name
          pk
        }
        user {
          approved
          avatar
          createdAt
          did
          email
          fullName
          locale
          pk
          role
          updatedAt
        }
      }
      tags {
        color
        componentDid
        createdAt
        createdBy
        description
        id
        parentId
        slug
        title
        type
        updatedAt
        updatedBy
      }
      userSessions {
        appPid
        createdAt
        createdByAppPid
        extra
        id
        lastLoginIp
        passportId
        status
        ua
        updatedAt
        userDid
        visitorId
      }
    }
  }
}
```

### enableUserPassport

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
mutation {
  enableUserPassport {
    code
    user {
      approved
      avatar
      createdAt
      createdByAppPid
      did
      didSpace
      email
      emailVerified
      extra
      firstLoginAt
      fullName
      generation
      inviter
      isFollowing
      lastLoginAt
      lastLoginIp
      locale
      name
      phone
      phoneVerified
      pk
      remark
      role
      sourceAppPid
      sourceProvider
      updatedAt
      url
      userSessionsCount
      address {
        city
        country
        line1
        line2
        postalCode
        province
      }
      connectedAccounts {
        did
        extra
        id
        lastLoginAt
        pk
        provider
        userInfo {
          email
          emailVerified
          extraData
          name
          picture
          sub
        }
      }
      metadata {
        bio
        cover
        location
        timezone
        links {
          favicon
          url
        }
        phone {
          country
          phoneNumber
        }
        status {
          dateRange
          duration
          icon
          label
        }
      }
      passports {
        expirationDate
        id
        issuanceDate
        lastLoginAt
        name
        parentDid
        role
        scope
        source
        status
        title
        type
        userDid
        display {
          content
          type
        }
        issuer {
          id
          name
          pk
        }
        user {
          approved
          avatar
          createdAt
          did
          email
          fullName
          locale
          pk
          role
          updatedAt
        }
      }
      tags {
        color
        componentDid
        createdAt
        createdBy
        description
        id
        parentId
        slug
        title
        type
        updatedAt
        updatedBy
      }
      userSessions {
        appPid
        createdAt
        createdByAppPid
        extra
        id
        lastLoginIp
        passportId
        status
        ua
        updatedAt
        userDid
        visitorId
      }
    }
  }
}
```

### removeUserPassport

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
mutation {
  removeUserPassport {
    code
  }
}
```

### switchProfile

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
mutation {
  switchProfile {
    code
    user {
      approved
      avatar
      createdAt
      createdByAppPid
      did
      didSpace
      email
      emailVerified
      extra
      firstLoginAt
      fullName
      generation
      inviter
      isFollowing
      lastLoginAt
      lastLoginIp
      locale
      name
      phone
      phoneVerified
      pk
      remark
      role
      sourceAppPid
      sourceProvider
      updatedAt
      url
      userSessionsCount
      address {
        city
        country
        line1
        line2
        postalCode
        province
      }
      connectedAccounts {
        did
        extra
        id
        lastLoginAt
        pk
        provider
        userInfo {
          email
          emailVerified
          extraData
          name
          picture
          sub
        }
      }
      metadata {
        bio
        cover
        location
        timezone
        links {
          favicon
          url
        }
        phone {
          country
          phoneNumber
        }
        status {
          dateRange
          duration
          icon
          label
        }
      }
      passports {
        expirationDate
        id
        issuanceDate
        lastLoginAt
        name
        parentDid
        role
        scope
        source
        status
        title
        type
        userDid
        display {
          content
          type
        }
        issuer {
          id
          name
          pk
        }
        user {
          approved
          avatar
          createdAt
          did
          email
          fullName
          locale
          pk
          role
          updatedAt
        }
      }
      tags {
        color
        componentDid
        createdAt
        createdBy
        description
        id
        parentId
        slug
        title
        type
        updatedAt
        updatedBy
      }
      userSessions {
        appPid
        createdAt
        createdByAppPid
        extra
        id
        lastLoginIp
        passportId
        status
        ua
        updatedAt
        userDid
        visitorId
      }
    }
  }
}
```

### updateUserAddress

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
mutation {
  updateUserAddress {
    code
    user {
      approved
      avatar
      createdAt
      createdByAppPid
      did
      didSpace
      email
      emailVerified
      extra
      firstLoginAt
      fullName
      generation
      inviter
      isFollowing
      lastLoginAt
      lastLoginIp
      locale
      name
      phone
      phoneVerified
      pk
      remark
      role
      sourceAppPid
      sourceProvider
      updatedAt
      url
      userSessionsCount
      address {
        city
        country
        line1
        line2
        postalCode
        province
      }
      connectedAccounts {
        did
        extra
        id
        lastLoginAt
        pk
        provider
        userInfo {
          email
          emailVerified
          extraData
          name
          picture
          sub
        }
      }
      metadata {
        bio
        cover
        location
        timezone
        links {
          favicon
          url
        }
        phone {
          country
          phoneNumber
        }
        status {
          dateRange
          duration
          icon
          label
        }
      }
      passports {
        expirationDate
        id
        issuanceDate
        lastLoginAt
        name
        parentDid
        role
        scope
        source
        status
        title
        type
        userDid
        display {
          content
          type
        }
        issuer {
          id
          name
          pk
        }
        user {
          approved
          avatar
          createdAt
          did
          email
          fullName
          locale
          pk
          role
          updatedAt
        }
      }
      tags {
        color
        componentDid
        createdAt
        createdBy
        description
        id
        parentId
        slug
        title
        type
        updatedAt
        updatedBy
      }
      userSessions {
        appPid
        createdAt
        createdByAppPid
        extra
        id
        lastLoginIp
        passportId
        status
        ua
        updatedAt
        userDid
        visitorId
      }
    }
  }
}
```

### updateUserInfo

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
mutation {
  updateUserInfo {
    code
    user {
      approved
      avatar
      createdAt
      createdByAppPid
      did
      didSpace
      email
      emailVerified
      extra
      firstLoginAt
      fullName
      generation
      inviter
      isFollowing
      lastLoginAt
      lastLoginIp
      locale
      name
      phone
      phoneVerified
      pk
      remark
      role
      sourceAppPid
      sourceProvider
      updatedAt
      url
      userSessionsCount
      address {
        city
        country
        line1
        line2
        postalCode
        province
      }
      connectedAccounts {
        did
        extra
        id
        lastLoginAt
        pk
        provider
        userInfo {
          email
          emailVerified
          extraData
          name
          picture
          sub
        }
      }
      metadata {
        bio
        cover
        location
        timezone
        links {
          favicon
          url
        }
        phone {
          country
          phoneNumber
        }
        status {
          dateRange
          duration
          icon
          label
        }
      }
      passports {
        expirationDate
        id
        issuanceDate
        lastLoginAt
        name
        parentDid
        role
        scope
        source
        status
        title
        type
        userDid
        display {
          content
          type
        }
        issuer {
          id
          name
          pk
        }
        user {
          approved
          avatar
          createdAt
          did
          email
          fullName
          locale
          pk
          role
          updatedAt
        }
      }
      tags {
        color
        componentDid
        createdAt
        createdBy
        description
        id
        parentId
        slug
        title
        type
        updatedAt
        updatedBy
      }
      userSessions {
        appPid
        createdAt
        createdByAppPid
        extra
        id
        lastLoginIp
        passportId
        status
        ua
        updatedAt
        userDid
        visitorId
      }
    }
  }
}
```

### createRole

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
mutation {
  createRole {
    code
    role {
      description
      extra
      grants
      isProtected
      name
      orgId
      title
    }
  }
}
```

### updateRole

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
mutation {
  updateRole {
    code
    role {
      description
      extra
      grants
      isProtected
      name
      orgId
      title
    }
  }
}
```

### deleteRole

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
mutation {
  deleteRole {
    code
  }
}
```

### createPermission

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
mutation {
  createPermission {
    code
    permission {
      description
      isProtected
      name
    }
  }
}
```

### updatePermission

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
mutation {
  updatePermission {
    code
    permission {
      description
      isProtected
      name
    }
  }
}
```

### deletePermission

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
mutation {
  deletePermission {
    code
  }
}
```

### grantPermissionForRole

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
mutation {
  grantPermissionForRole {
    code
  }
}
```

### revokePermissionFromRole

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
mutation {
  revokePermissionFromRole {
    code
  }
}
```

### updatePermissionsForRole

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
mutation {
  updatePermissionsForRole {
    code
    role {
      description
      extra
      grants
      isProtected
      name
      orgId
      title
    }
  }
}
```

### hasPermission

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
mutation {
  hasPermission {
    code
    result
  }
}
```

### addBlockletStore

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
mutation {
  addBlockletStore {
    code
  }
}
```

### deleteBlockletStore

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
mutation {
  deleteBlockletStore {
    code
  }
}
```

### getTag

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
mutation {
  getTag {
    code
    tag {
      color
      componentDid
      createdAt
      createdBy
      description
      id
      parentId
      slug
      title
      type
      updatedAt
      updatedBy
    }
  }
}
```

### createTag

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
mutation {
  createTag {
    code
    tag {
      color
      componentDid
      createdAt
      createdBy
      description
      id
      parentId
      slug
      title
      type
      updatedAt
      updatedBy
    }
  }
}
```

### updateTag

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
mutation {
  updateTag {
    code
    tag {
      color
      componentDid
      createdAt
      createdBy
      description
      id
      parentId
      slug
      title
      type
      updatedAt
      updatedBy
    }
  }
}
```

### deleteTag

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
mutation {
  deleteTag {
    code
    tag {
      color
      componentDid
      createdAt
      createdBy
      description
      id
      parentId
      slug
      title
      type
      updatedAt
      updatedBy
    }
  }
}
```

### createTagging

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
mutation {
  createTagging {
    code
    tagging {
      taggableIds
      taggableType
      tagId
    }
  }
}
```

### deleteTagging

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
mutation {
  deleteTagging {
    code
    tagging {
      taggableIds
      taggableType
      tagId
    }
  }
}
```

### readNotifications

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
mutation {
  readNotifications {
    code
    numAffected
  }
}
```

### unreadNotifications

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
mutation {
  unreadNotifications {
    code
    numAffected
  }
}
```

### addRoutingSite

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
mutation {
  addRoutingSite {
    code
    site {
      corsAllowedOrigins
      domain
      domainAliases
      id
      isProtected
      rules {
        id
        isProtected
        from {
          pathPrefix
          header {
            key
            type
            value
          }
        }
        to {
          componentId
          did
          interfaceName
          pageGroup
          port
          redirectCode
          type
          url
          response {
            body
            contentType
            status
          }
        }
      }
    }
  }
}
```

### addDomainAlias

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
mutation {
  addDomainAlias {
    code
    site {
      corsAllowedOrigins
      domain
      domainAliases
      id
      isProtected
      rules {
        id
        isProtected
        from {
          pathPrefix
          header {
            key
            type
            value
          }
        }
        to {
          componentId
          did
          interfaceName
          pageGroup
          port
          redirectCode
          type
          url
          response {
            body
            contentType
            status
          }
        }
      }
    }
  }
}
```

### deleteDomainAlias

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
mutation {
  deleteDomainAlias {
    code
    site {
      corsAllowedOrigins
      domain
      domainAliases
      id
      isProtected
      rules {
        id
        isProtected
        from {
          pathPrefix
          header {
            key
            type
            value
          }
        }
        to {
          componentId
          did
          interfaceName
          pageGroup
          port
          redirectCode
          type
          url
          response {
            body
            contentType
            status
          }
        }
      }
    }
  }
}
```

### deleteRoutingSite

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
mutation {
  deleteRoutingSite {
    code
  }
}
```

### updateRoutingSite

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
mutation {
  updateRoutingSite {
    code
    site {
      corsAllowedOrigins
      domain
      domainAliases
      id
      isProtected
      rules {
        id
        isProtected
        from {
          pathPrefix
          header {
            key
            type
            value
          }
        }
        to {
          componentId
          did
          interfaceName
          pageGroup
          port
          redirectCode
          type
          url
          response {
            body
            contentType
            status
          }
        }
      }
    }
  }
}
```

### addRoutingRule

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
mutation {
  addRoutingRule {
    code
    site {
      corsAllowedOrigins
      domain
      domainAliases
      id
      isProtected
      rules {
        id
        isProtected
        from {
          pathPrefix
          header {
            key
            type
            value
          }
        }
        to {
          componentId
          did
          interfaceName
          pageGroup
          port
          redirectCode
          type
          url
          response {
            body
            contentType
            status
          }
        }
      }
    }
  }
}
```

### updateRoutingRule

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
mutation {
  updateRoutingRule {
    code
    site {
      corsAllowedOrigins
      domain
      domainAliases
      id
      isProtected
      rules {
        id
        isProtected
        from {
          pathPrefix
          header {
            key
            type
            value
          }
        }
        to {
          componentId
          did
          interfaceName
          pageGroup
          port
          redirectCode
          type
          url
          response {
            body
            contentType
            status
          }
        }
      }
    }
  }
}
```

### deleteRoutingRule

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
mutation {
  deleteRoutingRule {
    code
    site {
      corsAllowedOrigins
      domain
      domainAliases
      id
      isProtected
      rules {
        id
        isProtected
        from {
          pathPrefix
          header {
            key
            type
            value
          }
        }
        to {
          componentId
          did
          interfaceName
          pageGroup
          port
          redirectCode
          type
          url
          response {
            body
            contentType
            status
          }
        }
      }
    }
  }
}
```

### updateCertificate

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
mutation {
  updateCertificate {
    code
  }
}
```

### addCertificate

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
mutation {
  addCertificate {
    code
  }
}
```

### deleteCertificate

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
mutation {
  deleteCertificate {
    code
  }
}
```

### issueLetsEncryptCert

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
mutation {
  issueLetsEncryptCert {
    code
  }
}
```

### createAccessKey

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
mutation {
  createAccessKey {
    code
    data {
      accessKeyId
      accessKeyPublic
      accessKeySecret
      authType
      componentDid
      createdAt
      createdVia
      expireAt
      lastUsedAt
      passport
      remark
      resourceId
      resourceType
    }
  }
}
```

### updateAccessKey

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
mutation {
  updateAccessKey {
    code
    data {
      accessKeyId
      accessKeyPublic
      authType
      componentDid
      createdAt
      createdBy
      createdVia
      expireAt
      lastUsedAt
      passport
      remark
      resourceId
      resourceType
      updatedAt
      updatedBy
    }
  }
}
```

### deleteAccessKey

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
mutation {
  deleteAccessKey {
    code
  }
}
```

### verifyAccessKey

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
mutation {
  verifyAccessKey {
    code
    data {
      accessKeyId
      accessKeyPublic
      authType
      componentDid
      createdAt
      createdBy
      createdVia
      expireAt
      lastUsedAt
      passport
      remark
      resourceId
      resourceType
      updatedAt
      updatedBy
    }
  }
}
```

### createWebHook

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
mutation {
  createWebHook {
    code
    webhook {
      description
      title
      type
      params {
        consecutiveFailures
        defaultValue
        description
        enabled
        name
        required
        type
        value
      }
    }
  }
}
```

### deleteWebHook

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
mutation {
  deleteWebHook {
    code
  }
}
```

### updateWebHookState

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
mutation {
  updateWebHookState {
    data {
      apiVersion
      createdAt
      description
      id
      metadata
      secret
      status
      updatedAt
      url
      enabledEvents {
        source
        type
      }
    }
  }
}
```

### createProject

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
mutation {
  createProject {
    code
    project {
      autoUpload
      blockletDescription
      blockletDid
      blockletIntroduction
      blockletLogo
      blockletScreenshots
      blockletTitle
      blockletVersion
      componentDid
      createdAt
      createdBy
      id
      lastReleaseFiles
      lastReleaseId
      possibleSameStore
      tenantScope
      type
      updatedAt
      connectedEndpoints {
        accessKeyId
        accessKeySecret
        createdBy
        developerDid
        developerEmail
        developerName
        endpointId
        expireId
      }
      connectedStores {
        accessToken
        developerDid
        developerEmail
        developerName
        scope
        storeId
        storeName
        storeUrl
      }
    }
  }
}
```

### updateProject

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
mutation {
  updateProject {
    code
    project {
      autoUpload
      blockletDescription
      blockletDid
      blockletIntroduction
      blockletLogo
      blockletScreenshots
      blockletTitle
      blockletVersion
      componentDid
      createdAt
      createdBy
      id
      lastReleaseFiles
      lastReleaseId
      possibleSameStore
      tenantScope
      type
      updatedAt
      connectedEndpoints {
        accessKeyId
        accessKeySecret
        createdBy
        developerDid
        developerEmail
        developerName
        endpointId
        expireId
      }
      connectedStores {
        accessToken
        developerDid
        developerEmail
        developerName
        scope
        storeId
        storeName
        storeUrl
      }
    }
  }
}
```

### deleteProject

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
mutation {
  deleteProject {
    code
  }
}
```

### createRelease

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
mutation {
  createRelease {
    code
    release {
      blockletCommunity
      blockletDescription
      blockletDid
      blockletHomepage
      blockletIntroduction
      blockletLogo
      blockletRepository
      blockletResourceType
      blockletScreenshots
      blockletSingleton
      blockletSupport
      blockletTitle
      blockletVersion
      blockletVideos
      contentType
      createdAt
      files
      id
      note
      projectId
      publishedStoreIds
      status
      updatedAt
      uploadedResource
      blockletComponents {
        did
        required
      }
      blockletDocker {
        dockerCommand
        dockerImage
        dockerArgs {
          key
          name
          path
          prefix
          protocol
          proxyBehavior
          type
          value
        }
        dockerEnvs {
          custom
          description
          key
          required
          secure
          shared
          value
        }
      }
    }
  }
}
```

### deleteRelease

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
mutation {
  deleteRelease {
    code
  }
}
```

### updateSelectedResources

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
mutation {
  updateSelectedResources {
    code
  }
}
```

### connectToStore

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
mutation {
  connectToStore {
    code
    url
  }
}
```

### disconnectFromStore

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
mutation {
  disconnectFromStore {
    code
  }
}
```

### publishToStore

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
mutation {
  publishToStore {
    code
    url
  }
}
```

### connectByStudio

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
mutation {
  connectByStudio {
    code
    url
  }
}
```

### addBlockletSecurityRule

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
mutation {
  addBlockletSecurityRule {
    code
    securityRule {
      accessPolicyId
      componentDid
      enabled
      id
      pathPattern
      priority
      remark
      responseHeaderPolicyId
      accessPolicy {
        description
        id
        isProtected
        name
        reverse
        roles
      }
      responseHeaderPolicy {
        cors
        customHeader
        description
        id
        isProtected
        name
        removeHeader
        securityHeader
      }
    }
  }
}
```

### updateBlockletSecurityRule

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
mutation {
  updateBlockletSecurityRule {
    code
    securityRule {
      accessPolicyId
      componentDid
      enabled
      id
      pathPattern
      priority
      remark
      responseHeaderPolicyId
      accessPolicy {
        description
        id
        isProtected
        name
        reverse
        roles
      }
      responseHeaderPolicy {
        cors
        customHeader
        description
        id
        isProtected
        name
        removeHeader
        securityHeader
      }
    }
  }
}
```

### deleteBlockletSecurityRule

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
mutation {
  deleteBlockletSecurityRule {
    code
  }
}
```

### addBlockletResponseHeaderPolicy

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
mutation {
  addBlockletResponseHeaderPolicy {
    code
    responseHeaderPolicy {
      cors
      customHeader
      description
      id
      isProtected
      name
      removeHeader
      securityHeader
    }
  }
}
```

### updateBlockletResponseHeaderPolicy

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
mutation {
  updateBlockletResponseHeaderPolicy {
    code
    responseHeaderPolicy {
      cors
      customHeader
      description
      id
      isProtected
      name
      removeHeader
      securityHeader
    }
  }
}
```

### deleteBlockletResponseHeaderPolicy

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
mutation {
  deleteBlockletResponseHeaderPolicy {
    code
  }
}
```

### addBlockletAccessPolicy

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
mutation {
  addBlockletAccessPolicy {
    code
    accessPolicy {
      description
      id
      isProtected
      name
      reverse
      roles
    }
  }
}
```

### updateBlockletAccessPolicy

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
mutation {
  updateBlockletAccessPolicy {
    code
    accessPolicy {
      description
      id
      isProtected
      name
      reverse
      roles
    }
  }
}
```

### deleteBlockletAccessPolicy

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
mutation {
  deleteBlockletAccessPolicy {
    code
  }
}
```

### restartAllContainers

#### Arguments

No arguments

#### Result Format

```graphql
mutation {
  restartAllContainers {
    code
    sessionId
  }
}
```

### createWebhookEndpoint

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
mutation {
  createWebhookEndpoint {
    data {
      apiVersion
      createdAt
      description
      id
      metadata
      secret
      status
      updatedAt
      url
      enabledEvents {
        source
        type
      }
    }
  }
}
```

### updateWebhookEndpoint

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
mutation {
  updateWebhookEndpoint {
    data {
      apiVersion
      createdAt
      description
      id
      metadata
      secret
      status
      updatedAt
      url
      enabledEvents {
        source
        type
      }
    }
  }
}
```

### deleteWebhookEndpoint

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
mutation {
  deleteWebhookEndpoint {
    data {
      apiVersion
      createdAt
      description
      id
      metadata
      secret
      status
      updatedAt
      url
      enabledEvents {
        source
        type
      }
    }
  }
}
```

### retryWebhookAttempt

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
mutation {
  retryWebhookAttempt {
    data {
      createdAt
      eventId
      id
      responseBody
      responseStatus
      retryCount
      status
      triggeredBy
      triggeredFrom
      updatedAt
      webhookId
    }
  }
}
```

### regenerateWebhookEndpointSecret

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
mutation {
  regenerateWebhookEndpointSecret {
    secret
  }
}
```

### addUploadEndpoint

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
mutation {
  addUploadEndpoint {
    code
  }
}
```

### deleteUploadEndpoint

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
mutation {
  deleteUploadEndpoint {
    code
  }
}
```

### connectToEndpoint

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
mutation {
  connectToEndpoint {
    code
    url
  }
}
```

### disconnectFromEndpoint

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
mutation {
  disconnectFromEndpoint {
    code
  }
}
```

### publishToEndpoint

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
mutation {
  publishToEndpoint {
    code
    url
  }
}
```

### connectToAigne

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
mutation {
  connectToAigne {
    code
    url
  }
}
```

### disconnectToAigne

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
mutation {
  disconnectToAigne {
    code
  }
}
```

### verifyAigneConnection

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
mutation {
  verifyAigneConnection {
    code
  }
}
```

### createOrg

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
mutation {
  createOrg {
    code
    org {
      avatar
      createdAt
      description
      id
      membersCount
      metadata
      name
      ownerDid
      updatedAt
      members {
        createdAt
        id
        metadata
        orgId
        status
        updatedAt
        userDid
        user {
          approved
          avatar
          createdAt
          createdByAppPid
          did
          didSpace
          email
          emailVerified
          extra
          firstLoginAt
          fullName
          generation
          inviter
          isFollowing
          lastLoginAt
          lastLoginIp
          locale
          name
          phone
          phoneVerified
          pk
          remark
          role
          sourceAppPid
          sourceProvider
          updatedAt
          url
          userSessionsCount
          address {
            city
            country
            line1
            line2
            postalCode
            province
          }
          connectedAccounts {
            did
            extra
            id
            lastLoginAt
            pk
            provider
            userInfo {
              email
              emailVerified
              extraData
              name
              picture
              sub
            }
          }
          metadata {
            bio
            cover
            location
            timezone
            links {
              favicon
              url
            }
            phone {
              country
              phoneNumber
            }
            status {
              dateRange
              duration
              icon
              label
            }
          }
          passports {
            expirationDate
            id
            issuanceDate
            lastLoginAt
            name
            parentDid
            role
            scope
            source
            status
            title
            type
            userDid
            display {
              content
              type
            }
            issuer {
              id
              name
              pk
            }
            user {
              approved
              avatar
              createdAt
              did
              email
              fullName
              locale
              pk
              role
              updatedAt
            }
          }
          tags {
            color
            componentDid
            createdAt
            createdBy
            description
            id
            parentId
            slug
            title
            type
            updatedAt
            updatedBy
          }
          userSessions {
            appPid
            createdAt
            createdByAppPid
            extra
            id
            lastLoginIp
            passportId
            status
            ua
            updatedAt
            userDid
            visitorId
          }
        }
      }
      owner {
        approved
        avatar
        createdAt
        createdByAppPid
        did
        didSpace
        email
        emailVerified
        extra
        firstLoginAt
        fullName
        generation
        inviter
        isFollowing
        lastLoginAt
        lastLoginIp
        locale
        name
        phone
        phoneVerified
        pk
        remark
        role
        sourceAppPid
        sourceProvider
        updatedAt
        url
        userSessionsCount
        address {
          city
          country
          line1
          line2
          postalCode
          province
        }
        connectedAccounts {
          did
          extra
          id
          lastLoginAt
          pk
          provider
          userInfo {
            email
            emailVerified
            extraData
            name
            picture
            sub
          }
        }
        metadata {
          bio
          cover
          location
          timezone
          links {
            favicon
            url
          }
          phone {
            country
            phoneNumber
          }
          status {
            dateRange
            duration
            icon
            label
          }
        }
        passports {
          expirationDate
          id
          issuanceDate
          lastLoginAt
          name
          parentDid
          role
          scope
          source
          status
          title
          type
          userDid
          display {
            content
            type
          }
          issuer {
            id
            name
            pk
          }
          user {
            approved
            avatar
            createdAt
            did
            email
            fullName
            locale
            pk
            role
            updatedAt
          }
        }
        tags {
          color
          componentDid
          createdAt
          createdBy
          description
          id
          parentId
          slug
          title
          type
          updatedAt
          updatedBy
        }
        userSessions {
          appPid
          createdAt
          createdByAppPid
          extra
          id
          lastLoginIp
          passportId
          status
          ua
          updatedAt
          userDid
          visitorId
        }
      }
      passports {
        expirationDate
        id
        issuanceDate
        lastLoginAt
        name
        parentDid
        role
        scope
        source
        status
        title
        type
        userDid
        display {
          content
          type
        }
        issuer {
          id
          name
          pk
        }
        user {
          approved
          avatar
          createdAt
          did
          email
          fullName
          locale
          pk
          role
          updatedAt
        }
      }
    }
  }
}
```

### updateOrg

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
mutation {
  updateOrg {
    code
    org {
      avatar
      createdAt
      description
      id
      membersCount
      metadata
      name
      ownerDid
      updatedAt
      members {
        createdAt
        id
        metadata
        orgId
        status
        updatedAt
        userDid
        user {
          approved
          avatar
          createdAt
          createdByAppPid
          did
          didSpace
          email
          emailVerified
          extra
          firstLoginAt
          fullName
          generation
          inviter
          isFollowing
          lastLoginAt
          lastLoginIp
          locale
          name
          phone
          phoneVerified
          pk
          remark
          role
          sourceAppPid
          sourceProvider
          updatedAt
          url
          userSessionsCount
          address {
            city
            country
            line1
            line2
            postalCode
            province
          }
          connectedAccounts {
            did
            extra
            id
            lastLoginAt
            pk
            provider
            userInfo {
              email
              emailVerified
              extraData
              name
              picture
              sub
            }
          }
          metadata {
            bio
            cover
            location
            timezone
            links {
              favicon
              url
            }
            phone {
              country
              phoneNumber
            }
            status {
              dateRange
              duration
              icon
              label
            }
          }
          passports {
            expirationDate
            id
            issuanceDate
            lastLoginAt
            name
            parentDid
            role
            scope
            source
            status
            title
            type
            userDid
            display {
              content
              type
            }
            issuer {
              id
              name
              pk
            }
            user {
              approved
              avatar
              createdAt
              did
              email
              fullName
              locale
              pk
              role
              updatedAt
            }
          }
          tags {
            color
            componentDid
            createdAt
            createdBy
            description
            id
            parentId
            slug
            title
            type
            updatedAt
            updatedBy
          }
          userSessions {
            appPid
            createdAt
            createdByAppPid
            extra
            id
            lastLoginIp
            passportId
            status
            ua
            updatedAt
            userDid
            visitorId
          }
        }
      }
      owner {
        approved
        avatar
        createdAt
        createdByAppPid
        did
        didSpace
        email
        emailVerified
        extra
        firstLoginAt
        fullName
        generation
        inviter
        isFollowing
        lastLoginAt
        lastLoginIp
        locale
        name
        phone
        phoneVerified
        pk
        remark
        role
        sourceAppPid
        sourceProvider
        updatedAt
        url
        userSessionsCount
        address {
          city
          country
          line1
          line2
          postalCode
          province
        }
        connectedAccounts {
          did
          extra
          id
          lastLoginAt
          pk
          provider
          userInfo {
            email
            emailVerified
            extraData
            name
            picture
            sub
          }
        }
        metadata {
          bio
          cover
          location
          timezone
          links {
            favicon
            url
          }
          phone {
            country
            phoneNumber
          }
          status {
            dateRange
            duration
            icon
            label
          }
        }
        passports {
          expirationDate
          id
          issuanceDate
          lastLoginAt
          name
          parentDid
          role
          scope
          source
          status
          title
          type
          userDid
          display {
            content
            type
          }
          issuer {
            id
            name
            pk
          }
          user {
            approved
            avatar
            createdAt
            did
            email
            fullName
            locale
            pk
            role
            updatedAt
          }
        }
        tags {
          color
          componentDid
          createdAt
          createdBy
          description
          id
          parentId
          slug
          title
          type
          updatedAt
          updatedBy
        }
        userSessions {
          appPid
          createdAt
          createdByAppPid
          extra
          id
          lastLoginIp
          passportId
          status
          ua
          updatedAt
          userDid
          visitorId
        }
      }
      passports {
        expirationDate
        id
        issuanceDate
        lastLoginAt
        name
        parentDid
        role
        scope
        source
        status
        title
        type
        userDid
        display {
          content
          type
        }
        issuer {
          id
          name
          pk
        }
        user {
          approved
          avatar
          createdAt
          did
          email
          fullName
          locale
          pk
          role
          updatedAt
        }
      }
    }
  }
}
```

### deleteOrg

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
mutation {
  deleteOrg {
    code
  }
}
```

### addOrgMember

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
mutation {
  addOrgMember {
    code
    org {
      avatar
      createdAt
      description
      id
      membersCount
      metadata
      name
      ownerDid
      updatedAt
      members {
        createdAt
        id
        metadata
        orgId
        status
        updatedAt
        userDid
        user {
          approved
          avatar
          createdAt
          createdByAppPid
          did
          didSpace
          email
          emailVerified
          extra
          firstLoginAt
          fullName
          generation
          inviter
          isFollowing
          lastLoginAt
          lastLoginIp
          locale
          name
          phone
          phoneVerified
          pk
          remark
          role
          sourceAppPid
          sourceProvider
          updatedAt
          url
          userSessionsCount
          address {
            city
            country
            line1
            line2
            postalCode
            province
          }
          connectedAccounts {
            did
            extra
            id
            lastLoginAt
            pk
            provider
            userInfo {
              email
              emailVerified
              extraData
              name
              picture
              sub
            }
          }
          metadata {
            bio
            cover
            location
            timezone
            links {
              favicon
              url
            }
            phone {
              country
              phoneNumber
            }
            status {
              dateRange
              duration
              icon
              label
            }
          }
          passports {
            expirationDate
            id
            issuanceDate
            lastLoginAt
            name
            parentDid
            role
            scope
            source
            status
            title
            type
            userDid
            display {
              content
              type
            }
            issuer {
              id
              name
              pk
            }
            user {
              approved
              avatar
              createdAt
              did
              email
              fullName
              locale
              pk
              role
              updatedAt
            }
          }
          tags {
            color
            componentDid
            createdAt
            createdBy
            description
            id
            parentId
            slug
            title
            type
            updatedAt
            updatedBy
          }
          userSessions {
            appPid
            createdAt
            createdByAppPid
            extra
            id
            lastLoginIp
            passportId
            status
            ua
            updatedAt
            userDid
            visitorId
          }
        }
      }
      owner {
        approved
        avatar
        createdAt
        createdByAppPid
        did
        didSpace
        email
        emailVerified
        extra
        firstLoginAt
        fullName
        generation
        inviter
        isFollowing
        lastLoginAt
        lastLoginIp
        locale
        name
        phone
        phoneVerified
        pk
        remark
        role
        sourceAppPid
        sourceProvider
        updatedAt
        url
        userSessionsCount
        address {
          city
          country
          line1
          line2
          postalCode
          province
        }
        connectedAccounts {
          did
          extra
          id
          lastLoginAt
          pk
          provider
          userInfo {
            email
            emailVerified
            extraData
            name
            picture
            sub
          }
        }
        metadata {
          bio
          cover
          location
          timezone
          links {
            favicon
            url
          }
          phone {
            country
            phoneNumber
          }
          status {
            dateRange
            duration
            icon
            label
          }
        }
        passports {
          expirationDate
          id
          issuanceDate
          lastLoginAt
          name
          parentDid
          role
          scope
          source
          status
          title
          type
          userDid
          display {
            content
            type
          }
          issuer {
            id
            name
            pk
          }
          user {
            approved
            avatar
            createdAt
            did
            email
            fullName
            locale
            pk
            role
            updatedAt
          }
        }
        tags {
          color
          componentDid
          createdAt
          createdBy
          description
          id
          parentId
          slug
          title
          type
          updatedAt
          updatedBy
        }
        userSessions {
          appPid
          createdAt
          createdByAppPid
          extra
          id
          lastLoginIp
          passportId
          status
          ua
          updatedAt
          userDid
          visitorId
        }
      }
      passports {
        expirationDate
        id
        issuanceDate
        lastLoginAt
        name
        parentDid
        role
        scope
        source
        status
        title
        type
        userDid
        display {
          content
          type
        }
        issuer {
          id
          name
          pk
        }
        user {
          approved
          avatar
          createdAt
          did
          email
          fullName
          locale
          pk
          role
          updatedAt
        }
      }
    }
  }
}
```

### removeOrgMember

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
mutation {
  removeOrgMember {
    code
  }
}
```

### inviteMembersToOrg

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
mutation {
  inviteMembersToOrg {
    code
    data {
      failedDids
      inviteLink
      successDids
    }
  }
}
```

### addOrgResource

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
mutation {
  addOrgResource {
    code
    data {
      failed
      success
    }
  }
}
```

### migrateOrgResource

#### Arguments

* **input**, optional, null

#### Result Format

```graphql
mutation {
  migrateOrgResource {
    code
    data {
      failed
      success
    }
  }
}
```