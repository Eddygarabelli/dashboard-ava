# -*- coding: utf-8 -*-
"""
Gera o PDF "Gatinho Siames Amigurumi - Tutorial Ponto a Ponto".
Uso: python3 gerar_tutorial_gato_siames.py
"""
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY
from reportlab.platypus import (BaseDocTemplate, PageTemplate, Frame, Paragraph,
                                Spacer, Table, TableStyle, PageBreak, NextPageTemplate, KeepTogether,
                                ListFlowable, ListItem)
from reportlab.graphics.shapes import (Drawing, Circle, Ellipse, Rect, Polygon,
                                       String, Line, Path, Group)
from reportlab.graphics import renderPDF

# ---------------------------------------------------------------- paleta
MARROM   = colors.HexColor('#4A342B')   # marrom escuro (pontas siamesas)
MARROM_C = colors.HexColor('#6B4C3B')
CREME    = colors.HexColor('#D9BFA3')   # corpo bege/creme
CREME_CL = colors.HexColor('#F0E2D0')
AZUL     = colors.HexColor('#1E7A9C')   # olhos
AZUL_CL  = colors.HexColor('#7FC3D8')
PAPEL    = colors.HexColor('#FFFCF7')
CINZA    = colors.HexColor('#7A6E64')
LINHA    = colors.HexColor('#E3D6C6')

PW, PH = A4
MARGEM = 18 * mm

# ---------------------------------------------------------------- estilos
def S(name, **kw):
    base = dict(fontName='Helvetica', fontSize=9.5, leading=13.5,
                textColor=colors.HexColor('#2E2721'))
    base.update(kw)
    return ParagraphStyle(name, **base)

st_titulo   = S('titulo', fontName='Helvetica-Bold', fontSize=30, leading=34,
                textColor=MARROM, alignment=TA_CENTER)
st_sub      = S('sub', fontSize=12.5, leading=17, textColor=MARROM_C, alignment=TA_CENTER)
st_h1       = S('h1', fontName='Helvetica-Bold', fontSize=16, leading=20, textColor=MARROM,
                spaceBefore=2, spaceAfter=6)
st_h2       = S('h2', fontName='Helvetica-Bold', fontSize=11.5, leading=15, textColor=MARROM_C,
                spaceBefore=9, spaceAfter=3)
st_corpo    = S('corpo', alignment=TA_JUSTIFY, spaceAfter=4)
st_peq      = S('peq', fontSize=8.3, leading=11.5, textColor=CINZA)
st_peqc     = S('peqc', fontSize=8.3, leading=11.5, textColor=CINZA, alignment=TA_CENTER)
st_cel      = S('cel', fontSize=9, leading=12)
st_celb     = S('celb', fontSize=9, leading=12, fontName='Helvetica-Bold')
st_celc     = S('celc', fontSize=9, leading=12, alignment=TA_CENTER)
st_cabtab   = S('cabtab', fontSize=9, leading=12, fontName='Helvetica-Bold',
                textColor=colors.white)
st_dica     = S('dica', fontSize=9, leading=12.5, alignment=TA_JUSTIFY)
st_dicat    = S('dicat', fontSize=9, leading=12.5, fontName='Helvetica-Bold', textColor=MARROM)

# ---------------------------------------------------------------- helpers
def P(t, s=st_corpo):
    return Paragraph(t, s)

def bullets(itens, style=st_corpo, bullet='•'):
    return ListFlowable([ListItem(Paragraph(i, style), leftIndent=12) for i in itens],
                        bulletType='bullet', start=bullet, leftIndent=12,
                        bulletFontSize=8, bulletOffsetY=0)

def numerada(itens, style=st_corpo):
    return ListFlowable([ListItem(Paragraph(i, style), leftIndent=14) for i in itens],
                        bulletType='1', leftIndent=14, bulletFontName='Helvetica-Bold',
                        bulletFontSize=9.5)

def caixa(titulo, texto, cor_fundo=CREME_CL, cor_borda=CREME):
    """Caixa de destaque (dica / atencao)."""
    interno = []
    if titulo:
        interno.append(Paragraph(titulo, st_dicat))
    interno.append(Paragraph(texto, st_dica))
    t = Table([[interno]], colWidths=[PW - 2 * MARGEM])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), cor_fundo),
        ('BOX', (0, 0), (-1, -1), 0.9, cor_borda),
        ('LEFTPADDING', (0, 0), (-1, -1), 9),
        ('RIGHTPADDING', (0, 0), (-1, -1), 9),
        ('TOPPADDING', (0, 0), (-1, -1), 7),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 7),
    ]))
    return t

def tabela_carreiras(linhas, largura=None, cor=MARROM):
    """linhas = [(carreira, instrucao, total), ...]"""
    largura = largura or (PW - 2 * MARGEM)
    dados = [[Paragraph('Carr.', st_cabtab), Paragraph('Instru&ccedil;&atilde;o', st_cabtab),
              Paragraph('Total', st_cabtab)]]
    for c, i, t in linhas:
        dados.append([Paragraph(c, st_celb), Paragraph(i, st_cel), Paragraph(t, st_celc)])
    tb = Table(dados, colWidths=[largura * 0.14, largura * 0.72, largura * 0.14],
               repeatRows=1, hAlign='LEFT')
    estilo = [
        ('BACKGROUND', (0, 0), (-1, 0), cor),
        ('GRID', (0, 0), (-1, -1), 0.5, LINHA),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 3.5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3.5),
    ]
    for r in range(1, len(dados)):
        if r % 2 == 0:
            estilo.append(('BACKGROUND', (0, r), (-1, r), colors.HexColor('#FAF5EE')))
    tb.setStyle(TableStyle(estilo))
    return tb

def tabela_simples(cabecalho, linhas, pesos, cor=MARROM_C):
    largura = PW - 2 * MARGEM
    dados = [[Paragraph(h, st_cabtab) for h in cabecalho]]
    for ln in linhas:
        dados.append([Paragraph(c, st_cel) for c in ln])
    tb = Table(dados, colWidths=[largura * p for p in pesos], repeatRows=1, hAlign='LEFT')
    estilo = [
        ('BACKGROUND', (0, 0), (-1, 0), cor),
        ('GRID', (0, 0), (-1, -1), 0.5, LINHA),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]
    for r in range(1, len(dados)):
        if r % 2 == 0:
            estilo.append(('BACKGROUND', (0, r), (-1, r), colors.HexColor('#FAF5EE')))
    tb.setStyle(TableStyle(estilo))
    return tb

