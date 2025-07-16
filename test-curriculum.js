// ===== TESTE DE CURRÍCULO =====

class CurriculumTester {
    constructor() {
        this.userName = localStorage.getItem('userName');
        this.apiBase = '/api/users/curriculum';
    }

    async runAllTests() {
        console.log('🧪 Iniciando testes de currículo...');
        console.log('Usuário:', this.userName);

        if (!this.userName) {
            console.log('❌ Usuário não logado');
            return;
        }

        await this.testCurriculumStatus();
        await this.testCurriculumUpload();
        await this.testCurriculumDownload();
        await this.testCurriculumDelete();
    }

    async testCurriculumStatus() {
        console.log('\n📊 Testando status do currículo...');
        
        try {
            const response = await fetch(`${this.apiBase}/${encodeURIComponent(this.userName)}/status`);
            const data = await response.json();
            
            console.log('✅ Status:', data);
            return data.hasCurriculum;
        } catch (error) {
            console.error('❌ Erro ao verificar status:', error);
            return false;
        }
    }

    async testCurriculumUpload() {
        console.log('\n📤 Testando upload de currículo...');
        
        // Criar um PDF de teste simples
        const testPdf = this.createTestPDF();
        const file = new File([testPdf], 'teste_curriculo.pdf', { type: 'application/pdf' });
        
        try {
            const formData = new FormData();
            formData.append('curriculum', file);

            const response = await fetch(`${this.apiBase}/${encodeURIComponent(this.userName)}`, {
                method: 'POST',
                body: formData
            });

            const data = await response.json();
            
            if (response.ok) {
                console.log('✅ Upload bem-sucedido:', data);
                return true;
            } else {
                console.log('❌ Erro no upload:', data);
                return false;
            }
        } catch (error) {
            console.error('❌ Erro ao fazer upload:', error);
            return false;
        }
    }

    async testCurriculumDownload() {
        console.log('\n📥 Testando download de currículo...');
        
        try {
            const response = await fetch(`${this.apiBase}/${encodeURIComponent(this.userName)}`);
            
            if (response.ok) {
                const blob = await response.blob();
                console.log('✅ Download bem-sucedido:', {
                    size: blob.size,
                    type: blob.type
                });
                return true;
            } else {
                const data = await response.json();
                console.log('❌ Erro no download:', data);
                return false;
            }
        } catch (error) {
            console.error('❌ Erro ao fazer download:', error);
            return false;
        }
    }

    async testCurriculumDelete() {
        console.log('\n🗑️ Testando exclusão de currículo...');
        
        try {
            const response = await fetch(`${this.apiBase}/${encodeURIComponent(this.userName)}`, {
                method: 'DELETE'
            });

            const data = await response.json();
            
            if (response.ok) {
                console.log('✅ Exclusão bem-sucedida:', data);
                return true;
            } else {
                console.log('❌ Erro na exclusão:', data);
                return false;
            }
        } catch (error) {
            console.error('❌ Erro ao excluir:', error);
            return false;
        }
    }

    createTestPDF() {
        // Criar um PDF simples para teste
        const pdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
>>
endobj

4 0 obj
<<
/Length 44
>>
stream
BT
/F1 12 Tf
72 720 Td
(Teste de Curriculo) Tj
ET
endstream
endobj

xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000204 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
297
%%EOF`;

        return new Uint8Array(pdfContent.split('').map(char => char.charCodeAt(0)));
    }

    async testCompleteFlow() {
        console.log('🔄 Testando fluxo completo de currículo...');
        
        // 1. Verificar status inicial
        const initialStatus = await this.testCurriculumStatus();
        console.log('Status inicial:', initialStatus ? 'Tem currículo' : 'Sem currículo');
        
        // 2. Fazer upload
        const uploadSuccess = await this.testCurriculumUpload();
        if (uploadSuccess) {
            console.log('✅ Upload realizado com sucesso');
            
            // 3. Verificar status após upload
            const statusAfterUpload = await this.testCurriculumStatus();
            console.log('Status após upload:', statusAfterUpload ? 'Tem currículo' : 'Sem currículo');
            
            // 4. Testar download
            const downloadSuccess = await this.testCurriculumDownload();
            console.log('Download:', downloadSuccess ? '✅ Sucesso' : '❌ Falha');
            
            // 5. Testar exclusão
            const deleteSuccess = await this.testCurriculumDelete();
            console.log('Exclusão:', deleteSuccess ? '✅ Sucesso' : '❌ Falha');
            
            // 6. Verificar status final
            const finalStatus = await this.testCurriculumStatus();
            console.log('Status final:', finalStatus ? 'Tem currículo' : 'Sem currículo');
            
            console.log('\n🎉 Teste completo finalizado!');
        } else {
            console.log('❌ Falha no upload - não foi possível continuar o teste');
        }
    }
}

// Criar instância do testador
const curriculumTester = new CurriculumTester();

// Função para executar todos os testes
async function runCurriculumTests() {
    await curriculumTester.runAllTests();
}

// Função para executar fluxo completo
async function runCompleteCurriculumFlow() {
    await curriculumTester.testCompleteFlow();
}

console.log('🧪 Testador de currículo carregado!');
console.log('Use runCurriculumTests() para testes individuais');
console.log('Use runCompleteCurriculumFlow() para fluxo completo'); 