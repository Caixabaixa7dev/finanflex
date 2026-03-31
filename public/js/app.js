function openCheckoutModal() {
    const overlay = document.getElementById('checkoutModalOverlay');
    const installmentsView = document.getElementById('installmentsView');
    const pixView = document.getElementById('pixView');
    
    // Reset Views State
    installmentsView.classList.remove('hidden');
    pixView.classList.add('hidden');
    
    // Reset Pix status state
    document.getElementById('loadingStatus').classList.remove('hidden');
    document.getElementById('successMessage').classList.add('hidden');
    
    // Show Overlay with Fade-in effect
    overlay.classList.remove('hidden');
    // small delay to allow display block before opacity transition
    setTimeout(() => {
        overlay.classList.remove('opacity-0');
        overlay.classList.add('opacity-100');
        installmentsView.classList.remove('scale-95');
        installmentsView.classList.add('scale-100');
    }, 10);
}

function closeCheckoutModal() {
    const overlay = document.getElementById('checkoutModalOverlay');
    const installmentsView = document.getElementById('installmentsView');
    const pixView = document.getElementById('pixView');

    // Fade-out effect
    overlay.classList.remove('opacity-100');
    overlay.classList.add('opacity-0');
    installmentsView.classList.remove('scale-100');
    installmentsView.classList.add('scale-95');
    pixView.classList.remove('scale-100');
    pixView.classList.add('scale-95');

    setTimeout(() => {
        overlay.classList.add('hidden');
    }, 300); // 300ms matches Tailwind duration-300
}

async function proceedToPixView() {
    const consent = document.getElementById('consentCheckbox').checked;
    if(!consent) {
        alert("Por favor, aceite os termos antes de prosseguir com o parcelamento.");
        return;
    }
    
    // Obter dados do localStorage
    const token = localStorage.getItem('finanflex_token');
    if (!token) {
        alert("Sua sessão expirou ou não está autenticada. Faça login novamente.");
        window.location.href = '/login.html';
        return;
    }

    const valorOriginal = parseFloat(localStorage.getItem('finanflex_valor')) || 0;
    const linhaDigitavel = localStorage.getItem('finanflex_boleto') || '';
    const parcelasSelect = document.querySelector('input[name="installment"]:checked');
    const qtdParcelas = parseInt(parcelasSelect ? parcelasSelect.value : 1, 10);

    const btn = document.querySelector('button[onclick="proceedToPixView()"]');
    const oldHtml = btn.innerHTML;
    btn.innerHTML = 'Processando...';
    btn.disabled = true;

    try {
        // 1. Criar Contrato
        const resContrato = await fetch('/api/contratos/criar', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                valor_boleto: valorOriginal,
                qtd_parcelas: qtdParcelas,
                linha_digitavel: linhaDigitavel
            })
        });

        if (!resContrato.ok) {
            const dataErr = await resContrato.json();
            throw new Error(dataErr.error || 'Erro ao criar o contrato.');
        }

        const dataContrato = await resContrato.json();
        const parcela_id = dataContrato.parcelas[0].id; // Pega o ID da primeira parcela

        if (!parcela_id) throw new Error("A primeira parcela não foi retornada.");

        // 2. Gerar Pix da Primeira Parcela
        const resPix = await fetch('/api/pagamentos/gerar-pix-parcela', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ parcela_id })
        });

        if (!resPix.ok) {
            const pixErr = await resPix.json();
            throw new Error(pixErr.error || 'Erro ao gerar Pix no Veopag.');
        }

        const dataPix = await resPix.json();

        // 3. Atualizar Views
        const installmentsView = document.getElementById('installmentsView');
        const pixView = document.getElementById('pixView');
        
        // Transition from Installments to Pix QR Code
        installmentsView.classList.add('hidden');
        installmentsView.classList.remove('scale-100');
        
        pixView.classList.remove('hidden');
        pixView.classList.remove('scale-95');
        pixView.classList.add('scale-100');

        // Preencher QRCode e BRCode da Veopag (ou mock se simulated = true)
        const qrImage = document.getElementById('qrCodeImg');
        const qrInput = document.getElementById('pixCodeInput');

        if (dataPix.qrcode_base64) {
             const qrData = dataPix.qrcode_base64;
             // Se for um link (começa com http) ou já tiver prefixo, usa direto. Senão, adiciona prefixo base64.
             if (qrData.startsWith('http') || qrData.startsWith('data:')) {
                 qrImage.src = qrData;
             } else {
                 qrImage.src = `data:image/png;base64,${qrData}`;
             }
             qrInput.value = dataPix.brCode || 'Código Pix Indisponível';
        } else if (dataPix.simulated) {
             qrImage.src = dataPix.qrCodeLink || `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(dataPix.brCode)}`;
             qrInput.value = dataPix.brCode;
        }

        // Iniciar polling real
        iniciarEscutaDePagamento(dataContrato.contratoId);

    } catch (err) {
        console.error(err);
        alert(err.message);
    } finally {
        btn.innerHTML = oldHtml;
        btn.disabled = false;
    }
}

// 1. Cópia blindada para área de transferência (Mobile-First)
async function copiarCodigoPix(codigoPixText) {
    try {
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(codigoPixText);
        } else {
            const textArea = document.createElement("textarea");
            textArea.value = codigoPixText;
            textArea.style.position = "absolute"; 
            textArea.style.left = "-999999px";
            document.body.prepend(textArea); 
            textArea.select();
            document.execCommand('copy'); 
            textArea.remove();
        }
        alert("Código Pix copiado com sucesso!");
    } catch (err) {
        console.error('Falha ao copiar', err);
        alert("Erro ao copiar o código. Tente selecionar o texto e copiar manualmente.");
    }
}

function handleCopyPix() {
    const code = document.getElementById('pixCodeInput').value;
    copiarCodigoPix(code);
}

let pollingInterval;

// 2. Smart Polling para atualizar a tela sem WebSockets
function iniciarEscutaDePagamento(contratoId) {
    if (pollingInterval) clearInterval(pollingInterval); // reset if any existing
    
    let tentativas = 0;
    const loadingStatus = document.getElementById('loadingStatus');
    const successMsg = document.getElementById('successMessage');

    pollingInterval = setInterval(async () => {
        tentativas++;
        try {
            const token = localStorage.getItem('finanflex_token');
            const response = await fetch(`/api/contratos/${contratoId}/status`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (!response.ok) return;

            const data = await response.json();
            
            if (data.status === 'PIX_1_PAGO') {
                clearInterval(pollingInterval);
                
                // Disparar animação de sucesso no novo Design System
                loadingStatus.classList.add('hidden');
                successMsg.classList.remove('hidden');
                
                setTimeout(() => {
                    closeCheckoutModal();
                    window.location.href = '/pagamentos.html';
                }, 2000);
            } else if (tentativas >= 60) {
                // Timeout após 5 min
                clearInterval(pollingInterval); 
            }
        } catch (e) {
            console.error(e);
        }
    }, 5000); // Poll a cada 5 segundos
}