# ---------------------------------------------------------------- desenhos
def desenho_gato(w=150, h=200, badges=None):
    """Esquema vetorial do gatinho siames. badges = lista de (numero, x_rel, y_rel)."""
    d = Drawing(w, h)
    cx = w / 2.0
    R = 0.155 * h                      # raio da cabeca
    hy = 0.70 * h                      # centro da cabeca
    by = 0.36 * h                      # centro do corpo
    brx, bry = 0.145 * h, 0.160 * h    # raios do corpo

    # --- rabo (atras de tudo)
    p = Path(strokeColor=MARROM, strokeWidth=0.032 * h, fillColor=None, strokeLineCap=1)
    p.moveTo(cx + 0.12 * h, by - 0.02 * h)
    p.curveTo(cx + 0.24 * h, by - 0.02 * h, cx + 0.27 * h, by + 0.14 * h,
              cx + 0.20 * h, by + 0.18 * h)
    p.curveTo(cx + 0.155 * h, by + 0.21 * h, cx + 0.145 * h, by + 0.11 * h,
              cx + 0.195 * h, by + 0.10 * h)
    d.add(p)

    # --- patas dianteiras (atras do corpo, para o topo sumir dentro dele)
    lw, lh = 0.058 * h, 0.30 * h
    for dx in (-0.062 * h, 0.062 * h):
        d.add(Rect(cx + dx - lw / 2, 0.09 * h, lw, lh, rx=lw / 2, ry=lw / 2,
                   fillColor=CREME, strokeColor=MARROM_C, strokeWidth=0.9))
        d.add(Rect(cx + dx - lw / 2, 0.09 * h, lw, 0.13 * h, rx=lw / 2, ry=lw / 2,
                   fillColor=MARROM, strokeColor=MARROM_C, strokeWidth=0.9))

    # --- corpo
    d.add(Ellipse(cx, by, brx, bry, fillColor=CREME, strokeColor=MARROM_C, strokeWidth=1))

    # --- patinhas traseiras
    for dx in (-0.138 * h, 0.138 * h):
        d.add(Ellipse(cx + dx, 0.115 * h, 0.045 * h, 0.030 * h, fillColor=MARROM,
                      strokeColor=MARROM_C, strokeWidth=0.9))

    # --- orelhas (antes da cabeca: a base fica escondida)
    d.add(Polygon([cx - 0.98 * R, hy + 0.42 * R, cx - 0.88 * R, hy + 1.34 * R,
                   cx - 0.24 * R, hy + 0.80 * R],
                  fillColor=MARROM, strokeColor=MARROM_C, strokeWidth=1))
    d.add(Polygon([cx + 0.98 * R, hy + 0.42 * R, cx + 0.88 * R, hy + 1.34 * R,
                   cx + 0.24 * R, hy + 0.80 * R],
                  fillColor=MARROM, strokeColor=MARROM_C, strokeWidth=1))

    # --- cabeca
    d.add(Circle(cx, hy, R, fillColor=CREME, strokeColor=MARROM_C, strokeWidth=1))
    d.add(Ellipse(cx, hy - 0.18 * R, 0.64 * R, 0.56 * R, fillColor=MARROM, strokeColor=None))

    # --- olhos
    for dx in (-0.33 * R, 0.33 * R):
        d.add(Circle(cx + dx, hy + 0.06 * R, 0.195 * R, fillColor=AZUL_CL, strokeColor=None))
        d.add(Circle(cx + dx, hy + 0.06 * R, 0.150 * R,
                     fillColor=colors.HexColor('#12303B'), strokeColor=None))
        d.add(Circle(cx + dx - 0.05 * R, hy + 0.11 * R, 0.045 * R,
                     fillColor=colors.white, strokeColor=None))

    # --- focinho e bigodes
    d.add(Polygon([cx - 0.08 * R, hy - 0.27 * R, cx + 0.08 * R, hy - 0.27 * R,
                   cx, hy - 0.36 * R], fillColor=colors.HexColor('#2A1D16'), strokeColor=None))
    for lado in (-1, 1):
        for ang in (0.15, -0.09, -0.33):
            d.add(Line(cx + lado * 0.12 * R, hy - 0.33 * R,
                       cx + lado * 0.80 * R, hy - 0.33 * R + ang * R,
                       strokeColor=colors.HexColor('#2A1D16'), strokeWidth=0.8))

    # --- numeros de montagem sobre o desenho
    for n, xr, yr in (badges or []):
        x, y = cx + xr * h, yr * h
        d.add(Circle(x, y, 0.042 * h, fillColor=colors.white, strokeColor=MARROM,
                     strokeWidth=1.4))
        d.add(String(x, y - 0.018 * h, str(n), fontName='Helvetica-Bold',
                     fontSize=0.045 * h, fillColor=MARROM, textAnchor='middle'))
    return d


def desenho_cabeca_olhos(w=430, h=215):
    """Diagrama de posicionamento da mascara e dos olhos na cabeca."""
    d = Drawing(w, h)
    cx, cy, R = w * 0.34, h * 0.47, 68

    d.add(Circle(cx, cy, R, fillColor=CREME_CL, strokeColor=MARROM_C, strokeWidth=1))

    # carreiras de referencia, com etiqueta escalonada a direita
    refs = [(cy + 30, 'Carreira 8', 0), (cy + 5, 'Carreira 11', 8),
            (cy - 7, 'Carreira 12', -8), (cy - 34, 'Carreira 16 (parar aqui)', 0)]
    for yy, txt, desloc in refs:
        meia = (R ** 2 - (yy - cy) ** 2) ** 0.5
        d.add(Line(cx - meia, yy, cx + R + 14, yy, strokeColor=LINHA, strokeWidth=0.7,
                   strokeDashArray=[2, 2]))
        d.add(Line(cx + R + 14, yy, cx + R + 22, yy + desloc, strokeColor=LINHA,
                   strokeWidth=0.7))
        d.add(String(cx + R + 25, yy + desloc - 2.4, txt, fontName='Helvetica',
                     fontSize=7.4, fillColor=CINZA))

    # mascara, com etiqueta a esquerda
    d.add(Ellipse(cx, cy - 8, 42, 35, fillColor=MARROM, strokeColor=None))
    d.add(Line(cx - 36, cy - 26, cx - R - 26, cy - 50, strokeColor=CINZA, strokeWidth=0.7))
    d.add(String(cx - R - 30, cy - 62, 'máscara marrom', fontName='Helvetica-Bold',
                 fontSize=7.4, fillColor=MARROM, textAnchor='end'))
    d.add(String(cx - R - 30, cy - 71, 'aplicada por cima', fontName='Helvetica',
                 fontSize=7.4, fillColor=CINZA, textAnchor='end'))

    # olhos
    for dx in (-20, 20):
        d.add(Circle(cx + dx, cy - 2, 10, fillColor=AZUL_CL, strokeColor=None))
        d.add(Circle(cx + dx, cy - 2, 7.6, fillColor=colors.HexColor('#12303B'),
                     strokeColor=None))
        d.add(Line(cx + dx, cy + 10, cx + dx, cy + R + 16, strokeColor=AZUL,
                   strokeWidth=0.6, strokeDashArray=[2, 2]))

    # cota dos 7 pontos, acima da cabeca
    ytop = cy + R + 16
    d.add(Line(cx - 20, ytop, cx + 20, ytop, strokeColor=AZUL, strokeWidth=1))
    for dx in (-20, 20):
        d.add(Line(cx + dx, ytop - 3.5, cx + dx, ytop + 3.5, strokeColor=AZUL, strokeWidth=1))
    d.add(String(cx, ytop + 7, '7 pontos de distância', fontName='Helvetica-Bold',
                 fontSize=8, fillColor=AZUL, textAnchor='middle'))

    d.add(String(w / 2.0, 4, 'Marque com alfinetes e confira a simetria antes de travar os olhos.',
                 fontName='Helvetica', fontSize=7.4, fillColor=CINZA, textAnchor='middle'))
    return d


