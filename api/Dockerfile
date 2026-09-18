FROM php:8.3-cli

WORKDIR /app
COPY . .

ENV PORT=8080
EXPOSE 8080

# O servidor embutido do PHP roda em um único processo e atende as requisições
# sequencialmente, o que é o que permite ao CursoRepository manter os cursos em
# memória (sem banco de dados) enquanto o container estiver no ar.
CMD ["sh", "-c", "php -S 0.0.0.0:${PORT} -t public public/router.php"]
