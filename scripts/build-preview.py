"""Build offline, self-contained HTML pages without changing application logic."""
from pathlib import Path
import base64
import re
import shutil
import sys
root = Path(__file__).resolve().parents[1]
source = root / 'data'
target = Path(sys.argv[1]) if len(sys.argv) > 1 else root
target.mkdir(parents=True, exist_ok=True)
for name in ['index.html', 'historia.html', 'relatorio.html', 'equipe.html']:
    text = (source / name).read_text()
    text = re.sub(r'<link rel="stylesheet" href="([\w.-]+)"\s*/?>',
                  lambda m: '<style>' + (source / m[1]).read_text() + '</style>', text)
    text = re.sub(r'<script src="([\w.-]+)"(?: defer)?></script>',
                  lambda m: '' if m[1] == 'editorial.js' else '<script>' + (source / m[1]).read_text() + '</script>', text)
    # Deferred scripts must execute after the page's elements exist in standalone files.
    if name != 'index.html':
        text = text.replace('</body>', '<script>' + (source / 'editorial.js').read_text() + '</script></body>')
    icon = base64.b64encode((source / 'favicon.svg').read_bytes()).decode()
    text = text.replace('href="favicon.svg"', 'href="data:image/svg+xml;base64,' + icon + '"')
    (target / name).write_text(text)
for name in ['DABDM-PREVIA.html', 'PREVIA-SEM-HARDWARE.html']:
    shutil.copyfile(target / 'index.html', target / name)
shutil.copytree(source / 'documentos', target / 'documentos', dirs_exist_ok=True)
print('Prévia multipágina criada em', target)
