
           /*
  CATÁLOGO V6 — SUPER RÁPIDO

  Esta consulta:
  - consulta apenas C_DISTESTOQUEITEM;
  - não abre C_IMAGEMARTIGO;
  - não usa C_ARTIGO_COMP;
  - não usa ROW_NUMBER, GROUP BY ou OFFSET;
  - pagina por cursor usando item.Id.

  Parâmetros:
    @setor varchar(30)
    @limit int
    @before_id int
*/

SET NOCOUNT ON;

DECLARE @qtd int =
    CASE
        WHEN @limit IS NULL OR @limit < 1 THEN 18
        WHEN @limit > 30 THEN 30
        ELSE @limit
END;

SELECT TOP (@qtd)
    item.Id AS item_id,

    LTRIM(
            RTRIM(
                    CONVERT(varchar(100), item.ArtigoId)
            )
    ) AS id,

       COALESCE(
               NULLIF(LTRIM(RTRIM(item.Descricao)), ''),
               'Produto'
       ) AS nome,

       COALESCE(
               NULLIF(item.PrecoMarketing, 0),
               NULLIF(item.PrecoPromocao, 0)
       ) AS preco,

       NULLIF(item.PrecoPromocao, 0) AS preco_promocional,

       CASE
           WHEN @setor = 'moda-casa' THEN
               CASE
                   WHEN n.nome_norm LIKE '%CORTINA%'
                       OR n.nome_norm LIKE '%VARAO%'
                       THEN 'Cortinas'

                   WHEN n.nome_norm LIKE '%PANO DE PRATO%'
                       OR n.nome_norm LIKE '%PANO DE PIA%'
                       OR n.nome_norm LIKE '%PANO DE COPA%'
                       OR n.nome_norm LIKE '%TOALHA DE MESA%'
                       OR n.nome_norm LIKE '%POTE%'
                       OR n.nome_norm LIKE '%TRAVESSA%'
                       OR n.nome_norm LIKE '%GARRAFA%'
                       OR n.nome_norm LIKE '%SQUEEZE%'
                       OR n.nome_norm LIKE '%COPO%'
                       OR n.nome_norm LIKE '%JARRA%'
                       OR n.nome_norm LIKE '%PRATO%'
                       OR n.nome_norm LIKE '%TALHER%'
                       THEN 'Cozinha'

                   WHEN n.nome_norm LIKE '%TOALHA%'
                       OR n.nome_norm LIKE '%TAPETE%'
                       OR n.nome_norm LIKE '%CAPA DE COLCHAO%'
                       THEN 'Banho'

                   ELSE 'Cama'
                   END

           WHEN @setor = 'infantil' THEN
               CASE
                   WHEN n.nome_norm LIKE '%VESTIDO%'
                       THEN 'Vestidos'
                   WHEN n.nome_norm LIKE '%CONJUNTO%'
                       THEN 'Conjuntos'
                   WHEN n.nome_norm LIKE '%CALCA%'
                       OR n.nome_norm LIKE '%LEGGING%'
                       THEN 'Calças'
                   WHEN n.nome_norm LIKE '%BERMUDA%'
                       OR n.nome_norm LIKE '%SHORT%'
                       THEN 'Shorts e bermudas'
                   WHEN n.nome_norm LIKE '%JAQUETA%'
                       OR n.nome_norm LIKE '%CASACO%'
                       OR n.nome_norm LIKE '%MOLETOM%'
                       THEN 'Casacos'
                   WHEN n.nome_norm LIKE '%POLO%'
                       THEN 'Polos'
                   WHEN n.nome_norm LIKE '%REGATA%'
                       THEN 'Regatas'
                   ELSE 'Blusas e camisetas'
                   END

           WHEN @setor = 'masculino' THEN
               CASE
                   WHEN n.nome_norm LIKE '%POLO%'
                       THEN 'Polos'
                   WHEN n.nome_norm LIKE '%CAMISA%'
                       THEN 'Camisas'
                   WHEN n.nome_norm LIKE '%BERMUDA%'
                       OR n.nome_norm LIKE '%SHORT%'
                       THEN 'Bermudas'
                   WHEN n.nome_norm LIKE '%CALCA%'
                       THEN 'Calças'
                   WHEN n.nome_norm LIKE '%CUECA%'
                       THEN 'Cuecas'
                   WHEN n.nome_norm LIKE '%JAQUETA%'
                       OR n.nome_norm LIKE '%CASACO%'
                       OR n.nome_norm LIKE '%MOLETOM%'
                       OR n.nome_norm LIKE '%SUETER%'
                       THEN 'Casacos'
                   ELSE 'Camisetas'
                   END

           WHEN @setor = 'feminino' THEN
               CASE
                   WHEN n.nome_norm LIKE '%VESTIDO%'
                       THEN 'Vestidos'
                   WHEN n.nome_norm LIKE '%CROPPED%'
                       OR n.nome_norm LIKE '%CROPED%'
                       THEN 'Croppeds'
                   WHEN n.nome_norm LIKE '%SAIA%'
                       THEN 'Saias'
                   WHEN n.nome_norm LIKE '%CALCA%'
                       OR n.nome_norm LIKE '%LEGGING%'
                       OR n.nome_norm LIKE '%PANTALONA%'
                       THEN 'Calças'
                   WHEN n.nome_norm LIKE '%SHORT%'
                       THEN 'Shorts'
                   WHEN n.nome_norm LIKE '%CONJUNTO%'
                       THEN 'Conjuntos'
                   WHEN n.nome_norm LIKE '%BODY%'
                       THEN 'Bodies'
                   WHEN n.nome_norm LIKE '%MACACAO%'
                       OR n.nome_norm LIKE '%MACAQUINHO%'
                       THEN 'Macacões'
                   ELSE 'Blusas'
                   END

           WHEN @setor = 'acessorios' THEN
               CASE
                   WHEN n.nome_norm LIKE '%BOLSA%'
                       OR n.nome_norm LIKE '%MOCHILA%'
                       OR n.nome_norm LIKE '%POCHETE%'
                       THEN 'Bolsas e mochilas'
                   WHEN n.nome_norm LIKE '%RELOGIO%'
                       THEN 'Relógios'
                   WHEN n.nome_norm LIKE '%CINTO%'
                       THEN 'Cintos'
                   WHEN n.nome_norm LIKE '%CARTEIRA%'
                       THEN 'Carteiras'
                   WHEN n.nome_norm LIKE '%COLAR%'
                       OR n.nome_norm LIKE '%PULSEIRA%'
                       OR n.nome_norm LIKE '%BRINCO%'
                       OR n.nome_norm LIKE '%ANEL%'
                       OR n.nome_norm LIKE '%CORRENTE%'
                       THEN 'Bijuterias'
                   WHEN n.nome_norm LIKE '%TIARA%'
                       OR n.nome_norm LIKE '%PRESILHA%'
                       OR n.nome_norm LIKE '%ELASTICO%'
                       THEN 'Cabelo'
                   WHEN n.nome_norm LIKE '%BONE%'
                       OR n.nome_norm LIKE '%CHAPEU%'
                       OR n.nome_norm LIKE '%VISEIRA%'
                       THEN 'Bonés e chapéus'
                   ELSE 'Outros'
                   END

           WHEN @setor = 'calcados' THEN
               CASE
                   WHEN n.nome_norm LIKE '%TENIS%'
                       THEN 'Tênis'
                   WHEN n.nome_norm LIKE '%SANDALIA%'
                       OR n.nome_norm LIKE '%ANABELA%'
                       THEN 'Sandálias'
                   WHEN n.nome_norm LIKE '%CHINELO%'
                       OR n.nome_norm LIKE '%HAVAIANA%'
                       OR n.nome_norm LIKE '%IPANEMA%'
                       OR n.nome_norm LIKE '%GRENDHA%'
                       THEN 'Chinelos'
                   WHEN n.nome_norm LIKE '%BOTA%'
                       OR n.nome_norm LIKE '%BOTINA%'
                       OR n.nome_norm LIKE '%COTURNO%'
                       THEN 'Botas'
                   WHEN n.nome_norm LIKE '%SAPATILHA%'
                       THEN 'Sapatilhas'
                   WHEN n.nome_norm LIKE '%RASTEIRA%'
                       THEN 'Rasteiras'
                   WHEN n.nome_norm LIKE '%TAMANCO%'
                       THEN 'Tamancos'
                   ELSE 'Sapatos'
                   END
           END AS subcategoria

