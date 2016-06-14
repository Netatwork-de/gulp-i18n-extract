'use strict';

var through = require('through2');
var gutil = require('gulp-util');
var path = require('path');
var fs = require('fs');
var moment = require('moment');
var htmlPlugIn = require('./plugins/html');
var jsonPlugIn = require('./plugins/json');
var stringify = require('json-stable-stringify');

var PluginError = gutil.PluginError;
var File = gutil.File;

const obsoleteTranslationsProperty = "obsoleteTranslations";

exports.html = htmlPlugIn;
exports.json = jsonPlugIn;

exports.extract = function(outFile, options) {	
	outFile = outFile || 'i18nextract.json';
	
	options = options || {};
	
	if(!options.plugIns || options.plugIns.lenght == 0) {
		options.plugIns = [ new htmlPlugIn() ];
	} 
	
	var warnOnDuplicates = options.warnOnDuplicates  || true;
	var markUpdates = options.markUpdates || true;
	var defaultLanguages = options.defaultLanguages || ["de"];
	var keepObsoleteTranslations = options.keepObsoleteTranslations || false;
		
	var fileName;
	var cwd;

	if (typeof outFile === 'string') {
		fileName = outFile;
	} else if (typeof outFile.path === 'string') {
		fileName = path.basename(outFile.path);
	} else {
		throw new PluginError('gulp-i18n-extract', 'Missing outFile for gulp-i18n-extract');
	}
	
	var existingExtracts = null;
	var extract = null;	
	var obsoleteTranslations = null;
	
	function bufferContents(file, enc, cb) {
			
		if (file.isNull()) {
			cb();
			return;
		}

		if (file.isStream()) {
			this.emit('error', new PluginError('gulp-i18n-extract',  'Streaming not supported'));
			cb();
			return;
		}	
				
		if(!extract) { // only on first execution
			cwd = file.cwd;
			fileName = path.resolve(cwd, fileName);
			
			if(fs.existsSync(fileName)) {
				var previousContent = fs.readFileSync(fileName);
				existingExtracts = JSON.parse(previousContent) || {};
			}	
			else {
				existingExtracts = {};
			}
			
			extract = {};						
		}			
					
		var ext = path.extname(file.path);
		var name = path.basename(file.path, ext)
		var src = path.relative(cwd, file.path);
		var modifiedDate = moment();
		obsoleteTranslations = existingExtracts[obsoleteTranslationsProperty] || {};
		
		options.plugIns.filter((plugIn) => plugIn.canHandle(file.path))
				   	   .forEach((plugIn) => {
			
			var fileContent = existingExtracts[name] || extract[name];
			if(!fileContent) {
				fileContent = { "src":src, "content": {} };
			}	
			
			var newContent = {};
			var hasContent = false;
			var extractedKeys = {};
			
			try {			
				//gutil.log("Processing",src);
				plugIn.parse(file, (key, value) => {

					if(warnOnDuplicates && extractedKeys[key]) {
						gutil.log("Duplicate key",gutil.colors.yellow(key), "in", gutil.colors.yellow(src), "found.");
						return;
					}
										
					var extractedKey = fileContent.content[key];
					if(extractedKey) {
						delete fileContent.content[key];
					}
					else {
						extractedKey = newContent[key];
					}
					
					if(!extractedKey) {
						extractedKey = { "content" : value, "lastModified": modifiedDate,"translations":{} };
						if(markUpdates) extractedKey["needsUpdate"] = true;
					}
					else {
						if(extractedKey.content != value) {
							extractedKey.content = value;
							extractedKey.lastModified = modifiedDate
							if(markUpdates) extractedKey["needsUpdate"] = true;
						}						
					}
					
					defaultLanguages.forEach(lang => {
						if(!extractedKey.translations[lang]) {
							extractedKey.translations[lang] = { "content" : "", "lastModified": "" }
						}
					}, this);
					
					extractedKeys[key] = key;
					newContent[key] = extractedKey;		
					hasContent = true;								
				});
			}
			catch (e) {				
				this.emit('error', new PluginError('gulp-i18n-extract', e, {showStack: true}));
			}
			
			if(hasContent)
			{
				if(keepObsoleteTranslations) {
					// Foreach remaining key in file
					for(var key in fileContent.content) {
						// Get obsolete key
						var obsolete = fileContent.content[key];
						
						// Get or create obsolete translation object
						var obsoleteTranslation = obsoleteTranslations[obsolete.content];
						if(!obsoleteTranslation) {
							obsoleteTranslation = {};
							obsoleteTranslations[obsolete.content] = obsoleteTranslation;
						}

						// foreach translated language
						for(var language in obsolete.translations) {
							// Get translated text
							var translatedText = obsolete.translations[language].content;

							// Get or create language list
							var translations = obsoleteTranslation[language];
							if(!translations) {
								translations = [];
								obsoleteTranslation[language] = translations;
							}

							// Add if not in the list
							if(!translations.find( x => x === translatedText)) {
								translations.push(translatedText);
							}
						}
					}
				}

				fileContent.content = newContent;
				extract[name] = fileContent;
			}
		}, this);
		
		cb();
	}

	function endStream(cb) {
		if(keepObsoleteTranslations) {
			extract[obsoleteTranslationsProperty] = obsoleteTranslations;
		}
		var extractFile = new File(
			{
				base: cwd,
				path: fileName, 
				cwd: cwd,
				contents: new Buffer( stringify(extract, { space: '\t' }))
			});
					
		this.push(extractFile);
		
		cb();
	}

	return through.obj(bufferContents, endStream);
};