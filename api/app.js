const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');

const app = express();

// Middleware básico
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Configuração do multer para upload de arquivos
const storage = multer.memoryStorage();

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB
    }
});

const uploadPhoto = multer({ 
    storage: storage,
    limits: {
        fileSize: 2 * 1024 * 1024 // 2MB
    }
});

// Dados simulados do banco (temporário até conectar com Supabase)
const usuarios = [
    { id: 1, nome: 'admin', email: 'admin@pearspective.com', senha: 'Admin123', tipo_usuario: 'admin', foto_perfil: null },
    { id: 2, nome: 'sergio', email: 'sergio@pearspective.com', senha: '12345', tipo_usuario: 'usuario', foto_perfil: null }
];

const areas = [
    { id: 1, nome: 'Tecnologia' },
    { id: 2, nome: 'Marketing' },
    { id: 3, nome: 'Vendas' },
    { id: 4, nome: 'Recursos Humanos' },
    { id: 5, nome: 'Financeiro' }
];

const cargos = [
    { id: 1, nome_cargo: 'Desenvolvedor Frontend', area_id: 1 },
    { id: 2, nome_cargo: 'Desenvolvedor Backend', area_id: 1 },
    { id: 3, nome_cargo: 'Analista de Marketing', area_id: 2 },
    { id: 4, nome_cargo: 'Vendedor', area_id: 3 },
    { id: 5, nome_cargo: 'Recrutador', area_id: 4 }
];

const cursos = [
    { id: 1, title: 'JavaScript Avançado', platform: 'Udemy', url: 'https://udemy.com', area: 'Tecnologia', level: 'Avançado', duration: '20h' },
    { id: 2, title: 'React para Iniciantes', platform: 'Coursera', url: 'https://coursera.org', area: 'Tecnologia', level: 'Iniciante', duration: '15h' },
    { id: 3, title: 'Marketing Digital', platform: 'LinkedIn Learning', url: 'https://linkedin.com', area: 'Marketing', level: 'Intermediário', duration: '12h' }
];

// Rota de teste
app.get('/api/test', (req, res) => {
    res.json({ message: 'API Pearspective funcionando!' });
});

// Login
app.post('/api/login', async (req, res) => {
    try {
        const { usuario, senha } = req.body;
        
        console.log('🔐 Tentativa de login:', { usuario, senha });
        
        const user = usuarios.find(u => u.nome === usuario && u.senha === senha);
        
        if (user) {
            res.json({ 
                success: true, 
                message: 'Login válido', 
                tipo_usuario: user.tipo_usuario, 
                id: user.id, 
                nome: user.nome,
                foto_perfil: user.foto_perfil
            });
        } else {
            res.status(401).json({ success: false, message: 'Usuário ou senha incorretos.' });
        }
    } catch (error) {
        console.error('❌ Erro no login:', error);
        res.status(500).json({ success: false, message: 'Erro interno no servidor' });
    }
});

// Listar áreas
app.get('/api/areas', async (req, res) => {
    try {
        res.json(areas);
    } catch (error) {
        console.error('Erro ao buscar áreas:', error);
        res.status(500).json({ erro: 'Erro ao buscar áreas' });
    }
});

// Listar cargos
app.get('/api/cargos', async (req, res) => {
    try {
        const area_id = req.query.area_id;
        let result = cargos;
        
        if (area_id) {
            result = cargos.filter(c => c.area_id == area_id);
        }
        
        res.json(result);
    } catch (error) {
        console.error('Erro ao buscar cargos:', error);
        res.status(500).json({ error: 'Erro ao buscar cargos' });
    }
});

// Listar cursos
app.get('/api/cursos', async (req, res) => {
    try {
        res.json(cursos);
    } catch (error) {
        console.error('Erro ao buscar cursos:', error);
        res.status(500).json({ error: 'Erro ao buscar cursos' });
    }
});

// Upload de foto de perfil
app.post('/api/upload-foto', uploadPhoto.single('foto'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Nenhum arquivo enviado' });
        }

        const userId = req.body.userId;
        const fotoBase64 = req.file.buffer.toString('base64');
        const fotoDataUrl = `data:${req.file.mimetype};base64,${fotoBase64}`;

        // Atualizar usuário (simulado)
        const user = usuarios.find(u => u.id == userId);
        if (user) {
            user.foto_perfil = fotoDataUrl;
        }

        res.json({ 
            success: true, 
            message: 'Foto atualizada com sucesso',
            foto_perfil: fotoDataUrl
        });
    } catch (error) {
        console.error('Erro no upload de foto:', error);
        res.status(500).json({ error: 'Erro no upload de foto' });
    }
});

// Upload de currículo
app.post('/api/upload-curriculo', upload.single('curriculo'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Nenhum arquivo enviado' });
        }

        const userId = req.body.userId;
        const curriculoBase64 = req.file.buffer.toString('base64');
        const curriculoDataUrl = `data:${req.file.mimetype};base64,${curriculoBase64}`;

        res.json({ 
            success: true, 
            message: 'Currículo enviado com sucesso',
            curriculo: curriculoDataUrl,
            nome_arquivo: req.file.originalname
        });
    } catch (error) {
        console.error('Erro no upload de currículo:', error);
        res.status(500).json({ error: 'Erro no upload de currículo' });
    }
});

// Upload de certificado
app.post('/api/upload-certificado', upload.single('certificado'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Nenhum arquivo enviado' });
        }

        const userId = req.body.userId;
        const nome = req.body.nome;
        const instituicao = req.body.instituicao;
        const data_emissao = req.body.data_emissao;
        
        const certificadoBase64 = req.file.buffer.toString('base64');
        const certificadoDataUrl = `data:${req.file.mimetype};base64,${certificadoBase64}`;

        res.json({ 
            success: true, 
            message: 'Certificado enviado com sucesso',
            certificado: {
                id: Date.now(),
                usuario_id: userId,
                nome: nome,
                instituicao: instituicao,
                data_emissao: data_emissao,
                arquivo_pdf: certificadoDataUrl
            }
        });
    } catch (error) {
        console.error('Erro no upload de certificado:', error);
        res.status(500).json({ error: 'Erro no upload de certificado' });
    }
});

// Buscar usuário por ID
app.get('/api/usuarios/:id', async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        const user = usuarios.find(u => u.id === userId);
        
        if (user) {
            res.json(user);
        } else {
            res.status(404).json({ error: 'Usuário não encontrado' });
        }
    } catch (error) {
        console.error('Erro ao buscar usuário:', error);
        res.status(500).json({ error: 'Erro interno no servidor' });
    }
});

// Atualizar perfil do usuário
app.put('/api/usuarios/:id', async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        const { nome, email, departamento, cargo_atual } = req.body;
        
        const user = usuarios.find(u => u.id === userId);
        if (user) {
            user.nome = nome || user.nome;
            user.email = email || user.email;
            user.departamento = departamento || user.departamento;
            user.cargo_atual = cargo_atual || user.cargo_atual;
            
            res.json(user);
        } else {
            res.status(404).json({ error: 'Usuário não encontrado' });
        }
    } catch (error) {
        console.error('Erro ao atualizar usuário:', error);
        res.status(500).json({ error: 'Erro interno no servidor' });
    }
});

// Tratamento de erro global
app.use((err, req, res, next) => {
    console.error('❌ Erro:', err);
    res.status(500).json({ 
        error: 'Erro interno do servidor',
        message: err.message 
    });
});

module.exports = app; 