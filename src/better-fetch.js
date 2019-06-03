var exports = (module.exports = {});
var cacheName = '';
var defaultTimeout = 5000;

//FOR TESTING ONLY
var fetch;
var caches;

if (process.env.NODE_ENV === 'test') {
	fetch = require('node-fetch');
	caches = require('./mock-cache');
	caches.init();
}

exports.setCacheName = function(name) {
	cacheName = name;
};

exports.getCacheName = function() {
	return cacheName;
};

exports.setDefaultTimeOut = function(ms) {
	defaultTimeout = ms;
};

exports.getDefaultTimeOut = function() {
	return defaultTimeout;
};

/*
url:
Set to the destination that you want to fetch data from.
options:
matchAll - Set flag true to match all responses in the cache instead of first hit
dataType - Types include: "json", "blob", "formData", "arrayBuffer", "text", "raw"
parameters - The init object to be used with the fetch call. See [Here]() for documentation
init - Pass through init object to fetch call manually.
handleError - function called if there is an error with the request.
timeout - timeout (in ms) to set on the api call.
handleCachedData - Manually specify a function to be used only for returned cached data.
handleNetworkData - Manually specify a function to be used only for returned network data.
callback:
The function to be called with data as it is received. Expect this function to be called multiple times given that it will likely first be called with cache data and then called with updated network data. 
Do not rely on it being called twice however given that it won't be called a second time if network data returns first or cache data does not exist
*/
exports.get = function(url, callback, options = {}) {
	var networkDataReceived = false;
	var cacheData = {};

	// fetch fresh data
	var networkUpdate = timeoutPromise(options.timeout || defaultTimeout, fetch(url, options.init))
		.then(function(response) {
			return handleResponse(response, options);
		})
		.then(function(data) {
			networkDataReceived = true;
			if (options.handleNetworkData instanceof Function) callback = options.handleNetworkData;
			switch (options.dataType) {
				case 'json':
					if (JSON.stringify(data) !== JSON.stringify(cacheData)) callback(data);
					break;
				case 'blob':
					callback(data); //Implement camparisons for the below later
				case 'arrayBuffer':
					callback(data);
				case 'formData':
					callback(data);
				case 'text':
					callback(data);
				case 'raw':
					callback(data);
					break;
				default:
					if (JSON.stringify(data) !== JSON.stringify(cacheData)) {
						callback(data);
					}
					break;
			}
			if (options.dataType === '' && JSON.stringify(data) !== JSON.stringify(cacheData)) callback(data);
			else if (options.rawData) callback(data);
		})
		.catch(function(error) {
			if (options.handleError instanceof Function) options.handleError(error);
			else console.log(error);
		});

	// fetch cached data
	if (!options.matchAll) {
		caches
			.match(url)
			.then(
				function(response) {
					return handleResponse(response, options);
				},
				function() {
					return null;
				}
			)
			.then(function(data) {
				if (data == null) {
					return;
				}
				// don't overwrite newer network data
				if (!networkDataReceived) {
					cacheData = data;
					if (options.handleCachedData instanceof Function) options.handleCachedData(data);
					else callback(data);
				}
			});
	} else {
		caches
			.matchAll(url)
			.then(
				function(responses) {
					if (responses.length > 1) return responses;
					else return handleResponse(responses);
				},
				function() {
					return null;
				}
			)
			.then(function(data) {
				if (data == null) {
					return;
				}
				// don't overwrite newer network data
				if (!networkDataReceived) {
					cacheData = data;
					if (options.handleCachedData instanceof Function) options.handleCachedData(data);
					else callback(data);
				}
			});
	}
};

exports.post = function(url) {

}

function handleResponse(response, options) {
	if (!response) {
		return new Promise({
			function(resolve, reject) {
				reject();
			}
		});
	}
	if (!response.ok) {
		throw Error(response.statusText);
	}
	switch (options.dataType) {
		case 'json':
			return response.json();
		case 'blob':
			return response.blob();
		case 'arrayBuffer':
			return response.arrayBuffer();
		case 'formData':
			return response.formData();
		case 'text':
			return response.text();
		case 'raw':
			return response;
		default:
			return response.json();
	}
}

function timeoutPromise(ms, promise) {
	return new Promise((resolve, reject) => {
		const timeoutId = setTimeout(() => {
			reject(new Error('Request Timeout'));
		}, ms);
		promise.then(
			(res) => {
				clearTimeout(timeoutId);
				resolve(res);
			},
			(err) => {
				clearTimeout(timeoutId);
				reject(err);
			}
		);
	});
}
