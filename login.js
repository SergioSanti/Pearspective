document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("loginForm");

  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    const usuario = document.getElementById("usuario").value.trim();
    const senha = document.getElementById("senha").value.trim();

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include', // Incluir cookies
        body: JSON.stringify({ usuario, senha })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('[LOGIN] Resposta do servidor:', data);

      if (data.success && data.id) {
        console.log('[LOGIN] Login bem-sucedido:', data.nome);
        console.log('[LOGIN] Session token:', data.sessionToken ? 'Presente' : 'Não presente');
        
        // Redireciona após login bem-sucedido
        window.location.href = '/index.html';
      } else {
        alert(data.message || 'Credenciais inválidas');
      }
    } catch (error) {
      console.error('[LOGIN] Erro:', error);
      alert('Erro ao conectar com o servidor.');
    }
  });
});