def desenho_montagem(w=430, h=215):
    """Mapa de montagem: numeros sobre o desenho + legenda ao lado."""
    d = Drawing(w, h)
    badges = [(1, 0.00, 0.525),    # pescoco
              (2, 0.085, 0.865),   # orelha
              (3, -0.062, 0.175),  # pata dianteira
              (4, 0.185, 0.500),   # rabo
              (5, 0.138, 0.115),   # patinha traseira
              (6, 0.000, 0.660)]   # rosto
    g = desenho_gato(190, h, badges=badges)
    g.translate(6, 0)
    d.add(g)

    legenda = ['Cabeça costurada no corpo (2 voltas)',
               'Orelhas — carreiras 5 a 7 do topo',
               'Patas dianteiras, abaixo do pescoço',
               'Rabo, na lateral traseira do corpo',
               'Patinhas traseiras, na frente da base',
               'Bordado do rosto e bigodes']
    x = w * 0.50
    y = h * 0.82
    for i, txt in enumerate(legenda):
        d.add(Circle(x, y, 7.5, fillColor=MARROM, strokeColor=None))
        d.add(String(x, y - 2.7, str(i + 1), fontName='Helvetica-Bold', fontSize=8.4,
                     fillColor=colors.white, textAnchor='middle'))
        d.add(String(x + 13, y - 2.7, txt, fontName='Helvetica', fontSize=8.4,
                     fillColor=colors.HexColor('#2E2721')))
        y -= 22
    return d


def desenho_paleta(w=430, h=64):
    d = Drawing(w, h)
    dados = [(MARROM, 'Marrom escuro', 'Orelhas, máscara, patas, rabo — 30 g'),
             (CREME, 'Bege / creme', 'Cabeça, corpo, patas — 50 g'),
             (AZUL, 'Azul (linha fina)', 'Contorno bordado dos olhos — 1 novelo')]
    x = 0
    lar = w / 3.0
    for cor, nome, uso in dados:
        d.add(Rect(x + 4, h - 30, 26, 26, rx=4, ry=4, fillColor=cor,
                   strokeColor=colors.HexColor('#00000022')))
        d.add(String(x + 36, h - 14, nome, fontName='Helvetica-Bold', fontSize=8.2,
                     fillColor=MARROM))
        d.add(String(x + 36, h - 25, uso[:34], fontName='Helvetica', fontSize=6.6,
                     fillColor=CINZA))
        if len(uso) > 34:
            d.add(String(x + 36, h - 34, uso[34:], fontName='Helvetica', fontSize=6.6,
                         fillColor=CINZA))
        x += lar
    return d

def desenho_rosto(w=430, h=200):
    """Mapa do bordado do rosto, com as medidas em pontos."""
    d = Drawing(w, h)
    cx, cy, R = w * 0.34, h * 0.50, 76
    d.add(Circle(cx, cy, R, fillColor=CREME_CL, strokeColor=MARROM_C, strokeWidth=1))
    d.add(Ellipse(cx, cy - 9, 47, 39, fillColor=MARROM, strokeColor=None))

    olho_y = cy + 1
    for dx in (-22, 22):
        d.add(Circle(cx + dx, olho_y, 13, fillColor=AZUL, strokeColor=None))      # contorno
        d.add(Circle(cx + dx, olho_y, 10.5, fillColor=colors.HexColor('#12303B'),
                     strokeColor=None))
        d.add(Circle(cx + dx - 2.6, olho_y + 3.4, 2.6, fillColor=colors.white,
                     strokeColor=None))

    # nariz
    ny = cy - 20
    d.add(Polygon([cx - 5, ny + 3, cx + 5, ny + 3, cx, ny - 4],
                  fillColor=colors.HexColor('#241812'), strokeColor=None))
    # boca
    d.add(Line(cx, ny - 4, cx, ny - 11, strokeColor=colors.HexColor('#241812'),
               strokeWidth=1.3))
    bo = Path(strokeColor=colors.HexColor('#241812'), strokeWidth=1.3, fillColor=None)
    bo.moveTo(cx - 9, ny - 8)
    bo.curveTo(cx - 6, ny - 13, cx - 2, ny - 13, cx, ny - 11)
    bo.curveTo(cx + 2, ny - 13, cx + 6, ny - 13, cx + 9, ny - 8)
    d.add(bo)
    # bigodes
    for lado in (-1, 1):
        for ang in (7, -1, -9):
            d.add(Line(cx + lado * 8, ny - 6, cx + lado * 62, ny - 6 + ang,
                       strokeColor=colors.HexColor('#241812'), strokeWidth=1))

    # etiquetas
    def etiqueta(x1, y1, x2, y2, txt, anchor='start'):
        d.add(Line(x1, y1, x2, y2, strokeColor=CINZA, strokeWidth=0.7))
        d.add(String(x2 + (4 if anchor == 'start' else -4), y2 - 2.6, txt,
                     fontName='Helvetica', fontSize=7.4, fillColor=CINZA,
                     textAnchor=anchor))
    etiqueta(cx + 33, olho_y + 8, cx + R + 22, cy + 56,
             'contorno azul bordado em ponto haste')
    etiqueta(cx + 5, ny, cx + R + 22, cy + 24, 'nariz: 4 a 5 pontos horizontais')
    etiqueta(cx + 9, ny - 10, cx + R + 22, cy - 8, 'boca em dois arcos')
    etiqueta(cx + 50, ny - 8, cx + R + 22, cy - 40, '3 bigodes de cada lado, 3 cm')
    etiqueta(cx - 40, cy - 34, cx - R - 14, cy - 58, 'máscara marrom', anchor='end')

    d.add(String(w / 2.0, 4, 'Faça o bordado com a cabeça ainda vazia — os nós ficam '
                 'escondidos por dentro.', fontName='Helvetica', fontSize=7.4,
                 fillColor=CINZA, textAnchor='middle'))
    return d


