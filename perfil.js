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
        
        console.log('🔄 [PERFIL] loadCargosByArea chamada com:', { areaId, selectedCargo });
        
        if (!areaId) {
            cargoSelect.innerHTML = '<option value="">Escolha uma área primeiro</option>';
            cargoSelect.disabled = true;
            return;
        }

        try {
            // Buscar cargos da área específica
            console.log('🔍 [PERFIL] Buscando cargos para área ID:', areaId);
            const response = await fetch(`/api/cargos/area/${areaId}`);
            if (!response.ok) {
                throw new Error('Erro ao carregar cargos');
            }
            
            const cargos = await response.json();
            console.log('📋 [PERFIL] Cargos recebidos:', cargos);
            
            if (cargos.length === 0) {
                cargoSelect.innerHTML = '<option value="">Nenhum cargo encontrado para esta área</option>';
                cargoSelect.disabled = true;
                console.log('⚠️ [PERFIL] Nenhum cargo encontrado para a área');
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
                
                console.log('✅ [PERFIL] Cargos carregados no select:', cargos.length, 'cargos');
                
                // Se há um cargo selecionado, definir o valor
                if (selectedCargo) {
                    console.log('🔍 [PERFIL] Procurando cargo:', selectedCargo);
                    console.log('📋 [PERFIL] Cargos disponíveis:', cargos.map(c => c.nome_cargo || c.nome));
                    
                    // Tentar encontrar o cargo exato
                    const exactCargo = cargos.find(c => 
                        (c.nome_cargo && c.nome_cargo === selectedCargo) || 
                        (c.nome && c.nome === selectedCargo)
                    );
                    
                    if (exactCargo) {
                        const cargoName = exactCargo.nome_cargo || exactCargo.nome;
                        cargoSelect.value = cargoName;
                        console.log('✅ [PERFIL] Cargo encontrado e selecionado:', cargoName);
                    } else {
                        console.log('⚠️ [PERFIL] Cargo não encontrado, tentando adicionar...');
                        // Tentar adicionar o cargo se não existir
                        try {
                            const areaSelect = document.getElementById('userDepartment');
                            const areaName = areaSelect.options[areaSelect.selectedIndex]?.text || '';
                            
                            console.log('🔍 [PERFIL] Adicionando cargo:', selectedCargo, 'para área:', areaName);
                            
                            const addCargoResponse = await fetch('/api/positions', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ 
                                    nome_cargo: selectedCargo,
                                    area_nome: areaName
                                })
                            });
                            
                            if (addCargoResponse.ok) {
                                console.log('✅ [PERFIL] Novo cargo criado');
                                // Recarregar cargos para incluir o novo
                                await this.loadCargosByArea(areaId, selectedCargo);
                            } else {
                                console.log('⚠️ [PERFIL] Não foi possível criar cargo');
                                cargoSelect.value = selectedCargo; // Usar o valor original
                            }
                        } catch (addError) {
                            console.error('❌ [PERFIL] Erro ao criar cargo:', addError);
                            cargoSelect.value = selectedCargo; // Usar o valor original
                        }
                    }
                } else {
                    console.log('ℹ️ [PERFIL] Nenhum cargo para selecionar');
                }
            }
            
        } catch (error) {
            console.error('❌ [PERFIL] Erro ao carregar cargos:', error);
            cargoSelect.innerHTML = '<option value="">Erro ao carregar cargos</option>';
            cargoSelect.disabled = true;
        }
    }



    async populateForm() {
        console.log('🔍 [PERFIL] Preenchendo formulário com dados:', this.currentUser);
        
        // Preencher campos do formulário
        const displayName = this.currentUser.nome_exibicao || this.currentUser.nome || '';
        document.getElementById('userName').value = displayName;
        document.getElementById('userLogin').value = this.currentUser.nome || '';
        document.getElementById('userEmail').value = this.currentUser.email || '';
        document.getElementById('userType').value = this.currentUser.tipo_usuario || '';
        
        console.log('✅ [PERFIL] Nome de exibição definido:', displayName);
        
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
            // Definir a área e cargo
            const userDepartment = this.currentUser.departamento || '';
            const userCargo = this.currentUser.cargo_atual || '';
            
            console.log('🔍 [PERFIL] Departamento e cargo do usuário:', { userDepartment, userCargo });
            
            if (userDepartment) {
                try {
                    // Buscar o ID da área pelo nome
                    const areasResponse = await fetch('/api/areas');
                    if (areasResponse.ok) {
                        const areas = await areasResponse.json();
                        console.log('📋 [PERFIL] Áreas disponíveis:', areas.map(a => ({ id: a.id, nome: a.nome })));
                        
                        const area = areas.find(a => a.nome === userDepartment);
                        if (area) {
                            console.log('✅ [PERFIL] Área encontrada:', area);
                            document.getElementById('userDepartment').value = area.id;
                            
                            // Carregar cargos da área selecionada
                            console.log('🔄 [PERFIL] Carregando cargos para área:', area.id, 'cargo:', userCargo);
                            await this.loadCargosByArea(area.id, userCargo);
                            
                            // Verificar se o cargo foi selecionado corretamente
                            setTimeout(() => {
                                const cargoSelect = document.getElementById('userPosition');
                                console.log('🔍 [PERFIL] Verificação final - Cargo selecionado:', cargoSelect.value);
                                console.log('🔍 [PERFIL] Cargo esperado:', userCargo);
                            }, 1000);
                            
                        } else {
                            console.log('⚠️ [PERFIL] Área não encontrada, tentando adicionar...');
                            // Tentar adicionar a área se não existir
                            try {
                                const addAreaResponse = await fetch('/api/areas', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ nome: userDepartment })
                                });
                                
                                if (addAreaResponse.ok) {
                                    const newArea = await addAreaResponse.json();
                                    console.log('✅ [PERFIL] Nova área criada:', newArea);
                                    document.getElementById('userDepartment').value = newArea.id;
                                    await this.loadCargosByArea(newArea.id, userCargo);
                                } else {
                                    console.log('⚠️ [PERFIL] Não foi possível criar área, usando valor padrão');
                                    document.getElementById('userDepartment').value = '';
                                }
                            } catch (addError) {
                                console.error('❌ [PERFIL] Erro ao criar área:', addError);
                                document.getElementById('userDepartment').value = '';
                            }
                        }
                    } else {
                        console.log('⚠️ [PERFIL] Erro ao buscar áreas');
                        document.getElementById('userDepartment').value = '';
                    }
                } catch (error) {
                    console.error('❌ [PERFIL] Erro ao configurar área:', error);
                    document.getElementById('userDepartment').value = '';
                }
            } else {
                // Se não há departamento definido, limpar os campos
                console.log('⚠️ [PERFIL] Nenhum departamento definido, limpando campos');
                document.getElementById('userDepartment').value = '';
                document.getElementById('userPosition').value = '';
                document.getElementById('userPosition').disabled = true;
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
            console.log('🔍 Verificando status do currículo...');
            
            // Buscar nome do usuário da sessão atual
            const sessionResponse = await fetch('/api/me', {
                credentials: 'include'
            });
            
            if (!sessionResponse.ok) {
                console.log('❌ Sessão inválida ao verificar currículo');
                return;
            }
            
            const sessionData = await sessionResponse.json();
            const userName = sessionData.user?.nome;
            
            if (!userName) {
                console.log('❌ Nome do usuário não encontrado na sessão');
                return;
            }

            console.log('👤 Verificando currículo para usuário:', userName);

            const response = await fetch(`/api/users/curriculum/${encodeURIComponent(userName)}/status`);
            
            if (!response.ok) {
                console.error('❌ Erro na resposta do status do currículo:', response.status);
                this.showCurriculumActions(false);
                return;
            }
            
            const data = await response.json();
            console.log('📄 Dados do status do currículo:', data);

            // Verificar se há currículo válido
            if (data.hasCurriculum && data.fileSize && data.fileSize > 0) {
                console.log('✅ Currículo encontrado, mostrando controles');
                this.showCurriculumActions(true);
                this.updateCurriculumInfo(data);
            } else {
                console.log('❌ Nenhum currículo válido encontrado');
                this.showCurriculumActions(false);
            }
        } catch (error) {
            console.error('❌ Erro ao verificar currículo:', error);
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
        if (!file) {
            console.log('❌ Nenhum arquivo selecionado');
            return;
        }

        console.log('📄 Arquivo selecionado:', {
            name: file.name,
            type: file.type,
            size: file.size
        });

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
            console.log('🔄 Iniciando upload do currículo...');

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

            console.log('👤 Fazendo upload para usuário:', userName);

            const formData = new FormData();
            formData.append('curriculum', file);

            console.log('📤 Enviando requisição para:', `/api/users/curriculum/${encodeURIComponent(userName)}`);

            const response = await fetch(`/api/users/curriculum/${encodeURIComponent(userName)}`, {
                method: 'POST',
                body: formData
            });

            console.log('📥 Resposta do servidor:', response.status, response.statusText);

            const data = await response.json();
            console.log('📄 Dados da resposta:', data);

            if (response.ok) {
                console.log('✅ Upload realizado com sucesso');
                this.showSuccess('Currículo enviado com sucesso!');
                this.showCurriculumActions(true);
                this.updateCurriculumInfo(data);
            } else {
                throw new Error(data.error || 'Erro ao enviar currículo');
            }
        } catch (error) {
            console.error('❌ Erro ao enviar currículo:', error);
            this.showError(error.message);
        } finally {
            this.showLoading(false);
        }
    }

    updateCurriculumInfo(data) {
        const fileName = document.getElementById('curriculumFileName');
        const fileSize = document.getElementById('curriculumFileSize');
        const lastUpdate = document.getElementById('curriculumLastUpdate');

        console.log('📄 Atualizando informações do currículo:', data);

        // Usar dados da resposta ou valores padrão
        const name = data.fileName || data.nome_arquivo || 'curriculo.pdf';
        const size = data.fileSize || data.tamanho || 0;
        const date = data.lastUpdated || data.data_upload || new Date();

        fileName.textContent = name;
        fileSize.textContent = this.formatFileSize(size);
        
        // Formatar data corretamente
        if (date) {
            const dateObj = new Date(date);
            lastUpdate.textContent = dateObj.toLocaleDateString('pt-BR');
        } else {
            lastUpdate.textContent = 'hoje';
        }

        console.log('✅ Informações do currículo atualizadas:', {
            fileName: name,
            fileSize: this.formatFileSize(size),
            lastUpdate: lastUpdate.textContent
        });
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
            // Obter o nome da área selecionada em vez do ID
            const areaSelect = document.getElementById('userDepartment');
            const selectedAreaId = areaSelect.value;
            let selectedAreaName = '';
            
            // Se há uma área selecionada, buscar o nome dela
            if (selectedAreaId) {
                try {
                    const areasResponse = await fetch('/api/areas');
                    if (areasResponse.ok) {
                        const areas = await areasResponse.json();
                        const selectedArea = areas.find(area => area.id == selectedAreaId);
                        if (selectedArea) {
                            selectedAreaName = selectedArea.nome;
                        }
                    }
                } catch (error) {
                    console.error('Erro ao buscar nome da área:', error);
                }
            }

            const updatedData = {
                nome: document.getElementById('userName').value,
                departamento: selectedAreaName, // Usar o nome da área
                cargo_atual: document.getElementById('userPosition').value,
                foto_perfil: this.fotoPerfil
            };

            // Validar dados
            if (!updatedData.nome.trim()) {
                throw new Error('Nome é obrigatório');
            }

            console.log('💾 [PERFIL] Salvando dados:', updatedData);

            // Atualizar perfil completo (incluindo nome_exibicao, departamento, cargo, foto)
            const response = await fetch(`/api/users/profile/${encodeURIComponent(this.loginUserName)}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    nome_exibicao: updatedData.nome,
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