import Peer from 'peerjs'
import * as Automerge from 'automerge'

export interface PergeConfig {
  decode?: (msg: string) => any
  encode?: (msg: any) => string
  peer?: Peer
  docSet?: Automerge.DocSet<any>
}

export default class Perge {
  readonly peer: Peer
  readonly docSet: Automerge.DocSet<any>

  private _connections: { [id: string]: Automerge.Connection<any> } = {}
  private _actorId: string
  private _encode: (msg: any) => string
  private _decode: (msg: string) => any

  constructor(actorId: string, config: PergeConfig = {}) {
    this._actorId = actorId
    this.peer = config.peer || new Peer(this._actorId)
    this.docSet = config.docSet || new Automerge.DocSet()
    this._encode = config.encode || JSON.stringify
    this._decode = config.decode || JSON.parse
    this.peer.on('connection', conn => {
      conn.on('data', msg => {
        this._connections[conn.peer].receiveMsg(this._decode(msg))
      })
    })
  }

  public connect(id: string, conn?: Peer.DataConnection): Peer.DataConnection {
    if (this._connections[id]) return this.peer.connections[id]
    const peer = conn || this.peer.connect(id)
    const connection = this._connections[id] = new Automerge.Connection(this.docSet, msg => {
      peer.send(this._encode(msg))
    })
    peer.on('disconnected', () => {
      connection.close()
      delete this._connections[id]
    })
    connection.open()
    return peer
  }

  public select<T>(id: string): (fn: Function, ...args: any[]) => Automerge.Doc<T> {
    const doc = this.docSet.getDoc(id) || Automerge.init(this._actorId)
    return (fn: Function, ...args: any[]): Automerge.Doc<T> => {
      const newDoc = fn(doc, ...args)
      this.docSet.setDoc(id, newDoc)
      return newDoc
    }
  }

  public subscribe<T>(idOrSetHandler: string | Automerge.DocSetHandler<T>, callback?: Automerge.ChangeFn<T>): () => void {
    if (typeof idOrSetHandler === 'function') {
      this.docSet.registerHandler(idOrSetHandler)
      return () => this.docSet.unregisterHandler(idOrSetHandler)
    }
    if (typeof idOrSetHandler === 'string' && !!callback) {
      const handler = (docId: string, doc: T) => {
        if (docId === idOrSetHandler) callback(doc)
      }
      this.docSet.registerHandler(handler)
      return () => this.docSet.unregisterHandler(handler)
    }
    return () => { }
  }
}
