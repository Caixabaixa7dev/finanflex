CREATE TABLE IF NOT EXISTS usuarios (
    id VARCHAR(36) PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    cpf VARCHAR(14) NOT NULL UNIQUE,
    senha_hash VARCHAR(255) NOT NULL,
    telefone VARCHAR(20),
    data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS admins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    login VARCHAR(50) NOT NULL UNIQUE,
    senha_hash VARCHAR(255) NOT NULL,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS contratos (
    id VARCHAR(36) PRIMARY KEY,
    usuario_id VARCHAR(36) NOT NULL,
    linha_digitavel_boleto VARCHAR(100) NOT NULL,
    valor_boleto_original DECIMAL(10,2) NOT NULL,
    quantidade_parcelas INT NOT NULL,
    status ENUM('PENDENTE', 'PIX_1_PAGO', 'BOLETO_LIQUIDADO_TESOURARIA', 'CANCELADO') DEFAULT 'PENDENTE',
    ip_aceite_termos VARCHAR(45),
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS parcelas (
    id VARCHAR(36) PRIMARY KEY,
    contrato_id VARCHAR(36) NOT NULL,
    numero_parcela INT NOT NULL,
    valor_parcela DECIMAL(10,2) NOT NULL,
    data_vencimento DATE NOT NULL,
    status_pagamento ENUM('PENDENTE', 'PAGO', 'ATRASADO') DEFAULT 'PENDENTE',
    txid_veopag VARCHAR(255) UNIQUE,
    data_pagamento TIMESTAMP NULL,
    FOREIGN KEY (contrato_id) REFERENCES contratos(id) ON DELETE CASCADE
);

-- CREATE INDEX IF NOT EXISTS operations 
-- Note: MySQL syntax for conditional indexing isn't simple, skipping since this script is for init.
-- Alternatively, we create indexes if they don't exist by attempting creation and ignoring errors in Node.js.
