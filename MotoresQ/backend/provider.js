// ==================================================
// PROVIDER UI - MOTORESQ (FULLY WORKING)
// ==================================================

const statusText = document.getElementById('statusText');
const requestsEl = document.getElementById('requests');
const refreshBtn = document.getElementById('refreshBtn');
let providerLat = 30.3165;
let providerLng = 78.0322;

// Get provider's live location
if (navigator.geolocation) {
    navigator.geolocation.watchPosition(
        (position) => {
            providerLat = position.coords.latitude;
            providerLng = position.coords.longitude;
            document.getElementById('providerLat').value = providerLat;
            document.getElementById('providerLng').value = providerLng;
            document.getElementById('liveLocation').innerHTML = `📍 Your Live Location: ${providerLat.toFixed(6)}, ${providerLng.toFixed(6)}`;
        },
        (error) => { console.log('Location error:', error); },
        { enableHighAccuracy: true }
    );
}

// Distance calculation
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

// Build request card
function buildRequestCard(req) {
    const card = document.createElement('div');
    card.className = 'request-card';
    card.style.border = '1px solid #ddd';
    card.style.borderRadius = '12px';
    card.style.padding = '16px';
    card.style.marginBottom = '14px';
    card.style.backgroundColor = '#fff';
    card.style.borderLeft = '5px solid #ff9800';
    
    const distanceToUser = calculateDistance(providerLat, providerLng, req.userLat, req.userLng);
    const distanceToPetrol = calculateDistance(providerLat, providerLng, req.petrolLat, req.petrolLng);
    const petrolToUser = calculateDistance(req.petrolLat, req.petrolLng, req.userLat, req.userLng);

    card.innerHTML = `
        <p><strong>🆔 Request ID:</strong> ${req.id}</p>
        <p><strong>👤 User:</strong> ${req.userName}</p>
        <p><strong>📍 User Location:</strong> ${req.userLat.toFixed(5)}, ${req.userLng.toFixed(5)}</p>
        <p><strong>⛽ Provider:</strong> ${req.petrolName || req.providerName}</p>
        <p><strong>📍 Provider Location:</strong> ${req.petrolLat || req.providerLat}, ${req.petrolLng || req.providerLng}</p>
        <p><strong>📏 Your distance to provider:</strong> <span style="color:#ff9800; font-weight:bold;">${distanceToPetrol.toFixed(2)} km</span></p>
        <p><strong>📏 Provider to User distance:</strong> <span style="color:#28a745; font-weight:bold;">${petrolToUser.toFixed(2)} km</span></p>
        <p><strong>📏 Your total distance (You → Provider → User):</strong> <span style="color:#2196f3; font-weight:bold;">${(distanceToPetrol + petrolToUser).toFixed(2)} km</span></p>
        <p><strong>📊 Status:</strong> <span style="color:#ff9800; font-weight:bold;">PENDING</span></p>
        <div>
            <button class="accept-btn" data-id="${req.id}" style="background:#28a745; color:white; border:none; padding:8px 16px; border-radius:6px; margin-right:8px; cursor:pointer;">✅ Accept Request</button>
            <button class="reject-btn" data-id="${req.id}" style="background:#dc3545; color:white; border:none; padding:8px 16px; border-radius:6px; cursor:pointer;">❌ Reject</button>
        </div>
    `;
    
    // Attach event listeners
    const acceptBtn = card.querySelector('.accept-btn');
    const rejectBtn = card.querySelector('.reject-btn');
    
    if (acceptBtn) acceptBtn.onclick = () => acceptRequest(req.id);
    if (rejectBtn) rejectBtn.onclick = () => rejectRequest(req.id);
    
    return card;
}

