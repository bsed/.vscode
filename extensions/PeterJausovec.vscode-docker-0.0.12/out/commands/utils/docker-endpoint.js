"use strict";
const Docker = require("dockerode");
var DockerEngineType;
(function (DockerEngineType) {
    DockerEngineType[DockerEngineType["Linux"] = 0] = "Linux";
    DockerEngineType[DockerEngineType["Windows"] = 1] = "Windows";
})(DockerEngineType = exports.DockerEngineType || (exports.DockerEngineType = {}));
class DockerClient {
    constructor() {
        if (process.platform === 'win32') {
            this.endPoint = new Docker({ socketPath: "//./pipe/docker_engine" });
        }
        else {
            this.endPoint = new Docker({ socketPath: '/var/run/docker.sock' });
        }
    }
    getContainerDescriptors() {
        return new Promise((resolve, reject) => {
            this.endPoint.listContainers((err, containers) => {
                if (err) {
                    return reject(err);
                }
                return resolve(containers);
            });
        });
    }
    ;
    getImageDescriptors() {
        return new Promise((resolve, reject) => {
            this.endPoint.listImages((err, images) => {
                if (err) {
                    return reject(err);
                }
                return resolve(images);
            });
        });
    }
    ;
    getContainer(id) {
        return this.endPoint.getContainer(id);
    }
    getEngineType() {
        if (process.platform === 'win32') {
            return new Promise((resolve, reject) => {
                this.endPoint.info((error, info) => {
                    if (error) {
                        return reject(error);
                    }
                    return resolve(info.OSType === "windows" ? DockerEngineType.Windows : DockerEngineType.Linux);
                });
            });
        }
        ;
        // On Linux or macOS, this can only ever be linux,
        // so short-circuit the Docker call entirely.
        return Promise.resolve(DockerEngineType.Linux);
    }
    getImage(id) {
        return this.endPoint.getImage(id);
    }
}
exports.docker = new DockerClient();
//# sourceMappingURL=docker-endpoint.js.map