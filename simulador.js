let dadosCargos = {};

document.addEventListener('DOMContentLoaded', () => {
  const areaSelect = document.getElementById('area');
  const cargoSelect = document.getElementById('cargo');
  const resultadoDiv = document.getElementById('resultado');
  const infoCargo = document.getElementById('infoCargo');

  // Função genérica para buscar dados da API
  async function fetchFromAPI(url) {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Erro na API: ${response.statusText}`);
    }
    return response.json();
  }

  // Função para mostrar mensagem de sucesso
  function showSuccessMessage(message) {
    // Remove mensagens anteriores
    const existingMessage = document.querySelector('.message-popup');
    if (existingMessage) {
      existingMessage.remove();
    }

    // Cria nova mensagem
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message-popup success';
    messageDiv.innerHTML = `
      <div class="message-content">
        <span class="message-icon">✅</span>
        <span class="message-text">${message}</span>
        <button class="message-close" onclick="this.parentElement.parentElement.remove()">×</button>
      </div>
    `;
    
    document.body.appendChild(messageDiv);
    
    // Remove automaticamente após 5 segundos
    setTimeout(() => {
      if (messageDiv.parentElement) {
        messageDiv.remove();
      }
    }, 5000);
  }

  // Função para mostrar mensagem de erro
  function showErrorMessage(message) {
    // Remove mensagens anteriores
    const existingMessage = document.querySelector('.message-popup');
    if (existingMessage) {
      existingMessage.remove();
    }

    // Cria nova mensagem
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message-popup error';
    messageDiv.innerHTML = `
      <div class="message-content">
        <span class="message-icon">❌</span>
        <span class="message-text">${message}</span>
        <button class="message-close" onclick="this.parentElement.parentElement.remove()">×</button>
      </div>
    `;
    
    document.body.appendChild(messageDiv);
    
    // Remove automaticamente após 5 segundos
    setTimeout(() => {
      if (messageDiv.parentElement) {
        messageDiv.remove();
      }
    }, 5000);
  }

  // Carregar áreas do backend
  async function carregarAreas() {
    try {
      const areas = await fetchFromAPI('/api/areas');
      areaSelect.innerHTML = '<option value="">-- Escolha uma área --</option>';
      areas.forEach(area => {
        const option = document.createElement('option');
        option.value = area.id;
        option.textContent = area.nome;
        areaSelect.appendChild(option);
      });
    } catch (error) {
      console.error('Erro ao carregar áreas:', error);
      areaSelect.innerHTML = '<option value="">Erro ao carregar áreas</option>';
    } finally {
        cargoSelect.innerHTML = '<option value="">Escolha uma área primeiro</option>';
        cargoSelect.disabled = true;
    }
  }

  // Carregar cargos para área selecionada
  async function carregarCargos(areaId) {
    if (!areaId) {
      cargoSelect.innerHTML = '<option value="">Escolha uma área primeiro</option>';
      cargoSelect.disabled = true;
      resultadoDiv.style.display = 'none';
      return;
    }

    try {
        console.log(`🔍 Carregando cargos da área ${areaId}...`);
        const cargos = await fetchFromAPI(`/api/cargos/area/${areaId}`);
        console.log(`✅ Encontrados ${cargos.length} cargos para área ${areaId}`);
        
        if (cargos.length === 0) {
            cargoSelect.innerHTML = '<option value="">Nenhum cargo encontrado para esta área</option>';
            cargoSelect.disabled = true;
        } else {
            cargoSelect.innerHTML = '<option value="">-- Escolha um cargo --</option>';
            cargos.forEach(cargo => {
                const option = document.createElement('option');
                option.value = cargo.id;
                option.textContent = cargo.nome_cargo;
                cargoSelect.appendChild(option);
            });
            cargoSelect.disabled = false;
        }
    } catch(error) {
        console.error('Erro ao carregar cargos:', error);
        cargoSelect.innerHTML = '<option value="">Erro ao carregar cargos</option>';
        cargoSelect.disabled = true;
    } finally {
        resultadoDiv.style.display = 'none';
    }
  }

  // Evento quando muda área
  areaSelect.addEventListener('change', () => {
    carregarCargos(areaSelect.value);
  });

  // Evento quando muda cargo — mostrar dados completos do cargo
  cargoSelect.addEventListener('change', async () => {
    const cargoId = cargoSelect.value;
    if (!cargoId) {
      resultadoDiv.style.display = 'none';
      infoCargo.innerHTML = '';
      return;
    }

    try {
        const cargo = await fetchFromAPI(`/api/cargos/${cargoId}`);
        
        // O campo 'requisitos' já é um objeto retornado pela API, não precisa de parse.
        const requisitosObj = cargo.requisitos || {};
        
        infoCargo.innerHTML = `
          <li><strong>Vagas Disponíveis:</strong> ${cargo.quantidade_vagas || 1} vaga(s)</li>
          <li><strong>Experiência:</strong> ${requisitosObj.experiencia || 'Não informado'}</li>
          <li><strong>Formação:</strong> ${requisitosObj.formacao || 'Não informado'}</li>
          <li><strong>Idiomas:</strong> ${requisitosObj.idiomas || 'Não informado'}</li>
          <li><strong>Habilidades Técnicas:</strong> ${requisitosObj.habilidades || 'Não informado'}</li>
          <li><strong>Soft Skills:</strong> ${requisitosObj.soft_skills || 'Não informado'}</li>
        `;
        resultadoDiv.style.display = 'block';
    } catch(error) {
        console.error('Erro ao buscar dados do cargo:', error);
        infoCargo.innerHTML = `<li>Erro ao carregar informações.</li>`;
        resultadoDiv.style.display = 'block';
    }
  });

  // Carrega as áreas ao iniciar
  carregarAreas();

  // ===== LÓGICA DE ADMINISTRAÇÃO =====

  async function setupAdminFeatures() {
    try {
      // Verificar sessão atual
      const response = await fetch('/api/me', {
        credentials: 'include'
      });
      
      if (!response.ok) {
        console.log('[SIMULADOR] Usuário não autenticado');
        return;
      }
      
      const sessionData = await response.json();
      if (!sessionData.authenticated || sessionData.user.tipo_usuario !== 'admin') {
        console.log('[SIMULADOR] Usuário não é admin');
        return; // Se não for admin, não faz nada
      }
      
      console.log('[SIMULADOR] Configurando recursos de admin para:', sessionData.user.nome);

    const adminContainer = document.getElementById('admin-container');
    adminContainer.style.display = 'block';

    // Elementos do DOM para modais
    const areasModal = document.getElementById('areas-modal');
    const cargosModal = document.getElementById('cargos-modal');
    const manageAreasBtn = document.getElementById('manage-areas-btn');
    const manageCargosBtn = document.getElementById('manage-cargos-btn');
    const closeBtns = document.querySelectorAll('.modal .close-btn');

    // Formulários e listas
    const areaForm = document.getElementById('area-form');
    const areaIdInput = document.getElementById('area-id');
    const areaNameInput = document.getElementById('area-name');
    const areasList = document.getElementById('areas-list');
    const cancelAreaEditBtn = document.getElementById('cancel-area-edit');

    const cargoForm = document.getElementById('cargo-form');
    const cargoIdInput = document.getElementById('cargo-id');
    const cargoAreaSelect = document.getElementById('cargo-area-select');
    const cargoNameInput = document.getElementById('cargo-name');
    const cargoVagasInput = document.getElementById('cargo-vagas');
    const cargoRequisitosInput = document.getElementById('cargo-requisitos');
    const cargosList = document.getElementById('cargos-list');
    const cancelCargoEditBtn = document.getElementById('cancel-cargo-edit');
    
    // Abrir modais
    manageAreasBtn.addEventListener('click', () => {
      areasModal.style.display = 'block';
      loadAreasIntoModal();
    });

    manageCargosBtn.addEventListener('click', () => {
      cargosModal.style.display = 'block';
      loadAreasIntoCargoModal();
    });

    // Fechar modais
    closeBtns.forEach(btn => btn.addEventListener('click', () => {
      areasModal.style.display = 'none';
      cargosModal.style.display = 'none';
    }));
    window.addEventListener('click', (event) => {
        if (event.target === areasModal) areasModal.style.display = 'none';
        if (event.target === cargosModal) cargosModal.style.display = 'none';
    });
    
    // --- Gerenciamento de Áreas ---

    async function loadAreasIntoModal() {
      const areas = await fetchFromAPI('/api/areas');
      areasList.innerHTML = '';
      areas.forEach(area => {
        const li = document.createElement('li');
        li.innerHTML = `
          <span>${area.nome}</span>
          <div class="item-actions">
            <button class="btn btn-sm btn-secondary edit-area" data-id="${area.id}" data-name="${area.nome}">✏️</button>
            <button class="btn btn-sm btn-danger delete-area" data-id="${area.id}">🗑️</button>
          </div>
        `;
        areasList.appendChild(li);
      });
    }

    areaForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = areaIdInput.value;
      const nome = areaNameInput.value;
      const method = id ? 'PUT' : 'POST';
      const url = id ? `/api/areas/${id}` : '/api/areas';

      try {
        console.log('🏢 Enviando área:', { id, nome, method, url });
        const response = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nome })
        });

        if (response.ok) {
          const message = id ? 'Área atualizada com sucesso!' : 'Área criada com sucesso!';
          showSuccessMessage(message);
          console.log('✅ Área salva com sucesso');
        } else {
          const errorData = await response.json();
          showErrorMessage(`Erro ao salvar área: ${errorData.error || 'Tente novamente.'}`);
          console.error('❌ Erro ao salvar área:', errorData);
        }
      } catch (error) {
        showErrorMessage('Erro ao conectar com o servidor.');
        console.error('❌ Erro de conexão:', error);
      }

      areaForm.reset();
      areaIdInput.value = '';
      loadAreasIntoModal();
      carregarAreas(); // Recarrega o select principal
    });

    areasList.addEventListener('click', async (e) => {
      if (e.target.classList.contains('edit-area')) {
        areaIdInput.value = e.target.dataset.id;
        areaNameInput.value = e.target.dataset.name;
      }
      if (e.target.classList.contains('delete-area')) {
        if (confirm('Tem certeza? Deletar uma área também deletará todos os cargos associados.')) {
          const id = e.target.dataset.id;
          console.log(`🗑️ Tentando deletar área ${id}...`);
          
          try {
            console.log(`📡 Enviando requisição DELETE para /api/areas/${id}`);
            const response = await fetch(`/api/areas/${id}`, { method: 'DELETE' });
            console.log(`📡 Resposta recebida:`, response.status, response.statusText);
            
            if (response.ok) {
              const result = await response.json();
              console.log('✅ Área deletada com sucesso:', result);
              showSuccessMessage('Área deletada com sucesso!');
            } else {
              const errorData = await response.json();
              console.error('❌ Erro ao deletar área:', errorData);
              showErrorMessage(`Erro ao deletar área: ${errorData.error || 'Tente novamente.'}`);
            }
          } catch (error) {
            console.error('❌ Erro de conexão ao deletar área:', error);
            showErrorMessage('Erro ao conectar com o servidor.');
          }
          
          console.log('🔄 Recarregando lista de áreas...');
          loadAreasIntoModal();
          carregarAreas(); // Recarrega o select principal
        }
      }
    });

    cancelAreaEditBtn.addEventListener('click', () => {
        areaForm.reset();
        areaIdInput.value = '';
    });

    // --- Gerenciamento de Cargos ---
    
    async function loadAreasIntoCargoModal() {
        const areas = await fetchFromAPI('/api/areas');
        cargoAreaSelect.innerHTML = '<option value="">Selecione uma área</option>';
        areas.forEach(area => {
            const option = document.createElement('option');
            option.value = area.id;
            option.textContent = area.nome;
            cargoAreaSelect.appendChild(option);
        });
        // Limpa a lista de cargos sem mostrar mensagem duplicada
        cargosList.innerHTML = '';
    }

    cargoAreaSelect.addEventListener('change', async () => {
        const areaId = cargoAreaSelect.value;
        if (!areaId) {
            cargosList.innerHTML = '<p>Selecione uma área para ver os cargos.</p>';
            return;
        }
        const cargos = await fetchFromAPI('/api/cargos');
        cargosList.innerHTML = '';
        cargos.forEach(cargo => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span>${cargo.nome_cargo} (${cargo.quantidade_vagas || 1} vaga${cargo.quantidade_vagas > 1 ? 's' : ''})</span>
                <div class="item-actions">
                    <button class="btn btn-sm btn-secondary edit-cargo" data-id="${cargo.id}">✏️</button>
                    <button class="btn btn-sm btn-danger delete-cargo" data-id="${cargo.id}">🗑️</button>
                </div>
            `;
            cargosList.appendChild(li);
        });
    });
    
    cargoForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Validar campos obrigatórios
        const areaId = cargoAreaSelect.value;
        const nomeCargo = cargoNameInput.value.trim();
        
        if (!areaId) {
            showErrorMessage('Selecione uma área para o cargo.');
            return;
        }
        
        if (!nomeCargo) {
            showErrorMessage('Digite o nome do cargo.');
            return;
        }
        
        const id = cargoIdInput.value;
        const requisitos = {
            experiencia: document.getElementById('req-experiencia').value,
            formacao: document.getElementById('req-formacao').value,
            idiomas: document.getElementById('req-idiomas').value,
            habilidades: document.getElementById('req-habilidades').value,
            soft_skills: document.getElementById('req-softskills').value,
        };

        const body = {
            area_id: parseInt(areaId),
            nome_cargo: nomeCargo,
            quantidade_vagas: parseInt(cargoVagasInput.value) || 1,
            requisitos: requisitos
        };

        const method = id ? 'PUT' : 'POST';
        const url = id ? `/api/cargos/${id}` : '/api/cargos';
        
        console.log('📋 Enviando cargo:', { id, body, method, url });
        
        try {
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (response.ok) {
                const message = id ? 'Cargo atualizado com sucesso!' : 'Cargo criado com sucesso!';
                showSuccessMessage(message);
                console.log('✅ Cargo salvo com sucesso');
                
                // Só resetar o formulário após sucesso
                cargoForm.reset();
                cargoIdInput.value = '';
                cargoAreaSelect.dispatchEvent(new Event('change'));
            } else {
                const errorData = await response.json();
                showErrorMessage(`Erro ao salvar cargo: ${errorData.error || 'Tente novamente.'}`);
                console.error('❌ Erro ao salvar cargo:', errorData);
            }
        } catch (error) {
            showErrorMessage('Erro ao conectar com o servidor.');
            console.error('❌ Erro de conexão:', error);
        }
    });

    cargosList.addEventListener('click', async (e) => {
        const target = e.target.closest('.edit-cargo'); // Procura o botão de editar
        if (target) {
            const cargo = await fetchFromAPI(`/api/cargos/${target.dataset.id}`);
            const requisitos = cargo.requisitos || {};
            
            cargoIdInput.value = cargo.id;
            cargoAreaSelect.value = cargo.area_id;
            cargoNameInput.value = cargo.nome_cargo;
            cargoVagasInput.value = cargo.quantidade_vagas || 1;
            
            document.getElementById('req-experiencia').value = requisitos.experiencia || '';
            document.getElementById('req-formacao').value = requisitos.formacao || '';
            document.getElementById('req-idiomas').value = requisitos.idiomas || '';
            document.getElementById('req-habilidades').value = requisitos.habilidades || '';
            document.getElementById('req-softskills').value = requisitos.soft_skills || '';
        }

        const deleteTarget = e.target.closest('.delete-cargo'); // Procura o botão de deletar
        if (deleteTarget) {
            if (confirm('Tem certeza que deseja deletar este cargo?')) {
                try {
                    const response = await fetch(`/api/cargos/${deleteTarget.dataset.id}`, { method: 'DELETE' });
                    if (response.ok) {
                        showSuccessMessage('Cargo deletado com sucesso!');
                    } else {
                        showErrorMessage('Erro ao deletar cargo.');
                    }
                } catch (error) {
                    showErrorMessage('Erro ao conectar com o servidor.');
                }
                cargoAreaSelect.dispatchEvent(new Event('change'));
            }
        }
    });
    
    cancelCargoEditBtn.addEventListener('click', () => {
        cargoForm.reset();
        cargoIdInput.value = '';
    });
    } catch (error) {
      console.error('[SIMULADOR] Erro ao configurar recursos de admin:', error);
    }
  }

  // Inicia as funcionalidades de admin
  setupAdminFeatures();
});

function formatarSalario(valor) {
  return `R$ ${valor.toLocaleString('pt-BR')}`;
}
