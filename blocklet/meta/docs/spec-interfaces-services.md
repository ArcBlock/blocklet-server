# Interfaces & Services

Blocklets interact with the outside world through `interfaces` and are enhanced with powerful, reusable functionalities via `services`. The `interfaces` property in `blocklet.yml` is the cornerstone for exposing your application's web pages, APIs, and other endpoints. `services`, such as the built-in authentication service, can then be attached to these interfaces to provide common features without extra boilerplate code.

This section details how to configure both, enabling you to define clear entry points for your blocklet and integrate it seamlessly into the broader ecosystem.

---

## Interfaces

The `interfaces` array defines all the public-facing entry points for your blocklet. Each object in the array represents a single interface, specifying its type, location, and behavior.

### Interface Schema

Each interface object is defined by the following properties:

<x-field-group>
  <x-field data-name="type" data-type="string" data-required="true">
    <x-field-desc markdown>The type of interface. Valid values include `web`, `well-known`, `api`, `health`, etc. A blocklet can only declare one `web` interface.</x-field-desc>
  </x-field>
  <x-field data-name="name" data-type="string" data-required="true" data-desc="A unique, human-readable name for the interface (e.g., `publicUrl`, `adminApi`)."></x-field>
  <x-field data-name="path" data-type="string" data-default="/" data-desc="The internal path within the blocklet that serves this interface."></x-field>
  <x-field data-name="prefix" data-type="string" data-default="*">
    <x-field-desc markdown>The path prefix where this interface is mounted publicly. A value of `*` (`BLOCKLET_DYNAMIC_PATH_PREFIX`) allows the user to mount it at any path.</x-field-desc>
  </x-field>
  <x-field data-name="protocol" data-type="string" data-default="http">
    <x-field-desc markdown>The communication protocol. Valid values are `http`, `https`, `tcp`, `udp`.</x-field-desc>
  </x-field>
  <x-field data-name="port" data-type="string | object" data-default="PORT">
    <x-field-desc markdown>Defines the port mapping. It can be a string referencing an environment variable (e.g., `PORT`), or an object with `internal` (env var name) and `external` (port number) keys for fixed mappings.</x-field-desc>
  </x-field>
  <x-field data-name="containerPort" data-type="number" data-required="false" data-desc="The port number inside the container."></x-field>
  <x-field data-name="hostIP" data-type="string" data-required="false" data-desc="Binds the interface to a specific IP on the host machine."></x-field>
  <x-field data-name="services" data-type="array" data-default="[]" data-desc="A list of services to attach to this interface. See the Services section below for details."></x-field>
  <x-field data-name="endpoints" data-type="array" data-default="[]" data-desc="Defines specific API endpoints with metadata for discoverability and interaction."></x-field>
  <x-field data-name="cacheable" data-type="array" data-default="[]" data-desc="A list of relative paths under this interface that can be cached by upstream services."></x-field>
  <x-field data-name="proxyBehavior" data-type="string" data-default="service">
    <x-field-desc markdown>Defines how requests are proxied. `service` routes through Blocklet Server's service layer, while `direct` bypasses it.</x-field-desc>
  </x-field>
  <x-field data-name="pageGroups" data-type="array" data-default="[]" data-desc="A list of page group identifiers."></x-field>
</x-field-group>

### Special Interface Types

-   **`web`**: This is the primary user-facing interface for a blocklet. A blocklet can declare **at most one** interface of type `web`.
-   **`well-known`**: This type is for standardized resource discovery paths (e.g., `/.well-known/did.json`). Any interface of this type must have a `prefix` that starts with `/.well-known`.

### Example: Defining Interfaces

Here is an example of a `blocklet.yml` defining both a primary web interface and a separate API interface.

```yaml blocklet.yml icon=mdi:code-braces
name: my-awesome-app
did: z8iZpky2Vd3i2bE8z9f6c7g8h9j0k1m2n3p4q5r6s7t8u9v0w1x2y3z4a5b6c7d
version: 1.2.0
description: An awesome app with a web UI and an API.

interfaces:
  # The main web interface, accessible by users
  - type: web
    name: publicUrl
    path: /
    prefix: /
    protocol: http
    port: PORT

  # A dedicated API interface
  - type: api
    name: dataApi
    path: /api
    prefix: /api
    protocol: http
    port: PORT
```

