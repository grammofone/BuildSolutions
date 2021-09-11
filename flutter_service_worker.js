'use strict';
const MANIFEST = 'flutter-app-manifest';
const TEMP = 'flutter-temp-cache';
const CACHE_NAME = 'flutter-app-cache';
const RESOURCES = {
  "assets/AssetManifest.json": "e16e761a1fb5f95734952b7053bbe10b",
"assets/FontManifest.json": "dc3d03800ccca4601324923c0b1d6d57",
"assets/fonts/MaterialIcons-Regular.otf": "1288c9e28052e028aba623321f7826ac",
"assets/lib/icons/android_icon.png": "8d215f4a35640e70749c5152ba31f794",
"assets/lib/icons/apple_icon.png": "a5f3d30265ff51222d1f85da968efe1a",
"assets/lib/icons/cross_platform_icon.png": "46368ee427de61208120cd1fd1479083",
"assets/lib/icons/github_2x.png": "6401c06a4431eb5619083e6a1783ed63",
"assets/lib/icons/linkedin_2x.png": "05c47a776fed9b4cd955e073f6528255",
"assets/lib/icons/mob_dev.png": "0b269d07676728567ecc4515b45ee02a",
"assets/lib/icons/pegas.png": "fb2bac82d6bd10c5a5d902929277c522",
"assets/lib/icons/pegas.svg": "32e08f1dc6bb4a88c163121fb6bbc8ec",
"assets/lib/icons/pen.png": "858e481ed2f6569c100ad50159f99f86",
"assets/lib/icons/solutions.png": "9ff375160323121e57e2b7a398d704b2",
"assets/lib/icons/solutions.svg": "df765bbad72906263ad5846e6ccb8161",
"assets/lib/icons/twitter_2x.png": "d5011590d94aab0f6e051754d553459d",
"assets/lib/icons/web.png": "344fd3cde2e70569da2f0df1ef555759",
"assets/lib/images/0.png": "af7bf526407d0e0140287b605720977e",
"assets/lib/images/1.png": "c64a8a5abfc72528c46e92f6fe85870e",
"assets/lib/images/2.png": "06e7deb10811f59810c8f0cbe8a9dfc4",
"assets/lib/images/app_animations.gif": "ce4f4dd103210955989e9aaaf31b0bfe",
"assets/lib/images/developer_activity.svg": "fd90994a62e11dae7b8e7bdb2aeafc24",
"assets/lib/images/dev_productivity.png": "c39d31305caab71a1b588ca69da2e7a2",
"assets/lib/images/dev_productivity.svg": "be05fb23bfb6ade7684974eb9c61d1fd",
"assets/NOTICES": "bd2ea93afd1943825241ea48993aaab3",
"assets/packages/cupertino_icons/assets/CupertinoIcons.ttf": "6d342eb68f170c97609e9da345464e5e",
"ic.png": "8ec3982aeae208a342e5210678aad56b",
"icons/Icon-192.png": "ac9a721a12bbc803b44f645561ecb1e1",
"icons/Icon-512.png": "96e752610906ba2a93c65f8abe1645f1",
"index.html": "23ea1764f8cf9a7f6a12ad57587c63e8",
"/": "23ea1764f8cf9a7f6a12ad57587c63e8",
"main.dart.js": "f92cd788a4515e0e850b853e61c30c52",
"manifest.json": "0bbaea19127874419dbe5ec0f18ebf30",
"pegas.svg": "32e08f1dc6bb4a88c163121fb6bbc8ec",
"version.json": "cf85676e37bd1bd909c5d038a8b2b920"
};

// The application shell files that are downloaded before a service worker can
// start.
const CORE = [
  "/",
"main.dart.js",
"index.html",
"assets/NOTICES",
"assets/AssetManifest.json",
"assets/FontManifest.json"];
// During install, the TEMP cache is populated with the application shell files.
self.addEventListener("install", (event) => {
  self.skipWaiting();
  return event.waitUntil(
    caches.open(TEMP).then((cache) => {
      return cache.addAll(
        CORE.map((value) => new Request(value + '?revision=' + RESOURCES[value], {'cache': 'reload'})));
    })
  );
});

