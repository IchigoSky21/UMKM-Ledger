/* --- STATE MANAGEMENT --- */
const BEP_TARGET = 5000000; 

let ledgerData = JSON.parse(localStorage.getItem('tokokita_ledger')) || [];

let inventoryData = JSON.parse(localStorage.getItem('tokokita_inventory')) || [
    { id: 'Nasi', name: 'Nasi Putih', stock: 50, cogs: 3000, price: 5000 },
    { id: 'Tahu', name: 'Tahu Goreng', stock: 30, cogs: 1000, price: 2000 },
    { id: 'Tempe', name: 'Tempe Mendoan', stock: 40, cogs: 1500, price: 2500 }
];

// Interactive UI State Variables
let editingItemId = null;
let itemToDeleteId = null;

window.addEventListener('DOMContentLoaded', () => {
    const today = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    document.getElementById('current-date-header').innerText = `Data Context: ${today} (Local Offline)`;
    
    document.getElementById('filter-start').valueAsDate = new Date();
    document.getElementById('filter-end').valueAsDate = new Date();

    document.getElementById('entry-type').addEventListener('change', updateAutoAmount);
    document.getElementById('entry-item').addEventListener('change', updateAutoAmount);
    document.getElementById('entry-qty').addEventListener('input', updateAutoAmount);

    populateItemDropdown();
    updateAutoAmount(); 
    
    renderInventoryTable();
    updateDashboardMetrics();
    renderDashboardFeed();
});

/* --- UI ROUTING & SIDEBAR --- */
function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('active');
    document.getElementById('sidebar-overlay').classList.toggle('active');
}

function switchView(viewName) {
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    document.getElementById(`nav-${viewName}`).classList.add('active');

    let title = 'Financial & Stock Dashboard';
    if (viewName === 'transactions') title = 'Transactions Data Explorer';
    if (viewName === 'inventory') title = 'Inventory Management';
    
    document.getElementById('page-title').innerText = title;

    document.getElementById('view-dashboard').style.display = viewName === 'dashboard' ? 'grid' : 'none';
    document.getElementById('view-transactions').style.display = viewName === 'transactions' ? 'grid' : 'none';
    document.getElementById('view-inventory').style.display = viewName === 'inventory' ? 'grid' : 'none';

    if(viewName === 'dashboard') {
        updateDashboardMetrics(); 
        renderDashboardFeed();
        renderInventoryTable();
    } else if (viewName === 'transactions') {
        renderTransactionsTable(); 
    } else if (viewName === 'inventory') {
        editingItemId = null; // Reset edit state if switching views
        renderFullInventoryTable();
    }

    document.getElementById('sidebar').classList.remove('active');
    document.getElementById('sidebar-overlay').classList.remove('active');
}

/* --- DATA PROCESSING & LEDGER --- */
function formatRupiah(number) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0
    }).format(number).replace('Rp', 'Rp '); 
}

function populateItemDropdown() {
    const dropdown = document.getElementById('entry-item');
    dropdown.innerHTML = '';
    inventoryData.forEach(item => {
        const option = document.createElement('option');
        option.value = item.id;
        option.text = item.name;
        dropdown.appendChild(option);
    });
}

function updateAutoAmount() {
    const type = document.getElementById('entry-type').value;
    const itemId = document.getElementById('entry-item').value;
    const qty = parseInt(document.getElementById('entry-qty').value, 10) || 0;
    
    const item = inventoryData.find(i => i.id === itemId);
    if (item) {
        const unitPrice = type === 'income' ? item.price : item.cogs;
        document.getElementById('entry-amount').value = unitPrice * qty;
    } else {
        document.getElementById('entry-amount').value = 0;
    }
}

function processLedgerEntry(event) {
    event.preventDefault(); 
    
    const rawType = document.getElementById('entry-type').value;
    const isIncome = rawType === 'income';
    const targetItemId = document.getElementById('entry-item').value;
    const qty = parseInt(document.getElementById('entry-qty').value, 10);
    const amount = parseInt(document.getElementById('entry-amount').value, 10);
    
    const newEntry = {
        id: Date.now(),
        type: isIncome ? 'income' : 'expense',
        item: targetItemId,
        qty: qty,
        amount: amount,
        channel: document.getElementById('entry-channel').value,
        notes: document.getElementById('entry-notes').value || `${isIncome ? 'Sale' : 'Restock'} - ${targetItemId}`,
        timestamp: new Date().getTime()
    };

    ledgerData.unshift(newEntry);
    localStorage.setItem('tokokita_ledger', JSON.stringify(ledgerData));

    const itemIndex = inventoryData.findIndex(i => i.id === targetItemId);
    if(itemIndex > -1) {
        if(isIncome) {
            inventoryData[itemIndex].stock -= qty; 
        } else {
            inventoryData[itemIndex].stock += qty; 
        }
        localStorage.setItem('tokokita_inventory', JSON.stringify(inventoryData));
    }

    document.getElementById('ledger-form').reset();
    document.getElementById('entry-qty').value = 1; 
    updateAutoAmount(); 
    
    document.getElementById('entry-qty').focus(); 

    renderInventoryTable(); 
    updateDashboardMetrics();
    renderDashboardFeed();
}

