#!/usr/bin/perl
# =========================================================================
# GERAR OS MAPAS DOS ESTADOS (site/dados/geo/<UF>.js)  — uso técnico, raro
# -------------------------------------------------------------------------
# Só precisa rodar de novo se o IBGE criar municípios novos ou se a malha mudar.
# Entrada: os arquivos geojs-<código>-mun.json do projeto github.com/tbrugz/geodata-br
#          (pasta geojson/), baixados numa pasta à parte.
# Saída:   um arquivo dados/geo/<UF>.js por estado, no formato que o painel lê.
#
# Como rodar (no Git Bash):
#   perl manutencao/ferramentas/gerar-mapas.pl <pasta-com-os-geojson> site/dados/geo [UF ...]
#
# Simplificação: Douglas-Peucker por anel, com tolerância proporcional ao tamanho
# do estado (maior dimensão / 1400). Assim todo mapa tem o mesmo nível de detalhe
# na tela (o mapa é desenhado com 640 px de largura) — para o RS isso dá ≈ 0,006°,
# a mesma tolerância usada no mapa original. Coordenadas com 4 casas (≈ 11 m).
# =========================================================================
use strict;
use warnings;
use JSON::PP;

my %UF = (
  11=>'RO',12=>'AC',13=>'AM',14=>'RR',15=>'PA',16=>'AP',17=>'TO',
  21=>'MA',22=>'PI',23=>'CE',24=>'RN',25=>'PB',26=>'PE',27=>'AL',28=>'SE',29=>'BA',
  31=>'MG',32=>'ES',33=>'RJ',35=>'SP',41=>'PR',42=>'SC',43=>'RS',
  50=>'MS',51=>'MT',52=>'GO',53=>'DF');
my %NOME = (
  RO=>'Rondônia',AC=>'Acre',AM=>'Amazonas',RR=>'Roraima',PA=>'Pará',AP=>'Amapá',TO=>'Tocantins',
  MA=>'Maranhão',PI=>'Piauí',CE=>'Ceará',RN=>'Rio Grande do Norte',PB=>'Paraíba',PE=>'Pernambuco',
  AL=>'Alagoas',SE=>'Sergipe',BA=>'Bahia',MG=>'Minas Gerais',ES=>'Espírito Santo',RJ=>'Rio de Janeiro',
  SP=>'São Paulo',PR=>'Paraná',SC=>'Santa Catarina',RS=>'Rio Grande do Sul',MS=>'Mato Grosso do Sul',
  MT=>'Mato Grosso',GO=>'Goiás',DF=>'Distrito Federal');

my ($dirIn,$dirOut,@so) = @ARGV;
die "uso: perl gerar-mapas.pl <pasta-geojson> <pasta-saida> [UF ...]\n" unless $dirIn && $dirOut;
my %filtro = map { uc($_) => 1 } @so;

