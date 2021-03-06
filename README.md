[![Build Status](https://travis-ci.org/Tibblist/better-fetcher.svg?branch=master)](https://travis-ci.org/Tibblist/better-fetcher)
[![codecov](https://codecov.io/gh/Tibblist/better-fetch/branch/master/graph/badge.svg)](https://codecov.io/gh/Tibblist/better-fetch)
[![install size](https://packagephobia.now.sh/badge?p=better-fetcher)](https://packagephobia.now.sh/result?p=better-fetcher)
[![Known Vulnerabilities](https://snyk.io/test/github/Tibblist/better-fetch/badge.svg?targetFile=package.json)](https://snyk.io/test/github/Tibblist/better-fetch?targetFile=package.json)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)
[![HitCount](http://hits.dwyl.io/Tibblist/https://githubcom/Tibblist/better-fetch.svg)](http://hits.dwyl.io/Tibblist/https://githubcom/Tibblist/better-fetch)
[![dependencies](https://david-dm.org/Tibblist/better-fetch.svg)](https://david-dm.org/Tibblist/better-fetch)
[![Maintainability](https://api.codeclimate.com/v1/badges/18ae816bedeac6004eca/maintainability)](https://codeclimate.com/github/Tibblist/better-fetch/maintainability)
[![Downloads](https://img.shields.io/npm/dm/better-fetcher.svg)](https://www.npmjs.com/package/better-fetcher)

[![NPM](https://nodei.co/npm/better-fetcher.png?downloads=true)](https://www.npmjs.com/package/better-fetcher)

# better-fetcher

better-fetcher is a library to extend fetch and make it more in line with typical libraries that use regular httprequest like axios/superagent. It implements the standard get/put/post/delete calls in a similar style but instead uses fetch to make these calls for better compatibility with service workers and taking advantage of many other improvements in fetch like response streaming. It also addresses a few of the shortcomings with fetch such as no timeout and returning ok from a 404/500 response. It also provides support for making PWA/offline apps by including a mechanism in the get request to instead specify a callback rather than a promise that will be called once with cache data if found and then a network request will be sent out and the callback will be called again with recently obtained data from the network if the data differs from what was cached. You can also specify a local data source such as localStorage or indexedDB to retrieve data from before the call completes.

**Note:** This library does not cache anything itself. It will optionally check the cache for data for a request but won't store any new data it receives later in the cache, you need to use a service worker or some other method to cache all your fetch calls.

For compatability with older browsers use Promise and Fetch polyfills in the global scope.

If you have any questions, comments, or concerns feel free to reach out to me at tibblist@gmail.com. Feel free to submit a pull request as well if you find anything you can improve.

# Features:

- Implements simple wrappers for basic request types such as GET, PUT, POST and DELETE. (more coming soon)

- Automatically reads response headers and parses/streams data into correct type (can be overridden)

- Adds support for some features missing by fetch such as request timeouts and catching 4xx/5xx errors instead of just returning a response.

- Supports using service-workers and building a PWA/offline app by allowing you to first check the cache and then display that data while also pulling new data from the network (if possible) and displaying that as soon as it is received.

# Examples

Getting a simple json object from the server:

```js
  betterFetcher.get("MY URL")
 // Only need this if the response headers don't specify a dataType .then(response => response.json())
 .then(function(data) {console.log(data)});
 .catch(function(error) {console.log(error)}); //In the case of error sending request or returning a 4xx/5xx
```

Getting a simple json object from the server, with default dataType set to make it more like axios/superagent.

```js
    betterFetcher.setDefaultDataType("json"); //Attempts to parse all responses into json regardless of response headers
    betterFetcher.get("MY URL")
    	.then(function(data) {console.log(data)});
    	.catch(function(error) {console.log(error)}); //In the case of error sending request or returning a 4xx/5xx
    //Or you can do it on a per call basis
    betterFetcher.get("MY URL", {dataType: "json"}) //Parses response into json regardless of response headers
	.then(function(data) {console.log(data)});
	.catch(function(error) {console.log(error)});
```

Getting a simple json object from server, but displaying cached data first then network data once it is received:

```js
//Using promises
betterFetcher.get("MY URL", { useCache: true }, function(response) {
response.json().then(function(data) {
	updatePageView(data); //Will likely be called twice if there is a cache hit and then a network response
})
})
//Same example below but using async/await
betterFetcher.get("MY URL", { useCache: true }, function(response) {
var data = await response.json();
updatePageView(data); //Will likely be called twice if there is a cache hit and then a network response
})
```

Getting a simple json object from the server and automatically parsing it into json before returning:

```js
betterFetcher
  .get("MY URL", { dataType: "JSON" })
  .then(function(data) {
    console.log(data);
  })
  .catch(function(error) {
    console.log(error);
  });
```

Posting json to a server:

```js
betterFetcher
  .post("MY URL", { name: "George", id: 2 })
  .then(function(response) {
    doStuff(response);
  })
  .catch(function(error) {
    console.log(error);
  });
```

Sending cookies with requests:

```js
  betterFetcher.setDefaultCredentialsPolicy("same-origin");
  betterFetcher.get("MY PROTECTED URL")
    .then(response => response.json())
    .then(function(data) {console.log(data)});
    .catch(function(error) {console.log(error)});
```

# Documentation:

## Options

These are universal options that can be specified for any method that accepts an options object.

- **init**: You can use this to manually pass through an init object to the fetch call. This follows the same api/documentation as is specified [Here](https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/fetch)
- **timeout**: This is the time (in ms) before the fetch call will timeout. This will either abort the fetch call if browser supports it, or just simply return a timeout error if the browser doesn't support abortController yet.
- **mock**: Set this to a json object or Promise that will be returned as a result of the call, useful for testing.
- **params**: Set this to a json array of parameters that will be added to the url request string.

  Example:

  ```js
  //This will get MYURL.com/?username=test&password=123
  betterFetcher.get("MYURL.com", {
    params: {
      username: "Test",
      password: "123"
    }
  });
  ```

- **validator**: Set a custom validator to determine if a response is valid or not.

  Example:

  ```js
  betterFetcher
    .get("MY URL", {
      validator: function(resp) {
        return resp.status === 200;
      }
    })
    .catch(function(error) {
      //Called if response status is not 200
    });
  ```

## get(url, options, callback)

The get function is designed to be similar to axios.get() with differences in the options/config that are passed in.

### url:

The url destination to be fetched from. This will also be used as the key to check the cache for a cached response if useCache is set.

### options:

See the default options documentation for options that apply to all methods that use options.

- **dataType**: This will wait for the response stream to end and parse it into the data type specified. Possible options are arrayBuffer, blob, formData, json, text.

- **useLocalData**: Set this as a function that will be used to pull data from a local source and then returned data will be passed into the specified callback function. The function will be called with a fetch api [request object](https://developer.mozilla.org/en-US/docs/Web/API/Request/Request) if you want to use generic function that pulls local data based on the request parameters.

  Example:

  ```js
  betterFetcher
    .get(
      "MY URL",
      {
        useLocalData: function(req) {
          if (req.url === "HTTP://www.MYJSONDATA.COM") {
            return JSON.parse(localStorage.get("MY DATA"));
          }
        }
      },
      function(jsonObject) {
        updatePageView(jsonObject); //Will be called twice, once with localStorage returned object, then again if network call succeeds and returns json data.
      }
    )
    .catch(function(error) {
      logNetworkError(error);
    });
  ```

- **useCache**: Set this to be true to first return data from cache if it exists (via the callback that must also be specified this will NOT return a promise), and then pull down network data which will also be passed to the callback function after. You should handle caching the new data that gets pulled down with whatever method you want to use in your service worker as this method will only send the network data to the callback function and will not update the cache. There is also a check to see if the data differs from what is currently in the cache and the callback won't be called a second time if the data isn't different from what was cached.

If you want to handle network errors when useCache is set then see the example below:

```js
betterFetcher
  .get("MY URL", { useCache: true }, function(response) {
    response.json().then(function(data) {
      updatePageView(data);
    });
  })
  .catch(function(error) {
    logNetworkError(error);
  });
```

**Options below are only used if useCache is set.**

- **matchAll**: Set this to be true in order for the callback to be called with the results of cache.matchAll instead of cache.match.

- **handleCacheResponse**: Set a function that will be called upon a response being returned from the cache (use if you want 2 separate functions called on cache/network response). This will be called with a response object if no dataType is set and will be called with the data from the response if a dataType is set.

- **handleNetworkResponse**: Set a function that will be called upon a response being returned from the network. See cached handler for specifics.

**Warning**: It is recommended that you make sure these calls are not also checked for a match in the cache in the service worker since this will waste resources checking again. If the service worker returns cached data for the fetch call then that will also defeat the purpose of making a network call so make sure all calls to that URL bypass the cache in the service worker and return network data.

### callback:

This function is called with returned data from the cache and/or the network. This will only be used if the useCache option is set and is a mandatory parameter when the useCache option is set. It may be called multiple times, once when cache data is found and another when the network request comes back with up to date data.

**Warning**: Do not rely on it being called multiple times since there may not be any available cached data to return and/or the network may return data identical to what is in the cache. In either case the callback function would only be called once.

## post/put(url, data, options)

Automatically adds method and serializes json objects to be sent in a post/put request. If sending a json object or string then automatically sets content-type to 'application/json'. Any default headers or manually specified headers in options will override 'application/json' headers.

### url:

The url to send the post request to.

### data:

Can be a json object or custom data type but if it is a custom data type then you must also set the content-type in options.init manually.

### options:

Nothing beyond the default options for all requests yet.

## delete(url, options)

Sends a delete request to the specified url using the specified options. There are no specific options to this method beyond the general options.

## Library modifying methods

### setDefaultHeaders(headers, type)

Use this method to set default headers that will automatically be combined with the headers you specifically set in options.init.header for all requests of the specified type. Valid types are GET, POST, PUT, DELETE, ALL. The priority when merging headers will be ALL < (specific type) < options.init.headers.

### getDefaultHeaders(type)

### setDefaultOptions(config)

Use this method to set default options that will be passed to every request. These can be overridden still on a per request basis if you set something else in the options you pass in then it will override the defaults. Options that are specific to a type of request will only be passed to requests of that type if set as a default. Headers should be set via setDefaultHeaders since you can set headers to be default per request type if need be. Setting headers in the default config.init.headers will likely work in most cases but hasn't been thoroughly tested yet since it isn't desired behavior.

# FAQ:

**Q**: I am getting an error when doing get().then()?

**A**: Check if you are setting useCache in your options. If you are then you must pass a callback function as the third parameter which will be called twice if there is a cache hit for the response and the network also returns data.