def centrado(drawing):
    t = Table([[drawing]], colWidths=[PW - 2 * MARGEM])
    t.setStyle(TableStyle([('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                           ('LEFTPADDING', (0, 0), (-1, -1), 0),
                           ('RIGHTPADDING', (0, 0), (-1, -1), 0)]))
    return t

# ---------------------------------------------------------------- documento
class Doc(BaseDocTemplate):
    def __init__(self, path):
        BaseDocTemplate.__init__(self, path, pagesize=A4,
                                 leftMargin=MARGEM, rightMargin=MARGEM,
                                 topMargin=20 * mm, bottomMargin=18 * mm,
                                 title='Gatinho Siamês Amigurumi — Tutorial Ponto a Ponto',
                                 author='Tutorial de crochê',
                                 subject='Receita de amigurumi passo a passo')
        frame = Frame(MARGEM, 18 * mm, PW - 2 * MARGEM, PH - 38 * mm, id='f')
        self.addPageTemplates([
            PageTemplate(id='capa', frames=[frame], onPage=self.fundo_capa),
            PageTemplate(id='miolo', frames=[frame], onPage=self.rodape),
        ])

    def fundo_capa(self, c, doc):
        c.saveState()
        c.setFillColor(PAPEL)
        c.rect(0, 0, PW, PH, stroke=0, fill=1)
        c.setFillColor(CREME_CL)
        c.rect(0, PH - 16 * mm, PW, 16 * mm, stroke=0, fill=1)
        c.setFillColor(MARROM)
        c.rect(0, 0, PW, 10 * mm, stroke=0, fill=1)
        c.restoreState()

    def rodape(self, c, doc):
        c.saveState()
        c.setFillColor(PAPEL)
        c.rect(0, 0, PW, PH, stroke=0, fill=1)
        c.setStrokeColor(LINHA)
        c.setLineWidth(0.6)
        c.line(MARGEM, PH - 15 * mm, PW - MARGEM, PH - 15 * mm)
        c.line(MARGEM, 13 * mm, PW - MARGEM, 13 * mm)
        c.setFont('Helvetica', 7.5)
        c.setFillColor(CINZA)
        c.drawString(MARGEM, PH - 13 * mm, 'Gatinho Siamês Amigurumi — tutorial ponto a ponto')
        c.drawRightString(PW - MARGEM, 9 * mm, 'página %d' % (doc.page - 1))
        c.drawString(MARGEM, 9 * mm, 'Fio 4/6 (algodão) · agulha 2,5 mm · aprox. 17 cm')
        c.restoreState()

# ---------------------------------------------------------------- conteudo
E = []

# ======================= CAPA =======================
E.append(Spacer(1, 6 * mm))
E.append(P('RECEITA DE AMIGURUMI · NÍVEL INICIANTE / INTERMEDIÁRIO',
           S('k', fontSize=8.6, alignment=TA_CENTER, textColor=CINZA,
             fontName='Helvetica-Bold')))
E.append(Spacer(1, 5 * mm))
E.append(P('Gatinho Siamês', st_titulo))
E.append(P('Tutorial ponto a ponto', S('t2', fontName='Helvetica', fontSize=17,
                                       leading=21, textColor=MARROM_C, alignment=TA_CENTER)))
E.append(Spacer(1, 6 * mm))
E.append(centrado(desenho_gato(200, 250)))
E.append(Spacer(1, 4 * mm))
E.append(P('Esquema das peças e da distribuição de cores (não está em escala)', st_peqc))
E.append(Spacer(1, 7 * mm))

ficha = [
    ['Tamanho final', 'aprox. 17 cm sentado (varia com o fio e a tensão)'],
    ['Tempo estimado', '5 a 6 horas de trabalho, divididas em 4 sessões'],
    ['Nível', 'Iniciante com noções de anel mágico, aumento e diminuição'],
    ['Peças', '9 peças: cabeça, máscara, 2 orelhas, corpo, 2 patas dianteiras, 2 patinhas traseiras e rabo'],
    ['Técnica', 'Crochê em espiral contínua, ponto baixo, tensão firme'],
]
tb = Table([[Paragraph(a, st_celb), Paragraph(b, st_cel)] for a, b in ficha],
           colWidths=[(PW - 2 * MARGEM) * 0.26, (PW - 2 * MARGEM) * 0.74])
tb.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, -1), CREME_CL),
    ('BOX', (0, 0), (-1, -1), 0.9, CREME),
    ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.white),
    ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ('LEFTPADDING', (0, 0), (-1, -1), 8),
    ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ('TOPPADDING', (0, 0), (-1, -1), 5),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
]))
E.append(tb)
E.append(Spacer(1, 7 * mm))
E.append(P('O QUE VOCÊ VAI ENCONTRAR', S('tt', fontSize=8.6, alignment=TA_CENTER,
                                         textColor=CINZA, fontName='Helvetica-Bold')))
E.append(Spacer(1, 3 * mm))
_sumario = [['1. O plano de trabalho', '8. Patas e rabo'],
            ['2. Materiais e paleta de cores', '9. O rosto — olhos e bordado'],
            ['3. Abreviaturas e técnicas', '10. Montagem'],
            ['4. Cabeça', '11. Acabamento'],
            ['5. Máscara facial', '12. Solução de problemas'],
            ['6. Orelhas', '13. Checklist final'],
            ['7. Corpo', '']]
_t = Table([[Paragraph(a, st_cel), Paragraph(b, st_cel)] for a, b in _sumario],
           colWidths=[(PW - 2 * MARGEM) * 0.5] * 2)
_t.setStyle(TableStyle([('LEFTPADDING', (0, 0), (-1, -1), 10),
                        ('TOPPADDING', (0, 0), (-1, -1), 2.5),
                        ('BOTTOMPADDING', (0, 0), (-1, -1), 2.5)]))
E.append(_t)
E.append(NextPageTemplate('miolo'))
E.append(PageBreak())

# ======================= 1. PLANO =======================
E.append(P('1. O plano de trabalho', st_h1))
E.append(P('Antes de começar, entenda a lógica da peça. O gatinho siamês é feito em '
           '<b>bege/creme</b> com as chamadas <i>pontas siamesas</i> em <b>marrom escuro</b>: '
           'orelhas, máscara do rosto, patinhas e rabo. Todas as peças são trabalhadas '
           'em espiral contínua (sem fechar carreira) e depois costuradas. A cabeça é '
           'propositalmente grande em relação ao corpo — é isso que dá o ar '
           'de filhote.'))
E.append(Spacer(1, 3 * mm))
E.append(P('Cronograma sugerido', st_h2))
E.append(tabela_simples(
    ['Sessão', 'O que fazer', 'Tempo'],
    [['Sessão 1', 'Amostra de tensão + cabeça completa (até fechar)', '~1h30'],
     ['Sessão 2', 'Máscara, orelhas, colocação dos olhos e bordado do rosto', '~1h'],
     ['Sessão 3', 'Corpo, patas dianteiras, patinhas traseiras e rabo', '~1h30'],
     ['Sessão 4', 'Montagem, ajustes de simetria e acabamento', '~1h']],
    [0.14, 0.68, 0.18]))
E.append(Spacer(1, 4 * mm))
E.append(P('Ordem de execução (siga exatamente esta sequência)', st_h2))
E.append(numerada([
    '<b>Cabeça</b> — é a peça mais difícil; faça com a mão descansada.',
    '<b>Máscara facial</b> — costurada na cabeça <i>antes</i> de travar os olhos.',
    '<b>Olhos de segurança</b> — atravessam a máscara e a cabeça juntas.',
    '<b>Bordado do rosto</b> — nariz, boca, contorno azul e bigodes, com a cabeça ainda vazia (a agulha entra com folga).',
    '<b>Encher e fechar a cabeça.</b>',
    '<b>Orelhas</b>, <b>corpo</b>, <b>patas</b>, <b>patinhas</b> e <b>rabo</b>.',
    '<b>Montagem final.</b>']))
E.append(Spacer(1, 4 * mm))
E.append(caixa('Por que bordar antes de encher?',
               'Com a cabeça vazia você passa a agulha de um lado ao outro sem esforço, '
               'esconde os nós por dentro e ainda pode desmanchar se o rosto não ficar '
               'simétrico. Depois de cheia, cada erro custa dez minutos.'))
E.append(Spacer(1, 5 * mm))

# ======================= 2. MATERIAIS =======================
E.append(P('2. Materiais', st_h1))
E.append(centrado(desenho_paleta(PW - 2 * MARGEM, 68)))
E.append(Spacer(1, 3 * mm))
E.append(tabela_simples(
    ['Material', 'Especificação', 'Quantidade'],
    [['Fio de algodão bege/creme', 'Fio 4/6 para amigurumi (Amigurumi Círculo, Anne, Camila Fashion ou similar)', '1 novelo (50 g)'],
     ['Fio de algodão marrom escuro', 'Mesma marca e espessura do bege — misturar marcas muda o tamanho', '1 novelo (30 g)'],
     ['Agulha de crochê', '2,5 mm (ou 2,0 mm se o seu ponto for frouxo)', '1'],
     ['Olhos de segurança azuis', '12 mm, com trava plástica', '1 par'],
     ['Linha azul-clara fina', 'Linha de bordar (mouline) ou Cléa 1000, para o contorno dos olhos', '1'],
     ['Linha marrom escura fina', 'Para nariz, boca e bigodes', '1'],
     ['Enchimento', 'Fibra siliconada antialérgica', '~40 g'],
     ['Agulha de tapeçaria', 'Ponta romba, buraco grande', '1'],
     ['Marcador de ponto', 'Ou um pedaço de fio em cor contrastante', '2'],
     ['Alfinetes de cabeça', 'Para posicionar peças antes de costurar', '6 a 8'],
     ['Limpador de cachimbo (opcional)', 'Para dar curvatura ao rabo', '1'],
     ['Tesoura e fita métrica', '—', '1 de cada']],
    [0.28, 0.52, 0.20]))
