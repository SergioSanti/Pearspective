document.addEventListener('DOMContentLoaded', () => {
  const areaSelect = document.getElementById('area');
  const cargoSelect = document.getElementById('cargo');
  const resultadoDiv = document.getElementById('resultado');
  const infoCargo = document.getElementById('infoCargo');

  // Carregar áreas do backend
  function carregarAreas() {
    fetch('/api/areas')
      .then(res => {
        if (!res.ok) throw new Error('Erro ao buscar áreas');
        return res.json();
      })
      .then(areas => {
        areaSelect.innerHTML = '<option value="">-- Escolha uma área --</option>';
        areas.forEach(area => {
          const option = document.createElement('option');
          option.value = area.id;
          option.textContent = area.nome;
          areaSelect.appendChild(option);
        });
        cargoSelect.innerHTML = '<option value="">Escolha uma área primeiro</option>';
        cargoSelect.disabled = true;
      })
      .catch(() => {
        areaSelect.innerHTML = '<option value="">Erro ao carregar áreas</option>';
        cargoSelect.innerHTML = '<option value="">Escolha uma área primeiro</option>';
        cargoSelect.disabled = true;
      });
  }

  // Carregar cargos para área selecionada
  function carregarCargos(areaId) {
    if (!areaId) {
      cargoSelect.innerHTML = '<option value="">Escolha uma área primeiro</option>';
      cargoSelect.disabled = true;
      resultadoDiv.style.display = 'none';
      return;
    }

    fetch(`/api/cargos?area_id=${areaId}`)
      .then(res => {
        if (!res.ok) throw new Error('Erro ao buscar cargos');
        return res.json();
      })
      .then(cargos => {
        if (cargos.length === 0) {
          cargoSelect.innerHTML = '<option value="">Nenhum cargo encontrado</option>';
          cargoSelect.disabled = true;
          resultadoDiv.style.display = 'none';
          return;
        }
        cargoSelect.innerHTML = '<option value="">-- Escolha um cargo --</option>';
        cargos.forEach(cargo => {
          const option = document.createElement('option');
          option.value = cargo.id;
          option.textContent = cargo.nome_cargo;
          cargoSelect.appendChild(option);
        });
        cargoSelect.disabled = false;
        resultadoDiv.style.display = 'none';
      })
      .catch(() => {
        cargoSelect.innerHTML = '<option value="">Erro ao carregar cargos</option>';
        cargoSelect.disabled = true;
        resultadoDiv.style.display = 'none';
      });
  }

  // Evento quando muda área
  areaSelect.addEventListener('change', () => {
    carregarCargos(areaSelect.value);
  });

  // Evento quando muda cargo — mostrar dados completos do cargo
  cargoSelect.addEventListener('change', () => {
    const cargoId = cargoSelect.value;
    console.log('[FRONT] Cargo selecionado:', cargoId);

    if (!cargoId) {
      resultadoDiv.style.display = 'none';
      infoCargo.innerHTML = '';
      return;
    }

    fetch(`/api/cargos/${cargoId}`)
      .then(res => {
        if (res.status === 404) throw new Error('Cargo não encontrado');
        if (!res.ok) throw new Error('Erro ao buscar dados do cargo');
        return res.json();
      })
      .then(cargo => {
        infoCargo.innerHTML = `
          <li><strong>Cargo:</strong> ${cargo.nome_cargo}</li>
          <li><strong>Experiência:</strong> ${cargo.requisitos.experiencia}</li>
          <li><strong>Formação:</strong> ${cargo.requisitos.formacao}</li>
          <li><strong>Idiomas:</strong> ${cargo.requisitos.idiomas}</li>
          <li><strong>Habilidades Técnicas:</strong> ${cargo.requisitos.habilidades}</li>
          <li><strong>Soft Skills:</strong> ${cargo.requisitos.soft_skills}</li>
        `;
        resultadoDiv.style.display = 'block';
      })
      .catch(err => {
        infoCargo.innerHTML = `<li>${err.message}</li>`;
        resultadoDiv.style.display = 'block';
        console.error(err);
      });
  });

  // Carrega as áreas ao abrir a página
  carregarAreas();
});
