[![Build Status](https://travis-ci.org/Tibblist/better-fetch.svg?branch=master)](https://travis-ci.org/Tibblist/better-fetch)

# better-fetch

  

better-fetch is a library to extend fetch and make it more in line with typical libraries that use regular httprequest like axios/superagent. It implements the standard get/put/post/delete calls in a similar style but instead uses fetch to make these calls for better compatibility with service workers and taking advantage of many other improvements in fetch like response streaming. It also addresses a few of the shortcomings with fetch such as no timeout and returning ok from a 404/500 resoonse. It also provides support for making PWA/offline apps by including a mechanism in the get request to instead specify a callback rather than a promise that will be called once with cache data if found and then a network request will be sent out and the callback will be called again with recently obtained data from the network if the data differs from what was cached.

  

# Features:

  

- Implements simple wrappers for basic request types such as GET, PUT, POST and DELETE. (more coming soon)
- Adds support for some features missing by fetch such as request timeouts and catching 4xx/5xx errors instead of just returning a response. 
- Supports using service-workers and building a PWA/offline app by allowing you to first check the cache and then display that data while also pulling new data from the network (if possible) and displaying that as soon as it is received.

  

# Documentation:

## get(url, options, callback):

The get function is designed to be similar to axios.get() with differences in the options/config that are passed in.

### url:

The url destination to be fetched from. This will also be used as the key to check the cache for a cached response.

### options:
See the default options documentation for options that apply to all methods that use options.
- **dataType**: This will wait for the response stream to end and parse it into the data type specified.
- **useCache**: Set this to be true to first return data from cache if it exists (via the callback that must also be specified this will NOT return a promise), and then pull down network data which will also be passed to the callback function after. You should handle caching the new data that gets pulled down with whatever method you want to use in your service worker as this method will only send the network data to the callback function and will not update the cache. There is also a check to see if the data differs from what is currently in the cache and the callback won't be called a second time if the data isn't different from what was cached. **Options below are only used if useCache is set.**
	- **matchAll**: Set this to be true in order for the callback to be called with the results of cache.matchAll instead of cache.match.
	 - **handleCacheResponse**: Set a function that will be called upon a response being returned from the cache (use if you want 2 separate functions called on cache/network response). This will be called with a response object if no dataType is set and will be called with the data from the response if a dataType is set.
	 - **handleNetworkResponse**: Set a function that will be called upon a response being returned from the network. See cached handler for specifics.
	 
**Warning**: It is recommended that you make sure these calls are not also checked for a match in the cache in the service worker since this will waste resources checking again and also make the network call return the same cached data defeating the purpose of checking the network after pulling cached data.

### callback:

This function is called with returned data from either the cache or the network. This will only be used if the useCache option is set and is a mandatory parameter when the useCache option is set. It may be called multiple times, once when cache data is found and another when the network request comes back with up to date data. 
**Warning**: Do not rely on it being called multiple times since there may not be any available cached data to return and/or the netowrk may return data identical to what is in the cache. In either case the callback function would only be called once.

  

# FAQ:

**Q**: I am getting an error when doing get().then()?

  

**A**: This is because this implementation of fetch doesn't use a promise since it needs to be able to run the callback function multiple times if/when newer data comes in.
