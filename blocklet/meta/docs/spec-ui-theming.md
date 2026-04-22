# UI & Theming

This section details the `navigation` and `theme` properties within the `blocklet.yml` file. These properties are instrumental in defining a blocklet's contribution to the user interface, controlling how it appears in menus, and specifying its look and feel to ensure a cohesive user experience.

Proper configuration of these fields allows a blocklet to integrate seamlessly into a larger application, providing clear navigation paths for users and adhering to established visual guidelines.

## Navigation

The `navigation` property is an array of objects that defines the blocklet's user-facing menu structure. It allows you to specify navigation links that will be merged into the parent application's navigation, such as headers, footers, or dashboards. This system is composable, meaning a parent blocklet can reference a child component, and the child's navigation items will be intelligently integrated into the parent's structure.

### Navigation Item Properties

Each item in the `navigation` array is an object that can contain the following fields:

<x-field-group>
  <x-field data-name="id" data-type="string" data-required="false">
    <x-field-desc markdown>A unique identifier for the navigation item. While optional, providing an `id` is best practice, especially for items that might be referenced or extended by other blocklets. The ID must conform to JavaScript variable naming rules.</x-field-desc>
  </x-field>
  <x-field data-name="title" data-type="string | object" data-required="true">
    <x-field-desc markdown>The text displayed for the navigation item. This can be a simple string or an object for internationalization (i18n), where keys are locale codes (e.g., `en`, `zh`).</x-field-desc>
  </x-field>
  <x-field data-name="description" data-type="string | object" data-required="false">
    <x-field-desc markdown>A tooltip or supplementary text for the navigation item. It also supports i18n in the same way as `title`.</x-field-desc>
  </x-field>
  <x-field data-name="link" data-type="string | object" data-required="false">
    <x-field-desc markdown>The destination URL for the navigation item. This can be a relative path (e.g., `/profile`) which will be resolved against the blocklet's mount point, or an absolute URL (e.g., `https://www.arcblock.io`). It also supports i18n.</x-field-desc>
  </x-field>
  <x-field data-name="component" data-type="string" data-required="false">
    <x-field-desc markdown>The name or DID of a child component blocklet. When specified, this navigation item acts as a container for the child's own navigation entries, which will be nested under it.</x-field-desc>
  </x-field>
  <x-field data-name="section" data-type="string | array" data-required="false">
    <x-field-desc markdown>Specifies where the navigation item should appear in the UI. A single item can belong to multiple sections. Valid values include: `header`, `footer`, `bottom`, `social`, `dashboard`, `sessionManager`, `userCenter`, and `bottomNavigation`.</x-field-desc>
  </x-field>
  <x-field data-name="role" data-type="string | array" data-required="false">
    <x-field-desc markdown>Defines roles that are permitted to see this navigation item, enabling role-based access control (RBAC) for the UI.</x-field-desc>
  </x-field>
  <x-field data-name="icon" data-type="string" data-required="false">
    <x-field-desc markdown>An identifier for an icon to be displayed next to the navigation item's title.</x-field-desc>
  </x-field>
  <x-field data-name="visible" data-type="boolean" data-required="false" data-default="true">
    <x-field-desc markdown>Controls the default visibility of the navigation item.</x-field-desc>
  </x-field>
  <x-field data-name="private" data-type="boolean" data-required="false" data-default="false">
    <x-field-desc markdown>If `true`, this item will only be visible when a user is viewing their own profile or user center, not when viewing another user's.</x-field-desc>
  </x-field>
  <x-field data-name="items" data-type="array" data-required="false">
    <x-field-desc markdown>An array of nested navigation item objects, allowing for the creation of dropdowns or sub-menus.</x-field-desc>
  </x-field>
</x-field-group>

### Example: Basic Navigation

Here is an example of a `navigation` configuration that defines a main link to the blocklet's home page and an external link in the footer.

```yaml blocklet.yml
name: 'my-blocklet'
did: 'z8iZuf...s92'
version: '1.0.0'
title: 'My Blocklet'

interfaces:
  - type: 'web'
    name: 'publicUrl'
    path: '/'
    prefix: '*'
    port: 'BLOCKLET_PORT'

navigation:
  - title: 'Home'
    link: '/'
    section: 'header'
  - title:
      en: 'My Account'
      zh: '我的账户'
    link: '/profile'
    section: 'userCenter'
    role: ['guest', 'user']
    private: true
  - title: 'About Us'
    link: 'https://www.arcblock.io'
    section: 'footer'
    icon: 'mdi:info-outline'
```

### Example: Composable Navigation

This example demonstrates how a parent blocklet can compose its navigation with a child component. The "Dashboard" entry will automatically pull in and nest the navigation items defined within the `my-dashboard-component`.

```yaml Parent Blocklet (blocklet.yml) icon=mdi:file-document
# ... (parent blocklet metadata)

components:
  - name: 'my-dashboard-component'
    source:
      store: 'https://store.arcblock.io/api'
      name: 'my-dashboard-component'

navigation:
  - title: 'Home'
    link: '/'
    section: 'header'
  - title: 'Dashboard'
    component: 'my-dashboard-component' # References the child component
    section: 'dashboard'
```

```yaml Child Component (my-dashboard-component/blocklet.yml) icon=mdi:file-document
# ... (child component metadata)

navigation:
  - title: 'Overview'
    link: '/overview'
  - title: 'Settings'
    link: '/settings'
```

The final, merged navigation structure would result in a "Dashboard" menu with "Overview" and "Settings" as sub-items.

## Theming

The `theme` property allows a blocklet to define basic visual styles, such as background colors or images, that can be applied by the host application. This ensures that the blocklet's UI aligns with the overall aesthetic.

### Theme Properties

<x-field-group>
  <x-field data-name="background" data-type="string | object" data-required="false">
    <x-field-desc markdown>Specifies the background for different UI areas. It can be a single string (URL or color value) to be used as a default, or an object to define backgrounds for specific sections.</x-field-desc>
    <x-field data-name="header" data-type="string" data-required="false" data-desc="Background for the header section."></x-field>
    <x-field data-name="footer" data-type="string" data-required="false" data-desc="Background for the footer section."></x-field>
    <x-field data-name="default" data-type="string" data-required="false" data-desc="Default background for other areas."></x-field>
  </x-field>
</x-field-group>

### Example: Theme Configuration

This example sets a default background color and a specific image for the header.

```yaml blocklet.yml
name: 'my-themed-blocklet'
did: 'z8iZuf...s92'
version: '1.0.0'
title: 'My Themed Blocklet'

theme:
  background:
    default: '#F5F5F5'
    header: 'url(/assets/header-background.png)'
    footer: '#333333'
```

---

By leveraging the `navigation` and `theme` properties, developers can create blocklets that are not only functional but also deeply integrated into the end-user's application environment, providing a consistent and intuitive experience.