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
        const cargos = await fetchFromAPI(`/api/cargos?area_id=${areaId}`);
        if (cargos.length === 0) {
            cargoSelect.innerHTML = '<option value="">Nenhum cargo encontrado</option>';
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

  function setupAdminFeatures() {
    const userType = localStorage.getItem('tipo_usuario');
    if (userType !== 'admin') {
      return; // Se não for admin, não faz nada
    }

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

      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome })
      });

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
          await fetch(`/api/areas/${id}`, { method: 'DELETE' });
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
        cargosList.innerHTML = '<p>Selecione uma área para ver os cargos.</p>';
    }

    cargoAreaSelect.addEventListener('change', async () => {
        const areaId = cargoAreaSelect.value;
        if (!areaId) {
            cargosList.innerHTML = '<p>Selecione uma área para ver os cargos.</p>';
            return;
        }
        const cargos = await fetchFromAPI(`/api/cargos?area_id=${areaId}`);
        cargosList.innerHTML = '';
        cargos.forEach(cargo => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span>${cargo.nome_cargo}</span>
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
        const id = cargoIdInput.value;
        const requisitos = {
            experiencia: document.getElementById('req-experiencia').value,
            formacao: document.getElementById('req-formacao').value,
            idiomas: document.getElementById('req-idiomas').value,
            habilidades: document.getElementById('req-habilidades').value,
            soft_skills: document.getElementById('req-softskills').value,
        };

        const body = {
            area_id: cargoAreaSelect.value,
            nome_cargo: cargoNameInput.value,
            requisitos: requisitos, // Objeto montado a partir dos inputs
            complexidade: '', 
            responsabilidades: ''
        };

        const method = id ? 'PUT' : 'POST';
        const url = id ? `/api/cargos/${id}` : '/api/cargos';
        
        await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        cargoForm.reset();
        cargoIdInput.value = '';
        cargoAreaSelect.dispatchEvent(new Event('change'));
    });

    cargosList.addEventListener('click', async (e) => {
        const target = e.target.closest('.edit-cargo'); // Procura o botão de editar
        if (target) {
            const cargo = await fetchFromAPI(`/api/cargos/${target.dataset.id}`);
            const requisitos = cargo.requisitos || {};
            
            cargoIdInput.value = cargo.id;
            cargoAreaSelect.value = cargo.area_id;
            cargoNameInput.value = cargo.nome_cargo;
            
            document.getElementById('req-experiencia').value = requisitos.experiencia || '';
            document.getElementById('req-formacao').value = requisitos.formacao || '';
            document.getElementById('req-idiomas').value = requisitos.idiomas || '';
            document.getElementById('req-habilidades').value = requisitos.habilidades || '';
            document.getElementById('req-softskills').value = requisitos.soft_skills || '';
        }

        const deleteTarget = e.target.closest('.delete-cargo'); // Procura o botão de deletar
        if (deleteTarget) {
            if (confirm('Tem certeza que deseja deletar este cargo?')) {
                await fetch(`/api/cargos/${deleteTarget.dataset.id}`, { method: 'DELETE' });
                cargoAreaSelect.dispatchEvent(new Event('change'));
            }
        }
    });
    
    cancelCargoEditBtn.addEventListener('click', () => {
        cargoForm.reset();
        cargoIdInput.value = '';
    });
  }

  // Inicia as funcionalidades de admin
  setupAdminFeatures();
});

function formatarSalario(valor) {
  return `R$ ${valor.toLocaleString('pt-BR')}`;
}
