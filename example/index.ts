import Perge from '../src/index'
import { change } from 'automerge'
const docs = document.getElementById('docs')
const actorEl = document.getElementById('actorId')
const incrEl = document.getElementById('increment')
const docIdEl = document.getElementById('docId')
const peerForm = document.getElementById('peerForm')
const peersEl = document.getElementById('peers')

const getDocId = () => docIdEl.value || 'default'

// Unique ID for this user
const actorId = cuid()
actorEl.innerText = actorId

// Instantiate a PeerJS connection
const peer = window.peer = new Peer(actorId)

// Instantiate an Automerge.DocSet
let docSet = window.docSet = new Automerge.DocSet()

// Instantiate Perge library
const instance = window.instance = new Perge(actorId, {
  decode: JSON.parse, // msgpack or protobuf would also be a good option
  encode: JSON.stringify,
  peer: peer,
  docSet: docSet
})

// This handler gets invoked whenever the DocSet is updated, useful for re-rendering views.
instance.subscribe(() => {
  docs.innerText = JSON.stringify(docSet.docs, null, 2)
})

// subscribe returns an unsubscribe function
const unsubscribeFromFoo = instance.subscribe('foo', (doc) => {
  console.log('foo', doc)
  if (doc.counter.value === 10) {
    unsubscribeFromFoo()
    console.log('unsubscribed from foo!')
  }
})

incrEl.onclick = () => {
  const id = getDocId()
  // Update the document
  const doc = instance.select(id)(change, d => {
    d.now = new Date().valueOf()
  })
  // Automerge.change(doc, d => {
  //   if (!d.counter) d.counter = new Automerge.Counter()
  //   else d.counter.increment()
  // })
}

peerForm.onsubmit = (e) => {
  e.preventDefault()
  const formData = new FormData(peerForm)
  const peerId = formData.get('peerId')
  instance.connect(peerId, peer.connect(peerId))
  peersEl.innerText = JSON.stringify(
    Array.from(peer._connections.keys()
    ), null, 2)
}