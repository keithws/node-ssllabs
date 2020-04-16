/* eslint-env node */
"use strict";

/**
 * node-ssllabs
 * Copyright(c) 2015 Keith Shaw <keith.w.shaw@gmail.com>
 * MIT Licensed
 *
 * @module ssllabs
 */


/*
 * module dependencies
 */
var http = require("https");
var url = require("url");
var ProxyAgent = require("proxy-agent");
var pkg = require("../package");


/*
 * module globals
 */
var api = {
	endPoint: {
		protocol: "https:",
		slashes: true,
		host: "api.ssllabs.com",
		pathname: "/api/v3/"
	},
	info: {
		criteriaVersion: null,
		currentAssessments: -Infinity,
		maxAssessments: Infinity,
		messages: [],
		version: null
	},
	statusCodes: {}
};

var API_DEFAULTS = {
	all: false,
	fromCache: false,
	ignoreMismatch: false,
	publish: false
};


/*
 * helper functions
 */


/*
 * keep local copy of assessment counts up to date by reading the values the
 * server send back in the header
 *
 * @param {http.IncomingMessage} response - the HTTP(S) response object
 */
function updateAssessmentCounts(response) {
	api.info.currentAssessments = parseInt(
		response.headers["x-current-assessments"],
		10
	);
	api.info.maxAssessments = parseInt(
		response.headers["x-max-assessments"],
		10
	);
}


function convertSomeStringsToBooleans (string) {

	var map = {
		"TRUE": true,
		"FALSE": false,
		"YES": true,
		"NO": false,
		"ON": true,
		"OFF": false,
		"True": true,
		"False": false,
		"Yes": true,
		"No": false,
		"On": true,
		"Off": false,
		"true": true,
		"false": false,
		"yes": true,
		"no": false,
		"on": true,
		"off": false,
		"1": true,
		"0": false,
	};
	return (string in map) ? map[string] : string;

}


/*
 * normalize options (parameters) for all calls
 */
function normalizeOptions(options) {

	var key;

	// convert string values for API parameters to native types
	for (key in options) {
		options[key] = convertSomeStringsToBooleans(options[key]);
	}

	if (options.maxAge && typeof options.maxAge !== "number") {
		options.maxAge = parseInt(options.maxAge, 10);
	}

	if (options.all === true) {
		options.all = "on";
	} else if (options.all === false) {
		options.all = "off";
	}

	return options;

}
module.exports.normalizeOptions = normalizeOptions;


/*
 * verify options (parameters) for the analyze api call
 */
function verifyOptions(options) {

	if (!options.host) {
		throw new Error("host parameter is required");
	}

	if (options.startNew && options.fromCache) {
		throw new Error("fromCache cannot be used at the same time as the startNew parameter");
	}

	if (options.maxAge && !options.fromCache) {
		throw new Error("maxAge parameter expects fromCache parameter");
	}

	if (options.maxAge !== undefined && typeof options.maxAge !== "number") {
		throw new Error("maxAge parameter must be a number");
	}

	if (options.maxAge !== undefined && typeof options.maxAge === "number" && (!isFinite(options.maxAge) || options.maxAge <= 0)) {
		throw new Error("maxAge parameter must be a positive integer");
	}

	if (options.all && !(options.all === "on" || options.all === "off" || options.all === "done")) {
		throw new Error("all parameter must be a on, off, or done");
	}

}
module.exports.verifyOptions = verifyOptions;


/*
 * convert options with boolean values to API parameters
 *
 * @param {object} options - the object describing the parameters to send
 */
function optionsToParameters(options) {

	var key, parameters, value;

	parameters = {};
	for (key in options) {

		value = options[key];
		if (value === true) {
			parameters[key] = "on";
		} else if (value === false) {
			parameters[key] = "off";
		} else {
			parameters[key] = value;
		}

	}

	return parameters;

}


var API_ERROR_STATUS_CODES = {
	400: "Invocation error (e.g., invalid parameters)",
	429: "Client request rate too high or too many new assessments too fast",
	500: "Internal error",
	503: "Service is not available (e.g., down for maintenance)",
	529: "Service is overloaded"
};


/*
 * handle API error responses
 *
 * @param {http.IncomingMessage} response - the HTTP(S) response object
 * @param {function} callback - the function to call when complete
 */
