/// <reference path="../../../typings/globals/xml2js/index.d.ts" />
'use strict';
var utils_1 = require('./../common/utils');
var helpers_1 = require('./../common/helpers');
var contracts_1 = require('./contracts');
var fs = require('fs');
var xml2js = require('xml2js');
function discoverTests(rootDirectory, testDirectory) {
    return utils_1.execPythonFile('py.test', [testDirectory, '--collect-only'], rootDirectory, false)
        .then(function (output) { return parsePyTestCollectionResult(output); })
        .then(function (testFiles) {
        var flattendFunctions = flattenTestFilesToTestFunctions(testFiles);
        return { testFiles: testFiles, testFunctions: flattendFunctions };
    });
}
exports.discoverTests = discoverTests;
function updateResultsFromLogFiles(tests, outputXmlFile, outputRawFile) {
    return updateResultsFromXmlLogFile(tests, outputXmlFile).then(function () {
        return updateResultsFromRawLogFile(tests, outputXmlFile);
    }).then(function () {
        updateResults(tests);
        return tests;
    });
}
exports.updateResultsFromLogFiles = updateResultsFromLogFiles;
function updateResults(tests) {
    tests.testFiles.forEach(updateResultsUpstream);
}
function updateResultsUpstream(test) {
    var totalTime = 0;
    var allFunctionsPassed = true;
    var allFunctionsRan = true;
    test.functions.forEach(function (fn) {
        totalTime += fn.time;
        if (allFunctionsRan && typeof fn.passed === 'boolean') {
            if (!fn.passed) {
                allFunctionsPassed = false;
            }
        }
        else {
            allFunctionsRan = false;
        }
    });
    var allSuitesPassed = true;
    var allSuitesRan = true;
    test.suites.forEach(function (suite) {
        updateResultsUpstream(suite);
        totalTime += suite.time;
        if (allSuitesRan && typeof suite.passed === 'boolean') {
            if (!suite.passed) {
                allSuitesPassed = false;
            }
        }
        else {
            allSuitesRan = false;
        }
    });
    test.time = totalTime;
    if (allSuitesRan && allFunctionsRan) {
        test.passed = allFunctionsPassed && allSuitesPassed;
        test.status = test.passed ? contracts_1.TestStatus.Idle : contracts_1.TestStatus.Error;
    }
    else {
        test.passed = null;
        test.status = contracts_1.TestStatus.Unknown;
    }
}
function flattenTestFilesToTestFunctions(testFiles) {
    var fns = [];
    testFiles.forEach(function (testFile) {
        // sample test_three (file name without extension and all / replaced with ., meaning this is the package)
        var packageName = convertFileToPackage(testFile.name);
        testFile.functions.forEach(function (fn) {
            fns.push({ testFunction: fn, xmlClassName: packageName, parentTestFile: testFile });
        });
        testFile.suites.forEach(function (suite) {
            flattenTestSuitesToTestFunctions(fns, testFile, suite);
        });
    });
    return fns;
}
function flattenTestSuitesToTestFunctions(list, testFile, testSuite) {
    var fns = [];
    testSuite.functions.forEach(function (fn) {
        fns.push({ testFunction: fn, xmlClassName: testSuite.xmlName, parentTestFile: testFile, parentTestSuite: testSuite });
    });
    // We may have child classes
    testSuite.suites.forEach(function (suite) {
        flattenTestSuitesToTestFunctions(fns, testFile, suite);
    });
}
function updateResultsFromRawLogFile(tests, outputRawFile) {
    var deferred = helpers_1.createDeferred();
    fs.readFile(outputRawFile, 'utf8', function (err, data) {
        if (err) {
            return deferred.reject(err);
        }
        var isSuccess = true;
        var lastTestFunction;
        var errorLines = [];
        var lines = data.split(/\r?\n/g);
        lines.forEach(function (line) {
            if (line.startsWith('.')) {
                if (lastTestFunction && errorLines.length > 0) {
                    lastTestFunction.testFunction.traceback = errorLines.join('\r\n');
                }
                return;
            }
            if (line.startsWith('F')) {
                if (lastTestFunction && errorLines.length > 0) {
                    lastTestFunction.testFunction.traceback = errorLines.join('\r\n');
                }
                var rawTestMethodName_1 = line.substring(1).trim();
                lastTestFunction = tests.testFunctions.find(function (fn) { return fn.testFunction.rawName === rawTestMethodName_1; });
                errorLines = [];
                return;
            }
            errorLines.push(line);
        });
        if (lastTestFunction && errorLines.length > 0) {
            lastTestFunction.testFunction.traceback = errorLines.join('\r\n');
        }
        deferred.resolve();
    });
    return deferred.promise;
}
function updateResultsFromXmlLogFile(tests, outputXmlFile) {
    var deferred = helpers_1.createDeferred();
    fs.readFile(outputXmlFile, 'utf8', function (err, data) {
        if (err) {
            return deferred.reject(err);
        }
        xml2js.parseString(data, function (err, result) {
            if (err) {
                return deferred.reject(err);
            }
            result.testsuite.testcase.foreach(function (testcase) {
                var result = tests.testFunctions.find(function (fn) { return fn.xmlClassName === testcase.$.classname && fn.testFunction.name === testcase.$.name; });
                if (!result) {
                    // oops
                    return;
                }
                result.testFunction.line = parseInt(testcase.$.line);
                result.testFunction.time = parseFloat(testcase.$.time);
                result.testFunction.passed = true;
                result.testFunction.status = contracts_1.TestStatus.Idle;
                if (testcase.failure) {
                    result.testFunction.status = contracts_1.TestStatus.Error;
                    result.testFunction.passed = false;
                    result.testFunction.message = testcase.failure[0].$.message;
                    result.testFunction.traceback = testcase.failure[0]._;
                }
            });
            deferred.resolve();
        });
    });
    return deferred.promise;
}
function convertFileToPackage(filePath) {
    var lastIndex = filePath.lastIndexOf('.');
    return filePath.substring(0, lastIndex).replace(/\//g, '.').replace(/\\/g, '.');
}
var DELIMITER = '\'';
var DEFAULT_CLASS_INDENT = 2;
function parsePyTestCollectionResult(output) {
    var lines = output.split(/\r?\n/g);
    var startIndex = lines.findIndex(function (value) { return value.trim().startsWith('<Module \''); });
    if (startIndex === -1)
        return [];
    lines = lines.slice(startIndex);
    var testFiles = [];
    var parentNodes = [];
    var currentPackage = '';
    lines.forEach(function (line) {
        var trimmedLine = line.trim();
        var name = extractBetweenDelimiters(trimmedLine, DELIMITER, DELIMITER);
        var indent = line.indexOf('<');
        if (trimmedLine.startsWith('<Module \'')) {
            currentPackage = convertFileToPackage(name);
            var testFile = { functions: [], suites: [], name: name, rawName: name, xmlName: currentPackage, time: 0 };
            testFiles.push(testFile);
            parentNodes.push({ indent: indent, item: testFile });
            return;
        }
        var parentNode = findParentOfCurrentItem(indent, parentNodes);
        if (trimmedLine.startsWith('<Class \'') || trimmedLine.startsWith('<UnitTestCase \'')) {
            var isUnitTest = trimmedLine.startsWith('<UnitTestCase \'');
            var rawName = parentNode.item.rawName + ("::" + name);
            var xmlName = parentNode.item.xmlName + ("." + name);
            var testSuite = { name: name, rawName: rawName, functions: [], suites: [], isUnitTest: isUnitTest, isInstance: false, xmlName: xmlName, time: 0 };
            parentNode.item.suites.push(testSuite);
            parentNodes.push({ indent: indent, item: testSuite });
            return;
        }
        if (trimmedLine.startsWith('<Instance \'')) {
            var suite_1 = parentNode.item;
            suite_1.rawName = suite_1.rawName + '::()';
            suite_1.xmlName = suite_1.xmlName + '.()';
            return;
        }
        if (trimmedLine.startsWith('<TestCaseFunction \'') || trimmedLine.startsWith('<Function \'')) {
            var rawName = parentNode.item.rawName + '::' + name;
            var fn = { name: name, rawName: rawName, time: 0 };
            parentNode.item.functions.push(fn);
            return;
        }
    });
    return testFiles;
}
function findParentOfCurrentItem(indentOfCurrentItem, parentNodes) {
    while (parentNodes.length > 0) {
        var parentNode = parentNodes[parentNodes.length - 1];
        if (parentNode.indent < indentOfCurrentItem) {
            return parentNode;
        }
        parentNodes.pop();
        continue;
    }
    return null;
}
function extractBetweenDelimiters(content, startDelimiter, endDelimiter) {
    content = content.substring(content.indexOf(startDelimiter) + 1);
    return content.substring(0, content.lastIndexOf(endDelimiter));
}
/* Sample output from py.test --collect-only
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
      <Class 'Test_NestedClassA'>
        <Instance '()'>
          <Function 'test_nested_class_methodB'>
          <Class 'Test_nested_classB_Of_A'>
            <Instance '()'>
              <Function 'test_d'>
  <Function 'test_username'>
  <Function 'test_parametrized_username[one]'>
  <Function 'test_parametrized_username[two]'>
  <Function 'test_parametrized_username[three]'>
*/
//# sourceMappingURL=pytestUtils.js.map