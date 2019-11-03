# AutoPeer

AutoPeer is a minimal p2p synchronization system for [Automerge](https://github.com/automerge/automerge) documents using [PeerJS](https://github.com/peers/peerjs)

![](screenshot.gif)

- [AutoPeer](#autopeer)
  - [Installation](#installation)
  - [Quick Start](#quick-start)
  - [API](#api)
    - [`AutoPeer`](#autopeer)
      - [`constructor (actorId: string, config: AutoPeerConfig<T> = {})`](#constructor-actorid-string-config-autopeerconfigt)
      - [`readonly set: Automerge.DocSet<T>;`](#readonly-set-automergedocsett)
      - [`connect(id: string, conn?: PeerJS.DataConnection): void;`](#connectid-string-conn-peerjsdataconnection-void)
      - [`select (id: string): (fn: Function, ...args: any[]) => Automerge.Doc<T>`](#select-id-string-fn-function-args-any--automergedoct)

## Installation

`AutoPeer` has the following dependencies:
```json
{
  "automerge": "^0.12.1",
  "peerjs": "^1.1.0"
}
```

Install `AutoPeer` via npm:
```sh
npm install autopeer
```
or via yarn:
```sh
yarn add autopeer
```

## Quick Start

For a more complete example, see [the example page](./example/index.html)

```js
import { change } from 'automerge'
import AutoPeer from 'autopeer'

// instantiate library
const autopeer = new AutoPeer('hella-long-unique-1')

// connect to a peer
autopeer.connect('hella-long-unique-2')

autopeer.docSet.registerHandler((docId, doc) => {
  // logs 'some-document-id', { message: 'Hey!' }
  console.log(docId, doc)
})

// select and change documents
autopeer.select('some-document-id')(
  change,
  doc => {
    doc.message = 'Hey!'
  }
)

```

## API

### `AutoPeer`

`AutoPeer` is a class containing references to `Automerge.Connections`, and encodes and decodes passed messages using `PeerJS` and the `Automerge.Connection` protocol.

#### `constructor (actorId: string, config: AutoPeerConfig<T> = {})`

You can construct `AutoPeer` with the following config shape. All properties are optional.

|Key|Type|Description|
|-|-|-|
|`actorId`|`string`|Unique ID used to initialize the PeerJS connection. Automerge should also be initialized with with this value.|
|`decode`|`(msg: string) => any`|A function called on a WebRTC string message before it is passed to an `Automerge.Connection` with `receiveMsg`|
|`encode`|`(msg: any) => string`|A function called on `Automerge.DocSet` change objects before it is sent to a peer.|
|`peerInstance`|`PeerJS.Peer`|A preconfigured `PeerJS.Peer` instance.|
|`docSet`|`Automerge.DocSet<T>`|An instantiated `Automerge.DocSet` to sync between clients.|

#### `readonly set: Automerge.DocSet<T>;`

Getter that retrieves the sync'd `Automerge.DocSet`, handy to subscribe to state changes with:

```js
  docSet.registerHandler((docId, doc) => {
    // REACT TO STATE UPDATES
  })
```

#### `connect(id: string, conn?: PeerJS.DataConnection): void;`

Connects to a `PeerJS` peer with the given ID and sends outgoing `Automerge.DocSet` syncronization messages using the `Automerge.Connection` protocol.

Optionally, you can pass an existing `PeerJS` connection.

#### `select (id: string): (fn: Function, ...args: any[]) => Automerge.Doc<T>`

Returns a function that applies a given `Automerge` doc method, then sets the returned document on the internal `DocSet` to broadcast changes to connected peers, for example:

```js
// Selects the document with the ID 'foo'
const exec = autopeer.select('foo')

// Apply and broadcast changes on 'foo'
const newDoc = exec(
  Automerge.change,    // apply changes
  'increase counter',  // commit message
  doc => {             // mutate proxy document and apply changes
    if(!doc.counter) doc.counter = 0
    doc.counter++
  }
)

// which is roughly the same as:
const oldDoc = docSet.getDoc('foo') || Automerge.init(actorId)
const newDoc = Automerge.change(oldDoc, 'increase counter', doc => {
  if(!doc.counter) doc.counter = 0
  doc.counter++
})
autopeer.set.setDoc(id, newDoc)
```