E.append(Spacer(1, 4 * mm))
E.append(caixa('Amostra de tensão — faça antes de tudo',
               'Trabalhe um círculo de 4 carreiras (6 / 12 / 18 / 24 pontos). Ele deve medir '
               'entre <b>4,5 e 5 cm</b> de diâmetro e não pode deixar ver luz através '
               'dos pontos. Se estiver maior ou vazado, troque para uma agulha 2,0 mm. Se estiver '
               'muito duro e travando a mão, suba para 3,0 mm. Toda a receita muda de tamanho '
               'junto — e isso não é problema, desde que seja a mesma agulha do começo ao fim.'))
E.append(Spacer(1, 6 * mm))

# ======================= 3. ABREVIATURAS =======================
E.append(P('3. Abreviaturas e como ler a receita', st_h1))
E.append(tabela_simples(
    ['Sigla', 'Significado', 'Como se faz'],
    [['MA', 'Anel mágico', 'Laçada ajustável onde se trabalha a 1ª carreira; puxe o fio para fechar o buraco'],
     ['corr', 'Corrente', 'Ponto de base'],
     ['pb', 'Ponto baixo', 'Agulha no ponto, laçada, puxa; laçada, passa pelas 2 alças'],
     ['aum', 'Aumento', '2 pontos baixos <b>no mesmo</b> ponto'],
     ['dim', 'Diminuição invisível', 'Pegue só a alça da frente de 2 pontos seguidos e feche como um pb'],
     ['pbx', 'Ponto baixíssimo', 'Ponto de arremate, sem altura'],
     ['(...) x6', 'Repetição', 'Repita a sequência entre parênteses 6 vezes'],
     ['[24]', 'Total de pontos', 'Quantidade de pontos que a carreira deve ter ao terminar'],
     ['MP', 'Marcador de ponto', 'Marca o 1º ponto da carreira — mova a cada volta']],
    [0.11, 0.26, 0.63]))
E.append(Spacer(1, 4 * mm))
E.append(P('As 6 técnicas que decidem o resultado', st_h2))
E.append(numerada([
    '<b>Espiral contínua:</b> nunca feche a carreira com ponto baixíssimo nem faça corrente de subida. '
    'Você trabalha em caracol, sem costura visível. Por isso o marcador de ponto é obrigatório.',
    '<b>Tensão firme:</b> o enchimento não pode aparecer entre os pontos. Se aparecer, o problema '
    'é a agulha (grande demais), não o fio.',
    '<b>Diminuição invisível:</b> use sempre a versão que pega só a alça da frente. '
    'A diminuição comum deixa um caroço visível no acabamento.',
    '<b>Troca de cor limpa:</b> troque na <u>última laçada</u> do último ponto da cor antiga. '
    'Assim o primeiro ponto já nasce na cor nova, sem meio-ponto bicolor.',
    '<b>Enchimento em porções pequenas:</b> vá acrescentando aos poucos, empurrando com um '
    'palito ou com a ponta do cabo da agulha. Encha até ficar firme mas ainda cedível ao toque.',
    '<b>Arremate invisível:</b> ao terminar uma peça aberta, corte o fio, passe na agulha de '
    'tapeçaria e costure a alça da frente de cada ponto da última carreira; puxe para fechar como '
    'um saquinho.']))
E.append(Spacer(1, 4 * mm))
E.append(caixa('Atenção — segurança',
               'Se o gatinho for para uma <b>criança menor de 3 anos</b>, não use olhos de '
               'segurança nem qualquer peça plástica: borde os olhos com linha preta e '
               'azul. Da mesma forma, não use arame no rabo nesse caso — use só fibra.',
               colors.HexColor('#FDF0E6'), colors.HexColor('#E8C4A0')))
E.append(Spacer(1, 6 * mm))

E.append(P('3.1 Resumo das peças', st_h1))
E.append(P('Use esta tabela para conferir o trabalho e para saber quanto falta. '
           'As seções seguintes trazem cada peça carreira por carreira.'))
E.append(Spacer(1, 2 * mm))
E.append(tabela_simples(
    ['Peça', 'Cor', 'Qtd.', 'Carreiras', 'Tamanho aproximado'],
    [['Cabeça', 'bege/creme', '1', '22', 'esfera de 7,5 cm'],
     ['Máscara facial', 'marrom escuro', '1', '4', 'oval de 4,5 x 3,5 cm'],
     ['Orelhas', 'marrom escuro', '2', '9', 'triângulo de 3 cm'],
     ['Corpo', 'bege/creme', '1', '20', '6 cm de largura x 7 cm de altura'],
     ['Patas dianteiras', 'marrom + bege', '2', '12', 'cilindro de 4 cm'],
     ['Patinhas traseiras', 'marrom escuro', '2', '4', 'disco de 2 cm'],
     ['Rabo', 'marrom escuro', '1', '20', 'tubo de 7 cm']],
    [0.24, 0.20, 0.08, 0.14, 0.34]))
E.append(Spacer(1, 4 * mm))
E.append(caixa('Como contar carreiras no crochê em espiral',
               'Olhe a peça de lado: os pontos baixos formam pequenos "V" empilhados na vertical. '
               'Cada V é uma carreira. Comece a contar a partir do anel mágico, seguindo sempre a '
               'mesma coluna. Se a conta não bater com a receita, confie no <b>total de pontos</b> '
               '(a coluna [n] das tabelas) — é ele que garante o formato, não o número de voltas.'))
E.append(PageBreak())

# ======================= 4. CABECA =======================
E.append(P('4. Peça 1 — Cabeça', st_h1))
E.append(P('<b>Cor:</b> bege/creme &nbsp;·&nbsp; <b>Quantidade:</b> 1 &nbsp;·&nbsp; '
           '<b>Resultado:</b> esfera de aprox. 7,5 cm'))
E.append(P('O anel mágico da carreira 1 será o <b>topo da cabeça</b>. Portanto, '
           'quanto maior o número da carreira, mais perto do queixo — é assim que '
           'todas as referências de posição deste tutorial devem ser lidas.', st_peq))