/* --- INVENTORY CRUD (CREATE, UPDATE, DELETE) LOGIC --- */
function toggleAddItemForm() {
    const container = document.getElementById('add-item-container');
    if (container.style.display === 'none') {
        container.style.display = 'block';
        document.getElementById('new-item-name').focus();
    } else {
        container.style.display = 'none';
        document.getElementById('add-item-form').reset();
    }
}

function processNewItem(event) {
    event.preventDefault();
    
    const name = document.getElementById('new-item-name').value.trim();
    const cogs = parseInt(document.getElementById('new-item-cogs').value, 10);
    const price = parseInt(document.getElementById('new-item-price').value, 10);
    
    const id = 'ITEM_' + Date.now();
    const newItem = { id: id, name: name, stock: 0, cogs: cogs, price: price };

    inventoryData.push(newItem);
    localStorage.setItem('tokokita_inventory', JSON.stringify(inventoryData));

    toggleAddItemForm(); 
    renderFullInventoryTable(); 
    populateItemDropdown(); 
    renderInventoryTable(); 
}

// Edit Mode Functions
function startEditItem(id) {
    editingItemId = id;
    renderFullInventoryTable(); // Re-render table to show inputs
}

function cancelEditItem() {
    editingItemId = null;
    renderFullInventoryTable();
}

function saveEditItem(id) {
    const newCogs = parseInt(document.getElementById(`edit-cogs-${id}`).value, 10);
    const newPrice = parseInt(document.getElementById(`edit-price-${id}`).value, 10);

    if (isNaN(newCogs) || isNaN(newPrice) || newCogs < 0 || newPrice < 0) {
        alert("Please enter valid positive numbers for pricing.");
        return;
    }

    const itemIndex = inventoryData.findIndex(i => i.id === id);
    if (itemIndex > -1) {
        inventoryData[itemIndex].cogs = newCogs;
        inventoryData[itemIndex].price = newPrice;
        localStorage.setItem('tokokita_inventory', JSON.stringify(inventoryData));
    }

    editingItemId = null;
    renderFullInventoryTable(); 
    renderInventoryTable(); // Update dashboard active valuations
}

// Delete Mode Functions
function promptDeleteItem(id, name) {
    itemToDeleteId = id;
    document.getElementById('delete-item-name').innerText = name;
    document.getElementById('delete-modal').classList.add('active');
}

function closeDeleteModal() {
    itemToDeleteId = null;
    document.getElementById('delete-modal').classList.remove('active');
}

function confirmDeleteItem() {
    if (itemToDeleteId) {
        inventoryData = inventoryData.filter(i => i.id !== itemToDeleteId);
        localStorage.setItem('tokokita_inventory', JSON.stringify(inventoryData));
        
        populateItemDropdown(); // Update Ledger Dropdown
        renderFullInventoryTable();
        renderInventoryTable();
        closeDeleteModal();
    }
}


