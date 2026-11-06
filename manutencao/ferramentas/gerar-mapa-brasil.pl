#!/usr/bin/perl
# =========================================================================
# GERAR O MAPA DO BRASIL POR ESTADO (site/dados/geo/BR.js)  — uso técnico, raro
# -------------------------------------------------------------------------
# Entrada: contornos dos estados da API de malhas do IBGE, baixados à parte:
#   https://servicodados.ibge.gov.br/api/v3/malhas/paises/BR?intrarregiao=UF&formato=application/vnd.geo%2Bjson&qualidade=minima
# Como rodar (no Git Bash):
#   perl manutencao/ferramentas/gerar-mapa-brasil.pl <arquivo.json> site/dados/geo/BR.js
# Cada item sai com id = sigla do estado (RS, SP…), no mesmo formato dos mapas dos estados.
# =========================================================================
use strict;
use warnings;
use JSON::PP;

my %UF = (
  11=>'RO',12=>'AC',13=>'AM',14=>'RR',15=>'PA',16=>'AP',17=>'TO',
  21=>'MA',22=>'PI',23=>'CE',24=>'RN',25=>'PB',26=>'PE',27=>'AL',28=>'SE',29=>'BA',
  31=>'MG',32=>'ES',33=>'RJ',35=>'SP',41=>'PR',42=>'SC',43=>'RS',
  50=>'MS',51=>'MT',52=>'GO',53=>'DF');

my ($in,$out) = @ARGV;
die "uso: perl gerar-mapa-brasil.pl <arquivo.json> <saida.js>\n" unless $in && $out;
open my $fh, '<:raw', $in or die $!; local $/; my $gj = JSON::PP->new->utf8->decode(<$fh>); close $fh;

sub r2 { my $v = sprintf('%.2f', $_[0]); $v =~ s/\.?0+$//; return $v + 0; }   # ≈ 1 km: suficiente para o mapa do país
my @linhas;
for my $f (@{ $gj->{features} }) {
  my $cod = $f->{properties}{codarea} or next;
  my $uf = $UF{$cod} or next;
  my $g = $f->{geometry};
  my $polys = $g->{type} eq 'Polygon' ? [ $g->{coordinates} ] : $g->{coordinates};
  my @out;
  for my $p (@$polys) {
    my @aneis;
    for my $r (@$p) {
      my @u; for my $pt (@$r) { my @q = (r2($pt->[0]), r2($pt->[1])); push @u, \@q unless @u && $u[-1][0] == $q[0] && $u[-1][1] == $q[1]; }
      push @aneis, \@u if @u >= 4;
    }
    push @out, \@aneis if @aneis;
  }
  push @linhas, JSON::PP->new->utf8->canonical->encode({ id => $uf, name => $uf, polys => \@out });
}
open my $o, '>:raw', $out or die $!;
print $o "/* Contornos simplificados dos estados do Brasil — usados só pelo mapa da tela inicial.\n",
  "   Fonte: IBGE, API de malhas (qualidade mínima). id = sigla do estado.\n",
  "   Gerado por manutencao/ferramentas/gerar-mapa-brasil.pl — NÃO editar à mão. */\n",
  "PainelDados.registrarGeo('BR',[\n", join(",\n", sort @linhas), "\n]);\n";
close $o;
printf "%d estados, %.0f KB\n", scalar(@linhas), (-s $out)/1024;
