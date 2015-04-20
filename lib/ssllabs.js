/*
 * node-ssllabs
 * Copyright(c) 2015 Keith W. Shaw <keith.w.shaw@gmail.com>
 * MIT Licensed
 */

/*
 * Module dependencies
 */

var http = require("https"),
	url = require("url"),
	_ = require("underscore");


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
function updateAssessments(response) {

	// save values from custom headers for later
	api.info.currentAssessments = parseInt(response.headers["x-current-assessments"], 10);
	api.info.maxAssessments = parseInt(response.headers["x-max-assessments"], 10);
}


/*
 * Check SSL Labs availability
 */
exports.info = function (callback) {
	var infoUrl, body;

	infoUrl = _.clone(api.endPoint);
	infoUrl.pathname += "info";
	body = "";

	http.get(url.format(infoUrl), function(response) {

		updateAssessments(response);

		if (response.statusCode !== 200) {
			callback(new Error("Unable to retrive info."), null);
		}

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
			api.info.clientMaxAssessments = info.clientMaxAssessments;
			api.info.currentAssessments = info.currentAssessments;
			api.info.maxAssessments = info.maxAssessments;
		} catch (e) {
			callback(e, null);
		}

		callback(null, info);
	});
};

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
 * Invoke assessment and check progress
 */
exports.analyze = function (options, callback) {
	var defaults, body;

	defaults = {
		publish: false,
		fromCache: false,
		ignoreMismatch: false
	};

	options = _.defaults(options, defaults);

	if (!options.host) {
		throw new Error("Host is required.");
	}

	analyzeUrl = _.clone(api.endPoint);
	analyzeUrl.pathname += "analyze";
	analyzeUrl.query = optionsToParameters(options);
	body = "";

	http.get(url.format(analyzeUrl), function(response) {

		updateAssessments(response);

		if (response.statusCode !== 200) {
			throw new Error("Unable to analyze host.");
		}

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
	var defaults, body;

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

	getEndpointDataUrl = _.clone(api.endPoint);
	getEndpointDataUrl.pathname += "getEndpointData";
	getEndpointDataUrl.query = optionsToParameters(options);
	body = "";

	http.get(url.format(getEndpointDataUrl), function(response) {

		updateAssessments(response);

		if (response.statusCode !== 200) {
			console.log("STATUS: " + response.statusCode);
			throw new Error("Unable to get endpoint data.");
		}

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
