/*jslint node: true */
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
var http = require("https"),
	url = require("url"),
	_ = require("underscore");


/*
 * module globals
 */
var api = {
	endPoint: {
		protocol: "https",
		slashes: true,
		host: "api.ssllabs.com",
		pathname: "/api/v2/"
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
 * keep local copy of assement counts upto date by reading the values the
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
		options.fromCache = (options.fromCache === "on") ? true : false;
	}

	if (typeof options.startNew === "string") {
		options.startNew = (options.startNew === "on") ? true : false;
	}

	if (typeof options.publish === "string") {
		options.publish = (options.publish === "on") ? true : false;
	}

	if (typeof options.ignoreMismatch === "string") {
		options.ignoreMismatch = (options.ignoreMismatch === "on") ? true : false;
	}

	if (typeof options.maxAge === "string") {
		options.maxAge = parseInt(options.maxAge);
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

	if (options.fromCache && !options.maxAge) {
		throw new Error("fromCache parameter expects maxAge parameter.");
	}

	if (options.maxAge !== undefined && typeof options.maxAge !== "number" || (options.maxAge <= 0 || options.maxAge === Infinity)) {
		throw new Error("maxAge parameter must be a positive integer.");
	}

	if (options.all && !(options.all === "on" || options.all === "off" || options.all === "done")) {
		throw new Error("all parameter must be a on, off, or done.");
	}
}


/*
 * convert options with boolean values to API parameters
 *
 * @param {object} options - the object describing the paramters to send
 */
function optionsToParameters(options) {
	var parameters = {};

	_.each(options, function (value, key) {
		if (value === true) {
			parameters[key] = "on";
		} else if (value === false) {
			parameters[key] = "off";
		} else {
			parameters[key] = value;
		}
	});

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
		err = new Error("Client request rate too high");
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
		err = new Error("service is overloaded");
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

	apiUrl = _.clone(api.endPoint);
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
 * @param {object} options - the object describing the paramters to send
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

	options = _.defaults(options, defaults);

	verifyOptions(options);

	apiUrl = _.clone(api.endPoint);
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
 * @param {object} options - the object describing the paramters to send
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
 * @param {object} options - the object describing the paramters to send
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

	options = _.defaults(options, defaults);

	if (!options.host) {
		throw new Error("Host is required.");
	}

	if (!options.s) {
		throw new Error("Endpoint IP address is required.");
	}

	apiUrl = _.clone(api.endPoint);
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

	apiUrl = _.clone(api.endPoint);
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
 * scan will invoke analyze and poll variably until the assessment is finished
 *
 * @param {object} options - the object describing the paramters to send
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

	options = _.defaults(options, defaults);

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

		module.exports.analyzeAndPoll(options, callback);
	});

};
