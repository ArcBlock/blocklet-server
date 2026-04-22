# Navigation Utilities

These functions are the engine behind building dynamic user interfaces in a Blocklet-based application. They parse and process the `navigation` property from a blocklet's metadata (`blocklet.yml`) and its current state, aggregating navigation items from the main blocklet and all its child components into a unified, ready-to-render structure.

The core challenge these utilities solve is complexity management. In a composite application, each component can declare its own navigation items. These utilities intelligently merge these declarations, resolve path prefixes based on each component's mount point, handle internationalization (i18n), filter out duplicates or inaccessible items, and organize everything into logical sections (like `header`, `footer`, `userCenter`).

## Core Processing Flow

The following diagram illustrates the high-level process of how raw navigation metadata from various sources is transformed into a final, structured list for the UI.

<!-- DIAGRAM_IMAGE_START:flowchart:16:9 -->
![Navigation Utilities](assets/diagram/navigation-utilities-diagram-0.jpg)
<!-- DIAGRAM_IMAGE_END -->

## Main Function

### `parseNavigation(blocklet, options)`

This is the primary function for processing navigation data. It orchestrates the entire workflow, from parsing built-in navigation from `blocklet.yml` files to merging them with user-defined customizations stored in the database.

**Parameters**

<x-field-group>
  <x-field data-name="blocklet" data-type="object" data-required="true" data-desc="The full blocklet state object, including `meta`, `children`, and `settings.navigations`."></x-field>
  <x-field data-name="options" data-type="object" data-required="false" data-desc="Optional configuration for the parsing process.">
    <x-field data-name="beforeProcess" data-type="(data: any) => any" data-required="false" data-desc="An optional function to preprocess the built-in navigation list before it's compacted and patched."></x-field>
  </x-field>
</x-field-group>

**Returns**

An object containing the processed navigation data:

<x-field-group>
  <x-field data-name="navigationList" data-type="NavigationItem[]" data-desc="The final, merged, and cleaned list of navigation items, ready for rendering. This is the primary output."></x-field>
  <x-field data-name="components" data-type="ComponentItem[]" data-desc="An array of all child components that declare navigation, including their name, link, and title."></x-field>
  <x-field data-name="builtinList" data-type="NavigationItem[]" data-desc="The processed list of navigation items derived purely from `blocklet.yml` files, before merging with custom navigation from settings."></x-field>
</x-field-group>

**Example Usage**

```javascript Basic Usage icon=logos:javascript
import { parseNavigation } from '@blocklet/meta/lib/navigation';

// A simplified blocklet state object
const blockletState = {
  did: 'z1...',
  meta: {
    name: 'my-app',
    title: 'My App',
    navigation: [
      { id: 'home', title: 'Home', link: '/' },
      { id: 'dashboard', title: 'Dashboard', component: 'dashboard-blocklet' },
    ],
  },
  children: [
    {
      did: 'z2...',
      mountPoint: '/dashboard',
      meta: {
        name: 'dashboard-blocklet',
        title: 'Dashboard',
        navigation: [
          { id: 'overview', title: 'Overview', link: '/overview' },
        ],
      },
    },
  ],
  settings: {
    // Custom navigation items from a database
    navigations: [
      {
        id: 'external-link',
        title: 'External Site',
        link: 'https://example.com',
        section: 'header',
        from: 'db',
        visible: true,
      },
    ],
  },
};

const { navigationList, components } = parseNavigation(blockletState);

console.log(navigationList);
/*
Outputs a structured array like:
[
  { id: '/home', title: 'Home', link: '/', ... },
  {
    id: '/dashboard/overview',
    title: 'Overview',
    link: '/dashboard/overview',
    component: 'dashboard-blocklet',
    ...
  },
  { id: 'external-link', title: 'External Site', ... }
]
*/
console.log(components);
/*
Outputs component info:
[
  {
    did: 'z2...',
    name: 'dashboard-blocklet',
    link: '/dashboard',
    title: 'Dashboard',
    ...
  }
]
*/
```

