'use strict';
var utils_1 = require('./../common/utils');
var STANDALONE_FUNCTION_INDENT = 2;
/* Sample output for --collect-only
    <Module 'test_another.py'>
        <Class 'Test_CheckMyApp'>
            <Instance '()'>
            <Function 'test_simple_check'>
            <Function 'test_complex_check'>
    <Module 'test_one.py'>
        <UnitTestCase 'Test_test1'>
            <TestCaseFunction 'test_A'>
            <TestCaseFunction 'test_B'>
    <Module 'test_two.py'>
        <UnitTestCase 'Test_test1'>
            <TestCaseFunction 'test_A2'>
            <TestCaseFunction 'test_B2'>
    <Module 'testPasswords/test_Pwd.py'>
        <UnitTestCase 'Test_Pwd'>
            <TestCaseFunction 'test_APwd'>
            <TestCaseFunction 'test_BPwd'>
    <Module 'testPasswords/test_multi.py'>
        <Class 'Test_CheckMyApp'>
            <Instance '()'>
            <Function 'test_simple_check'>
            <Function 'test_complex_check'>
    <Function 'test_username'>
    <Function 'test_parametrized_username[one]'>
    <Function 'test_parametrized_username[two]'>
    <Function 'test_parametrized_username[three]'>
*/
function discoverTests(rootDirectory, testDirectory) {
    if (testDirectory === void 0) { testDirectory = "tests"; }
    return runPyTestAndCollectFixtures(rootDirectory, testDirectory).then(function (output) {
        return parsePyTestCollectResponse(output);
    });
}
exports.discoverTests = discoverTests;
function runPyTestAndCollectFixtures(rootDirectory, testDirectory) {
    return utils_1.execPythonFile('py.test', [testDirectory, ' --collect-only'], rootDirectory);
}
function parsePyTestCollectResponse(collectResponse) {
    var lines = collectResponse.split(/\r?\n/g);
    var startIndex = lines.findIndex(function (line) { return line.startsWith('<Module '); });
    if (startIndex === -1) {
        return [];
    }
    lines = lines.filter(function (value, index) { return index >= startIndex; });
    var classIndent = 0;
    var testFiles = [];
    lines.forEach(function (line) {
        var trimmedLine = line.trim();
        var name = extractBetweenDelimiters(trimmedLine, '\'', '\'');
        if (trimmedLine.startsWith('<Module ')) {
            testFiles.push({ fixtures: [], path: name, functions: [] });
            return;
        }
        var testFile = testFiles[testFiles.length - 1];
        if (trimmedLine.startsWith('<Class ') || trimmedLine.startsWith('<UnitTestCase ')) {
            classIndent = line.indexOf('<');
            testFile.fixtures.push({ name: name, methods: [] });
            return;
        }
        if (trimmedLine.startsWith('<TestCaseFunction ') || trimmedLine.startsWith('<Function ')) {
            // We need to determine if this is a standalone test function
            var isStandAloneFunction = false;
            if (classIndent > 0) {
                isStandAloneFunction = line.indexOf('<') === classIndent;
            }
            else {
                // We haven't had any test classes so far
                // Lets assume that standalone functions will be indented at 2
                isStandAloneFunction = line.indexOf('<') === STANDALONE_FUNCTION_INDENT;
            }
            if (isStandAloneFunction) {
                testFile.functions.push(name);
            }
            else {
                testFile.fixtures[testFile.fixtures.length - 1].methods.push(name);
            }
            return;
        }
        if (trimmedLine.startsWith('<Instance ')) {
            return;
        }
    });
    return testFiles;
}
function extractBetweenDelimiters(value, start, end) {
    value = value.substring(value.indexOf(start) + 1);
    return value.substring(0, value.lastIndexOf(end));
}
//# sourceMappingURL=testUtils.js.map