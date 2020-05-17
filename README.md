# Perge

Perge is a minimal p2p synchronization system for [Automerge](https://github.com/automerge/automerge) documents using [PeerJS](https://github.com/peers/peerjs).

![](screenshot.gif)

- [Perge](#perge)
  - [Installation](#installation)
  - [Quick Start](#quick-start)
  - [API](#api)
    - [`Perge`](#perge)
      - [`constructor (actorId: string, config: PergeConfig<T> = {})`](#constructor-actorid-string-config-pergeconfigt)
      - [`readonly docSet: Automerge.DocSet<T>;`](#readonly-docset-automergedocsett)
      - [`connect(id: string, conn?: PeerJS.DataConnection): void;`](#connectid-string-conn-peerjsdataconnection-void)
      - [`select (id: string): (fn: Function, ...args: any[]) => Automerge.Doc<T>`](#select-id-string-fn-function-args-any--automergedoct)
      - [`subscribe(idOrSetHandler: string | Automerge.DocSetHandler<T>, docHandler?: DocHandler<T>): () => void`](#subscribeidorsethandler-string--automergedocsethandlert-dochandler-dochandlert---void)

## Installation

`Perge` has the following dependencies:
```json
{
  "automerge": "^0.14.0",
  "peerjs": "^1.2.0"
}
```

Install `Perge` via npm:
```sh
npm install perge
```
or via yarn:
```sh
yarn add perge
```

## Quick Start

For a more complete example, see [the example page](./example/index.html)

```js
import { change } from 'automerge'
import Perge from 'perge'

// instantiate library
const perge = new Perge('my-unique-id')

// connect to a peer
perge.connect('someone-elses-unique-id')

// subscribe to all docset changes
perge.subscribe((docId, doc) => {
  // logs 'some-document-id', { message: 'Hey!' }
  console.log(docId, doc)
})

// subscribe to a single doc's changes
const unsubscribe = perge.subscribe('some-document-id', doc => {
    // { message: 'Hey!' }
  console.log(doc)
  // unsubscribe this callback
  unsubscribe()
})

// select and change documents
perge.select('some-document-id')(
  change,
  doc => {
    doc.message = 'Hey!'
  }
)

```

## API

### `Perge`

`Perge` is a class containing references to `Automerge.Connections`, and encodes and decodes passed messages using `PeerJS` and the `Automerge.Connection` protocol.

#### `constructor (actorId: string, config: PergeConfig<T> = {})`

You can construct `Perge` with the following config shape. All properties are optional.

| Key            | Type                   | Description                                                                                                                               |
| -------------- | ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `actorId`      | `string`               | Unique ID used to initialize the PeerJS connection. Automerge should also be initialized with with this value.                            |
| `decode`       | `(msg: string) => any` | A function called on a WebRTC string message before it is passed to an `Automerge.Connection` with `receiveMsg`, defaults to `JSON.parse` |
| `encode`       | `(msg: any) => string` | A function called on `Automerge.DocSet` change objects before it is sent to a peer, defaults to `JSON.stringify`                          |
| `peerInstance` | `PeerJS.Peer`          | A preconfigured `PeerJS.Peer` instance.                                                                                                   |
| `docSet`       | `Automerge.DocSet<T>`  | An instantiated `Automerge.DocSet` to sync between clients.                                                                               |

#### `readonly docSet: Automerge.DocSet<T>;`

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
const exec = perge.select('foo')

// Apply and broadcast changes on 'foo'
const newDoc = exec(
  Automerge.change,    // apply changes
  'increase counter',  // commit message
  doc => {             // mutate proxy document and apply changes
    if(!doc.counter) doc.counter = new Automerge.Counter()
    else doc.counter.increment()
  }
)

// which is roughly the same as:
const oldDoc = docSet.getDoc('foo') || Automerge.init(actorId)
const newDoc = Automerge.change(oldDoc, 'increase counter', doc => {
  if(!doc.counter) doc.counter = new Automerge.Counter()
  else doc.counter.increment()
})
perge.set.setDoc(id, newDoc)
```

#### `subscribe(idOrSetHandler: string | Automerge.DocSetHandler<T>, docHandler?: DocHandler<T>): () => void`

Subscribe to doc updates for either the entire docSet or a specific document ID. Returns a function that, when called, unsubscribes.