function handleErrorResponses(response, callback) {

	var err, body;

	if (response.statusCode in API_ERROR_STATUS_CODES) {

		err = new Error(API_ERROR_STATUS_CODES[response.statusCode]);
		body = "";
		response.setEncoding("utf8");
		response.on("data", function (chunk) {
			body += chunk;
		});

		// log max and current assessment numbers
		process.env.DEBUG && console.log(`ASSESSMENTS: ${api.info.currentAssessments}/${api.info.maxAssessments}`);

		response.on("end", function () {

			try {
				err.body = JSON.parse(body);
				callback(err);
			} catch (err) {
				return callback(err);
			}

		});

	}

}

/*
 * helper function to encapsulate all the things to do with each call to the api
 */
function getDataFromAPI(pathname, options, callback) {

	if (!callback && typeof options === "function") {
		callback = options;
		options = null;
	}

	callback = (typeof callback === "function") ? callback : function () {
		throw new Error("callback must be a function");
	};

	var apiUrl, body, httpOptions, raw, res;

	raw = options && options.raw;
	apiUrl = Object.assign({}, api.endPoint);
	apiUrl.pathname += pathname;
	if (options) {
		delete options.raw;
		apiUrl.query = optionsToParameters(options);
	}
	body = "";

	// format and parse the URL to set the path property
	httpOptions = url.parse(url.format(apiUrl));
	httpOptions.headers = {
		"User-Agent" : `${pkg.name}_version_${pkg.version}_(${pkg.homepage})`
	};

	if (process.env.HTTPS_PROXY) {
		httpOptions.agent = new ProxyAgent(process.env.HTTPS_PROXY);
	}

	process.env.DEBUG && console.log(httpOptions);

	http.get(httpOptions, function (response) {

		res = response;
		updateAssessmentCounts(response);
		handleErrorResponses(response, callback);

		response.setEncoding("utf8");
		response.on("data", function (chunk) {
			body += chunk;
		});

	}).on("error", function (err) {

		callback(err);

	}).on("close", function () {

		var data = body;

		process.env.DEBUG && console.log(data);

		if (!raw) {
			try {
				data = JSON.parse(body);
				if (data.errors) {
					const errors = JSON.stringify(data.errors);
					const err = new Error(`Errors in response: ${errors}`)
					return callback(err);
				}
			} catch (err) {
				console.log(res);
				console.log(body);
				return callback(err);
			}
		}

		callback(null, data);

	});

}


function getDataFromAPIAndSaveIt (pathname, callback) {

	getDataFromAPI(pathname, function (err, data) {

		// save values for later
		var dict = {
			"info": "info",
			"getStatusCodes": "statusCodes"
		};
		api[dict[pathname]] = data;
		callback(err, data);

	});

}


/**
 * Check SSL Labs availability
 *
 * @param {function} callback - the function to call when complete
 */
module.exports.info = function (callback) {

	getDataFromAPIAndSaveIt("info", callback);

};


/*
 * Invoke assessment and check progress
 *
 * @param {object} options - the object describing the parameters to send
 * @param {function} callback - the function to call when complete
 */
module.exports.analyze = function (options, callback) {

	options = Object.assign({}, API_DEFAULTS, normalizeOptions(options));

	try {
		verifyOptions(options);
	} catch (err) {
		return callback(err);
	}

	getDataFromAPI("analyze", options, callback);

};


/*
 * Invoke assessment and poll until results are ready
 *
 * @param {object} options - the object describing the parameters to send
 * @param {function} callback - the function to call when complete
 */
module.exports.analyzeAndPoll = function (options, callback) {

	module.exports.analyze(options, function (err, host) {

		if (err) {
			return callback(err);
		}

		if (host.status === "READY" || host.status === "ERROR") {

			callback(null, host);
			return;

		} else {

			// poll without the startNew parameter
			if (options.startNew) {
				delete options.startNew;
			}

			// best to use variable polling
			// 5 seconds until an assessment gets under way
			// then 10 seconds until it completes
			var delay = (host.status !== "IN_PROGRESS") ? 5000 : 10000;
			setTimeout(function () {

				module.exports.analyzeAndPoll(options, callback);

			}, delay);

		}

	});

};


/*
 * Retrieve detailed endpoint information
 *
 * @param {object} options - the object describing the parameters to send
 * @param {function} callback - the function to call when complete
 */
