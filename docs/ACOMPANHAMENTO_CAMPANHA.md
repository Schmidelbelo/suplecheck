# Acompanhamento — campanha Google Ads prioridade A

Diário do teste de 7 dias (plano: `docs/CAMPANHA_GOOGLE_ADS_PRIORIDADE_A.md`,
checklist: `docs/CHECKLIST_ATIVACAO_CAMPANHA.md`). Teto: R$ 100 · R$ 15/dia.

**Baseline antes da campanha** (cliques de saída reais, sem os de validação
`source=unknown`): 21 em 14 dias nos 10 produtos A; 0 a 1 por dia no site
todo nos 10 dias anteriores; **nenhum** entre 29/09 00:00 e 30/09 12:00 UTC
(além do clique controlado de teste de 30/09 11:04:27 UTC).

## Registro diário

| Dia | Data                  | Impressões | Cliques Ads | Custo      | CPC médio  | Sessões/usuários GA4 (google/cpc) | `outbound_link_clicked` (GA4) | Cliques `/go` no banco | `wasAffiliate=true` | Amazon (cliques/pedidos) | Status       |
| --- | --------------------- | ---------- | ----------- | ---------- | ---------- | --------------------------------- | ----------------------------- | ---------------------- | ------------------- | ------------------------ | ------------ |
| 1   | 30/09 (até 12:00 UTC) | sem acesso | sem acesso  | sem acesso | sem acesso | sem acesso                        | sem acesso                    | **0**                  | —                   | sem acesso               | **aguardar** |

## Dia 1 — 30/09/2026 (coleta às 12:00 UTC / 09:00 BRT)

**Horário de ativação**: não informado. **Preencher**: ____ (é usado para
separar clique pago de orgânico no banco).

### O que foi possível medir daqui

| Fonte                                 | Resultado                                                                                                                                                                    |
| ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `outbound_clicks` (banco de produção) | **0 cliques reais** desde 29/09 00:00 UTC (só validações `source=unknown` e o clique de teste das 11:04:27). Igual ao baseline                                               |
| Saúde do `/go`                        | `302` afiliado (`dp/B09MJK3PMB?tag=suplescore-20`) às 12:00 UTC                                                                                                              |
| Páginas de destino                    | `/creatina`, página de produto e `/ofertas` respondem 200. `/creatina` levou 5,2 s numa requisição (provável cold start); as outras ~1 s                                     |
| Logs da Vercel                        | só retêm ~1 h e não registram querystring (sem `gclid`/UTM). Na última hora, só requisições de validação e robôs; nenhuma visita externa identificável às páginas de destino |

### O que depende de você (sem acesso daqui)

- **Google Ads**: impressões, cliques, custo, CPC médio e **status dos
  anúncios** ("Qualificado" / "Em análise" / "Reprovado").
- **GA4**: Relatórios > Aquisição > Aquisição de tráfego, sessões e
  usuários com origem/mídia `google / cpc`; e contagem de
  `outbound_link_clicked`, em Eventos ou Tempo real.
- **Amazon Associates**: relatório do dia (atraso de 24–48h, o dia 1
  normalmente só aparece no dia 2 ou 3).

### Leitura do dia 1

- **Status: aguardar.** Nenhum clique pago chegou ao `/go` até 12:00 UTC.
  Isso é esperado se a ativação foi hoje: anúncios novos passam por
  revisão do Google (normalmente algumas horas, até 1 dia útil) antes de
  ter impressões.
- **Nenhum erro técnico**: `/go` afiliado e páginas 200.
- **Nenhuma ação recomendada.** Não otimizar antes de haver dados.
- **Alerta a observar**: se o Google Ads já mostrar **cliques** e o banco
  continuar com **0** cliques `/go` no fim do dia, isso não é problema de
  conversão ainda (dia 1). Mas se passar de ~20 cliques sem nenhum `/go`,
  conferir se as URLs finais dos anúncios estão corretas (abrem o
  SupleScore com UTM e respondem 200).

### Consulta usada (só leitura)

```sql
SELECT date_trunc('hour', oc."createdAt") AS hora, p.slug, oc.source, oc."wasAffiliate", count(*)
FROM outbound_clicks oc JOIN products p ON p.id = oc."productId"
WHERE oc."createdAt" >= '<horário de ativação>' AND oc.source <> 'unknown'
GROUP BY 1, 2, 3, 4 ORDER BY 1;
```
