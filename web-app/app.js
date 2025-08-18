// app.js - Front-end Logic for RFID Inventory Tracker

document.addEventListener('DOMContentLoaded', () => {
    const epcTableBody = document.getElementById('epc-table-body');
    const itemSummaryTableBody = document.getElementById('item-summary-table-body');
    const statusIndicator = document.getElementById('connection-status');
    const startBtn = document.getElementById('start-btn');
    const stopBtn = document.getElementById('stop-btn');
    
    // Store the inventory data received from the backend
    let inventoryData = [];

    let ws;

    function connectWebSocket() {
        // Dynamically construct the WebSocket URL based on the current page's host and port
        const wsUrl = `ws://${window.location.hostname}:${window.location.port}`;
        ws = new WebSocket(wsUrl);

        ws.onopen = () => {
            console.log('WebSocket connected.');
            statusIndicator.textContent = 'Connected';
            statusIndicator.classList.remove('disconnected');
            statusIndicator.classList.add('connected');
        };

        ws.onmessage = event => {
            // Parse the incoming JSON data
            const data = JSON.parse(event.data);
            
            if (data.initialInventory) {
                // Initialize inventoryData with all items from the backend,
                // setting count to 0 for all of them initially.
                inventoryData = data.initialInventory.map(item => ({...item, count: 0, timestamp: null}));
                console.log('Received initial inventory list:', inventoryData);
                renderTables();
            } else if (data.updates) {
                // Reset scanned times for all items before processing the new batch
                inventoryData.forEach(item => {
                    item.count = 0;
                    item.timestamp = null;
                });
                
                const itemSummary = new Map();

                // Update the inventory data with new scanned times
                data.updates.forEach(update => {
                    const existingItem = inventoryData.find(item => item.epc === update.epc);
                    if (existingItem) {
                        existingItem.count = update.count;
                        existingItem.timestamp = update.timestamp;
                    }
                });
                
                // Calculate item summary based on the updated inventory data
                inventoryData.forEach(item => {
                    const currentItemSummary = itemSummary.get(item.item) || { count: 0, lastScanned: null };
                    if (item.count > 0) {
                        currentItemSummary.count++;
                        if (!currentItemSummary.lastScanned || item.timestamp > currentItemSummary.lastScanned) {
                            currentItemSummary.lastScanned = item.timestamp;
                        }
                    }
                    itemSummary.set(item.item, currentItemSummary);
                });

                renderTables(itemSummary);
            }
        };

        ws.onclose = () => {
            console.log('WebSocket disconnected. Reconnecting in 3 seconds...');
            statusIndicator.textContent = 'Disconnected';
            statusIndicator.classList.remove('connected');
            statusIndicator.classList.add('disconnected');
            setTimeout(connectWebSocket, 3000);
        };

        ws.onerror = error => {
            console.error('WebSocket error:', error);
        };
    }

    function renderTables(itemSummary = new Map()) {
        // Render Item Summary Table
        const sortedItemSummary = Array.from(itemSummary.entries()).sort((a, b) => {
            const itemA = a[0].toUpperCase();
            const itemB = b[0].toUpperCase();
            if (itemA < itemB) return -1;
            if (itemA > itemB) return 1;
            return 0;
        });

        itemSummaryTableBody.innerHTML = '';
        sortedItemSummary.forEach(([item, data]) => {
            const row = itemSummaryTableBody.insertRow();
            const numberCell = row.insertCell();
            numberCell.textContent = data.count;
            if (data.count <= 1) {
                numberCell.classList.add('low-count');
            }
            row.insertCell().textContent = item;
            row.insertCell().textContent = data.lastScanned ? new Date(data.lastScanned).toLocaleTimeString() : 'N/A';
        });

        // Render EPC Table
        const sortedData = [...inventoryData].sort((a, b) => {
            const itemA = a.item.toUpperCase();
            const itemB = b.item.toUpperCase();
            if (itemA < itemB) return -1;
            if (itemA > itemB) return 1;
            return 0;
        });

        epcTableBody.innerHTML = '';
        sortedData.forEach(item => {
            const row = epcTableBody.insertRow();
            row.innerHTML = `
                <td>${item.id}</td>
                <td>${item.epc}</td>
                <td>${item.item}</td>
                <td>${item.count || 0}</td>
                <td>${item.timestamp ? new Date(item.timestamp).toLocaleTimeString() : 'N/A'}</td>
            `;
        });
    }

    startBtn.addEventListener('click', () => {
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send('start');
        } else {
            console.error('WebSocket not connected. Cannot send command.');
        }
    });

    stopBtn.addEventListener('click', () => {
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send('stop');
        } else {
            console.error('WebSocket not connected. Cannot send command.');
        }
    });

    connectWebSocket();
});