sub dist_seg {   # distância do ponto p ao segmento a-b (em graus, plano)
  my ($p,$a,$b) = @_;
  my ($dx,$dy) = ($b->[0]-$a->[0], $b->[1]-$a->[1]);
  my $l2 = $dx*$dx + $dy*$dy;
  my $t = $l2 ? (($p->[0]-$a->[0])*$dx + ($p->[1]-$a->[1])*$dy)/$l2 : 0;
  $t = 0 if $t < 0; $t = 1 if $t > 1;
  my ($x,$y) = ($a->[0]+$t*$dx - $p->[0], $a->[1]+$t*$dy - $p->[1]);
  return sqrt($x*$x + $y*$y);
}
sub dp {         # Douglas-Peucker iterativo
  my ($pts,$tol) = @_;
  my $n = @$pts; return [@$pts] if $n < 3;
  my @keep = (0) x $n; $keep[0] = $keep[-1] = 1;
  my @pilha = ([0,$n-1]);
  while (my $s = pop @pilha) {
    my ($i,$j) = @$s; my ($dmax,$k) = (0,-1);
    for my $m ($i+1 .. $j-1) { my $d = dist_seg($pts->[$m],$pts->[$i],$pts->[$j]); ($dmax,$k) = ($d,$m) if $d > $dmax; }
    if ($k >= 0 && $dmax > $tol) { $keep[$k] = 1; push @pilha, [$i,$k], [$k,$j]; }
  }
  return [ map { $pts->[$_] } grep { $keep[$_] } 0 .. $n-1 ];
}
sub r4 { my $v = sprintf('%.4f', $_[0]); $v =~ s/\.?0+$//; $v = '0' if $v eq '-0'; return $v + 0; }

my $json = JSON::PP->new->utf8;
for my $cod (sort { $a <=> $b } keys %UF) {
  my $uf = $UF{$cod};
  next if %filtro && !$filtro{$uf};
  my $arq = "$dirIn/geojs-$cod-mun.json";
  unless (-f $arq) { warn "faltou $arq\n"; next; }
  open my $fh, '<:raw', $arq or die $!; local $/; my $txt = <$fh>; close $fh;
  my $gj = $json->decode($txt);

  # tamanho do estado → tolerância
  my ($x0,$x1,$y0,$y1) = (999,-999,999,-999);
  my @munis;
  for my $f (@{ $gj->{features} }) {
    my $g = $f->{geometry} or next;
    my $polys = $g->{type} eq 'Polygon' ? [ $g->{coordinates} ] : $g->{coordinates};
    for my $p (@$polys) { for my $r (@$p) { for my $pt (@$r) {
      $x0 = $pt->[0] if $pt->[0] < $x0; $x1 = $pt->[0] if $pt->[0] > $x1;
      $y0 = $pt->[1] if $pt->[1] < $y0; $y1 = $pt->[1] if $pt->[1] > $y1; } } }
    push @munis, { id => substr($f->{properties}{id},0,6), name => $f->{properties}{name}, polys => $polys };
  }
  my $ext = ($x1-$x0) > ($y1-$y0) ? ($x1-$x0) : ($y1-$y0);
  my $tol = $ext/1400;

  my @linhas;
  for my $m (sort { $a->{id} cmp $b->{id} } @munis) {
    my @out;
    for my $p (@{ $m->{polys} }) {
      my @aneis;
      for my $i (0 .. $#$p) {
        my $s = dp($p->[$i], $tol);
        my @r = map { [ r4($_->[0]), r4($_->[1]) ] } @$s;
        my @u; for (@r) { push @u, $_ unless @u && $u[-1][0] == $_->[0] && $u[-1][1] == $_->[1]; }
        next if @u < 4;                            # buraco/ilha minúscula: some
        push @aneis, \@u;
      }
      push @out, \@aneis if @aneis;
    }
    # município muito pequeno que sumiu na simplificação: guarda o contorno sem simplificar
    @out = map { [ map { [ map { [ r4($_->[0]), r4($_->[1]) ] } @$_ ] } @$_ ] } @{ $m->{polys} } unless @out;
    push @linhas, JSON::PP->new->utf8->canonical->encode({ id => $m->{id}, name => $m->{name}, polys => \@out });
  }
  # JSON::PP canonical ordena as chaves (id, name, polys) — o mesmo formato do arquivo do RS
  my $saida = "$dirOut/$uf.js";
  open my $o, '>:raw', $saida or die $!;
  my $cab = "/* Contornos simplificados dos municípios de $NOME{$uf} — usados só pelo mapa.\n".
    "   Fonte: IBGE, via github.com/tbrugz/geodata-br, simplificado (tolerância ".sprintf('%.4f',$tol)."°).\n".
    "   Cada item: id = código IBGE de 6 dígitos; polys = polígonos [longitude, latitude].\n".
    "   Gerado por manutencao/ferramentas/gerar-mapas.pl — NÃO editar à mão. */\n";
  print $o $cab, "PainelDados.registrarGeo('$uf',[\n", join(",\n", @linhas), "\n]);\n";
  close $o;
  printf "%s  %4d municípios  tol %.4f°  %6.0f KB\n", $uf, scalar(@linhas), $tol, (-s $saida)/1024;
}
