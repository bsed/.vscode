"use strict";
var chai_1 = require("chai");
var spec_generator_1 = require("./spec-generator");
describe('generateSpec in chai style', function () {
    it('should generate spec if given true', function () {
        var result = spec_generator_1.generateSpec(true);
        chai_1.expect(result).be.a('array');
        chai_1.expect(result).be.length(1);
        chai_1.expect(result[0]).be.equal('expect(result).be.equal(true);');
    });
    it('should generate spec if given false', function () {
        var result = spec_generator_1.generateSpec(false);
        chai_1.expect(result).be.a('array');
        chai_1.expect(result).be.length(1);
        chai_1.expect(result[0]).be.equal('expect(result).be.equal(false);');
    });
    it('should generate spec if given defined', function () {
        var result = spec_generator_1.generateSpec('defined', { special: true });
        chai_1.expect(result).be.a('array');
        chai_1.expect(result).be.length(1);
        chai_1.expect(result[0]).be.equal('expect(result).be.exist;');
    });
    it('should generate spec if given undefined', function () {
        var result = spec_generator_1.generateSpec(undefined);
        chai_1.expect(result).be.a('array');
        chai_1.expect(result).be.length(1);
        chai_1.expect(result[0]).be.equal('expect(result).be.undefined;');
    });
    it('should generate spec if given empty object', function () {
        var result = spec_generator_1.generateSpec({});
        chai_1.expect(result).be.a('array');
        chai_1.expect(result).be.length(1);
        chai_1.expect(result[0]).be.equal('expect(result).be.a(\'object\');');
    });
    it('should generate spec if given empty array', function () {
        var result = spec_generator_1.generateSpec([]);
        chai_1.expect(result).be.a('array');
        chai_1.expect(result).be.length(3);
        chai_1.expect(result[0]).be.equal('expect(result).be.a(\'array\');');
        chai_1.expect(result[1]).be.equal('expect(result).be.empty;');
    });
    it('should generate spec if given array of strings', function () {
        var result = spec_generator_1.generateSpec(['a', 'b', 'c']);
        chai_1.expect(result).be.a('array');
        chai_1.expect(result).be.length(6);
        chai_1.expect(result[0]).be.equal('expect(result).be.a(\'array\');');
        chai_1.expect(result[1]).be.equal('expect(result).be.length(3);');
        chai_1.expect(result[2]).be.equal('expect(result[0]).be.equal(\'a\');');
        chai_1.expect(result[3]).be.equal('expect(result[1]).be.equal(\'b\');');
        chai_1.expect(result[4]).be.equal('expect(result[2]).be.equal(\'c\');');
    });
    it('should generate spec if given an object', function () {
        var result = spec_generator_1.generateSpec({ firstName: 'John', lastName: 'Doe' });
        chai_1.expect(result).be.a('array');
        chai_1.expect(result).be.length(7);
        chai_1.expect(result[0]).be.equal('expect(result).be.a(\'object\');');
        chai_1.expect(result[1]).be.equal('expect(result).have.property(\'firstName\');');
        chai_1.expect(result[2]).be.equal('expect(result.firstName).be.equal(\'John\');');
        chai_1.expect(result[3]).be.equal('');
        chai_1.expect(result[4]).be.equal('expect(result).have.property(\'lastName\');');
        chai_1.expect(result[5]).be.equal('expect(result.lastName).be.equal(\'Doe\');');
        chai_1.expect(result[6]).be.equal('');
    });
    it('should generate spec if given an array of objects', function () {
        var result = spec_generator_1.generateSpec([
            { firstName: 'John', lastName: 'Doe' },
            { firstName: 'John', lastName: 'Doe' }
        ]);
        chai_1.expect(result).be.a('array');
        chai_1.expect(result).be.length(16);
        chai_1.expect(result[0]).be.equal('expect(result).be.a(\'array\');');
        chai_1.expect(result[1]).be.equal('expect(result).be.length(2);');
        chai_1.expect(result[2]).be.equal('expect(result[0]).be.a(\'object\');');
        chai_1.expect(result[3]).be.equal('expect(result[0]).have.property(\'firstName\');');
        chai_1.expect(result[4]).be.equal('expect(result[0].firstName).be.equal(\'John\');');
        chai_1.expect(result[5]).be.equal('');
        chai_1.expect(result[6]).be.equal('expect(result[0]).have.property(\'lastName\');');
        chai_1.expect(result[7]).be.equal('expect(result[0].lastName).be.equal(\'Doe\');');
        chai_1.expect(result[8]).be.equal('');
        chai_1.expect(result[9]).be.equal('expect(result[1]).be.a(\'object\');');
        chai_1.expect(result[10]).be.equal('expect(result[1]).have.property(\'firstName\');');
        chai_1.expect(result[11]).be.equal('expect(result[1].firstName).be.equal(\'John\');');
        chai_1.expect(result[12]).be.equal('');
        chai_1.expect(result[13]).be.equal('expect(result[1]).have.property(\'lastName\');');
        chai_1.expect(result[14]).be.equal('expect(result[1].lastName).be.equal(\'Doe\');');
        chai_1.expect(result[15]).be.equal('');
    });
    it('should generate spec if object with inner objects is given', function () {
        var result = spec_generator_1.generateSpec({
            firstName: 'John',
            lastName: 'Doe',
            manager: { firstName: 'John', lastName: 'Doe' }
        });
        chai_1.expect(result).be.a('array');
        chai_1.expect(result).be.length(15);
        chai_1.expect(result[0]).be.equal('expect(result).be.a(\'object\');');
        chai_1.expect(result[1]).be.equal('expect(result).have.property(\'firstName\');');
        chai_1.expect(result[2]).be.equal('expect(result.firstName).be.equal(\'John\');');
        chai_1.expect(result[3]).be.equal('');
        chai_1.expect(result[4]).be.equal('expect(result).have.property(\'lastName\');');
        chai_1.expect(result[5]).be.equal('expect(result.lastName).be.equal(\'Doe\');');
        chai_1.expect(result[6]).be.equal('');
        chai_1.expect(result[7]).be.equal('expect(result).have.property(\'manager\');');
        chai_1.expect(result[8]).be.equal('expect(result.manager).be.a(\'object\');');
        chai_1.expect(result[9]).be.equal('expect(result.manager).have.property(\'firstName\');');
        chai_1.expect(result[10]).be.equal('expect(result.manager.firstName).be.equal(\'John\');');
        chai_1.expect(result[11]).be.equal('');
        chai_1.expect(result[12]).be.equal('expect(result.manager).have.property(\'lastName\');');
        chai_1.expect(result[13]).be.equal('expect(result.manager.lastName).be.equal(\'Doe\');');
        chai_1.expect(result[14]).be.equal('');
    });
    it('should return an empty array if an invalid special string is given', function () {
        var result = spec_generator_1.generateSpec('invalid-string', { special: true });
        chai_1.expect(result).be.a('array');
        chai_1.expect(result).be.length(0);
    });
    it('should quote property name if it contains special character', function () {
        var result = spec_generator_1.generateSpec({ 'Content-Type': 'application/json' });
        chai_1.expect(result).be.a('array');
        chai_1.expect(result).be.length(4);
        chai_1.expect(result[0]).be.equal('expect(result).be.a(\'object\');');
        chai_1.expect(result[1]).be.equal('expect(result).have.property(\'Content-Type\');');
        chai_1.expect(result[2]).be.equal('expect(result[\'Content-Type\']).be.equal(\'application/json\');');
        chai_1.expect(result[3]).be.equal('');
    });
    it('should generate spec if an object with one of the property array is given', function () {
        var result = spec_generator_1.generateSpec({ names: ['John', 'Doe'] });
        chai_1.expect(result).be.a('array');
        chai_1.expect(result).be.length(7);
        chai_1.expect(result[0]).be.equal('expect(result).be.a(\'object\');');
        chai_1.expect(result[1]).be.equal('expect(result).have.property(\'names\');');
        chai_1.expect(result[2]).be.equal('expect(result.names).be.a(\'array\');');
        chai_1.expect(result[3]).be.equal('expect(result.names).be.length(2);');
        chai_1.expect(result[4]).be.equal('expect(result.names[0]).be.equal(\'John\');');
        chai_1.expect(result[5]).be.equal('expect(result.names[1]).be.equal(\'Doe\');');
        chai_1.expect(result[6]).be.equal('');
    });
    it('should not quote the property value if it is not string', function () {
        var result = spec_generator_1.generateSpec({ age: 20, active: false });
        chai_1.expect(result).be.a('array');
        chai_1.expect(result).be.length(7);
        chai_1.expect(result[0]).be.equal('expect(result).be.a(\'object\');');
        chai_1.expect(result[1]).be.equal('expect(result).have.property(\'age\');');
        chai_1.expect(result[2]).be.equal('expect(result.age).be.equal(20);');
        chai_1.expect(result[3]).be.equal('');
        chai_1.expect(result[4]).be.equal('expect(result).have.property(\'active\');');
        chai_1.expect(result[5]).be.equal('expect(result.active).be.equal(false);');
        chai_1.expect(result[6]).be.equal('');
    });
});
describe('generateSpec in chai style with double quote', function () {
    it('should generate spec with double quote if given empty object', function () {
        var result = spec_generator_1.generateSpec({}, { quote: '"' });
        chai_1.expect(result).be.a('array');
        chai_1.expect(result).be.length(1);
        chai_1.expect(result[0]).be.equal('expect(result).be.a("object");');
    });
    it('should generate spec with double quote if given empty array', function () {
        var result = spec_generator_1.generateSpec([], { quote: '"' });
        chai_1.expect(result).be.a('array');
        chai_1.expect(result).be.length(3);
        chai_1.expect(result[0]).be.equal('expect(result).be.a("array");');
        chai_1.expect(result[1]).be.equal('expect(result).be.empty;');
    });
    it('should generate spec with double quote if given array of strings', function () {
        var result = spec_generator_1.generateSpec(['a', 'b', 'c'], { quote: '"' });
        chai_1.expect(result).be.a('array');
        chai_1.expect(result).be.length(6);
        chai_1.expect(result[0]).be.equal('expect(result).be.a("array");');
        chai_1.expect(result[1]).be.equal('expect(result).be.length(3);');
        chai_1.expect(result[2]).be.equal('expect(result[0]).be.equal("a");');
        chai_1.expect(result[3]).be.equal('expect(result[1]).be.equal("b");');
        chai_1.expect(result[4]).be.equal('expect(result[2]).be.equal("c");');
    });
    it('should generate spec with double quote if given an object', function () {
        var result = spec_generator_1.generateSpec({ firstName: 'John', lastName: 'Doe' }, { quote: '"' });
        chai_1.expect(result).be.a('array');
        chai_1.expect(result).be.length(7);
        chai_1.expect(result[0]).be.equal('expect(result).be.a("object");');
        chai_1.expect(result[1]).be.equal('expect(result).have.property("firstName");');
        chai_1.expect(result[2]).be.equal('expect(result.firstName).be.equal("John");');
        chai_1.expect(result[3]).be.equal('');
        chai_1.expect(result[4]).be.equal('expect(result).have.property("lastName");');
        chai_1.expect(result[5]).be.equal('expect(result.lastName).be.equal("Doe");');
        chai_1.expect(result[6]).be.equal('');
    });
    it('should generate spec with double quote if given an array of objects', function () {
        var result = spec_generator_1.generateSpec([
            { firstName: 'John', lastName: 'Doe' },
            { firstName: 'John', lastName: 'Doe' }
        ], { quote: '"' });
        chai_1.expect(result).be.a('array');
        chai_1.expect(result).be.length(16);
        chai_1.expect(result[0]).be.equal('expect(result).be.a("array");');
        chai_1.expect(result[1]).be.equal('expect(result).be.length(2);');
        chai_1.expect(result[2]).be.equal('expect(result[0]).be.a("object");');
        chai_1.expect(result[3]).be.equal('expect(result[0]).have.property("firstName");');
        chai_1.expect(result[4]).be.equal('expect(result[0].firstName).be.equal("John");');
        chai_1.expect(result[5]).be.equal('');
        chai_1.expect(result[6]).be.equal('expect(result[0]).have.property("lastName");');
        chai_1.expect(result[7]).be.equal('expect(result[0].lastName).be.equal("Doe");');
        chai_1.expect(result[8]).be.equal('');
        chai_1.expect(result[9]).be.equal('expect(result[1]).be.a("object");');
        chai_1.expect(result[10]).be.equal('expect(result[1]).have.property("firstName");');
        chai_1.expect(result[11]).be.equal('expect(result[1].firstName).be.equal("John");');
        chai_1.expect(result[12]).be.equal('');
        chai_1.expect(result[13]).be.equal('expect(result[1]).have.property("lastName");');
        chai_1.expect(result[14]).be.equal('expect(result[1].lastName).be.equal("Doe");');
        chai_1.expect(result[15]).be.equal('');
    });
    it('should generate spec with double quote if object with inner objects is given', function () {
        var result = spec_generator_1.generateSpec({
            firstName: 'John',
            lastName: 'Doe',
            manager: { firstName: 'John', lastName: 'Doe' }
        }, { quote: '"' });
        chai_1.expect(result).be.a('array');
        chai_1.expect(result).be.length(15);
        chai_1.expect(result[0]).be.equal('expect(result).be.a("object");');
        chai_1.expect(result[1]).be.equal('expect(result).have.property("firstName");');
        chai_1.expect(result[2]).be.equal('expect(result.firstName).be.equal("John");');
        chai_1.expect(result[3]).be.equal('');
        chai_1.expect(result[4]).be.equal('expect(result).have.property("lastName");');
        chai_1.expect(result[5]).be.equal('expect(result.lastName).be.equal("Doe");');
        chai_1.expect(result[6]).be.equal('');
        chai_1.expect(result[7]).be.equal('expect(result).have.property("manager");');
        chai_1.expect(result[8]).be.equal('expect(result.manager).be.a("object");');
        chai_1.expect(result[9]).be.equal('expect(result.manager).have.property("firstName");');
        chai_1.expect(result[10]).be.equal('expect(result.manager.firstName).be.equal("John");');
        chai_1.expect(result[11]).be.equal('');
        chai_1.expect(result[12]).be.equal('expect(result.manager).have.property("lastName");');
        chai_1.expect(result[13]).be.equal('expect(result.manager.lastName).be.equal("Doe");');
        chai_1.expect(result[14]).be.equal('');
    });
    it('should quote property name with double quote if it contains special character', function () {
        var result = spec_generator_1.generateSpec({ 'Content-Type': 'application/json' }, { quote: '"' });
        chai_1.expect(result).be.a('array');
        chai_1.expect(result).be.length(4);
        chai_1.expect(result[0]).be.equal('expect(result).be.a("object");');
        chai_1.expect(result[1]).be.equal('expect(result).have.property("Content-Type");');
        chai_1.expect(result[2]).be.equal('expect(result["Content-Type"]).be.equal("application/json");');
        chai_1.expect(result[3]).be.equal('');
    });
    it('should generate spec with double quote if an object with one of the property array is given', function () {
        var result = spec_generator_1.generateSpec({ names: ['John', 'Doe'] }, { quote: '"' });
        chai_1.expect(result).be.a('array');
        chai_1.expect(result).be.length(7);
        chai_1.expect(result[0]).be.equal('expect(result).be.a("object");');
        chai_1.expect(result[1]).be.equal('expect(result).have.property("names");');
        chai_1.expect(result[2]).be.equal('expect(result.names).be.a("array");');
        chai_1.expect(result[3]).be.equal('expect(result.names).be.length(2);');
        chai_1.expect(result[4]).be.equal('expect(result.names[0]).be.equal("John");');
        chai_1.expect(result[5]).be.equal('expect(result.names[1]).be.equal("Doe");');
        chai_1.expect(result[6]).be.equal('');
    });
    it('should not quote the property value if it is not string', function () {
        var result = spec_generator_1.generateSpec({ age: 20, active: false }, { quote: '"' });
        chai_1.expect(result).be.a('array');
        chai_1.expect(result).be.length(7);
        chai_1.expect(result[0]).be.equal('expect(result).be.a("object");');
        chai_1.expect(result[1]).be.equal('expect(result).have.property("age");');
        chai_1.expect(result[2]).be.equal('expect(result.age).be.equal(20);');
        chai_1.expect(result[3]).be.equal('');
        chai_1.expect(result[4]).be.equal('expect(result).have.property("active");');
        chai_1.expect(result[5]).be.equal('expect(result.active).be.equal(false);');
        chai_1.expect(result[6]).be.equal('');
    });
});
describe('generateSpec in chai style with semicolon false', function () {
    it('should generate spec without semicolon if given true', function () {
        var result = spec_generator_1.generateSpec(true, { semicolon: false });
        chai_1.expect(result).be.a('array');
        chai_1.expect(result).be.length(1);
        chai_1.expect(result[0]).be.equal('expect(result).be.equal(true)');
    });
    it('should generate spec without semicolon if given false', function () {
        var result = spec_generator_1.generateSpec(false, { semicolon: false });
        chai_1.expect(result).be.a('array');
        chai_1.expect(result).be.length(1);
        chai_1.expect(result[0]).be.equal('expect(result).be.equal(false)');
    });
    it('should generate spec without semicolon if given defined', function () {
        var result = spec_generator_1.generateSpec('defined', { special: true, semicolon: false });
        chai_1.expect(result).be.a('array');
        chai_1.expect(result).be.length(1);
        chai_1.expect(result[0]).be.equal('expect(result).be.exist');
    });
    it('should generate spec without semicolon if given undefined', function () {
        var result = spec_generator_1.generateSpec(undefined, { semicolon: false });
        chai_1.expect(result).be.a('array');
        chai_1.expect(result).be.length(1);
        chai_1.expect(result[0]).be.equal('expect(result).be.undefined');
    });
    it('should generate spec without semicolon if given empty object', function () {
        var result = spec_generator_1.generateSpec({}, { semicolon: false });
        chai_1.expect(result).be.a('array');
        chai_1.expect(result).be.length(1);
        chai_1.expect(result[0]).be.equal('expect(result).be.a(\'object\')');
    });
    it('should generate spec without semicolon if given empty array', function () {
        var result = spec_generator_1.generateSpec([], { semicolon: false });
        chai_1.expect(result).be.a('array');
        chai_1.expect(result).be.length(3);
        chai_1.expect(result[0]).be.equal('expect(result).be.a(\'array\')');
        chai_1.expect(result[1]).be.equal('expect(result).be.empty');
    });
    it('should generate spec without semicolon if given array of strings', function () {
        var result = spec_generator_1.generateSpec(['a', 'b', 'c'], { semicolon: false });
        chai_1.expect(result).be.a('array');
        chai_1.expect(result).be.length(6);
        chai_1.expect(result[0]).be.equal('expect(result).be.a(\'array\')');
        chai_1.expect(result[1]).be.equal('expect(result).be.length(3)');
        chai_1.expect(result[2]).be.equal('expect(result[0]).be.equal(\'a\')');
        chai_1.expect(result[3]).be.equal('expect(result[1]).be.equal(\'b\')');
        chai_1.expect(result[4]).be.equal('expect(result[2]).be.equal(\'c\')');
    });
    it('should generate spec without semicolon if given an object', function () {
        var result = spec_generator_1.generateSpec({ firstName: 'John', lastName: 'Doe' }, { semicolon: false });
        chai_1.expect(result).be.a('array');
        chai_1.expect(result).be.length(7);
        chai_1.expect(result[0]).be.equal('expect(result).be.a(\'object\')');
        chai_1.expect(result[1]).be.equal('expect(result).have.property(\'firstName\')');
        chai_1.expect(result[2]).be.equal('expect(result.firstName).be.equal(\'John\')');
        chai_1.expect(result[3]).be.equal('');
        chai_1.expect(result[4]).be.equal('expect(result).have.property(\'lastName\')');
        chai_1.expect(result[5]).be.equal('expect(result.lastName).be.equal(\'Doe\')');
        chai_1.expect(result[6]).be.equal('');
    });
    it('should generate spec without semicolon if given an array of objects', function () {
        var result = spec_generator_1.generateSpec([
            { firstName: 'John', lastName: 'Doe' },
            { firstName: 'John', lastName: 'Doe' }
        ], { semicolon: false });
        chai_1.expect(result).be.a('array');
        chai_1.expect(result).be.length(16);
        chai_1.expect(result[0]).be.equal('expect(result).be.a(\'array\')');
        chai_1.expect(result[1]).be.equal('expect(result).be.length(2)');
        chai_1.expect(result[2]).be.equal('expect(result[0]).be.a(\'object\')');
        chai_1.expect(result[3]).be.equal('expect(result[0]).have.property(\'firstName\')');
        chai_1.expect(result[4]).be.equal('expect(result[0].firstName).be.equal(\'John\')');
        chai_1.expect(result[5]).be.equal('');
        chai_1.expect(result[6]).be.equal('expect(result[0]).have.property(\'lastName\')');
        chai_1.expect(result[7]).be.equal('expect(result[0].lastName).be.equal(\'Doe\')');
        chai_1.expect(result[8]).be.equal('');
        chai_1.expect(result[9]).be.equal('expect(result[1]).be.a(\'object\')');
        chai_1.expect(result[10]).be.equal('expect(result[1]).have.property(\'firstName\')');
        chai_1.expect(result[11]).be.equal('expect(result[1].firstName).be.equal(\'John\')');
        chai_1.expect(result[12]).be.equal('');
        chai_1.expect(result[13]).be.equal('expect(result[1]).have.property(\'lastName\')');
        chai_1.expect(result[14]).be.equal('expect(result[1].lastName).be.equal(\'Doe\')');
        chai_1.expect(result[15]).be.equal('');
    });
    it('should generate spec without semicolon if object with inner objects is given', function () {
        var result = spec_generator_1.generateSpec({
            firstName: 'John',
            lastName: 'Doe',
            manager: { firstName: 'John', lastName: 'Doe' }
        }, { semicolon: false });
        chai_1.expect(result).be.a('array');
        chai_1.expect(result).be.length(15);
        chai_1.expect(result[0]).be.equal('expect(result).be.a(\'object\')');
        chai_1.expect(result[1]).be.equal('expect(result).have.property(\'firstName\')');
        chai_1.expect(result[2]).be.equal('expect(result.firstName).be.equal(\'John\')');
        chai_1.expect(result[3]).be.equal('');
        chai_1.expect(result[4]).be.equal('expect(result).have.property(\'lastName\')');
        chai_1.expect(result[5]).be.equal('expect(result.lastName).be.equal(\'Doe\')');
        chai_1.expect(result[6]).be.equal('');
        chai_1.expect(result[7]).be.equal('expect(result).have.property(\'manager\')');
        chai_1.expect(result[8]).be.equal('expect(result.manager).be.a(\'object\')');
        chai_1.expect(result[9]).be.equal('expect(result.manager).have.property(\'firstName\')');
        chai_1.expect(result[10]).be.equal('expect(result.manager.firstName).be.equal(\'John\')');
        chai_1.expect(result[11]).be.equal('');
        chai_1.expect(result[12]).be.equal('expect(result.manager).have.property(\'lastName\')');
        chai_1.expect(result[13]).be.equal('expect(result.manager.lastName).be.equal(\'Doe\')');
        chai_1.expect(result[14]).be.equal('');
    });
    it('should quote property name without semicolon if it contains special character', function () {
        var result = spec_generator_1.generateSpec({ 'Content-Type': 'application/json' }, { semicolon: false });
        chai_1.expect(result).be.a('array');
        chai_1.expect(result).be.length(4);
        chai_1.expect(result[0]).be.equal('expect(result).be.a(\'object\')');
        chai_1.expect(result[1]).be.equal('expect(result).have.property(\'Content-Type\')');
        chai_1.expect(result[2]).be.equal('expect(result[\'Content-Type\']).be.equal(\'application/json\')');
        chai_1.expect(result[3]).be.equal('');
    });
    it('should generate spec without semicolon if an object with one of the property array is given', function () {
        var result = spec_generator_1.generateSpec({ names: ['John', 'Doe'] }, { semicolon: false });
        chai_1.expect(result).be.a('array');
        chai_1.expect(result).be.length(7);
        chai_1.expect(result[0]).be.equal('expect(result).be.a(\'object\')');
        chai_1.expect(result[1]).be.equal('expect(result).have.property(\'names\')');
        chai_1.expect(result[2]).be.equal('expect(result.names).be.a(\'array\')');
        chai_1.expect(result[3]).be.equal('expect(result.names).be.length(2)');
        chai_1.expect(result[4]).be.equal('expect(result.names[0]).be.equal(\'John\')');
        chai_1.expect(result[5]).be.equal('expect(result.names[1]).be.equal(\'Doe\')');
        chai_1.expect(result[6]).be.equal('');
    });
});
//# sourceMappingURL=spec-generator-chai.spec.1.js.map