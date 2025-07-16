// ===== JAVASCRIPT DA PÁGINA DE PERFIL =====

class ProfileManager {
    constructor() {
        this.currentUser = null;
        this.originalData = {};
        this.hasChanges = false;
        this.fotoPerfil = null;
        this.init();
    }

    async init() {
        try {
            await this.loadUserData();
            this.setupEventListeners();
        } catch (error) {
            console.error('Erro ao inicializar perfil:', error);
            this.showError('Erro ao carregar dados do perfil');
        }
    }

    async loadUserData() {
        const userName = localStorage.getItem('userName');
        if (!userName) {
            window.location.href = '/login.html';
            return;
        }

        try {
            // Buscar dados do usuário no banco
            const response = await fetch(`/api/users/profile/${encodeURIComponent(userName)}`);
            if (!response.ok) {
                throw new Error('Erro ao buscar dados do usuário');
            }

            this.currentUser = await response.json();
            console.log('📸 Dados do usuário carregados:', {
                nome: this.currentUser.nome,
                foto_perfil: this.currentUser.foto_perfil ? 'Presente' : 'Não presente'
            });
            
            this.originalData = { ...this.currentUser };
            this.fotoPerfil = this.currentUser.foto_perfil || null;
            this.populateForm();
            this.loadUserPhoto();
        } catch (error) {
            console.error('Erro ao carregar dados do usuário:', error);
            // Fallback para dados do localStorage
            this.currentUser = {
                nome: userName,
                email: localStorage.getItem('userEmail') || '',
                tipo_usuario: localStorage.getItem('userType') || 'usuario',
                departamento: localStorage.getItem('userDepartment') || '',
                cargo_atual: localStorage.getItem('userPosition') || '',
                foto_perfil: null,
                data_cadastro: new Date().toISOString()
            };
            this.originalData = { ...this.currentUser };
            this.fotoPerfil = null;
            this.populateForm();
            this.loadUserPhoto();
        }
    }

    populateForm() {
        // Preencher campos do formulário
        document.getElementById('userName').value = this.currentUser.nome || '';
        document.getElementById('userEmail').value = this.currentUser.email || '';
        document.getElementById('userType').value = this.currentUser.tipo_usuario || '';
        document.getElementById('userDepartment').value = this.currentUser.departamento || '';
        document.getElementById('userPosition').value = this.currentUser.cargo_atual || '';
        
        // Formatar data de cadastro
        const registrationDate = this.currentUser.data_cadastro ? 
            new Date(this.currentUser.data_cadastro).toLocaleDateString('pt-BR') : 
            'N/A';
        document.getElementById('userRegistrationDate').value = registrationDate;

        // Configurar cargo baseado no tipo de usuário
        if (this.currentUser.tipo_usuario === 'admin') {
            document.getElementById('userPosition').value = 'Administrador do Sistema';
            document.getElementById('userPosition').readOnly = true;
            document.getElementById('userDepartment').value = 'TI';
            document.getElementById('userDepartment').disabled = true;
        }
    }

    loadUserPhoto() {
        const profilePhoto = document.getElementById('profilePhoto');
        const photoPlaceholder = document.getElementById('photoPlaceholder');

        if (this.fotoPerfil) {
            profilePhoto.innerHTML = `<img src="${this.fotoPerfil}" alt="Foto do perfil">`;
        } else {
            // Mostrar inicial do nome
            const initial = this.currentUser.nome ? this.currentUser.nome.charAt(0).toUpperCase() : 'U';
            photoPlaceholder.textContent = initial;
            profilePhoto.innerHTML = '';
            profilePhoto.appendChild(photoPlaceholder);
        }
    }

