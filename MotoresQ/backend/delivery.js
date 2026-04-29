// ==================================================
// DELIVERY UI - MOTORESQ (FULLY WORKING)
// Features: Live location, Route map, Accept Pickup, Deliver
// ==================================================

let map = null;
let deliveryId = "D1";
let deliveryLat = 30.3165;
let deliveryLng = 78.0322;
let routingControl = null;
let currentActiveRequest = null;
let watchId = null;
let refreshInterval = null;

// DOM Elements
const liveLocationDiv = document.getElementById('liveLocation');
const statusTextDiv = document.getElementById('statusText');
const requestsListDiv = document.getElementById('requestsList');
const pendingCountSpan = document.getElementById('pendingCount');
const activeCountSpan = document.getElementById('activeCount');
const deliveryNameSpan = document.getElementById('deliveryName');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚚 Delivery UI Initialized');
    deliveryNameSpan.innerHTML = `D1 - Delivery Partner`;
    initMap();
    startLiveLocation();
    loadRequests();
    // Auto refresh every 3 seconds
    refreshInterval = setInterval(loadRequests, 3000);
});

// ========== MAP FUNCTIONS ==========
function initMap() {
    map = L.map('map').setView([deliveryLat, deliveryLng], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);
    
    // Add delivery marker
    const deliveryIcon = L.divIcon({
        html: '🛵',
        iconSize: [30, 30],
        className: 'delivery-marker'
    });
    L.marker([deliveryLat, deliveryLng], { icon: deliveryIcon }).addTo(map).bindPopup('You are here');
}

function updateRouteOnMap() {
    // Clear existing route
    if (routingControl) {
        map.removeControl(routingControl);
        routingControl = null;
    }
    
    if (!currentActiveRequest) return;
    
    let waypoints = [];
    let routeColor = '#ff9800';
    
    if (currentActiveRequest.status === 'accepted') {
        // Route from delivery person to provider
        waypoints = [
            L.latLng(deliveryLat, deliveryLng),
            L.latLng(currentActiveRequest.providerLat, currentActiveRequest.providerLng)
        ];
        routeColor = '#ff9800';
        statusTextDiv.innerHTML = `🟠 Route to PROVIDER: ${currentActiveRequest.providerName} (${calculateDistance(deliveryLat, deliveryLng, currentActiveRequest.providerLat, currentActiveRequest.providerLng).toFixed(2)} km)`;
    } else if (currentActiveRequest.status === 'picked') {
        // Route from delivery person to user
        waypoints = [
            L.latLng(deliveryLat, deliveryLng),
            L.latLng(currentActiveRequest.userLat, currentActiveRequest.userLng)
        ];
        routeColor = '#28a745';
        statusTextDiv.innerHTML = `🟢 Route to USER: ${currentActiveRequest.userName} (${calculateDistance(deliveryLat, deliveryLng, currentActiveRequest.userLat, currentActiveRequest.userLng).toFixed(2)} km)`;
    }
    
    if (waypoints.length === 2) {
        routingControl = L.Routing.control({
            waypoints: waypoints,
            routeWhileDragging: false,
            lineOptions: { styles: [{ color: routeColor, weight: 5, opacity: 0.8 }] },
            createMarker: function() { return null; },
            show: false
        }).addTo(map);
    }
}

