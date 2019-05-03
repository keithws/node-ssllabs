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


/*
 * module globals
 */
var api = {
	endPoint: {
		protocol: "https",
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


/*
 * normalize options (parameters) for all calls
 */
function normalizeOptions(options) {

	// convert string values for API parameters to native types
	if (typeof options.fromCache === "string") {
		options.fromCache = options.fromCache.match(/^on$/i) ? true : false;
	}

	if (typeof options.startNew === "string") {
		options.startNew = options.startNew.match(/^on$/i) ? true : false;
	}

	if (typeof options.publish === "string") {
		options.publish = options.publish.match(/^on$/i) ? true : false;
	}

	if (typeof options.ignoreMismatch === "string") {
		options.ignoreMismatch = options.ignoreMismatch.match(/^on$/i) ? true : false;
	}

	if (typeof options.maxAge !== "number") {
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
		throw new Error("host parameter is required.");
	}

	if (options.startNew && options.fromCache) {
		throw new Error("fromCache cannot be used at the same time as the startNew parameter.");
	}

	if (options.maxAge && !options.fromCache) {
		throw new Error("maxAge parameter expects fromCache parameter.");
	}

	if (options.maxAge !== undefined && typeof options.maxAge !== "number") {
		throw new Error("maxAge parameter must be a number.");
	}

	if (options.maxAge !== undefined && typeof options.maxAge === "number" && (!isFinite(options.maxAge) || options.maxAge <= 0)) {
		throw new Error("maxAge parameter must be a positive integer.");
	}

	if (options.all && !(options.all === "on" || options.all === "off" || options.all === "done")) {
		throw new Error("all parameter must be a on, off, or done.");
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
		if (options.hasOwnProperty(key)) {

			value = options[key];

			if (value === true) {
				parameters[key] = "on";
			} else if (value === false) {
				parameters[key] = "off";
			} else {
				parameters[key] = value;
			}

		}
	}

	return parameters;

}


/*
 * handle API error responses
 *
 * @param {http.IncomingMessage} response - the HTTP(S) response object
 * @param {function} callback - the function to call when complete
 */
function handleErrorResponses(response, callback) {
	var err, body;

	switch (response.statusCode) {
	case 400:
		// invocation error (e.g., invalid parameters)
		err = new Error("Invocation error");
		break;
	case 429:
		// client request rate too high
		err = new Error("Client request rate too high or too many new assessments too fast");
		break;
	case 500:
		// internal error
		err = new Error("Internal error");
		break;
	case 503:
		// the service is not available (e.g., down for maintenance)
		err = new Error("Service is not available");
		break;
	case 529:
		// the service is overloaded
		err = new Error("Service is overloaded");
		break;
	}

	if (err) {
		body = "";
		response.setEncoding("utf8");
		response.on("data", function (chunk) {
			body += chunk;
		});

		response.on("end", function () {

			try {
				err.messages = JSON.parse(body);
			} catch (e) {
				callback(e, null);
				return;
			}

			callback(err, null);
		});
	}
}


/**
 * Check SSL Labs availability
 *
 * @param {function} callback - the function to call when complete
 */
module.exports.info = function (callback) {
	var apiUrl, body;

	callback = (typeof callback === "function") ? callback : function () {
		throw new Error("callback must be a function");
	};

	apiUrl = Object.assign({}, api.endPoint);
	apiUrl.pathname += "info";
	body = "";

	http.get(url.format(apiUrl), function (response) {

		updateAssessmentCounts(response);

		handleErrorResponses(response, callback);

		response.setEncoding("utf8");
		response.on("data", function (chunk) {
			body += chunk;
		});

	}).on("error", function (e) {

		callback(e, null);

	}).on("close", function () {
		var info;

		try {
			info = JSON.parse(body);

			// save values from Info Object for later
			api.info = info;
		} catch (e) {
			callback(e, null);
			return;
		}

		callback(null, info);
	});
};


/*
 * Invoke assessment and check progress
 *
 * @param {object} options - the object describing the parameters to send
 * @param {function} callback - the function to call when complete
 */
module.exports.analyze = function (options, callback) {
	var defaults, apiUrl, body;

	callback = (typeof callback === "function") ? callback : function () {
		throw new Error("callback must be a function");
	};

	defaults = {
		fromCache: false,
		ignoreMismatch: false,
		publish: false
	};

	options = Object.assign(defaults, options);

	try {
		verifyOptions(options);
	} catch (e) {
		callback(e, null);
		return;
	}

	apiUrl = Object.assign({}, api.endPoint);
	apiUrl.pathname += "analyze";
	apiUrl.query = optionsToParameters(options);
	body = "";

	http.get(url.format(apiUrl), function (response) {

		updateAssessmentCounts(response);

		handleErrorResponses(response, callback);

		response.setEncoding("utf8");
		response.on("data", function (chunk) {
			body += chunk;
		});

	}).on("error", function (e) {

		callback(e, null);

	}).on("close", function () {
		var host;

		try {
			host = JSON.parse(body);
		} catch (e) {
			callback(e, null);
			return;
		}

		callback(null, host);
	});
};


/*
 * Invoke assessment and poll until results are ready
 *
 * @param {object} options - the object describing the parameters to send
 * @param {function} callback - the function to call when complete
 */
module.exports.analyzeAndPoll = function (options, callback) {

	callback = (typeof callback === "function") ? callback : function () {
		throw new Error("callback must be a function");
	};

	module.exports.analyze(options, function (err, host) {
		var delay;

		if (err) {
			callback(err, null);
			return;
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
			if (host.status !== "IN_PROGRESS") {

				// 5 seconds until an assessment gets under way
				delay = 5000;
			} else {

				// then 10 seconds until it completes
				delay = 10000;
			}
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
	var defaults, apiUrl, body;

	callback = (typeof callback === "function") ? callback : function () {
		throw new Error("callback must be a function");
	};

	defaults = {
		fromCache: false
	};

	options = Object.assign(defaults, options);

	if (!options.host) {
		throw new Error("Host is required.");
	}

	if (!options.s) {
		throw new Error("Endpoint IP address is required.");
	}

	apiUrl = Object.assign({}, api.endPoint);
	apiUrl.pathname += "getEndpointData";
	apiUrl.query = optionsToParameters(options);
	body = "";

	http.get(url.format(apiUrl), function (response) {

		updateAssessmentCounts(response);

		handleErrorResponses(response, callback);

		response.setEncoding("utf8");
		response.on("data", function (chunk) {
			body += chunk;
		});

	}).on("error", function (e) {

		callback(e, null);

	}).on("close", function () {
		var endpointData;

		try {
			endpointData = JSON.parse(body);
		} catch (e) {
			callback(e, null);
			return;
		}

		callback(null, endpointData);
	});
};


/*
 * Retrieve known status codes
 *
 * @param {function} callback - the function to call when complete
 */
module.exports.getStatusCodes = function (callback) {
	var apiUrl, body;

	callback = (typeof callback === "function") ? callback : function () {
		throw new Error("callback must be a function");
	};

	apiUrl = Object.assign({}, api.endPoint);
	apiUrl.pathname += "getStatusCodes";
	body = "";

	http.get(url.format(apiUrl), function (response) {

		updateAssessmentCounts(response);

		handleErrorResponses(response, callback);

		response.setEncoding("utf8");
		response.on("data", function (chunk) {
			body += chunk;
		});

	}).on("error", function (e) {

		callback(e, null);

	}).on("close", function () {
		var statusCodes;

		try {
			statusCodes = JSON.parse(body);

			// keep a copy of the status codes in the api object
			api.statusCodes = statusCodes;
		} catch (e) {
			callback(e, null);
			return;
		}

		callback(null, statusCodes);
	});
};


/*
 * Retrieve the root certificates used for trust validation
 *
 * @param {object} options - the object describing the parameters to send
 * @param {function} callback - the function to call when complete
 */
module.exports.getRootCertsRaw = function (options, callback) {
	var apiUrl, body;

	if (!callback && typeof options === "function") {
		callback = options;
		options = {};
	}

	callback = (typeof callback === "function") ? callback : function () {
		throw new Error("callback must be a function");
	};

	var defaults = {
		trustStore: 1
	};

	options = Object.assign(defaults, options);

	if (options.trustStore && isNaN(options.trustStore)) {
		throw new Error("trustStore parameter must be a number");
	}

	if (options.trustStore && (options.trustStore < 1 || options.trustStore > 5)) {
		throw new Error("trustStore parameter must be between 1 and 5, inclusive");
	}

	apiUrl = Object.assign({}, api.endPoint);
	apiUrl.pathname += "getRootCertsRaw";
	apiUrl.query = optionsToParameters(options);
	body = "";

	http.get(url.format(apiUrl), function (response) {

		updateAssessmentCounts(response);

		handleErrorResponses(response, callback);

		response.setEncoding("utf8");
		response.on("data", function (chunk) {
			body += chunk;
		});

	}).on("error", function (e) {

		callback(e, null);

	}).on("close", function () {
		var rootCertsRaw;

		try {

			rootCertsRaw = body;

		} catch (e) {

			callback(e, null);
			return;

		}

		callback(null, rootCertsRaw);
	});
};


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
			callback(err);
			return;
		}

		rawCerts = rawCerts.split(/\s+-{3,}END CERTIFICATE-{3,}\s+/);
		var certs = rawCerts.map(function (rawCert) {

			var cert = rawCert.split(/\s*-{3,}BEGIN CERTIFICATE-{3,}\s*/)[1];
			var lines = rawCert.split(/\s*-{3,}BEGIN CERTIFICATE-{3,}\s*/)[0].split("\n");
			var metadata = lines.reduce(function (acc, v) {

				var result = v.split(/\s*:\s+/);
				if (result.length > 1) {
					var key = result[0].slice(2);
					key = key.toLowerCase();
					key = key.split(/\W/).map(function (word, index) {
						if (index > 0) {
							word = word[0].toUpperCase() + word.slice(1);
						}
						return word;
					}).join("");
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
				cert = cert.replace("\r\n", "\n");
				cert = cert.replace("\r", "\n");
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
	var defaults;

	defaults = {
		all: "done",
		fromCache: true,
		maxAge: 24,
		ignoreMismatch: false,
		publish: false
	};

	if (typeof options === "string") {
		options = { host: options };
	}

	options = Object.assign(defaults, options);

	if (options.startNew) {
		delete options.fromCache;
		delete options.maxAge;
	}

	// check availability
	module.exports.info(function (err, info) {
		if (err) {
			callback(err, null);
			return;
		}

		if (info.currentAssessments < info.maxAssessments) {

			module.exports.analyzeAndPoll(options, callback);

		} else {

			setTimeout(function () {

				module.exports.scan(options, callback);

			}, info.newAssessmentCoolOff);

		}

	});

};
