"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const log_1 = require("../../util/log");
const pendingRequests_1 = require("./pendingRequests");
let log = log_1.Log.create('ObjectGripActorProxy');
class ObjectGripActorProxy {
    constructor(grip, connection) {
        this.grip = grip;
        this.connection = connection;
        this.pendingThreadGripRequest = undefined;
        this.threadGripPromise = undefined;
        this.pendingPrototypeAndPropertiesRequests = new pendingRequests_1.PendingRequests();
        this.connection.register(this);
    }
    get name() {
        return this.grip.actor;
    }
    extendLifetime() {
        if (this.threadGripPromise) {
            return this.threadGripPromise;
        }
        if (log.isDebugEnabled()) {
            log.debug(`Extending lifetime of ${this.name}`);
        }
        this.threadGripPromise = new Promise((resolve, reject) => {
            this.pendingThreadGripRequest = { resolve, reject };
            this.connection.sendRequest({ to: this.name, type: 'threadGrip' });
        });
        return this.threadGripPromise;
    }
    fetchPrototypeAndProperties() {
        if (log.isDebugEnabled()) {
            log.debug(`Fetching prototype and properties from ${this.name}`);
        }
        return new Promise((resolve, reject) => {
            this.pendingPrototypeAndPropertiesRequests.enqueue({ resolve, reject });
            this.connection.sendRequest({ to: this.name, type: 'prototypeAndProperties' });
        });
    }
    dispose() {
        this.connection.unregister(this);
    }
    receiveResponse(response) {
        if ((response['prototype'] !== undefined) && (response['ownProperties'] !== undefined)) {
            if (log.isDebugEnabled()) {
                log.debug(`Prototype and properties fetched from ${this.name}`);
            }
            this.pendingPrototypeAndPropertiesRequests.resolveOne(response);
        }
        else if (Object.keys(response).length === 1) {
            log.debug('Received response to threadGrip request');
            if (this.pendingThreadGripRequest) {
                this.pendingThreadGripRequest.resolve(undefined);
                this.pendingThreadGripRequest = undefined;
            }
            else {
                log.warn('Received threadGrip response without pending request');
            }
        }
        else if (response['error'] === 'noSuchActor') {
            log.warn(`No such actor ${this.grip.actor} - you will not be able to inspect this value; this is probably due to Firefox bug #1249962`);
            this.pendingPrototypeAndPropertiesRequests.rejectAll('No such actor');
            if (this.pendingThreadGripRequest) {
                this.pendingThreadGripRequest.resolve(undefined);
                this.pendingThreadGripRequest = undefined;
            }
        }
        else {
            log.warn("Unknown message from ObjectGripActor: " + JSON.stringify(response));
        }
    }
}
exports.ObjectGripActorProxy = ObjectGripActorProxy;
//# sourceMappingURL=objectGrip.js.map