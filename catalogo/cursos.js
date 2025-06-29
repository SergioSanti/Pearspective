// ===== SISTEMA DE RECOMENDAÇÕES DE CURSOS - PEARSPECTIVE (API-Driven) =====

class CourseManager {
  constructor() {
    this.courses = [];
    this.currentEditId = null;
    this.isAdminMode = false;
    
    this.apiBaseUrl = 'http://localhost:3000/api';

    this.initializeElements();
    this.bindEvents();
    this.loadCourses(); // Carregar cursos da API na inicialização
  }

  // Inicializar elementos do DOM
  initializeElements() {
    this.searchInput = document.getElementById('search-input');
    this.areaSelect = document.getElementById('area-select');
    this.levelSelect = document.getElementById('level-select');
    this.durationSelect = document.getElementById('duration-select');
    this.coursesGrid = document.getElementById('courses-grid');
    this.adminToggle = document.getElementById('admin-toggle');
    this.adminPanel = document.getElementById('admin-panel');
    this.addCourseBtn = document.getElementById('add-course-btn');
    this.courseForm = document.getElementById('course-form');
    this.courseFormElement = document.getElementById('course-form-element');
    this.formTitle = document.getElementById('form-title');
    this.deleteModal = document.getElementById('delete-modal');
    this.confirmDeleteBtn = document.getElementById('confirm-delete');
  }

  // Vincular eventos
  bindEvents() {
    this.searchInput.addEventListener('input', this.debounce(() => this.filterCourses(), 300));
    this.areaSelect.addEventListener('change', () => this.filterCourses());
    this.levelSelect.addEventListener('change', () => this.filterCourses());
    this.durationSelect.addEventListener('change', () => this.filterCourses());

    this.adminToggle.addEventListener('click', () => this.toggleAdminMode());
    this.addCourseBtn.addEventListener('click', () => this.showAddForm());
    this.courseFormElement.addEventListener('submit', (e) => this.handleFormSubmit(e));
    document.getElementById('cancel-form').addEventListener('click', () => this.hideForm());

    this.confirmDeleteBtn.addEventListener('click', () => this.handleDelete());
    document.addEventListener('click', (e) => {
      if (e.target.closest('.edit-course')) {
        this.showEditForm(parseInt(e.target.closest('.edit-course').dataset.courseId));
      }
      if (e.target.closest('.delete-course')) {
        this.showDeleteModal(parseInt(e.target.closest('.delete-course').dataset.courseId));
      }
    });

    window.addEventListener('click', (e) => {
      if (e.target === this.deleteModal) this.closeModal();
    });
  }

  // --- Funções de API ---
  async loadCourses() {
    try {
      const response = await fetch(`${this.apiBaseUrl}/cursos`);
      if (!response.ok) throw new Error('Erro ao buscar cursos da API.');
      
      this.courses = await response.json();
      // Renomear 'is_new' para 'new' para compatibilidade com o frontend
      this.courses.forEach(c => c.new = c.is_new);

      this.renderCourses();
      this.updateResultsCount();
    } catch (error) {
      console.error(error);
      this.showNotification('Falha ao carregar cursos. Verifique o console.', 'danger');
    }
  }

  async addCourse(courseData) {
    try {
      const response = await fetch(`${this.apiBaseUrl}/cursos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(courseData),
      });
      if (!response.ok) throw new Error('Falha ao adicionar curso.');
      
      this.showNotification('Curso adicionado com sucesso!', 'success');
      this.loadCourses(); // Recarregar tudo
    } catch (error) {
      console.error(error);
      this.showNotification(error.message, 'danger');
    }
  }

  async updateCourse(courseId, courseData) {
    try {
      const response = await fetch(`${this.apiBaseUrl}/cursos/${courseId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(courseData),
      });
      if (!response.ok) throw new Error('Falha ao atualizar curso.');

      this.showNotification('Curso atualizado com sucesso!', 'success');
      this.loadCourses(); // Recarregar tudo
    } catch (error) {
      console.error(error);
      this.showNotification(error.message, 'danger');
    }
  }

