FROM node:20-alpine AS fe-build

WORKDIR /client

COPY client/package*.json ./
RUN npm ci
COPY ./client/ ./
RUN npm run build

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS be-build
WORKDIR /src

COPY PublicQ.sln ./
COPY src/ ./src/

RUN dotnet restore PublicQ.sln
RUN dotnet publish ./src/PublicQ.API/PublicQ.API.csproj -c Release -o /out /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:10.0-alpine AS runtime
WORKDIR /app

COPY --from=be-build /out .
COPY --from=fe-build /client/build ./wwwroot

ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

ENTRYPOINT ["dotnet", "PublicQ.API.dll"]