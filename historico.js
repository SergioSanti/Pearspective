document.addEventListener('DOMContentLoaded', () => {
    const certGrid = document.getElementById('cert-grid');
    const modal = document.getElementById('certModal');
    const addCertBtn = document.getElementById('add-cert-btn');
    const closeModalBtn = document.querySelector('.close-btn');
    const certForm = document.getElementById('cert-form');
    const modalTitle = document.getElementById('modal-title');
    const certIdInput = document.getElementById('cert-id');

    // API base URL - funciona tanto local quanto no Railway
    const API_BASE_URL = window.location.origin + '/api';

    // Função para buscar certificados do usuário logado
    const fetchUserCertificates = async () => {
        try {
            // Primeiro, verificar sessão do usuário
            const sessionResponse = await fetch('/api/me', {
                credentials: 'include'
            });
            
            if (!sessionResponse.ok) {
                console.error('Usuário não autenticado');
                return [];
            }
            
            const sessionData = await sessionResponse.json();
            if (!sessionData.authenticated || !sessionData.user) {
                console.error('Sessão inválida');
                return [];
            }
            
            const userId = sessionData.user.id;
            console.log('🔍 Buscando certificados para usuário ID:', userId);
            
            const response = await fetch(`${API_BASE_URL}/certificados/usuario/${userId}`, {
                credentials: 'include'
            });
            
            if (!response.ok) {
                throw new Error('Erro ao buscar certificados');
            }
            
            const certificados = await response.json();
            console.log('📋 Certificados encontrados:', certificados);
            return certificados;
        } catch (error) {
            console.error('Erro ao buscar certificados:', error);
            return [];
        }
    };

    const renderCerts = async () => {
        try {
            const certs = await fetchUserCertificates();
            certGrid.innerHTML = ''; // Limpa a grade antes de renderizar
            
            if (certs.length === 0) {
                certGrid.innerHTML = '<p class="text-center text-gray-500">Nenhum certificado adicionado ainda. Clique em "Adicionar Certificado" para começar!</p>';
                return;
            }

            certs.forEach(cert => {
                const certCard = document.createElement('div');
                certCard.className = 'cert-card';
                
                // Formatar data
                const dataConclusao = new Date(cert.data_conclusao).toLocaleDateString('pt-BR');
                
                // Botão para visualizar PDF se existir
                const temPdf = cert.pdf || cert.url_certificado;
                const pdfButton = temPdf ? 
                    `<div class="pdf-actions">
                        <button class="btn btn-primary btn-sm" onclick="viewPdf('${cert.id}')" title="Visualizar PDF">
                            👁️ Visualizar
                        </button>
                        <button class="btn btn-secondary btn-sm" onclick="downloadPdf('${cert.id}')" title="Baixar PDF">
                            📥 Baixar
                        </button>
                    </div>` : 
                    '<span class="no-pdf">📄 Sem PDF anexado</span>';
                
                certCard.innerHTML = `
                    <h3>${cert.nome}</h3>
                    <p><strong>Instituição:</strong> ${cert.instituicao}</p>
                    <p class="dates"><strong>Conclusão:</strong> ${dataConclusao}</p>
                    ${cert.descricao ? `<p class="description"><strong>Descrição:</strong> ${cert.descricao}</p>` : ''}
                    <div class="pdf-section">
                        ${pdfButton}
                    </div>
                    <div class="cert-actions">
                        <button class="btn btn-secondary btn-sm" onclick="editCert('${cert.id}')">✏️ Editar</button>
                        <button class="btn btn-danger btn-sm" onclick="deleteCert('${cert.id}')">🗑️ Excluir</button>
                    </div>
                `;
                certGrid.appendChild(certCard);
            });
        } catch (error) {
            console.error('Erro ao renderizar certificados:', error);
            certGrid.innerHTML = '<p class="error-message">Erro ao carregar certificados. Tente novamente mais tarde.</p>';
        }
    };

    const openModal = (cert = null) => {
        certForm.reset();
        if (cert) {
            modalTitle.textContent = 'Editar Certificado';
            certIdInput.value = cert.id;
            document.getElementById('cert-name').value = cert.nome;
            document.getElementById('cert-issuer').value = cert.instituicao;
            document.getElementById('cert-date-start').value = cert.data_inicio || cert.data_conclusao;
            document.getElementById('cert-date').value = cert.data_conclusao;
            document.getElementById('cert-description').value = cert.descricao || '';
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

    certForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        try {
            // Verificar sessão do usuário
            const sessionResponse = await fetch('/api/me', {
                credentials: 'include'
            });
            
            if (!sessionResponse.ok) {
                alert('Usuário não autenticado');
                return;
            }
            
            const sessionData = await sessionResponse.json();
            if (!sessionData.authenticated || !sessionData.user) {
                alert('Sessão inválida');
                return;
            }
            
            const userId = sessionData.user.id;
            const formData = new FormData();
            formData.append('usuario_id', userId);
            formData.append('nome', document.getElementById('cert-name').value);
            formData.append('instituicao', document.getElementById('cert-issuer').value);
            formData.append('data_inicio', document.getElementById('cert-date-start').value);
            formData.append('data_conclusao', document.getElementById('cert-date').value);
            formData.append('descricao', document.getElementById('cert-description').value);
            
            // Adicionar arquivo PDF se selecionado
            const pdfFile = document.getElementById('cert-pdf').files[0];
            if (pdfFile) {
                formData.append('pdf', pdfFile);
            }

            const certId = certIdInput.value;
            const url = certId ? 
                `${API_BASE_URL}/certificados/${certId}` : 
                `${API_BASE_URL}/certificados`;
            const method = certId ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method: method,
                credentials: 'include',
                body: formData
            });

            if (!response.ok) {
                throw new Error('Erro ao salvar certificado');
            }

            await renderCerts();
            closeModal();
            alert(certId ? 'Certificado atualizado com sucesso!' : 'Certificado adicionado com sucesso!');
            
        } catch (error) {
            console.error('Erro ao salvar certificado:', error);
            alert('Erro ao salvar certificado. Tente novamente.');
        }
    });

    window.editCert = async (id) => {
        try {
            const response = await fetch(`${API_BASE_URL}/certificados/${id}`, {
                credentials: 'include'
            });
            if (!response.ok) {
                throw new Error('Erro ao buscar certificado');
            }
            const cert = await response.json();
            openModal(cert);
        } catch (error) {
            console.error('Erro ao buscar certificado:', error);
            alert('Erro ao carregar certificado para edição.');
        }
    };

    window.deleteCert = async (id) => {
        if (confirm('Tem certeza que deseja excluir este certificado?')) {
            try {
                const response = await fetch(`${API_BASE_URL}/certificados/${id}`, {
                    method: 'DELETE',
                    credentials: 'include'
                });
                
                if (!response.ok) {
                    throw new Error('Erro ao excluir certificado');
                }
                
                await renderCerts();
                alert('Certificado excluído com sucesso!');
            } catch (error) {
                console.error('Erro ao excluir certificado:', error);
                alert('Erro ao excluir certificado. Tente novamente.');
            }
        }
    };

    window.viewPdf = async (id) => {
        try {
            const response = await fetch(`${API_BASE_URL}/certificados/${id}/pdf`, {
                credentials: 'include'
            });
            if (!response.ok) {
                throw new Error('Erro ao buscar PDF');
            }
            
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            
            // Abrir PDF em nova aba
            const newWindow = window.open(url, '_blank');
            if (!newWindow) {
                alert('Por favor, permita pop-ups para visualizar o PDF');
            }
        } catch (error) {
            console.error('Erro ao visualizar PDF:', error);
            alert('Erro ao visualizar PDF. Tente novamente.');
        }
    };

    window.downloadPdf = async (id) => {
        try {
            // Primeiro buscar informações do certificado para obter o nome
            const certResponse = await fetch(`${API_BASE_URL}/certificados/${id}`, {
                credentials: 'include'
            });
            if (!certResponse.ok) {
                throw new Error('Erro ao buscar informações do certificado');
            }
            const cert = await certResponse.json();
            
            // Buscar o PDF
            const response = await fetch(`${API_BASE_URL}/certificados/${id}/pdf`, {
                credentials: 'include'
            });
            if (!response.ok) {
                throw new Error('Erro ao buscar PDF');
            }
            
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            
            // Criar nome do arquivo baseado no nome do certificado
            const filename = `${cert.nome.replace(/[^a-zA-Z0-9]/g, '_')}_certificado.pdf`;
            
            // Criar link de download
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
            // Limpar URL
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Erro ao baixar PDF:', error);
            alert('Erro ao baixar PDF. Tente novamente.');
        }
    };

    // Renderização inicial
    renderCerts();
});

