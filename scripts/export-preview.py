from pathlib import Path
import re,base64,mimetypes
root=Path(__file__).resolve().parent.parent
html=(root/'index.html').read_text()
css=(root/'studio.css').read_text()
js=(root/'studio.js').read_text()+'\n'+(root/'experience.js').read_text()
html=re.sub(r'<script src="[^"]+" defer></script>','',html)
html=html.replace('<link rel="stylesheet" href="studio.css">','<style>'+css+'</style>')
html=html.replace('</body>','<script>'+js+'</script></body>')
assets=set(re.findall(r'(?:assets/[\w.-]+\.(?:png|jpg)|bee\.jpg)',html))
for asset in sorted(assets,key=len,reverse=True):
 data='data:'+mimetypes.guess_type(asset)[0]+';base64,'+base64.b64encode((root/asset).read_bytes()).decode()
 html=html.replace(asset,data)
out=root.parent/'deliverables'/'BKBK-Studios-Preview.html';out.write_text(html)
print(out, out.stat().st_size)
