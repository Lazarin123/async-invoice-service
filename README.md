# ⚡ Asynchronous Invoice & Report Generation

> Microsserviço assíncrono de alta performance para geração de faturas, relatórios e processamento de tarefas pesadas utilizando **Node.js 24+, TypeScript, Express, BullMQ, Redis, Upstash, Supabase e PostgreSQL**.

O projeto implementa uma arquitetura desacoplada entre **API REST** e **Background Worker**, permitindo receber grandes volumes de requisições sem manter o cliente HTTP aguardando operações demoradas.

---

## 📋 Visão Geral

O **Async Invoice Service** foi desenvolvido para resolver um problema comum em aplicações modernas: o processamento de tarefas pesadas dentro do ciclo tradicional de uma requisição HTTP.

Em vez de executar toda a operação diretamente na API, o sistema:

1. Recebe a requisição do cliente.
2. Registra imediatamente a solicitação no banco de dados com status `PENDING`.
3. Cria um Job utilizando **BullMQ**.
4. Envia o Job para uma fila armazenada no **Redis**.
5. O **Background Worker** consome a fila.
6. O processamento pesado é executado em segundo plano.
7. O banco de dados é atualizado para `COMPLETED` ou `FAILED`.

### Fluxo simplificado

```text
                    CLIENTE
                       │
                       │ HTTP Request
                       ▼
              ┌─────────────────┐
              │   Express API   │
              │   Node.js       │
              └────────┬────────┘
                       │
              ┌────────┴────────┐
              │                 │
              ▼                 ▼
        ┌───────────┐     ┌──────────────┐
        │ Supabase  │     │   BullMQ     │
        │ PostgreSQL│     │     Queue    │
        └───────────┘     └──────┬───────┘
                                 │
                                 ▼
                         ┌───────────────┐
                         │ Redis / Upstash│
                         └───────┬───────┘
                                 │
                                 ▼
                       ┌──────────────────┐
                       │ Background Worker│
                       │    Node.js       │
                       └────────┬─────────┘
                                │
                                ▼
                       Processamento pesado
                                │
                                ▼
                         ┌──────────────┐
                         │   Supabase   │
                         │   COMPLETED  │
                         │   / FAILED   │
                         └──────────────┘
```

---

## 🎯 Objetivo do Projeto

O projeto foi desenvolvido como uma demonstração prática de conceitos modernos de **engenharia de software, arquitetura backend e processamento distribuído**.

Entre os principais objetivos estão:

- Demonstrar processamento assíncrono de tarefas.
- Evitar bloqueio de requisições HTTP.
- Separar API e processamento pesado.
- Utilizar filas para gerenciamento de workloads.
- Demonstrar arquitetura preparada para escala.
- Implementar persistência de estados de processamento.
- Trabalhar com infraestrutura cloud distribuída.
- Aplicar TypeScript em uma arquitetura backend moderna.
- Demonstrar utilização de Redis como broker de mensagens.
- Criar uma solução próxima de cenários encontrados em sistemas corporativos.

---

# 🏗️ Arquitetura

A aplicação é dividida em dois componentes principais:

### API

Responsável pela comunicação com os clientes.

```text
Client
  │
  ▼
Express
  │
  ├── Validação
  ├── Persistência
  └── Criação do Job
```

A API não executa diretamente o processamento pesado.

Ela registra a solicitação e coloca o trabalho na fila.

### Background Worker

Responsável pelo processamento assíncrono.

```text
Redis
  │
  ▼
BullMQ
  │
  ▼
Worker
  │
  ├── Consome Job
  ├── Executa processamento
  ├── Trata erros
  └── Atualiza status
```

Essa separação permite que a API continue respondendo rapidamente mesmo quando existem operações demoradas sendo processadas.

---

# 🔄 Ciclo de vida de uma solicitação

Cada solicitação possui um ciclo de processamento controlado.

```text
                 ┌───────────┐
                 │  PENDING  │
                 └─────┬─────┘
                       │
                       ▼
                ┌──────────────┐
                │ Queue / Redis│
                └──────┬───────┘
                       │
                       ▼
                ┌──────────────┐
                │    Worker    │
                └──────┬───────┘
                       │
              ┌────────┴────────┐
              │                 │
              ▼                 ▼
       ┌─────────────┐   ┌─────────────┐
       │  COMPLETED  │   │    FAILED   │
       └─────────────┘   └─────────────┘
```

### `PENDING`

A solicitação foi recebida e registrada, mas ainda está aguardando processamento.

