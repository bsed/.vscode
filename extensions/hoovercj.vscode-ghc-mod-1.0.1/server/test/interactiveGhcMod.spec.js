// 
// Note: This example test is leveraging the Mocha test framework.
// Please refer to their documentation on https://mochajs.org/ for help.
//
// The module 'assert' provides assertion methods from node
'use strict';
const assert = require('assert');
const testLogger_1 = require('./helpers/testLogger');
const interactiveGhcMod_1 = require('../src/ghcModProviders/interactiveGhcMod');
// Defines a Mocha test suite to group tests of similar kind together
// *******************************************************************************
// NOTE: Editing this file with wallabyjs running will start too many processes //
// *******************************************************************************
describe('InteractiveGhcModProcess', function () {
    this.timeout(0);
    let logger = new testLogger_1.TestLogger();
    let ghcMod = interactiveGhcMod_1.InteractiveGhcModProcess.create(null, logger);
    after(() => {
        ghcMod.killProcess();
    });
    describe('#runGhcModCommand', () => {
        describe('Check command', () => {
            let regex = /.+:\d+:\d+:(Warning: |Error: )?.+/;
            it('should return an empty array for valid files', () => {
                let uri = 'test/fixtures/valid.hs';
                let opts = {
                    command: 'check',
                    uri: uri
                };
                return ghcMod.runGhcModCommand(opts).then((lines) => {
                    assert.equal(lines.length, 0);
                });
            });
            it('should return messages without severity in an expected format', () => {
                let uri = 'test/fixtures/empty.hs';
                let opts = {
                    command: 'check',
                    uri: uri
                };
                return ghcMod.runGhcModCommand(opts).then((lines) => {
                    assert.equal(lines.length, 1);
                    assert.ok(regex.test(lines[0]));
                });
            });
            it('should return warnings in an expected format', () => {
                let uri = 'test/fixtures/type.hs';
                let opts = {
                    command: 'check',
                    uri: uri
                };
                return ghcMod.runGhcModCommand(opts).then((lines) => {
                    assert.equal(lines.length, 1);
                    assert.ok(regex.test(lines[0]));
                });
            });
        });
        describe('Type command', () => {
            it('should return the expected output', () => {
                let uri = 'test/fixtures/type.hs';
                let opts = {
                    command: 'type',
                    uri: uri,
                    args: ['3', '8']
                };
                let output = [
                    '3 8 3 9 "a"',
                    '3 1 3 17 "a -> a"'
                ];
                return ghcMod.runGhcModCommand(opts).then((lines) => {
                    assert.deepEqual(lines, output);
                });
            });
        });
        describe('Info command', () => {
            it('should return "Cannot show info" if info unavailable', () => {
                let uri = 'test/fixtures/type.hs';
                let opts = {
                    command: 'info',
                    uri: uri,
                    args: ['bogus']
                };
                let output = ['Cannot show info'];
                return ghcMod.runGhcModCommand(opts).then((lines) => {
                    assert.deepEqual(lines, output);
                });
            });
            it('should return info if available', () => {
                let uri = 'test/fixtures/type.hs';
                let opts = {
                    command: 'info',
                    uri: uri,
                    args: ['Num']
                };
                return ghcMod.runGhcModCommand(opts).then((lines) => {
                    assert.equal(lines.length, 1);
                    assert.equal(lines[0].indexOf('Cannot show info'), -1);
                });
            });
        });
    });
});
//# sourceMappingURL=interactiveGhcMod.spec.js.map