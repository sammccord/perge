import Peer from 'peerjs';
import { DocSet, Doc, ChangeFn, DocSetHandler, change, undo, redo } from 'automerge';
declare type AutomergeUpdateMethod = typeof change | typeof undo | typeof redo;
export interface PergeConfig {
    decode?: (msg: string) => any;
    encode?: (msg: any) => string;
    peer?: Peer;
    docSet?: DocSet<any>;
}
export default class Perge {
    readonly peer: Peer;
    readonly docSet: DocSet<any>;
    private _connections;
    private _actorId;
    private _encode;
    private _decode;
    constructor(actorId: string, config?: PergeConfig);
    connect(id: string, conn?: Peer.DataConnection): Peer.DataConnection;
    get<T>(id: string): Doc<T>;
    select<T>(id: string): (changeMethod: AutomergeUpdateMethod, ...args: any[]) => Doc<T>;
    subscribe<T>(idOrSetHandler: string | DocSetHandler<T>, callback?: ChangeFn<T>): () => void;
}
export {};
