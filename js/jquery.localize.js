/*
Modified version of jquery.localize that pulls from a URL and expects to receive JSON.
JSON at the url is provided by a Google Apps script which dynamically pulls from Google Sheets.

This is "runtime" string substitution that is useful DURING DEVELOPMENT ONLY (by localizers).

For "final" baked localization, see the PHP equivalent localization function.
/*
Copyright (c) Jim Garvin (http://github.com/coderifous), 2008.
Dual licensed under the GPL (http://dev.jquery.com/browser/trunk/jquery/GPL-LICENSE.txt) and MIT (http://dev.jquery.com/browser/trunk/jquery/MIT-LICENSE.txt) licenses.
Written by Jim Garvin (@coderifous) for use on LMGTFY.com.
http://github.com/coderifous/jquery-localize
Based off of Keith Wood's Localisation jQuery plugin.
http://keith-wood.name/localisation.html
 */
(function($) {
  var showTerms = false;
  var isRTL = false;
  $.defaultLanguage = "en";
  $.localize = function(pkg, options) {
    var defaultCallback, deferred, fileExtension, intermediateLangData, jsonCall, lang, loadLanguage, localizeElement, localizeForSpecialKeys, localizeImageElement, localizeInputElement, localizeOptgroupElement, notifyDelegateLanguageLoaded, regexify, setAttrFromValueForKey, setTextFromValueForKey, valueForKey, wrappedSet;
    if (options == null) {
      options = {};
    }
    wrappedSet = this;
    intermediateLangData = {};
    fileExtension = options.fileExtension || "json";
    deferred = $.Deferred();
    loadLanguage = function(pkg, lang, level) {
	  console.log("loadLanguage: " + lang + " pkg:" + pkg + " level:" + level);
      var file;
      if (level == null) {
        level = 1;
      }
	  
	  /*
      switch (level) {
        case 1:
          intermediateLangData = {};
          if (options.loadBase) {
            file = pkg + ("." + fileExtension);
            return jsonCall(file, pkg, lang, level);
          } else {
            return loadLanguage(pkg, lang, 2);
          }
          break;
        case 2:
          file = "" + pkg + "-" + (lang.split('-')[0]) + "." + fileExtension;
          return jsonCall(file, pkg, lang, level);
        case 3:
          file = "" + pkg + "-" + (lang.split('-').slice(0, 2).join('-')) + "." + fileExtension;
          return jsonCall(file, pkg, lang, level);
        default:
          return deferred.resolve();
      }
	  */
	  
	  //Ben change: load from path as given (i.e. not file extension)
	  switch (level) {
        case 1:
            intermediateLangData = {};
            if (options.loadBase) {
                //file = pkg + ("." + fileExtension);
                file = pkg;
                return jsonCall(file, pkg, lang, level);
            } else {
                return loadLanguage(pkg, lang, 2);
            }
            break;
        case 2:
            if (lang.length >= 2) {
                //file = "" + pkg + "-" + (lang.substring(0, 2)) + "." + fileExtension;
                file = pkg;
                return jsonCall(file, pkg, lang, level);
            }
            break;
        case 3:
            //if (lang.length >= 5) {
                //file = "" + pkg + "-" + (lang.substring(0, 5)) + "." + fileExtension;
                file = pkg;
                return jsonCall(file, pkg, lang, level);
            //}
		default:
          return deferred.resolve();
      }
    };
    jsonCall = function(file, pkg, lang, level) {
      var ajaxOptions, errorFunc, successFunc;
      if (options.pathPrefix != null) {
        file = "" + options.pathPrefix + "/" + file;
      }
      successFunc = function(d) {
		  console.log("loaded level " + level);
        $.extend(intermediateLangData, d);
        notifyDelegateLanguageLoaded(intermediateLangData);
        return loadLanguage(pkg, lang, level + 1);
      };
      errorFunc = function(xhr, status, error) {
		  setStatus("Error getting [" + lang + "] strings from Google Sheets: "  + status + " (" + error + ")");
		  console.log("error on level " + level);
        if (level === 2 && lang.indexOf('-') > -1) {
          return loadLanguage(pkg, lang, level + 1);
        } else if (options.fallback && options.fallback !== lang) {
          return loadLanguage(pkg, options.fallback);
        }
      };
      ajaxOptions = {
        url: file,
        async: true,
        timeout: options.timeout != null ? options.timeout : 30000,
        success: successFunc,
        error: errorFunc
      };
      // if (window.location.protocol === "file:") {
        // ajaxOptions.error = function(xhr) {
          // return successFunc($.parseJSON(xhr.responseText));
        // };
      // }
	  
	  console.log(ajaxOptions)
	  setStatus("Getting [" + lang + "] strings from Google Sheets...");
      return $.ajax(ajaxOptions);
    };
    notifyDelegateLanguageLoaded = function(data) {
      if (options.callback != null) {
        return options.callback(data, defaultCallback);
      } else {
        return defaultCallback(data);
      }
    };
    defaultCallback = function(data) {
		console.log(data)
      $.localize.data[pkg] = data;
	  var errorCount = 0;
      wrappedSet.each(function() {
        var elem, key, value;
        elem = $(this);
        key = elem.data("localize");
        key || (key = elem.attr("rel").match(/localize\[(.*?)\]/)[1]);
		
		//Ben: we mix I2Loc's term structure with the jquery localize style, so this is where we split them apart
		//		so that we can find the right term in the JSON object we get back from Google Sheets
		
		//Rule terms will be things like WhosOnFirst/rule_DISPLAY1
		//And can be found in English->WhosOnFirst->rule_DISPLAY1
		if (key.includes("/"))
		{
			key = lang + "." + key.replace("/", ".");
		}
		else
		{
			//While manual terms will be like "title.line1"
			//and can be found in English->Manual->title->line1
			key = lang + ".Manual." + key
		}
		
        value = valueForKey(key, data, elem);
        if (value != null) {
		  elem.removeClass("error-highlight");
		  
		  //Special I2Loc empty string handling
		  if (value == "---")
		  {
			  value = "";
		  }
		  
          return localizeElement(elem, key, value);
        }
		else {
			console.log("No string found for " + key);
			value = "[MISSING: " + key + "]";
			elem.addClass("error-highlight");
			errorCount = errorCount + 1;
			return localizeElement(elem, key, value);
		}
      });
	  console.log("Localize complete.");
	  
	  if (errorCount > 0)
	  {
		setStatus("Localize from Google Sheets complete [" + lang + "] [<span class=\"error-highlight\">" + errorCount + " missing strings</span>]");
	  }
	  else
	  {
		  setStatus("Localize from Google Sheets  complete [" + lang + "] [No missing strings]");
	  }		  
    };
    localizeElement = function(elem, key, value) {
      if (elem.is('input')) {
        localizeInputElement(elem, key, value);
      } else if (elem.is('textarea')) {
        localizeInputElement(elem, key, value);
      } else if (elem.is('img')) {
        localizeImageElement(elem, key, value);
      } else if (elem.is('optgroup')) {
        localizeOptgroupElement(elem, key, value);
      } else if (elem.is('tspan')) {
        localizeSVGTextElement(elem, key, value);
	  } else if (!$.isPlainObject(value)) {
        elem.html(value);
	  }
      if ($.isPlainObject(value)) {
        return localizeForSpecialKeys(elem, value);
      }
    };
    localizeInputElement = function(elem, key, value) {
      var val;
      val = $.isPlainObject(value) ? value.value : value;
      if (elem.is("[placeholder]")) {
        return elem.attr("placeholder", val);
      } else {
        return elem.val(val);
      }
    };
    localizeForSpecialKeys = function(elem, value) {
      setAttrFromValueForKey(elem, "title", value);
      setAttrFromValueForKey(elem, "href", value);
      return setTextFromValueForKey(elem, "text", value);
    };
    localizeOptgroupElement = function(elem, key, value) {
      return elem.attr("label", value);
    };
    localizeImageElement = function(elem, key, value) {
      setAttrFromValueForKey(elem, "alt", value);
      return setAttrFromValueForKey(elem, "text", value);
    };
	
	localizeSVGTextElement = function(elem, key, value) {
		
		//Switch the start/end anchor for SVG text if using a RTL language
		if (isRTL)
		{
			if (elem.parent().attr('text-anchor') == 'start')
			{
				elem.parent().attr('text-anchor', 'end');
			}
			else if (elem.parent().attr('text-anchor') == 'end')
			{
				elem.parent().attr('text-anchor', 'start');
			}
		}
		
		return elem.html(value);
	}
	
    valueForKey = function(key, data, elem) {
      var keys, value, _i, _len;
	  
	  //Ben addition: debug helper to show the terms instead of strings
	  if (showTerms) { return key.substring(key.indexOf(".") + 1); };
	  
      keys = key.split(/\./);
      value = data;
      for (_i = 0, _len = keys.length; _i < _len; _i++) {
        key = keys[_i];
        value = value != null ? value[key] : null;
      }
	  
	  //Ben edit: do some basic argument substitution from data-args="1;2;3" attribute
	  var args = elem.attr("data-args");
	  if (args != null && value != null)
	  {
			//Ben: hack in support for per-language options so that the HTML/PHP can remain unchanged
		  if (key == "version")
		  {
			  value = value.replace("{version}", options.version);
		  }
		  else if (key == "verificationcode")
		  {
			  value = value.replace("{verificationCode}", options.verificationCode);
		  }
		  else if (key == "revision")
		  {
			  value = value.replace("{revision}", options.revision);
		  }
		  else
		  {
			//console.log("Formatting " + value + " with args: " + args);
			value = strFormat(value, args.split(";"));
			//console.log("result is: " + value);
		  }
	  }
	  
      return value;
    };
	
	//Ben addition: here's the string format function
	//Thanks to https://stackoverflow.com/questions/1038746/equivalent-of-string-format-in-jquery/5341855#5341855
	// and https://stackoverflow.com/a/7975025
	strFormat = function(str, args) {
		argDict = {}
		for (_i = 0, _len = args.length; _i < _len; _i++) {
			kvp = args[_i].split("=");
			argDict[kvp[0]] = kvp[1];
		}
		
		if (str == null) { return; }
		
		return str.replace(/{\w+}/g, function(all) {
			all = all.replace(/[{}]/g, '');
			if (argDict[all] == null) { console.log("No arg found for " + all); }
			return argDict[all] || all;
		});
	}
	
    setAttrFromValueForKey = function(elem, key, value) {
      value = valueForKey(key, value, elem);
      if (value != null) {
        return elem.attr(key, value);
      }
    };
    setTextFromValueForKey = function(elem, key, value) {
      value = valueForKey(key, value, elem);
      if (value != null) {
        return elem.text(value);
      }
    };
    regexify = function(string_or_regex_or_array) {
      var thing;
      if (typeof string_or_regex_or_array === "string") {
        return "^" + string_or_regex_or_array + "$";
      } else if (string_or_regex_or_array.length != null) {
        return ((function() {
          var _i, _len, _results;
          _results = [];
          for (_i = 0, _len = string_or_regex_or_array.length; _i < _len; _i++) {
            thing = string_or_regex_or_array[_i];
            _results.push(regexify(thing));
          }
          return _results;
        })()).join("|");
      } else {
        return string_or_regex_or_array;
      }
    };
    lang = (options.language ? options.language : $.defaultLanguage);
	showTerms = (options.showTerms ? true : false);
	
	var rtlLangs = [ "ar", "he" ];
	if (rtlLangs.includes(lang))
	{
		isRTL = true;
	}
	
    if (options.skipLanguage && lang.match(regexify(options.skipLanguage))) {
      deferred.resolve();
    } else {
      loadLanguage(pkg, lang, 3);
    }
    wrappedSet.localizePromise = deferred;
    return wrappedSet;
  };
  $.fn.localize = $.localize;
  return $.localize.data = {};
})(jQuery);
