'use strict';
const xpath = require('xpath');
let DOMParser = require('xmldom').DOMParser;
class XPathEvaluator {
    static evaluate(query, xml, ignoreDefaultNamespace) {
        if (ignoreDefaultNamespace) {
            xml = xml.replace(/xmlns=".+"/g, (match) => {
                return match.replace(/xmlns/g, 'xmlns:default');
            });
        }
        let nodes = new Array();
        let xdoc = new DOMParser().parseFromString(xml, 'text/xml');
        let resolver = xpath.createNSResolver(xdoc);
        let expression = xpath.createExpression(query, resolver);
        let result = expression.evaluate(xdoc, xpath.XPathResult.ORDERED_NODE_ITERATOR_TYPE);
        let node;
        while (node = result.iterateNext()) {
            nodes.push(node);
        }
        return nodes;
    }
}
exports.XPathEvaluator = XPathEvaluator;
