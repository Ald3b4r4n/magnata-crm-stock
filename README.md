# 💉 Magnata CRM & Stock

Sistema de alta performance para gestão de estoque e relacionamento com clientes focado no mercado de Tirzepatida. Desenvolvido com uma interface premium, dark mode nativo e Business Intelligence em tempo real.

![Preview do Dashboard](https://raw.githubusercontent.com/username/repo/main/public/preview.png) *(Substituir pelo link real após o push)*

## 🚀 Funcionalidades Principais

- **📊 Dashboard BI Global**: Acompanhamento de Faturamento Bruto, Lucro Real e Giro de Estoque com gráficos interativos.
- **📦 Gestão de Estoque**: Controle rigoroso de Lotes, Marcas, Volumetria e Posição Física das Ampolas.
- **👥 CRM Transacional**: Base de clientes desatrelada com histórico completo de vendas/compras por indivíduo.
- **💰 Controle Financeiro**: Gestão de parcelamento, status de pagamento (Pendente/Pago/Atrasado) e persistência de custo de aquisição histórico.
- **📄 Relatórios Inteligentes**: Exportação de dados em CSV (otimizado para Excel) e PDF (Relatório Analítico) com layout premium.

## 🛠️ Stack Tecnológica

- **Framework**: [Next.js 14 (App Router)](https://nextjs.org/)
- **Linguagem**: [TypeScript](https://www.typescriptlang.org/)
- **Banco de Dados & Auth**: [Firebase (Firestore)](https://firebase.google.com/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [Shadcn UI](https://ui.shadcn.com/)
- **Animações**: [Framer Motion](https://www.framer.com/motion/)
- **Gráficos**: [Recharts](https://recharts.org/)
- **PDF Core**: [jsPDF](https://github.com/parallax/jsPDF) + [AutoTable](https://github.com/simonbengtsson/jsPDF-AutoTable)

## 📦 Instalação e Uso

1. **Clonar o repositório**:
   ```bash
   git clone https://github.com/seu-usuario/magnata-crm-stock.git
   ```

2. **Instalar dependências**:
   ```bash
   npm install
   # ou
   pnpm install
   ```

3. **Configurar variáveis de ambiente**:
   Crie um arquivo `.env.local` na raiz e adicione suas credenciais do Firebase:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=...
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
   NEXT_PUBLIC_FIREBASE_APP_ID=...
   ```

4. **Rodar em desenvolvimento**:
   ```bash
   npm run dev
   ```

---
*Este projeto foi desenvolvido com foco em UX/UI de alto nível e precisão contábil.*
