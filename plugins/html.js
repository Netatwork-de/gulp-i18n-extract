'use strict';

var gutil = require('gulp-util');
var htmlParse = require('parse5');
var path = require('path');
var fs = require('fs');

var TreeAdapter = htmlParse.treeAdapters.default;

module.exports = function(i18nAttributeName) {
	i18nAttributeName = i18nAttributeName || "t";
	
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
			value = element.attrs[targetAttribute];
		}
		
		if(value) {
			addToken(i18nKey, value);
		}
	}
	
	function getI18NAttribute(element) {
		if(!TreeAdapter.isElementNode(element) || !element.attrs) return null;
		
		return element.attrs.find((x) => x.name == i18nAttributeName);				
	}
	
	function extractI18N(element, addToken) {
		
		var i18nAttribute = getI18NAttribute(element);	
		if(i18nAttribute) {	
			
			var attributeValue = i18nAttribute.value;
			var i18nKeys = attributeValue.split(';');
						
			i18nKeys.forEach((i18nKey) => extractI18NKey(element, i18nKey, addToken));			
		}
		else if(element.childNodes && element.childNodes.length > 0) {
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
		
		return content;
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