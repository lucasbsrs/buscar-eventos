-- Atualiza o evento Anime Friends 2026 com dados do site oficial (animefriends.com.br)
update eventos
set
  descricao     = 'O maior festival de cultura japonesa do Brasil, realizado no Distrito Anhembi em São Paulo. Música, cosplay, cultura pop japonesa e muito mais.',
  data_inicio   = '2026-07-02T10:00:00-03:00',
  data_fim      = '2026-07-05T21:00:00-03:00',
  local         = 'Distrito Anhembi',
  endereco      = 'Av. Olavo Fontoura, 1209 - Santana',
  site_url      = 'https://animefriends.com.br/',
  imagem_url    = 'https://animefriends.com.br/wp-content/uploads/2026/02/anime_friends26-logo-chamada.svg'
where nome = 'Anime Friends 2026';
