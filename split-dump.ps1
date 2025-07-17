# Script para dividir o dump do banco de dados em partes menores
# para facilitar a importação no Supabase

param(
    [string]$DumpFile = "dump.sql",
    [string]$OutputDir = "dump-parts"
)

# Criar diretório de saída se não existir
if (!(Test-Path $OutputDir)) {
    New-Item -ItemType Directory -Path $OutputDir
}

Write-Host "Dividindo o arquivo de dump: $DumpFile"
Write-Host "Arquivos de saída serão salvos em: $OutputDir"

# Ler o arquivo de dump
$content = Get-Content $DumpFile -Raw

# Dividir o conteúdo em seções
$sections = @()

# 1. Configurações iniciais e estrutura das tabelas
$structureStart = $content.IndexOf("--")
$structureEnd = $content.IndexOf("-- Data for Name: areas; Type: TABLE DATA; Schema: public; Owner: admin")
$structure = $content.Substring($structureStart, $structureEnd - $structureStart)
$sections += @{ Name = "01-structure.sql"; Content = $structure }

# 2. Dados das tabelas pequenas (areas, atividades_usuario, cargos, conversas_chatbot, cursos, progresso_usuario, recomendacoes_ia, recursos)
$dataStart = $structureEnd
$dataEnd = $content.IndexOf("-- Data for Name: certificados; Type: TABLE DATA; Schema: public; Owner: admin")
$smallTablesData = $content.Substring($dataStart, $dataEnd - $dataStart)
$sections += @{ Name = "02-small-tables-data.sql"; Content = $smallTablesData }

# 3. Estrutura da tabela certificados (sem dados)
$certStructureStart = $content.IndexOf("-- Data for Name: certificados; Type: TABLE DATA; Schema: public; Owner: admin")
$certStructureEnd = $content.IndexOf("COPY public.certificados")
$certStructure = $content.Substring($certStructureStart, $certStructureEnd - $certStructureStart)
$sections += @{ Name = "03-certificados-structure.sql"; Content = $certStructure }

# 4. Dados da tabela certificados (divididos em partes)
$certDataStart = $content.IndexOf("COPY public.certificados")
$certDataEnd = $content.IndexOf("-- Data for Name: usuarios; Type: TABLE DATA; Schema: public; Owner: admin")
$certData = $content.Substring($certDataStart, $certDataEnd - $certDataStart)

# Dividir os dados de certificados em partes menores
$certLines = $certData -split "`n"
$copyCommand = $certLines[0]  # A linha COPY
$dataLines = $certLines[1..($certLines.Length-2)]  # As linhas de dados
$endCommand = $certLines[-1]  # A linha \.

# Dividir em partes de 5 registros cada
$recordsPerPart = 5
$partNumber = 1

for ($i = 0; $i -lt $dataLines.Length; $i += $recordsPerPart) {
    $partData = $dataLines[$i..([Math]::Min($i + $recordsPerPart - 1, $dataLines.Length - 1))]
    $partContent = $copyCommand + "`n" + ($partData -join "`n") + "`n" + $endCommand
    $sections += @{ Name = "04-certificados-data-part$partNumber.sql"; Content = $partContent }
    $partNumber++
}

# 5. Dados da tabela usuarios
$usersDataStart = $content.IndexOf("-- Data for Name: usuarios; Type: TABLE DATA; Schema: public; Owner: admin")
$usersDataEnd = $content.IndexOf("-- Name: areas_id_seq; Type: SEQUENCE SET; Schema: public; Owner: admin")
$usersData = $content.Substring($usersDataStart, $usersDataEnd - $usersDataStart)
$sections += @{ Name = "05-usuarios-data.sql"; Content = $usersData }

# 6. Configurações de sequências e constraints
$sequencesStart = $usersDataEnd
$sequencesEnd = $content.IndexOf("-- PostgreSQL database dump complete")
$sequences = $content.Substring($sequencesStart, $sequencesEnd - $sequencesStart)
$sections += @{ Name = "06-sequences-constraints.sql"; Content = $sequences }

# Salvar cada seção em um arquivo separado
foreach ($section in $sections) {
    $filePath = Join-Path $OutputDir $section.Name
    $section.Content | Out-File -FilePath $filePath -Encoding UTF8
    Write-Host "Criado: $filePath"
}

Write-Host "`nDivisão concluída! Arquivos criados em: $OutputDir"
Write-Host "`nOrdem de importação no Supabase:"
Write-Host "1. 01-structure.sql"
Write-Host "2. 02-small-tables-data.sql"
Write-Host "3. 03-certificados-structure.sql"
Write-Host "4. 04-certificados-data-part*.sql (todos os arquivos de dados de certificados)"
Write-Host "5. 05-usuarios-data.sql"
Write-Host "6. 06-sequences-constraints.sql" 