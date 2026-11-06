# Cuidar+

Protótipo de aplicativo de celular para quem cuida de idosos. Familiares e cuidadores acompanham remédios, consultas e condições de saúde de uma ou mais pessoas, dividindo a tarefa com outros responsáveis.

> **Ideia central:** um idoso pode ter vários responsáveis, e uma pessoa pode ser responsável por vários idosos. Todos os responsáveis enxergam as mesmas informações.

## Funcionalidades

- **Cadastro e login** com e-mail e senha (mínimo de 6 caracteres). A sessão fica salva no aparelho.
- **Página inicial** com saudação, resumo (idosos, doses pendentes hoje e consultas futuras) e um cartão por idoso.
- **Cadastro de idoso** com nome, idade, doenças e condições, e e-mail de um segundo responsável (opcional). Quem cadastra entra automaticamente como responsável.
- **Tela do idoso**, em três abas:
  - **Resumo:** condições, responsáveis (com opção de adicionar mais um pelo e-mail) e doses do dia.
  - **Remédios:** cadastro com nome, dose e horário diário; botão **Marcar tomado**; histórico de doses.
  - **Consultas:** agendamento com médico, especialidade, data e observações; próximas consultas e histórico.
- **Lembretes de remédios:** notificação diária no horário de cada remédio, no celular de cada responsável.
- **Tema claro e escuro**, conforme a preferência do aparelho.

## Tecnologias

