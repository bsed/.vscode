"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var React = require('react');
var react_dom_1 = require('react-dom');
require('isomorphic-fetch');
var Hello = (function (_super) {
    __extends(Hello, _super);
    function Hello() {
        _super.call(this);
        this.state = { value: "Initial State" };
    }
    Hello.prototype.componentDidMount = function () {
        var _this = this;
        var port = window.location.port;
        var url = "http://localhost:" + port + "/test";
        console.log("componentDidMount");
        fetch(url).then(function (res) {
            console.log("Got it");
            return res.json();
        }).then(function (values) {
            console.log("values=");
            console.log(values);
            console.log("State set");
            _this.setState({ value: values + '' });
        }).catch(function (err) {
            console.log("Error=");
            console.log(err);
            _this.setState({ value: 'Error: ' + err });
        });
    };
    Hello.prototype.render = function () {
        return (<div>Hello world from extension with state = {this.state.value}</div>);
    };
    return Hello;
}(React.Component));
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Hello;
react_dom_1.render(<Hello />, document.getElementById('root'));
//# sourceMappingURL=index.js.map