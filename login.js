document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("loginForm");

  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    const usuario = document.getElementById("usuario").value.trim();
    const senha = document.getElementById("senha").value.trim();

    try {
      const response = await fetch('http://localhost:3000/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ usuario, senha })
      });

      const data = await response.json();

      if (data.success) {
        alert(`Bem-vindo, ${usuario}! Tipo: ${data.tipo_usuario}`);
        // Aqui você pode redirecionar conforme tipo de usuário:
        if (data.tipo_usuario === 'admin') {
          window.location.href = 'Page_inicial/index.html';  // exemplo
        } else {
          window.location.href = 'comum.html';  // exemplo
        }
      } else {
        alert(data.message);
      }
    } catch (error) {
      alert('Erro ao conectar com o servidor.');
      console.error(error);
    }
  });
});
