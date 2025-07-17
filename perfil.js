// ===== JAVASCRIPT DA PÁGINA DE PERFIL =====

class ProfileManager {
    constructor() {
        this.currentUser = null;
        this.originalData = {};
        this.hasChanges = false;
        this.fotoPerfil = null;
        this.loginUserName = null; // Nome de login (não alterável)
        this.init();
    }

    async init() {
        try {
            // Carregar dados do usuário primeiro
            await this.loadUserData();
            
            // Depois carregar as áreas
            await this.loadAreas();
            
            // Preencher o formulário com os dados carregados
            await this.populateForm();
            
            // Por último configurar os event listeners
            this.setupEventListeners();
        } catch (error) {
            console.error('Erro ao inicializar perfil:', error);
            this.showError('Erro ao carregar dados do perfil');
        }
    }

    async loadUserData() {
        try {
            // Buscar dados da sessão atual
            const sessionResponse = await fetch('/api/me', {
                credentials: 'include'
            });
            
            if (!sessionResponse.ok) {
                console.log('❌ [PERFIL] Sessão inválida, redirecionando para login');
                window.location.href = '/login.html';
                return;
            }
            
            const sessionData = await sessionResponse.json();
            const userName = sessionData.user.nome;
            
            console.log('🔍 [PERFIL] Carregando dados do usuário:', userName);
            
            if (!userName) {
                console.log('❌ [PERFIL] Nenhum userName encontrado, redirecionando para login');
                window.location.href = '/login.html';
                return;
            }

            // Guardar o nome de login original
            this.loginUserName = userName;
            console.log('✅ [PERFIL] Nome de login definido:', this.loginUserName);

            // Buscar dados do usuário no banco
            console.log('🔍 [PERFIL] Fazendo requisição para:', `/api/users/profile/${encodeURIComponent(userName)}`);
            const response = await fetch(`/api/users/profile/${encodeURIComponent(userName)}`);
            
            console.log('📊 [PERFIL] Status da resposta:', response.status, response.statusText);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ [PERFIL] Erro na resposta:', errorText);
                throw new Error(`Erro ao buscar dados do usuário: ${response.status} ${response.statusText}`);
            }

            this.currentUser = await response.json();
            console.log('📸 [PERFIL] Dados do usuário carregados:', {
                nome: this.currentUser.nome,
                foto_perfil: this.currentUser.foto_perfil ? 'Presente' : 'Não presente',
                id: this.currentUser.id
            });
            
            this.originalData = { ...this.currentUser };
            this.fotoPerfil = this.currentUser.foto_perfil || null;
            this.loadUserPhoto();
        } catch (error) {
            console.error('❌ [PERFIL] Erro ao carregar dados do usuário:', error);
            this.showError('Erro ao carregar dados do perfil');
        }
    }

    async loadAreas() {
        const areaSelect = document.getElementById('userDepartment');
        
        try {
            const response = await fetch('/api/areas');
            if (!response.ok) {
                throw new Error('Erro ao carregar áreas');
            }
            
            const areas = await response.json();
            
            // Limpar opções existentes
            areaSelect.innerHTML = '<option value="">-- Escolha uma área --</option>';
            
            // Remover duplicatas baseado no nome
            const uniqueAreas = areas.filter((area, index, self) => 
                index === self.findIndex(a => a.nome === area.nome)
            );
            
            // Adicionar áreas únicas do banco de dados
            uniqueAreas.forEach(area => {
                const option = document.createElement('option');
                option.value = area.id; // Usar ID da área como valor
                option.textContent = area.nome; // Usar nome da área como texto
                areaSelect.appendChild(option);
            });
            
            console.log(`✅ ${uniqueAreas.length} áreas únicas carregadas do banco de dados`);
        } catch (error) {
            console.error('Erro ao carregar áreas:', error);
        }
    }

    async loadCargosByArea(areaId, selectedCargo = null) {
        const cargoSelect = document.getElementById('userPosition');
        
        if (!areaId) {
            cargoSelect.innerHTML = '<option value="">Escolha uma área primeiro</option>';
            cargoSelect.disabled = true;
            return;
        }

        try {
            // Buscar cargos da área específica
            const response = await fetch(`/api/cargos/area/${areaId}`);
            if (!response.ok) {
                throw new Error('Erro ao carregar cargos');
            }
            
            const cargos = await response.json();
            
            if (cargos.length === 0) {
                cargoSelect.innerHTML = '<option value="">Nenhum cargo encontrado para esta área</option>';
                cargoSelect.disabled = true;
            } else {
                cargoSelect.innerHTML = '<option value="">-- Escolha um cargo --</option>';
                cargos.forEach(cargo => {
                    const option = document.createElement('option');
                    // Usar nome_cargo se disponível, senão usar nome
                    const cargoName = cargo.nome_cargo || cargo.nome || 'Cargo sem nome';
                    option.value = cargoName;
                    option.textContent = cargoName;
                    cargoSelect.appendChild(option);
                });
                cargoSelect.disabled = false;
                
                // Se há um cargo selecionado, definir o valor
                if (selectedCargo) {
                    cargoSelect.value = selectedCargo;
                }
            }
            
        } catch (error) {
            console.error('Erro ao carregar cargos:', error);
            cargoSelect.innerHTML = '<option value="">Erro ao carregar cargos</option>';
            cargoSelect.disabled = true;
        }
    }



    async populateForm() {
        // Preencher campos do formulário
        document.getElementById('userName').value = this.currentUser.nome_exibicao || this.currentUser.nome || '';
        document.getElementById('userLogin').value = this.currentUser.nome || '';
        document.getElementById('userEmail').value = this.currentUser.email || '';
        document.getElementById('userType').value = this.currentUser.tipo_usuario || '';
        
        // Formatar data de cadastro
        const registrationDate = this.currentUser.data_cadastro ? 
            new Date(this.currentUser.data_cadastro).toLocaleDateString('pt-BR') : 
            'N/A';
        document.getElementById('userRegistrationDate').value = registrationDate;

        // Configurar cargo baseado no tipo de usuário
        if (this.currentUser.tipo_usuario === 'admin') {
            document.getElementById('userPosition').value = 'Administrador do Sistema';
            document.getElementById('userPosition').disabled = true;
            document.getElementById('userDepartment').value = 'Tecnologia'; // Nome da área
            document.getElementById('userDepartment').disabled = true;
        } else {
            // Definir a área diretamente pelo nome (áreas já foram carregadas)
            const userDepartment = this.currentUser.departamento || '';
            if (userDepartment) {
                // Buscar o ID da área pelo nome
                const areasResponse = await fetch('/api/areas');
                if (areasResponse.ok) {
                    const areas = await areasResponse.json();
                    const area = areas.find(a => a.nome === userDepartment);
                    if (area) {
                        document.getElementById('userDepartment').value = area.id;
                        
                        // Aguardar um pouco e carregar cargos da área selecionada
                        await new Promise(resolve => setTimeout(resolve, 200));
                        const selectedCargo = this.currentUser.cargo_atual || '';
                        await this.loadCargosByArea(area.id, selectedCargo);
                    } else {
                        document.getElementById('userDepartment').value = userDepartment;
                    }
                } else {
                    document.getElementById('userDepartment').value = userDepartment;
                }
            }
        }
    }

    loadUserPhoto() {
        const profilePhoto = document.getElementById('profilePhoto');
        const photoPlaceholder = document.getElementById('photoPlaceholder');

        // Usar foto do banco de dados do Railway
        if (this.fotoPerfil) {
            profilePhoto.innerHTML = `<img src="${this.fotoPerfil}" alt="Foto do perfil">`;
            console.log('[PERFIL] Foto carregada do banco de dados');
        } else {
            // Mostrar inicial do nome de exibição
            const displayName = this.currentUser.nome_exibicao || this.currentUser.nome;
            const initial = displayName ? displayName.charAt(0).toUpperCase() : 'U';
            photoPlaceholder.textContent = initial;
            profilePhoto.innerHTML = '';
            profilePhoto.appendChild(photoPlaceholder);
            console.log('[PERFIL] Usando inicial:', initial);
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

        // Evento quando muda área - carregar cargos da área selecionada
        const areaSelect = document.getElementById('userDepartment');
        areaSelect.addEventListener('change', () => {
            const areaName = areaSelect.value;
            this.loadCargosByArea(areaName);
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
        try {
            // Buscar nome do usuário da sessão atual
            const sessionResponse = await fetch('/api/me', {
                credentials: 'include'
            });
            
            if (!sessionResponse.ok) {
                return;
            }
            
            const sessionData = await sessionResponse.json();
            const userName = sessionData.user.nome;
            
            if (!userName) return;

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

            // Buscar nome do usuário da sessão atual
            const sessionResponse = await fetch('/api/me', {
                credentials: 'include'
            });
            
            if (!sessionResponse.ok) {
                throw new Error('Sessão inválida');
            }
            
            const sessionData = await sessionResponse.json();
            const userName = sessionData.user?.nome;
            
            if (!userName) {
                throw new Error('Nome do usuário não encontrado na sessão');
            }

            const formData = new FormData();
            formData.append('curriculum', file);

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
        try {
            // Buscar nome do usuário da sessão atual
            const sessionResponse = await fetch('/api/me', {
                credentials: 'include'
            });
            
            if (!sessionResponse.ok) {
                throw new Error('Sessão inválida');
            }
            
            const sessionData = await sessionResponse.json();
            const userName = sessionData.user?.nome;
            
            if (!userName) {
                throw new Error('Nome do usuário não encontrado na sessão');
            }

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
        try {
            // Buscar nome do usuário da sessão atual
            const sessionResponse = await fetch('/api/me', {
                credentials: 'include'
            });
            
            if (!sessionResponse.ok) {
                throw new Error('Sessão inválida');
            }
            
            const sessionData = await sessionResponse.json();
            const userName = sessionData.user?.nome;
            
            if (!userName) {
                throw new Error('Nome do usuário não encontrado na sessão');
            }

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
        try {
            // Buscar nome do usuário da sessão atual
            const sessionResponse = await fetch('/api/me', {
                credentials: 'include'
            });
            
            if (!sessionResponse.ok) {
                throw new Error('Sessão inválida');
            }
            
            const sessionData = await sessionResponse.json();
            const userName = sessionData.user?.nome;
            
            if (!userName) {
                throw new Error('Nome do usuário não encontrado na sessão');
            }

            if (!confirm('Tem certeza que deseja excluir o currículo?')) {
                return;
            }

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
        console.log('📸 [PERFIL] Arquivo selecionado:', file ? {
            name: file.name,
            size: file.size,
            type: file.type
        } : 'Nenhum arquivo');
        
        if (!file) {
            console.log('❌ [PERFIL] Nenhum arquivo selecionado');
            return;
        }

        // Limpar input para permitir selecionar o mesmo arquivo novamente
        event.target.value = '';

        // Validar tipo de arquivo
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            console.log('❌ [PERFIL] Tipo de arquivo não suportado:', file.type);
            this.showError(`Formato não suportado. Use apenas: ${allowedTypes.map(t => t.replace('image/', '').toUpperCase()).join(', ')}`);
            return;
        }

        // Validar tamanho (máximo 2MB)
        const maxSize = 2 * 1024 * 1024; // 2MB
        if (file.size > maxSize) {
            const fileSizeMB = (file.size / (1024 * 1024)).toFixed(1);
            const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(1);
            console.log('❌ [PERFIL] Arquivo muito grande:', fileSizeMB, 'MB');
            this.showError(`Arquivo muito grande: ${fileSizeMB}MB. Tamanho máximo permitido: ${maxSizeMB}MB`);
            return;
        }

        console.log('✅ [PERFIL] Validações passaram, processando arquivo...');

        // Validar dimensões da imagem (opcional)
        try {
            const dimensions = await this.getImageDimensions(file);
            if (dimensions.width > 2048 || dimensions.height > 2048) {
                console.log('❌ [PERFIL] Dimensões muito grandes:', dimensions);
                this.showError('Imagem muito grande. Dimensões máximas: 2048x2048 pixels');
                return;
            }
        } catch (error) {
            console.warn('⚠️ [PERFIL] Não foi possível verificar dimensões da imagem:', error);
        }

        try {
            const reader = new FileReader();
            reader.onload = (e) => {
                const photoData = e.target.result;
                console.log('✅ [PERFIL] Arquivo convertido para base64, tamanho:', photoData.length);
                this.fotoPerfil = photoData;
                
                this.loadUserPhoto();
                this.checkForChanges();
                this.showSuccess('Foto carregada! Clique em Salvar para atualizar.');
            };
            reader.readAsDataURL(file);
        } catch (error) {
            console.error('❌ [PERFIL] Erro ao processar foto:', error);
            this.showError('Erro ao processar a foto. Tente novamente.');
        }
    }

    getImageDimensions(file) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                resolve({
                    width: img.width,
                    height: img.height
                });
            };
            img.onerror = () => {
                reject(new Error('Não foi possível carregar a imagem'));
            };
            img.src = URL.createObjectURL(file);
        });
    }

    checkForChanges() {
        const currentData = {
            nome: document.getElementById('userName').value,
            departamento: document.getElementById('userDepartment').value,
            cargo_atual: document.getElementById('userPosition').value,
            foto_perfil: this.fotoPerfil
        };

        this.hasChanges = JSON.stringify(currentData) !== JSON.stringify({
            nome: this.originalData.nome_exibicao || this.originalData.nome,
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

            // Atualizar nome de exibição separadamente
            if (updatedData.nome !== this.originalData.nome_exibicao) {
                const displayNameResponse = await fetch(`/api/users/display-name/${encodeURIComponent(this.loginUserName)}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ displayName: updatedData.nome })
                });

                if (!displayNameResponse.ok) {
                    const errorData = await displayNameResponse.json().catch(() => ({}));
                    const errorMessage = errorData.error || errorData.details || 'Erro ao atualizar nome de exibição';
                    throw new Error(errorMessage);
                }

                const updatedUserDisplay = await displayNameResponse.json();
                console.log('✅ Nome de exibição atualizado:', updatedUserDisplay.nome_exibicao);
            }

            // Atualizar perfil (departamento, cargo, foto) no banco de dados usando o nome de login original
            const response = await fetch(`/api/users/profile/${encodeURIComponent(this.loginUserName)}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    departamento: updatedData.departamento || '',
                    cargo_atual: updatedData.cargo_atual || '',
                    foto_perfil: updatedData.foto_perfil
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const errorMessage = errorData.error || errorData.details || 'Erro ao atualizar perfil';
                throw new Error(errorMessage);
            }

            const updatedUser = await response.json();
            
            // Atualizar dados locais
            this.currentUser = { ...this.currentUser, ...updatedUser };
            this.originalData = { ...this.currentUser };
            this.fotoPerfil = updatedUser.foto_perfil || null;
            
            // Dados atualizados com sucesso no banco

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
            if (!areaName || !areaName.trim()) return;
            const cleanName = areaName.trim().toLowerCase();
            const response = await fetch('/api/areas');
            if (!response.ok) return;
            const areas = await response.json();
            const exists = areas.some(a => a.nome && a.nome.trim().toLowerCase() === cleanName);
            if (exists) return;
            await fetch('/api/areas', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nome: areaName.trim() })
            });
        } catch (error) {
            console.error('Erro ao adicionar área:', error);
        }
    }

    async addPositionIfNotExists(positionName, areaName) {
        try {
            if (!positionName || !positionName.trim() || !areaName || !areaName.trim()) return;
            const cleanPosition = positionName.trim().toLowerCase();
            const cleanArea = areaName.trim().toLowerCase();
            // Buscar áreas para pegar o ID correto
            const areasResponse = await fetch('/api/areas');
            if (!areasResponse.ok) return;
            const areas = await areasResponse.json();
            const area = areas.find(a => a.nome && a.nome.trim().toLowerCase() === cleanArea);
            if (!area) return;
            // Buscar cargos da área
            const cargosResponse = await fetch('/api/cargos');
            if (!cargosResponse.ok) return;
            const cargos = await cargosResponse.json();
            const exists = cargos.some(c => c.nome_cargo && c.nome_cargo.trim().toLowerCase() === cleanPosition);
            if (exists) return;
            await fetch('/api/positions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nome_cargo: positionName.trim(), area_nome: areaName.trim() })
            });
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
    // A verificação será feita no loadUserData()
}); 