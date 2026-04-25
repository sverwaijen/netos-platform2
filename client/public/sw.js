// Mr. Green Members App Service Worker
// Cache-first strategy for static assets, network-first for API calls

const CACHE_NAME = "mr-green-app-v1";
const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/manifest.json",
  "/favicon.ico",
];

// Install event - cache static assets
self.addEventListener("install", (event) => {
  console.log("Service Worker installing...");
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.log("Cache addAll error:", err);
      });
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  console.log("Service Worker activating...");
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log("Deleting old cache:", cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - cache-first for static, network-first for API
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== "GET") {
    return;
  }

  // Network-first for API calls (tRPC)
  if (url.pathname.includes("/trpc")) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Only cache successful responses
          if (response.ok) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return response;
        })
        .catch(() => {
          // If network fails, try cache
          return caches.match(request);
        })
    );
    return;
  }

  // Cache-first for static assets
  event.respondWith(
    caches.match(request).then((response) => {
      if (response) {
        return response;
      }

      return fetch(request).then((response) => {
        // Cache successful GET responses
        if (response.ok && !url.pathname.includes("api")) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
        }
        return response;
      });
    })
  );
});

// Handle background sync for offline bookings (optional)
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-bookings") {
    event.waitUntil(syncBookings());
  }
});

async function syncBookings() {
  try {
    // Retrieve pending bookings from IndexedDB
    const db = await openIndexedDB();
    const pendingBookings = await getPendingBookings(db);

    for (const booking of pendingBookings) {
      try {
        const response = await fetch("/trpc/bookings.create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(booking),
        });

        if (response.ok) {
          await removePendingBooking(db, booking.id);
          // Notify client
          self.clients.matchAll().then((clients) => {
            clients.forEach((client) => {
              client.postMessage({
                type: "BOOKING_SYNCED",
                bookingId: booking.id,
              });
            });
          });
        }
      } catch (err) {
        console.error("Failed to sync booking:", err);
      }
    }
  } catch (err) {
    console.error("Sync failed:", err);
    throw err;
  }
}

function openIndexedDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("mr-green-app", 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains("pending-bookings")) {
        db.createObjectStore("pending-bookings", { keyPath: "id" });
      }
    };
  });
}

function getPendingBookings(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(["pending-bookings"], "readonly");
    const store = transaction.objectStore("pending-bookings");
    const request = store.getAll();
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

function removePendingBooking(db, id) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(["pending-bookings"], "readwrite");
    const store = transaction.objectStore("pending-bookings");
    const request = store.delete(id);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}
