let adminToken = null;

async function login() {
    const loginValue = document.getElementById('username').value;
    const senhaValue = document.getElementById('password').value;
    const errorEl = document.getElementById('loginError');

    try {
        const res = await fetch('/admin-api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ login: loginValue, senha: senhaValue })
        });
        const data = await res.json();
        
        if (!res.ok) {
            errorEl.innerText = data.error;
            errorEl.style.display = 'block';
            return;
        }

        adminToken = data.token;
        errorEl.style.display = 'none';
        
        document.getElementById('loginView').classList.add('hidden');
        document.getElementById('panelView').classList.remove('hidden');
        
        fetchContracts();
    } catch(err) {
        errorEl.innerText = "Falha no servidor.";
        errorEl.style.display = 'block';
    }
}

function logout() {
    adminToken = null;
    document.getElementById('panelView').classList.add('hidden');
    document.getElementById('loginView').classList.remove('hidden');
    document.getElementById('password').value = '';
}

async function fetchContracts() {
    try {
        const res = await fetch('/admin-api/contratos-pagos', {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        
        if(res.status === 401) { logout(); return; }
        
        const contracts = await res.json();
        renderTable(contracts);
    } catch(err) {
        console.error(err);
    }
}

function renderTable(contracts) {
    const tbody = document.getElementById('contractsTableBody');
    tbody.innerHTML = '';
    
    if(contracts.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 20px;">Nenhum contrato aguardando liquidação.</td></tr>';
        return;
    }

    contracts.forEach(c => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>#${c.id.substring(0, 8)}...</td>
            <td><span class="badge badge-success">${c.status}</span></td>
            <td style="font-family: monospace;">${c.linha_digitavel_boleto}</td>
            <td style="display:flex; gap: 8px;">
                <button class="btn btn-outline btn-sm" onclick="copiarCodigoPixAdmin('${c.linha_digitavel_boleto}')">Copiar</button>
                <button class="btn btn-primary btn-sm" onclick="marcarLiquidado('${c.id}')">Marcar Liquidado</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

async function marcarLiquidado(id) {
    if(!confirm('O boleto foi pago no banco? Confirma a transição para Liquidado?')) return;
    
    try {
        const res = await fetch(`/admin-api/liquidar-contrato/${id}`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        const result = await res.json();
        if(res.ok) {
            alert(result.message);
            fetchContracts(); // Refresh
        } else {
            alert(result.error);
        }
    } catch(e) {
        console.error(e);
    }
}

async function copiarCodigoPixAdmin(texto) {
    try {
        if (navigator.clipboard) {
            await navigator.clipboard.writeText(texto);
            alert("Linha digitável copiada!");
        }
    } catch (e) {
        console.error(e);
    }
}
