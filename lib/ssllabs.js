/*
 * node-ssllabs
 * Copyright(c) 2015 Keith Shaw <keith.w.shaw@gmail.com>
 * MIT Licensed
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
		host: "api.dev.ssllabs.com",
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
 */
function updateAssessmentCounts(response) {
	api.info.currentAssessments = parseInt(
		response.headers["x-current-assessments"], 10);
	api.info.maxAssessments = parseInt(
		response.headers["x-max-assessments"], 10);
}


/*
 * convert options with boolean values to API parameters
 */
function optionsToParameters(options) {
	var parameters = {};

	_.each(options, function (value, key, list) {
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
 */
function handleErrorResponses(response) {
	switch (response.statusCode) {
	case 400:
		// invocation error (e.g., invalid parameters)
		throw new Error("Invocation error");
		break;
	case 429:
		// client request rate too high
		throw new Error("Client request rate too high");
		break;
	case 500:
		// internal error
		throw new Error("Internal error");
		break;
	case 503:
		// the service is not available (e.g., down for maintenance)
		throw new Error("Service is not available");
		break;
	case 529:
		// the service is overloaded
		throw new Error("service is overloaded");
		break;
	}
}


/*
 * Check SSL Labs availability
 */
exports.info = function (callback) {
	var apiUrl, body;

	apiUrl = _.clone(api.endPoint);
	apiUrl.pathname += "info";
	body = "";

	http.get(url.format(apiUrl), function(response) {

		updateAssessmentCounts(response);

		handleErrorResponses(response);

		response.setEncoding("utf8");
		response.on("data", function (chunk) {
			body += chunk;
		});

	}).on("error", function(e) {

		callback(e, null);

	}).on("close", function () {
		var info;

		try {
			info = JSON.parse(body);

			// save values from Info Object for later
			api.info = info;
		} catch (e) {
			callback(e, null);
		}

		callback(null, info);
	});
};


/*
 * Invoke assessment and check progress
 */
exports.analyze = function (options, callback) {
	var defaults, apiUrl, body;

	defaults = {
		publish: false,
		fromCache: false,
		ignoreMismatch: false
	};

	options = _.defaults(options, defaults);

	if (!options.host) {
		throw new Error("Host is required.");
	}

	apiUrl = _.clone(api.endPoint);
	apiUrl.pathname += "analyze";
	apiUrl.query = optionsToParameters(options);
	body = "";

	http.get(url.format(apiUrl), function(response) {

		updateAssessmentCounts(response);

		handleErrorResponses(response);

		response.setEncoding("utf8");
		response.on("data", function (chunk) {
			body += chunk;
		});

	}).on("error", function(e) {

		throw e;

	}).on("close", function () {
		var host;

		try {
			host = JSON.parse(body);
		} catch (e) {
			callback(e, null);
		}

		callback(null, host);
	});
};


/*
 * Retrieve detailed endpoint information
 */
exports.getEndpointData = function (options, callback) {
	var defaults, apiUrl, body;

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

	http.get(url.format(apiUrl), function(response) {

		updateAssessmentCounts(response);

		handleErrorResponses(response);

		response.setEncoding("utf8");
		response.on("data", function (chunk) {
			body += chunk;
		});

	}).on("error", function(e) {

		throw e;

	}).on("close", function () {
		var endpointData;

		try {
			endpointData = JSON.parse(body);
		} catch (e) {
			callback(e, null);
		}

		callback(null, endpointData);
	});
};


/*
 * Retrieve known status codes
 */
exports.getStatusCodes = function (callback) {
	var apiUrl, body;

	apiUrl = _.clone(api.endPoint);
	apiUrl.pathname += "getStatusCodes";
	body = "";

	http.get(url.format(apiUrl), function(response) {

		updateAssessmentCounts(response);

		handleErrorResponses(response);

		response.setEncoding("utf8");
		response.on("data", function (chunk) {
			body += chunk;
		});

	}).on("error", function(e) {

		callback(e, null);

	}).on("close", function () {
		var statusCodes;

		try {
			statusCodes = JSON.parse(body);

			// keep a copy of the status codes in the api object
			api.statusCodes = statusCodes;
		} catch (e) {
			callback(e, null);
		}

		callback(null, statusCodes);
	});
};
