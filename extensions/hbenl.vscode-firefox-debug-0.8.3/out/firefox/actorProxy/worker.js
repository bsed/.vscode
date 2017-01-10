"use strict";
const log_1 = require("../../util/log");
const events_1 = require("events");
const index_1 = require("../index");
let log = log_1.Log.create('WorkerActorProxy');
class WorkerActorProxy extends events_1.EventEmitter {
    constructor(_name, _url, connection) {
        super();
        this._name = _name;
        this._url = _url;
        this.connection = connection;
        this.connection.register(this);
    }
    get name() {
        return this._name;
    }
    get url() {
        return this._url;
    }
    attach() {
        if (!this.attachPromise) {
            log.debug(`Attaching worker ${this.name}`);
            this.attachPromise = new Promise((resolve, reject) => {
                this.pendingAttachRequest = { resolve, reject };
                this.connection.sendRequest({ to: this.name, type: 'attach' });
            });
        }
        else {
            log.warn('Attaching this worker has already been requested!');
        }
        return this.attachPromise;
    }
    connect() {
        if (!this.connectPromise) {
            log.debug(`Attaching worker ${this.name}`);
            this.connectPromise = new Promise((resolve, reject) => {
                this.pendingConnectRequest = { resolve, reject };
                this.connection.sendRequest({
                    to: this.name, type: 'connect',
                    options: { useSourceMaps: true }
                });
            });
        }
        else {
            log.warn('Connecting this worker has already been requested!');
        }
        return this.connectPromise;
    }
    receiveResponse(response) {
        if (response['type'] === 'attached') {
            log.debug(`Worker ${this.name} attached`);
            let attachedResponse = response;
            if (this.pendingAttachRequest) {
                this.pendingAttachRequest.resolve(attachedResponse.url);
                this.pendingAttachRequest = undefined;
            }
            else {
                log.warn(`Worker ${this.name} attached without a corresponding request`);
            }
        }
        else if (response['type'] === 'connected') {
            log.debug(`Worker ${this.name} attached`);
            let connectedResponse = response;
            if (this.pendingConnectRequest) {
                let threadActor = this.connection.getOrCreate(connectedResponse.threadActor, () => new index_1.ThreadActorProxy(connectedResponse.threadActor, this.connection));
                this.pendingConnectRequest.resolve(threadActor);
                this.pendingConnectRequest = undefined;
            }
            else {
                log.warn(`Worker ${this.name} connected without a corresponding request`);
            }
        }
        else if (response['type'] === 'close') {
            log.debug(`Worker ${this.name} closed`);
            this.emit('close');
        }
        else {
            if (response['type'] === 'newSource') {
                log.debug(`Ignored newSource event from worker ${this.name}`);
            }
            else {
                log.warn("Unknown message from WorkerActor: " + JSON.stringify(response));
            }
        }
    }
    onClose(cb) {
        this.on('close', cb);
    }
}
exports.WorkerActorProxy = WorkerActorProxy;
//# sourceMappingURL=worker.js.map