'use strict';

var htmlParse = require('parse5');
var path = require('path');
var fs = require('fs');

var TreeAdapter = htmlParse.treeAdapters.default;

module.exports = function(i18nAttributeName, keyIgnoreFunction) {
	i18nAttributeName = i18nAttributeName || "t";
	const isIgnored = keyIgnoreFunction || (() => false);
	
	function extractI18NKey(element, i18nKey, addToken) {
		var targetAttribute = "text";
		
		var hasAttribute = i18nKey.indexOf("]");
		if(hasAttribute > 0) {
			targetAttribute = i18nKey.substr(1,hasAttribute-1);
			i18nKey = i18nKey.substr(hasAttribute+1);
		}
						
		let value;
		if(targetAttribute == "text" || targetAttribute == "html") {
			value = getInnerText(element);
		}
		else {
			const attrib = getAttribute(element, targetAttribute);
			if(attrib) {
				value = attrib.value;
			}
		}
		
		addToken(i18nKey, value);
	}
	
	function getAttribute(element, name) {
		if(!TreeAdapter.isElementNode(element) || !element.attrs) return null;
		
		return element.attrs.find((x) => x.name == name);				
	}
		
	function extractI18N(element, addToken) {
		
		var i18nAttribute = getAttribute(element,i18nAttributeName);	
		
		if(i18nAttribute) {	
			
			var attributeValue = i18nAttribute.value;
			
			if(!isIgnored(attributeValue)) {
				var i18nKeys = attributeValue.split(';');						
				i18nKeys.forEach((i18nKey) => extractI18NKey(element, i18nKey, addToken));	
			}
		}
		
		if(element.childNodes && element.childNodes.length > 0) {
			element.childNodes.forEach((x) => extractI18N(x, addToken), this);
		}
		else if(element.content) {
			extractI18N(element.content, addToken);
		}
	}

	function getInnerText(element) {
		if(!element.childNodes) return null;
		
		let content = "";
		
		element.childNodes.forEach((x) => {
			if(TreeAdapter.isTextNode(x)) content += TreeAdapter.getTextNodeContent(x);
		});
		
		return content.replace(/\s+/g, ' ').trim();
	}

	return {		
		canHandle : function(fileName) {
			let ext = path.extname(fileName);
			
			return ext == ".html" || ext == ".htm";
		},
		
		parse: function (file, addToken) {
			var html = htmlParse.parse(file.contents.toString());
			if(!html) return;
			
			extractI18N(html, addToken);							
		}
	}
}