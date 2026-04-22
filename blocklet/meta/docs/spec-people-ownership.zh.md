# 人员与所有权

恰当地署名作者并明确贡献和维护的角色，对于一个健康的开源生态系统至关重要。在 `blocklet.yml` 中，你可以使用三个不同的字段来指定参与项目的人员：`author`、`contributors` 和 `maintainers`。所有这些字段都使用一个通用的 `person` 模式。

## Person 模式

参与 blocklet 的每个人都由一个标准化的对象表示，确保元数据中所有与人员相关的字段保持一致。`@blocklet/meta` 库还提供了辅助函数来解析和格式化这些信息。

以下是 person 对象的正式定义：

<x-field-group>
  <x-field data-name="name" data-type="string" data-required="true" data-desc="此人的全名或昵称。"></x-field>
  <x-field data-name="email" data-type="string" data-required="false" data-desc="此人的电子邮件地址。"></x-field>
  <x-field data-name="url" data-type="string" data-required="false" data-desc="指向此人网站、博客或社交媒体个人资料的 URL。"></x-field>
</x-field-group>

### 字符串简写

为方便起见，你也可以将一个人指定为格式为 `"姓名 <email@example.com> (http://example.com)"` 的单个字符串。`@blocklet/meta` 库会自动将此字符串解析为结构化对象格式。电子邮件和 URL 部分是可选的。

```yaml String Shorthand Example icon=lucide:file-text
author: 'Satoshi Nakamoto <satoshi@gmx.com> (https://bitcoin.org)'
```

## `author`

`author` 字段指定 blocklet 的主要创建者或所有者。它应该是一个单一的 person 对象或可以解析为该对象的字符串。

**模式：** `personSchema`

**示例：**

```yaml blocklet.yml icon=lucide:file-code
author:
  name: Jane Doe
  email: jane.doe@example.com
  url: https://github.com/janedoe
```

## `contributors`

`contributors` 字段是一个为 blocklet 开发做出贡献的人员数组。数组中的每个项目可以是 person 对象或字符串。

**模式：** `Joi.array().items(personSchema)`

**示例：**

```yaml blocklet.yml icon=lucide:file-code
contributors:
  - name: John Smith
    email: john.smith@example.com
  - name: Alice Johnson
    url: https://alicej.dev
  - 'Bob Williams <bob@williams.io>'
```

## `maintainers`

`maintainers` 字段是一个当前负责维护 blocklet 的人员数组，包括响应问题和审查贡献。

**模式：** `Joi.array().items(personSchema)`

**示例：**

```yaml blocklet.yml icon=lucide:file-code
maintainers:
  - name: Jane Doe
    email: jane.doe@example.com
  - name: Admin Team
    email: admin@example.com
    url: https://example.com/team
```

通过清晰地定义这些角色，你可以提供透明度，并使用户和其他开发者更容易知道为不同目的应联系谁。

---

接下来，让我们看看如何指定在哪里可以找到和下载你的 blocklet。

<x-card data-title="下一步：分发与链接" data-icon="lucide:package" data-href="/spec/distribution-links" data-cta="阅读更多">
  了解 `dist`、`repository` 和各种 URL 字段，以将你的 blocklet 链接到其包和源代码。
</x-card>