### `COMPLETED`

O Worker concluiu o processamento com sucesso.

### `FAILED`

O processamento não foi concluído devido a algum erro.

Essa abordagem permite que sistemas consumidores acompanhem o estado da operação sem precisar manter uma conexão HTTP aberta durante todo o processamento.

---

# 🚀 Tecnologias

| Tecnologia      | Utilização                       |
| --------------- | -------------------------------- |
| **Node.js 24+** | Runtime principal                |
| **TypeScript**  | Linguagem de desenvolvimento     |
| **Express.js**  | API REST                         |
| **BullMQ**      | Gerenciamento de filas           |
| **Redis**       | Broker de mensagens              |
| **Upstash**     | Redis gerenciado em cloud        |
| **Supabase**    | Plataforma de dados              |
| **PostgreSQL**  | Banco de dados                   |
| **tsx**         | Execução durante desenvolvimento |
| **Git**         | Controle de versão               |
| **GitHub**      | Hospedagem do código             |

---

# ☁️ Infraestrutura

O projeto utiliza uma arquitetura distribuída na nuvem.

```text
                    INTERNET
                       │
                       ▼
                ┌───────────────┐
                │     Render    │
                │   Web Service │
                │      API      │
                └───────┬───────┘
                        │
              ┌─────────┴─────────┐
              │                   │
              ▼                   ▼
       ┌─────────────┐     ┌─────────────┐
       │  Supabase   │     │   Upstash   │
       │ PostgreSQL  │     │    Redis    │
       └─────────────┘     └──────┬──────┘
                                   │
                                   ▼
                         ┌─────────────────┐
                         │      Render     │
                         │ Background      │
                         │ Worker          │
                         └─────────────────┘
```

## Render — API

A API REST é hospedada como um **Web Service** na Render.

Responsabilidades:

- Receber requisições HTTP.
- Validar dados.
- Registrar solicitações.
- Criar Jobs.
- Consultar estados no banco.
- Responder aos clientes.

## Render — Background Worker

O processamento assíncrono é executado em um **Background Worker** separado.

Responsabilidades:

- Consumir Jobs do Redis.
- Processar tarefas.
- Atualizar estados.
- Tratar falhas.
- Operar continuamente em background.

A separação dos serviços evita que o processamento pesado consuma os recursos destinados à API.

## Upstash — Redis

O Redis é utilizado como broker para as filas do BullMQ.

A conexão utiliza Redis gerenciado em cloud com comunicação segura através de:

```text
rediss://
```

O Upstash elimina a necessidade de manter manualmente uma instância Redis própria.

## Supabase — PostgreSQL

O Supabase fornece a camada de persistência baseada em PostgreSQL.

A aplicação mantém o histórico e o estado atual das solicitações, incluindo estados como:

```text
PENDING
COMPLETED
FAILED
```

---

# 📦 Processamento assíncrono

O principal conceito arquitetural do projeto é retirar tarefas pesadas do fluxo síncrono da API.

### ❌ Abordagem tradicional

```text
Client
  │
  ▼
API
  │
  ▼
Processamento pesado
  │
  │
  │ ← conexão permanece aberta
  │
  ▼
Response
```

Esse modelo pode gerar:

- HTTP timeouts;
- aumento do consumo de CPU;
- bloqueio de recursos;
- maior tempo de resposta;
- dificuldade de escalar;
- sobrecarga do servidor.

### ✅ Abordagem utilizada

```text
Client
  │
  ▼
API
  │
  ├──────────────► PostgreSQL
  │
  └──────────────► Redis Queue
                         │
                         ▼
                       Worker
                         │
                         ▼
                   Processamento
                         │
                         ▼
                     Supabase
```

A API pode responder rapidamente enquanto o Worker executa a operação em background.

---

# 📨 BullMQ

O **BullMQ** é responsável pelo gerenciamento dos Jobs.

O fluxo conceitual é:

```text
API
 │
 │ add()
 ▼
BullMQ
 │
 ▼
Redis
 │
 │ consume
 ▼
Worker
 │
 ▼
Processamento
```

A utilização de uma fila permite organizar o processamento e controlar a quantidade de tarefas executadas simultaneamente.

Isso cria uma camada de desacoplamento entre:

```text
Entrada de requisições
        ↓
Processamento
```

---

# 🗄️ Persistência

O banco de dados possui a responsabilidade de armazenar o estado das solicitações.

Um fluxo conceitual de uma fatura seria:

