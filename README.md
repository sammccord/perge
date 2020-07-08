# Perge

Perge is a minimal p2p synchronization system for [Automerge](https://github.com/automerge/automerge) documents using [PeerJS](https://github.com/peers/peerjs).

![](screenshot.gif)

- [Perge](#perge)
  - [Installation](#installation)
  - [Quick Start](#quick-start)
  - [API](#api)
    - [`Perge`](#perge-1)
      - [`constructor (actorId: string, config: PergeConfig = {})`](#constructor-actorid-string-config-pergeconfig--)
      - [`readonly docSet: Automerge.DocSet<any>;`](#readonly-docset-automergedocsetany)
      - [`readonly peer: Peer`](#readonly-peer-peer)
      - [`connect(id: string, conn?: PeerJS.DataConnection): Peer.DataConnection;`](#connectid-string-conn-peerjsdataconnection-peerdataconnection)
      - [`get<T>(id: string): Doc<T>`](#gettid-string-doct)
      - [`select<T>(id: string): (fn: Function, ...args: any[]) => Automerge.Doc<T>`](#selecttid-string-fn-function-args-any--automergedoct)
      - [`subscribe<T>(idOrSetHandler: string | Automerge.DocSetHandler<T>, callback?: Automerge.ChangeFn<T>): () => void`](#subscribetidorsethandler-string--automergedocsethandlert-callback-automergechangefnt---void)

## Installation

`Perge` has the following dependencies:
```json
{
  "automerge": "^0.14.1",
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

For a more complete example, see [the example page](./example/index.html).

You can run the example with `yarn dev:example` which uses [Parcel](https://parceljs.org/getting_started.html)

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

#### `constructor (actorId: string, config: PergeConfig = {})`

| `actorId` | `string`               | Required. A unique ID used to initialize the PeerJS connection. Automerge should also be initialized with with this value.  

You can further configure `Perge` with the following config shape. All properties are optional.

| Key      | Type                   | Description                                                                                                                               |
| -------- | ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `decode` | `(msg: string) => any` | A function called on a WebRTC string message before it is passed to an `Automerge.Connection` with `receiveMsg`, defaults to `JSON.parse` |
| `encode` | `(msg: any) => string` | A function called on `Automerge.DocSet` change objects before it is sent to a peer, defaults to `JSON.stringify`                          |
| `peer`   | `PeerJS.Peer`          | A preconfigured `PeerJS.Peer` instance.                                                                                                   |
| `docSet` | `Automerge.DocSet<T>`  | An instantiated `Automerge.DocSet` to sync between clients.                                                                               |


#### `readonly docSet: Automerge.DocSet<any>;`

A reference to the synchronized `Automerge.DocSet`, handy to subscribe to state changes with if you don't want to use `Perge.subscribe`:

```js
  docSet.registerHandler((docId, doc) => {
    // REACT TO STATE UPDATES
  })
```

#### `readonly peer: Peer`

A reference to the underlying PeerJS instance, useful for registering lifecycle handlers.

```js
perge.peer.on('error', (err) => {
  // handle
})
```

#### `connect(id: string, conn?: PeerJS.DataConnection): Peer.DataConnection;`

Connects to a `PeerJS` peer with the given ID and sends outgoing `Automerge.DocSet` syncronization messages using the `Automerge.Connection` protocol.

Returns the DataConnection so you can register your own lifecycle callbacks.

Optionally, you can pass an existing `PeerJS` connection.

#### `get<T>(id: string): Doc<T>`

Gets an existing doc with given ID, or initializes a new doc with the client's actor ID.

#### `select<T>(id: string): (fn: Function, ...args: any[]) => Automerge.Doc<T>`

- [Updating Automerge Documents](https://github.com/automerge/automerge#updating-a-document)

Returns a function that applies a given `Automerge` document change method, then sets the returned document on the internal `DocSet` to broadcast changes to connected peers, for example:

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

#### `subscribe<T>(idOrSetHandler: string | Automerge.DocSetHandler<T>, callback?: Automerge.ChangeFn<T>): () => void`

Subscribe to doc updates for either the entire docSet or a specific document ID. Returns a function that, when called, unsubscribes.

```js

const unsubscribeFromAll = instance.subscribe((id, doc) => {
  // do something with the updated doc
})

// subscribe returns an unsubscribe function
const unsubscribeFromFoo = instance.subscribe('foo', (doc) => {
  console.log('foo', doc)
  if (doc.counter.value === 10) {
    unsubscribeFromFoo()
    console.log('unsubscribed from foo!')
  }
})
```