---

## Services

Services are pre-built, configurable functionalities provided by the Blocklet Server environment. You can attach them to an interface to add features like authentication, authorization, and more, simply by declaring them in the `services` array of an interface.

### Service Schema

A service object has two main properties:

<x-field-group>
  <x-field data-name="name" data-type="string" data-required="true" data-desc="The name of the service to attach (e.g., `auth`)."></x-field>
  <x-field data-name="config" data-type="object" data-default="{}" data-desc="A configuration object specific to that service."></x-field>
</x-field-group>

### Built-in Service: `auth`

The `auth` service provides a complete user authentication and authorization solution for your blocklet. It handles user login, profile management, and access control.

#### `auth` Service Configuration

When you add the `auth` service, you can customize its behavior using the `config` object. Here are the available options:

<x-field-group>
  <x-field data-name="whoCanAccess" data-type="string" data-default="all">
    <x-field-desc markdown>Defines who can access the interface. Valid values: `owner` (only the DID Space owner), `invited` (owner and invited users), or `all` (any authenticated user).</x-field-desc>
  </x-field>
  <x-field data-name="profileFields" data-type="array" data-default='["fullName", "email", "avatar"]'>
    <x-field-desc markdown>The user profile information your app requests upon login. Valid fields are `fullName`, `email`, `avatar`, and `phone`.</x-field-desc>
  </x-field>
  <x-field data-name="allowSwitchProfile" data-type="boolean" data-default="true" data-desc="Determines if users can switch between different profiles within your application."></x-field>
  <x-field data-name="blockUnauthenticated" data-type="boolean" data-default="false" data-desc="If `true`, the service automatically blocks any request that is not authenticated."></x-field>
  <x-field data-name="blockUnauthorized" data-type="boolean" data-default="false">
    <x-field-desc markdown>If `true`, the service blocks authenticated users who do not meet the `whoCanAccess` criteria.</x-field-desc>
  </x-field>
  <x-field data-name="ignoreUrls" data-type="array" data-default="[]">
    <x-field-desc markdown>A list of URL paths or patterns (e.g., `/public/**`) that should be excluded from authentication checks.</x-field-desc>
  </x-field>
</x-field-group>

### Example: Attaching the `auth` Service

This example shows how to secure the `web` interface from the previous example using the `auth` service.

```yaml blocklet.yml icon=mdi:code-braces
interfaces:
  - type: web
    name: publicUrl
    path: /
    prefix: /
    protocol: http
    port: PORT
    services:
      - name: auth
        config:
          whoCanAccess: invited
          blockUnauthenticated: true
          profileFields:
            - fullName
            - email
          ignoreUrls:
            - /assets/**
            - /login
```

In this configuration, all paths under the web interface are protected except for `/assets/**` and `/login`. Only the DID Space owner and invited users will be able to access the protected pages after logging in, and they will be prompted to share their full name and email.

---

## Endpoints

The `endpoints` array within an interface allows for the explicit definition of API endpoints, enhancing discoverability and enabling automated interactions.

### Endpoint Schema

<x-field-group>
  <x-field data-name="type" data-type="string" data-required="true" data-desc="A unique identifier for the endpoint type."></x-field>
  <x-field data-name="path" data-type="string" data-required="true" data-desc="The path to the endpoint, relative to the interface's path."></x-field>
  <x-field data-name="meta" data-type="object" data-required="false" data-desc="An object containing metadata about the endpoint.">
    <x-field data-name="vcType" data-type="string" data-desc="The type of Verifiable Credential associated with the endpoint."></x-field>
    <x-field data-name="payable" data-type="boolean" data-desc="Indicates if the endpoint involves a payment."></x-field>
    <x-field data-name="params" data-type="array" data-desc="An array describing the parameters the endpoint accepts.">
      <x-field data-name="name" data-type="string" data-required="true" data-desc="The name of the parameter."></x-field>
      <x-field data-name="description" data-type="string" data-required="true" data-desc="A description of the parameter."></x-field>
    </x-field>
  </x-field>
</x-field-group>

---

By combining interfaces and services, you can clearly define how your blocklet is exposed and secure it with powerful, built-in features. To learn how to build more complex applications by combining multiple blocklets, see the next section on composition.

[Next: Composition (Components)](./spec-composition.md)
