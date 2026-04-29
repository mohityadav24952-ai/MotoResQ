// ==================================================
// USER UI - MOTORESQ (Complete)
// ==================================================

let map = null;
let userMarker = null;
let providerMarkers = [];
let userLocation = null;
let statusInterval = null;

document.addEventListener('DOMContentLoaded', () => {
    console.log('🚗 MotoresQ User UI initialized');
    
    document.getElementById('fuelBtn').addEventListener('click', () => {
        findService('fuel');
    });
    
    document.getElementById('mechanicBtn').addEventListener('click', () => {
        findService('mechanic');
    });
    
    document.getElementById('closeMapBtn').addEventListener('click', () => {
        document.getElementById('mapContainer').style.display = 'none';
    });
    
    getUserLocation();
    
    // Start checking request status every 3 seconds
    statusInterval = setInterval(checkRequestStatus, 3000);
});

function getUserLocation() {
    const statusEl = document.getElementById('locationStatus');
    const indicator = statusEl.querySelector('.status-indicator');
    const statusText = statusEl.querySelector('span');
    
    if (!navigator.geolocation) {
        statusText.textContent = '❌ Geolocation not supported';
        indicator.className = 'status-indicator error';
        return;
    }
    
    statusText.textContent = '📍 Getting your location...';
    indicator.className = 'status-indicator';
    
    navigator.geolocation.getCurrentPosition(
        (position) => {
            userLocation = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };
            statusText.textContent = `✅ Location found! (${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)})`;
            indicator.className = 'status-indicator success';
            console.log('📍 User location:', userLocation);
        },
        (error) => {
            console.log('❌ Location error:', error);
            statusText.textContent = '⚠️ Using default location (Dehradun)';
            indicator.className = 'status-indicator error';
            userLocation = { lat: 30.3165, lng: 78.0322 };
        }
    );
}

function findService(type) {
    if (!userLocation) {
        alert('Please wait, getting your location...');
        return;
    }
    
    const serviceName = type === 'fuel' ? 'gas stations' : 'mechanics';
    const providersList = document.getElementById('providersList');
    
    providersList.innerHTML = `
        <div class="loading-spinner">
            <div class="spinner"></div>
            <p>🔍 Finding nearest ${serviceName}...</p>
        </div>
    `;
    
    const url = `http://localhost:8080/api/${type}?lat=${userLocation.lat}&lng=${userLocation.lng}`;
    console.log('📡 Fetching:', url);
    
    fetch(url)
        .then(response => response.json())
        .then(data => {
            console.log('✅ Received providers:', data);
            displayProviders(data.providers, type);
            showOnMap(data.providers, type);
        })
        .catch(error => {
            console.error('❌ Error:', error);
            providersList.innerHTML = `<div class="error-message">❌ Cannot connect to server. Make sure server is running!</div>`;
        });
}

function displayProviders(providers, type) {
    const providersList = document.getElementById('providersList');
    
    if (!providers || providers.length === 0) {
        providersList.innerHTML = '<div class="error-message">No providers found nearby</div>';
        return;
    }
    
    let html = '';
    providers.forEach((provider, index) => {
        const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
        
        html += `
            <div class="provider-card ${type}-card">
                <div class="provider-rank">${medal}</div>
                <div class="provider-info">
                    <h3>${provider.name}</h3>
                    <p>📍 ${provider.address}</p>
                    <p>📞 ${provider.phone}</p>
                    <p>⭐ ${provider.rating}/5</p>
                    <div style="display: flex; gap: 10px; margin-top: 10px;">
                        <button class="directions-btn" onclick="getDirections(${provider.lat}, ${provider.lng})">
                            🗺️ Directions
                        </button>
                        <button class="request-btn" onclick="sendRequest('${provider.name}', '${provider.id}', ${provider.lat}, ${provider.lng})">
                            📨 Send Request
                        </button>
                    </div>
                </div>
                <div class="provider-distance">
                    <span class="distance-value">${provider.distance}</span>
                    <span class="distance-unit">km</span>
                </div>
            </div>
        `;
    });
    
    providersList.innerHTML = html;
}

// Send request to server
async function sendRequest(providerName, providerId, lat, lng) {
    const url = `http://localhost:8080/api/sendrequest?providerId=${providerId}&userName=User&lat=${userLocation.lat}&lng=${userLocation.lng}`;
    
    try {
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.success) {
            alert(`✅ Request sent to ${providerName}! Waiting for provider to accept.`);
            // Store current request ID to track status
            localStorage.setItem('currentRequestId', data.requestId);
            showRequestStatusPanel();
        } else {
            alert('❌ Failed to send request. Please try again.');
        }
    } catch (error) {
        console.error('Error sending request:', error);
        alert('❌ Cannot connect to server. Make sure server is running!');
    }
}