/* --- DASHBOARD VIEW UPDATES --- */
function renderInventoryTable() {
    const tbody = document.getElementById('inventory-table-body');
    tbody.innerHTML = '';
    let totalValuation = 0;

    inventoryData.forEach(item => {
        const margin = (((item.price - item.cogs) / item.price) * 100).toFixed(1);
        const assetValue = item.stock * item.cogs;
        totalValuation += assetValue;

        let flag = '<span class="badge badge-success">Optimized</span>';
        if (item.stock < 10) flag = '<span class="badge badge-danger">Critical Stock</span>';
        else if (item.stock < 20) flag = '<span class="badge badge-warning">Low Stock</span>';

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${item.name}</strong></td>
            <td>${item.stock} units</td>
            <td>${formatRupiah(item.cogs)}</td>
            <td>${formatRupiah(item.price)}</td>
            <td><span style="color: var(--success);">${margin}%</span></td>
            <td>${formatRupiah(assetValue)}</td>
            <td>${flag}</td>
        `;
        tbody.appendChild(tr);
    });

    document.getElementById('capital-valuation-metric').innerText = formatRupiah(totalValuation);
}

function updateDashboardMetrics() {
    const totalRevenue = ledgerData
        .filter(tx => tx.type === 'income')
        .reduce((sum, tx) => sum + tx.amount, 0);
    
    const salesCount = ledgerData.filter(tx => tx.type === 'income').length;

    document.getElementById('daily-revenue-metric').innerText = formatRupiah(totalRevenue);
    document.getElementById('daily-sales-count').innerText = `✓ ${salesCount} Checked-out sales`;
    
    let percentage = (totalRevenue / BEP_TARGET) * 100;
    let barWidth = percentage > 100 ? 100 : percentage;

    document.getElementById('bep-text').innerText = `${percentage.toFixed(1)}% Realized`;
    const bepBar = document.getElementById('bep-bar');
    bepBar.style.width = `${barWidth}%`;
    bepBar.style.backgroundColor = percentage >= 100 ? 'var(--success)' : 'var(--brand)';
    document.getElementById('bep-current-text').innerText = formatRupiah(totalRevenue);
}

function renderDashboardFeed() {
    const feedContainer = document.getElementById('ledger-feed');
    feedContainer.innerHTML = ''; 

    if (ledgerData.length === 0) {
        feedContainer.innerHTML = `<div class="empty-state">No transactions recorded yet.</div>`;
        return;
    }

    const recentTransactions = ledgerData.slice(0, 10);
    recentTransactions.forEach(tx => {
        const dateObj = new Date(tx.timestamp);
        const timeString = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const isIncome = tx.type === 'income';
        const sign = isIncome ? '+' : '-';
        const colorClass = isIncome ? 'amt-pos' : 'amt-neg';
        
        const itemObj = inventoryData.find(i => i.id === tx.item);
        const itemName = itemObj ? itemObj.name : tx.item;

        const html = `
            <div class="stream-item">
                <div class="stream-details">
                    <strong>${tx.qty}x ${itemName}</strong>
                    <span class="stream-time">${dateObj.toLocaleDateString()} ${timeString} • ${tx.channel}</span>
                </div>
                <span class="${colorClass}">${sign}${formatRupiah(tx.amount)}</span>
            </div>
        `;
        feedContainer.insertAdjacentHTML('beforeend', html);
    });
}

/* --- TRANSACTIONS VIEW UPDATES --- */
function renderTransactionsTable() {
    const tbody = document.getElementById('transactions-tbody');
    tbody.innerHTML = '';

    const startStr = document.getElementById('filter-start').value;
    const endStr = document.getElementById('filter-end').value;
    const filterType = document.getElementById('filter-type').value;
    const keyword = document.getElementById('filter-keyword').value.toLowerCase();

    const startObj = startStr ? new Date(startStr) : new Date('2000-01-01');
    const endObj = endStr ? new Date(endStr) : new Date('2100-01-01');
    endObj.setHours(23, 59, 59, 999);

    const filteredData = ledgerData.filter(tx => {
        const txDate = new Date(tx.timestamp);
        const matchesDate = txDate >= startObj && txDate <= endObj;
        const matchesType = filterType === 'all' || tx.type === filterType;
        
        const itemObj = inventoryData.find(i => i.id === tx.item);
        const itemName = itemObj ? itemObj.name.toLowerCase() : tx.item.toLowerCase();
        
        const matchesKeyword = itemName.includes(keyword) || tx.notes.toLowerCase().includes(keyword) || tx.channel.toLowerCase().includes(keyword);
        
        return matchesDate && matchesType && matchesKeyword;
    });

    if (filteredData.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="empty-state">No transactions match your filters.</td></tr>`;
        return;
    }

    filteredData.forEach(tx => {
        const dateObj = new Date(tx.timestamp);
        const dateFmt = `${dateObj.toLocaleDateString()} ${dateObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
        const typeBadge = tx.type === 'income' 
            ? `<span class="badge badge-success">Income</span>`
            : `<span class="badge badge-danger">Expense</span>`;
        const colorClass = tx.type === 'income' ? 'amt-pos' : 'amt-neg';
        const sign = tx.type === 'income' ? '+' : '-';

        const itemObj = inventoryData.find(i => i.id === tx.item);
        const itemName = itemObj ? itemObj.name : tx.item;

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${dateFmt}</td>
            <td>${typeBadge}</td>
            <td><strong>${itemName}</strong><br><small style="color:var(--text-muted)">${tx.notes}</small></td>
            <td>${tx.qty}</td>
            <td>${tx.channel}</td>
            <td style="text-align: right;" class="${colorClass}">${sign}${formatRupiah(tx.amount)}</td>
        `;
        tbody.appendChild(tr);
    });
}

/* --- INVENTORY VIEW UPDATES --- */
function renderFullInventoryTable() {
    const tbody = document.getElementById('inventory-full-tbody');
    tbody.innerHTML = '';

    const keyword = document.getElementById('filter-inv-keyword').value.toLowerCase();
    const statusFilter = document.getElementById('filter-inv-status').value;

    const filteredData = inventoryData.filter(item => {
        const matchesKeyword = item.name.toLowerCase().includes(keyword) || item.id.toLowerCase().includes(keyword);
        
        let status = 'optimized';
        if (item.stock < 10) status = 'critical';
        else if (item.stock < 20) status = 'low';

        const matchesStatus = statusFilter === 'all' || status === statusFilter;

        return matchesKeyword && matchesStatus;
    });

    if (filteredData.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" class="empty-state">No inventory items match your filters.</td></tr>`;
        return;
    }

    filteredData.forEach(item => {
        const margin = (((item.price - item.cogs) / item.price) * 100).toFixed(1);
        const assetValue = item.stock * item.cogs;

        let flag = '<span class="badge badge-success">Optimized</span>';
        if (item.stock < 10) flag = '<span class="badge badge-danger">Critical Stock</span>';
        else if (item.stock < 20) flag = '<span class="badge badge-warning">Low Stock</span>';

        const tr = document.createElement('tr');
        
        if (editingItemId === item.id) {
            // EDIT MODE ROW
            tr.innerHTML = `
                <td><strong>${item.name}</strong></td>
                <td>${item.stock} units</td>
                <td><input type="number" id="edit-cogs-${item.id}" value="${item.cogs}" style="width: 100px; padding: 6px; border: 2px solid var(--brand);"></td>
                <td><input type="number" id="edit-price-${item.id}" value="${item.price}" style="width: 100px; padding: 6px; border: 2px solid var(--brand);"></td>
                <td><span style="color: var(--text-muted);">-</span></td>
                <td><span style="color: var(--text-muted);">-</span></td>
                <td><span style="color: var(--text-muted);">-</span></td>
                <td style="text-align: center; white-space: nowrap;">
                    <button title="Save Changes" onclick="saveEditItem('${item.id}')" style="background:none; border:none; cursor:pointer; font-size:18px;">✔️</button>
                    <button title="Cancel" onclick="cancelEditItem()" style="background:none; border:none; cursor:pointer; font-size:18px; margin-left:8px;">❌</button>
                </td>
            `;
        } else {
            // NORMAL VIEW ROW
            tr.innerHTML = `
                <td><strong>${item.name}</strong></td>
                <td>${item.stock} units</td>
                <td>${formatRupiah(item.cogs)}</td>
                <td>${formatRupiah(item.price)}</td>
                <td><span style="color: var(--success);">${margin}%</span></td>
                <td>${formatRupiah(assetValue)}</td>
                <td>${flag}</td>
                <td style="text-align: center; white-space: nowrap;">
                    <button title="Edit Price Data" onclick="startEditItem('${item.id}')" style="background:none; border:none; cursor:pointer; font-size:18px;">✏️</button>
                    <button title="Delete Item" onclick="promptDeleteItem('${item.id}', '${item.name.replace(/'/g, "\\'")}')" style="background:none; border:none; cursor:pointer; font-size:18px; margin-left:8px;">🗑️</button>
                </td>
            `;
        }
        tbody.appendChild(tr);
    });
}

/* --- EXCEL EXPORT --- */

function exportFinancialReport() {
    const dateStr = new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }).replace(' ', '_');
    const filename = `TokoKita_Report_${dateStr}.xlsx`;
    const wb = XLSX.utils.book_new();
    
    const tableElement = document.getElementById('inventory-table');
    const wsInventory = XLSX.utils.table_to_sheet(tableElement);
    XLSX.utils.book_append_sheet(wb, wsInventory, "Active Stock");

    if (ledgerData.length > 0) {
        const exportData = ledgerData.map(tx => {
            const itemObj = inventoryData.find(i => i.id === tx.item);
            return {
                "Date": new Date(tx.timestamp).toLocaleString(),
                "Type": tx.type.toUpperCase(),
                "Item": itemObj ? itemObj.name : tx.item,
                "Quantity": tx.qty,
                "Notes": tx.notes,
                "Channel": tx.channel,
                "Amount (IDR)": tx.amount
            };
        });
        const wsLedger = XLSX.utils.json_to_sheet(exportData);
        XLSX.utils.book_append_sheet(wb, wsLedger, "Transaction Ledger");
    }
    
    XLSX.writeFile(wb, filename);
}