| Camada | Tecnologia |
|---|---|
| App | React Native com [Expo](https://expo.dev) |
| Navegação | React Navigation |
| Banco de dados e autenticação | [Supabase](https://supabase.com) (PostgreSQL, com Row Level Security) |
| Notificações | `expo-notifications` (lembretes locais agendados) |
| Geração do APK | EAS Build |

## Estrutura do projeto

```
AppIdoso/
└── cuidar-mais/
    ├── App.tsx                    # navegação (Login/Cadastro ou Home)
    ├── app.json                   # configuração do Expo (nome, ícones, plugins)
    ├── eas.json                   # perfis de build (APK)
    ├── assets/                    # ícones do app e das notificações
    ├── supabase/
    │   └── schema.sql             # tabelas, gatilhos e políticas de segurança
    └── src/
        ├── lib/
        │   ├── supabase.ts        # cliente do Supabase
        │   └── notifications.js   # lembretes de remédios
        ├── store/
        │   └── AppContext.js      # estado do app: autenticação e dados no Supabase
        ├── screens/               # telas (Login, Cadastro, Home, Novo idoso, Idoso e abas)
        ├── components/            # componentes visuais reutilizáveis
        └── utils/                 # funções de formatação e validação
```

## Como rodar o projeto

### Pré-requisitos

- [Node.js](https://nodejs.org) (versão LTS)
- Um projeto no [Supabase](https://supabase.com) (plano gratuito serve)
- O aplicativo **Expo Go** no celular, para testar sem gerar o APK

### 1. Instalar as dependências

```bash
git clone https://github.com/ZahiraS2/AppIdoso.git
cd AppIdoso/cuidar-mais
npm install
```

### 2. Configurar o banco de dados

1. No painel do Supabase, abra **SQL Editor > New query**.
2. Cole o conteúdo de `supabase/schema.sql` e clique em **Run**. O script cria as tabelas, os gatilhos e as regras de segurança, e pode ser executado mais de uma vez.
3. Em **Authentication > Providers > Email**, desligue **Confirm email** enquanto estiver em fase de protótipo. Com ele ligado, o cadastro não abre sessão até a pessoa confirmar o e-mail.

### 3. Configurar as variáveis de ambiente

Crie um arquivo `.env.local` dentro de `cuidar-mais` com os dados do seu projeto (Supabase > **Project Settings > API**):

```env
EXPO_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon-publica
```

- A URL deve ter exatamente esse formato, **sem barra no final** e sem caminhos como `/rest/v1/`.
- Nunca coloque a chave `service_role` no projeto e **não envie o `.env.local` para o GitHub**.

### 4. Iniciar o app

```bash
npx expo start -c
```

Leia o QR code com o Expo Go (celular e computador na mesma rede Wi-Fi). O `-c` limpa o cache e faz o Expo reler as variáveis de ambiente.

> As notificações agendadas não funcionam no navegador (`expo start --web`). Teste-as no celular.

## Regras de negócio

1. Um idoso só aparece para quem consta na lista de responsáveis dele (comparação por e-mail).
2. Quem cadastra o idoso é automaticamente o primeiro responsável.
3. Ao adicionar um responsável por e-mail, o idoso passa a aparecer para essa pessoa assim que ela criar a conta ou entrar com o mesmo e-mail.
4. Um responsável não pode ser adicionado duas vezes ao mesmo idoso.
5. Marcar um remédio como tomado registra a hora atual no histórico, e a marcação não pode ser desfeita.
6. Uma consulta é "próxima" quando a data é hoje ou futura; depois disso, vai para o histórico.
7. Campos obrigatórios: cadastro de usuário (nome, e-mail válido, senha com 6 ou mais caracteres), idoso (nome e idade), remédio (nome e horário), consulta (médico e data), responsável (e-mail).

## Notificações

O app agenda um lembrete **diário** para cada remédio, no horário cadastrado (sempre considerado como **horário de Brasília**). Os lembretes são recriados quando um remédio é adicionado ou alterado e removidos ao sair da conta. A permissão de notificação é pedida quando o primeiro remédio é cadastrado.

Limites desta versão:

- O aviso chega mesmo se a dose já tiver sido marcada como tomada.
- No Android, o modo de economia de bateria pode atrasar os avisos. Para reduzir isso, deixe o app sem restrição de bateria nas configurações do aparelho.
- Ainda não existem "adiar lembrete" nem aviso aos outros responsáveis quando uma dose é esquecida, porque dependem de um servidor.

## Gerar o APK (Android)

O APK é gerado na nuvem com o EAS Build.

1. Crie uma conta gratuita em [expo.dev](https://expo.dev) e instale a ferramenta:
   ```bash
   npm install -g eas-cli
   eas login
   ```
2. Dentro de `cuidar-mais`, vincule o projeto (só na primeira vez):
   ```bash
   eas init
   ```
3. Cadastre as variáveis do Supabase no EAS. O build na nuvem não lê o seu `.env.local`:
   ```bash
   eas env:create --environment preview --name EXPO_PUBLIC_SUPABASE_URL --value "https://SEU-PROJETO.supabase.co" --visibility plaintext
   eas env:create --environment preview --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "sua-chave-anon-publica" --visibility plaintext
   ```
   Se o nome dos comandos mudar na sua versão, consulte `eas env:create --help`.
4. Gere o APK:
   ```bash
   eas build --platform android --profile preview
   ```
5. Ao final, baixe o APK pelo link ou QR code do terminal e instale no celular, permitindo apps de fontes desconhecidas.

Alterações em código, ícones ou variáveis de ambiente só valem em um APK **novo**.

## Problemas comuns

| Sintoma | Causa provável |
|---|---|
| `Invalid path specified in request URL` | A URL do Supabase está com barra ou caminho extra no final (por exemplo `/rest/v1/`) |
| O cadastro diz para confirmar o e-mail | A opção **Confirm email** está ligada no Supabase |
| Erro de permissão ao salvar | O `schema.sql` não foi executado por inteiro |
| Os dados somem ao recarregar | O app não está usando o Supabase (variáveis de ambiente ausentes ou desatualizadas) |
| Erro de JSX no VS Code (`--jsx flag`) | A pasta `node_modules` não foi instalada; rode `npm install` e reinicie o servidor do TypeScript |
| Falha ao enviar o projeto no `eas build` | Conexão bloqueada por VPN, firewall ou rede da instituição; tente outra rede |

## Próximos passos

- Frequência dos remédios (dias da semana, intervalos e tratamento com data final).
- Alerta quando uma dose é esquecida, avisando os outros responsáveis.
- Registro de sinais vitais (pressão, glicemia e peso).
- Contatos de emergência e botão de ajuda.
- Foto do idoso, alergias e plano de saúde.
- Exportar o histórico de consultas e medicamentos para levar ao médico.
- Perfis de permissão entre responsáveis (quem pode editar e quem só visualiza).
