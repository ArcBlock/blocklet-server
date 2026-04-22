# People & Ownership

Properly attributing authorship and defining roles for contribution and maintenance is crucial for a healthy open-source ecosystem. In `blocklet.yml`, you can specify the people involved in your project using three distinct fields: `author`, `contributors`, and `maintainers`. All of these fields use a common `person` schema.

## The Person Schema

Each person involved in the blocklet is represented by a standardized object, ensuring consistency across all people-related fields in the metadata. The `@blocklet/meta` library also provides helper functions to parse and format this information.

Here is the formal definition for a person object:

<x-field-group>
  <x-field data-name="name" data-type="string" data-required="true" data-desc="The person's full name or nickname."></x-field>
  <x-field data-name="email" data-type="string" data-required="false" data-desc="The person's email address."></x-field>
  <x-field data-name="url" data-type="string" data-required="false" data-desc="A URL to the person's website, blog, or social media profile."></x-field>
</x-field-group>

### String Shorthand

For convenience, you can also specify a person as a single string in the format `"Name <email@example.com> (http://example.com)"`. The `@blocklet/meta` library automatically parses this string into the structured object format. The email and URL parts are optional.

```yaml String Shorthand Example icon=lucide:file-text
author: 'Satoshi Nakamoto <satoshi@gmx.com> (https://bitcoin.org)'
```

## `author`

The `author` field designates the primary creator or owner of the blocklet. It should be a single person object or a string that can be parsed into one.

**Schema:** `personSchema`

**Example:**

```yaml blocklet.yml icon=lucide:file-code
author:
  name: Jane Doe
  email: jane.doe@example.com
  url: https://github.com/janedoe
```

## `contributors`

The `contributors` field is an array of people who have contributed to the development of the blocklet. Each item in the array can be either a person object or a string.

**Schema:** `Joi.array().items(personSchema)`

**Example:**

```yaml blocklet.yml icon=lucide:file-code
contributors:
  - name: John Smith
    email: john.smith@example.com
  - name: Alice Johnson
    url: https://alicej.dev
  - 'Bob Williams <bob@williams.io>'
```

## `maintainers`

The `maintainers` field is an array of people who are currently responsible for maintaining the blocklet, including responding to issues and reviewing contributions.

**Schema:** `Joi.array().items(personSchema)`

**Example:**

```yaml blocklet.yml icon=lucide:file-code
maintainers:
  - name: Jane Doe
    email: jane.doe@example.com
  - name: Admin Team
    email: admin@example.com
    url: https://example.com/team
```

By clearly defining these roles, you provide transparency and make it easier for users and other developers to know who to contact for different purposes.

---

Next, let's look at how to specify where your blocklet can be found and downloaded.

<x-card data-title="Next: Distribution & Links" data-icon="lucide:package" data-href="/spec/distribution-links" data-cta="Read More">
  Learn about the `dist`, `repository`, and various URL fields to link your blocklet to its package and source code.
</x-card>