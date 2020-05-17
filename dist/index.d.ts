import Peer from 'peerjs';
import * as Automerge from 'automerge';
export interface PergeConfig<T> {
    decode?: (msg: string) => any;
    encode?: (msg: any) => string;
    peerInstance?: Peer;
    docSet?: Automerge.DocSet<T>;
}
declare type DocHandler<T> = (doc: Automerge.Doc<T>) => void;
export default class Perge<T> {
    private _connections;
    private _actorId;
    private _docSet;
    private _peerInstance;
    private _encode;
    private _decode;
    constructor(actorId: string, config?: PergeConfig<T>);
    get docSet(): Automerge.DocSet<T>;
    connect(id: string, conn?: Peer.DataConnection): void;
    select(id: string): (fn: Function, ...args: any[]) => Automerge.Doc<T>;
    subscribe(idOrSetHandler: string | Automerge.DocSetHandler<T>, docHandler?: DocHandler<T>): () => void;
}
export {};