E.append(Spacer(1, 2 * mm))
E.append(tabela_carreiras([
    ('1', 'Anel mágico com 6 pb. Puxe o fio curto e feche bem o centro.', '[6]'),
    ('2', '6 aum', '[12]'),
    ('3', '(1 pb, aum) x6', '[18]'),
    ('4', '(2 pb, aum) x6', '[24]'),
    ('5', '(3 pb, aum) x6', '[30]'),
    ('6', '(4 pb, aum) x6', '[36]'),
    ('7', '(5 pb, aum) x6', '[42]'),
    ('8 a 16', '42 pb (9 carreiras retas, sem aumento nem diminuição)', '[42]'),
    ('—', '<b>PARE AQUI.</b> Costure a máscara, coloque os olhos e borde o rosto '
     '(seções 5 e 9) antes de continuar.', '—'),
    ('17', '(5 pb, dim) x6', '[36]'),
    ('18', '(4 pb, dim) x6', '[30]'),
    ('19', '(3 pb, dim) x6 — comece a encher com firmeza a partir daqui', '[24]'),
    ('20', '(2 pb, dim) x6', '[18]'),
    ('21', '(1 pb, dim) x6 — complete o enchimento, modelando a esfera', '[12]'),
    ('22', '6 dim', '[6]'),
]))
E.append(Spacer(1, 3 * mm))
E.append(P('Corte o fio deixando cerca de 20 cm, feche o buraco com o arremate invisível e '
           '<b>guarde essa sobra</b>: é com ela que a cabeça será costurada no corpo.'))
E.append(Spacer(1, 3 * mm))
E.append(caixa('Onde as cabeças costumam dar errado',
               'Se a esfera ficar com formato de ovo, foi excesso de carreiras retas ou enchimento '
               'demais na ponta. Se ficar achatada, faltou enchimento nas laterais. Encha modelando '
               'com as mãos enquanto fecha — as carreiras 19 a 21 são a última '
               'chance de corrigir o formato.'))
E.append(Spacer(1, 4 * mm))
E.append(centrado(desenho_cabeca_olhos(PW - 2 * MARGEM, 215)))
E.append(PageBreak())

# ======================= 5. MASCARA =======================
E.append(P('5. Peça 2 — Máscara facial', st_h1))
E.append(P('<b>Cor:</b> marrom escuro &nbsp;·&nbsp; <b>Quantidade:</b> 1 &nbsp;·&nbsp; '
           '<b>Formato:</b> oval de aprox. 4,5 x 3,5 cm'))
E.append(P('Esta é a marca registrada do siamês. Fazer a máscara como peça '
           'separada e aplicar é muito mais confiável do que trocar de cor dentro da '
           'cabeça: o contorno fica limpo e você escolhe a posição exata com alfinetes.'))
E.append(Spacer(1, 2 * mm))
E.append(tabela_carreiras([
    ('base', 'Faça 7 correntes.', '—'),
    ('1', 'A partir da 2ª corrente: 5 pb, 3 pb na última corrente; virando para o outro '
     'lado da corrente: 4 pb, 2 pb na corrente inicial', '[14]'),
    ('2', 'aum, 4 pb, aum x3, 4 pb, aum x2', '[20]'),
    ('3', '1 pb, aum, 5 pb, (1 pb, aum) x3, 3 pb, (1 pb, aum) x2', '[26]'),
    ('4', '26 pb, finalize com 1 pbx', '[26]'),
]), )
E.append(Spacer(1, 3 * mm))
E.append(P('Corte o fio deixando 30 cm para a costura. Não precisa arrematar em círculo '
           'perfeito — uma leve irregularidade some depois de costurada.', st_peq))
E.append(Spacer(1, 4 * mm))
E.append(P('Como aplicar', st_h2))
E.append(numerada([
    'Prenda a máscara na frente da cabeça com 4 alfinetes, centralizada, com o topo do oval '
    'na altura da <b>carreira 9</b> e a base descendo até a <b>carreira 15</b>. Ela deve cobrir '
    'a região dos olhos e o focinho.',
    'Olhe a cabeça de frente, de longe, e confira a simetria contando os pontos que sobram de cada lado.',
    'Costure todo o contorno com <b>ponto invisível</b> (pegue meia alça da máscara e meia '
    'alça da cabeça, alternando), com o próprio fio marrom.',
    'Esconda o fio final passando a agulha por dentro da cabeça e saindo em um ponto distante; '
    'puxe e corte rente.']))
E.append(Spacer(1, 4 * mm))

# ======================= 6. ORELHAS =======================
E.append(P('6. Peça 3 — Orelhas (fazer 2)', st_h1))
E.append(P('<b>Cor:</b> marrom escuro &nbsp;·&nbsp; <b>Quantidade:</b> 2 &nbsp;·&nbsp; '
           '<b>Enchimento:</b> nenhum'))
E.append(Spacer(1, 2 * mm))
E.append(tabela_carreiras([
    ('1', 'Anel mágico com 4 pb', '[4]'),
    ('2', '(1 pb, aum) x2', '[6]'),
    ('3', '6 pb', '[6]'),
    ('4', '(2 pb, aum) x2', '[8]'),
    ('5', '8 pb', '[8]'),
    ('6', '(3 pb, aum) x2', '[10]'),
    ('7', '10 pb', '[10]'),
    ('8', '(4 pb, aum) x2', '[12]'),
    ('9', '12 pb, finalize', '[12]'),
]))
E.append(Spacer(1, 3 * mm))
E.append(P('Achate a orelha com os dedos (ela já tem formato de cone) e feche a boca trabalhando '
           '<b>6 pb pegando as duas camadas juntas</b>. Corte o fio deixando 25 cm para a costura. '
           'Não encha: a orelha do siamês é fina e reta.'))
E.append(Spacer(1, 3 * mm))
E.append(caixa('Simetria das orelhas',
               'Antes de costurar, ponha as duas orelhas lado a lado na mesa. Se uma estiver maior, '
               'refaça — orelhas tortas são o detalhe que mais denuncia um amigurumi '
               'apressado. Na cabeça, posicione a base de cada orelha entre as carreiras 5 e 7 '
               '(contando de cima), com 9 a 10 pontos de distância entre elas.'))
E.append(PageBreak())

# ======================= 7. CORPO =======================
E.append(P('7. Peça 4 — Corpo', st_h1))
E.append(P('<b>Cor:</b> bege/creme &nbsp;·&nbsp; <b>Quantidade:</b> 1 &nbsp;·&nbsp; '
           '<b>Começa pela base</b> (a parte que apoia na mesa)'))
E.append(Spacer(1, 2 * mm))
E.append(tabela_carreiras([
    ('1', 'Anel mágico com 6 pb', '[6]'),
    ('2', '6 aum', '[12]'),
    ('3', '(1 pb, aum) x6', '[18]'),
    ('4', '(2 pb, aum) x6', '[24]'),
    ('5', '(3 pb, aum) x6', '[30]'),
    ('6 a 11', '30 pb (6 carreiras retas)', '[30]'),
    ('12', '(3 pb, dim) x6', '[24]'),
    ('13 e 14', '24 pb', '[24]'),
    ('15', '(2 pb, dim) x6 — comece a encher', '[18]'),
    ('16 e 17', '18 pb', '[18]'),
    ('18', '(1 pb, dim) x6', '[12]'),
    ('19 e 20', '12 pb — esta é a base do pescoço', '[12]'),
]))
E.append(Spacer(1, 3 * mm))
E.append(P('Não feche o corpo. Encha firme (a base precisa ficar bem compacta para o gatinho '
           'ficar em pé) e arremate deixando <b>40 cm de fio</b> para costurar a cabeça. '
           'Deixe os 12 pontos abertos — eles servem de guia para o encaixe.'))
E.append(Spacer(1, 4 * mm))
E.append(caixa('O corpo está firme o bastante?',
               'Aperte a base entre o polegar e o indicador: ela deve ceder pouco e voltar '
               'sozinha ao formato. Um corpo mole não sustenta a cabeça, que é a peça mais '
               'pesada. Se sobrar espaço vazio depois de fechar, dá para acrescentar fibra '
               'por entre os pontos com a ponta de um palito, sem desmanchar nada.'))
