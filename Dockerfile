# Usar Node.js 18 como base
FROM node:18-alpine

# Definir diretório de trabalho
WORKDIR /app

# Copiar package.json e package-lock.json primeiro para aproveitar cache do Docker
COPY package*.json ./

# Instalar dependências
RUN npm ci --only=production

# Copiar todo o código da aplicação
COPY . .

# Instalar postgresql-client para o script de espera
RUN apk add --no-cache postgresql-client

# Tornar o script de espera executável
RUN chmod +x /app/wait-for-db.sh

# Criar diretório para logs
RUN mkdir -p /app/logs

# Expor porta 3000
EXPOSE 3000

# Definir variáveis de ambiente padrão
ENV NODE_ENV=production
ENV PORT=3000

# Comando para iniciar a aplicação
CMD ["npm", "start"] 