// Show request status panel
function showRequestStatusPanel() {
    const providersList = document.getElementById('providersList');
    const existingPanel = document.getElementById('requestStatusPanel');
    
    if (existingPanel) {
        existingPanel.style.display = 'block';
        return;
    }
    
    const statusPanel = document.createElement('div');
    statusPanel.id = 'requestStatusPanel';
    statusPanel.style.cssText = `
        background: #e3f2fd;
        border: 2px solid #2196f3;
        border-radius: 12px;
        padding: 15px;
        margin: 15px 0;
        font-family: monospace;
    `;
    statusPanel.innerHTML = `
        <h3>📋 Your Request Status</h3>
        <div id="requestStatusDetails">Checking status...</div>
    `;
    
    providersList.parentNode.insertBefore(statusPanel, providersList);
}

// Check request status from server - SHOWS ALL REQUESTS
async function checkRequestStatus() {
    try {
        const response = await fetch('http://localhost:8080/api/user/status');
        const data = await response.json();
        
        const statusPanel = document.getElementById('requestStatusPanel');
        if (statusPanel && data.requests && data.requests.length > 0) {
            // Show ALL requests, not just last one
            let statusHtml = '<div style="max-height: 300px; overflow-y: auto;">';
            
            for (const req of data.requests) {
                let statusColor = '';
                let statusIcon = '';
                let statusText = '';
                let progressWidth = '';
                
                if (req.status === 'pending') {
                    statusColor = '#ff9800';
                    statusIcon = '🕐';
                    statusText = 'Waiting for provider to accept...';
                    progressWidth = '25%';
                } else if (req.status === 'accepted') {
                    statusColor = '#28a745';
                    statusIcon = '✅';
                    statusText = 'Provider has ACCEPTED your request! Delivery partner will be assigned.';
                    progressWidth = '50%';
                } else if (req.status === 'picked') {
                    statusColor = '#2196f3';
                    statusIcon = '🛵';
                    statusText = 'Delivery partner has PICKED UP your service and is on the way!';
                    progressWidth = '75%';
                } else if (req.status === 'delivered') {
                    statusColor = '#4caf50';
                    statusIcon = '🎉';
                    statusText = 'SERVICE DELIVERED! Thank you for using MotoresQ.';
                    progressWidth = '100%';
                }
                
                statusHtml += `
                    <div style="border: 2px solid ${statusColor}; border-radius: 10px; padding: 12px; margin-bottom: 12px; background: #fff;">
                        <p><strong>${statusIcon} Request ID:</strong> ${req.id}</p>
                        <p><strong>🏪 Provider:</strong> ${req.providerName}</p>
                        <p><strong>📊 Status:</strong> <span style="color:${statusColor}; font-weight:bold;">${req.status.toUpperCase()}</span> - ${statusText}</p>
                        <div style="background: #e0e0e0; height: 8px; border-radius: 4px; margin-top: 10px;">
                            <div style="background: ${statusColor}; width: ${progressWidth}; height: 8px; border-radius: 4px;"></div>
                        </div>
                    </div>
                `;
            }
            statusHtml += '</div>';
            document.getElementById('requestStatusDetails').innerHTML = statusHtml;
        }
    } catch (error) {
        console.error('Error checking status:', error);
    }
}

function showOnMap(providers, type) {
    document.getElementById('mapContainer').style.display = 'block';
    
    if (!map) {
        map = L.map('map').setView([userLocation.lat, userLocation.lng], 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(map);
    } else {
        map.setView([userLocation.lat, userLocation.lng], 13);
    }
    
    if (userMarker) map.removeLayer(userMarker);
    providerMarkers.forEach(m => map.removeLayer(m));
    providerMarkers = [];
    
    const userIcon = L.divIcon({ html: '📍', iconSize: [30, 30] });
    userMarker = L.marker([userLocation.lat, userLocation.lng], { icon: userIcon }).addTo(map);
    userMarker.bindPopup('<b>📍 You are here</b>');
    
    providers.forEach((provider, index) => {
        const providerIcon = L.divIcon({ html: `${index + 1}️⃣ ${type === 'fuel' ? '⛽' : '🔧'}`, iconSize: [30, 30] });
        const marker = L.marker([provider.lat, provider.lng], { icon: providerIcon }).addTo(map);
        marker.bindPopup(`<b>${index + 1}. ${provider.name}</b><br>📍 ${provider.distance} km away`);
        providerMarkers.push(marker);
    });
    
    if (providerMarkers.length > 0) {
        const group = L.featureGroup([userMarker, ...providerMarkers]);
        map.fitBounds(group.getBounds(), { padding: [50, 50] });
    }
}

function getDirections(lat, lng) {
    if (!userLocation) return;
    const url = `https://www.google.com/maps/dir/?api=1&origin=${userLocation.lat},${userLocation.lng}&destination=${lat},${lng}`;
    window.open(url, '_blank');
}