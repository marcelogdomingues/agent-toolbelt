# FAQ & resolução de problemas

### Com que fornecedores de modelos funciona?

Qualquer um. O `toJSONSchema()` devolve JSON Schema padrão, que adaptas ao formato de tools do
teu SDK (Anthropic, estilo OpenAI, local). O agent-toolbelt é a camada de tools; o loop do
modelo é teu.

### Porquê zod?

Dá-te uma única fonte de verdade: tipos estáticos para o teu handler **e** validação em runtime
**e** JSON Schema para o modelo — sem divergências entre eles. O zod v4 é uma peer dependency.

### Uma tool call lança exceção em vez de devolver erro

O `call()` lança `UnknownToolError`, `ToolValidationError` ou `ScopeError`. Num loop de agente,
apanha-as e devolve a mensagem ao modelo como resultado da tool, para ele poder recuperar.

### Como funcionam os scopes?

Declara `scopes` numa tool e adiciona o middleware `requireScopes`; ele verifica-os contra os
scopes que o chamador passa em `meta`. `"*"` concede tudo. Combina com o
[agent-passport](https://github.com/marcelogdomingues/agent-passport).

### O middleware pode interromper ou transformar resultados?

Sim — é estilo cebola `(ctx, next)`. Faz trabalho antes/depois do `next()`, lança para
bloquear, ou transforma o valor devolvido. O primeiro registado é o mais exterior.

### O input é validado antes do meu handler correr?

Sempre. Os argumentos são parseados pelo schema zod primeiro; o teu handler só vê input válido
e tipado.
