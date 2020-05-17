import Peer from 'peerjs'
import * as Automerge from 'automerge'

export interface PergeConfig<T> {
  decode?: (msg: string) => any
  encode?: (msg: any) => string
  peerInstance?: Peer
  docSet?: Automerge.DocSet<T>
}

type DocHandler<T> = (doc: Automerge.Doc<T>) => void

export default class Perge<T> {
  private _connections: { [id: string]: Automerge.Connection<T> } = {}

  private _actorId: string
  private _docSet: Automerge.DocSet<T>
  private _peerInstance: Peer
  private _encode: (msg: any) => string
  private _decode: (msg: string) => any

  constructor(actorId: string, config: PergeConfig<T> = {}) {
    this._actorId = actorId
    this._peerInstance = config.peerInstance || new Peer(this._actorId)
    this._docSet = config.docSet || new Automerge.DocSet()
    this._encode = config.encode || JSON.stringify
    this._decode = config.decode || JSON.parse
    this._peerInstance.on('connection', conn => {
      conn.on('data', msg => {
        this._connections[conn.peer].receiveMsg(this._decode(msg))
      })
    })
  }

  public get docSet() {
    return this._docSet
  }

  public connect(id: string, conn?: Peer.DataConnection): void {
    if (this._connections[id]) return
    console.log(id, conn)
    const peer = conn || this._peerInstance.connect(id)
    const connection = this._connections[id] = new Automerge.Connection(this._docSet, msg => {
      peer.send(this._encode(msg))
    })
    peer.on('disconnected', () => {
      connection.close()
      delete this._connections[id]
    })
    connection.open()
  }

  public select(id: string): (fn: Function, ...args: any[]) => Automerge.Doc<T> {
    const doc = this.docSet.getDoc(id) || Automerge.init(this._actorId)
    return (fn: Function, ...args: any[]): Automerge.Doc<T> => {
      const newDoc = fn(doc, ...args)
      this.docSet.setDoc(id, newDoc)
      return newDoc
    }
  }

  public subscribe(idOrSetHandler: string | Automerge.DocSetHandler<T>, docHandler?: DocHandler<T>): () => void {
    if (typeof idOrSetHandler === 'function') {
      this.docSet.registerHandler(idOrSetHandler)
      return () => this.docSet.unregisterHandler(idOrSetHandler)
    }
    if (typeof idOrSetHandler === 'string') {
      const handler = (docId: string, doc: Automerge.Doc<T>) => {
        if (docId === idOrSetHandler) docHandler(doc)
      }
      this.docSet.registerHandler(handler)
      return () => this.docSet.unregisterHandler(handler)
    }
  }
}