// ========== LIVE LOCATION ==========
function startLiveLocation() {
    if (!navigator.geolocation) {
        liveLocationDiv.innerHTML = '❌ Geolocation not supported by your browser';
        return;
    }
    
    // Watch position for continuous updates
    watchId = navigator.geolocation.watchPosition(
        (position) => {
            deliveryLat = position.coords.latitude;
            deliveryLng = position.coords.longitude;
            liveLocationDiv.innerHTML = `📍 Live Location: ${deliveryLat.toFixed(6)}, ${deliveryLng.toFixed(6)} (Accuracy: ${position.coords.accuracy}m)`;
            
            // Update map center
            if (map) {
                map.setView([deliveryLat, deliveryLng], 14);
                updateRouteOnMap();
            }
        },
        (error) => {
            let errorMsg = '';
            switch(error.code) {
                case error.PERMISSION_DENIED:
                    errorMsg = 'Please allow location access';
                    break;
                case error.POSITION_UNAVAILABLE:
                    errorMsg = 'Location unavailable. Using default location.';
                    break;
                case error.TIMEOUT:
                    errorMsg = 'Location request timeout';
                    break;
                default:
                    errorMsg = 'Unknown error';
            }
            liveLocationDiv.innerHTML = `⚠️ ${errorMsg}`;
            deliveryLat = 30.3165;
            deliveryLng = 78.0322;
        },
        { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
    );
}

// ========== DISTANCE CALCULATION ==========
function calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371.0;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// ========== LOAD REQUESTS FROM SERVER ==========
async function loadRequests() {
    try {
        const response = await fetch('http://localhost:8080/api/delivery/requests');
        const data = await response.json();
        console.log('📦 Delivery requests received:', data);
        
        // Find current active request
        const activeRequest = data.requests.find(r => r.status === 'accepted' || r.status === 'picked');
        
        if (activeRequest) {
            currentActiveRequest = activeRequest;
            updateRouteOnMap();
        } else {
            currentActiveRequest = null;
            if (routingControl) {
                map.removeControl(routingControl);
                routingControl = null;
            }
            statusTextDiv.innerHTML = '✅ No active deliveries. Waiting for requests...';
        }
        
        displayRequests(data.requests);
        updateStats(data.requests);
        
    } catch (error) {
        console.error('❌ Error loading requests:', error);
        requestsListDiv.innerHTML = '<div class="error">❌ Cannot connect to server. Make sure server is running on port 8080.</div>';
        statusTextDiv.innerHTML = '❌ Server connection lost';
    }
}

// ========== DISPLAY REQUESTS ==========
function displayRequests(requests) {
    const myRequests = requests.filter(r => r.status === 'accepted' || r.status === 'picked');
    
    if (myRequests.length === 0) {
        requestsListDiv.innerHTML = '<p style="margin: 20px 25px; color: #999;">📭 No assigned requests. Waiting for provider to accept...</p>';
        return;
    }
    
    let html = '';
    for (const req of myRequests) {
        const distanceToProvider = calculateDistance(deliveryLat, deliveryLng, req.providerLat, req.providerLng);
        const distanceToUser = calculateDistance(deliveryLat, deliveryLng, req.userLat, req.userLng);
        
        html += `
            <div class="request-card ${req.status}">
                <h4>📋 Request ID: ${req.id}</h4>
                <p><strong>👤 User:</strong> ${req.userName}</p>
                <p><strong>📍 User Location:</strong> ${req.userLat.toFixed(5)}, ${req.userLng.toFixed(5)}</p>
                <p><strong>🔧 Service Type:</strong> ${req.type === 'fuel' ? '⛽ Fuel Station' : '🔧 Mechanic'}</p>
                <p><strong>🏪 Provider:</strong> ${req.providerName}</p>
                <p><strong>📍 Provider Location:</strong> ${req.providerLat.toFixed(5)}, ${req.providerLng.toFixed(5)}</p>
                <p><strong>📏 Your distance to provider:</strong> <span style="color:#ff9800; font-weight:bold;">${distanceToProvider.toFixed(2)} km</span></p>
                ${req.status === 'picked' ? `<p><strong>📏 Your distance to user:</strong> <span style="color:#28a745; font-weight:bold;">${distanceToUser.toFixed(2)} km</span></p>` : ''}
                <p><strong>📊 Status:</strong> <span style="color:${req.status === 'accepted' ? '#ff9800' : '#28a745'}; font-weight:bold;">${req.status.toUpperCase()}</span></p>
                <div>
                    ${req.status === 'accepted' ? `<button class="accept-pickup-btn" data-id="${req.id}" style="background:#ff9800; color:white; border:none; padding:10px 20px; border-radius:8px; cursor:pointer; margin-right:10px;">🛵 Accept Pickup (Go to Provider)</button>` : ''}
                    ${req.status === 'picked' ? `<button class="deliver-btn" data-id="${req.id}" style="background:#28a745; color:white; border:none; padding:10px 20px; border-radius:8px; cursor:pointer; margin-right:10px;">✅ Mark Delivered (Go to User)</button>` : ''}
                    <button class="show-route-btn" data-id="${req.id}" style="background:#2196f3; color:white; border:none; padding:10px 20px; border-radius:8px; cursor:pointer;">🗺️ Show Route</button>
                </div>
            </div>
        `;
    }
    requestsListDiv.innerHTML = html;
    
    // Attach event listeners to dynamically created buttons
    document.querySelectorAll('.accept-pickup-btn').forEach(btn => {
        btn.addEventListener('click', () => acceptPickup(btn.getAttribute('data-id')));
    });
    document.querySelectorAll('.deliver-btn').forEach(btn => {
        btn.addEventListener('click', () => markDelivered(btn.getAttribute('data-id')));
    });
    document.querySelectorAll('.show-route-btn').forEach(btn => {
        btn.addEventListener('click', () => showRouteForRequest(btn.getAttribute('data-id')));
    });
}

// ========== UPDATE STATS ==========
function updateStats(requests) {
    const myRequests = requests.filter(r => r.status === 'accepted' || r.status === 'picked');
    const pending = myRequests.filter(r => r.status === 'accepted').length;
    const active = myRequests.filter(r => r.status === 'picked').length;
    
    pendingCountSpan.innerText = pending;
    activeCountSpan.innerText = active;
}

// ========== SHOW ROUTE FOR SPECIFIC REQUEST ==========
async function showRouteForRequest(requestId) {
    try {
        const response = await fetch('http://localhost:8080/api/delivery/requests');
        const data = await response.json();
        const selectedRequest = data.requests.find(r => r.id === requestId);
        
        if (selectedRequest && (selectedRequest.status === 'accepted' || selectedRequest.status === 'picked')) {
            currentActiveRequest = selectedRequest;
            updateRouteOnMap();
            
            const destination = selectedRequest.status === 'accepted' ? selectedRequest.providerName : selectedRequest.userName;
            alert(`🗺️ Route updated! Showing route to ${destination}`);
        } else {
            alert('❌ Cannot show route for this request');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('❌ Error showing route');
    }
}

// ========== ACCEPT PICKUP ==========
async function acceptPickup(requestId) {
    statusTextDiv.innerHTML = '🔄 Accepting pickup...';
    console.log('🛵 Accepting pickup for:', requestId);
    
    try {
        // Make sure URL is correct
        const url = `http://localhost:8080/api/delivery/accept?id=${requestId}&deliveryId=${deliveryId}`;
        console.log('📡 Fetching URL:', url);
        
        const response = await fetch(url);
        const data = await response.json();
        console.log('✅ Accept pickup response:', data);
        
        if (data.success === true) {
            statusTextDiv.innerHTML = '✅ Pickup accepted! Navigate to provider.';
            alert('✅ Pickup accepted! Route updated on map.');
            await loadRequests(); // Refresh
            
            // Send notification to user
            await fetch('http://localhost:8080/api/notify/user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: '🛵 Delivery partner is on the way to pick up your service!' })
            });
        } else {
            statusTextDiv.innerHTML = '❌ Failed to accept pickup';
            alert('❌ Failed to accept pickup. Make sure request status is "accepted".');
        }
    } catch (error) {
        console.error('Error:', error);
        statusTextDiv.innerHTML = '❌ Error accepting pickup';
        alert('❌ Error accepting pickup: ' + error.message);
    }
}

// ========== MARK DELIVERED ==========
async function markDelivered(requestId) {
    statusTextDiv.innerHTML = '🔄 Marking as delivered...';
    console.log('✅ Marking delivered for:', requestId);
    
    try {
        const response = await fetch(`http://localhost:8080/api/delivery/deliver?id=${requestId}`);
        const data = await response.json();
        console.log('✅ Deliver response:', data);
        
        if (data.success) {
            statusTextDiv.innerHTML = '✅ Service delivered successfully!';
            alert('✅ Service delivered successfully!');
            await loadRequests(); // Refresh
            
            // Send notification to user
            await fetch('http://localhost:8080/api/notify/user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: '✅ Your service has been delivered! Thank you for using MotoresQ.' })
            });
            
            // Send notification to provider
            await fetch('http://localhost:8080/api/notify/provider', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: '✅ Service has been delivered to the user!' })
            });
        } else {
            statusTextDiv.innerHTML = '❌ Failed to mark delivered';
            alert('❌ Failed to mark delivered');
        }
    } catch (error) {
        console.error('Error:', error);
        statusTextDiv.innerHTML = '❌ Error marking delivered';
        alert('❌ Error marking delivered');
    }
}