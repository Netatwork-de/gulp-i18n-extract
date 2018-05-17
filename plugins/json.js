'use strict';

var path = require('path');

module.exports = function(extension) {
	
	extension = extension || ".r.json";
	
	function parseJson(resource, parentName, addToken) {				
		for(var propertyName in resource) {
			var value = resource[propertyName];
			var key = parentName + "." + propertyName;
			
			if(typeof value == "string") {
				addToken(key, value);
			}
			else if(typeof value == "object"){
				parseJson(value,key, addToken);
			}
		}		
	}

	return {		
		canHandle : function(fileName) {			
			return fileName.endsWith(extension);
		},
		
		parse: function (file, addToken) {
			var resource = JSON.parse(file.contents.toString());
			if(!resource) return;
			
			var parentName = path.basename(file.path, path.extname(file.path));
			
			parseJson(resource,parentName, addToken);						
		}	
	}
}