  async deleteCourse(courseId) {
    try {
      const response = await fetch(`${this.apiBaseUrl}/cursos/${courseId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Falha ao excluir curso.');

      this.showNotification('Curso excluído com sucesso!', 'success');
      this.loadCourses(); // Recarregar tudo
    } catch (error) {
      console.error(error);
      this.showNotification(error.message, 'danger');
    }
  }

  // --- Funções de UI e Lógica ---
  toggleAdminMode() {
    this.isAdminMode = !this.isAdminMode;
    this.adminPanel.style.display = this.isAdminMode ? 'block' : 'none';
    this.adminToggle.textContent = this.isAdminMode ? '👤 Usuário' : '🔧 Admin';
    this.renderCourses();
  }

  showAddForm() {
    this.currentEditId = null;
    this.formTitle.textContent = 'Adicionar Novo Curso';
    this.courseFormElement.reset();
    this.courseForm.style.display = 'block';
    this.scrollToForm();
  }
  
  showEditForm(courseId) {
    const course = this.courses.find(c => c.id === courseId);
    if (!course) return;

    this.currentEditId = courseId;
    this.formTitle.textContent = 'Editar Curso';
    
    document.getElementById('course-title').value = course.title;
    document.getElementById('course-platform').value = course.platform;
    document.getElementById('course-url').value = course.url;
    document.getElementById('course-area').value = course.area;
    document.getElementById('course-level').value = course.level;
    document.getElementById('course-duration').value = course.duration;
    document.getElementById('course-badge').value = course.badge;
    document.getElementById('course-badge-color').value = course.badgeColor;
    document.getElementById('course-description').value = course.description;
    document.getElementById('course-featured').checked = course.featured || false;
    document.getElementById('course-new').checked = course.new || false;

    this.courseForm.style.display = 'block';
    this.scrollToForm();
  }

  hideForm() {
    this.courseForm.style.display = 'none';
    this.currentEditId = null;
  }

  scrollToForm() {
    this.courseForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  handleFormSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(this.courseFormElement);
    const courseData = {
      title: formData.get('title'),
      platform: formData.get('platform'),
      url: formData.get('url'),
      area: formData.get('area'),
      level: formData.get('level'),
      duration: formData.get('duration'),
      badge: formData.get('badge'),
      badgeColor: formData.get('badgeColor'),
      description: formData.get('description'),
      featured: formData.get('featured') === 'on',
      "new": formData.get('new') === 'on'
    };

    if (this.currentEditId) {
      this.updateCourse(this.currentEditId, courseData);
    } else {
      this.addCourse(courseData);
    }

    this.hideForm();
  }

  showDeleteModal(courseId) {
    const course = this.courses.find(c => c.id === courseId);
    if (!course) return;

    document.getElementById('delete-course-title').textContent = course.title;
    this.confirmDeleteBtn.dataset.courseId = courseId;
    this.deleteModal.style.display = 'flex';
  }

  closeModal() {
    this.deleteModal.style.display = 'none';
  }

  handleDelete() {
    const courseId = parseInt(this.confirmDeleteBtn.dataset.courseId);
    this.deleteCourse(courseId);
    this.closeModal();
  }

  filterCourses() {
    const searchTerm = this.searchInput.value.toLowerCase().trim();
    const selectedArea = this.areaSelect.value;
    const selectedLevel = this.levelSelect.value;
    const selectedDuration = this.durationSelect.value;

    const filtered = this.courses.filter(course => {
      const matchesSearch = !searchTerm || 
        (course.title && course.title.toLowerCase().includes(searchTerm)) ||
        (course.description && course.description.toLowerCase().includes(searchTerm)) ||
        (course.platform && course.platform.toLowerCase().includes(searchTerm)) ||
        (course.badge && course.badge.toLowerCase().includes(searchTerm));

      const matchesArea = !selectedArea || course.area === selectedArea;
      const matchesLevel = !selectedLevel || course.level === selectedLevel;
      const matchesDuration = !selectedDuration || course.duration === selectedDuration;

      return matchesSearch && matchesArea && matchesLevel && matchesDuration;
    });

    this.renderCourses(filtered);
    this.updateResultsCount(filtered.length);
  }

  renderCourses(coursesToRender = this.courses) {
    if (!coursesToRender || coursesToRender.length === 0) {
      this.coursesGrid.innerHTML = `
        <div class="no-results">
          <h3>Nenhum curso encontrado</h3>
          <p>Tente ajustar os filtros.</p>
        </div>`;
      return;
    }

    this.coursesGrid.innerHTML = coursesToRender.map(course => `
      <article class="course-card ${course.featured ? 'featured' : ''} ${course.new ? 'new' : ''}" data-course-id="${course.id}">
        ${this.isAdminMode ? `
          <div class="course-actions">
            <button class="btn btn-secondary edit-course" data-course-id="${course.id}" title="Editar">✏️</button>
            <button class="btn btn-danger delete-course" data-course-id="${course.id}" title="Excluir">🗑️</button>
          </div>
        ` : ''}
        <div class="course-header">
          <h3 class="course-title">${course.title}</h3>
          <span class="course-badge badge badge-${course.badgeColor}">${course.badge}</span>
        </div>
        <div class="course-body">
          <p class="course-platform">Plataforma: ${course.platform}</p>
          <p class="course-description">${course.description || ''}</p>
          <div class="course-meta">
            <span class="course-level">Nível: ${this.getLevelText(course.level)}</span>
            <span class="course-duration">Duração: ${this.getDurationText(course.duration)}</span>
          </div>
        </div>
        <div class="course-footer">
          <a href="${course.url}" class="btn btn-primary" target="_blank" rel="noopener">
            Ver na ${course.platform}
          </a>
        </div>
      </article>
    `).join('');
  }

  updateResultsCount(count) {
    const totalCount = this.courses.length;
    let resultsInfo = document.querySelector('.results-info');
    if (!resultsInfo) {
      resultsInfo = document.createElement('div');
      resultsInfo.className = 'results-info';
      this.coursesGrid.parentNode.insertBefore(resultsInfo, this.coursesGrid);
    }
    resultsInfo.textContent = count < totalCount 
      ? `Mostrando ${count} de ${totalCount} cursos` 
      : `Mostrando todos os ${totalCount} cursos`;
  }

  // --- Funções Utilitárias ---
  getLevelText = (level) => ({ 'basico': 'Básico', 'intermediario': 'Intermediário', 'avancado': 'Avançado' }[level] || level);
  getDurationText = (duration) => ({ 'curto': 'Até 10h', 'medio': '10h a 30h', 'longo': 'Mais de 30h' }[duration] || duration);
  debounce = (func, wait) => {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  }

  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    const colors = { success: 'var(--success-500)', danger: 'var(--danger-500)', info: 'var(--primary-500)' };
    notification.style.cssText = `
      position: fixed; top: 20px; right: 20px; background: ${colors[type]}; color: white;
      padding: 1rem 1.5rem; border-radius: var(--border-radius-lg); box-shadow: var(--shadow-lg);
      z-index: 1000; animation: slideInRight 0.3s ease; max-width: 320px;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => {
      notification.style.animation = 'slideOutRight 0.3s ease forwards';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }
}

function closeModal() {
  document.getElementById('delete-modal').style.display = 'none';
}

document.addEventListener('DOMContentLoaded', () => {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideInRight { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
    @keyframes slideOutRight { from { transform: translateX(0); opacity: 1; } to { transform: translateX(100%); opacity: 0; } }
  `;
  document.head.appendChild(style);
  window.courseManager = new CourseManager();
});