FROM dbo.C_DISTESTOQUEITEM AS item

         CROSS APPLY (
        VALUES (
                UPPER(
                        COALESCE(
                                NULLIF(LTRIM(RTRIM(item.Descricao)), ''),
                                ''
                        )
                ) COLLATE Latin1_General_CI_AI
        )
               ) AS n(nome_norm)

WHERE
    ISNULL(item.Inativo, 0) = 0

    AND (
        @before_id IS NULL
        OR item.Id < @before_id
    )

    AND NULLIF(
        LTRIM(
            RTRIM(
                CONVERT(varchar(100), item.ArtigoId)
            )
        ),
        ''
    ) IS NOT NULL

    AND COALESCE(
        NULLIF(item.PrecoPromocao, 0),
        NULLIF(item.PrecoMarketing, 0),
        0
    ) > 0

    AND (
        (
            @setor = 'feminino'

            AND (
                n.nome_norm LIKE 'FEM'
                OR n.nome_norm LIKE 'FEM%'
                OR n.nome_norm LIKE 'FEMININ%'
                OR n.nome_norm LIKE '%VESTIDO%'
                OR n.nome_norm LIKE '%SAIA%'
                OR n.nome_norm LIKE '%CROPPED%'
                OR n.nome_norm LIKE '%CROPED%'
                OR n.nome_norm LIKE '%MACAQUINHO%'
                OR n.nome_norm LIKE '%MACACAO%'
                OR n.nome_norm LIKE '%BODY%'
                OR n.nome_norm LIKE '%BLUSA%'
                OR n.nome_norm LIKE '%REGATA FEM%'
                OR n.nome_norm LIKE '%CAMISETA FEM%'
                OR n.nome_norm LIKE '%CALCA%'
                OR n.nome_norm LIKE '%LEGGING%'
                OR n.nome_norm LIKE '%PANTALONA%'
                OR n.nome_norm LIKE '%SHORT%'
                OR n.nome_norm LIKE '%CONJUNTO%'
            )

    )

        OR (
            @setor = 'masculino'

            AND (
                n.nome_norm LIKE '% MASC%'
                OR n.nome_norm LIKE 'MASC%'
                OR n.nome_norm LIKE '%KIT CAMISETA%'
                OR n.nome_norm LIKE '%CAMISETA%'
                OR n.nome_norm LIKE '%MASCULIN%'
                OR n.nome_norm LIKE '%CUECA%'
                OR n.nome_norm LIKE '%BERMUDA%'
                OR n.nome_norm LIKE '%CALCA MASC%'
                OR n.nome_norm LIKE '%CAMISETA MASC%'
                OR n.nome_norm LIKE '%REGATA MASC%'
            )
        )

        OR (
            @setor = 'moda-casa'

            AND (
                n.nome_norm LIKE '%TOALHA%'
                OR n.nome_norm LIKE '%LENCOL%'
                OR n.nome_norm LIKE '%JOGO DE CAMA%'
                OR n.nome_norm LIKE '%COLCHA%'
                OR n.nome_norm LIKE '%EDREDOM%'
                OR n.nome_norm LIKE '%EDREDON%'
                OR n.nome_norm LIKE '%TRAVESSEIRO%'
                OR n.nome_norm LIKE '%FRONHA%'
                OR n.nome_norm LIKE '%ALMOFADA%'
                OR n.nome_norm LIKE '%TAPETE%'
                OR n.nome_norm LIKE '%CORTINA%'
                OR n.nome_norm LIKE '%VARAO%'
                OR n.nome_norm LIKE '%CAPA DE SOFA%'
                OR n.nome_norm LIKE '%CAPA P/ SOFA%'
                OR n.nome_norm LIKE '%CAPA DE COLCHAO%'
                OR n.nome_norm LIKE '%PANO DE PRATO%'
                OR n.nome_norm LIKE '%PANO DE PIA%'
                OR n.nome_norm LIKE '%TOALHA DE MESA%'
                OR n.nome_norm LIKE '%POTE%'
                OR n.nome_norm LIKE '%TRAVESSA%'
                OR n.nome_norm LIKE '%GARRAFA%'
                OR n.nome_norm LIKE '%SQUEEZE%'
                OR n.nome_norm LIKE '%COPO%'
                OR n.nome_norm LIKE '%JARRA%'
                OR n.nome_norm LIKE '%PRATO%'
                OR n.nome_norm LIKE '%TALHER%'
                OR n.nome_norm LIKE '%MANTA%'
            )
        )

        OR (
            @setor = 'infantil'

            AND (
                n.nome_norm LIKE '%INFANTIL%'
                OR n.nome_norm LIKE '% INF %'
                OR n.nome_norm LIKE '%BLUSA INF%'
                OR n.nome_norm LIKE '%BLUSA INFANTIL%'
                OR n.nome_norm LIKE '%CALCA INF%'
                 OR n.nome_norm LIKE '%CALCA INFANTIL%'
                OR n.nome_norm LIKE '%JUVENIL%'
                OR n.nome_norm LIKE '%BLUSA INF%'
                OR n.nome_norm LIKE '%BLUSA JUVENIL%'
                OR n.nome_norm LIKE '%BLUSA JUV%'
                OR n.nome_norm LIKE '%CALCA JUV%'
                 OR n.nome_norm LIKE '%CALCA IJUVENIL%'
                OR n.nome_norm LIKE '%JUVENIL%'
                OR n.nome_norm LIKE '% JUV %'
                OR n.nome_norm LIKE '%KIDS%'
                OR n.nome_norm LIKE '%BABY%'
                OR n.nome_norm LIKE '%BEBE%'
                OR n.nome_norm LIKE '%4A8%'
                OR n.nome_norm LIKE '%4 A 8%'
                OR n.nome_norm LIKE '%10A14%'
                OR n.nome_norm LIKE '%10 A 14%'
                OR n.nome_norm LIKE '%10A16%'
                OR n.nome_norm LIKE '%10 A 16%'
                OR n.nome_norm LIKE '%FROZEN%'
                OR n.nome_norm LIKE '%BARBIE%'
                OR n.nome_norm LIKE '%BATMAN%'
                OR n.nome_norm LIKE '%HOMEM ARANHA%'
                OR n.nome_norm LIKE '%STITCH%'
                OR n.nome_norm LIKE '%PRINCESA%'
            )

        )

        OR (
            @setor = 'acessorios'

            AND (
                n.nome_norm LIKE '%RELOGIO%'
                OR n.nome_norm LIKE 'CINTO'
                OR n.nome_norm LIKE '%BOLSA%'
                OR n.nome_norm LIKE '%MOCHILA%'
                OR n.nome_norm LIKE '%CARTEIRA%'
                OR n.nome_norm LIKE '%MALA%'
                OR n.nome_norm LIKE '%POCHETE%'
                OR n.nome_norm LIKE '%COLAR%'
                OR n.nome_norm LIKE '%PULSEIRA%'
                OR n.nome_norm LIKE '%BRINCO%'
                OR n.nome_norm LIKE 'CORRENTE'
                OR n.nome_norm LIKE '%TIARA%'
                OR n.nome_norm LIKE '%PRESILHA%'
                OR n.nome_norm LIKE '%CHAPEU%'
                OR n.nome_norm LIKE '%VISEIRA%'
            )
        )

        OR (
            @setor = 'calcados'

            AND (
                n.nome_norm LIKE '%TENIS%'
                OR n.nome_norm LIKE '%SANDALIA%'
                OR n.nome_norm LIKE '%CHINELO%'
                OR n.nome_norm LIKE '%HAVAIANA%'
                OR n.nome_norm LIKE '%IPANEMA%'
                OR n.nome_norm LIKE '%GRENDHA%'
                OR n.nome_norm LIKE '%SAPATO%'
                OR n.nome_norm LIKE '%SAPATENIS%'
                OR n.nome_norm LIKE '%SAPATILHA%'
                OR n.nome_norm LIKE '%BOTA%'
                OR n.nome_norm LIKE '%BOTINA%'
                OR n.nome_norm LIKE '%COTURNO%'
                OR n.nome_norm LIKE '%RASTEIRA%'
                OR n.nome_norm LIKE '%TAMANCO%'
                OR n.nome_norm LIKE '%PAPETE%'
            )
        )
    )

ORDER BY item.Id DESC;
