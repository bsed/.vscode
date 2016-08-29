"use strict";
"use strict";
class LocalSetting {
    constructor() {
        this.Token = null;
        this.Gist = null;
        this.lastUpload = null;
        this.firstTime = true; // to open the toturial first time when used any command.
        this.autoSync = false;
        this.lastDownload = null;
        this.ProxyIP = null;
        this.ProxyPort = null;
        this.Version = null;
        this.showSummary = true;
    }
}
exports.LocalSetting = LocalSetting;
class CloudSetting {
    constructor() {
        this.lastUpload = null;
    }
}
exports.CloudSetting = CloudSetting;
class OldSetting {
    constructor() {
        this.Token = null;
        this.Gist = null;
        this.Migrated = true;
        this.ProxyIP = null;
        this.ProxyPort = null;
    }
}
exports.OldSetting = OldSetting;
//# sourceMappingURL=setting.js.map