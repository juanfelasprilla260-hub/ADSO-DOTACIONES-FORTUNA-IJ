// --- Datos Iniciales ---
const INITIAL_INVENTORY = [
    { id: '1', nombre: 'Uniforme Administrativo SENA', categoria: 'Uniformes SENA', stock: 45, stockMinimo: 10, imagen: '👔' },
    { id: '2', nombre: 'Uniforme Industrial SENA', categoria: 'Uniformes SENA', stock: 8, stockMinimo: 10, imagen: '👷' },
    { id: '3', nombre: 'Uniforme Salud SENA', categoria: 'Uniformes SENA', stock: 32, stockMinimo: 15, imagen: '⚕️' },
    { id: '18', nombre: 'Chaleco Alta Visibilidad', categoria: 'Ropa Industrial', stock: 120, stockMinimo: 25, imagen: '🦺' },
    { id: '9', nombre: 'Casco Industrial Amarillo', categoria: 'Seguridad', stock: 0, stockMinimo: 15, imagen: '⛑️' },
    { id: '35', nombre: 'Botas Industriales Negras', categoria: 'Calzado Seguridad', stock: 40, stockMinimo: 10, imagen: '🥾' },
    { id: '11', nombre: 'Guantes de Seguridad', categoria: 'Seguridad', stock: 150, stockMinimo: 30, imagen: '🧤' },
];

let inventory = [];
let sortCol = 'nombre';
let sortDir = 'asc';
let currentItem = null;

// --- Inicialización ---
function init() {
    const stored = localStorage.getItem('inventory_modular');
    if (stored) {
        inventory = JSON.parse(stored);
    } else {
        inventory = INITIAL_INVENTORY;
        localStorage.setItem('inventory_modular', JSON.stringify(inventory));
    }

    populateCategories();
    renderTable();
}

function populateCategories() {
    const cats = ['all', ...new Set(inventory.map(i => i.categoria))];
    const select = document.getElementById('cat-filter');
    select.innerHTML = '';
    cats.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c;
        opt.textContent = c === 'all' ? 'Todas las categorías' : c;
        select.appendChild(opt);
    });
}

// --- Lógica de Negocio ---
function getStatus(item) {
    if (item.stock === 0) return 'Sin Stock';
    if (item.stock <= item.stockMinimo) return 'Bajo Stock';
    return 'Normal';
}

function sortData(col) {
    if (sortCol === col) sortDir = sortDir === 'asc' ? 'desc' : 'asc';
    else { sortCol = col; sortDir = 'asc'; }
    renderTable();
}

// --- Renderizado ---
function renderTable() {
    const query = document.getElementById('search-input').value.toLowerCase();
    const catFilter = document.getElementById('cat-filter').value;
    const statusFilter = document.getElementById('status-filter').value;

    let filtered = inventory.filter(i => {
        const matchQ = i.nombre.toLowerCase().includes(query);
        const matchCat = catFilter === 'all' || i.categoria === catFilter;
        const status = getStatus(i);
        const matchStatus = statusFilter === 'all' || status === statusFilter;
        return matchQ && matchCat && matchStatus;
    });

    // Ordenar
    filtered.sort((a, b) => {
        let valA = a[sortCol];
        let valB = b[sortCol];
        if (typeof valA === 'string') return sortDir === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
        return sortDir === 'asc' ? valA - valB : valB - valA;
    });

    // Actualizar KPIs
    updateKPIs(filtered);

    // Renderizar Filas
    const tbody = document.getElementById('table-body');
    tbody.innerHTML = '';
    
    filtered.forEach(item => {
        const status = getStatus(item);
        const badgeClass = status === 'Normal' ? 'badge-green' : (status === 'Bajo Stock' ? 'badge-orange' : 'badge-red');
        const progress = Math.min(100, (item.stock / 100) * 100); // Max relativo 100 para visual
        const barColor = status === 'Normal' ? 'var(--green)' : (status === 'Bajo Stock' ? 'var(--orange)' : 'var(--red)');

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>
                <div style="display:flex;align-items:center;gap:0.5rem;">
                    <span style="font-size:1.2rem;">${item.imagen}</span>
                    <span>${item.nombre}</span>
                </div>
            </td>
            <td><span style="color:var(--text-zinc);font-size:0.85rem;">${item.categoria}</span></td>
            <td><strong>${item.stock}</strong> <span style="color:var(--text-zinc);font-size:0.75rem;">/ min ${item.stockMinimo}</span></td>
            <td>
                <div class="stock-level">
                    <div class="stock-bar" style="width: ${progress}%; background-color: ${barColor}"></div>
                </div>
            </td>
            <td><span class="badge ${badgeClass}">${status}</span></td>
            <td>
                <button class="btn btn-secondary" style="padding:0.3rem 0.6rem;font-size:0.75rem;" onclick="openModal('${item.id}')">
                    Ajustar
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    document.getElementById('inv-subtitle').textContent = `${filtered.length} productos registrados`;
}

function updateKPIs(data) {
    const stats = {
        total: inventory.length,
        stockTotal: inventory.reduce((s, i) => s + i.stock, 0),
        bajo: inventory.filter(i => getStatus(i) === 'Bajo Stock').length,
        sin: inventory.filter(i => getStatus(i) === 'Sin Stock').length
    };

    const container = document.getElementById('kpi-container');
    container.innerHTML = `
        <div class="kpi-card"><div class="label">Productos</div><div class="value">${stats.total}</div></div>
        <div class="kpi-card"><div class="label">Stock Total</div><div class="value">${stats.stockTotal}</div></div>
        <div class="kpi-card" style="border-left: 3px solid var(--orange)"><div class="label">Bajo Stock</div><div class="value" style="color:var(--orange)">${stats.bajo}</div></div>
        <div class="kpi-card" style="border-left: 3px solid var(--red)"><div class="label">Sin Stock</div><div class="value" style="color:var(--red)">${stats.sin}</div></div>
    `;
}

// --- Modales y Acciones ---
function openModal(id) {
    currentItem = inventory.find(i => i.id === id);
    if (!currentItem) return;
    document.getElementById('modal-title').textContent = `Ajustar: ${currentItem.nombre}`;
    document.getElementById('ajuste-qty').value = '';
    document.getElementById('ajuste-motivo').value = '';
    document.getElementById('modal-ajuste').style.display = 'flex';
}

function closeModal() {
    document.getElementById('modal-ajuste').style.display = 'none';
}

function applyAjuste() {
    const qty = parseInt(document.getElementById('ajuste-qty').value);
    const tipo = document.getElementById('ajuste-tipo').value;
    const motivo = document.getElementById('ajuste-motivo').value;

    if (isNaN(qty) || qty < 0 || !motivo) {
        alert('Por favor completa todos los campos correctamente.');
        return;
    }

    inventory = inventory.map(item => {
        if (item.id !== currentItem.id) return item;
        let newStock = item.stock;
        if (tipo === 'entrada') newStock += qty;
        else if (tipo === 'salida') newStock = Math.max(0, newStock - qty);
        else newStock = qty;
        return { ...item, stock: newStock };
    });

    localStorage.setItem('inventory_modular', JSON.stringify(inventory));
    closeModal();
    renderTable();
}

function exportCSV() {
    const header = 'Producto,Categoria,Stock,Stock Minimo,Estado\n';
    const rows = inventory.map(i => `"${i.nombre}","${i.categoria}",${i.stock},${i.stockMinimo},"${getStatus(i)}"`).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'inventario_modular.csv'; a.click();
}

// Iniciar
init();