E.append(Spacer(1, 5 * mm))

E.append(P('7.1 Quer o gatinho maior ou menor?', st_h1))
E.append(P('A receita é a mesma — o que muda é a combinação de fio e agulha. Mantenha a '
           'proporção usando sempre a mesma dupla em todas as peças.'))
E.append(Spacer(1, 2 * mm))
E.append(tabela_simples(
    ['Fio', 'Agulha', 'Olhos', 'Tamanho final aproximado'],
    [['Linha Cléa 1000 (mais fina)', '2,0 mm', '8 mm', '11 cm — chaveiro / miniatura'],
     ['Fio 4/6 para amigurumi (indicado)', '2,5 mm', '12 mm', '17 cm — tamanho da foto'],
     ['Fio 6/8 ou barbante nº 4', '3,5 mm', '15 mm', '24 cm — versão grande'],
     ['Fio de malha / trapilho', '5,0 mm', '18 mm', '35 cm — almofada decorativa']],
    [0.34, 0.14, 0.12, 0.40]))
E.append(Spacer(1, 2 * mm))
E.append(P('Fios mais grossos consomem bem mais material: a versão de 24 cm pede cerca de '
           '150 g de bege e 90 g de marrom.', st_peq))
E.append(PageBreak())

# ======================= 8. PATAS =======================
E.append(P('8. Peças 5, 6 e 7 — Patas e rabo', st_h1))
E.append(P('Patas dianteiras (fazer 2)', st_h2))
E.append(P('Comece no <b>marrom escuro</b> (a "botinha") e troque para bege na carreira 7.', st_peq))
E.append(tabela_carreiras([
    ('1', '<b>Marrom:</b> anel mágico com 5 pb', '[5]'),
    ('2', '5 aum', '[10]'),
    ('3 a 6', '10 pb (4 carreiras) — na última laçada da carr. 6, troque para o bege', '[10]'),
    ('7 a 12', '<b>Bege:</b> 10 pb (6 carreiras)', '[10]'),
]))
E.append(P('Encha apenas a parte marrom, levemente. Achate a boca e feche com <b>5 pb pegando as '
           'duas camadas</b>. Deixe 25 cm de fio para costurar.', st_peq))
E.append(Spacer(1, 3 * mm))

E.append(P('Patinhas traseiras (fazer 2)', st_h2))
E.append(tabela_carreiras([
    ('1', '<b>Marrom:</b> anel mágico com 6 pb', '[6]'),
    ('2', '6 aum', '[12]'),
    ('3', '12 pb', '[12]'),
    ('4', '(2 pb, dim) x3 — encha bem de leve e feche', '[9]'),
]))
E.append(P('São dois disquinhos que vão na frente da base do corpo, dando a impressão '
           'de que o gato está sentado sobre as patas.', st_peq))
E.append(Spacer(1, 3 * mm))

_rabo = [P('Rabo', st_h2), tabela_carreiras([
    ('1', '<b>Marrom:</b> anel mágico com 5 pb', '[5]'),
    ('2 a 20', '5 pb (19 carreiras) — vai ficar um tubinho fino de aprox. 7 cm', '[5]'),
]),
    P('Se quiser o rabo curvado como na foto de referência, dobre um limpador de cachimbo '
      'ao meio, insira dentro do tubo antes de fechar e só então modele a curva. Sem '
      'arame, coloque um fio de fibra bem fininho e o rabo ficará macio e cadente — as '
      'duas opções funcionam. Arremate e deixe 25 cm de fio.')]
E.append(KeepTogether(_rabo))
E.append(PageBreak())

# ======================= 9. ROSTO =======================
E.append(P('9. O rosto — olhos e bordado', st_h1))
E.append(P('Esta é a etapa que dá personalidade ao gatinho. Faça com calma e com a '
           'cabeça ainda <b>vazia e aberta</b> (parada na carreira 16).'))
E.append(Spacer(1, 3 * mm))
E.append(P('Olhos de segurança', st_h2))
E.append(numerada([
    'Com a máscara já costurada, espete dois alfinetes onde os olhos ficarão: '
    '<b>entre as carreiras 11 e 12</b>, com <b>7 pontos de distância</b> entre eles, '
    'sobre a máscara marrom.',
    'Olhe a cabeça de frente e de cima. Ajuste até ficar simétrico — olhos 1 ponto '
    'fora do lugar mudam completamente a expressão.',
    'Abra levemente o ponto com a agulha, encaixe a haste do olho atravessando máscara e cabeça.',
    'Coloque a trava por dentro e empurre até o fim. <b>A trava não sai mais</b> — '
    'confira duas vezes antes.']))
E.append(Spacer(1, 3 * mm))
E.append(P('Bordados, na ordem', st_h2))
E.append(tabela_simples(
    ['Detalhe', 'Como fazer', 'Linha'],
    [['Contorno azul dos olhos',
      'Com linha azul-clara, contorne cada olho com ponto haste (ou ponto atrás), '
      'seguindo a borda do olho plástico. É esse aro que dá o olhar marcante do siamês.',
      'azul-clara fina'],
     ['Nariz',
      'Um pequeno triângulo cheio, 2 carreiras abaixo e no centro entre os olhos. '
      'Faça 4 a 5 pontos horizontais lado a lado, do maior para o menor.',
      'marrom escura'],
     ['Boca',
      'Uma linha vertical curta descendo do nariz e, a partir dela, dois arcos para os lados '
      '(formato de "w" invertido).',
      'marrom escura'],
     ['Bigodes',
      'Corte 3 fios de 10 cm por lado. Passe cada fio por um ponto da lateral do focinho, '
      'centralize, dê um nó simples rente ao tecido e apare em 3 cm. '
      'Passe as pontas entre os dedos com um pouco de cola branca diluída se quiser que fiquem retas.',
      'marrom escura']],
    [0.20, 0.62, 0.18]))
E.append(Spacer(1, 3 * mm))
E.append(caixa('Truque dos nós invisíveis',
               'Comece e termine todo bordado entrando pela abertura da cabeça (carreira 16). '
               'O nó fica escondido dentro da peça e depois é coberto pelo enchimento. '
               'Assim o rosto não tem nenhum nó visível.'))
E.append(Spacer(1, 3 * mm))
E.append(Spacer(1, 4 * mm))
E.append(centrado(desenho_rosto(PW - 2 * MARGEM, 200)))
E.append(Spacer(1, 4 * mm))
E.append(P('Terminado o rosto, volte à <b>seção 4</b> e complete a cabeça das '
           'carreiras 17 a 22, enchendo e fechando.'))
E.append(PageBreak())

# ======================= 10. MONTAGEM =======================
E.append(P('10. Montagem', st_h1))
E.append(P('Regra de ouro: <b>alfinete tudo primeiro, olhe de longe, só depois costure</b>. '
           'Um amigurumi bem montado é 90% posicionamento e 10% costura.'))
