document.addEventListener('DOMContentLoaded', () => {
    const certGrid = document.getElementById('cert-grid');
    const modal = document.getElementById('certModal');
    const addCertBtn = document.getElementById('add-cert-btn');
    const closeModalBtn = document.querySelector('.close-btn');
    const certForm = document.getElementById('cert-form');
    const modalTitle = document.getElementById('modal-title');
    const certIdInput = document.getElementById('cert-id');

    const getCertsFromStorage = () => {
        try {
            const certs = localStorage.getItem('certificados');
            return certs ? JSON.parse(certs) : [];
        } catch (e) {
            console.error("Erro ao ler certificados do localStorage:", e);
            return [];
        }
    };

    const saveCertsToStorage = (certs) => {
        try {
            localStorage.setItem('certificados', JSON.stringify(certs));
        } catch (e) {
            console.error("Erro ao salvar certificados no localStorage:", e);
        }
    };

    const renderCerts = () => {
        const certs = getCertsFromStorage();
        certGrid.innerHTML = ''; // Limpa a grade antes de renderizar
        if (certs.length === 0) {
            certGrid.innerHTML = '<p class="text-center text-gray-500">Nenhum certificado adicionado ainda. Clique em "Adicionar Certificado" para começar!</p>';
            return;
        }

        certs.forEach(cert => {
            const certCard = document.createElement('div');
            certCard.className = 'cert-card';
            certCard.innerHTML = `
                <h3>${cert.nome}</h3>
                <p><strong>Instituição:</strong> ${cert.instituicao}</p>
                <p class="dates"><strong>Conclusão:</strong> ${cert.dataConclusao}</p>
                <div class="cert-actions">
                    <button class="btn btn-secondary btn-sm" onclick="editCert('${cert.id}')">Editar</button>
                    <button class="btn btn-danger btn-sm" onclick="deleteCert('${cert.id}')">Excluir</button>
                </div>
            `;
            certGrid.appendChild(certCard);
        });
    };

    const openModal = (cert = null) => {
        certForm.reset();
        if (cert) {
            modalTitle.textContent = 'Editar Certificado';
            certIdInput.value = cert.id;
            document.getElementById('cert-name').value = cert.nome;
            document.getElementById('cert-issuer').value = cert.instituicao;
            document.getElementById('cert-date').value = cert.dataConclusao;
        } else {
            modalTitle.textContent = 'Adicionar Novo Certificado';
            certIdInput.value = '';
        }
        modal.style.display = 'block';
    };

    const closeModal = () => {
        modal.style.display = 'none';
    };

    addCertBtn.addEventListener('click', () => openModal());
    closeModalBtn.addEventListener('click', closeModal);
    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            closeModal();
        }
    });

    certForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const certs = getCertsFromStorage();
        const certData = {
            id: certIdInput.value || `cert-${Date.now()}`,
            nome: document.getElementById('cert-name').value,
            instituicao: document.getElementById('cert-issuer').value,
            dataConclusao: document.getElementById('cert-date').value,
        };

        if (certIdInput.value) { // Editando
            const certIndex = certs.findIndex(c => c.id === certIdInput.value);
            if (certIndex > -1) {
                certs[certIndex] = certData;
            }
        } else { // Adicionando
            certs.push(certData);
        }

        saveCertsToStorage(certs);
        renderCerts();
        closeModal();
    });

    window.editCert = (id) => {
        const certs = getCertsFromStorage();
        const cert = certs.find(c => c.id === id);
        if (cert) {
            openModal(cert);
        }
    };

    window.deleteCert = (id) => {
        if (confirm('Tem certeza que deseja excluir este certificado?')) {
            let certs = getCertsFromStorage();
            certs = certs.filter(c => c.id !== id);
            saveCertsToStorage(certs);
            renderCerts();
        }
    };

    // Renderização inicial
    try {
        renderCerts();
    } catch (error) {
        console.error("Erro ao renderizar certificados:", error);
        certGrid.innerHTML = '<p class="error-message">Erro ao carregar certificados. Tente novamente mais tarde.</p>';
    }
});