## Helper Functions

While `parseNavigation` is the all-in-one solution, the library also exports several underlying helper functions. These are useful for advanced use cases where you might need to perform custom manipulations on navigation data.

<x-cards data-columns="2">
  <x-card data-title="deepWalk" data-icon="lucide:git-commit">
    A generic utility for recursively traversing a tree-like object, applying a callback to each node.
  </x-card>
  <x-card data-title="flattenNavigation" data-icon="lucide:merge">
    Transforms a nested navigation tree into a flat array, optionally to a specified depth.
  </x-card>
  <x-card data-title="nestNavigationList" data-icon="lucide:git-branch-plus">
    Reconstructs a nested navigation tree from a flat array where items have a `parent` ID property.
  </x-card>
  <x-card data-title="splitNavigationBySection" data-icon="lucide:columns">
    Deconstructs navigation items that belong to multiple sections into separate items for each section.
  </x-card>
  <x-card data-title="filterNavigation" data-icon="lucide:filter">
    Filters a navigation list by removing items marked as `visible: false` or those whose components are missing.
  </x-card>
  <x-card data-title="joinLink" data-icon="lucide:link">
    Intelligently combines a parent's link with a child's link, correctly handling prefixes and absolute URLs.
  </x-card>
</x-cards>

### `flattenNavigation(list, options)`

This function takes a tree of navigation items and flattens it into a single-level array. It's particularly useful for preparing navigation data for display in menus that don't support deep nesting or for easier processing.

**Parameters**

<x-field-group>
  <x-field data-name="list" data-type="NavigationItem[]" data-required="true" data-desc="The tree-structured navigation list."></x-field>
  <x-field data-name="options" data-type="object" data-required="false" data-desc="Configuration options for flattening.">
    <x-field data-name="depth" data-type="number" data-default="1" data-required="false" data-desc="The depth to which the tree should be flattened. A depth of 1 means full flattening."></x-field>
    <x-field data-name="transform" data-type="(current, parent) => any" data-required="false" data-desc="A function to transform each item as it's being flattened."></x-field>
  </x-field>
</x-field-group>

**Example**

```javascript Flattening a Navigation Tree icon=logos:javascript
const nestedNav = [
  {
    id: 'parent1',
    title: 'Parent 1',
    items: [
      { id: 'child1a', title: 'Child 1a' },
      { id: 'child1b', title: 'Child 1b' },
    ],
  },
];

const flatNav = flattenNavigation(nestedNav, { depth: 2 }); // Flatten up to 2 levels

console.log(flatNav);
/*
[
  { id: 'parent1', title: 'Parent 1' },
  { id: 'child1a', title: 'Child 1a' },
  { id: 'child1b', title: 'Child 1b' }
]
*/
```

### `nestNavigationList(list)`

The inverse of `flattenNavigation`. This function takes a flat array of navigation items, where children reference their parent via a `parent` ID, and reconstructs the original tree structure.

**Parameters**

<x-field data-name="list" data-type="NavigationItem[]" data-required="true" data-desc="A flat array of navigation items with `id` and `parent` properties."></x-field>

**Example**

```javascript Building a Tree from a Flat List icon=logos:javascript
const flatNav = [
  { id: 'parent1', title: 'Parent 1', section: 'header' },
  { id: 'child1a', title: 'Child 1a', parent: 'parent1', section: 'header' },
  { id: 'root2', title: 'Root 2', section: 'header' },
];

const nestedNav = nestNavigationList(flatNav);

console.log(nestedNav);
/*
[
  {
    id: 'parent1',
    title: 'Parent 1',
    section: 'header',
    items: [ { id: 'child1a', title: 'Child 1a', ... } ],
  },
  { id: 'root2', title: 'Root 2', section: 'header' },
]
*/
```

---

These utilities provide a comprehensive toolkit for managing navigation in complex, component-based applications. To understand how to format the URLs and paths used within these navigation items, proceed to the [URL & Path Utilities](./api-url-path-utilities.md) documentation.