// Accept request function
async function acceptRequest(requestId) {
    console.log('📡 Accepting request:', requestId);
    if (statusText) statusText.textContent = `🔄 Accepting request ${requestId}...`;
    
    try {
        const response = await fetch(`http://localhost:8080/api/provider/accept?id=${requestId}`);
        const data = await response.json();
        console.log('✅ Accept response:', data);
        
        if (data.success) {
            if (statusText) statusText.textContent = `✅ Request ${requestId} ACCEPTED!`;
            alert(`✅ Request ${requestId} accepted successfully! Delivery person will be assigned.`);
            loadRequests(); // Refresh the list
            
            // Send notification to user
            await fetch('http://localhost:8080/api/notify/user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: `✅ Your request has been ACCEPTED by provider!` })
            });
        } else {
            if (statusText) statusText.textContent = `❌ Failed to accept request ${requestId}`;
            alert(`❌ Failed to accept request`);
        }
    } catch (error) {
        console.error('❌ Error accepting request:', error);
        if (statusText) statusText.textContent = `❌ Error: ${error.message}`;
        alert(`❌ Error: ${error.message}`);
    }
}

// Reject request function
async function rejectRequest(requestId) {
    console.log('📡 Rejecting request:', requestId);
    if (statusText) statusText.textContent = `🔄 Rejecting request ${requestId}...`;
    
    try {
        const response = await fetch(`http://localhost:8080/api/provider/reject?id=${requestId}`);
        const data = await response.json();
        console.log('✅ Reject response:', data);
        
        if (data.success) {
            if (statusText) statusText.textContent = `❌ Request ${requestId} REJECTED`;
            alert(`❌ Request ${requestId} rejected`);
            
            // Send notification to user
            await fetch('http://localhost:8080/api/notify/user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: `❌ Your request has been rejected by the provider. Please try another provider.` })
            });
            
            loadRequests();
        } else {
            if (statusText) statusText.textContent = `❌ Failed to reject request ${requestId}`;
        }
    } catch (error) {
        console.error('❌ Error rejecting request:', error);
        if (statusText) statusText.textContent = `❌ Error: ${error.message}`;
    }
}

// Load requests from server
function loadRequests() {
    const providerTypeSelect = document.getElementById('providerType');
    if (!providerTypeSelect) {
        console.error('providerType element not found');
        return;
    }
    
    const providerType = providerTypeSelect.value;
    console.log('🔄 Loading requests for type:', providerType);
    if (statusText) statusText.textContent = '🔄 Loading requests...';
    
    fetch('http://localhost:8080/api/provider/requests')
        .then(resp => resp.json())
        .then(data => {
            console.log('📦 Received requests from server:', data);
            
            if (!data.requests || !data.requests.length) {
                if (requestsEl) requestsEl.innerHTML = '<p>📭 No pending requests. Waiting for users...</p>';
                if (statusText) statusText.textContent = 'No pending requests';
                return;
            }
            
            // Filter by type and pending status
            const filtered = data.requests.filter(r => r.type === providerType && r.status === 'pending');
            console.log(`📦 Filtered ${filtered.length} pending ${providerType} requests`);
            
            if (!filtered.length) {
                if (requestsEl) requestsEl.innerHTML = `<p>📭 No pending ${providerType} requests</p>`;
                if (statusText) statusText.textContent = `No pending ${providerType} requests`;
                return;
            }
            
            if (requestsEl) {
                requestsEl.innerHTML = '';
                filtered.forEach(req => {
                    // Ensure provider coordinates are set
                    if (!req.petrolLat && req.providerLat) req.petrolLat = req.providerLat;
                    if (!req.petrolLng && req.providerLng) req.petrolLng = req.providerLng;
                    const card = buildRequestCard(req);
                    requestsEl.appendChild(card);
                });
            }
            
            if (statusText) statusText.textContent = `${filtered.length} pending request(s) for ${providerType}`;
        })
        .catch(err => {
            console.error('❌ Fetch error:', err);
            if (statusText) statusText.textContent = `❌ Cannot reach backend: ${err.message}`;
            if (requestsEl) requestsEl.innerHTML = '<p>⚠️ Backend server not available. Make sure server is running on port 8080.</p>';
        });
}

// Auto-refresh every 3 seconds
if (refreshBtn) {
    refreshBtn.addEventListener('click', loadRequests);
}

// Start auto-refresh
setInterval(loadRequests, 3000);

// Initial load after a short delay
setTimeout(loadRequests, 500);
console.log('✅ Provider UI loaded - waiting for user requests!');