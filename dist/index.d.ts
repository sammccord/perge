import Peer from 'peerjs';
import * as Automerge from 'automerge';
export interface PergeConfig {
    decode?: (msg: string) => any;
    encode?: (msg: any) => string;
    peer?: Peer;
    docSet?: Automerge.DocSet<any>;
}
export default class Perge {
    readonly peer: Peer;
    readonly docSet: Automerge.DocSet<any>;
    private _connections;
    private _actorId;
    private _encode;
    private _decode;
    constructor(actorId: string, config?: PergeConfig);
    connect(id: string, conn?: Peer.DataConnection): Peer.DataConnection;
    select<T>(id: string): (fn: Function, ...args: any[]) => Automerge.Doc<T>;
    subscribe<T>(idOrSetHandler: string | Automerge.DocSetHandler<T>, callback?: Automerge.ChangeFn<T>): () => void;
}
