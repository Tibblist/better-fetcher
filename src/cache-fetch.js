var exports = (module.exports = {});
var CACHE_NAME = '';

exports.setCacheName = function(name) {
	CACHE_NAME = name;
};

exports.getCacheName = function() {
	return CACHE_NAME;
};
/*
url:
Set to the destination that you want to fetch data from.
options:
matchAll - Set flag true to match all responses in the cache instead of first hit
rawData - Set true to return the raw response from the cache instead of JSON
callback:
The function to be called with data as it is received. Expect this function to be called multiple times given that it will likely first be called with cache data and then called with updated network data. 
Do not rely on it being called twice however given that it won't be called a second time if network data returns first or cache data does not exist
*/
exports.get = function(url, options, callback) {
	var networkDataReceived = false;
	var cacheData = {};
	// fetch fresh data
	var networkUpdate = fetch(url)
		.then(function(response) {
			if (!options.rawData) return response.json();
			else return response;
		})
		.then(function(data) {
			networkDataReceived = true;
			if (!options.rawData && JSON.stringify(data) !== JSON.stringify(cacheData)) callback(data); //TODO: Implement better comparison method
			else if (JSON.stringify(data.json()) !== JSON.stringify(cacheData.json())) callback(data); 
		});

	// fetch cached data
	if (!options.matchAll) {
		caches
			.match(url)
			.then(function(response) {
				if (!response) throw Error('No data');
				if (!options.rawData) return response.json();
				else return response;
			})
			.then(function(data) {
				// don't overwrite newer network data
				if (!networkDataReceived) {
					callback(data);
				}
			})
			.catch(function() {
				// we didn't get cached data, the network is our last hope
				return networkUpdate;
			})
			.catch(showErrorMessage)
			.then(stopSpinner);
	} else {
		caches
			.matchAll(url)
			.then(function(response) {
				if (!response) throw Error('No data');
				if (!options.rawData) {
					var responses = [];
					response.forEach((element) => {
						responses.push(element.json());
					});
					return responses;
				} else {
					return response;
				}
			})
			.then(function(data) {
				// don't overwrite newer network data
				if (!networkDataReceived) {
					cacheData = data;
					callback(data);
				}
			})
			.catch(function() {
				// we didn't get cached data, the network is our last hope
				return networkUpdate;
			})
			.catch(showErrorMessage)
			.then(stopSpinner);
	}
};
