# UIとテーマ設定

このセクションでは、`blocklet.yml` ファイル内の `navigation` と `theme` プロパティについて詳しく説明します。これらのプロパティは、ブロックレットがユーザーインターフェースにどのように貢献するかを定義し、メニューでの表示方法を制御し、一貫性のあるユーザーエクスペリエンスを確保するためのルックアンドフィールを指定する上で重要な役割を果たします。

これらのフィールドを適切に設定することで、ブロックレットはより大きなアプリケーションにシームレスに統合され、ユーザーに明確なナビゲーションパスを提供し、確立された視覚的ガイドラインに準拠することができます。

## ナビゲーション

`navigation` プロパティは、ブロックレットのユーザー向けメニュー構造を定義するオブジェクトの配列です。これにより、ヘッダー、フッター、ダッシュボードなど、親アプリケーションのナビゲーションにマージされるナビゲーションリンクを指定できます。このシステムはコンポーザブルであり、親ブロックレットが子コンポーネントを参照すると、子のナビゲーション項目が親の構造にインテリジェントに統合されることを意味します。

### ナビゲーション項目のプロパティ

`navigation` 配列内の各項目は、以下のフィールドを含むことができるオブジェクトです：

<x-field-group>
  <x-field data-name="id" data-type="string" data-required="false">
    <x-field-desc markdown>ナビゲーション項目の一意の識別子。オプションですが、特に他のブロックレットから参照または拡張される可能性のある項目には `id` を提供することがベストプラクティスです。IDはJavaScriptの変数命名規則に準拠する必要があります。</x-field-desc>
  </x-field>
  <x-field data-name="title" data-type="string | object" data-required="true">
    <x-field-desc markdown>ナビゲーション項目に表示されるテキスト。単純な文字列、または国際化（i18n）のためのオブジェクトを指定できます。オブジェクトの場合、キーはロケールコード（例：`en`、`zh`）です。</x-field-desc>
  </x-field>
  <x-field data-name="description" data-type="string | object" data-required="false">
    <x-field-desc markdown>ナビゲーション項目のツールチップまたは補足テキスト。`title` と同様にi18nもサポートします。</x-field-desc>
  </x-field>
  <x-field data-name="link" data-type="string | object" data-required="false">
    <x-field-desc markdown>ナビゲーション項目のリンク先URL。ブロックレットのマウントポイントを基準に解決される相対パス（例：`/profile`）または絶対URL（例：`https://www.arcblock.io`）を指定できます。i18nもサポートします。</x-field-desc>
  </x-field>
  <x-field data-name="component" data-type="string" data-required="false">
    <x-field-desc markdown>子コンポーネントブロックレットの名前またはDID。指定された場合、このナビゲーション項目は子のナビゲーションエントリのコンテナとして機能し、子のエントリはその下にネストされます。</x-field-desc>
  </x-field>
  <x-field data-name="section" data-type="string | array" data-required="false">
    <x-field-desc markdown>ナビゲーション項目をUIのどこに表示するかを指定します。単一の項目を複数のセクションに所属させることができます。有効な値には、`header`、`footer`、`bottom`、`social`、`dashboard`、`sessionManager`、`userCenter`、および `bottomNavigation` が含まれます。</x-field-desc>
  </x-field>
  <x-field data-name="role" data-type="string | array" data-required="false">
    <x-field-desc markdown>このナビゲーション項目を閲覧できるロールを定義し、UIのロールベースのアクセス制御（RBAC）を有効にします。</x-field-desc>
  </x-field>
  <x-field data-name="icon" data-type="string" data-required="false">
    <x-field-desc markdown>ナビゲーション項目のタイトルの隣に表示されるアイコンの識別子。</x-field-desc>
  </x-field>
  <x-field data-name="visible" data-type="boolean" data-required="false" data-default="true">
    <x-field-desc markdown>ナビゲーション項目のデフォルトの可視性を制御します。</x-field-desc>
  </x-field>
  <x-field data-name="private" data-type="boolean" data-required="false" data-default="false">
    <x-field-desc markdown>`true` の場合、この項目はユーザーが自身のプロフィールやユーザーセンターを閲覧している場合にのみ表示され、他人のプロフィールを閲覧している場合には表示されません。</x-field-desc>
  </x-field>
  <x-field data-name="items" data-type="array" data-required="false">
    <x-field-desc markdown>ネストされたナビゲーション項目オブジェクトの配列で、ドロップダウンやサブメニューを作成できます。</x-field-desc>
  </x-field>
</x-field-group>

### 例：基本的なナビゲーション

以下は、ブロックレットのホームページへのメインリンクとフッターの外部リンクを定義する `navigation` 設定の例です。

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

### 例：コンポーザブルナビゲーション

この例は、親ブロックレットがそのナビゲーションを子コンポーネントで構成する方法を示しています。「Dashboard」エントリは、`my-dashboard-component` 内で定義されたナビゲーション項目を自動的に取り込み、ネストします。

```yaml 親ブロックレット (blocklet.yml) icon=mdi:file-document
# ... (親ブロックレットのメタデータ)

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
    component: 'my-dashboard-component' # 子コンポーネントを参照
    section: 'dashboard'
```

```yaml 子コンポーネント (my-dashboard-component/blocklet.yml) icon=mdi:file-document
# ... (子コンポーネントのメタデータ)

navigation:
  - title: 'Overview'
    link: '/overview'
  - title: 'Settings'
    link: '/settings'
```

最終的にマージされたナビゲーション構造では、「Dashboard」メニューに「Overview」と「Settings」がサブ項目として表示されます。

## テーマ設定

`theme` プロパティを使用すると、ブロックレットは背景色や背景画像などの基本的な視覚スタイルを定義でき、これらはホストアプリケーションによって適用されます。これにより、ブロックレットのUIが全体的なデザインと一致することが保証されます。

### テーマのプロパティ

<x-field-group>
  <x-field data-name="background" data-type="string | object" data-required="false">
    <x-field-desc markdown>さまざまなUI領域の背景を指定します。デフォルトとして使用される単一の文字列（URLまたはカラー値）、または特定のセクションの背景を定義するオブジェクトを指定できます。</x-field-desc>
    <x-field data-name="header" data-type="string" data-required="false" data-desc="ヘッダーセクションの背景。"></x-field>
    <x-field data-name="footer" data-type="string" data-required="false" data-desc="フッターセクションの背景。"></x-field>
    <x-field data-name="default" data-type="string" data-required="false" data-desc="他の領域のデフォルトの背景。"></x-field>
  </x-field>
</x-field-group>

### 例：テーマ設定

この例では、デフォルトの背景色とヘッダー用の特定の画像を設定します。

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

`navigation` と `theme` プロパティを活用することで、開発者は機能的であるだけでなく、エンドユーザーのアプリケーション環境に深く統合され、一貫性のある直感的なエクスペリエンスを提供するブロックレットを作成できます。