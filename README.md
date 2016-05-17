# pseudo_stone

Simulator do webservice da STONE.

Quatro serviços são oferecidos:
- AUTORIZAÇÃO DE TRANSAÇÃO (/AUTHORIZE)
- CAPTURA DE TRANSAÇÃO (/COMPLETIONADVICE)
- CANCELAMENTO DE TRANSAÇÃO (/CANCELLATION)
- CONSULTA DE TRANSAÇÃO (/TransactionStatusReport)

O formato do XML a ser enviado para estas chamadas está no link abaixo.
http://stone-pagamentos.github.io/documentacao/#integrao-web-e-e-commerce


#### AUTORIZAÇÃO DE TRANSAÇÃO

Transações podem ser criadas por qualquer cartão.
Porém, esta transação só será autorizada e/ou capturada se for realizada
por um dos cartões descritos abaixo.
É necessário utilizar os valores de cvv e validade corretos,
caso contrário, a transação não será autorizada.

Os últimos 5 dígitos do cartão especificam o tempo para autorizar as transações
realizadas pelo cartão.

| Cartão           | Bandeira      | Validade | CVV      |
| ---------------- |:-------------:|:--------:|:--------:|
| 40434235293***** | visa          |  05/2018 |      123 |
| 44854734108***** | visa          |  05/2018 |      123 |
| 45390499374***** | visa          |  05/2018 |      123 |
| 49168338099***** | visa          |  05/2018 |      123 |
| 44856747673***** | visa          |  05/2018 |      123 |
| 51408758531***** | mastercard    |  05/2018 |      123 |
| 55838507735***** | mastercard    |  05/2018 |      123 |
| 53863566475***** | mastercard    |  05/2018 |      123 |
| 55698011602***** | mastercard    |  05/2018 |      123 |
| 51923631719***** | mastercard    |  05/2018 |      123 |


#### CAPTURA DE TRANSAÇÃO

A transação deve ser capturada com o mesmo valor que foi autorizada (só é aceito a captura total).
A transação pode ser capturada apenas uma vez (verificar se funciona desta maneira na stone).
É sempre considerado que a transação terá somente 1 parcela.
É sempre considerado que o valor da transação é em reais (currency 986).
É sempre considerado que a modalidade da transação é de crédito (account type CRDT).


#### CANCELAMENTO DE TRANSAÇÃO

A transação deve ser cancelada com o mesmo valor que foi autorizada (só é aceito o cancelamento total).
A transação pode ser cancelada apenas uma vez (verificar se funciona desta maneira na stone).


#### CONSULTA DE TRANSAÇÃO

Somente são retornados o sumário da transação, e não todas as operações realizadas
sobre ela.
Não são retornados os campos MrchntShrtNm, MrchntCtgyCd e LclDtTm do sumário da transação.


#### Mensagem de erro

Caso sejam enviadas mensagens com valores inválidos/faltando,
o simulador apenas rejeita a transação. O comportamento ideal seria
retornar uma mensagem de erro apropriada da mesma forma que a STONE faz.