// During activate, the cache is populated with the temp files downloaded in
// install. If this service worker is upgrading from one with a saved
// MANIFEST, then use this to retain unchanged resource files.
self.addEventListener("activate", function(event) {
  return event.waitUntil(async function() {
    try {
      var contentCache = await caches.open(CACHE_NAME);
      var tempCache = await caches.open(TEMP);
      var manifestCache = await caches.open(MANIFEST);
      var manifest = await manifestCache.match('manifest');
      // When there is no prior manifest, clear the entire cache.
      if (!manifest) {
        await caches.delete(CACHE_NAME);
        contentCache = await caches.open(CACHE_NAME);
        for (var request of await tempCache.keys()) {
          var response = await tempCache.match(request);
          await contentCache.put(request, response);
        }
        await caches.delete(TEMP);
        // Save the manifest to make future upgrades efficient.
        await manifestCache.put('manifest', new Response(JSON.stringify(RESOURCES)));
        return;
      }
      var oldManifest = await manifest.json();
      var origin = self.location.origin;
      for (var request of await contentCache.keys()) {
        var key = request.url.substring(origin.length + 1);
        if (key == "") {
          key = "/";
        }
        // If a resource from the old manifest is not in the new cache, or if
        // the MD5 sum has changed, delete it. Otherwise the resource is left
        // in the cache and can be reused by the new service worker.
        if (!RESOURCES[key] || RESOURCES[key] != oldManifest[key]) {
          await contentCache.delete(request);
        }
      }
      // Populate the cache with the app shell TEMP files, potentially overwriting
      // cache files preserved above.
      for (var request of await tempCache.keys()) {
        var response = await tempCache.match(request);
        await contentCache.put(request, response);
      }
      await caches.delete(TEMP);
      // Save the manifest to make future upgrades efficient.
      await manifestCache.put('manifest', new Response(JSON.stringify(RESOURCES)));
      return;
    } catch (err) {
      // On an unhandled exception the state of the cache cannot be guaranteed.
      console.error('Failed to upgrade service worker: ' + err);
      await caches.delete(CACHE_NAME);
      await caches.delete(TEMP);
      await caches.delete(MANIFEST);
    }
  }());
});

// The fetch handler redirects requests for RESOURCE files to the service
// worker cache.
self.addEventListener("fetch", (event) => {
  if (event.request.method !== 'GET') {
    return;
  }
  var origin = self.location.origin;
  var key = event.request.url.substring(origin.length + 1);
  // Redirect URLs to the index.html
  if (key.indexOf('?v=') != -1) {
    key = key.split('?v=')[0];
  }
  if (event.request.url == origin || event.request.url.startsWith(origin + '/#') || key == '') {
    key = '/';
  }
  // If the URL is not the RESOURCE list then return to signal that the
  // browser should take over.
  if (!RESOURCES[key]) {
    return;
  }
  // If the URL is the index.html, perform an online-first request.
  if (key == '/') {
    return onlineFirst(event);
  }
  event.respondWith(caches.open(CACHE_NAME)
    .then((cache) =>  {
      return cache.match(event.request).then((response) => {
        // Either respond with the cached resource, or perform a fetch and
        // lazily populate the cache.
        return response || fetch(event.request).then((response) => {
          cache.put(event.request, response.clone());
          return response;
        });
      })
    })
  );
});

self.addEventListener('message', (event) => {
  // SkipWaiting can be used to immediately activate a waiting service worker.
  // This will also require a page refresh triggered by the main worker.
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
    return;
  }
  if (event.data === 'downloadOffline') {
    downloadOffline();
    return;
  }
});

// Download offline will check the RESOURCES for all files not in the cache
// and populate them.
async function downloadOffline() {
  var resources = [];
  var contentCache = await caches.open(CACHE_NAME);
  var currentContent = {};
  for (var request of await contentCache.keys()) {
    var key = request.url.substring(origin.length + 1);
    if (key == "") {
      key = "/";
    }
    currentContent[key] = true;
  }
  for (var resourceKey of Object.keys(RESOURCES)) {
    if (!currentContent[resourceKey]) {
      resources.push(resourceKey);
    }
  }
  return contentCache.addAll(resources);
}

// Attempt to download the resource online before falling back to
// the offline cache.
function onlineFirst(event) {
  return event.respondWith(
    fetch(event.request).then((response) => {
      return caches.open(CACHE_NAME).then((cache) => {
        cache.put(event.request, response.clone());
        return response;
      });
    }).catch((error) => {
      return caches.open(CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((response) => {
          if (response != null) {
            return response;
          }
          throw error;
        });
      });
    })
  );
}