```text
INSERT
status = PENDING
        │
        ▼
     Worker
        │
        ▼
Processamento
        │
   ┌────┴────┐
   ▼         ▼
SUCCESS     ERROR
   │         │
   ▼         ▼
COMPLETED   FAILED
```

Isso permite consultar posteriormente o estado de uma solicitação sem depender do processo original que a criou.

---

# 🌐 API

A API fornece uma camada HTTP para criação e acompanhamento das operações assíncronas.

### Criar uma solicitação

```http
POST /invoices
```

Exemplo conceitual:

```json
{
  "customerId": "customer-123",
  "items": [
    {
      "description": "Software Development",
      "quantity": 1,
      "unitPrice": 1500
    }
  ]
}
```

A API registra a operação como:

```text
PENDING
```

e adiciona o processamento à fila.

---

## Consultar processamento

Um endpoint de consulta pode ser utilizado para verificar o estado da operação:

```http
GET /invoices/:id
```

Exemplo de resposta:

```json
{
  "id": "invoice-123",
  "status": "PENDING"
}
```

Após o processamento:

```json
{
  "id": "invoice-123",
  "status": "COMPLETED"
}
```

Em caso de falha:

```json
{
  "id": "invoice-123",
  "status": "FAILED"
}
```

> Os exemplos de endpoints representam o fluxo arquitetural do sistema. Consulte as rotas implementadas no código para a interface definitiva da API.

---

# ⚙️ Requisitos

Para executar o projeto localmente:

- Node.js `24+`
- npm
- Redis
- Projeto Supabase
- Git

Também é necessário configurar as credenciais dos serviços externos.

---

# 📥 Instalação

Clone o repositório:

```bash
git clone https://github.com/Lazarin123/async-invoice-service.git
```

Entre no diretório:

```bash
cd async-invoice-service
```

Instale as dependências:

```bash
npm install
```

---

# 🔐 Variáveis de ambiente

Crie um arquivo:

```text
.env
```

Configure as credenciais necessárias para:

```text
Redis / Upstash
Supabase
API
```

Um exemplo conceitual:

```env
PORT=3000

REDIS_URL=rediss://...

SUPABASE_URL=https://...
SUPABASE_KEY=...
```

> Nunca versione credenciais ou secrets no GitHub.

---

# 🧑‍💻 Desenvolvimento

Para executar o ambiente de desenvolvimento utilizando `tsx`:

```bash
npm run dev
```

Para gerar o build:

```bash
npm run build
```

Para executar a versão compilada:

```bash
npm start
```

Os comandos disponíveis podem variar de acordo com os scripts definidos no `package.json`.

---

# 🧩 Execução da arquitetura localmente

Durante o desenvolvimento, a arquitetura pode ser executada com os dois processos separados:

### API

```text
Node.js
   │
   ▼
Express
   │
   ▼
HTTP Server
```

### Worker

```text
Node.js
   │
   ▼
BullMQ Worker
   │
   ▼
Redis
```

Os dois processos compartilham:

```text
Redis
   +
Supabase
```

---

# 📈 Escalabilidade

Uma das principais vantagens dessa arquitetura é permitir escalar o processamento independentemente da API.

Por exemplo:

```text
                 Redis
                   │
       ┌───────────┼───────────┐
       ▼           ▼           ▼
    Worker 1    Worker 2    Worker 3
       │           │           │
       └───────────┼───────────┘
                   ▼
                Supabase
```

Caso a quantidade de Jobs aumente, novos Workers podem ser adicionados sem necessariamente aumentar a quantidade de instâncias da API.

Isso cria uma arquitetura horizontalmente escalável.

---

# 🛡️ Resiliência

A utilização de filas permite que a entrada de requisições seja desacoplada da capacidade momentânea de processamento.

Em um cenário de alta demanda:

```text
1000 Requests
      │
      ▼
    Queue
      │
      ├── Worker
      ├── Worker
      └── Worker
```

Em vez de tentar processar tudo simultaneamente, os Jobs podem aguardar na fila e serem consumidos conforme a capacidade disponível.

Esse modelo ajuda a controlar o consumo de recursos e proteger o servidor contra picos de carga.

---

# 🔁 Tratamento de falhas

Durante o processamento, uma operação pode resultar em:

```text
PENDING
   │
   ▼
PROCESSING
   │
   ├──────────────► COMPLETED
   │
   └──────────────► FAILED
```

O estado `FAILED` permite identificar operações que não foram concluídas corretamente e cria uma base para mecanismos futuros de:

- Retry;
- Backoff;
- Dead Letter Queue;
- Alertas;
- Reprocessamento manual;
- Monitoramento.

---

# 🧠 Conceitos de Engenharia Demonstrados

Este projeto foi desenvolvido para demonstrar conhecimentos em:

### Arquitetura

- Microsserviços
- Arquitetura distribuída
- Separação entre API e Worker
- Comunicação assíncrona
- Event-driven processing
- Desacoplamento de componentes

### Backend

- Node.js
- TypeScript
- Express.js
- APIs REST
- ESM
- `NodeNext`
- Processamento em background

### Mensageria

- Redis
- BullMQ
- Queues
- Jobs
- Workers
- Processamento concorrente
- Controle de workload

### Cloud

- Render
- Upstash
- Supabase
- PostgreSQL
- Redis Cloud
- SSL/TLS

---

# 📐 Arquitetura desacoplada

Um dos principais diferenciais do projeto é a separação clara das responsabilidades:

```text
┌─────────────────────────────────────────────┐
│                    API                      │
│                                             │
│ HTTP → Validation → Database → Queue        │
└──────────────────────┬──────────────────────┘
                       │
                       ▼
                 ┌───────────┐
                 │   Redis   │
                 │  Upstash  │
                 └─────┬─────┘
                       │
                       ▼
┌─────────────────────────────────────────────┐
│                 WORKER                      │
│                                             │
│ Queue → Processing → Database               │
└─────────────────────────────────────────────┘
```

A API não precisa conhecer os detalhes internos do processamento pesado.

Da mesma forma, o Worker não precisa lidar diretamente com as conexões HTTP dos clientes.

Essa separação reduz o acoplamento e facilita a evolução individual dos componentes.

---

# 🚀 Possíveis Evoluções

A arquitetura permite evoluções futuras, como:

- Geração real de PDFs;
- Armazenamento de arquivos no Supabase Storage;
- Sistema de autenticação;
- Autorização baseada em roles;
- Retry automático;
- Exponential Backoff;
- Dead Letter Queue;
- Dashboard de Jobs;
- Monitoramento de filas;
- Logs estruturados;
- Métricas;
- OpenTelemetry;
- Health checks avançados;
- Rate limiting;
- Idempotência;
- Processamento prioritário;
- Agendamento de relatórios;
- Webhooks;
- Notificações por e-mail;
- Testes de carga;
- CI/CD.

---

# 📊 Exemplo de cenário

Imagine um sistema que recebe:

```text
10.000 solicitações
```

para geração de relatórios.

Em uma arquitetura puramente síncrona:

```text
10.000 Requests
       │
       ▼
   API Server
       │
       ▼
Processamento pesado
```

Isso poderia gerar uma grande concentração de processamento na API.

Com a arquitetura deste projeto:

```text
10.000 Requests
       │
       ▼
      API
       │
       ▼
     Redis
       │
       ▼
      Queue
       │
       ├── Worker 1
       ├── Worker 2
       ├── Worker 3
       └── Worker N
```

A entrada e o processamento passam a ser desacoplados.

A capacidade de processamento pode ser ajustada através da quantidade e configuração dos Workers.

---

# 🎓 Projeto de Portfólio

Este projeto foi desenvolvido com foco em demonstrar conhecimentos práticos de **engenharia de software e arquitetura backend moderna**.

Mais do que simplesmente criar uma API REST, o objetivo é demonstrar a construção de um sistema distribuído utilizando componentes especializados:

```text
                    API
                     │
             ┌───────┴───────┐
             ▼               ▼
         Supabase          BullMQ
             │               │
             │               ▼
             │             Redis
             │               │
             │               ▼
             │             Worker
             │               │
             └───────┬───────┘
                     ▼
                  Resultado
```

O projeto demonstra conceitos relevantes para ambientes corporativos que precisam lidar com tarefas demoradas, grande volume de solicitações e processamento desacoplado.

---

# 👨‍💻 Autor

**Samuel Lazarin**

Desenvolvedor Full Stack com interesse em desenvolvimento de software, automação, qualidade, arquitetura backend e soluções escaláveis.

### GitHub

**Lazarin123**

### Projeto

**Async Invoice Service**

---

# 📄 Licença

Consulte o arquivo `LICENSE` do projeto para obter as condições oficiais de utilização, modificação e distribuição.

---

<p align="center">
  <strong>Async Invoice & Report Generation</strong>
  <br>
  Node.js • TypeScript • Express • BullMQ • Redis • Upstash • Supabase
</p>