module.exports.getEndpointData = function (options, callback) {

	var defaults = {
		fromCache: false
	};

	options = Object.assign({}, defaults, normalizeOptions(options));

	if (!options.host) {
		callback(new Error("Host is required"));
		return;
	}

	if (!options.s) {
		callback(new Error("Endpoint IP address is required"));
		return;
	}

	getDataFromAPI("getEndpointData", options, callback);

};


/*
 * Retrieve known status codes
 *
 * @param {function} callback - the function to call when complete
 */
module.exports.getStatusCodes = function (callback) {

	getDataFromAPIAndSaveIt("getStatusCodes", callback);

};


/*
 * Retrieve the root certificates used for trust validation
 *
 * @param {object} options - the object describing the parameters to send
 * @param {function} callback - the function to call when complete
 */
module.exports.getRootCertsRaw = function (options, callback) {

	if (!callback && typeof options === "function") {
		callback = options;
		options = {};
	}

	var defaults = {
		trustStore: 1
	};

	options = Object.assign({}, defaults, normalizeOptions(options));

	if (isNaN(options.trustStore)) {
		callback(new Error("trustStore parameter must be a number"));
		return;
	} else if (options.trustStore < 1 || options.trustStore > 5) {
		callback(new Error("trustStore parameter must be between 1 and 5, inclusive"));
		return;
	}

	// must get a raw text response
	options.raw = true;
	getDataFromAPI("getRootCertsRaw", options, callback);

};


function toCamelCase(string) {

	return string.split(/\W/).map(function (word, index) {
		if (index > 0) {
			word = word[0].toUpperCase() + word.slice(1);
		}
		return word;
	}).join("");

}


/*
 * Retrieve the root certificates used for trust validation
 *
 * @param {object} options - the object describing the parameters to send
 * @param {function} callback - the function to call with an array of objects
 * representing each root in the trust store
 */
module.exports.getRootCerts = function (options, callback) {

	if (!callback && typeof options === "function") {
		callback = options;
		options = {};
	}

	module.exports.getRootCertsRaw(options, function (err, rawCerts) {

		if (err) {
			return callback(err);
		}

		rawCerts = rawCerts.split(/\s+-{3,}END CERTIFICATE-{3,}\s+/);
		var certs = rawCerts.map(function processRawCert (rawCert) {

			var cert = rawCert.split(/\s*-{3,}BEGIN CERTIFICATE-{3,}\s*/)[1];
			var lines = rawCert.split(/\s*-{3,}BEGIN CERTIFICATE-{3,}\s*/)[0].split("\n");
			var metadata = lines.reduce(function (acc, v) {

				var result = v.split(/\s*:\s+/);
				if (result.length > 1) {
					var key = result[0].slice(2);
					key = key.toLowerCase();
					key = toCamelCase(key);
					if (key === "keyLength") {
						acc[key] = parseInt(result[1], 10);
					} else if (key.match(/^not/)) {
						acc[key] = new Date(result[1]);
					} else {
						acc[key] = result[1];
					}
				} else {
					acc["name"] = result[0].slice(2);
				}
				return acc;

			}, {});

			if (cert) {
				// convert DOS and Mac line endings to Unix
				cert = cert.replace("\r\n", "\n").replace("\r", "\n");
				metadata.certificate = "-----BEGIN CERTIFICATE-----\n" + cert + "\n-----END CERTIFICATE-----";
			}

			return metadata;

		});

		callback(null, certs);

	});

};


/*
 * scan will invoke analyze and poll variably until the assessment is finished
 *
 * @param {object} options - the object describing the parameters to send
 * @param {function} callback - the function to call when complete
 */
module.exports.scan = function (options, callback) {

	var defaults = {
		all: "done",
		fromCache: true,
		maxAge: 24
	};

	if (typeof options === "string") {
		options = { host: options };
	}

	options = Object.assign({}, API_DEFAULTS, defaults, normalizeOptions(options));

	// delete default fromCache and maxAge if startNew is specified
	if (options.startNew) {
		delete options.fromCache;
		delete options.maxAge;
	}

	// check availability
	module.exports.info(function (err, info) {

		if (err) {
			return callback(err);
		}

		if (info.currentAssessments < info.maxAssessments) {

			// okay to start a new assessment
			module.exports.analyzeAndPoll(options, callback);

		} else {

			// wait before starting a new assessment
			var scanThis = module.exports.scan.bind(null, options, callback);
			setTimeout(scanThis, info.newAssessmentCoolOff);

		}

	});

};
