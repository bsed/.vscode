/* --------------------------------------------------------------------------------------------
 * Copyright (c) Ioannis Kappas. All rights reserved.
 * Licensed under the MIT License. See License.md in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
"use strict";
var vscode_1 = require("vscode");
var Timer = (function () {
    /**
     * Class constructor.
     *
     * @return self.
     */
    function Timer(tick) {
        /**
         * Frequency of elapse event of the timer in millisecond
         */
        this.interval = 1000;
        /**
         * A boolean flag indicating whether the timer is enabled.
         *
         * @var boolean
         */
        this.enable = false;
        // Member variable: Hold interval id of the timer
        this.handle = 0;
        this.tick = tick;
    }
    /**
     * Start the timer.
     */
    Timer.prototype.start = function () {
        var _this = this;
        this.enable = true;
        if (this.enable) {
            this.handle = setInterval(function () {
                _this.tick();
            }, this.interval);
        }
    };
    ;
    /**
     * Stop the timer.
     */
    Timer.prototype.stop = function () {
        this.enable = false;
        if (this.handle) {
            clearInterval(this.handle);
        }
    };
    ;
    /**
     * Dispose the timer.
     */
    Timer.prototype.dispose = function () {
        if (this.handle) {
            clearInterval(this.handle);
        }
    };
    return Timer;
}());
;
var PhpcsStatus = (function () {
    function PhpcsStatus() {
        this.documents = [];
        this.processing = 0;
        this.spinnerIndex = 0;
        this.spinnerSquense = ["|", "/", "-", "\\"];
    }
    PhpcsStatus.prototype.startProcessing = function (uri) {
        this.documents.push(uri);
        this.processing += 1;
        this.getTimer().start();
        this.getOutputChannel().appendLine("linting started on: " + uri);
        this.getStatusBarItem().show();
    };
    PhpcsStatus.prototype.endProcessing = function (uri) {
        this.processing -= 1;
        var index = this.documents.indexOf(uri);
        if (index !== undefined) {
            this.documents.slice(index, 1);
            this.getOutputChannel().appendLine("linting completed on: " + uri);
        }
        if (this.processing === 0) {
            this.getTimer().stop();
            this.getStatusBarItem().hide();
            this.updateStatusText();
        }
    };
    PhpcsStatus.prototype.updateStatusText = function () {
        var sbar = this.getStatusBarItem();
        var count = this.processing;
        if (count > 0) {
            var spinner = this.getNextSpinnerChar();
            sbar.text = count === 1 ? "$(eye) phpcs is linting 1 document ... " + spinner : "$(eye) phpcs is linting " + count + " documents ... " + spinner;
        }
        else {
            sbar.text = "";
        }
    };
    PhpcsStatus.prototype.getNextSpinnerChar = function () {
        var spinnerChar = this.spinnerSquense[this.spinnerIndex];
        this.spinnerIndex += 1;
        if (this.spinnerIndex > this.spinnerSquense.length - 1) {
            this.spinnerIndex = 0;
        }
        return spinnerChar;
    };
    PhpcsStatus.prototype.getTimer = function () {
        var _this = this;
        if (!this.timer) {
            this.timer = new Timer(function () {
                _this.updateStatusText();
            });
            this.timer.interval = 100;
        }
        return this.timer;
    };
    PhpcsStatus.prototype.getStatusBarItem = function () {
        // Create as needed
        if (!this.statusBarItem) {
            this.statusBarItem = vscode_1.window.createStatusBarItem(vscode_1.StatusBarAlignment.Left);
        }
        return this.statusBarItem;
    };
    PhpcsStatus.prototype.getOutputChannel = function () {
        if (!this.outputChannel) {
            this.outputChannel = vscode_1.window.createOutputChannel("phpcs");
        }
        return this.outputChannel;
    };
    PhpcsStatus.prototype.dispose = function () {
        if (this.statusBarItem) {
            this.statusBarItem.dispose();
        }
        if (this.timer) {
            this.timer.dispose();
        }
    };
    return PhpcsStatus;
}());
exports.PhpcsStatus = PhpcsStatus;
//# sourceMappingURL=status.js.map