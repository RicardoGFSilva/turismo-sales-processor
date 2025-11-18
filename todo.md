# Sistema de Processamento de Vendas de Turismo - TODO

## Funcionalidades Principais

### Backend - Processamento de PDF e Extração de Dados
- [x] Implementar API de upload de arquivos PDF
- [x] Implementar extração de dados de PDF usando pdfjs-dist ou similar
- [ ] Implementar OCR para PDFs com imagens (tesseract.js)
- [x] Implementar validação e limpeza de dados extraídos
- [x] Criar tabelas de banco de dados para armazenar dados extraídos
- [x] Implementar API de listagem de vendas/bilhetes

### Backend - Módulo De-Para (Comparação de Layouts)
- [ ] Implementar sistema de mapeamento de colunas entre diferentes formatos de PDF
- [x] Criar tabela para armazenar configurações de mapeamento
- [ ] Implementar API para criar/editar/listar mapeamentos
- [ ] Implementar lógica de aplicação automática de mapeamentos

### Backend - Gestão de Faturas
- [x] Implementar API de cadastro de informações adicionais de fatura
- [x] Implementar API de upload de anexos (bilhete, voucher)
- [x] Implementar API de listagem de faturas com detalhes
- [x] Implementar API de atualização de dados de fatura

### Frontend - Interface Principal
- [x] Criar layout base com paleta de cores do site de referência
- [x] Implementar navbar com logo e menu de navegação
- [x] Implementar footer com dados de contato
- [x] Criar página de upload de PDF com drag-and-drop
- [x] Implementar visualização de dados extraídos em tabela

### Frontend - Gestão de Faturas
- [x] Criar modal/janela de detalhes de fatura
- [ ] Implementar formulário de cadastro de cliente final
- [ ] Implementar upload de anexos (bilhete, voucher)
- [x] Criar visualização de dados da fatura com edição

### Frontend - Módulo De-Para
- [ ] Criar interface para visualizar mapeamentos de colunas
- [ ] Implementar interface para criar/editar mapeamentos
- [ ] Implementar seleção de mapeamento antes de upload

### Design e Estilo
- [ ] Aplicar paleta de cores do site de referência (azul escuro, branco, amarelo/laranja, verde água)
- [ ] Configurar tipografia (fonte sem serifa moderna)
- [ ] Implementar componentes UI consistentes com shadcn/ui
- [ ] Aplicar responsividade mobile-first

### Testes e Validação
- [ ] Escrever testes unitários para extração de PDF (pdfjs-dist não funciona bem em testes)
- [ ] Escrever testes para validação de dados
- [x] Escrever testes para APIs de CRUD
- [ ] Testar fluxo completo de upload e processamento
- [ ] Validar precisão da extração com PDF de exemplo

### Documentação
- [ ] Documentar estrutura de dados e schema do banco
- [ ] Documentar APIs disponíveis (endpoints)
- [ ] Documentar instruções de instalação e configuração
- [ ] Documentar guia de uso do sistema
- [ ] Documentar plataformas de back-office de referência

### Integração e Deploy
- [ ] Configurar variáveis de ambiente necessárias
- [ ] Testar sistema completo end-to-end
- [ ] Preparar checkpoint para publicação
- [ ] Publicar sistema

## Plataformas de Back-Office de Turismo (Referência)

1. **Paxpro** - Sistema 100% em cloud para agências de viagens com CRM integrado
2. **Amadeus Selling Platform** - Plataforma global para reservas e gestão de viagens
3. **TOTVS Gestão para Turismo** - Sistema ERP especializado para setor de turismo

## Notas Técnicas

- Usar pdfjs-dist para extração de texto de PDF
- Usar tesseract.js para OCR quando necessário
- Usar Drizzle ORM para operações de banco de dados
- Usar tRPC para comunicação client-server
- Usar Tailwind CSS 4 com OKLCH para cores
- Usar shadcn/ui para componentes UI
- Armazenar arquivos em S3 via storagePut()
- Usar timestamps UTC para todas as datas

## Estrutura de Dados Principal

**Tabela: sales_invoices** - Armazena dados de faturas/vendas
- id, invoiceId, agencyName, agencyCNPJ, clientName, clientCNPJ, airline, saleType, createdAt, updatedAt

**Tabela: sales_tickets** - Armazena bilhetes individuais
- id, invoiceId, passengerName, route, emissionDate, ticketNumber, fare, tax, commission, incentive, discount, tax, fee, netAmount, createdAt

**Tabela: invoice_details** - Armazena detalhes adicionais de fatura
- id, invoiceId, finalClientName, voucherPath, billetPath, validationStatus, createdAt, updatedAt

**Tabela: pdf_mappings** - Armazena mapeamentos de colunas (De-Para)
- id, name, description, columnMapping (JSON), platformName, createdAt, updatedAt