function exportTransactions() {
    const startStr = document.getElementById('filter-start').value;
    const endStr = document.getElementById('filter-end').value;
    const filterType = document.getElementById('filter-type').value;
    const keyword = document.getElementById('filter-keyword').value;

    const startObj = startStr ? new Date(startStr) : new Date('2000-01-01');
    const endObj = endStr ? new Date(endStr) : new Date('2100-01-01');
    endObj.setHours(23, 59, 59, 999);

    const filteredData = ledgerData.filter(tx => {
        const txDate = new Date(tx.timestamp);
        const matchesDate = txDate >= startObj && txDate <= endObj;
        const matchesType = filterType === 'all' || tx.type === filterType;
        
        const itemObj = inventoryData.find(i => i.id === tx.item);
        const itemName = itemObj ? itemObj.name.toLowerCase() : tx.item.toLowerCase();
        
        const matchesKeyword = itemName.includes(keyword.toLowerCase()) || tx.notes.toLowerCase().includes(keyword.toLowerCase()) || tx.channel.toLowerCase().includes(keyword.toLowerCase());
        return matchesDate && matchesType && matchesKeyword;
    });

    const exportAOA = [
        ["Detailed Transaction History Report"],
        ["Export Time", new Date().toLocaleString()],
        ["Filter - Start Date", startStr || "All Time"],
        ["Filter - End Date", endStr || "All Time"],
        ["Filter - Category", filterType.toUpperCase()],
        ["Filter - Keyword", keyword || "None"],
        [],
        ["Date & Time", "Type", "Target Item", "Notes", "Qty", "Channel", "Amount (IDR)"]
    ];

    filteredData.forEach(tx => {
        const dateObj = new Date(tx.timestamp);
        const itemObj = inventoryData.find(i => i.id === tx.item);
        
        exportAOA.push([
            `${dateObj.toLocaleDateString()} ${dateObj.toLocaleTimeString()}`,
            tx.type.toUpperCase(),
            itemObj ? itemObj.name : tx.item,
            tx.notes,
            tx.qty,
            tx.channel,
            tx.amount
        ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(exportAOA);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Filtered Transactions");
    XLSX.writeFile(wb, `TokoKita_Transactions_Export_${Date.now()}.xlsx`);
}

function exportInventory() {
    const keyword = document.getElementById('filter-inv-keyword').value.toLowerCase();
    const statusFilter = document.getElementById('filter-inv-status').value;

    const filteredData = inventoryData.filter(item => {
        const matchesKeyword = item.name.toLowerCase().includes(keyword) || item.id.toLowerCase().includes(keyword);
        
        let status = 'optimized';
        if (item.stock < 10) status = 'critical';
        else if (item.stock < 20) status = 'low';

        const matchesStatus = statusFilter === 'all' || status === statusFilter;
        return matchesKeyword && matchesStatus;
    });

    const exportAOA = [
        ["Detailed Inventory Management Snapshot"],
        ["Snapshot Time", new Date().toLocaleString()],
        ["Filter - Search Keyword", keyword || "None"],
        ["Filter - Status Flag", statusFilter.toUpperCase()],
        [],
        ["Product Specification", "Stock Level", "Unit Capital cost (COGS)", "Retail Base Price", "Net Margin (%)", "Asset Value Pool (IDR)", "System Warning Flag"]
    ];

    filteredData.forEach(item => {
        const margin = (((item.price - item.cogs) / item.price) * 100).toFixed(1);
        const assetValue = item.stock * item.cogs;

        let flag = 'Optimized';
        if (item.stock < 10) flag = 'Critical Stock';
        else if (item.stock < 20) flag = 'Low Stock';

        exportAOA.push([
            item.name,
            item.stock,
            item.cogs,
            item.price,
            margin + "%",
            assetValue,
            flag
        ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(exportAOA);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Filtered Inventory");
    XLSX.writeFile(wb, `TokoKita_Inventory_Snapshot_${Date.now()}.xlsx`);
}