E.append(Spacer(1, 3 * mm))
E.append(centrado(desenho_montagem(PW - 2 * MARGEM, 215)))
E.append(Spacer(1, 3 * mm))
E.append(numerada([
    '<b>Cabeça no corpo:</b> apoie a cabeça sobre os 12 pontos abertos do pescoço. '
    'Com o fio longo do corpo, costure todo o círculo pegando um ponto do corpo e um da cabeça. '
    'Dê <b>duas voltas completas</b> — a segunda é o que impede a cabeça de balançar. '
    'Puxe firme a cada 4 ou 5 pontos.',
    '<b>Orelhas:</b> alfinete as duas entre as carreiras 5 e 7 do topo da cabeça, com 9 a 10 pontos '
    'de distância. Incline levemente as pontas para fora. Costure a base achatada acompanhando '
    'a curvatura da cabeça.',
    '<b>Patas dianteiras:</b> alfinete uma de cada lado, logo abaixo do pescoço (carreiras 18 e 19 '
    'do corpo), penduradas para baixo e para a frente. Costure a boca achatada com 8 a 10 pontos, '
    'em toda a volta.',
    '<b>Patinhas traseiras:</b> costure os dois disquinhos na frente da base do corpo, encostados um '
    'no outro, formando o apoio. Confira se o gatinho fica em pé sozinho antes de arrematar.',
    '<b>Rabo:</b> costure a base do tubo na parte de trás do corpo, por volta da carreira 8. '
    'Costure toda a circunferência para o rabo não girar. Modele a curva.',
    '<b>Conferência final:</b> ponha o gatinho a um metro de distância. Orelhas na mesma '
    'altura? Patas simétricas? Cabeça reta, sem pender para um lado? Corrija agora — '
    'depois de esconder os fios fica mais trabalhoso.']))
E.append(Spacer(1, 4 * mm))
E.append(caixa('Cabeça mole?',
               'Se mesmo com duas voltas a cabeça pender, o problema é falta de enchimento no '
               'pescoço. Acrescente mais fibra bem comprimida no topo do corpo antes de fechar a '
               'costura. Em peças decorativas (não infantis) também dá para atravessar '
               'um pedaço de arame encapado do corpo para dentro da cabeça.'))
E.append(PageBreak())

# ======================= 11. ACABAMENTO + PROBLEMAS =======================
E.append(P('11. Acabamento', st_h1))
E.append(bullets([
    '<b>Esconder fios:</b> passe a agulha por dentro da peça, saia em um ponto distante, '
    'estique o fio e corte rente. Ele se recolhe para dentro sozinho.',
    '<b>Aparar pelinhos:</b> passe uma tesoura pequena rente à superfície para tirar os fiapos.',
    '<b>Vaporizar:</b> um leve vapor de ferro a 10 cm de distância (sem encostar) assenta os pontos '
    'e uniformiza o brilho do algodão.',
    '<b>Lavagem:</b> à mão, em água fria com sabão neutro, apertando sem torcer. '
    'Secar à sombra sobre uma toalha.',
]))
E.append(Spacer(1, 5 * mm))

E.append(P('12. Solução de problemas', st_h1))
E.append(tabela_simples(
    ['Problema', 'Causa mais provável', 'Como resolver'],
    [['Aparece o enchimento entre os pontos', 'Agulha grande demais para o fio',
      'Desca meio número de agulha (2,5 → 2,0 mm). Em peças prontas, forre por dentro '
      'com um pedaço de meia de nylon antes de encher.'],
     ['Buraco no centro do anel mágico', 'O fio curto não foi bem puxado',
      'Puxe o fio residual com força antes de seguir para a carreira 3 e dê um ponto de '
      'segurança por dentro.'],
     ['Perdi a conta das carreiras', 'Marcador não foi movido',
      'Conte as "espinhas de peixe" na vertical a partir do anel. Mova o marcador toda volta — '
      'sem exceção.'],
     ['A cabeça ficou em formato de ovo', 'Carreiras retas demais ou enchimento mal distribuído',
      'Modele com as mãos durante as carreiras 19 a 21; reduza uma ou duas carreiras retas na '
      'próxima vez.'],
     ['Linha diagonal visível na peça', 'Isso é normal no crochê em espiral',
      'Posicione essa linha nas <b>costas</b> do gatinho na hora de montar.'],
     ['O gatinho não fica em pé', 'Base pouco cheia',
      'Comprima mais fibra na base do corpo e confira o posicionamento das patinhas traseiras.'],
     ['Rosto assimétrico', 'Olhos travados sem conferência',
      'Infelizmente a trava não sai. Compense ajustando o bordado do nariz e da boca para o '
      'mesmo lado — o olhar se reequilibra.'],
     ['A peça cresce torta, inclinando para um lado', 'Aumentos empilhados na mesma coluna',
      'Nas carreiras de aumento, alterne a posição: em vez de (3 pb, aum) sempre igual, comece '
      'a carreira seguinte com 1 ou 2 pb antes do primeiro aumento.'],
     ['Dor na mão depois de meia hora', 'Tensão apertada demais e agulha fina',
      'Faça pausas de 5 minutos a cada 20. Se persistir, suba para 3,0 mm e aceite uma peça um '
      'pouco maior — vale mais terminar do que acertar o tamanho.']],
    [0.24, 0.26, 0.50]))
E.append(PageBreak())

itens = ['Todas as 9 peças prontas e conferidas em pares',
         'Olhos simétricos, entre as carreiras 11 e 12, com 7 pontos de distância',
         'Contorno azul bordado em volta dos dois olhos',
         'Nariz, boca e 6 bigodes (3 de cada lado) prontos',
         'Máscara marrom centralizada e costurada em todo o contorno',
         'Orelhas na mesma altura e com a mesma inclinação',
         'Cabeça firme, sem balançar (costura em 2 voltas)',
         'Patas dianteiras simétricas e penduradas para a frente',
         'Gatinho fica em pé sozinho',
         'Rabo costurado em toda a circunferência',
         'Nenhum fio solto ou nó visível',
         'Peça vaporizada e com os fiapos aparados']
def _caixinha():
    dd = Drawing(11, 11)
    dd.add(Rect(0.5, 0.5, 9.5, 9.5, rx=1.5, ry=1.5, fillColor=colors.white,
                strokeColor=MARROM_C, strokeWidth=0.9))
    return dd

linhas_ck = [[_caixinha(), Paragraph(i, st_cel)] for i in itens]
tb = Table(linhas_ck, colWidths=[10 * mm, PW - 2 * MARGEM - 10 * mm])
tb.setStyle(TableStyle([
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('LINEBELOW', (0, 0), (-1, -2), 0.4, LINHA),
    ('TOPPADDING', (0, 0), (-1, -1), 4),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ('LEFTPADDING', (0, 0), (-1, -1), 4),
]))
E.append(P('13. Checklist final', st_h1))
E.append(P('Imprima esta página e vá marcando conforme terminar cada etapa.', st_peq))
E.append(Spacer(1, 3 * mm))
E.append(tb)
E.append(Spacer(1, 7 * mm))
E.append(caixa('Uma última observação',
               'Esta receita foi escrita a partir da análise visual de uma foto de referência '
               '(um gatinho siamês anunciado em marketplace). As proporções e a '
               'distribuição de cores reproduzem o estilo observado, mas os números de '
               'pontos são uma construção própria — ajuste carreiras retas '
               'para mais ou para menos até chegar à proporção que você prefere. '
               'Amigurumi é receita com margem.'))

# ---------------------------------------------------------------- build
import os
saida = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                     'Tutorial-Gatinho-Siames-Amigurumi.pdf')
doc = Doc(saida)
E.insert(1, Spacer(0, 0))
doc.build(E)
print('PDF gerado:', saida)
