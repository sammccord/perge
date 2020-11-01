import Peer from 'peerjs'
import { init, Connection, DocSet, Doc, ChangeFn, DocSetHandler, change, undo, redo } from 'automerge'

type AutomergeUpdateMethod = typeof change | typeof undo | typeof redo

export interface PergeConfig {
  decode?: (msg: string) => any
  encode?: (msg: any) => string
  peer?: Peer
  docSet?: DocSet<any>
}

export default class Perge {
  readonly peer: Peer
  readonly docSet: DocSet<any>

  private _connections: { [id: string]: Connection<any> } = {}
  private _actorId: string
  private _encode: (msg: any) => string
  private _decode: (msg: string) => any

  constructor(actorId: string, config: PergeConfig = {}) {
    this._actorId = actorId
    this.peer = config.peer || new Peer(this._actorId)
    this.docSet = config.docSet || new DocSet()
    this._encode = config.encode || JSON.stringify
    this._decode = config.decode || JSON.parse
    this.peer.on('connection', conn => {
      if(!this._connections[conn.peer]) this.connect(conn.peer)
      conn.on('data', msg => {
        this._connections[conn.peer].receiveMsg(this._decode(msg))
      })
    })
  }

  public connect(id: string, conn?: Peer.DataConnection): Peer.DataConnection {
    if (this._connections[id]) return this.peer.connections[id]
    const peer = conn || this.peer.connect(id)
    const connection = this._connections[id] = new Connection(this.docSet, msg => {
      peer.send(this._encode(msg))
    })
    const cleanup = () => {
      if(this._connections[id]) {
        delete this._connections[id]
        connection.close()
      }
    }
    peer.on('close', cleanup)
    peer.on('error', cleanup)
    connection.open()
    return peer
  }

  public get<T>(id: string): Doc<T> {
    return this.docSet.getDoc(id) || init(this._actorId)
  }

  public select<T>(id: string): (changeMethod: AutomergeUpdateMethod, ...args: any[]) => Doc<T> {
    return (changeMethod: Function, ...args: any[]): Doc<T> => {
      const newDoc = changeMethod(this.get(id), ...args)
      this.docSet.setDoc(id, newDoc)
      return newDoc
    }
  }

  public subscribe<T>(idOrSetHandler: string | DocSetHandler<T>, callback?: ChangeFn<T>): () => void {
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
