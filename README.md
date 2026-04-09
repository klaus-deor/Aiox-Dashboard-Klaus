<p align="center">
  <img src="https://img.shields.io/badge/AIOX-Dashboard-a78bfa?style=for-the-badge&logo=electron&logoColor=white" alt="AIOX Dashboard" />
  <img src="https://img.shields.io/github/v/release/klaus-deor/Aiox-Dashboard-Klaus?style=for-the-badge&color=22c55e" alt="Release" />
  <img src="https://img.shields.io/badge/plataformas-Linux%20%7C%20macOS%20%7C%20Windows-18181b?style=for-the-badge" alt="Plataformas" />
</p>

<h1 align="center">AIOX Dashboard</h1>

<p align="center">
  Aplicativo desktop para monitorar seus agentes, squads e sessões AIOX.<br/>
  Feito com Next.js + Electron. Roda no Linux, macOS e Windows.
</p>

<p align="center">
  <a href="./README.en.md">English version</a>
</p>

---

## Visão Geral

O AIOX Dashboard é um aplicativo desktop multiplataforma que lê seu workspace AIOX local e oferece uma visão completa de:

- **Agentes** — todos os agentes registrados com seus papéis, comandos e dependências
- **Squads** — squads instalados com composição de agentes e contagem de workflows
- **Sessões** — atividade recente e histórico de sessões

Não precisa de internet. Não precisa rodar servidor. Basta abrir o app, apontar para seu workspace AIOX e pronto.

## Download

Acesse [**Releases**](https://github.com/klaus-deor/Aiox-Dashboard-Klaus/releases/latest) e baixe o arquivo do seu sistema:

| Plataforma | Arquivo | Como usar |
|------------|---------|-----------|
| Linux | `.AppImage` | `chmod +x` e duplo clique |
| Windows | `.exe` | Duplo clique (portátil, sem instalar) |
| macOS (Intel) | `.dmg` | Abrir e arrastar para Aplicativos |
| macOS (Apple Silicon) | `-arm64.dmg` | Abrir e arrastar para Aplicativos |

> **Nota Windows:** O SmartScreen pode exibir um aviso na primeira execução, pois o app não possui assinatura digital. Clique em "Mais informações" > "Executar mesmo assim".

## Requisitos

- Um workspace AIOX na sua máquina (qualquer pasta que contenha `.aiox-core` ou `.aios-core`)
- Só isso. Sem Node.js, sem npm, sem terminal.

Na primeira execução, o app pede para selecionar a pasta do workspace. Ele lembra a escolha para as próximas vezes.

## Desenvolvimento

Se quiser rodar a partir do código-fonte ou contribuir:

```bash
# Pré-requisito: Node.js >= 22

# Instalar dependências
npm install

# Rodar em modo dev (hot reload)
npm run electron:dev

# Gerar executável para sua plataforma
npm run electron:build:linux   # AppImage
npm run electron:build:mac     # dmg
npm run electron:build:win     # exe portátil
```

O output vai para a pasta `release/`.

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Interface | Next.js 16, React 19, Tailwind CSS 4 |
| Desktop | Electron 41 |
| Fontes | Geist Sans & Geist Mono |
| Ícones | Lucide React |
| Build | electron-builder |
| CI/CD | GitHub Actions (release automática por tag) |

## Como Funciona

1. Ao abrir, você seleciona (ou ele lembra) a pasta do seu workspace AIOX
2. O app inicia um servidor Next.js embutido usando o Node.js interno do Electron
3. Ele lê `.aiox-core/development/agents/`, `squads/` e arquivos de sessão direto do disco
4. Tudo roda localmente — sem requisições de rede, sem APIs externas

## Criando uma Release

Releases são automatizadas via GitHub Actions. Para publicar uma nova versão:

```bash
git tag -a v0.4.0 -m "v0.4.0 - Descrição"
git push origin v0.4.0
```

O workflow builda para as 3 plataformas e cria uma Release no GitHub com os executáveis.

## Segurança

- **Sem telemetria.** O app não coleta, envia ou armazena dados externamente.
- **Sem acesso à internet.** Todos os dados são lidos do seu sistema de arquivos local.
- **Sem credenciais armazenadas.** A única configuração persistida é o caminho do workspace, salvo no diretório de dados do usuário do seu SO.
- **Código aberto.** Você pode auditar cada linha de código neste repositório.

Se encontrar uma vulnerabilidade de segurança, abra uma issue ou entre em contato via [klausdeor@gmail.com](mailto:klausdeor@gmail.com).

## Licença

[MIT License](./LICENSE) — Copyright (c) 2026 Klaus Deor
