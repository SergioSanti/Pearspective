document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('search-form');
  const queryInput = document.getElementById('search-query');
  const resultsContainer = document.getElementById('results-container');

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const query = queryInput.value.trim();

    if (!query) {
      alert('Por favor, digite um termo para busca.');
      return;
    }

    resultsContainer.innerHTML = `<p>Buscando cursos para: <strong>${query}</strong>...</p>`;

    const linksHTML = `
      <h3>Resultados da busca</h3>
      <ul>
        <li><a href="https://www.ifal.edu.br/busca?search=${encodeURIComponent(query)}" target="_blank" style="color: #6B8E4E; font-weight: 600;">Instituto Federal</a></li>
        <li><a href="https://www.coursera.org/search?query=${encodeURIComponent(query)}" target="_blank" style="color: #6B8E4E; font-weight: 600;">Coursera</a></li>
        <li><a href="https://www.senai.br/ead?search=${encodeURIComponent(query)}" target="_blank" style="color: #6B8E4E; font-weight: 600;">Senai EAD</a></li>
        <li><a href="https://www.udemy.com/courses/search/?q=${encodeURIComponent(query)}" target="_blank" style="color: #6B8E4E; font-weight: 600;">Udemy</a></li>
        <li><a href="https://www.alura.com.br/busca?query=${encodeURIComponent(query)}" target="_blank" style="color: #6B8E4E; font-weight: 600;">Alura</a></li>
      </ul>
    `;

    resultsContainer.innerHTML = linksHTML;
  });
});