    setupEventListeners() {
        // Upload de foto
        const editPhotoBtn = document.getElementById('editPhotoBtn');
        const photoInput = document.getElementById('photoInput');

        editPhotoBtn.addEventListener('click', () => {
            photoInput.click();
        });

        photoInput.addEventListener('change', (e) => {
            this.handlePhotoUpload(e);
        });

        // Monitorar mudanças nos campos
        const formFields = ['userName', 'userDepartment', 'userPosition'];
        formFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            field.addEventListener('input', () => {
                this.checkForChanges();
            });
        });

        // Botões de ação
        document.getElementById('saveProfileBtn').addEventListener('click', () => {
            this.showConfirmModal();
        });

        document.getElementById('cancelChangesBtn').addEventListener('click', () => {
            this.resetForm();
        });

        // Modal
        document.getElementById('closeModal').addEventListener('click', () => {
            this.hideModal();
        });

        document.getElementById('confirmSaveBtn').addEventListener('click', () => {
            this.saveProfile();
        });

        document.getElementById('cancelSaveBtn').addEventListener('click', () => {
            this.hideModal();
        });

        // Fechar modal ao clicar fora
        document.getElementById('confirmModal').addEventListener('click', (e) => {
            if (e.target.id === 'confirmModal') {
                this.hideModal();
            }
        });

        // Currículo
        this.setupCurriculumEventListeners();
    }

    setupCurriculumEventListeners() {
        const curriculumInput = document.getElementById('curriculumInput');
        const downloadBtn = document.getElementById('downloadCurriculumBtn');
        const deleteBtn = document.getElementById('deleteCurriculumBtn');
        const viewBtn = document.getElementById('viewCurriculumBtn');

        // Upload de currículo
        curriculumInput.addEventListener('change', (e) => {
            this.handleCurriculumUpload(e);
        });

        // Visualizar currículo
        viewBtn.addEventListener('click', () => {
            this.viewCurriculum();
        });

        // Download de currículo
        downloadBtn.addEventListener('click', () => {
            this.downloadCurriculum();
        });

        // Excluir currículo
        deleteBtn.addEventListener('click', () => {
            this.deleteCurriculum();
        });

        // Verificar status do currículo ao carregar
        this.checkCurriculumStatus();
    }

    async checkCurriculumStatus() {
        const userName = localStorage.getItem('userName');
        if (!userName) return;

        try {
            const response = await fetch(`/api/users/curriculum/${encodeURIComponent(userName)}/status`);
            const data = await response.json();

            // Corrigir: só mostrar ações se realmente houver arquivo e tamanho > 0
            if (data.hasCurriculum && data.fileSize && data.fileSize > 0) {
                this.showCurriculumActions(true);
                this.updateCurriculumInfo(data);
            } else {
                this.showCurriculumActions(false);
            }
        } catch (error) {
            console.error('Erro ao verificar currículo:', error);
            this.showCurriculumActions(false);
        }
    }

    showCurriculumActions(hasCurriculum) {
        const uploadSection = document.getElementById('uploadSection');
        const curriculumControls = document.getElementById('curriculumControls');

        if (hasCurriculum) {
            // Mostrar ambos: controles do currículo existente E opção de substituir
            uploadSection.style.display = 'flex';
            curriculumControls.style.display = 'block';
            
            // Atualizar texto da área de upload
            const uploadText = uploadSection.querySelector('.upload-text strong');
            if (uploadText) {
                uploadText.textContent = 'Substituir Currículo';
            }
            
            const uploadSubtext = uploadSection.querySelector('.upload-text span');
            if (uploadSubtext) {
                uploadSubtext.textContent = 'Clique para selecionar um novo arquivo PDF';
            }
        } else {
            // Mostrar apenas área de upload
            uploadSection.style.display = 'flex';
            curriculumControls.style.display = 'none';
            
            // Restaurar texto original
            const uploadText = uploadSection.querySelector('.upload-text strong');
            if (uploadText) {
                uploadText.textContent = 'Enviar Currículo';
            }
            
            const uploadSubtext = uploadSection.querySelector('.upload-text span');
            if (uploadSubtext) {
                uploadSubtext.textContent = 'Clique para selecionar um arquivo PDF';
            }
        }
    }

    async handleCurriculumUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        // Validar tipo de arquivo
        if (file.type !== 'application/pdf') {
            this.showError('Por favor, selecione apenas arquivos PDF');
            return;
        }

        // Validar tamanho (máximo 10MB)
        if (file.size > 10 * 1024 * 1024) {
            this.showError('O arquivo deve ter no máximo 10MB');
            return;
        }

        try {
            this.showLoading(true);

            const formData = new FormData();
            formData.append('curriculum', file);

            const userName = localStorage.getItem('userName');
            const response = await fetch(`/api/users/curriculum/${encodeURIComponent(userName)}`, {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (response.ok) {
                this.showSuccess('Currículo enviado com sucesso!');
                this.showCurriculumActions(true);
                this.updateCurriculumInfo(data);
            } else {
                throw new Error(data.error || 'Erro ao enviar currículo');
            }
        } catch (error) {
            console.error('Erro ao enviar currículo:', error);
            this.showError(error.message);
        } finally {
            this.showLoading(false);
        }
    }

    updateCurriculumInfo(data) {
        const fileName = document.getElementById('curriculumFileName');
        const fileSize = document.getElementById('curriculumFileSize');
        const lastUpdate = document.getElementById('curriculumLastUpdate');

        fileName.textContent = data.fileName || 'curriculo.pdf';
        fileSize.textContent = this.formatFileSize(data.fileSize || 0);
        lastUpdate.textContent = new Date().toLocaleDateString('pt-BR');
    }

    async viewCurriculum() {
        const userName = localStorage.getItem('userName');
        if (!userName) return;

        try {
            const response = await fetch(`/api/users/curriculum/${encodeURIComponent(userName)}`);
            
            if (!response.ok) {
                throw new Error('Erro ao carregar currículo');
            }

            // Criar blob e abrir em nova aba
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            window.open(url, '_blank');
            
            // Limpar URL após um tempo
            setTimeout(() => {
                window.URL.revokeObjectURL(url);
            }, 1000);

        } catch (error) {
            console.error('Erro ao visualizar currículo:', error);
            this.showError('Erro ao visualizar currículo');
        }
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    async downloadCurriculum() {
        const userName = localStorage.getItem('userName');
        if (!userName) return;

        try {
            // Primeiro, obter informações do arquivo para usar o nome original
            const statusResponse = await fetch(`/api/users/curriculum/${encodeURIComponent(userName)}/status`);
            const statusData = await statusResponse.json();
            
            const response = await fetch(`/api/users/curriculum/${encodeURIComponent(userName)}`);
            
            if (!response.ok) {
                throw new Error('Erro ao baixar currículo');
            }

            // Criar blob e download
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            // Usar nome original do arquivo se disponível
            a.download = statusData.fileName || `curriculo_${userName}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            this.showSuccess('Download iniciado!');
        } catch (error) {
            console.error('Erro ao baixar currículo:', error);
            this.showError('Erro ao baixar currículo');
        }
    }

    async deleteCurriculum() {
        const userName = localStorage.getItem('userName');
        if (!userName) return;

        if (!confirm('Tem certeza que deseja excluir o currículo?')) {
            return;
        }

        try {
            const response = await fetch(`/api/users/curriculum/${encodeURIComponent(userName)}`, {
                method: 'DELETE'
            });

            const data = await response.json();

            if (response.ok) {
                this.showSuccess('Currículo excluído com sucesso!');
                this.showCurriculumActions(false);
            } else {
                throw new Error(data.error || 'Erro ao excluir currículo');
            }
        } catch (error) {
            console.error('Erro ao excluir currículo:', error);
            this.showError(error.message);
        }
    }

    async handlePhotoUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        // Validar tipo de arquivo
        if (!file.type.startsWith('image/')) {
            this.showError('Por favor, selecione apenas arquivos de imagem');
            return;
        }

        // Validar tamanho (máximo 5MB)
        if (file.size > 5 * 1024 * 1024) {
            this.showError('A imagem deve ter no máximo 5MB');
            return;
        }

        try {
            const reader = new FileReader();
            reader.onload = (e) => {
                const photoData = e.target.result;
                this.fotoPerfil = photoData;
                this.loadUserPhoto();
                this.checkForChanges();
                this.showSuccess('Foto carregada! Clique em Salvar para atualizar.');
            };
            reader.readAsDataURL(file);
        } catch (error) {
            console.error('Erro ao processar foto:', error);
            this.showError('Erro ao processar a foto');
        }
    }

    checkForChanges() {
        const currentData = {
            nome: document.getElementById('userName').value,
            departamento: document.getElementById('userDepartment').value,
            cargo_atual: document.getElementById('userPosition').value,
            foto_perfil: this.fotoPerfil
        };

        this.hasChanges = JSON.stringify(currentData) !== JSON.stringify({
            nome: this.originalData.nome,
            departamento: this.originalData.departamento,
            cargo_atual: this.originalData.cargo_atual,
            foto_perfil: this.originalData.foto_perfil
        });

        // Atualizar estado dos botões
        const saveBtn = document.getElementById('saveProfileBtn');
        const cancelBtn = document.getElementById('cancelChangesBtn');

        if (this.hasChanges) {
            saveBtn.disabled = false;
            cancelBtn.style.display = 'flex';
        } else {
            saveBtn.disabled = true;
            cancelBtn.style.display = 'none';
        }
    }

    async saveProfile() {
        this.hideModal();
        this.showLoading(true);

        try {
            const updatedData = {
                nome: document.getElementById('userName').value,
                departamento: document.getElementById('userDepartment').value,
                cargo_atual: document.getElementById('userPosition').value,
                foto_perfil: this.fotoPerfil
            };

            // Validar dados
            if (!updatedData.nome.trim()) {
                throw new Error('Nome é obrigatório');
            }

            // Atualizar no banco de dados
            const response = await fetch(`/api/users/profile/${encodeURIComponent(this.currentUser.nome)}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updatedData)
            });

            if (!response.ok) {
                throw new Error('Erro ao atualizar perfil');
            }

            const updatedUser = await response.json();
            
            // Atualizar dados locais
            this.currentUser = { ...this.currentUser, ...updatedUser };
            this.originalData = { ...this.currentUser };
            this.fotoPerfil = updatedUser.foto_perfil || null;
            
            // Atualizar localStorage (apenas nome, área, cargo)
            localStorage.setItem('userName', updatedUser.nome);
            if (updatedUser.departamento) {
                localStorage.setItem('userDepartment', updatedUser.departamento);
            }
            if (updatedUser.cargo_atual) {
                localStorage.setItem('userPosition', updatedUser.cargo_atual);
            }
            
            // Atualizar foto no localStorage
            if (updatedUser.foto_perfil) {
                localStorage.setItem('userPhoto', updatedUser.foto_perfil);
            } else {
                localStorage.removeItem('userPhoto');
            }

            // Verificar se precisa adicionar área/cargo ao simulador
            await this.checkAndAddToSimulator(updatedData);

            this.hasChanges = false;
            this.checkForChanges();
            this.showSuccess('Perfil atualizado com sucesso!');

        } catch (error) {
            console.error('Erro ao salvar perfil:', error);
            this.showError(error.message || 'Erro ao salvar perfil');
        } finally {
            this.showLoading(false);
        }
    }

    async checkAndAddToSimulator(data) {
        try {
            // Adicionar área se não existir
            if (data.departamento && data.departamento.trim()) {
                await this.addAreaIfNotExists(data.departamento);
            }

            // Adicionar cargo se não existir
            if (data.cargo_atual && data.cargo_atual.trim()) {
                await this.addPositionIfNotExists(data.cargo_atual, data.departamento);
            }
        } catch (error) {
            console.error('Erro ao verificar simulador:', error);
        }
    }

    async addAreaIfNotExists(areaName) {
        try {
            const response = await fetch('/api/areas', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ nome: areaName })
            });

            if (response.ok) {
                console.log(`Área "${areaName}" adicionada ao simulador`);
            }
        } catch (error) {
            console.error('Erro ao adicionar área:', error);
        }
    }

    async addPositionIfNotExists(positionName, areaName) {
        try {
            const response = await fetch('/api/positions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    nome_cargo: positionName,
                    area_nome: areaName 
                })
            });

            if (response.ok) {
                console.log(`Cargo "${positionName}" adicionado ao simulador`);
            }
        } catch (error) {
            console.error('Erro ao adicionar cargo:', error);
        }
    }

    resetForm() {
        this.populateForm();
        this.fotoPerfil = this.originalData.foto_perfil || null;
        this.loadUserPhoto();
        this.hasChanges = false;
        this.checkForChanges();
        this.showSuccess('Alterações canceladas');
    }

    showConfirmModal() {
        document.getElementById('confirmModal').classList.add('active');
    }

    hideModal() {
        document.getElementById('confirmModal').classList.remove('active');
    }

    showLoading(show) {
        const spinner = document.getElementById('loadingSpinner');
        if (show) {
            spinner.classList.add('active');
        } else {
            spinner.classList.remove('active');
        }
    }

    showSuccess(message) {
        this.showMessage(message, 'success');
    }

    showError(message) {
        this.showMessage(message, 'error');
    }

    showMessage(message, type) {
        // Remover mensagens existentes
        const existingMessages = document.querySelectorAll('.success-message, .error-message');
        existingMessages.forEach(msg => msg.remove());

        // Criar nova mensagem
        const messageDiv = document.createElement('div');
        messageDiv.className = type === 'success' ? 'success-message' : 'error-message';
        messageDiv.innerHTML = `
            <span>${type === 'success' ? '✅' : '❌'}</span>
            <span>${message}</span>
        `;

        // Inserir no início do container
        const container = document.querySelector('.profile-content');
        container.insertBefore(messageDiv, container.firstChild);

        // Remover após 5 segundos
        setTimeout(() => {
            messageDiv.remove();
        }, 5000);
    }
}

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    new ProfileManager();
});

// Verificar se o usuário está logado
document.addEventListener('DOMContentLoaded', () => {
    const userName = localStorage.getItem('userName');
    if (!userName) {
        window.location.href = '/login.html';
    }
}); 