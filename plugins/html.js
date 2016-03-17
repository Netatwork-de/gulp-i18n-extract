'use strict';

var gutil = require('gulp-util');
var htmlParse = require('html-parse-stringify');
var path = require('path');
var fs = require('fs');

module.exports = function(i18nAttribute) {
	i18nAttribute = i18nAttribute || "t";
	
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
	
	function extractI18N(element, addToken) {
		if(element.type != "tag") return;
					
		if(element.attrs[i18nAttribute]) {			
			var attributeValue = element.attrs[i18nAttribute];
			var i18nKeys = attributeValue.split(';');
						
			i18nKeys.forEach((i18nKey) => extractI18NKey(element, i18nKey, addToken));			
		}
		else if(element.children) {
			element.children.forEach((x) => extractI18N(x, addToken), this);
		}	
	}

	function getInnerText(element) {
		if(!element.children) return null;
		
		let content = "";
		
		element.children.forEach((x) => {
			if(x.type == "text") content += x.content;
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
						
			html.forEach((x) => {
				extractI18N(x, addToken);
			});							
		}
	}
}